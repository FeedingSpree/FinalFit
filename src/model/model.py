from fastapi import FastAPI, HTTPException
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

# Initialize Firebase Admin SDK (add this after the imports)
cred = credentials.Certificate(r"C:\Users\Jose Mari\Documents\C2\Firebase Private Key\campusfit-8468c-firebase-adminsdk-fbsvc-f90c6530de.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# File paths
model_path = r"C:\Users\Jose Mari\Documents\GitHub\c2-project-020325\src\model\yolov11m.pt"
video_path = r"C:\Users\Jose Mari\Documents\GitHub\c2-project-020325\src\model\recording_1.mp4"
rtsp_url = "rtsp://admin:Test1234@192.168.100.139:554/onvif1"  # RTSP URL for camera

# Validate file existence
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model file not found: {model_path}")
if not os.path.exists(video_path):
    raise FileNotFoundError(f"Video file not found: {video_path}")

# Initialize FastAPI app
app = FastAPI()

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
    model.conf = 0.5
    model.iou = 0.45
    model.agnostic = False
    model.max_det = 50

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

def generate_violation_id():
    date_str = datetime.now().strftime("%m%d%y")
    random_chars = ''.join(random.choices(string.ascii_uppercase, k=4))
    return f"VIO{date_str}{random_chars}"

# Add helper function to check allowed violations
def get_allowed_violations():
    allowed = {}
    try:
        # Get all documents from managements collection
        docs = db.collection('managements').stream()
        current_date = datetime.now().date()
        
        for doc in docs:
            data = doc.to_dict()
            logger.info(f"Checking management document: {data}")  # Debug log
            
            if data.get('status') == 'Allowed':
                dress_code = data.get('dress_code')
                start_date = datetime.strptime(data.get('start_date'), '%m-%d-%Y').date()
                end_date = datetime.strptime(data.get('end_date'), '%m-%d-%Y').date()
                
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
                        'dress_code': dress_code  # Add dress code for logging
                    }
                    logger.info(f"Added to allowed list: Class {class_id} ({dress_code})")
        
        logger.info(f"Final allowed violations: {allowed}")
        return allowed
    except Exception as e:
        logger.error(f"Error getting allowed violations: {e}")
        return {}

# First, create a helper function to check if violation is allowed
def is_violation_allowed(cls, allowed_violations):
    if cls in VIOLATIONS and cls in allowed_violations:
        allowed_period = allowed_violations[cls]
        current_date = datetime.now().date()
        return allowed_period['start_date'] <= current_date <= allowed_period['end_date']
    return False

# Add a frame buffer class
class FrameBuffer:
    def __init__(self, maxsize=30):
        self.frames = Queue(maxsize=maxsize)
        self.lock = Lock()
        self.last_detection_time = time.time()
        self.detection_cooldown = 1.0  # 1 second cooldown
        self.allowed_violations = {}
        self.last_check_time = time.time()
        self.check_interval = 10  # 10 seconds

# Modified process_frame function to be reused for both streams
def process_frame(frame, current_time, frame_buffer, device, model):
    try:
        # Run detection with optimized settings
        with torch.inference_mode():
            results = model.predict(
                source=frame,
                conf=0.5,
                save=False,
                device=device,
                verbose=False,
                stream=True  # Enable streaming mode
            )
            
            result = next(results)
            if result.boxes:
                # Process on GPU to avoid CPU-GPU transfers
                boxes = result.boxes
                mask = torch.ones(len(boxes), dtype=torch.bool, device=device)
                
                for i, box in enumerate(boxes):
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    if conf > 0.5 and is_violation_allowed(cls, frame_buffer.allowed_violations):
                        mask[i] = False
                        continue
                    
                    # Process detections without moving tensors to CPU
                    if cls in VIOLATIONS or cls in NON_VIOLATIONS:
                        with frame_buffer.lock:
                            if time.time() - frame_buffer.last_detection_time >= frame_buffer.detection_cooldown:
                                frame_buffer.last_detection_time = time.time()
                                # Process detection in separate thread
                                Thread(target=handle_detection, args=(cls, current_time)).start()
                
                # Filter boxes in one operation on GPU
                if mask.any():
                    result.boxes = result.boxes[mask]
                else:
                    result.boxes.data = torch.empty((0, 6), device=device)
            
            return result.plot()
    except Exception as e:
        logger.error(f"Error processing frame: {e}")
        return frame

def handle_detection(cls, current_time):
    try:
        if cls in VIOLATIONS:
            violation = VIOLATIONS[cls]
            detection_data = {
                "building_number": 1,
                "camera_number": 1,
                "date": current_time.strftime("%Y-%m-%d"),
                "floor_number": 1,
                "time": current_time.strftime("%H:%M:%S"),
                "violation": violation,
                "violation_id": generate_violation_id()
            }
            app.latest_detection = {
                "type": "violation",
                "data": detection_data
            }
            logger.info(f"Violation detected: {violation}")
        elif cls in NON_VIOLATIONS:
            uniform_type = NON_VIOLATIONS[cls]
            detection_data = {
                "building_number": 1,
                "camera_number": 1,
                "date": current_time.strftime("%Y-%m-%d"),
                "floor_number": 1,
                "time": current_time.strftime("%H:%M:%S"),
                "detection": uniform_type,
                "detection_id": generate_violation_id()
            }
            app.latest_detection = {
                "type": "uniform",
                "data": detection_data
            }
            logger.info(f"Uniform detected: {uniform_type}")
    except Exception as e:
        logger.error(f"Error handling detection: {e}")

# Modified generate_frames for the local video file
def generate_frames():
    frame_buffer = FrameBuffer()
    
    while True:
        try:
            current_time = datetime.now()
            
            # Update allowed violations in separate thread
            if time.time() - frame_buffer.last_check_time > frame_buffer.check_interval:
                Thread(target=lambda: setattr(frame_buffer, 'allowed_violations', get_allowed_violations())).start()
                frame_buffer.last_check_time = time.time()

            success, frame = cap.read()
            if not success:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            frame = cv2.resize(frame, (854, 480))
            
            # Process frame
            annotated_frame = process_frame(frame, current_time, frame_buffer, device, model)
            
            # Encode frame
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
                annotated_frame = process_frame(frame, current_time, frame_buffer, device, model)
                
                # Encode frame
                _, buffer = cv2.imencode('.jpg', annotated_frame)
                frame_bytes = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                
            except Exception as e:
                logger.error(f"Error in RTSP frame generation: {str(e)}")
                time.sleep(0.5)  # Add a small delay before trying again
                continue
            
    except Exception as e:
        logger.error(f"Error initializing RTSP stream: {str(e)}")
        # Return an error message as a frame
        error_img = create_error_image("RTSP stream unavailable")
        _, buffer = cv2.imencode('.jpg', error_img)
        frame_bytes = buffer.tobytes()
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
    
    finally:
        # Ensure we release the capture when the generator is done
        if rtsp_cap is not None and rtsp_cap.isOpened():
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

@app.get("/api/detection")
async def get_latest_detection():
    if hasattr(app, 'latest_detection'):
        return app.latest_detection
    return {"status": "no detection"}