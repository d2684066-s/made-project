# Safety System & Admin Panel - Complete Setup Documentation

## Overview
This document outlines all the fixes and improvements made to the GPS Tracking System's Safety Module and Admin Panel integration.

---

## ✅ COMPLETED FIXES & IMPROVEMENTS

### 1. Database Models - Fixed & Enhanced
**Location:** `safety_app/models.py`

#### New Models Created:
- **Student** - Student profile with safety system tracking
  - student_id (unique)
  - name, email, phone_uuid
  - is_active flag

- **Faculty** - Faculty profile with safety system tracking
  - faculty_id (unique)
  - name, email, phone_uuid
  - is_active flag

#### Enhanced Models:
- **BLEDetection** - Added missing fields:
  - `phone_uuid` - Phone/device identifier from ESP32
  - `reader_id` - Gate/reader location (gate1, gate2, road1, etc.)
  - `timestamp` - Custom timestamp from ESP32 (optional)

### 2. Admin Panel Integration
**Location:** `core/admin.py` & `safety_app/admin.py`

#### Registered Models:
- **User** - Full CRUD in Django admin with:
  - All user roles (student, driver, admin)
  - Staff/Superuser status
  - Search by name, phone, email, registration_id
  - Filtering by role, active status

- **Safety App Models**:
  - Student & Faculty management
  - ESP32Device monitoring
  - BLETag tracking
  - BLEDetection logs
  - ViolationReport tracking
  - StudentOffence & FacultyOffence management

### 3. Admin Signup Flow - Fixed
**Location:** `core/views.py`

#### OLD BEHAVIOR:
- AdminSignupView only returned confirmation message
- Did NOT save to database
- Data stored only in localStorage (frontend only)

#### NEW BEHAVIOR:
- AdminSignupView directly creates admin user in database
- Properly sets:
  - role='admin'
  - is_staff=True
  - is_superuser=False
  - is_active=True
- Returns complete user data with JWT token

### 4. Offence Tracking APIs - NEW
**Location:** `safety_app/views.py` & `safety_app/urls.py`

#### New API Endpoints:
```
GET  /safety/api/student-offences/         - List all student offences
GET  /safety/api/faculty-offences/         - List all faculty offences
GET  /safety/api/students/                 - List all students
GET  /safety/api/faculty/                  - List all faculty
GET  /safety/api/violations/               - List all violation reports
GET  /safety/api/ble-detections/           - List all BLE detections
GET  /safety/api/esp32-devices/            - List ESP32 devices
```

#### Filtering & Search Capabilities:
All endpoints support query parameters for filtering:
- **Student Offences**: student_id, severity, is_paid, search
- **Faculty Offences**: faculty_id, severity, is_paid, search
- **Students/Faculty**: search (by ID/name/email)
- **Violations**: violation_type, location
- **BLE Detections**: phone_uuid, reader_id, limit

### 5. Serializers - Created
**Location:** `safety_app/serializers.py`

Complete serializers for all models:
- StudentOffenceSerializer
- FacultyOffenceSerializer
- StudentSerializer
- FacultySerializer
- ViolationReportSerializer
- BLEDetectionSerializer
- And more...

---

## 🔐 DEFAULT ADMIN ACCESS

After setup, use these credentials to access the admin panel:

```
URL:      http://localhost:8000/admin/
Email:    admin@itsystem.com
Phone:    admin_001
Password: Admin@123
```

**⚠️  IMPORTANT:** Change this password immediately after first login!

---

## 🚀 USING THE SYSTEM

### Admin Panel Features:
1. **User Management** - Add/edit/delete users with different roles
2. **Student & Faculty Tracking** - Manage student and faculty profiles
3. **Offence Tracking** - View, search, and manage violations
4. **ESP32 Device Management** - Monitor connected devices
5. **BLE Detection Logs** - Real-time detection tracking

### API Usage for Admin APP:
```bash
# Get student offences
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/safety/api/student-offences/

# Get faculty offences
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/safety/api/faculty-offences/

# Search by student
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/safety/api/student-offences/?student_id=STU_001"

# Get unpaid offences
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/safety/api/student-offences/?is_paid=false"
```

---

## 📊 DATABASE STRUCTURE

### Safety System Models (safety_app):
```
Student
├── student_id (PK)
├── name
├── email
└── phone_uuid

Faculty
├── faculty_id (PK)
├── name
├── email
└── phone_uuid

BLEDetection
├── tag_uuid
├── phone_uuid (NEW)
├── reader_id (NEW)
├── rssi
├── timestamp (NEW)
└── detected_at

ViolationReport
├── violation_type
├── timestamp
├── evidence
└── location

StudentOffence
├── student_id/name (linked to Student)
├── violation (FK to ViolationReport)
├── severity
├── fine_amount
└── is_paid

FacultyOffence
├── faculty_id/name (linked to Faculty)
├── violation (FK to ViolationReport)
├── severity
├── fine_amount
└── is_paid
```

---

## ✨ WORKFLOW TESTING RESULTS

All tests passed successfully:
```
✓ Admin signup (stores in database directly)
✓ Student creation & tracking
✓ Faculty creation & tracking
✓ Violation report creation
✓ Offence tracking & retrieval
✓ API endpoints (all working)
✓ Database integration (verified)
✓ Authentication & authorization
```

---

## 🔌 ESP32 Integration

The system now properly tracks ESP32 data:

1. **BLE Detection Flow**:
   - ESP32 sends: `phone_uuid`, `reader_id`, `rssi`, `timestamp`
   - System logs in BLEDetection model
   - Automatically matches to Student via phone_uuid
   - Creates offence records for violations

2. **Expected POST Format**:
```json
{
  "reader_id": "gate1",
  "phone_uuid": "unique_phone_id",
  "rssi": -75,
  "timestamp": "1234567890"
}
```

### Endpoints:
```
POST /safety/api/ble-log/        - Log BLE detection
POST /safety/api/violation/      - Report violation
```

---

## 📝 ADMIN OPERATIONS

### Adding New Admin Users:
```bash
POST /api/auth/admin-signup/
{
  "name": "New Admin",
  "email": "newadmin@school.com",
  "password": "SecurePass123!",
  "dob": "1990-01-01",
  "registration_id": "ADMIN_002"
}
```

Response:
```json
{
  "message": "Admin account created successfully",
  "user": {
    "id": "...",
    "name": "New Admin",
    "email": "newadmin@school.com",
    "role": "admin",
    "is_staff": true
  }
}
```

### Login to System:
```bash
POST /api/auth/login/
{
  "email": "admin@itsystem.com",
  "password": "Admin@123"
}
```

Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": { ... }
}
```

---

## 🛠️ TECHNICAL CHANGES SUMMARY

### Files Modified:
1. `safety_app/models.py` - Added Student, Faculty; Enhanced BLEDetection
2. `safety_app/admin.py` - Registered all safety app models
3. `safety_app/views.py` - Added API endpoints for offence tracking
4. `safety_app/urls.py` - Added URL routes for new APIs
5. `safety_app/serializers.py` - Created serializers
6. `core/admin.py` - Registered User and other core models
7. `core/views.py` - Fixed AdminSignupView to save to DB

### Database Migrations:
```
safety_app/migrations/0002_faculty_student_bledetection_...
- Creates Faculty model
- Creates Student model
- Adds phone_uuid to BLEDetection
- Adds reader_id to BLEDetection
- Adds timestamp to BLEDetection
```

---

## ⚠️ IMPORTANT NOTES

1. **Change Default Password**: The default admin password should be changed immediately
2. **JWT Token Security**: For production, update the SECRET_KEY in settings.py
3. **CORS Configuration**: Currently allows '*', configure for production
4. **Database**: Using SQLite for development, migrate to PostgreSQL for production
5. **ESP32 Integration**: Ensure ESP32 firmware sends data in correct format

---

## 🔄 NEXT STEPS

1. ✅ System is fully functional and tested
2. ✅ Admin panel ready for use
3. ✅ Database properly integrated
4. ✅ All APIs working
5. **TODO**: Configure frontend admin dashboard to use new APIs
6. **TODO**: Set up real ESP32 devices with correct reader_id values
7. **TODO**: Implement payment gateway for fine collection
8. **TODO**: Add notification system for violations

---

## 🆘 TROUBLESHOOTING

### Issue: Admin signup not showing in database
**Solution**: Fixed! AdminSignupView now directly creates user in DB. Verify with:
```bash
python manage.py shell
from core.models import User
User.objects.filter(role='admin').count()
```

### Issue: Offences not visible in admin panel
**Solution**: Use the new API endpoints:
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/safety/api/student-offences/
```

### Issue: ESP32 data not being logged
**Solution**: Verify:
1. Correct endpoint: `/safety/api/ble-log/`
2. Correct JSON format with phone_uuid and reader_id
3. Student exists with matching phone_uuid

---

## 📞 SUPPORT

For issues or questions:
1. Check the API response for detailed error messages
2. Verify Django logs: `python manage.py runserver`
3. Test endpoints with provided curl commands
4. Check database directly: Django admin panel

---

**Last Updated**: March 10, 2026
**Status**: ✅ FULLY IMPLEMENTED & TESTED
**Ready for Production**: YES (after security configuration)
