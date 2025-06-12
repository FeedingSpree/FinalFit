import torch
import torchvision
import cv2
import numpy as np
from pathlib import Path
from boxmot import BotSort

# Load a pre-trained Faster R-CNN model
device = 0 if torch.cuda.is_available() else 'cpu'
detector = torchvision.models.detection.fasterrcnn_resnet50_fpn(pretrained=True)
detector.eval().to(device)

# Initialize the tracker
tracker = BotSort(
    reid_weights=Path('osnet_x0_25_msmt17.pt'),  # Path to ReID model
    device=device,
    half=False
)

video_path = r"C:\Users\Fred\Documents\GitHub\c2-project-020325-main\c2-project-020325-main\src\model\sleeveless.mp4"
# Open the video file
vid = cv2.VideoCapture(video_path)

# Initialize background subtractor for motion detection
fgbg = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=100, detectShadows=False)

# Get video properties for output
fps = int(vid.get(cv2.CAP_PROP_FPS))
width = int(vid.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(vid.get(cv2.CAP_PROP_FRAME_HEIGHT))

# COCO class names (index 0 is background)
COCO_CLASSES = [
    '__background__', 'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus',
    'train', 'truck', 'boat', 'traffic light', 'fire hydrant', 'N/A', 'stop sign',
    'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'N/A', 'backpack', 'umbrella', 'N/A', 'N/A',
    'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
    'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
    'bottle', 'N/A', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
    'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza',
    'donut', 'cake', 'chair', 'couch', 'potted plant', 'bed', 'N/A', 'dining table',
    'N/A', 'N/A', 'toilet', 'N/A', 'tv', 'laptop', 'mouse', 'remote', 'keyboard', 'cell phone',
    'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'N/A', 'book',
    'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

# Define classes we want to track (add more if needed)
TRACK_CLASSES = ['person']  # Modify this list to include other objects you want to track
track_class_indices = [COCO_CLASSES.index(cls) for cls in TRACK_CLASSES if cls in COCO_CLASSES]

# Initialize previous frame for motion detection
prev_frame = None
frame_count = 0
motion_threshold = 30  # Adjust based on your needs

# Optional: Create VideoWriter for saving the result
# out = cv2.VideoWriter('output.mp4', cv2.VideoWriter_fourcc(*'mp4v'), fps, (width, height))

while True:
    # Capture frame-by-frame
    ret, frame = vid.read()
    
    # If ret is False, it means we have reached the end of the video
    if not ret:
        break
    
    frame_count += 1
    curr_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    curr_frame = cv2.GaussianBlur(curr_frame, (21, 21), 0)
    
    # Motion detection
    if prev_frame is None:
        prev_frame = curr_frame
        continue
    
    # Apply background subtraction
    fgmask = fgbg.apply(frame)
    fgmask = cv2.dilate(fgmask, None, iterations=2)
    
    # Convert frame to tensor and move to device
    frame_tensor = torchvision.transforms.functional.to_tensor(frame).to(device)
    
    # Perform detection
    with torch.no_grad():
        detections = detector([frame_tensor])[0]
    
    # Filter the detections based on confidence threshold and class
    confidence_threshold = 0.5
    dets = []
    
    for i, score in enumerate(detections['scores']):
        if score >= confidence_threshold:
            bbox = detections['boxes'][i].cpu().numpy()
            label = detections['labels'][i].item()
            conf = score.item()
            
            # Only include if it's one of our tracked classes
            if label in track_class_indices:
                x1, y1, x2, y2 = map(int, bbox)
                
                # Check if there's motion in the detected region
                roi_mask = fgmask[y1:y2, x1:x2]
                if roi_mask.size > 0:  # Make sure ROI is valid
                    motion_pixels = np.count_nonzero(roi_mask)
                    motion_percentage = (motion_pixels / roi_mask.size) * 100
                    
                    # Only include if there's significant motion
                    if motion_percentage > motion_threshold:
                        dets.append([*bbox, conf, label])
                        # Draw bounding box with class name
                        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                        class_name = COCO_CLASSES[label]
                        cv2.putText(frame, f"{class_name}: {conf:.2f}", (x1, y1-10),
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    
    # Convert detections to numpy array (N X (x, y, x, y, conf, cls))
    if dets:
        dets = np.array(dets)
        
        # Update the tracker
        res = tracker.update(dets, frame)  # --> M X (x, y, x, y, id, conf, cls, ind)
        
        # Plot tracking results on the image
        tracker.plot_results(frame, show_trajectories=True)
    
    # Optional: Show the motion mask for debugging
    # cv2.imshow('Motion Mask', fgmask)
    
    # Show the result
    cv2.imshow('Moving Object Tracking', frame)
    
    # Optional: Write frame to output video
    # out.write(frame)
    
    # Update previous frame
    prev_frame = curr_frame
    
    # Simulate wait for key press to continue, press 'q' to exit
    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break

# Release resources
vid.release()
# out.release()  # Uncomment if using VideoWriter
cv2.destroyAllWindows()