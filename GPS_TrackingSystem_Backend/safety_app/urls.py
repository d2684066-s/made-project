from django.urls import path
from . import views

urlpatterns = [
    # BLE & Violation endpoints
    path('ble-log/', views.ble_log, name='ble_log'),
    path('violation/', views.violation_report, name='violation_report'),
    path('test-challan/', views.test_challan, name='test_challan'),
    
    # Admin panel - Offence endpoints
    path('student-offences/', views.StudentOffencesView.as_view(), name='student_offences'),
    path('faculty-offences/', views.FacultyOffencesView.as_view(), name='faculty_offences'),
    
    # Admin panel - Student/Faculty endpoints
    path('students/', views.StudentsListView.as_view(), name='students_list'),
    path('faculty/', views.FacultyListView.as_view(), name='faculty_list'),
    
    # Admin panel - Violation & Detection endpoints
    path('violations/', views.ViolationReportsView.as_view(), name='violations_list'),
    path('ble-detections/', views.BLEDetectionsView.as_view(), name='ble_detections'),
    path('esp32-devices/', views.ESP32DevicesView.as_view(), name='esp32_devices'),
]