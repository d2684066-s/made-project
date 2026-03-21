from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Vehicle, Trip, Booking, Issue, Offence, RFIDDevice, Notification, AdminCreationRequest


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('name', 'phone', 'email', 'role', 'is_staff', 'is_superuser', 'is_active', 'created_at')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'created_at')
    search_fields = ('name', 'phone', 'email', 'registration_id')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'last_login')
    
    fieldsets = (
        ('Personal Info', {'fields': ('name', 'email', 'phone', 'dob', 'registration_id')}),
        ('Role & Access', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
        ('Driver Info', {'fields': ('driver_type',)}),
        ('Timestamps', {'fields': ('created_at', 'last_login')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('name', 'phone', 'email', 'password', 'role', 'is_staff', 'is_superuser'),
        }),
    )
    
    filter_horizontal = ()  # Override parent's filter_horizontal


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('vehicle_number', 'vehicle_type', 'assigned_driver_name', 'is_out_of_station', 'created_at')
    list_filter = ('vehicle_type', 'is_out_of_station', 'created_at')
    search_fields = ('vehicle_number', 'gps_imei', 'assigned_driver_name')
    readonly_fields = ('created_at',)


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('vehicle_number', 'driver_name', 'vehicle_type', 'start_time', 'end_time', 'is_active')
    list_filter = ('vehicle_type', 'is_active', 'start_time')
    search_fields = ('vehicle_number', 'driver_name')
    readonly_fields = ('created_at',)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('student_registration_id', 'student_name', 'phone', 'status', 'vehicle_number', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('student_registration_id', 'student_name', 'phone')
    readonly_fields = ('created_at',)


@admin.register(Issue)
class IssueAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_role', 'status', 'created_at')
    list_filter = ('user_role', 'status', 'created_at')
    search_fields = ('message',)
    readonly_fields = ('created_at',)


@admin.register(Offence)
class OffenceAdmin(admin.ModelAdmin):
    list_display = ('offence_type', 'driver_name', 'student_name', 'speed', 'is_paid', 'timestamp')
    list_filter = ('offence_type', 'is_paid', 'timestamp')
    search_fields = ('driver_name', 'student_name', 'student_registration_id')
    readonly_fields = ('created_at',)


@admin.register(RFIDDevice)
class RFIDDeviceAdmin(admin.ModelAdmin):
    list_display = ('rfid_id', 'location_name', 'created_at')
    search_fields = ('rfid_id', 'location_name')
    readonly_fields = ('created_at',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('student_phone', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('student_phone', 'message')
    readonly_fields = ('created_at',)


@admin.register(AdminCreationRequest)
class AdminCreationRequestAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'registration_id', 'is_notified', 'created_at')
    list_filter = ('is_notified', 'created_at')
    search_fields = ('name', 'email', 'registration_id')
    readonly_fields = ('created_at', 'name', 'email', 'registration_id', 'user')
    ordering = ('-created_at',)