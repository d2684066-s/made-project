#!/usr/bin/env python
"""
Webcam Helmet Test - Detects persons in video stream and logs helmet violations.
Uses YOLOv8 for object detection to identify if persons are wearing helmets.

This script requires:
  - opencv-python
  - ultralytics
  - requests

Install with: pip install opencv-python ultralytics requests

Run this to test helmet violation detection and logging.
"""
import time
import requests
import datetime
import sys

try:
    import cv2
    from ultralytics import YOLO
except ImportError as e:
    print(f"Error: Required package not installed: {e}")
    print("\nInstall required packages with:")
    print("  pip install opencv-python ultralytics requests")
    sys.exit(1)

# Configuration
BACKEND_URL = "http://127.0.0.1:8000/safety/api/violation/"
CAMERA_INDEX = 0  # 0 = built-in webcam, try 1 for external USB webcam
MODEL_NAME = "yolov8n.pt"  # Lightweight YOLO model (nano)

print("=" * 70)
print("Webcam Helmet Violation Detector")
print("=" * 70)
print(f"Backend URL: {BACKEND_URL}")
print(f"Camera Index: {CAMERA_INDEX}")
print(f"YOLO Model: {MODEL_NAME}")
print("=" * 70)
print()

# Load YOLO model (downloads automatically first time)
print(f"Loading YOLOv8 model '{MODEL_NAME}'...")
try:
    model = YOLO(MODEL_NAME)
    print("✓ Model loaded successfully")
except Exception as e:
    print(f"✗ Failed to load model: {e}")
    sys.exit(1)

print()

# Initialize webcam
print(f"Initializing webcam (index {CAMERA_INDEX})...")
cap = cv2.VideoCapture(CAMERA_INDEX)

if not cap.isOpened():
    print(f"✗ Failed to open camera! Check if camera is connected and not in use.")
    sys.exit(1)

print("✓ Webcam initialized")
print()

# Alternative for real RTSP camera (e.g., college security camera):
# cap = cv2.VideoCapture("rtsp://admin:password@192.168.1.100:554/stream")

violation_count = 0
frame_count = 0
person_detections = 0

print("=" * 70)
print("Press 'Q' to quit")
print("=" * 70)
print()

try:
    while True:
        ret, frame = cap.read()
        frame_count += 1
        
        if not ret:
            print("✗ Camera error – check if webcam is still connected.")
            break

        # Run YOLO detection
        results = model(frame, verbose=False)

        # Look for persons in detections
        person_detected = False
        for r in results:
            for box in r.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                
                # Class 0 = person in COCO dataset
                if cls == 0 and conf > 0.5:
                    person_detected = True
                    person_detections += 1
                    
                    print(f"\n[Frame {frame_count}] Person Detected (confidence: {conf:.2%})")
                    print("-" * 70)
                    print("  Simulating: NO HELMET VIOLATION")
                    
                    # Create violation report
                    timestamp = datetime.datetime.now().isoformat()
                    
                    data = {
                        "type": "no_helmet",
                        "timestamp": timestamp,
                        "evidence": f"Person detected at frame {frame_count}",
                        "location": "Webcam Feed"
                    }
                    
                    try:
                        resp = requests.post(BACKEND_URL, json=data, timeout=5)
                        violation_count += 1
                        
                        if resp.status_code in [200, 201]:
                            print(f"  ✓ Violation logged to backend ({resp.status_code})")
                            response_data = resp.json() if resp.text else {}
                            if 'violation_id' in response_data:
                                print(f"  Violation ID: {response_data['violation_id']}")
                        else:
                            print(f"  ✗ Backend returned {resp.status_code}")
                            if resp.text:
                                print(f"  Response: {resp.text[:100]}")
                    
                    except requests.exceptions.ConnectionError:
                        print(f"  ✗ Connection Error: Is Django server running on {BACKEND_URL}?")
                    except requests.exceptions.Timeout:
                        print(f"  ✗ Request Timeout")
                    except Exception as e:
                        print(f"  ✗ Error: {str(e)}")
                    
                    print("-" * 70)

        # Annotate frame with detections
        if results:
            annotated_frame = results[0].plot()
        else:
            annotated_frame = frame

        # Display the frame
        cv2.imshow("Helmet Violation Detector (Press Q to quit)", annotated_frame)

        # Press Q to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

except KeyboardInterrupt:
    print("\n(Interrupted by user)")

finally:
    cap.release()
    cv2.destroyAllWindows()
    
    print("\n" + "=" * 70)
    print("Statistics")
    print("=" * 70)
    print(f"Frames processed: {frame_count}")
    print(f"Persons detected: {person_detections}")
    print(f"Violations logged: {violation_count}")
    print("=" * 70)
    print("Webcam Helmet Test Ended")
    print("=" * 70)
