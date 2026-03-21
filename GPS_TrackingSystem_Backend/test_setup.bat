@echo off
REM Testing Script for Admin Request Notification System

echo.
echo ===================================================================
echo    Admin Request Notification System - Testing Script
echo ===================================================================
echo.

cd /d e:\work\DURGA\made_3_10_2026\made-project\GPS_TrackingSystem_Backend

echo [STEP 1] Activating Virtual Environment...
call .venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    exit /b 1
)
echo ✓ Virtual environment activated

echo.
echo [STEP 2] Installing/Verifying Dependencies...
echo Installing Django REST Framework and dependencies...
pip install -q django djangorestframework djangocorsheaders python-decouple

echo ✓ Dependencies verified

echo.
echo [STEP 3] Running Database Migrations...
echo Applying migration 0007_admincreationrequest...
python manage.py migrate core
if %errorlevel% neq 0 (
    echo ERROR: Migration failed
    exit /b 1
)
echo ✓ Migration applied successfully

echo.
echo [STEP 4] Checking if Admin User Exists...
python manage.py shell << EOF
from core.models import User
admin_exists = User.objects.filter(email="admin@gceits.com").exists()
print("✓ Admin user exists" if admin_exists else "⚠ No admin user found")
EOF

echo.
echo [STEP 5] Listing Existing Admin Creation Requests...
python manage.py shell << EOF
from core.models import AdminCreationRequest
requests = AdminCreationRequest.objects.all()
print(f"Total requests: {requests.count()}")
for req in requests:
    print(f"  - {req.name} ({req.email}) - Notified: {req.is_notified}")
EOF

echo.
echo ===================================================================
echo    TESTING COMPLETE!
echo ===================================================================
echo.
echo NEXT STEPS:
echo 1. Run server: python manage.py runserver
echo 2. Go to Django Admin: http://localhost:8000/admin
echo 3. Create a new user with Role = Admin
echo 4. Check API: http://localhost:8000/api/admin/admin-creation-requests/
echo 5. Test Dev Panel: http://localhost:8000/dev_panel/index.html
echo.
echo ===================================================================
echo.

pause
