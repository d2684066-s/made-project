from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.shortcuts import get_object_or_404
from datetime import timedelta
import json
from .models import (
    BLEDetection, BLETag, ViolationReport, 
    StudentOffence, FacultyOffence, ESP32Device, Student, Faculty
)


@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([AllowAny])
def ble_log(request):
    """Log BLE tag detections from ESP32 (gate1/gate2)"""
    try:
        data = json.loads(request.body)
        reader_id = data.get('reader_id', 'unknown')
        phone_uuid = data.get('phone_uuid', '')
        rssi = data.get('rssi', -80)
        timestamp_str = data.get('timestamp', '')

        # Parse timestamp safely. Keep server time fallback for invalid or boot-millis inputs.
        timestamp = timezone.now()
        try:
            if isinstance(timestamp_str, str) and timestamp_str.isdigit():
                raw_ts = int(timestamp_str)
                if raw_ts >= 10**12:
                    timestamp = timezone.datetime.fromtimestamp(raw_ts / 1000.0, tz=timezone.utc)
                elif raw_ts >= 10**9:
                    timestamp = timezone.datetime.fromtimestamp(raw_ts, tz=timezone.utc)
            elif isinstance(timestamp_str, str) and timestamp_str:
                parsed_ts = parse_datetime(timestamp_str)
                if parsed_ts is not None:
                    if timezone.is_naive(parsed_ts):
                        parsed_ts = timezone.make_aware(parsed_ts, timezone.get_current_timezone())
                    timestamp = parsed_ts
        except Exception:
            timestamp = timezone.now()

        print(f"BLE log received: {reader_id} | UUID: {phone_uuid} | RSSI: {rssi}")

        # Avoid duplicates: same UUID + reader in last 30s
        recent = BLEDetection.objects.filter(
            phone_uuid=phone_uuid,
            reader_id=reader_id,
            timestamp__gte=timestamp - timedelta(seconds=30)
        ).exists()
        if recent:
            print("Duplicate detection - ignored")
            return JsonResponse({'status': 'ok', 'message': 'Duplicate ignored'}, status=200)

        # Save detection
        detection = BLEDetection.objects.create(
            phone_uuid=phone_uuid,
            rssi=rssi,
            reader_id=reader_id,
            timestamp=timestamp
        )
        print(f"BLE saved: ID={detection.id}")

        # Overspeed check (only on gate2/road1)
        if reader_id in ['road1', 'gate2']:
            recent_gate1 = BLEDetection.objects.filter(
                phone_uuid=phone_uuid,
                reader_id='gate1',
                timestamp__gte=timestamp - timedelta(seconds=60),
                timestamp__lt=timestamp
            ).order_by('-timestamp').first()

            if recent_gate1 and recent_gate1.timestamp:
                time_diff = (timestamp - recent_gate1.timestamp).total_seconds()
                if time_diff <= 0:
                    return JsonResponse({'status': 'ok', 'message': 'BLE log saved'}, status=201)

                distance = 30  # meters between gates
                speed = (distance / time_diff) * 3.6  # km/h

                if speed > 20:
                    violation = ViolationReport.objects.create(
                        violation_type='overspeed',
                        timestamp=timestamp,
                        evidence=f"Speed {speed:.1f} km/h between {recent_gate1.reader_id} and {reader_id}",
                        location=reader_id
                    )

                    student = Student.objects.filter(phone_uuid=phone_uuid).first()
                    faculty = Faculty.objects.filter(phone_uuid=phone_uuid).first()

                    if student:
                        StudentOffence.objects.create(
                            student_id=student.student_id,
                            student_name=student.name,
                            violation=violation,
                            severity='major',
                            fine_amount=700,
                            description=f"Overspeed {speed:.1f} km/h"
                        )
                        print(f"Overspeed challan for {student.name}: Rs 700")
                    elif faculty:
                        FacultyOffence.objects.create(
                            faculty_id=faculty.faculty_id,
                            faculty_name=faculty.name,
                            violation=violation,
                            severity='major',
                            fine_amount=700,
                            description=f"Overspeed {speed:.1f} km/h"
                        )
                        print(f"Overspeed challan for {faculty.name}: Rs 700")

        return JsonResponse({'status': 'ok', 'message': 'BLE log saved'}, status=201)

    except json.JSONDecodeError as je:
        print("JSON error:", str(je))
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        print("BLE log error:", str(e))
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([AllowAny])
def violation_report(request):
    """Receive helmet violation from YOLO script"""
    try:
        data = json.loads(request.body)
        violation_type = data.get('type', 'no_helmet')
        evidence = data.get('evidence', '')
        timestamp = timezone.now()

        print(f"Violation report received: {violation_type}")

        # Try to match to recent BLE detection (last 10s)
        recent_ble = BLEDetection.objects.filter(
            timestamp__gte=timestamp - timedelta(seconds=10)
        ).order_by('-timestamp').first()

        if recent_ble:
            student = Student.objects.filter(phone_uuid=recent_ble.phone_uuid).first()
            if student:
                violation = ViolationReport.objects.create(
                    violation_type=violation_type,
                    timestamp=timestamp,
                    evidence=evidence,
                    location=recent_ble.reader_id
                )
                StudentOffence.objects.create(
                    student_id=student.student_id,
                    student_name=student.name,
                    violation=violation,
                    severity='minor',
                    fine_amount=300,
                    description="No helmet detected on CCTV"
                )
                print(f"Helmet challan for {student.name}: Rs 300")
                return JsonResponse({'status': 'ok', 'challan_created': True}, status=201)

        return JsonResponse({'status': 'ok', 'message': 'Violation logged, no student matched'}, status=201)

    except Exception as e:
        print("Violation report error:", str(e))
        return JsonResponse({'error': str(e)}, status=500)


def test_challan(request):
    return HttpResponse("<h2>Test Challan</h2><p>Student ABC123 - No Helmet at Gate1 - Rs 300</p><p>Overspeed at Gate2 - Rs 700</p>")


# ────────────────────────────────────────────────
# API Views for Admin Panel - Offence Tracking
# ────────────────────────────────────────────────

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.db import IntegrityError
from core.permissions import IsAdmin
from .serializers import (
    StudentOffenceSerializer, FacultyOffenceSerializer,
    StudentSerializer, FacultySerializer,
    BLEDetectionSerializer, ViolationReportSerializer,
    ESP32DeviceSerializer, BLETagSerializer
)


class StudentOffencesView(APIView):
    """Fetch all student offences from the safety system"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get student offences with optional filtering"""
        try:
            # Default admin sheet to today's offences; this naturally resets after midnight.
            today = timezone.localdate()
            offences = StudentOffence.objects.filter(created_at__date=today).order_by('-created_at')

            if request.query_params.get('all', '').lower() == 'true':
                offences = StudentOffence.objects.all().order_by('-created_at')
            
            # Optional filtering
            student_id = request.query_params.get('student_id')
            severity = request.query_params.get('severity')
            is_paid = request.query_params.get('is_paid')
            search = request.query_params.get('search')
            
            if student_id:
                offences = offences.filter(student_id=student_id)
            if severity:
                offences = offences.filter(severity=severity)
            if is_paid is not None:
                is_paid_bool = is_paid.lower() == 'true'
                offences = offences.filter(is_paid=is_paid_bool)
            if search:
                offences = offences.filter(
                    Q(student_id__icontains=search) |
                    Q(student_name__icontains=search)
                )
            
            serializer = StudentOffenceSerializer(offences, many=True, context={'request': request})
            return Response({
                'count': offences.count(),
                'offences': serializer.data
            })
        except Exception as e:
            print(f"Error fetching student offences: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FacultyOffencesView(APIView):
    """Fetch all faculty offences from the safety system"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get faculty offences with optional filtering"""
        try:
            # Default admin sheet to today's offences; this naturally resets after midnight.
            today = timezone.localdate()
            offences = FacultyOffence.objects.filter(created_at__date=today).order_by('-created_at')

            if request.query_params.get('all', '').lower() == 'true':
                offences = FacultyOffence.objects.all().order_by('-created_at')
            
            # Optional filtering
            faculty_id = request.query_params.get('faculty_id')
            severity = request.query_params.get('severity')
            is_paid = request.query_params.get('is_paid')
            search = request.query_params.get('search')
            
            if faculty_id:
                offences = offences.filter(faculty_id=faculty_id)
            if severity:
                offences = offences.filter(severity=severity)
            if is_paid is not None:
                is_paid_bool = is_paid.lower() == 'true'
                offences = offences.filter(is_paid=is_paid_bool)
            if search:
                offences = offences.filter(
                    Q(faculty_id__icontains=search) |
                    Q(faculty_name__icontains=search)
                )
            
            serializer = FacultyOffenceSerializer(offences, many=True, context={'request': request})
            return Response({
                'count': offences.count(),
                'offences': serializer.data
            })
        except Exception as e:
            print(f"Error fetching faculty offences: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StudentOffenceMarkPaidView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, offence_id):
        offence = get_object_or_404(StudentOffence, id=offence_id)
        receipt_file = request.FILES.get('receipt_pdf')

        if not receipt_file:
            return Response({'detail': 'receipt_pdf is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not receipt_file.name.lower().endswith('.pdf'):
            return Response({'detail': 'Only PDF files are allowed'}, status=status.HTTP_400_BAD_REQUEST)

        offence.receipt_pdf = receipt_file
        offence.is_paid = True
        offence.paid_date = timezone.now()
        offence.save()

        serializer = StudentOffenceSerializer(offence, context={'request': request})
        return Response({'message': 'Student offence marked as paid', 'offence': serializer.data})


class FacultyOffenceMarkPaidView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, offence_id):
        offence = get_object_or_404(FacultyOffence, id=offence_id)
        receipt_file = request.FILES.get('receipt_pdf')

        if not receipt_file:
            return Response({'detail': 'receipt_pdf is required'}, status=status.HTTP_400_BAD_REQUEST)

        if not receipt_file.name.lower().endswith('.pdf'):
            return Response({'detail': 'Only PDF files are allowed'}, status=status.HTTP_400_BAD_REQUEST)

        offence.receipt_pdf = receipt_file
        offence.is_paid = True
        offence.paid_date = timezone.now()
        offence.save()

        serializer = FacultyOffenceSerializer(offence, context={'request': request})
        return Response({'message': 'Faculty offence marked as paid', 'offence': serializer.data})


class StudentsListView(APIView):
    """Fetch all students from safety system database"""
    permission_classes = [IsAdmin]

    def get(self, request):
        """Get students with optional filtering"""
        try:
            students = Student.objects.all().order_by('student_id')
            
            search = request.query_params.get('search')
            if search:
                students = students.filter(
                    Q(student_id__icontains=search) |
                    Q(name__icontains=search) |
                    Q(email__icontains=search) |
                    Q(phone_uuid__icontains=search) |
                    Q(phone_number__icontains=search)
                )
            
            serializer = StudentSerializer(students, many=True)
            return Response({
                'count': students.count(),
                'students': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Create/update student profile from admin offence page modal"""
        registration_number = (request.data.get('registration_number') or request.data.get('student_id') or '').strip()
        name = (request.data.get('name') or '').strip()
        phone_uuid = (request.data.get('uuid') or request.data.get('phone_uuid') or '').strip()
        phone_number = (request.data.get('phone_number') or '').strip() or None
        email = (request.data.get('email') or '').strip() or None

        if not registration_number or not name or not phone_uuid:
            return Response(
                {'detail': 'registration_number, name and uuid are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            student, created = Student.objects.update_or_create(
                student_id=registration_number,
                defaults={
                    'name': name,
                    'email': email,
                    'phone_uuid': phone_uuid,
                    'phone_number': phone_number,
                    'is_active': True,
                }
            )
            serializer = StudentSerializer(student)
            return Response(
                {
                    'message': 'Student created successfully' if created else 'Student updated successfully',
                    'student': serializer.data,
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except IntegrityError:
            return Response(
                {'detail': 'UUID must be unique. This uuid is already used by another profile.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FacultyListView(APIView):
    """Fetch all faculty from safety system database"""
    permission_classes = [IsAdmin]

    def get(self, request):
        """Get faculty with optional filtering"""
        try:
            faculty = Faculty.objects.all().order_by('faculty_id')
            
            search = request.query_params.get('search')
            if search:
                faculty = faculty.filter(
                    Q(faculty_id__icontains=search) |
                    Q(name__icontains=search) |
                    Q(email__icontains=search) |
                    Q(phone_uuid__icontains=search) |
                    Q(phone_number__icontains=search)
                )
            
            serializer = FacultySerializer(faculty, many=True)
            return Response({
                'count': faculty.count(),
                'faculty': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Create/update faculty profile from admin offence page modal"""
        registration_number = (request.data.get('registration_number') or request.data.get('faculty_id') or '').strip()
        name = (request.data.get('name') or '').strip()
        phone_uuid = (request.data.get('uuid') or request.data.get('phone_uuid') or '').strip()
        phone_number = (request.data.get('phone_number') or '').strip() or None
        email = (request.data.get('email') or '').strip() or None

        if not registration_number or not name or not phone_uuid:
            return Response(
                {'detail': 'registration_number, name and uuid are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            faculty, created = Faculty.objects.update_or_create(
                faculty_id=registration_number,
                defaults={
                    'name': name,
                    'email': email,
                    'phone_uuid': phone_uuid,
                    'phone_number': phone_number,
                    'is_active': True,
                }
            )
            serializer = FacultySerializer(faculty)
            return Response(
                {
                    'message': 'Faculty created successfully' if created else 'Faculty updated successfully',
                    'faculty': serializer.data,
                },
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except IntegrityError:
            return Response(
                {'detail': 'UUID must be unique. This uuid is already used by another profile.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FacultyDetailView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, faculty_id):
        deleted, _ = Faculty.objects.filter(id=faculty_id).delete()
        if deleted == 0:
            return Response({"detail": "Faculty not found"}, status=404)
        return Response({"message": "Faculty deleted successfully"})


class ViolationReportsView(APIView):
    """Fetch all violation reports from ESP32"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get violation reports with optional filtering"""
        try:
            reports = ViolationReport.objects.all().order_by('-timestamp')
            
            # Optional filtering
            violation_type = request.query_params.get('violation_type')
            location = request.query_params.get('location')
            
            if violation_type:
                reports = reports.filter(violation_type=violation_type)
            if location:
                reports = reports.filter(location=location)
            
            serializer = ViolationReportSerializer(reports, many=True)
            return Response({
                'count': reports.count(),
                'violations': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BLEDetectionsView(APIView):
    """Fetch all BLE detections from ESP32 devices"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get BLE detections with optional filtering"""
        try:
            detections = BLEDetection.objects.all().order_by('-detected_at')
            
            # Optional filtering
            phone_uuid = request.query_params.get('phone_uuid')
            reader_id = request.query_params.get('reader_id')
            limit = request.query_params.get('limit', 100)
            
            if phone_uuid:
                detections = detections.filter(phone_uuid=phone_uuid)
            if reader_id:
                detections = detections.filter(reader_id=reader_id)
            
            detections = detections[:int(limit)]
            
            serializer = BLEDetectionSerializer(detections, many=True)
            return Response({
                'count': len(detections),
                'detections': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ESP32DevicesView(APIView):
    """Fetch all connected ESP32 devices"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get ESP32 devices"""
        try:
            devices = ESP32Device.objects.all().order_by('device_name')
            
            search = request.query_params.get('search')
            if search:
                devices = devices.filter(
                    Q(device_id__icontains=search) |
                    Q(device_name__icontains=search)
                )
            
            serializer = ESP32DeviceSerializer(devices, many=True)
            return Response({
                'count': devices.count(),
                'devices': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )