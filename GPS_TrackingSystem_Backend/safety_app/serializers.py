from rest_framework import serializers
from .models import (
    ESP32Device, BLETag, BLEDetection, ViolationReport,
    StudentOffence, FacultyOffence, Student, Faculty
)


class ESP32DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ESP32Device
        fields = ('id', 'device_id', 'device_name', 'is_active', 'description', 'created_at')


class BLETagSerializer(serializers.ModelSerializer):
    class Meta:
        model = BLETag
        fields = ('id', 'tag_uuid', 'tag_name', 'owner_type', 'owner_id', 'is_active', 'created_at')


class BLEDetectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BLEDetection
        fields = ('id', 'tag_uuid', 'phone_uuid', 'reader_id', 'rssi', 'detected_at', 'timestamp', 'created_at')


class ViolationReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ViolationReport
        fields = ('id', 'violation_type', 'timestamp', 'evidence', 'location', 'device', 'created_at')


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ('id', 'student_id', 'name', 'email', 'phone_uuid', 'is_active', 'created_at')


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ('id', 'faculty_id', 'name', 'email', 'phone_uuid', 'is_active', 'created_at')


class StudentOffenceSerializer(serializers.ModelSerializer):
    violation = ViolationReportSerializer(read_only=True)

    class Meta:
        model = StudentOffence
        fields = (
            'id', 'student_id', 'student_name', 'violation', 'severity',
            'fine_amount', 'is_paid', 'paid_date', 'description', 'created_at', 'updated_at'
        )


class FacultyOffenceSerializer(serializers.ModelSerializer):
    violation = ViolationReportSerializer(read_only=True)

    class Meta:
        model = FacultyOffence
        fields = (
            'id', 'faculty_id', 'faculty_name', 'violation', 'severity',
            'fine_amount', 'is_paid', 'paid_date', 'description', 'created_at', 'updated_at'
        )
