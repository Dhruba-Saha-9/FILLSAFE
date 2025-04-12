from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import torch
import numpy as np
from ultralytics import YOLO
import os
import time
import threading
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get absolute paths
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
TEMP_DIR = os.path.join(BASE_DIR, 'temp')
PROCESSED_DIR = os.path.join(BASE_DIR, 'processed')

# Create directories if they don't exist
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

app = Flask(__name__, static_folder='..', static_url_path='')
CORS(app)
app.config['TEMP_FOLDER'] = TEMP_DIR
app.config['PROCESSED_FOLDER'] = PROCESSED_DIR
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024

processing_state = {
    'status': 'idle',
    'message': '',
    'alerts': [],
    'fuel': 0.0,
    'progress': 0,
    'logs': [],
    'output_file': None
}

class FuelStationSafetyMonitor:
    def __init__(self, video_path):
        try:
            model_paths = {
                'nozzle': os.path.join(BASE_DIR, "fuel.pt"),
                'car': os.path.join(BASE_DIR, "car.pt"),
                'pose': os.path.join(BASE_DIR, "yolov8s-pose.pt"),
                'fire_smoke': os.path.join(BASE_DIR, "fire.pt"),
                'plate': os.path.join(BASE_DIR, "numberplate.pt")
            }
            for name, path in model_paths.items():
                if not os.path.exists(path):
                    raise FileNotFoundError(f"Model file not found: {path}")
            self.models = {name: YOLO(path) for name, path in model_paths.items()}
            logger.info("All models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
            raise

        self.alert_status = {
            'fuel_nozzle': False,
            'fire': False,
            'smoke': False,
            'pose': False,
            'fueling': False,
            'queue_detected': False
        }
        self.video_path = video_path
        self.total_fuel_injected = 0.0
        self.FUEL_FLOW_RATE_LPS = 0.095
        self.total_frames = 0
        self.processed_frames = 0

    def process_frame(self, frame, frame_time):
        COLORS = {
            'nozzle': (0, 255, 0),
            'car': (0, 0, 255),
            'fire': (0, 0, 255),
            'smoke': (128, 128, 128),
            'plate': (0, 255, 255),
            'pose': (255, 0, 255)
        }

        results = {}
        for name, model in self.models.items():
            try:
                results[name] = model(frame)
            except Exception as e:
                logger.error(f"Error in {name} model: {str(e)}")
                continue

        processed_frame = frame.copy()

        for name in ['nozzle', 'car', 'fire_smoke', 'plate']:
            if name in results and len(results[name]) > 0:
                result = results[name][0]
                for box, cls, conf in zip(result.boxes.xyxy.cpu().numpy(),
                                           result.boxes.cls.cpu().numpy(),
                                           result.boxes.conf.cpu().numpy()):
                    x1, y1, x2, y2 = map(int, box)
                    color = COLORS['fire'] if name == 'fire_smoke' and cls == 0 else COLORS.get(name, (255, 255, 255))
                    color = COLORS['smoke'] if name == 'fire_smoke' and cls == 1 else color
                    label = f"{result.names[int(cls)]} {conf:.2f}"
                    cv2.rectangle(processed_frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(processed_frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        if 'pose' in results and len(results['pose']) > 0:
            keypoints = results['pose'][0].keypoints.xy.cpu().numpy()
            for person in keypoints:
                for kpt in person:
                    x, y = map(int, kpt)
                    cv2.circle(processed_frame, (x, y), 3, COLORS['pose'], -1)

        nozzle_boxes = [box.xyxy.cpu().numpy() for box in results.get('nozzle', [])[0].boxes] if 'nozzle' in results and len(results['nozzle']) > 0 else []
        car_boxes = [box.xyxy.cpu().numpy() for box in results.get('car', [])[0].boxes] if 'car' in results and len(results['car']) > 0 else []

        self.alert_status['fueling'] = False
        for nozzle_box in nozzle_boxes:
            for car_box in car_boxes:
                if self.boxes_touch(nozzle_box[0], car_box[0]):
                    self.alert_status['fueling'] = True
                    self.total_fuel_injected += self.FUEL_FLOW_RATE_LPS * frame_time

        self.alert_status['fuel_nozzle'] = len(nozzle_boxes) > 0
        self.alert_status['fire'] = any(box.cls.cpu().numpy() == 0 for box in results.get('fire_smoke', [])[0].boxes) if 'fire_smoke' in results and len(results['fire_smoke']) > 0 else False
        self.alert_status['smoke'] = any(box.cls.cpu().numpy() == 1 for box in results.get('fire_smoke', [])[0].boxes) if 'fire_smoke' in results and len(results['fire_smoke']) > 0 else False
        self.alert_status['pose'] = results.get('pose', [])[0].keypoints.xy.any() if 'pose' in results and len(results['pose']) > 0 else False

        queue_detected = False
        if len(car_boxes) >= 2:
            car_centers = []
            for box in car_boxes:
                x1, y1, x2, y2 = box[0]
                center_x = (x1 + x2) / 2
                center_y = (y1 + y2) / 2
                car_centers.append((center_x, center_y))

            car_centers.sort(key=lambda c: c[1])
            queue_detected = True
            for i in range(len(car_centers) - 1):
                dist = np.linalg.norm(np.array(car_centers[i]) - np.array(car_centers[i + 1]))
                if dist > 150:
                    queue_detected = False
                    break

        self.alert_status['queue_detected'] = queue_detected

        if queue_detected:
            cv2.putText(processed_frame, "QUEUE DETECTED", (30, 80),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)

        self.processed_frames += 1
        return processed_frame

    def boxes_touch(self, box1, box2):
        x1_min, y1_min, x1_max, y1_max = box1
        x2_min, y2_min, x2_max, y2_max = box2
        return not (x1_max < x2_min or x2_max < x1_min or y1_max < y2_min or y2_max < y1_min)

    def save_processed_video(self, output_path):
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file")

        frame_width = int(cap.get(3))
        frame_height = int(cap.get(4))
        fps = cap.get(cv2.CAP_PROP_FPS)
        self.total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        fourcc = cv2.VideoWriter_fourcc(*'avc1')
        out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))
        if not out.isOpened():
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))
            if not out.isOpened():
                raise ValueError("Could not create video writer")

        frame_count = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            try:
                processed_frame = self.process_frame(frame, 1/fps)
                out.write(processed_frame)
                frame_count += 1

                progress = (frame_count / self.total_frames) * 100
                processing_state.update({
                    'fuel': self.total_fuel_injected,
                    'alerts': [k for k, v in self.alert_status.items() if v],
                    'progress': progress,
                    'logs': [f"Processed {frame_count}/{self.total_frames} frames"]
                })

                if frame_count % 10 == 0:
                    logger.info(f"Processed {frame_count}/{self.total_frames} frames")
            except Exception as e:
                logger.error(f"Error processing frame {frame_count}: {str(e)}")
                continue

        cap.release()
        out.release()
        logger.info("Video processing completed successfully")
        if not os.path.exists(output_path):
            raise ValueError("Output file was not created")

def process_video(filepath):
    try:
        original_filename = os.path.basename(filepath)
        output_filename = f"processed_{original_filename}"
        output_path = os.path.join(PROCESSED_DIR, output_filename)

        processing_state.update({
            'status': 'processing',
            'message': 'Initializing video processing...',
            'alerts': [],
            'fuel': 0.0,
            'progress': 0,
            'logs': ['Starting video processing...'],
            'output_file': None
        })

        monitor = FuelStationSafetyMonitor(filepath)
        monitor.save_processed_video(output_path)

        processing_state.update({
            'status': 'complete',
            'message': 'Video processing completed successfully',
            'output_file': output_filename,
            'fuel': monitor.total_fuel_injected,
            'progress': 100,
            'logs': ['Video processing completed successfully']
        })

    except Exception as e:
        error_message = str(e)
        logger.error(f"Error in process_video: {error_message}")
        processing_state.update({
            'status': 'error',
            'message': error_message,
            'logs': [f'Error: {error_message}']
        })
        if os.path.exists(output_path):
            os.remove(output_path)
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/upload', methods=['POST'])
def handle_upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not file.filename.lower().endswith(('.mp4', '.avi', '.mov')):
        return jsonify({'error': 'Invalid file type'}), 400
    try:
        filepath = os.path.join(TEMP_DIR, file.filename)
        logger.info(f"Saving uploaded file to: {filepath}")
        file.save(filepath)
        thread = threading.Thread(target=process_video, args=(filepath,))
        thread.start()
        return jsonify({'message': 'Upload successful'})
    except Exception as e:
        logger.error(f"Error in handle_upload: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/status')
def get_status():
    return jsonify(processing_state)

@app.route('/processed/<path:filename>')
def serve_processed(filename):
    return send_from_directory(PROCESSED_DIR, filename)

@app.route('/processed_video')
def processed_video():
    return send_from_directory(PROCESSED_DIR, processing_state['output_file'])

@app.route('/login')
def login():
    return render_template('login.html')

if __name__ == '__main__':
    logger.info(f"Base directory: {BASE_DIR}")
    logger.info(f"Temp directory: {TEMP_DIR}")
    logger.info(f"Processed directory: {PROCESSED_DIR}")
    app.run(debug=True, port=5000)
