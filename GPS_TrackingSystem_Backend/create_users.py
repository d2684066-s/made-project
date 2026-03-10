#!/usr/bin/env python
"""Script to create test users"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ITS_backend.settings')
django.setup()

from core.models import User

# Clear existing test users to avoid duplicates
User.objects.filter(phone__in=[
    '9348069612', '9348069615', '9348069614', '9348069616', '9348069617'
]).delete()

# Also clear admin by email if exists
User.objects.filter(email='admin@example.com').delete()

# Create admin with phone
admin_created = User.objects.create_superuser(
    phone='9348069612',
    password='admin123',
    name='Default Admin',
    role='admin'
)
print(f"✓ Admin created: {admin_created.phone} / admin123")

# Also create admin with email for Angular demo access
admin_email = User.objects.create_superuser(
    phone='9348069618',
    email='admin@example.com',
    password='admin',
    name='Admin Demo',
    role='admin'
)
print(f"✓ Admin Email created: {admin_email.email} / admin")

# Create developer user for developer panel
User.objects.filter(email='d2684066@gmail.com').delete()  # Clear if exists
developer = User.objects.create_user(
    phone='9348069619',
    email='d2684066@gmail.com',
    password='Durga@3',
    name='Developer Panel',
    role='admin',
    is_staff=True,
    is_superuser=False
)
print(f"✓ Developer created: {developer.email} / Durga@3")

# Create bus driver
bus_driver = User.objects.create_user(
    phone='9348069615',
    password='ds1',
    name='Bus Driver',
    role='driver',
    driver_type='bus'
)
print(f"✓ Bus Driver created: {bus_driver.phone} / ds1")

# Create student
student = User.objects.create_user(
    phone='9348069614',
    password='ds1',
    name='Student',
    role='student'
)
print(f"✓ Student created: {student.phone} / ds1")

# Create ambulance driver 1
ambulance1 = User.objects.create_user(
    phone='9348069616',
    password='ds1',
    name='Ambulance Driver 1',
    role='driver',
    driver_type='ambulance'
)
print(f"✓ Ambulance Driver 1 created: {ambulance1.phone} / ds1")

# Create ambulance driver 2
ambulance2 = User.objects.create_user(
    phone='9348069617',
    password='ds1',
    name='Ambulance Driver 2',
    role='driver',
    driver_type='ambulance'
)
print(f"✓ Ambulance Driver 2 created: {ambulance2.phone} / ds1")

print("\n✅ All users created successfully!")
