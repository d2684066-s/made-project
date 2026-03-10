# Safety System - Setup and Testing Guide

This guide shows how to set up and test the ESP-32 Safety System with BLE tag detection and violation logging.

## System Components

1. **Backend (Django)**: Risk assessment and violation logging
2. **Frontend (Angular)**: Admin dashboard for managing offences
3. **Test Scripts**: Mock BLE sender and webcam helmet violation detector
4. **Database**: Stores violations, student offences, and faculty offences

## Backend Setup

### Prerequisites
- Python 3.8+
- Django 4.2+
- PostgreSQL or SQLite (included with Django)

### Installation

1. **Navigate to backend directory:**
```bash
cd GPS_TrackingSystem_Backend
```

2. **Create and activate virtual environment (recommended):**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install required packages:**
```bash
pip install -r requirements.txt
```

4. **Run migrations to create database tables:**
```bash
python manage.py makemigrations safety_app
python manage.py migrate
```

5. **Create superuser for admin panel (optional):**
```bash
python manage.py createsuperuser
```

6. **Start the Django development server:**
```bash
python manage.py runserver 0.0.0.0:8000
```

The backend should now be running at `http://127.0.0.1:8000/`

## Frontend Setup

### Prerequisites
- Node.js 16+
- Angular 17+
- npm or yarn

### Installation

1. **Navigate to frontend directory:**
```bash
cd GPS_TrackingSystem_Frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
ng serve
```

The frontend should now be running at `http://localhost:4200/`

### Admin Dashboard

Access admin dashboard at: `http://localhost:4200/admin`

Features:
- **Dashboard**: View statistics
- **Student Offences**: Create, view, and manage student violations
- **Faculty Offences**: Create, view, and manage faculty violations
- **ESP-32 Devices**: Register and manage ESP-32 tracking devices

## Test Scripts

### 1. Mock BLE Sender

Simulates ESP-32 BLE tag detections to test the system.

**Setup:**
```bash
cd GPS_TrackingSystem_Backend
pip install requests
```

**Run:**
```bash
python mock_ble_sender.py
```

**What it does:**
- Sends mock BLE tag detection data every 5 seconds
- Simulates tags with different signal strengths (RSSI values)
- Logs data to the Django backend at `http://127.0.0.1:8000/safety/api/ble-log/`

**Example output:**
```
============================================================
Mock BLE Sender Started
============================================================
Sending BLE tag detections every 5 seconds...
Target URL: http://127.0.0.1:8000/safety/api/ble-log/
Tags: TAG-STUDENT-001, TAG-STUDENT-002, TAG-STUDENT-003, TAG-FACULTY-001
============================================================

[Iteration 1] 2024-02-27 10:30:45
--------------------------------------------------------------
  TAG-STUDENT-001              | RSSI: -45 dBm | ✓ SUCCESS (201)
  TAG-STUDENT-002              | RSSI: -55 dBm | ✓ SUCCESS (201)
  TAG-STUDENT-003              | RSSI: -65 dBm | ✓ SUCCESS (201)
  TAG-FACULTY-001              | RSSI: -75 dBm | ✓ SUCCESS (201)
--------------------------------------------------------------
```

### 2. Webcam Helmet Violation Detector

Detects persons in video stream and logs helmet violations.

**Setup:**
```bash
cd GPS_TrackingSystem_Backend
pip install opencv-python ultralytics requests
```

**Run:**
```bash
python webcam_helmet_test.py
```

**What it does:**
- Accesses your webcam (use index 0 for built-in, 1 for external USB)
- Uses YOLOv8 to detect persons in video frames
- Logs "no_helmet" violations to the backend
- Displays annotated video with detections

**User interface:**
- Shows video stream with person detections
- Press 'Q' to quit
- Displays statistics at the end

**Example output:**
```
======================================================================
Webcam Helmet Violation Detector
======================================================================
Backend URL: http://127.0.0.1:8000/safety/api/violation/
Camera Index: 0
YOLO Model: yolov8n.pt
======================================================================

Loading YOLOv8 model 'yolov8n.pt'...
✓ Model loaded successfully

Initializing webcam (index 0)...
✓ Webcam initialized

======================================================================
Press 'Q' to quit
======================================================================

[Frame 42] Person Detected (confidence: 95.32%)
----------------------------------------------------------------------
  Simulating: NO HELMET VIOLATION
  ✓ Violation logged to backend (201)
  Violation ID: 550e8400-e29b-41d4-a716-446655440000
----------------------------------------------------------------------

[Statistics]
======================================================================
Frames processed: 150
Persons detected: 8
Violations logged: 8
======================================================================
```

## API Endpoints

### Student Offences API

**Get All Offences:**
```bash
curl http://127.0.0.1:8000/safety/api/student-offences/
```

**Create Offence:**
```bash
curl -X POST http://127.0.0.1:8000/safety/api/student-offences/ \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "STU-001",
    "student_name": "John Doe",
    "violation_type": "no_helmet",
    "severity": "major",
    "fine_amount": 500,
    "description": "No helmet while riding"
  }'
```

**Mark as Paid:**
```bash
curl -X POST http://127.0.0.1:8000/safety/api/student-offences/<id>/ \
  -H "Content-Type: application/json" \
  -d '{"action": "mark_paid"}'
```

**Delete Offence:**
```bash
curl -X DELETE http://127.0.0.1:8000/safety/api/student-offences/<id>/
```

### Faculty Offences API

Same endpoints as student offences, but for faculty members:
- `GET /safety/api/faculty-offences/`
- `POST /safety/api/faculty-offences/`
- `DELETE /safety/api/faculty-offences/<id>/`

### BLE Log API

**Log BLE Detection:**
```bash
curl -X POST http://127.0.0.1:8000/safety/api/ble-log/ \
  -H "Content-Type: application/json" \
  -d '{
    "tag_uuid": "TAG-STUDENT-001",
    "rssi": -45,
    "timestamp": "2024-02-27T10:30:45Z"
  }'
```

### Violation Report API

**Create Violation:**
```bash
curl -X POST http://127.0.0.1:8000/safety/api/violation/ \
  -H "Content-Type: application/json" \
  -d '{
    "type": "no_helmet",
    "timestamp": "2024-02-27T10:30:45Z",
    "evidence": "Person detected without helmet"
  }'
```

## Database Models

### StudentOffence
- `student_id`: Unique student identifier
- `student_name`: Student name
- `violation`: Foreign key to ViolationReport
- `severity`: minor, major, critical
- `fine_amount`: Penalty amount
- `is_paid`: Payment status
- `description`: Additional details

### FacultyOffence
- `faculty_id`: Unique faculty identifier
- `faculty_name`: Faculty name
- Similar fields as StudentOffence

### ViolationReport
- `violation_type`: no_helmet, overspeed, traffic_light, wrong_lane, other
- `timestamp`: When violation occurred
- `evidence`: Base64 image or description
- `device`: Associated ESP-32 device

### BLEDetection
- `tag_uuid`: Unique tag identifier
- `rssi`: Signal strength
- `detected_at`: Detection timestamp
- `device`: Associated ESP-32 device

## Troubleshooting

### Django Connection Error in Test Scripts
**Error:** "Connection Error: Is Django server running?"
**Solution:** Make sure Django server is running on `http://127.0.0.1:8000/`
```bash
python manage.py runserver 0.0.0.0:8000
```

### Webcam Not Found
**Error:** "Failed to open camera! Check if camera is connected."
**Solutions:**
1. Check if camera is connected
2. Try changing camera index in `webcam_helmet_test.py`:
   ```python
   CAMERA_INDEX = 1  # Try 1 for external USB camera
   ```
3. On Linux, check permissions: `ls -la /dev/video0`

### YOLO Model Download Issues
**Error:** "Failed to load model"
**Solution:** Manually download the model:
```bash
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
```

### Database Migration Issues
**Error:** "table doesn't exist"
**Solution:**
```bash
python manage.py migrate safety_app
python manage.py migrate
```

## Next Steps

1. **Configure Production Settings:**
   - Update `settings.py` with production database
   - Set `DEBUG = False`
   - Update `ALLOWED_HOSTS`

2. **Set Up Real ESP-32 Devices:**
   - Configure actual ESP-32 BLE tag sending
   - Update BLE detection intervals
   - Add device authentication

3. **Integrate Real Camera Feeds:**
   - Replace webcam with RTSP stream
   - Add camera calibration
   - Implement multi-camera support

4. **Add Admin Features:**
   - User role-based access control
   - Report generation
   - Fine payment tracking
   - Automated notifications

## Support

For issues or questions, check the logs:
- **Django logs:** Console output
- **Frontend errors:** Browser console (F12)
- **Database errors:** Check Django admin interface

---

**Version:** 1.0  
**Last Updated:** February 27, 2024
