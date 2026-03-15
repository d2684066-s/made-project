from django.db import models
from django.utils import timezone
import uuid


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class ESP32Device(BaseModel):
    """Mock ESP-32 device tracking"""
    device_id = models.CharField(max_length=100, unique=True)
    device_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.device_name} ({self.device_id})"

    class Meta:
        ordering = ['-created_at']


class BLETag(BaseModel):
    """Student/Faculty BLE tag for detection"""
    tag_uuid = models.CharField(max_length=100, unique=True)
    tag_name = models.CharField(max_length=255)
    owner_type = models.CharField(
        max_length=20,
        choices=[('student', 'Student'), ('faculty', 'Faculty')],
        default='student'
    )
    owner_id = models.CharField(max_length=255, blank=True)  # Student/Faculty ID
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.tag_name} ({self.tag_uuid})"

    class Meta:
        ordering = ['-created_at']


class BLEDetection(BaseModel):
    """Log of BLE tag detections (from mock sender)"""
    tag = models.ForeignKey(BLETag, on_delete=models.CASCADE, null=True, blank=True)
    tag_uuid = models.CharField(max_length=100)
    phone_uuid = models.CharField(max_length=255, blank=True, null=True)  # Phone/device identifier
    reader_id = models.CharField(max_length=100, blank=True, null=True)  # Gate/reader location
    rssi = models.IntegerField()  # Signal strength
    detected_at = models.DateTimeField(auto_now_add=True)
    timestamp = models.DateTimeField(blank=True, null=True)  # Optional: custom timestamp from ESP32
    device = models.ForeignKey(ESP32Device, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Detection: {self.tag_uuid} @ {self.detected_at}"

    class Meta:
        ordering = ['-detected_at']


class ViolationReport(BaseModel):
    """Violation reports (helmet, speed, etc.)"""
    VIOLATION_TYPES = [
        ('no_helmet', 'No Helmet'),
        ('overspeed', 'Overspeed'),
        ('traffic_light', 'Red Light'),
        ('wrong_lane', 'Wrong Lane'),
        ('other', 'Other'),
    ]
    
    violation_type = models.CharField(max_length=50, choices=VIOLATION_TYPES)
    timestamp = models.DateTimeField(auto_now_add=True)
    evidence = models.TextField(blank=True)  # Base64 image or description
    location = models.CharField(max_length=255, blank=True)
    device = models.ForeignKey(ESP32Device, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.violation_type} @ {self.timestamp}"

    class Meta:
        ordering = ['-timestamp']


class Student(BaseModel):
    """Student profile for safety system"""
    student_id = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    phone_uuid = models.CharField(max_length=255, unique=True, blank=True, null=True)  # Phone device identifier
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.student_id} - {self.name}"

    class Meta:
        ordering = ['student_id']


class Faculty(BaseModel):
    """Faculty profile for safety system"""
    faculty_id = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    phone_uuid = models.CharField(max_length=255, unique=True, blank=True, null=True)  # Phone device identifier
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.faculty_id} - {self.name}"

    class Meta:
        ordering = ['faculty_id']


class StudentOffence(BaseModel):
    """Student offences (violations while traveling)"""
    student_id = models.CharField(max_length=255)
    student_name = models.CharField(max_length=255, blank=True)
    violation = models.ForeignKey(ViolationReport, on_delete=models.CASCADE)
    severity = models.CharField(
        max_length=20,
        choices=[('minor', 'Minor'), ('major', 'Major'), ('critical', 'Critical')],
        default='minor'
    )
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateTimeField(null=True, blank=True)
    receipt_pdf = models.FileField(upload_to='offence_receipts/students/', null=True, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"Student {self.student_id}: {self.violation.violation_type}"

    class Meta:
        ordering = ['-created_at']


class FacultyOffence(BaseModel):
    """Faculty offences (violations while on duty)"""
    faculty_id = models.CharField(max_length=255)
    faculty_name = models.CharField(max_length=255, blank=True)
    violation = models.ForeignKey(ViolationReport, on_delete=models.CASCADE)
    severity = models.CharField(
        max_length=20,
        choices=[('minor', 'Minor'), ('major', 'Major'), ('critical', 'Critical')],
        default='minor'
    )
    fine_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateTimeField(null=True, blank=True)
    receipt_pdf = models.FileField(upload_to='offence_receipts/faculty/', null=True, blank=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"Faculty {self.faculty_id}: {self.violation.violation_type}"

    class Meta:
        ordering = ['-created_at']
