# core/serializers.py
from rest_framework import serializers
import uuid
from .models import (
    User, PendingAdmin, Vehicle, Trip, Booking, Offence, RFIDDevice, Issue, Notification, AdminCreationRequest
)
from django.contrib.auth.hashers import make_password, check_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 
            'name', 
            'phone', 
            'email', 
            'registration_id',
            'role', 
            'driver_type', 
            'created_at', 
            'dob'
        ]
        read_only_fields = ['id', 'created_at']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'name', 
            'phone', 
            'password', 
            'registration_id',
            'email', 
            'dob', 
            'role', 
            'driver_type'
        ]

    def validate(self, data):
        role = data.get("role")
        email = data.get("email")

        if role == "student":
            if not email or not str(email).strip().endswith("@gcekjr.ac.in"):
                raise serializers.ValidationError({
                    "email": "Student must register using official @gcekjr.ac.in email"
                })

        return data

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)

class UserLoginSerializer(serializers.Serializer):
    phone = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True)


class PendingAdminSerializer(serializers.ModelSerializer):
    # password is write-only so it is not returned in responses
    password = serializers.CharField(write_only=True)

    class Meta:
        model = PendingAdmin
        fields = ['id', 'name', 'email', 'password', 'registration_id', 'dob', 'submitted_at']
        read_only_fields = ['id', 'submitted_at']

    def validate(self, data):
        if not data.get('phone') and not data.get('email'):
            raise serializers.ValidationError("Phone or email is required")
        return data

class TokenResponseSerializer(serializers.Serializer):
    access_token = serializers.CharField()
    token_type = serializers.CharField(default='bearer')
    user = UserSerializer()

class VehicleSerializer(serializers.ModelSerializer):
    assigned_to = serializers.UUIDField(source='assigned_to.id', read_only=True, allow_null=True)
    assigned_driver_name = serializers.CharField(read_only=True)

    class Meta:
        model = Vehicle
        fields = '__all__'

class VehicleCreateSerializer(serializers.ModelSerializer):
    gps_imei = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Vehicle
        fields = ['vehicle_number', 'gps_imei', 'barcode', 'vehicle_type']

    def create(self, validated_data):
        # if no IMEI provided, generate a placeholder based on the number
        if not validated_data.get('gps_imei'):
            # use vehicle_number plus suffix or use uuid if you prefer
            validated_data['gps_imei'] = f"IMEI_{validated_data.get('vehicle_number','')}_{uuid.uuid4().hex[:8]}"  # unique-ish
        return super().create(validated_data)

class TripSerializer(serializers.ModelSerializer):
    vehicle = serializers.UUIDField(source='vehicle.id')
    driver = serializers.UUIDField(source='driver.id')

    class Meta:
        model = Trip
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    driver = serializers.UUIDField(source='driver.id', read_only=True, allow_null=True)
    vehicle = serializers.UUIDField(source='vehicle.id', read_only=True, allow_null=True)

    # legacy mobile/driver UI uses `pickup_location` property; alias it to `place`
    pickup_location = serializers.CharField(source='place', read_only=True)
    # also expose place_details if the client prefers that naming
    pickup_details = serializers.CharField(source='place_details', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'

class BookingCreateSerializer(serializers.ModelSerializer):
    # student_name is optional when creating a booking; it may be filled by the server
    student_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Booking
        fields = ['student_registration_id', 'student_name', 'phone', 'place', 'place_details', 'user_location']

class OffenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offence
        fields = '__all__'

class RFIDDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = RFIDDevice
        fields = '__all__'

# ---------------------------------------------------------------------------
# Issue / help ticket serializers
# ---------------------------------------------------------------------------
class IssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'status', 'user']

class IssueCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Issue
        fields = ['user_role', 'message', 'screenshot_url']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'student_phone',
            'booking',
            'notification_type',
            'message',
            'driver_name',
            'driver_phone',
            'vehicle_number',
            'is_read',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AdminCreationRequestSerializer(serializers.ModelSerializer):
    """Serializer for tracking admin user creations from Django admin panel"""
    class Meta:
        model = AdminCreationRequest
        fields = [
            'id',
            'name',
            'email',
            'registration_id',
            'is_notified',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
