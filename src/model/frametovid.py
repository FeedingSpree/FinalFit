import cv2
import os

# Parameters
image_folder = r"C:\Users\Jose Mari\Downloads\jm\jm"
output_video = 'output_video1.mp4'
start_index = 1
end_index = 1410
image_extension = '.jpg'
fps = 8  # 🔹 Slowed down from 30 to 5 FPS

# Get target resolution from first available image
def get_reference_resolution():
    for i in range(start_index, end_index + 1):
        image_path = os.path.join(image_folder, f'{i:04d}{image_extension}')
        if os.path.exists(image_path):
            img = cv2.imread(image_path)
            if img is not None:
                return img.shape[1], img.shape[0]  # width, height
    raise FileNotFoundError("No valid images found in the specified range.")

# Get resolution
frame_width, frame_height = get_reference_resolution()

# Set up video writer
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
video_writer = cv2.VideoWriter(output_video, fourcc, fps, (frame_width, frame_height))

# Write each frame
for i in range(start_index, end_index + 1):
    image_name = f'{i:04d}{image_extension}'
    image_path = os.path.join(image_folder, image_name)

    if os.path.exists(image_path):
        img = cv2.imread(image_path)
        if img is not None:
            resized_img = cv2.resize(img, (frame_width, frame_height))
            video_writer.write(resized_img)
        else:
            print(f'Warning: {image_name} could not be read, skipping.')
    else:
        print(f'Warning: {image_name} not found, skipping.')

video_writer.release()
print(f'✅ Slower video saved as {output_video}')
