# core/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone
import uuid
from datetime import timedelta


class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        """
        Creates and saves a User with the given phone and password.
        """
        if not phone:
            raise ValueError('The Phone number must be set')
        
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given phone and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'admin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(phone, password, **extra_fields)


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        abstract = True


class User(AbstractBaseUser, BaseModel):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('driver', 'Driver'),
        ('admin', 'Admin'),
    )
    
    DRIVER_TYPE_CHOICES = (
        ('bus', 'Bus'),
        ('ambulance', 'Ambulance'),
        (None, 'None'),
    )

    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    password = models.CharField(max_length=255)  # hashed
    registration_id = models.CharField(max_length=50, unique=True, blank=True, null=True)
    dob = models.CharField(max_length=20, blank=True, null=True)  # consider changing to DateField later
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    driver_type = models.CharField(
        max_length=20, choices=DRIVER_TYPE_CHOICES, blank=True, null=True
    )

    # Required for Django authentication system
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'phone'          # login with phone
    REQUIRED_FIELDS = ['name']        # fields prompted when creating superuser

    class Meta:
        indexes = [
            models.Index(fields=['phone']),
            models.Index(fields=['email']),
            models.Index(fields=['registration_id']),
        ]

    def __str__(self):
        return f"{self.name} ({self.role})"


# pending administrator requests submitted from frontend signup page
class PendingAdmin(BaseModel):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # store hashed password
    registration_id = models.CharField(max_length=50, blank=True, null=True)
    dob = models.CharField(max_length=20, blank=True, null=True)
    submitted_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [models.Index(fields=['email']),]

    def save(self, *args, **kwargs):
        # always hash password before saving
        if not self.pk and self.password:
            from django.contrib.auth.hashers import make_password
            self.password = make_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"PendingAdmin {self.email}"

    # Optional: add custom methods if needed
    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        return self.is_staff

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        return self.is_staff


class Vehicle(BaseModel):
    VEHICLE_TYPE_CHOICES = (
        ('bus', 'Bus'),
        ('ambulance', 'Ambulance'),
    )

    vehicle_number = models.CharField(max_length=50, unique=True)
    gps_imei = models.CharField(max_length=100, unique=True)
    barcode = models.CharField(max_length=100, blank=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES)
    assigned_to = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_vehicles'
    )
    assigned_driver_name = models.CharField(max_length=255, blank=True, null=True)
    is_out_of_station = models.BooleanField(default=False)
    current_location = models.JSONField(default=dict, blank=True, null=True)

    def __str__(self):
        return f"{self.vehicle_number} ({self.vehicle_type})"


class Trip(BaseModel):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    driver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    vehicle_number = models.CharField(max_length=50)   # denormalized
    driver_name = models.CharField(max_length=255)     # denormalized
    vehicle_type = models.CharField(max_length=20)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=['is_active', 'vehicle_type']),
            models.Index(fields=['driver', 'is_active']),
        ]


class Booking(BaseModel):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    student_registration_id = models.CharField(max_length=50)
    student_name = models.CharField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20)
    place = models.CharField(max_length=255)
    place_details = models.TextField(blank=True, null=True)
    user_location = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    otp = models.CharField(max_length=6, blank=True, null=True)
    driver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='accepted_bookings')
    driver_name = models.CharField(max_length=255, blank=True, null=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True)
    vehicle_number = models.CharField(max_length=50, blank=True, null=True)
    eta_minutes = models.FloatField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['phone']),
        ]


# ---------------------------------------------------------------------------
# Support ticket / issue reporting for students/public and drivers.  Stored
# in admin panel and can be escalated or deleted by staff.
# ---------------------------------------------------------------------------
class Issue(BaseModel):
    """User submitted issue or query.  Can optionally include a link to a
    screenshot or other external evidence.  The admin interface will allow
    staff to review, escalate ("push") to developers or remove bad requests.

    A reference to ``user`` is kept for authenticated submissions; anonymous
    reports are allowed as well but are harder to follow up on.  ``user_role``
    helps display whether the ticket came from a student or driver.
    """

    ROLE_CHOICES = User.ROLE_CHOICES

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issues'
    )
    user_role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    message = models.TextField()
    screenshot_url = models.URLField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=(
            ('pending', 'Pending'),
            ('pushed', 'Pushed'),
            ('deleted', 'Deleted'),
        ),
        default='pending'
    )

    class Meta:
        indexes = [
            models.Index(fields=['user_role']),
            models.Index(fields=['status']),
        ]


class Offence(BaseModel):
    OFFENCE_TYPE_CHOICES = (
        ('bus_overspeed', 'Bus Overspeed'),
        ('student_speed', 'Student Speed Violation'),
    )

    offence_type = models.CharField(max_length=50, choices=OFFENCE_TYPE_CHOICES)
    driver = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='driver_offences')
    driver_name = models.CharField(max_length=255, blank=True, null=True)
    student = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_offences')
    student_name = models.CharField(max_length=255, blank=True, null=True)
    student_registration_id = models.CharField(max_length=50, blank=True, null=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True)
    vehicle_number = models.CharField(max_length=50, blank=True, null=True)
    speed = models.FloatField()
    speed_limit = models.FloatField()
    location = models.JSONField(default=dict, blank=True, null=True)
    rfid_number = models.CharField(max_length=100, blank=True, null=True)
    is_paid = models.BooleanField(default=False)
    timestamp = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=['offence_type', 'is_paid']),
            models.Index(fields=['timestamp']),
        ]


class RFIDDevice(BaseModel):
    rfid_id = models.CharField(max_length=100, unique=True)
    location_name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.rfid_id} @ {self.location_name}"


class Notification(BaseModel):
    """
    Student notifications for ambulance bookings
    """
    NOTIFICATION_TYPES = (
        ('accepted', 'Driver Accepted'),
        ('rejected', 'Request Rejected'),
        ('eta', 'ETA Update'),
        ('arrived', 'Driver Arrived'),
        ('in_progress', 'On The Way'),
        ('completed', 'Booking Completed'),
    )

    student_phone = models.CharField(max_length=20, db_index=True)  # recipient phone
    booking = models.ForeignKey(
        Booking, 
        on_delete=models.CASCADE, 
        related_name='notifications',
        null=True,
        blank=True
    )
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()
    
    # Driver details to include in notification
    driver_name = models.CharField(max_length=255, blank=True, null=True)
    driver_phone = models.CharField(max_length=20, blank=True, null=True)
    vehicle_number = models.CharField(max_length=50, blank=True, null=True)
    
    is_read = models.BooleanField(default=False)
    
    class Meta:
        indexes = [
            models.Index(fields=['student_phone', 'created_at']),
            models.Index(fields=['is_read']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Notification for {self.student_phone} - {self.notification_type}"