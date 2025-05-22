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
from boxmot import BotSort
from pathlib import Path
import torchvision
from firebase_admin import storage
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import shutil
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import shutil

if not firebase_admin._apps:
    cred = credentials.Certificate(r"C:\Users\Jose Mari\Documents\C2\Firebase Private Key\campusfit-8468c-firebase-adminsdk-fbsvc-f90c6530de.json")
    firebase_admin.initialize_app(cred)

# Initialize Firestore
db = firestore.client()

# After app initialization
FRAMES_DIR = "frames"
os.makedirs(FRAMES_DIR, exist_ok=True)

# File paths
model_path = r"C:\Users\Jose Mari\Documents\GitHub\c2-project-020325\src\model\yolov11m.pt"
video_path = r"C:\Users\Jose Mari\Documents\GitHub\c2-project-020325\src\model\sleeveless_1.mp4"
rtsp_url = "rtsp://admin:Test1234@192.168.7.73:554/onvif1"  # RTSP URL for camera

# Validate file existence
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model file not found: {model_path}")
if not os.path.exists(video_path):
    raise FileNotFoundError(f"Video file not found: {video_path}")

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

try:
    # Check CUDA availability
    cuda_available = torch.cuda.is_available()
    logger.info(f"CUDA available: {cuda_available}")
    if cuda_available:
        logger.info(f"Current CUDA device: {torch.cuda.get_device_name(0)}")

    # Load model to CUDA
    logger.info("Loading YOLO model on GPU...")
    model = YOLO(model_path)
    device = 0 if cuda_available else "cpu"

    if cuda_available:
        torch.backends.cudnn.benchmark = True
        torch.backends.cudnn.deterministic = False

    # Initialize video capture for local file
    logger.info("Opening video capture for local file...")
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise Exception("Could not open video file")

    # Optimize video settings for web streaming
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 854)  # 16:9 aspect ratio
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)

    # Configure model for faster inference
    model.conf = 0.10
    model.iou = 0.45
    model.agnostic = True
    model.max_det = 1000

    logger.info("Video capture initialized successfully")

    # Initialize RTSP video capture
    logger.info("Testing RTSP connection...")
    rtsp_cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
    
    # Check if RTSP connection is successful
    if rtsp_cap.isOpened():
        logger.info("RTSP connection successful")
        # Configure RTSP settings
        rtsp_cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
        rtsp_cap.release()  # Release it for now, will be reopened when needed
    else:
        logger.warning(f"Could not open RTSP stream at {rtsp_url}. RTSP endpoint may not be functional.")

except Exception as e:
    logger.error(f"Initialization error: {str(e)}")
    raise

# Constants for detection types
VIOLATIONS = {7: "no_sleeves", 8: "cap", 9: "shorts"}
NON_VIOLATIONS = {0: "reg_unif_m", 1: "reg_unif_f", 2: "pe_unif_m", 3: "pe_unif_f"}
IGNORED_CLASSES = {4: "bag", 5: "jacket", 6: "mask"}

CAMERA_CLASSES = {
    'camera1': {
        'detect': {8: "Cap", 9: "Shorts"},  # Only detect Cap and Shorts
        'violations': {8: "Cap", 9: "Shorts"},
        'non_violations': {}
    },
    'camera2': {
        'detect': {7: "Sleeveless"},  # Only detect Sleeveless
        'violations': {7: "Sleeveless"},
        'non_violations': {}
    },
    'camera3': {
        'detect': {0: "reg_unif_m"},  # Only detect regular male uniform
        'violations': {},
        'non_violations': {0: "reg_unif_m"}
    },
    'camera4': {
        'detect': {2: "pe_unif_m"},  # Only detect PE male uniform
        'violations': {},
        'non_violations': {2: "pe_unif_m"}
    },
    'camera5': {
        # Easily modifiable configuration for RTSP camera
        'detect': {
            7: "Sleeveless",
            8: "Cap",
            9: "Shorts",
            0: "reg_unif_m",
            1: "reg_unif_f",
            2: "pe_unif_m",
            3: "pe_unif_f"
        },
        'violations': {7: "Sleeveless", 8: "Cap", 9: "Shorts"},
        'non_violations': {0: "reg_unif_m", 1: "reg_unif_f", 2: "pe_unif_m", 3: "pe_unif_f"}
    }
}

def generate_violation_id():
    date_str = datetime.now().strftime("%m%d%y")
    random_chars = ''.join(random.choices(string.ascii_uppercase, k=4))
    return f"VIO{date_str}{random_chars}"

# Add function to generate detection ID
def generate_detection_id():
    date_str = datetime.now().strftime("%m%d%y")
    random_chars = ''.join(random.choices(string.ascii_uppercase, k=4))
    return f"DET{date_str}{random_chars}"

# Update the get_allowed_violations function to properly check dates
def get_allowed_violations():
    allowed = {}
    try:
        docs = db.collection('managements').stream()
        current_date = datetime.now().date()
        
        for doc in docs:
            data = doc.to_dict()
            logger.info(f"Checking management document: {data}")
            
            if data.get('status') == 'Allowed':
                dress_code = data.get('dress_code', '')
                try:
                    start_date = datetime.strptime(data.get('start_date', ''), '%m-%d-%Y').date()
                    end_date = datetime.strptime(data.get('end_date', ''), '%m-%d-%Y').date()
                    
                    # Check if current date is within the allowed period
                    if start_date <= current_date <= end_date:
                        logger.info(f"Found active allowed dress code: {dress_code} ({start_date} to {end_date})")
                        
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
        
        logger.info(f"Current allowed violations: {allowed}")
        return allowed
        
    except Exception as e:
        logger.error(f"Error getting allowed violations: {e}")
        return {}

# Add helper function to check allowed violations
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
        self.detection_cooldown = 1.0
        self.allowed_violations = {}
        self.last_check_time = time.time()
        self.check_interval = 10
        # Update detection tracking to include frame counting and best frame
        self.current_detections = {}  # {cls: {
                                    #   'frame_count': int,
                                    #   'start_time': float,
                                    #   'confidence': float,
                                    #   'best_frame': ndarray,
                                    #   'best_confidence': float
                                    # }}
        self.frame_threshold = 100  # Number of consecutive frames needed
        self.min_confidence = 0.10  # Minimum confidence threshold

def process_frame(frame, current_time, frame_buffer, device, model, camera_id='camera1'):
    try:
        camera_config = CAMERA_CLASSES.get(camera_id, CAMERA_CLASSES['camera1'])
        violations = camera_config['violations']
        non_violations = camera_config['non_violations']
        current_time_float = time.time()
        current_classes = set()

        # Check if we need to update allowed violations
        if time.time() - frame_buffer.last_check_time > frame_buffer.check_interval:
            frame_buffer.allowed_violations = get_allowed_violations()
            frame_buffer.last_check_time = time.time()

        # Create detection classes list excluding allowed violations
        allowed_classes = {}
        for cls, name in camera_config['detect'].items():
            # Only include the class if it's not in allowed violations
            if cls not in frame_buffer.allowed_violations:
                allowed_classes[cls] = name
                
        logger.debug(f"Detecting classes for camera {camera_id}: {allowed_classes}")

        with torch.inference_mode():
            results = model.predict(
                source=frame,
                conf=frame_buffer.min_confidence,
                save=False,
                device=device,
                verbose=False,
                stream=True,
                classes=list(allowed_classes.keys())  # Only detect non-allowed classes
            )
            
            result = next(results)
            if result.boxes:
                boxes = result.boxes
                
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    current_classes.add(cls)
                    
                    if conf >= frame_buffer.min_confidence:
                        if cls not in frame_buffer.current_detections:
                            # Initialize new detection
                            frame_buffer.current_detections[cls] = {
                                'frame_count': 1,
                                'start_time': current_time_float,
                                'confidence': conf,
                                'best_frame': frame.copy(),
                                'best_confidence': conf
                            }
                        else:
                            # Update existing detection
                            detection = frame_buffer.current_detections[cls]
                            detection['frame_count'] += 1
                            
                            if conf > detection['best_confidence']:
                                detection['best_confidence'] = conf
                                detection['best_frame'] = frame.copy()
                            
                            # Process detection if threshold is reached
                            if detection['frame_count'] >= frame_buffer.frame_threshold:
                                is_violation = cls in violations
                                is_non_violation = cls in non_violations
                                
                                if is_violation or is_non_violation:
                                    with frame_buffer.lock:
                                        if time.time() - frame_buffer.last_detection_time >= frame_buffer.detection_cooldown:
                                            frame_buffer.last_detection_time = current_time_float
                                            Thread(target=handle_detection, args=(
                                                cls, 
                                                current_time, 
                                                camera_id,
                                                detection['best_confidence'],
                                                detection['best_frame']
                                            )).start()
                                            # Reset detection after processing
                                            frame_buffer.current_detections[cls] = {
                                                'frame_count': 0,
                                                'start_time': current_time_float,
                                                'confidence': conf,
                                                'best_frame': frame.copy(),
                                                'best_confidence': conf
                                            }

        # Remove stale detections or reset frame count for missed detections
        stale_classes = set(frame_buffer.current_detections.keys()) - current_classes
        for cls in stale_classes:
            # Reset frame count if detection is missed
            if frame_buffer.current_detections[cls]['frame_count'] < frame_buffer.frame_threshold:
                del frame_buffer.current_detections[cls]
            else:
                frame_buffer.current_detections[cls]['frame_count'] = 0
        
        # Update the annotated frame
        if result.boxes.shape[0] > 0:
            result.boxes = result.boxes[torch.ones(len(boxes), dtype=torch.bool, device=device)]
        else:
            result.boxes.data = torch.empty((0, 6), device=device)
    
        return result.plot(conf=False, labels=True, line_width=2)
    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        return frame

# Update handle_detection function to handle both violations and non-violations
def handle_detection(cls, current_time, camera_id, confidence, frame):
    try:
        if cls in VIOLATIONS or cls in NON_VIOLATIONS:
            # Determine if it's a violation or non-violation
            is_violation = cls in VIOLATIONS
            detection_type = "violation" if is_violation else "non_violation"
            detection_class = VIOLATIONS.get(cls) if is_violation else NON_VIOLATIONS.get(cls)
            detection_id = generate_violation_id() if is_violation else generate_detection_id()
            
            try:
                # Ensure frames directory exists
                os.makedirs(FRAMES_DIR, exist_ok=True)
                
                # Save frame locally with timestamp
                timestamp = datetime.now().strftime("%H%M%S")
                img_filename = f"{detection_id}_{timestamp}.jpg"
                local_path = os.path.join(FRAMES_DIR, img_filename)
                
                # Save the image with lower quality
                cv2.imwrite(local_path, frame, [cv2.IMWRITE_JPEG_QUALITY, 60])
                
                # Get local URL for the frame
                url = f"/frames/{img_filename}"
                
                # Create detection data based on type
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
                
                # Update latest detection
                app.latest_detection = {
                    "type": detection_type,
                    "data": detection_data
                }
                
                # Log the detection
                logger.info(
                    f"{detection_type.title()} detected: {detection_class} "
                    f"(Confidence: {round(confidence * 100, 2)}%, Camera: {camera_id}, Image: {url})"
                )
                
            except Exception as storage_error:
                logger.error(f"Storage error: {storage_error}")
                
    except Exception as e:
        logger.error(f"Error handling detection: {e}")

# Modified generate_frames for the local video file
def generate_frames(video_path, camera_id='camera1'):
    cap = cv2.VideoCapture(video_path)
    frame_buffer = FrameBuffer()
    
    while True:
        try:
            current_time = datetime.now()
            
            if time.time() - frame_buffer.last_check_time > frame_buffer.check_interval:
                Thread(target=lambda: setattr(frame_buffer, 'allowed_violations', get_allowed_violations())).start()
                frame_buffer.last_check_time = time.time()

            success, frame = cap.read()
            if not success:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            frame = cv2.resize(frame, (854, 480))
            annotated_frame = process_frame(frame, current_time, frame_buffer, device, model, camera_id)
            
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        except Exception as e:
            logger.error(f"Error in frame generation: {str(e)}")
            continue

# New function to generate frames from RTSP stream
def generate_rtsp_frames():
    frame_buffer = FrameBuffer()
    rtsp_cap = None
    
    try:
        # Initialize RTSP capture
        rtsp_cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
        
        # Configure RTSP settings for better performance
        rtsp_cap.set(cv2.CAP_PROP_BUFFERSIZE, 3)
        
        if not rtsp_cap.isOpened():
            logger.error(f"Could not open RTSP stream at {rtsp_url}")
            raise Exception("Could not open RTSP stream")
        
        logger.info("RTSP stream opened successfully")
        
        while True:
            try:
                current_time = datetime.now()
                
                # Update allowed violations in separate thread
                if time.time() - frame_buffer.last_check_time > frame_buffer.check_interval:
                    Thread(target=lambda: setattr(frame_buffer, 'allowed_violations', get_allowed_violations())).start()
                    frame_buffer.last_check_time = time.time()
                
                # Read frame from RTSP stream
                success, frame = rtsp_cap.read()
                
                if not success:
                    logger.warning("Failed to read frame from RTSP stream, reconnecting...")
                    # Try to reconnect
                    rtsp_cap.release()
                    time.sleep(1)  # Wait a bit before reconnecting
                    rtsp_cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
                    continue
                
                # Resize frame for consistency
                frame = cv2.resize(frame, (854, 480))
                
                # Process frame with model
                annotated_frame = process_frame(frame, current_time, frame_buffer, device, model, 'camera5')
                
                # Encode frame
                _, buffer = cv2.imencode('.jpg', annotated_frame)
                frame_bytes = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
            except Exception as e:
                logger.error(f"Error in RTSP frame generation: {str(e)}")
                continue
    finally:
        if rtsp_cap and rtsp_cap.isOpened():
            rtsp_cap.release()

# Helper function to create an error image
def create_error_image(message):
    # Create a black image
    img = np.zeros((480, 854, 3), np.uint8)
    
    # Add error message
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(img, message, (100, 240), font, 1, (255, 255, 255), 2, cv2.LINE_AA)
    
    return img

@app.get("/live-feed")
async def live_feed():
    return RedirectResponse(url="/api/stream")

@app.get("/api/stream")
async def video_stream():
    try:
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        }
        return StreamingResponse(
            generate_frames(),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in video_stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# New endpoint for RTSP stream
@app.get("/api/rtsp-stream")
async def rtsp_stream():
    try:
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'multipart/x-mixed-replace; boundary=frame'
        }
        return StreamingResponse(
            generate_rtsp_frames(),
            media_type="multipart/x-mixed-replace; boundary=frame",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error in rtsp_stream: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status")
async def status():
    return JSONResponse({
        "status": "running",
        "video_capture": cap.isOpened(),
        "model_loaded": model is not None,
        "using_cuda": cuda_available,
        "gpu_name": torch.cuda.get_device_name(0) if cuda_available else "None",
        "video_path": video_path,
        "model_path": model_path
    })

# Add new video paths
video_paths = {
    'camera1': r"C:\Users\Jose Mari\Documents\GitHub\c2-project-020325\src\model\recording_3.mp4",
    'camera2': r"C:\Users\Jose Mari\Documents\GitHub\c2-project-020325\src\model\no_sleeves.mp4",
    'camera3': r"C:\Users\Jose Mari\Documents\GitHub\c2-project-020325\src\model\unifm.mp4",
    'camera4': r"C:\Users\Jose Mari\Documents\GitHub\c2-project-020325\src\model\male_pe.mp4",
}

# Add new endpoints for each camera
@app.get("/api/stream/camera1")
async def video_stream_camera1():
    return StreamingResponse(
        generate_frames(video_paths['camera1'], 'camera1'),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/stream/camera2")
async def video_stream_camera2():
    return StreamingResponse(
        generate_frames(video_paths['camera2'], 'camera2'),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/stream/camera3")
async def video_stream_camera3():
    return StreamingResponse(
        generate_frames(video_paths['camera3'], 'camera3'),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/stream/camera4")
async def video_stream_camera4():
    return StreamingResponse(
        generate_frames(video_paths['camera4'], 'camera4'),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

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

# Add cleanup endpoint (optional)
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