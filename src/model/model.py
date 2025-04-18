from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
from ultralytics import YOLO
import logging
import os
import torch
from datetime import datetime
import random
import string
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# File paths
model_path = r"C:\Users\Jose Mari\Documents\GitHub\c2-project-020325\src\model\yolov11m.pt"
video_path = r"C:\Users\Jose Mari\Documents\GitHub\c2-project-020325\src\model\recording_1.mp4"

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

    # Initialize video capture
    logger.info("Opening video capture...")
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

def generate_frames():
    frame_count = 0
    last_detection_time = 0
    detection_cooldown = 30  # Minimum frames between detections
    
    while True:
        try:
            success, frame = cap.read()
            if not success:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            frame = cv2.resize(frame, (854, 480))
            frame_count += 1

            # Run detection
            with torch.inference_mode():
                results = model.predict(
                    source=frame,
                    conf=0.5,
                    save=False,
                    device=device,
                    verbose=False
                )

            # Process detections
            if frame_count - last_detection_time >= detection_cooldown:
                for result in results:
                    if result.boxes:
                        for box in result.boxes:
                            cls = int(box.cls[0])
                            conf = float(box.conf[0])
                            
                            if conf > 0.5:
                                current_time = datetime.now()
                                
                                # Handle violations
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
                                    last_detection_time = frame_count
                                    logger.info(f"Violation detected: {violation}")
                                
                                # Handle non-violations (uniform detections)
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
                                    last_detection_time = frame_count
                                    logger.info(f"Uniform detected: {uniform_type}")

            annotated_frame = results[0].plot()
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            frame_bytes = buffer.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
            continue

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
