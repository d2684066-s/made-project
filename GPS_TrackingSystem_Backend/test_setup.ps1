# Testing Script for Admin Request Notification System - PowerShell Version

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "   Admin Request Notification System - Testing Script" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$basePath = "e:\work\DURGA\made_3_10_2026\made-project\GPS_TrackingSystem_Backend"
Set-Location $basePath

# Step 1: Activate Virtual Environment
Write-Host "[STEP 1] Activating Virtual Environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to activate virtual environment" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Virtual environment activated" -ForegroundColor Green

# Step 2: Install Dependencies
Write-Host ""
Write-Host "[STEP 2] Installing/Verifying Dependencies..." -ForegroundColor Yellow
Write-Host "Installing Django and DRF..." -ForegroundColor Gray
python -m pip install -q django djangorestframework djangocorsheaders python-decouple
Write-Host "✓ Dependencies verified" -ForegroundColor Green

# Step 3: Run Migrations
Write-Host ""
Write-Host "[STEP 3] Running Database Migrations..." -ForegroundColor Yellow
Write-Host "Applying migration 0007_admincreationrequest..." -ForegroundColor Gray
python manage.py migrate core

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Migration failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Migration applied successfully" -ForegroundColor Green

# Step 4: Check Admin User
Write-Host ""
Write-Host "[STEP 4] Checking Admin User..." -ForegroundColor Yellow
$adminCheck = python -c "from core.models import User; print('YES' if User.objects.filter(email='admin@gceits.com').exists() else 'NO')"
if ($adminCheck -eq "YES") {
    Write-Host "✓ Admin user exists" -ForegroundColor Green
} else {
    Write-Host "⚠ No admin user found - one was seeded during migration" -ForegroundColor Yellow
}

# Step 5: Show Existing Requests
Write-Host ""
Write-Host "[STEP 5] Listing Admin Creation Requests..." -ForegroundColor Yellow
python << 'PYEOF'
from core.models import AdminCreationRequest
requests = AdminCreationRequest.objects.all()
print(f"Total requests: {requests.count()}")
if requests.count() > 0:
    for req in requests:
        status = "Notified" if req.is_notified else "Pending"
        print(f"  - {req.name} ({req.email}) - Status: {status}")
else:
    print("  (None yet - create an admin in Django admin to generate one)")
PYEOF

Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "    SETUP COMPLETE! Ready to Test" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Green
Write-Host "  1. Run Django server:"
Write-Host "     python manage.py runserver" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. In another terminal, test API endpoints:"
Write-Host "     curl http://localhost:8000/api/admin/admin-creation-requests/" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Go to Django Admin:"
Write-Host "     http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host "     Create a new user with Role=Admin"
Write-Host ""
Write-Host "  4. Check the API again:"
Write-Host "     curl http://localhost:8000/api/admin/admin-creation-requests/" -ForegroundColor Cyan
Write-Host "     (Should show your new admin user)"
Write-Host ""
Write-Host "  5. Test the Dev Panel:"
Write-Host "     http://localhost:8000/dev_panel/index.html" -ForegroundColor Cyan
Write-Host "     Or wherever your dev panel frontend is hosted"
Write-Host ""
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

$null = Read-Host "Press Enter to exit"
