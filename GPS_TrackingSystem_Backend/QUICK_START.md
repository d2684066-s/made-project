# QUICK START - Admin Panel & Safety System

## 🎯 What Was Fixed

You had these issues:
1. ❌ **Admin signup not showing in developer panel** → ✅ FIXED: Now saves directly to database
2. ❌ **No way to view real offences from ESP32** → ✅ FIXED: Complete API endpoints added
3. ❌ **Student & Faculty offences not linkable** → ✅ FIXED: Database models created & linked
4. ❌ **No admin panel integration** → ✅ FIXED: All models registered in Django admin

---

## 🔐 LOGIN CREDENTIALS

```
URL:      http://localhost:8000/admin/
Email:    admin@itsystem.com
Phone:    admin_001
Password: Admin@123
```

---

## 📋 WHAT YOU CAN NOW DO

### In Django Admin Panel:
1. ✅ **Create/Edit/Delete Admin Users** - Manage admins
2. ✅ **View Student Offences** - All violation records for students
3. ✅ **View Faculty Offences** - All violation records for faculty
4. ✅ **Manage Students** - Add/edit student profiles
5. ✅ **Manage Faculty** - Add/edit faculty profiles
6. ✅ **Track Violations** - See all reported violations
7. ✅ **Monitor ESP32 Devices** - See connected devices
8. ✅ **View BLE Detections** - Real-time detection logs

### Via REST APIs (for Admin Application):
```bash
# Get all student offences
GET /safety/api/student-offences/

# Get all faculty offences
GET /safety/api/faculty-offences/

# Search by student
GET /safety/api/student-offences/?student_id=STU_001

# Get unpaid fines
GET /safety/api/student-offences/?is_paid=false

# Get by severity
GET /safety/api/student-offences/?severity=major
```

---

## 🚀 WORKFLOW

### Creating New Admin User:
1. Go to `http://localhost:8000/admin/`
2. Login with provided credentials
3. Click "Users" → "Add User"
4. Fill in details:
   - Name
   - Phone
   - Email
   - Role (select "admin")
   - Password
   - Check "is_staff" and "is_superuser"
5. Save

OR use API:
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

### Viewing Student Offences:
1. In Admin Panel → Safety App → Student Offences
2. Search by student ID or name
3. Filter by severity or payment status
4. Click on offence to see full details (violation type, fine, evidence)

### Adding Offence Manually:
1. Admin Panel → Safety App → Violations → Add
2. Fill violation details
3. Then create StudentOffence linking to student

### Tracking ESP32 Violations (Real-time):
1. ESP32 sends BLE detection → `/safety/api/ble-log/`
2. YOLO detects violation → `/safety/api/violation/`
3. System automatically creates StudentOffence record
4. Appears in Admin Panel immediately

---

## 📊 DATABASE STRUCTURE

### Student Record:
- Student ID (unique)
- Name
- Email
- Phone UUID (from device)

### Faculty Record:
- Faculty ID (unique)
- Name
- Email
- Phone UUID

### Offence Record:
- Student/Faculty ID
- Violation Type (no_helmet, overspeed, etc.)
- Severity (minor, major, critical)
- Fine Amount (₹)
- Payment Status
- Timestamp

### Violation Report:
- Type (no_helmet, overspeed, traffic_light, etc.)
- Location (gate1, gate2, road1, etc.)
- Evidence (image/description)
- Timestamp

---

## 🔌 ESP32 Integration

### BLE Detection Endpoint:
```bash
POST /safety/api/ble-log/

{
  "reader_id": "gate1",           # Which gate/location
  "phone_uuid": "phone_123",      # Student's phone UUID
  "rssi": -75,                    # Signal strength
  "timestamp": "1234567890"       # ESP32 timestamp (optional)
}
```

### Violation Endpoint:
```bash
POST /safety/api/violation/

{
  "type": "no_helmet",            # Violation type
  "evidence": "base64_image"      # Evidence image
}
```

**System automatically:**
1. ✓ Matches phone_uuid to student
2. ✓ Creates ViolationReport
3. ✓ Creates StudentOffence
4. ✓ Assigns fine amount

---

## ✨ KEY FEATURES NOW WORKING

| Feature | Status | How to Access |
|---------|--------|---------------|
| Admin Signup | ✅ Working | `/api/auth/admin-signup/` OR Admin Panel |
| Admin Login | ✅ Working | `/api/auth/login/` OR Admin Panel Login |
| View Student Offences | ✅ Working | `/safety/api/student-offences/` OR Admin Panel |
| View Faculty Offences | ✅ Working | `/safety/api/faculty-offences/` OR Admin Panel |
| Manage Students | ✅ Working | Admin Panel → Students |
| Manage Faculty | ✅ Working | Admin Panel → Faculty |
| Track Violations | ✅ Working | Admin Panel → Violations |
| ESP32 Integration | ✅ Working | `/safety/api/ble-log/` |
| Real-time Offence Detection | ✅ Working | `/safety/api/violation/` |

---

## 🔒 SECURITY NOTES

**⚠️ IMPORTANT - Change Default Password IMMEDIATELY!**

1. Login to admin panel
2. Click your username (top right)
3. Change password
4. Save

**For Production:**
1. Update SECRET_KEY in settings.py
2. Set DEBUG = False
3. Configure ALLOWED_HOSTS
4. Update CORS settings
5. Migrate to PostgreSQL
6. Set up HTTPS

---

## 📝 API EXAMPLES

### Get JWT Token:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@itsystem.com",
    "password": "Admin@123"
  }'
```

### Fetch Student Offences:
```bash
curl -X GET "http://localhost:8000/safety/api/student-offences/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Filter by Severity:
```bash
curl -X GET "http://localhost:8000/safety/api/student-offences/?severity=major" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search Student:
```bash
curl -X GET "http://localhost:8000/safety/api/student-offences/?search=Raj" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎓 TESTING THE SYSTEM

To verify everything works:

1. **Create a student** (via API or Admin Panel):
   ```bash
   POST /api/auth/signup/
   {
     "name": "Test Student",
     "phone": "9876543210",
     "password": "StudentPass123",
     "registration_id": "STU_001"
   }
   ```

2. **Create violation** (via ESP32 or API):
   ```bash
   POST /safety/api/ble-log/
   {
     "reader_id": "gate1",
     "phone_uuid": "9876543210",
     "rssi": -75
   }
   ```

3. **View in Admin Panel**:
   - Navigate to Safety App → Student Offences
   - Should see the offence created

---

## ❓ COMMON QUESTIONS

**Q: How do students get created in safety_app?**
A: Two ways:
1. Automatically when they sign up via API
2. Manually in Admin Panel → Students → Add

**Q: How are offences created?**
A: Automatically when:
1. ESP32 detects violation via BLE (overspeed, wrong gate)
2. YOLO detects no helmet
3. System matches phone_uuid to student
4. Creates StudentOffence with fine amount

**Q: Can I manually create offences?**
A: Yes! Admin Panel → Safety App → Violations → Add → Then Student Offences → Add

**Q: How to verify ESP32 is sending data?**
A: Check Django logs:
```bash
python manage.py runserver
# Watch for "BLE log received" messages
```

**Q: What if student phone_uuid doesn't match?**
A: Violation is logged but not matched:
```json
{
  "status": "ok",
  "message": "Violation logged, no student matched"
}
```

---

## 🚨 EMERGENCY CONTACTS

If system goes down:
1. Check database: `python manage.py dbshell`
2. Check migrations: `python manage.py migrate --plan`
3. Check logs: `python manage.py runserver`
4. Verify ESP32 endpoint: `/safety/api/ble-log/`

---

## 📞 NEXT STEPS

1. ✅ Test admin login
2. ✅ Create a test student
3. ✅ Create a test violation
4. ✅ Verify in Admin Panel
5. ✅ Configure ESP32 devices
6. **TODO**: Train faculty on system
7. **TODO**: Set up fine payment gateway
8. **TODO**: Create admin mobile app

---

**Everything is ready to use!** 

🎉 **Your admin panel is now fully functional with database integration!** 🎉

Login now: http://localhost:8000/admin/
