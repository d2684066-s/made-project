from django.contrib import admin
from .models import (
    ESP32Device, BLETag, BLEDetection, ViolationReport,
    StudentOffence, FacultyOffence, Student, Faculty
)


@admin.register(ESP32Device)
class ESP32DeviceAdmin(admin.ModelAdmin):
    list_display = ('device_id', 'device_name', 'is_active', 'created_at')
    search_fields = ('device_id', 'device_name')
    list_filter = ('is_active', 'created_at')


@admin.register(BLETag)
class BLETagAdmin(admin.ModelAdmin):
    list_display = ('tag_uuid', 'tag_name', 'owner_type', 'owner_id', 'is_active')
    search_fields = ('tag_uuid', 'tag_name', 'owner_id')
    list_filter = ('owner_type', 'is_active')


@admin.register(BLEDetection)
class BLEDetectionAdmin(admin.ModelAdmin):
    list_display = ('tag_uuid', 'phone_uuid', 'reader_id', 'rssi', 'detected_at')
    search_fields = ('tag_uuid', 'phone_uuid')
    list_filter = ('detected_at', 'reader_id')
    readonly_fields = ('created_at', 'detected_at')


@admin.register(ViolationReport)
class ViolationReportAdmin(admin.ModelAdmin):
    list_display = ('violation_type', 'timestamp', 'location', 'device')
    search_fields = ('violation_type', 'location')
    list_filter = ('violation_type', 'timestamp')
    readonly_fields = ('created_at', 'timestamp')


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'name', 'email', 'is_active', 'created_at')
    search_fields = ('student_id', 'name', 'email')
    list_filter = ('is_active', 'created_at')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ('faculty_id', 'name', 'email', 'is_active', 'created_at')
    search_fields = ('faculty_id', 'name', 'email')
    list_filter = ('is_active', 'created_at')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(StudentOffence)
class StudentOffenceAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'student_name', 'severity', 'fine_amount', 'is_paid', 'created_at')
    search_fields = ('student_id', 'student_name')
    list_filter = ('severity', 'is_paid', 'created_at')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(FacultyOffence)
class FacultyOffenceAdmin(admin.ModelAdmin):
    list_display = ('faculty_id', 'faculty_name', 'severity', 'fine_amount', 'is_paid', 'created_at')
    search_fields = ('faculty_id', 'faculty_name')
    list_filter = ('severity', 'is_paid', 'created_at')
    readonly_fields = ('created_at', 'updated_at')
