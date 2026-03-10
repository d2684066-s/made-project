from core.models import Notification

# Create test notification
test_notification = Notification.objects.create(
    student_phone="+91-9876543210",
    notification_type="accepted",
    message="Your ambulance request has been accepted",
    driver_name="John Doe",
    driver_phone="+91-1234567890",
    vehicle_number="AMB-001",
    is_read=False,
    booking=None
)

print("✅ Test notification created successfully")
print(f"   ID: {test_notification.id}")
print(f"   Student Phone: {test_notification.student_phone}")
print(f"   Message: {test_notification.message}")
print(f"   Type: {test_notification.notification_type}")

# Count all notifications
count = Notification.objects.count()
print(f"\n   Total notifications in database: {count}")

# Retrieve by phone
notifications = Notification.objects.filter(student_phone="+91-9876543210").order_by('-created_at')
print(f"   Notifications for phone: {len(notifications)}")
for notif in notifications:
    print(f"   - {notif.notification_type}: {notif.message}")
