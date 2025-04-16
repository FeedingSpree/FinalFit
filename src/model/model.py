from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
from ultralytics import YOLO
import logging
import os
import torch

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

def generate_frames():
    frame_count = 0
    skip_frames = 1  # Process every other frame for better performance
    
    while True:
        try:
            # Skip frames for performance
            for _ in range(skip_frames - 1):
                cap.grab()
            
            success, frame = cap.read()
            if not success:
                logger.info("Reached end of video, restarting...")
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            # Maintain aspect ratio while fitting in the box
            frame = cv2.resize(frame, (854, 480))

            # Run detection
            with torch.inference_mode():
                with torch.cuda.amp.autocast(enabled=cuda_available):
                    results = model.predict(
                        source=frame,
                        conf=0.5,
                        save=False,
                        device=device,
                        verbose=False
                    )

            annotated_frame = results[0].plot()

            # Optimize encoding
            encode_param = [
                int(cv2.IMWRITE_JPEG_QUALITY), 85,
                int(cv2.IMWRITE_JPEG_OPTIMIZE), 1
            ]
            _, buffer = cv2.imencode('.jpg', annotated_frame, encode_param)
            frame_bytes = buffer.tobytes()

            frame_count += 1
            if frame_count % 30 == 0:
                logger.info(f"Processed frame {frame_count}")

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
