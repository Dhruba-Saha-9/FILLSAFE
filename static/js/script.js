// DOM Elements
const videoPlayer = document.getElementById('video-player');
const videoContainer = document.getElementById('video-container');
const uploadMessage = document.getElementById('upload-message');
const processingIndicator = document.getElementById('processing-indicator');
const uploadBtn = document.getElementById('upload-btn');
const fileUpload = document.getElementById('file-upload');
const playPauseBtn = document.getElementById('play-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const processingStatus = document.getElementById('processing-status');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const terminal = document.getElementById('terminal');
const fuelValue = document.getElementById('fuel-value');
const capacityProgress = document.getElementById('capacity-progress');
const capacityText = document.getElementById('capacity-text');
const fuelWarning = document.getElementById('fuel-warning');
const activeFueling = document.getElementById('active-fueling');
const alertsList = document.getElementById('alerts-list');
const noAlerts = document.getElementById('no-alerts');
const alertCount = document.getElementById('alert-count');
const toastContainer = document.getElementById('toast-container');
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const periodElement = document.getElementById('period');

// State
let isProcessing = false;
let fuelAmount = 0;
const MAX_FUEL = 30; // Maximum fuel capacity in liters
let activeAlerts = [];
const alertTypes = {
    'fuel_nozzle': {
        title: 'Nozzle Active',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>',
        type: 'info'
    },
    'fire': {
        title: 'Fire Detected',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>',
        type: 'danger'
    },
    'smoke': {
        title: 'Smoke Detected',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>',
        type: 'warning'
    },
    'pose': {
        title: 'Unusual Pose',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        type: 'warning'
    },
    'fueling': {
        title: 'Fueling In Progress',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg>',
        type: 'success'
    }
};

// Initialize digital clock
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    hours = hours % 12;
    hours = hours ? hours : 12; // The hour '0' should be '12'
    const hoursStr = String(hours).padStart(2, '0');
    
    // Check if digits changed to add animation
    if (hoursElement.textContent !== hoursStr) {
        hoursElement.classList.add('animate-bounce');
        setTimeout(() => hoursElement.classList.remove('animate-bounce'), 700);
    }
    
    if (minutesElement.textContent !== minutes) {
        minutesElement.classList.add('animate-bounce');
        setTimeout(() => minutesElement.classList.remove('animate-bounce'), 700);
    }
    
    if (secondsElement.textContent !== seconds) {
        secondsElement.classList.add('animate-bounce');
        setTimeout(() => secondsElement.classList.remove('animate-bounce'), 700);
    }
    
    hoursElement.textContent = hoursStr;
    minutesElement.textContent = minutes;
    secondsElement.textContent = seconds;
    periodElement.textContent = period;
}

// Initialize the clock and update every second
updateClock();
setInterval(updateClock, 1000);

// Initialize system logs
function addLogEntry(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    let icon = '';
    switch (type) {
        case 'warning':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="log-warning"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
            break;
        case 'error':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="log-error"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
            break;
        case 'success':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="log-success"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
            break;
        case 'info':
        default:
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="log-info"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
            break;
    }
    
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    logEntry.innerHTML = `
        <div class="log-icon">${icon}</div>
        <div class="log-content">
            <span class="log-timestamp">[${time}]</span>
            <span class="log-${type}">${message}</span>
        </div>
    `;
    
    terminal.appendChild(logEntry);
    terminal.scrollTop = terminal.scrollHeight;
}

// Add initial logs
addLogEntry('System initialized');
addLogEntry('Waiting for input...', 'info');
addLogEntry('Ready for video processing', 'info');
setTimeout(() => {
    addLogEntry('Upload a video to begin analysis', 'warning');
}, 2000);

// Show toast notification
function showToast(title, message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    switch (type) {
        case 'error':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" style="color: var(--destructive);"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
            break;
        case 'success':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" style="color: var(--success);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
            break;
        case 'warning':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" style="color: var(--warning);"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
            break;
        case 'info':
        default:
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" style="color: var(--primary);"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
            break;
    }
    
    toast.innerHTML = `
        ${icon}
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slide-out 0.3s ease-out forwards';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, duration);
}

// Update fuel display
function updateFuelDisplay() {
    fuelValue.textContent = fuelAmount.toFixed(2);
    
    // Calculate percentage
    const percentage = Math.min((fuelAmount / MAX_FUEL) * 100, 100);
    capacityProgress.style.width = `${percentage}%`;
    capacityText.textContent = `${Math.round(percentage)}%`;
    
    // Show warning if fuel is high
    if (fuelAmount > 25) {
        fuelWarning.style.display = 'flex';
        fuelWarning.className = 'fuel-status warning-status';
    } else {
        fuelWarning.style.display = 'none';
    }
}

// Add alert
function addAlert(type, status = 'active') {
    // Check if alert of this type already exists
    const existingAlert = activeAlerts.find(alert => alert.type === type);
    
    if (existingAlert) {
        // Update existing alert status
        existingAlert.status = status;
        
        // Update DOM
        const alertElement = document.getElementById(`alert-${type}`);
        if (alertElement) {
            const statusBadge = alertElement.querySelector('.alert-status');
            statusBadge.className = `alert-status ${status}`;
            statusBadge.textContent = status === 'active' ? 'Active' : 'Resolved';
            
            if (status === 'active') {
                alertElement.classList.add('active');
                alertElement.classList.remove('resolved');
            } else {
                alertElement.classList.remove('active');
                alertElement.classList.add('resolved');
            }
        }
    } else {
        // Add new alert
        const alert = {
            id: `alert-${type}`,
            type,
            status,
            timestamp: new Date()
        };
        
        activeAlerts.push(alert);
        
        // Create alert element
        const alertInfo = alertTypes[type];
        const alertElement = document.createElement('li');
        alertElement.className = `alert-item ${status}`;
        alertElement.id = alert.id;
        
        const time = alert.timestamp.toLocaleTimeString();
        
        alertElement.innerHTML = `
            <div class="alert-info">
                <div class="alert-icon ${alertInfo.type}">
                    ${alertInfo.icon}
                </div>
                <div class="alert-details">
                    <div class="alert-title">${alertInfo.title}</div>
                    <div class="alert-time">${time}</div>
                </div>
            </div>
            <div class="alert-status ${status}">
                ${status === 'active' ? 'Active' : 'Resolved'}
            </div>
        `;
        
        alertsList.appendChild(alertElement);
    }
    
    // Update alert count and UI
    const activeCount = activeAlerts.filter(a => a.status === 'active').length;
    alertCount.textContent = `${activeCount} ${activeCount === 1 ? 'Alert' : 'Alerts'}`;
    alertCount.className = 'alert-count';
    
    if (activeCount > 0) {
        alertCount.classList.add('warning');
        noAlerts.style.display = 'none';
        alertsList.style.display = 'block';
    } else {
        alertCount.classList.remove('warning');
        if (activeAlerts.length === 0) {
            noAlerts.style.display = 'flex';
            alertsList.style.display = 'none';
        }
    }
}

// Handle file upload to backend
async function uploadVideoToBackend(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Upload failed');
        }
        
        const data = await response.json();
        addLogEntry('Upload successful. Processing started...', 'success');
        return true;
    } catch (error) {
        addLogEntry(`Upload error: ${error.message}`, 'error');
        showToast('Upload Failed', error.message, 'error');
        return false;
    }
}

// Poll processing status from backend
let statusPollInterval;
async function pollProcessingStatus() {
    try {
        const response = await fetch('/status');
        if (!response.ok) {
            throw new Error('Failed to fetch status');
        }
        
        const data = await response.json();
        
        // Update progress
        if (data.progress !== undefined) {
            progressBar.style.width = `${data.progress}%`;
            progressText.textContent = `${Math.round(data.progress)}%`;
        }
        
        // Update fuel amount
        if (data.fuel !== undefined) {
            fuelAmount = data.fuel;
            updateFuelDisplay();
            
            // Show active fueling status
            if (data.alerts && data.alerts.includes('fueling')) {
                activeFueling.style.display = 'flex';
            } else {
                activeFueling.style.display = 'none';
            }
        }
        
        // Update alerts
        if (data.alerts) {
            // Resolve all alerts first
            activeAlerts.forEach(alert => {
                if (!data.alerts.includes(alert.type) && alert.status === 'active') {
                    addAlert(alert.type, 'resolved');
                }
            });
            
            // Set active alerts
            data.alerts.forEach(alertType => {
                addAlert(alertType, 'active');
            });
        }
        
        // Update logs
        if (data.logs && data.logs.length > 0) {
            data.logs.forEach(log => {
                addLogEntry(log, 'info');
            });
        }
        
        // Check if processing is complete
        if (data.status === 'complete') {
            clearInterval(statusPollInterval);
            completeProcessing(data.output_file);
        } else if (data.status === 'error') {
            clearInterval(statusPollInterval);
            showToast('Processing Error', data.message, 'error');
            addLogEntry(`Processing error: ${data.message}`, 'error');
            resetUI();
        }
        
    } catch (error) {
        addLogEntry(`Status polling error: ${error.message}`, 'error');
    }
}

// Handle file upload
uploadBtn.addEventListener('click', () => {
    fileUpload.click();
});

fileUpload.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('video/')) {
            showToast('Invalid File', 'Please upload a valid video file', 'error');
            return;
        }
        
        // Check file size (limit to 50MB)
        if (file.size > 50 * 1024 * 1024) {
            showToast('File Too Large', 'File size should be less than 50MB', 'error');
            return;
        }
        
        // Start processing
        const uploaded = await uploadVideoToBackend(file);
        if (uploaded) {
            startProcessing();
            
            // Start polling for status updates
            statusPollInterval = setInterval(pollProcessingStatus, 1000);
        }
    }
});

// Video player controls
playPauseBtn.addEventListener('click', () => {
    if (videoPlayer.paused) {
        videoPlayer.play();
        playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
    } else {
        videoPlayer.pause();
        playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    }
});

resetBtn.addEventListener('click', () => {
    videoPlayer.currentTime = 0;
    if (videoPlayer.paused) {
        playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    }
});

videoPlayer.addEventListener('ended', () => {
    playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
});

// Start processing a video
function startProcessing() {
    isProcessing = true;
    uploadMessage.style.display = 'none';
    processingIndicator.style.display = 'flex';
    videoPlayer.style.display = 'none';
    processingStatus.style.display = 'block';
    
    addLogEntry('Processing video file...', 'info');
    showToast('Processing Video', 'Analyzing video with AI models...', 'info');
}

// Complete video processing
function completeProcessing(outputFile) {
    isProcessing = false;
    processingIndicator.style.display = 'none';
    processingStatus.style.display = 'none';
    
    // Show the processed video
    videoPlayer.src = `/processed/${outputFile}`;
    videoPlayer.style.display = 'block';
    
    // Enable controls
    playPauseBtn.disabled = false;
    resetBtn.disabled = false;
    
    addLogEntry('Video processing complete', 'success');
    showToast('Processing Complete', 'Video analysis has completed successfully', 'success');
    
    // Auto play the video
    videoPlayer.play();
    playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
}

// Reset UI
function resetUI() {
    isProcessing = false;
    processingIndicator.style.display = 'none';
    processingStatus.style.display = 'none';
    uploadMessage.style.display = 'flex';
    videoPlayer.style.display = 'none';
    playPauseBtn.disabled = true;
    resetBtn.disabled = true;
}

// Initial update of fuel display
updateFuelDisplay();
