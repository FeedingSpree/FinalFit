#model.py
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
from ultralytics import YOLO
import logging
import os
import torch
from datetime import datetime, timedelta
import random
import string
import json
import firebase_admin
from firebase_admin import credentials, firestore
from queue import Queue
from threading import Thread, Lock
import time
import numpy as np
from pathlib import Path
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import shutil

# Initialize Firebase Admin SDK (only if not already initialized)
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(r"C:\Users\Fred\Downloads\c2-project-020325\c2-project-020325\src\model\campusfit-557ab-firebase-adminsdk-fbsvc-1eb3edef87.json")
        firebase_admin.initialize_app(cred)
        print("Firebase initialized successfully")
    except Exception as e:
        print(f"Firebase initialization error: {e}")

# Initialize Firestore
try:
    db = firestore.client()
    print("Firestore client initialized")
except Exception as e:
    print(f"Firestore client error: {e}")
    db = None

# After app initialization
FRAMES_DIR = "frames"
os.makedirs(FRAMES_DIR, exist_ok=True)

# Initialize FastAPI app
app = FastAPI()

# Mount the frames directory
app.mount("/frames", StaticFiles(directory=FRAMES_DIR), name="frames")

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# File paths - Updated with correct paths
model_path = r"C:\Users\Fred\Downloads\c2-project-020325\c2-project-020325\src\model\yolov11m.pt"

# Video paths for different cameras
video_paths = {
    'camera1': r"C:\Users\Fred\Downloads\c2-project-020325\c2-project-020325\src\model\recording_3.mp4",
    'camera2': r"C:\Users\Fred\Downloads\c2-project-020325\c2-project-020325\src\model\sleeveless_1.mp4",
    'camera3': r"C:\Users\Fred\Downloads\c2-project-020325\c2-project-020325\src\model\unifm.mp4",
    'camera4': r"C:\Users\Fred\Downloads\c2-project-020325\c2-project-020325\src\model\male_pe.mp4",
    'camera5': r"C:\Users\Fred\Downloads\c2-project-020325\c2-project-020325\src\model\fpeunif.mp4",
    'camera6': r"C:\Users\Fred\Downloads\c2-project-020325\c2-project-020325\src\model\fregunif.mp4",
}

# Default video path (camera1)
video_path = video_paths['camera1']  # This will be recording_3.mp4

rtsp_url = "rtsp://admin:Test1234@192.168.100.139:554/onvif1"

# Validate file existence
if not os.path.exists(model_path):
    logger.warning(f"Model file not found: {model_path}")
else:
    logger.info(f"Model file found: {model_path}")

# Check video files
for camera_id, path in video_paths.items():
    if os.path.exists(path):
        logger.info(f"{camera_id} video file found: {path}")
    else:
        logger.warning(f"{camera_id} video file not found: {path}")

# Global variables for model and capture
model = None
device = "cpu"
cuda_available = False

try:
    # Check CUDA availability
    cuda_available = torch.cuda.is_available()
    logger.info(f"CUDA available: {cuda_available}")
    if cuda_available:
        logger.info(f"Current CUDA device: {torch.cuda.get_device_name(0)}")
        logger.info(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")

    # Load model
    if os.path.exists(model_path):
        logger.info("Loading YOLO model...")
        model = YOLO(model_path)
        
        # CRITICAL FIX: Set device correctly
        if cuda_available:
            device = 0  # Use GPU 0
            model.to(device)  # Move model to GPU
            logger.info(f"Model moved to GPU: {device}")
        else:
            device = "cpu"
            logger.info("Using CPU for inference")

        # Optimize for GPU
        if cuda_available:
            torch.backends.cudnn.benchmark = True
            torch.backends.cudnn.deterministic = False
            torch.backends.cudnn.enabled = True

        # Configure model for faster inference
        model.conf = 0.5
        model.iou = 0.45
        model.agnostic = False
        model.max_det = 50

        logger.info("Model loaded successfully")
        
        # Add verification
        if model and torch.cuda.is_available():
            logger.info(f"Model is on device: {next(model.model.parameters()).device}")
    else:
        logger.error("Model file not found, running without AI detection")

except Exception as e:
    logger.error(f"Initialization error: {str(e)}")
    model = None

# Constants for detection types
VIOLATIONS = {7: "no_sleeves", 8: "cap", 9: "shorts"}
NON_VIOLATIONS = {0: "reg_unif_m", 1: "reg_unif_f", 2: "pe_unif_m", 3: "pe_unif_f"}
IGNORED_CLASSES = {4: "bag", 5: "jacket", 6: "mask"}

CAMERA_CLASSES = {
    'camera1': {
        'detect': {8: "Cap", 9: "Shorts"},
        'violations': {8: "Cap", 9: "Shorts"},
        'non_violations': {}
    },
    'camera2': {
        'detect': {7: "Sleeveless"},
        'violations': {7: "Sleeveless"},
        'non_violations': {}
    },
    'camera3': {
        'detect': {0: "reg_unif_m"},
        'violations': {},
        'non_violations': {0: "reg_unif_m"}
    },
    'camera4': {
        'detect': {2: "pe_unif_m"},
        'violations': {},
        'non_violations': {2: "pe_unif_m"}
    },
    'camera5': {
        'detect': {3: "pe_unif_f"},
        'violations': {},
        'non_violations': {3: "pe_unif_f"}
    },
    'camera6': {
        'detect': {1: "reg_unif_f"},
        'violations': {},
        'non_violations': {1: "reg_unif_f"}
    }
}

def generate_violation_id():
    date_str = datetime.now().strftime("%m%d%y")
    random_chars = ''.join(random.choices(string.ascii_uppercase, k=4))
    return f"VIO{date_str}{random_chars}"

def generate_detection_id():
    date_str = datetime.now().strftime("%m%d%y")
    random_chars = ''.join(random.choices(string.ascii_uppercase, k=4))
    return f"DET{date_str}{random_chars}"

def get_allowed_violations():
    if not db:
        return {}
        
    allowed = {}
    try:
        docs = db.collection('managements').stream()
        current_date = datetime.now().date()
        
        for doc in docs:
            data = doc.to_dict()
            logger.info(f"Checking management document: {data}")
            
            if data.get('status') == 'Allowed':
                dress_code = data.get('dress_code')
                try:
                    start_date = datetime.strptime(data.get('start_date'), '%m-%d-%Y').date()
                    end_date = datetime.strptime(data.get('end_date'), '%m-%d-%Y').date()
                    
                    # Check if current date is within the allowed period
                    if start_date <= current_date <= end_date:
                        logger.info(f"Found allowed dress code: {dress_code} from {start_date} to {end_date}")
                        
                        # Map dress code names to class IDs
                        class_mapping = {
                            "Cap": 8,
                            "Sleeveless": 7,
                            "Shorts": 9
                        }
                        
                        if dress_code in class_mapping:
                            class_id = class_mapping[dress_code]
                            allowed[class_id] = {
                                'start_date': start_date,
                                'end_date': end_date,
                                'dress_code': dress_code
                            }
                            logger.info(f"Added to allowed list: Class {class_id} ({dress_code})")
                
                except ValueError as e:
                    logger.error(f"Error parsing dates for {dress_code}: {e}")
                    continue
        
        logger.info(f"Final allowed violations: {allowed}")
        return allowed
    except Exception as e:
        logger.error(f"Error getting allowed violations: {e}")
        return {}

def is_violation_allowed(cls, allowed_violations):
    if cls in VIOLATIONS and cls in allowed_violations:
        allowed_period = allowed_violations[cls]
        current_date = datetime.now().date()
        return allowed_period['start_date'] <= current_date <= allowed_period['end_date']
    return False

class FrameBuffer:
    def __init__(self, maxsize=30):
        self.frames = Queue(maxsize=maxsize)
        self.lock = Lock()
        self.last_detection_time = time.time()
        self.detection_cooldown = 5.0  # Increased to 5 seconds between detections
        self.allowed_violations = {}
        self.last_check_time = time.time()
        self.check_interval = 10
        # Add tracking for persistent detections
        self.current_detections = {}  # {cls: {'frame_count': int, 'start_time': float, 'confidence': float}}
        self.frame_threshold = 60  # Require 60 consecutive frames (~2 seconds at 30fps)
        self.min_confidence = 0.7  # Increased confidence threshold

def process_frame(frame, current_time, frame_buffer, device, model, camera_id='camera1'):
    if model is None:
        return frame
        
    try:
        camera_config = CAMERA_CLASSES.get(camera_id, CAMERA_CLASSES['camera1'])
        current_time_float = time.time()
        current_classes = set()
        
        # Update allowed violations periodically
        if time.time() - frame_buffer.last_check_time > frame_buffer.check_interval:
            frame_buffer.allowed_violations = get_allowed_violations()
            frame_buffer.last_check_time = time.time()

        # CRITICAL FIX: Use GPU for inference
        with torch.inference_mode():  # More efficient than torch.no_grad()
            # GPU optimization
            if isinstance(device, int) and torch.cuda.is_available():
                results = model.predict(
                    source=frame,
                    conf=frame_buffer.min_confidence,
                    save=False,
                    device=device,  # Explicitly specify GPU device
                    verbose=False,
                    stream=True,
                    classes=list(camera_config['detect'].keys()),
                    half=True  # Use half precision for faster inference on GPU
                )
            else:
                # CPU inference
                results = model.predict(
                    source=frame,
                    conf=frame_buffer.min_confidence,
                    save=False,
                    device=device,
                    verbose=False,
                    stream=True,
                    classes=list(camera_config['detect'].keys())
                )
            
            result = next(results)
            if result.boxes is not None and len(result.boxes) > 0:
                boxes = result.boxes
                
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    current_classes.add(cls)
                    
                    # Skip if violation is currently allowed
                    if is_violation_allowed(cls, frame_buffer.allowed_violations):
                        continue
                    
                    # Track persistent detections
                    if conf >= frame_buffer.min_confidence:
                        if cls not in frame_buffer.current_detections:
                            frame_buffer.current_detections[cls] = {
                                'frame_count': 1,
                                'start_time': current_time_float,
                                'confidence': conf
                            }
                        else:
                            detection = frame_buffer.current_detections[cls]
                            detection['frame_count'] += 1
                            detection['confidence'] = max(detection['confidence'], conf)
                            
                            if detection['frame_count'] >= frame_buffer.frame_threshold:
                                if cls in VIOLATIONS or cls in NON_VIOLATIONS:
                                    with frame_buffer.lock:
                                        if time.time() - frame_buffer.last_detection_time >= frame_buffer.detection_cooldown:
                                            frame_buffer.last_detection_time = current_time_float
                                            Thread(target=handle_detection, args=(cls, current_time, camera_id, detection['confidence'], frame), daemon=True).start()
                                            
                                            frame_buffer.current_detections[cls] = {
                                                'frame_count': 0,
                                                'start_time': current_time_float,
                                                'confidence': conf
                                            }
                
                # Clean up stale detections
                stale_classes = set(frame_buffer.current_detections.keys()) - current_classes
                for cls in stale_classes:
                    if frame_buffer.current_detections[cls]['frame_count'] < frame_buffer.frame_threshold:
                        del frame_buffer.current_detections[cls]
                    else:
                        frame_buffer.current_detections[cls]['frame_count'] = 0
            
            return result.plot() if result.boxes is not None and len(result.boxes) > 0 else frame
    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        return frame

def handle_detection(cls, current_time, camera_id, confidence, frame):
    if not db:
        logger.warning("Database not available for detection storage")
        return
        
    try:
        is_violation = cls in VIOLATIONS
        detection_type = "violation" if is_violation else "non_violation"
        detection_class = VIOLATIONS.get(cls) if is_violation else NON_VIOLATIONS.get(cls)
        detection_id = generate_violation_id() if is_violation else generate_detection_id()
        
        # Save frame
        try:
            os.makedirs(FRAMES_DIR, exist_ok=True)
            timestamp = datetime.now().strftime("%H%M%S")
            img_filename = f"{detection_id}_{timestamp}.jpg"
            local_path = os.path.join(FRAMES_DIR, img_filename)
            cv2.imwrite(local_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
            url = f"/frames/{img_filename}"
        except Exception as e:
            logger.error(f"Error saving frame: {e}")
            url = ""

        if is_violation:
            detection_data = {
                "camera_number": camera_id,
                "date": current_time.strftime("%Y-%m-%d"),
                "time": current_time.strftime("%H:%M:%S"),
                "violation": detection_class,
                "violation_id": detection_id,
                "url": url,
                "status": "Pending",
                "confidence": round(confidence * 100, 2)
            }
            db.collection('reviewlogs').document(detection_id).set(detection_data)
            app.latest_detection = {"type": "violation", "data": detection_data}
            logger.info(f"Violation detected: {detection_class} (Camera: {camera_id})")
            
        else:
            detection_data = {
                "camera_number": camera_id,
                "date": current_time.strftime("%Y-%m-%d"),
                "time": current_time.strftime("%H:%M:%S"),
                "detection": detection_class,
                "detection_id": detection_id,
                "url": url,
                "status": "Detected",
                "confidence": round(confidence * 100, 2)
            }
            db.collection('nonviolationlogs').document(detection_id).set(detection_data)
            app.latest_detection = {"type": "uniform", "data": detection_data}
            logger.info(f"Uniform detected: {detection_class} (Camera: {camera_id})")
            
    except Exception as e:
        logger.error(f"Error handling detection: {e}")

def generate_frames(video_file_path, camera_id='camera1'):
    """Generate frames from a specific video file with GPU optimization"""
    cap = None
    frame_buffer = FrameBuffer()
    
    try:
        cap = cv2.VideoCapture(video_file_path)
        
        if not cap.isOpened():
            logger.error(f"Could not open video file: {video_file_path}")
            error_frame = create_error_image(f"Video not found: {camera_id}")
            _, buffer = cv2.imencode('.jpg', error_frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            return

        # Optimize video capture settings
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        cap.set(cv2.CAP_PROP_FPS, 30)  # Set target FPS
        
        # Get video properties for optimization
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_delay = 1.0 / fps if fps > 0 else 1.0 / 30.0
        
        logger.info(f"Starting video stream for {camera_id}: {video_file_path} at {fps} FPS")
        
        last_process_time = time.time()
        
        while True:
            try:
                current_time = datetime.now()
                
                # Update allowed violations less frequently
                if time.time() - frame_buffer.last_check_time > frame_buffer.check_interval:
                    Thread(target=lambda: setattr(frame_buffer, 'allowed_violations', get_allowed_violations()), daemon=True).start()
                    frame_buffer.last_check_time = time.time()

                success, frame = cap.read()
                if not success:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue

                # Resize frame efficiently
                frame = cv2.resize(frame, (854, 480), interpolation=cv2.INTER_LINEAR)
                
                # Process frame with GPU optimization
                current_process_time = time.time()
                annotated_frame = process_frame(frame, current_time, frame_buffer, device, model, camera_id)
                process_duration = time.time() - current_process_time
                
                # Log processing time for monitoring (optional)
                if process_duration > 0.1:  # Log if processing takes more than 100ms
                    logger.debug(f"Frame processing took {process_duration:.3f}s on {device}")
                
                # Encode frame with optimized settings
                encode_params = [cv2.IMWRITE_JPEG_QUALITY, 85]
                if torch.cuda.is_available():
                    encode_params.extend([cv2.IMWRITE_JPEG_OPTIMIZE, 1])
                
                _, buffer = cv2.imencode('.jpg', annotated_frame, encode_params)
                frame_bytes = buffer.tobytes()

                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

                # Dynamic frame delay based on processing time
                elapsed = time.time() - last_process_time
                sleep_time = max(0, frame_delay - elapsed)
                if sleep_time > 0:
                    time.sleep(sleep_time)
                last_process_time = time.time()

            except GeneratorExit:
                logger.info(f"Client disconnected from {camera_id}")
                break
            except Exception as e:
                logger.error(f"Error in frame generation for {camera_id}: {str(e)}")
                continue

    except Exception as e:
        logger.error(f"Fatal error in generate_frames for {camera_id}: {str(e)}")
        error_frame = create_error_image(f"Error: {str(e)}")
        _, buffer = cv2.imencode('.jpg', error_frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    finally:
        if cap is not None:
            cap.release()
            logger.info(f"Released video capture for {camera_id}")
            
def create_error_image(message):
    """Create an error image with the given message"""
    img = np.zeros((480, 854, 3), np.uint8)
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, message, (50, 240), font, 0.8, (255, 255, 255), 2, cv2.LINE_AA)
    return img

# API Endpoints
@app.get("/")
async def root():
    return {"message": "Video Streaming API is running"}

@app.get("/live-feed")
async def live_feed():
    return RedirectResponse(url="/api/stream")

@app.get("/api/stream")
async def video_stream():
    """Main video stream endpoint - defaults to camera1 (recording_3.mp4)"""
    try:
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        }
        return StreamingResponse(
            generate_frames(video_paths['camera1'], 'camera1'),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in video_stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stream/camera1")
async def camera1_stream():
    """Stream recording_3.mp4"""
    try:
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        }
        return StreamingResponse(
            generate_frames(video_paths['camera1'], 'camera1'),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in camera1_stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stream/camera2")
async def camera2_stream():
    """Stream no_sleeves.mp4"""
    try:
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        }
        return StreamingResponse(
            generate_frames(video_paths['camera2'], 'camera2'),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in camera2_stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stream/camera3")
async def camera3_stream():
    """Stream unifm.mp4"""
    try:
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        }
        return StreamingResponse(
            generate_frames(video_paths['camera3'], 'camera3'),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in camera3_stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stream/camera4")
async def camera4_stream():
    """Stream male_pe.mp4"""
    try:
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        }
        return StreamingResponse(
            generate_frames(video_paths['camera4'], 'camera4'),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in camera4_stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stream/camera5")
async def camera5_stream():
    """Stream fpeunif.mp4"""
    try:
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        }
        return StreamingResponse(
            generate_frames(video_paths['camera5'], 'camera5'),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in camera5_stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stream/camera6")
async def camera6_stream():
    """Stream fregunif.mp4"""
    try:
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        }
        return StreamingResponse(
            generate_frames(video_paths['camera6'], 'camera6'),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in camera6_stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def status():
    return JSONResponse({
        "status": "running",
        "model_loaded": model is not None,
        "using_cuda": cuda_available,
        "gpu_name": torch.cuda.get_device_name(0) if cuda_available else "None",
        "video_paths": {k: os.path.exists(v) for k, v in video_paths.items()},
        "model_path": model_path,
        "firebase_connected": db is not None
    })

@app.get("/api/detection")
async def get_latest_detection():
    if hasattr(app, 'latest_detection'):
        return app.latest_detection
    return {"status": "no detection"}

@app.get("/frames/{filename}")
async def get_frame(filename: str):
    file_path = os.path.join(FRAMES_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    raise HTTPException(status_code=404, detail="Image not found")

@app.post("/upload-frame/")
async def upload_frame(file: UploadFile):
    try:
        filename = f"capture_{int(time.time())}_{file.filename}"
        file_path = os.path.join(FRAMES_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        return {"url": f"/frames/{filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/frames/{filename}")
async def delete_frame(filename: str):
    try:
        file_path = os.path.join(FRAMES_DIR, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return {"message": "File deleted successfully"}
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/gpu-status")
async def gpu_status():
    """Get detailed GPU status and utilization"""
    if not torch.cuda.is_available():
        return {"gpu_available": False, "message": "CUDA not available"}
    
    try:
        gpu_info = {
            "gpu_available": True,
            "gpu_count": torch.cuda.device_count(),
            "current_device": torch.cuda.current_device(),
            "device_name": torch.cuda.get_device_name(0),
            "memory_allocated": torch.cuda.memory_allocated(0) / 1024**3,  # GB
            "memory_cached": torch.cuda.memory_reserved(0) / 1024**3,  # GB
            "memory_total": torch.cuda.get_device_properties(0).total_memory / 1024**3,  # GB
            "model_device": str(next(model.model.parameters()).device) if model else "N/A"
        }
        return gpu_info
    except Exception as e:
        return {"gpu_available": True, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")