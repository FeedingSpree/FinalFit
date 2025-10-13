import cv2

# Try changing this number to 0, 1, 2... to find the working webcam
cam_index = 0  # You said 1 worked before, we'll verify

cap = cv2.VideoCapture(cam_index, cv2.CAP_DSHOW)

if not cap.isOpened():
    print(f"❌ Cannot open camera index {cam_index}. Try another index (0, 2, 3...)")
else:
    print(f"✅ Camera index {cam_index} opened successfully!")
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            print("⚠️ No frame received. The camera might be busy or blocked.")
            break

        frame_count += 1
        cv2.imshow(f"Camera Test (index={cam_index})", frame)

        # Press Q to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            print("🟡 Quit pressed by user.")
            break

        # Safety stop if nothing displays for a while
        if frame_count > 500:
            print("🟢 500 frames displayed successfully!")
            break

    cap.release()
    cv2.destroyAllWindows()
    print("✅ Camera released properly.")
