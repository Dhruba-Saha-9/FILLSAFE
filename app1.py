from flask import Flask, render_template, request, jsonify, send_from_directory
import cv2
import torch
import numpy as np
from ultralytics import YOLO
import os
import time
import threading
import logging
import magic

# Initialize Flask app
app = Flask(__name__)
app.config['TEMP_FOLDER'] = os.path.join(os.getcwd(), 'temp_uploads')
app.config['PROCESSED_FOLDER'] = os.path.join(os.getcwd(), 'processed_videos')
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024 * 1024  # 1GB

# Allowed extensions
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}

# Logging config
logging.basicConfig(filename='app.log', level=logging.DEBUG)

# Processing state
processing_state = {
    'status': 'idle',
    'message': '',
    'alerts': [],
    'fuel': 0.0,
    'progress': 0,
    'logs': [],
    'output_file': None
}

# Load models once
models = {
    'nozzle': YOLO("C:/Users/soham/OneDrive/Desktop/Hackathon/Acehackathon-main/Acehackathon-main/Fuel_nozzle/weights/best.pt"),
    'car': YOLO("C:/Users/soham/OneDrive/Desktop/Hackathon/Acehackathon-main/Acehackathon-main/car.pt"),
    'pose': YOLO("C:/Users/soham/OneDrive/Desktop/Hackathon/Acehackathon-main/Acehackathon-main/yolov8s-pose.pt"),
    'fire_smoke': YOLO("C:/Users/soham/OneDrive/Desktop/Hackathon/Acehackathon-main/Acehackathon-main/fire.pt"),
    'plate': YOLO("C:/Users/soham/OneDrive/Desktop/Hackathon/Acehackathon-main/Acehackathon-main/numberplate.pt")
}

# Helpers
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def is_video(file):
    mime = magic.from_buffer(file.read(2048), mime=True)
    file.seek(0)
    return mime.startswith('video/')

# FuelStation Processor
class FuelStationSafetyMonitor:
    def __init__(self, video_path):
        self.models = models
        self.alert_status = {
            'fuel_nozzle': False,
            'fire': False,
            'smoke': False,
            'pose': False,
            'fueling': False
        }
        self.video_path = video_path
        self.total_fuel_injected = 0.0
        self.FUEL_FLOW_RATE_LPS = 0.095
        self.total_frames = 0
        self.processed_frames = 0

    def process_frame(self, frame, frame_time):
        results = {name: model(frame) for name, model in self.models.items()}
        processed_frame = frame.copy()
        for name in ['nozzle', 'car', 'pose', 'fire_smoke', 'plate']:
            processed_frame = results[name][0].plot(img=processed_frame)

        nozzle_boxes = [box.xyxy.cpu().numpy() for box in results['nozzle'][0].boxes]
        car_boxes = [box.xyxy.cpu().numpy() for box in results['car'][0].boxes]

        self.alert_status['fueling'] = False
        for nozzle_box in nozzle_boxes:
            for car_box in car_boxes:
                if self.boxes_touch(nozzle_box[0], car_box[0]):
                    self.alert_status['fueling'] = True
                    self.total_fuel_injected += self.FUEL_FLOW_RATE_LPS * frame_time

        self.alert_status['fuel_nozzle'] = len(nozzle_boxes) > 0
        self.alert_status['fire'] = any(box.cls.cpu().numpy() == 0 for box in results['fire_smoke'][0].boxes)
        self.alert_status['smoke'] = any(box.cls.cpu().numpy() == 1 for box in results['fire_smoke'][0].boxes)
        self.alert_status['pose'] = results['pose'][0].keypoints.xy.any() if results['pose'] else False

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

        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))
        if not out.isOpened():
            raise ValueError("Could not create video writer")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            processed_frame = self.process_frame(frame, 1 / fps)
            out.write(processed_frame)

            processing_state.update({
                'fuel': self.total_fuel_injected,
                'alerts': [k for k, v in self.alert_status.items() if v],
                'progress': (self.processed_frames / self.total_frames) * 100,
                'logs': [f"Processed {self.processed_frames}/{self.total_frames} frames"]
            })

        cap.release()
        out.release()

def process_video(filepath):
    try:
        original_filename = os.path.basename(filepath)
        output_filename = f"processed_{original_filename}"
        output_path = os.path.join(app.config['PROCESSED_FOLDER'], output_filename)

        os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)

        processing_state.update({
            'status': 'processing',
            'message': '',
            'alerts': [],
            'fuel': 0.0,
            'progress': 0,
            'logs': [],
            'output_file': None
        })

        monitor = FuelStationSafetyMonitor(filepath)
        monitor.save_processed_video(output_path)

        processing_state.update({
            'status': 'complete',
            'message': 'Video processing completed',
            'output_file': output_filename,
            'fuel': monitor.total_fuel_injected,
            'progress': 100
        })

    except Exception as e:
        logging.error(f"Error during video processing: {str(e)}", exc_info=True)
        processing_state.update({'status': 'error', 'message': str(e)})

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/')
def index():
    return render_template("index.html")


@app.route('/upload', methods=['POST'])
def handle_upload():
    if 'file' not in request.files:
        return jsonify({'error': "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': "No selected file"}), 400
    if not allowed_file(file.filename) or not is_video(file):
        return jsonify({'error': "Unsupported file format"}), 400

    filename = f"{int(time.time())}_{file.filename}"
    filepath = os.path.join(app.config['TEMP_FOLDER'], filename)

    os.makedirs(app.config['TEMP_FOLDER'], exist_ok=True)
    file.save(filepath)

    print("Thread starting for:", filepath)
    thread = threading.Thread(target=process_video, args=(filepath,))
    thread.start()

    return jsonify({'message': "Processing started"}), 200

@app.route('/status')
def get_status():
    return jsonify(processing_state)

@app.route('/processed/<path:filename>')
def serve_processed(filename):
    return send_from_directory(app.config['PROCESSED_FOLDER'], filename)

@app.route('/login')
def login():
    return render_template('login.html')

if __name__ == '__main__':
    os.makedirs(app.config['TEMP_FOLDER'], exist_ok=True)
    os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)
    app.run(debug=True, threaded=True)
