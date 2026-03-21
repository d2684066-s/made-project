from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth.hashers import check_password, make_password
from django.db.models import Q 
from django.utils import timezone
from django.core.cache import cache
import logging

from .models import User, PendingAdmin, Vehicle, Booking, Offence, RFIDDevice, Trip, Issue, AdminCreationRequest
from .serializers import (
    UserCreateSerializer, UserLoginSerializer, UserSerializer,
    TokenResponseSerializer, BookingCreateSerializer, BookingSerializer,
    VehicleSerializer, VehicleCreateSerializer,
    TripSerializer,
    OffenceSerializer,
    RFIDDeviceSerializer,
    IssueSerializer, IssueCreateSerializer,
    PendingAdminSerializer,
    AdminCreationRequestSerializer,
)
from .utils import (
    create_access_token, send_otp_mock, verify_otp_mock, generate_otp,
    calculate_distance, calculate_eta, get_google_distance_matrix
)
from .permissions import IsAdmin, IsDriver
from rest_framework_simplejwt.tokens import RefreshToken
from tracking.services.eta_engine import calculate_live_eta, LIVE_ETA_CACHE_KEY

logger = logging.getLogger(__name__)

#Generally this part helps to handle requests in django
#This is the controller part (MVC architecture same as spring boot)
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserCreateSerializer(data=request.data)

        if serializer.is_valid():
            try:
                user = serializer.save()
                token = create_access_token(user)

                logger.info(f"New user created: {user.id}")

                # use 201 Created for new resources
                return Response({
                    "access_token": token,
                    "token_type": "bearer",
                    "user": UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                logger.error(f"Signup failed: {str(e)}")
                return Response({"detail": "Something went wrong"}, status=500)

        logger.warning(f"Invalid signup data: {serializer.errors}")
        return Response(serializer.errors, status=400)


# Admin Signup View (for new administrator registration)
class AdminSignupView(APIView):
    """
    Handle new administrator registration - directly creates admin user.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # Validate required fields
        required_fields = ['name', 'email', 'password', 'dob', 'registration_id']
        if not all(request.data.get(field) for field in required_fields):
            return Response(
                {"detail": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = request.data.get('email')
        
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "Email is already registered"},
                status=status.HTTP_400_BAD_REQUEST
            )

        phone = f"admin_{request.data.get('registration_id')}"
        # Check if phone already exists
        if User.objects.filter(phone=phone).exists():
            return Response(
                {"detail": "Registration ID is already registered"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Create the admin user directly
            password = request.data.get('password')
            
            # Check if password is already hashed (from pending admin approval)
            is_hashed = password and password.startswith('pbkdf2_sha256$')
            
            user = User.objects.create_user(
                phone=f"admin_{request.data.get('registration_id')}",
                password=password,
                name=request.data.get('name'),
                email=email,
                dob=request.data.get('dob'),
                registration_id=request.data.get('registration_id'),
                role='admin',
                is_staff=True,
                is_superuser=False,
                is_active=True
            )

            # If password was already hashed, set it directly to avoid double-hashing
            if is_hashed:
                user.password = password
                user.save()

            logger.info(f"New admin created: {user.email}")

            return Response({
                "message": "Admin account created successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Admin signup failed: {str(e)}")
            return Response(
                {"detail": "Failed to create admin account"},
                status=500
            )


# Developer Panel Endpoint - Create Admin User (after approval)
class CreateApprovedAdminView(APIView):
    """
    Alternative endpoint for creating admin users - same as AdminSignupView.
    Can be used by developer panel after approving a request.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        required_fields = ['name', 'email', 'password', 'dob', 'registration_id']
        
        if not all(request.data.get(field) for field in required_fields):
            return Response(
                {"detail": "All fields are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Check if user already exists
            if User.objects.filter(email=request.data.get('email')).exists():
                return Response(
                    {"detail": "Admin with this email already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create the admin user
            user = User.objects.create_user(
                phone=f"admin_{request.data.get('registration_id')}",
                password=request.data.get('password'),
                name=request.data.get('name'),
                email=request.data.get('email'),
                dob=request.data.get('dob'),
                registration_id=request.data.get('registration_id'),
                role='admin',
                is_staff=True,
                is_superuser=False,  # Regular admin, not super admin
                is_active=True
            )

            logger.info(f"New admin created: {user.email}")

            return Response({
                "message": "Admin account created successfully",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Failed to create admin: {str(e)}")
            return Response(
                {"detail": "Failed to create admin account"},
                status=500
            )


# User Login Api
class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)

        if not serializer.is_valid():
            logger.warning("Login validation failed")
            return Response(
                {"error": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = serializer.validated_data
        phone = data.get("phone")
        email = data.get("email")
        password = data.get("password")

        logger.info(f"Login attempt: email={email}, phone={phone}")

        # manually authenticate since AuthService is not defined
        user = None
        if phone:
            try:
                user = User.objects.get(phone=phone)
                logger.info(f"Found user by phone: {user.email}")
            except User.DoesNotExist:
                logger.warning(f"No user found with phone: {phone}")
                user = None
        elif email:
            try:
                user = User.objects.get(email__iexact=email)
                logger.info(f"Found user by email: {user.email}, is_active: {user.is_active}")
            except User.DoesNotExist:
                logger.warning(f"No user found with email: {email}")
                user = None

        if not user:
            logger.warning(f"Authentication failed: user not found")
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        password_valid = check_password(password, user.password)
        logger.info(f"Password check for {user.email}: {password_valid}")
        
        if not password_valid:
            logger.warning(f"Authentication failed: invalid password for {user.email}")
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        token = create_access_token(user)
        return Response({
            "access_token": token,
            "token_type": "Bearer",
            "user": UserSerializer(user).data
        })

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        # allow the user to update their own profile (name, phone, email, dob, etc.)
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response({"detail": "Phone required"}, status=400)

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        otp = generate_otp()
        send_otp_mock(phone, otp)
        # In real app → send via SMS gateway

        return Response({
            "message": "OTP sent successfully",
            # "otp": otp   # ← remove this in production!
        })


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        if not all([phone, otp, new_password]):
            return Response({"detail": "All fields required"}, status=400)

        if not verify_otp_mock(phone, otp):
            return Response({"detail": "Invalid or expired OTP"}, status=400)

        try:
            user = User.objects.get(phone=phone)
            user.password = make_password(new_password)
            user.save()
            return Response({"message": "Password reset successfully"})
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)


# ────────────────────────────────────────────────
# Example: Public - Book Ambulance (student side)
# ────────────────────────────────────────────────
# core/views.py
class BookAmbulanceView(APIView):
    permission_classes = [AllowAny]  # Allow for development - change to IsAuthenticated in production

    def post(self, request):
        data = request.data.copy()
        
        # if user is logged in, prefer their name/registration id
        if request.user and getattr(request.user, 'is_authenticated', False):
            if not data.get('student_name'):
                data['student_name'] = request.user.name or ''
            if not data.get('student_registration_id'):
                data['student_registration_id'] = request.user.registration_id or ''

        # Ensure student_name is present (may still be empty)
        if 'student_name' not in data or not data['student_name']:
            data['student_name'] = ''
        
        serializer = BookingCreateSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        # Extract validated data; pop student_name so we don't pass it twice to create()
        validated_data = serializer.validated_data
        # ensure phone matches authenticated user if present (fix schedule visibility bugs)
        if request.user and getattr(request.user, 'is_authenticated', False):
            validated_data['phone'] = request.user.phone or validated_data.get('phone', '')
        student_name = validated_data.pop('student_name', '')
        student_reg_id = validated_data.get('student_registration_id', '')

        # fill name from registration id if still blank
        if not student_name and student_reg_id:
            try:
                student = User.objects.get(registration_id=student_reg_id)
                student_name = student.name
            except User.DoesNotExist:
                # Leave student_name blank so frontend can display registration ID
                student_name = None

        # Create the booking with the name filled
        booking = Booking.objects.create(
            **validated_data,
            student_name=student_name,
        )

        # Return the full serialized booking
        return Response(BookingSerializer(booking).data, status=201)


# Add more views later (get active buses, pending bookings, etc.)

# ────────────────────────────────────────────────
# Driver Endpoints
# ────────────────────────────────────────────────

class AvailableVehiclesView(APIView):
    permission_classes = [IsDriver]

    def get(self, request, vehicle_type):
        vehicles = Vehicle.objects.filter(
            vehicle_type=vehicle_type
        ).filter(
            Q(assigned_to__isnull=True) | Q(assigned_to=request.user)
        )
        serializer = VehicleSerializer(vehicles, many=True)
        return Response({"vehicles": serializer.data})


class AssignVehicleView(APIView):
    permission_classes = [IsDriver]

    def post(self, request, vehicle_id):
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id)
        except Vehicle.DoesNotExist:
            return Response({"detail": "Vehicle not found"}, status=404)

        if vehicle.assigned_to is not None and vehicle.assigned_to != request.user:
            return Response({"detail": "Vehicle already assigned to another driver"}, status=400)

        # Release any existing vehicle assignment for this driver
        Vehicle.objects.filter(assigned_to=request.user).exclude(id=vehicle_id).update(
            assigned_to=None,
            assigned_driver_name=None
        )

        vehicle.assigned_to = request.user
        vehicle.assigned_driver_name = request.user.name
        vehicle.save()

        return Response({"message": "Vehicle assigned successfully"})


class ReleaseVehicleView(APIView):
    permission_classes = [IsDriver]

    def post(self, request, vehicle_id):
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id)
        except Vehicle.DoesNotExist:
            return Response({"detail": "Vehicle not found"}, status=404)

        # Allow release if vehicle is not assigned or is assigned to this user
        if vehicle.assigned_to is not None and vehicle.assigned_to != request.user:
            return Response({"detail": "Vehicle already assigned to another driver"}, status=403)

        # Release the vehicle (safe even if already released)
        if vehicle.assigned_to == request.user:
            vehicle.assigned_to = None
            vehicle.assigned_driver_name = None
            vehicle.save()

        return Response({"message": "Vehicle released successfully"})


class StartTripView(APIView):
    permission_classes = [IsDriver]

    def post(self, request):
        vehicle_id = request.data.get('vehicle_id')
        if not vehicle_id:
            return Response({"detail": "vehicle_id required"}, status=400)

        try:
            vehicle = Vehicle.objects.get(id=vehicle_id, assigned_to=request.user)
        except Vehicle.DoesNotExist:
            return Response({"detail": "Vehicle not found or not assigned to you"}, status=404)

        # Check for existing active trip
        if Trip.objects.filter(driver=request.user, is_active=True).exists():
            return Response({"detail": "You already have an active trip"}, status=400)

        trip = Trip.objects.create(
            vehicle=vehicle,
            driver=request.user,
            vehicle_number=vehicle.vehicle_number,
            driver_name=request.user.name,
            vehicle_type=vehicle.vehicle_type,
            is_active=True
        )

        if vehicle.vehicle_type == 'bus':
            now_iso = timezone.now().isoformat()
            location = vehicle.current_location or {}
            location['bus_active'] = True
            location['driver_active'] = True
            location['trip_status'] = 'ACTIVE'
            location['trip_started_at'] = now_iso
            vehicle.current_location = location
            vehicle.save(update_fields=['current_location'])
            cache.delete(LIVE_ETA_CACHE_KEY)

        return Response(TripSerializer(trip).data, status=201)


class EndTripView(APIView):
    permission_classes = [IsDriver]

    def post(self, request, trip_id):
        try:
            trip = Trip.objects.get(id=trip_id, driver=request.user, is_active=True)
        except Trip.DoesNotExist:
            return Response({"detail": "Active trip not found"}, status=404)

        trip.is_active = False
        trip.end_time = timezone.now()
        trip.save()

        if trip.vehicle.vehicle_type == 'bus':
            now_iso = timezone.now().isoformat()
            location = trip.vehicle.current_location or {}
            location['bus_active'] = False
            location['driver_active'] = False
            location['trip_status'] = 'ENDED'
            location['trip_ended_at'] = now_iso
            location['timestamp'] = now_iso
            location['packet_timestamp'] = now_iso
            trip.vehicle.current_location = location
            trip.vehicle.save(update_fields=['current_location'])
            cache.delete(LIVE_ETA_CACHE_KEY)

        return Response({"message": "Trip ended successfully"})


class MarkOutOfStationView(APIView):
    permission_classes = [IsDriver]

    def post(self, request, vehicle_id):
        is_out_raw = request.data.get('is_out_of_station')
        if is_out_raw is None:
            return Response({"detail": "is_out_of_station (bool) required"}, status=400)

        if isinstance(is_out_raw, bool):
            is_out = is_out_raw
        elif isinstance(is_out_raw, str):
            normalized = is_out_raw.strip().lower()
            if normalized in {'true', '1', 'yes', 'on'}:
                is_out = True
            elif normalized in {'false', '0', 'no', 'off'}:
                is_out = False
            else:
                return Response({"detail": "is_out_of_station must be true/false"}, status=400)
        elif isinstance(is_out_raw, (int, float)):
            is_out = bool(is_out_raw)
        else:
            return Response({"detail": "is_out_of_station must be true/false"}, status=400)

        try:
            vehicle = Vehicle.objects.get(id=vehicle_id, assigned_to=request.user)
        except Vehicle.DoesNotExist:
            return Response({"detail": "Vehicle not found or not yours"}, status=404)

        vehicle.is_out_of_station = is_out

        if vehicle.vehicle_type == 'bus':
            location = vehicle.current_location or {}
            location['is_out_of_station'] = is_out
            vehicle.current_location = location
            vehicle.save(update_fields=['is_out_of_station', 'current_location'])
            cache.delete(LIVE_ETA_CACHE_KEY)
        else:
            vehicle.save(update_fields=['is_out_of_station'])

        status_str = "out of" if is_out else "in"
        return Response({
            "message": f"Vehicle marked as {status_str} station",
            "vehicle_id": str(vehicle.id),
            "is_out_of_station": is_out,
        })


class PendingBookingsView(APIView):
    permission_classes = [IsDriver]

    def get(self, request):
        # For ambulance drivers, only show pending bookings if they don't have active ones
        if request.user.driver_type == 'ambulance':
            active_booking = Booking.objects.filter(
                driver=request.user,
                status__in=['accepted', 'in_progress']
            ).first()

            if active_booking:
                # Ambulance driver has active booking, don't show any pending bookings
                return Response({
                    "bookings": [],
                    "message": "You have an active booking. Complete it before accepting new ones.",
                    "active_booking_id": str(active_booking.id),
                    "active_booking_status": active_booking.status
                })

        # Show all pending bookings for bus drivers or ambulance drivers without active bookings
        bookings = Booking.objects.filter(status='pending').order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response({"bookings": serializer.data})


class AcceptBookingView(APIView):
    permission_classes = [IsDriver]

    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id, status='pending')
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found or not pending"}, status=404)

        # Verify user is authenticated
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=401)

        # Ambulance drivers can only have ONE active booking at a time
        # Check if driver already has an active booking (ambulance only)
        if request.user.driver_type == 'ambulance':
            active_booking = Booking.objects.filter(
                driver=request.user,
                status__in=['accepted', 'in_progress']
            ).first()
            
            if active_booking:
                return Response({
                    "detail": "You already have an active booking. Complete it before accepting another one.",
                    "active_booking_id": str(active_booking.id),
                    "active_booking_status": active_booking.status
                }, status=400)

        # Get driver's ambulance
        ambulance = Vehicle.objects.filter(
            assigned_to=request.user,
            vehicle_type='ambulance'
        ).first()

        if not ambulance:
            return Response({"detail": "No ambulance assigned to your account. Please assign a vehicle from your dashboard."}, status=400)

        otp = generate_otp()
        send_otp_mock(booking.phone, otp)

        eta = None
        if ambulance.current_location and booking.user_location:
            loc_v = ambulance.current_location
            loc_u = booking.user_location
            dist = calculate_distance(
                loc_v.get('lat', 0), loc_v.get('lng', 0),
                loc_u.get('lat', 0), loc_u.get('lng', 0)
            )
            eta = calculate_eta(dist, 60)  # ambulance speed

        booking.status = 'accepted'
        booking.driver = request.user
        booking.driver_name = request.user.name or f"Driver {request.user.id}"
        booking.vehicle = ambulance
        booking.vehicle_number = ambulance.vehicle_number
        booking.otp = otp
        booking.eta_minutes = round(eta, 1) if eta else None
        booking.save()

        # Create notification for the student
        try:
            from .models import Notification
            Notification.objects.create(
                student_phone=booking.phone,
                booking=booking,
                notification_type='accepted',
                message=f"Your ambulance request has been accepted! Driver {booking.driver_name} is on the way with vehicle {booking.vehicle_number}.",
                driver_name=booking.driver_name,
                driver_phone=request.user.phone,
                vehicle_number=booking.vehicle_number,
                is_read=False
            )
        except Exception as e:
            print(f"Failed to create notification: {e}")
            # Don't fail the booking if notification fails

        return Response({
            "message": "Booking accepted",
            "otp": otp,               # remove in prod
            "booking": BookingSerializer(booking).data
        })


class AbortBookingView(APIView):
    permission_classes = [IsDriver]

    def post(self, request, booking_id):
        Booking.objects.filter(
            id=booking_id,
            driver=request.user
        ).update(status='cancelled')
        return Response({"message": "Booking cancelled"})


class VerifyOTPView(APIView):
    permission_classes = [IsDriver]

    def post(self, request):
        booking_id = request.data.get('booking_id')
        otp = request.data.get('otp')

        if not all([booking_id, otp]):
            return Response({"detail": "booking_id and otp required"}, status=400)

        try:
            booking = Booking.objects.get(
                id=booking_id,
                driver=request.user,
                otp=otp
            )
        except Booking.DoesNotExist:
            return Response({"detail": "Invalid OTP or booking not assigned to you"}, status=400)

        booking.status = 'in_progress'
        booking.save()

        return Response({"message": "OTP verified, ride started"})


class CompleteBookingView(APIView):
    permission_classes = [IsDriver]

    def post(self, request, booking_id):
        Booking.objects.filter(
            id=booking_id,
            driver=request.user
        ).update(status='completed')
        return Response({"message": "Booking completed"})


class MyTripsView(APIView):
    permission_classes = [IsDriver]

    def get(self, request):
        trips = Trip.objects.filter(driver=request.user).order_by('-start_time')
        serializer = TripSerializer(trips, many=True)
        return Response({"trips": serializer.data})


class ActiveTripView(APIView):
    permission_classes = [IsDriver]

    def get(self, request):
        trip = Trip.objects.filter(driver=request.user, is_active=True).first()
        if trip:
            return Response({"trip": TripSerializer(trip).data})
        return Response({"trip": None})


class CurrentBookingView(APIView):
    permission_classes = [IsDriver]

    def get(self, request):
        # Get current active booking for this driver (accepted or in_progress)
        booking = Booking.objects.filter(
            driver=request.user,
            status__in=['accepted', 'in_progress']
        ).first()

        if booking:
            serializer = BookingSerializer(booking)
            # wrap under key for consistency with other endpoints
            return Response({"booking": serializer.data})

        # no active booking - return 200 with null so frontend doesn't see 404
        return Response({"booking": None})


class StudentNotificationsView(APIView):
    """Fetch notifications for a student by their phone number"""
    permission_classes = [AllowAny]

    def get(self, request):
        student_phone = request.query_params.get('phone')
        
        if not student_phone:
            return Response({"detail": "phone parameter required"}, status=400)

        try:
            from .models import Notification
            notifications = Notification.objects.filter(
                student_phone=student_phone
            ).order_by('-created_at')
            
            from .serializers import NotificationSerializer
            serializer = NotificationSerializer(notifications, many=True)
            return Response({
                "notifications": serializer.data,
                "count": notifications.count()
            })
        except Exception as e:
            return Response({"detail": str(e)}, status=500)


# ────────────────────────────────────────────────
# Admin Endpoints
# ────────────────────────────────────────────────

class AdminStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        total_students = User.objects.filter(role='student').count()
        total_drivers = User.objects.filter(role='driver').count()
        total_buses = Vehicle.objects.filter(vehicle_type='bus').count()
        total_ambulances = Vehicle.objects.filter(vehicle_type='ambulance').count()
        active_trips = Trip.objects.filter(is_active=True).count()
        pending_bookings = Booking.objects.filter(status='pending').count()
        total_offences = Offence.objects.count()
        unpaid_offences = Offence.objects.filter(is_paid=False).count()

        return Response({
            "total_students": total_students,
            "total_drivers": total_drivers,
            "total_buses": total_buses,
            "total_ambulances": total_ambulances,
            "active_trips": active_trips,
            "pending_bookings": pending_bookings,
            "total_offences": total_offences,
            "unpaid_offences": unpaid_offences,
        })


class AddVehicleView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = VehicleCreateSerializer(data=request.data)
        if serializer.is_valid():
            vehicle = serializer.save()
            return Response(VehicleSerializer(vehicle).data, status=201)
        return Response(serializer.errors, status=400)


class VehicleListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        vehicle_type = request.query_params.get('vehicle_type')
        search = request.query_params.get('search')

        queryset = Vehicle.objects.all()
        if vehicle_type:
            queryset = queryset.filter(vehicle_type=vehicle_type)
        if search:
            queryset = queryset.filter(
                Q(vehicle_number__icontains=search) |
                Q(gps_imei__icontains=search)
            )

        serializer = VehicleSerializer(queryset, many=True)
        return Response({"vehicles": serializer.data})


class DeleteVehicleView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, vehicle_id):
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id)
            vehicle.delete()
            return Response({"message": "Vehicle deleted"})
        except Vehicle.DoesNotExist:
            return Response({"detail": "Vehicle not found"}, status=404)


class StudentListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        search = request.query_params.get('search')
        queryset = User.objects.filter(role='student')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(registration_id__icontains=search) |
                Q(phone__icontains=search)
            )
        serializer = UserSerializer(queryset, many=True)
        return Response({"students": serializer.data})


class DeleteStudentView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, student_id):
        deleted = User.objects.filter(id=student_id, role='student').delete()
        if deleted[0] == 0:
            return Response({"detail": "Student not found"}, status=404)
        return Response({"message": "Student deleted"})


class DriverListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        driver_type = request.query_params.get('driver_type')
        search = request.query_params.get('search')

        queryset = User.objects.filter(role='driver')
        if driver_type:
            queryset = queryset.filter(driver_type=driver_type)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(registration_id__icontains=search) |
                Q(phone__icontains=search)
            )

        serializer = UserSerializer(queryset, many=True)
        return Response({"drivers": serializer.data})


class DeleteDriverView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, driver_id):
        # Release vehicles first
        Vehicle.objects.filter(assigned_to__id=driver_id).update(
            assigned_to=None, assigned_driver_name=None
        )

        deleted = User.objects.filter(id=driver_id, role='driver').delete()
        if deleted[0] == 0:
            return Response({"detail": "Driver not found"}, status=404)
        return Response({"message": "Driver deleted"})


class DeleteUserView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        if user.is_superuser:
            return Response({"detail": "Superuser cannot be deleted"}, status=400)

        if str(request.user.id) == str(user.id):
            return Response({"detail": "You cannot delete your own account"}, status=400)

        if user.role == 'driver':
            Vehicle.objects.filter(assigned_to__id=user_id).update(
                assigned_to=None, assigned_driver_name=None
            )

        user.delete()
        return Response({"message": "User deleted successfully"})


class AdminListView(APIView):
    permission_classes = [IsAuthenticated]  # Allow authenticated users to view admins

    def get(self, request):
        search = request.query_params.get('search')
        queryset = User.objects.filter(role='admin').order_by('-created_at')

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(registration_id__icontains=search) |
                Q(phone__icontains=search)
            )

        serializer = UserSerializer(queryset, many=True)
        return Response({"admins": serializer.data})


class AdminDetailView(APIView):
    """
    Retrieve / update / delete a single administrator account.
    Only deletion is used by developer panel today.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, admin_id):
        try:
            user = User.objects.get(id=admin_id, role='admin')
        except User.DoesNotExist:
            return Response({"detail": "Admin not found"}, status=404)

        user.delete()
        return Response({"message": "Admin deleted"}, status=200)


# ---------------------------------------------------------------------------
# Pending admin request endpoints (used by frontend and developer panel)
# ---------------------------------------------------------------------------
class PendingAdminListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # return all pending requests sorted by submission time
        pending = PendingAdmin.objects.all().order_by('-submitted_at')
        serializer = PendingAdminSerializer(pending, many=True)
        return Response({"pending_admins": serializer.data})

    def post(self, request):
        serializer = PendingAdminSerializer(data=request.data)
        if serializer.is_valid():
            obj = serializer.save()
            return Response(PendingAdminSerializer(obj).data, status=201)
        return Response(serializer.errors, status=400)


class PendingAdminDetailView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, admin_id):
        try:
            obj = PendingAdmin.objects.get(id=admin_id)
            obj.delete()
            return Response({"message": "Deleted"}, status=204)
        except PendingAdmin.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)


# Admin Creation Request Endpoints (Dev Panel Notifications)
class AdminCreationRequestListView(APIView):
    """
    Get all admin creation requests from Django admin panel.
    Used by the dev panel to track when admins are created.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """Fetch unnotified or all admin creation requests"""
        # Get unnotified requests first, then all requests
        unnotified = AdminCreationRequest.objects.filter(is_notified=False).order_by('-created_at')
        
        serializer = AdminCreationRequestSerializer(unnotified, many=True)
        return Response({
            "admin_creation_requests": serializer.data,
            "count": unnotified.count()
        })


class AdminCreationRequestDetailView(APIView):
    """
    Mark admin creation request as notified (acknowledged by dev panel).
    """
    permission_classes = [AllowAny]

    def patch(self, request, request_id):
        """Mark a specific admin creation request as notified"""
        try:
            admin_request = AdminCreationRequest.objects.get(id=request_id)
            admin_request.is_notified = True
            admin_request.save()
            
            serializer = AdminCreationRequestSerializer(admin_request)
            return Response({
                "message": "Admin creation request marked as notified",
                "admin_request": serializer.data
            })
        except AdminCreationRequest.DoesNotExist:
            return Response(
                {"detail": "Admin creation request not found"},
                status=404
            )

    def delete(self, request, request_id):
        """Delete an admin creation request"""
        try:
            admin_request = AdminCreationRequest.objects.get(id=request_id)
            admin_request.delete()
            return Response({"message": "Admin creation request deleted"}, status=204)
        except AdminCreationRequest.DoesNotExist:
            return Response(
                {"detail": "Admin creation request not found"},
                status=404
            )


class OffenceListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        offence_type = request.query_params.get('offence_type')
        is_paid = request.query_params.get('is_paid')
        search = request.query_params.get('search')

        queryset = Offence.objects.all().order_by('-created_at')
        if offence_type:
            queryset = queryset.filter(offence_type=offence_type)
        if is_paid is not None:
            is_paid_bool = is_paid.lower() == 'true'
            queryset = queryset.filter(is_paid=is_paid_bool)
        if search:
            queryset = queryset.filter(
                Q(driver_name__icontains=search) |
                Q(student_name__icontains=search) |
                Q(vehicle_number__icontains=search)
            )

        serializer = OffenceSerializer(queryset, many=True)
        return Response({"offences": serializer.data})


class DeleteOffenceView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, offence_id):
        deleted = Offence.objects.filter(id=offence_id).delete()
        if deleted[0] == 0:
            return Response({"detail": "Offence not found"}, status=404)
        return Response({"message": "Offence deleted"})


class MarkOffencePaidView(APIView):
    permission_classes = [IsAdmin]

    def patch(self, request, offence_id):
        updated = Offence.objects.filter(id=offence_id).update(is_paid=True)
        if updated == 0:
            return Response({"detail": "Offence not found"}, status=404)
        return Response({"message": "Offence marked as paid"})


class AddRFIDDeviceView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = RFIDDeviceSerializer(data=request.data)
        if serializer.is_valid():
            device = serializer.save()
            return Response(RFIDDeviceSerializer(device).data, status=201)
        return Response(serializer.errors, status=400)


class RFIDDeviceListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        devices = RFIDDevice.objects.all()
        serializer = RFIDDeviceSerializer(devices, many=True)
        return Response({"devices": serializer.data})


class DeleteRFIDDeviceView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, device_id):
        deleted = RFIDDevice.objects.filter(id=device_id).delete()
        if deleted[0] == 0:
            return Response({"detail": "Device not found"}, status=404)
        return Response({"message": "Device deleted"})


class TripListView(APIView):
    permission_classes = [AllowAny]  # Allow for development - change to IsAdmin in production

    def get(self, request):
        is_active = request.query_params.get('is_active')
        vehicle_type = request.query_params.get('vehicle_type')

        queryset = Trip.objects.all().order_by('-start_time')
        if is_active is not None:
            queryset = queryset.filter(is_active=(is_active.lower() == 'true'))
        if vehicle_type:
            queryset = queryset.filter(vehicle_type=vehicle_type)

        serializer = TripSerializer(queryset, many=True)
        return Response({"trips": serializer.data})


class ActiveVehiclesAdminView(APIView):
    """Return all active trips with location data for admin mapping.

    The frontend can display both buses and ambulances together on one map by
    hitting this endpoint.  Requires admin privileges.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        active_trips = Trip.objects.filter(is_active=True)
        vehicles = []
        for trip in active_trips:
            vehicle = trip.vehicle
            vehicles.append({
                "trip_id": str(trip.id),
                "vehicle_id": str(vehicle.id),
                "vehicle_number": vehicle.vehicle_number,
                "vehicle_type": vehicle.vehicle_type,
                "driver_name": trip.driver_name,
                "location": vehicle.current_location,
                "is_out_of_station": vehicle.is_out_of_station,
            })
        return Response({"vehicles": vehicles})


class BookingListView(APIView):
    permission_classes = [AllowAny]  # Allow for development - change to IsAdmin in production

    def get(self, request):
        status_filter = request.query_params.get('status')
        queryset = Booking.objects.all().order_by('-created_at')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        serializer = BookingSerializer(queryset, many=True)
        return Response({"bookings": serializer.data})
    


# Issues submitted by public/student/driver
class IssueCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data.copy()
        user = request.user if request.user and request.user.is_authenticated else None
        if user:
            data['user'] = str(user.id)
            data['user_role'] = user.role
        serializer = IssueCreateSerializer(data=data)
        if serializer.is_valid():
            issue = serializer.save(user=user)
            return Response({"issue": IssueSerializer(issue).data}, status=201)
        return Response(serializer.errors, status=400)


class IssueListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        queryset = Issue.objects.all().order_by('-created_at')
        serializer = IssueSerializer(queryset, many=True)
        return Response({"issues": serializer.data})


class IssuePushView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, issue_id):
        try:
            issue = Issue.objects.get(id=issue_id)
        except Issue.DoesNotExist:
            return Response({"detail": "Issue not found"}, status=404)
        issue.status = 'pushed'
        issue.save()
        return Response({"message": "Issue pushed to developer", "issue": IssueSerializer(issue).data})


class IssueDeleteView(APIView):
    permission_classes = [IsAdmin]

    def delete(self, request, issue_id):
        deleted, _ = Issue.objects.filter(id=issue_id).delete()
        if deleted == 0:
            return Response({"detail": "Issue not found"}, status=404)
        return Response({"message": "Issue deleted"})


# ────────────────────────────────────────────────
# Public / Misc Endpoints
# ────────────────────────────────────────────────

class ActiveBusesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Use vehicle_type from Trip (denormalized field) to avoid JOIN
        active_trips = Trip.objects.filter(
            is_active=True,
            vehicle_type="bus"
        ).select_related('vehicle')

        if active_trips.exists():
            buses = []
            total_active_bus_trips = 0
            out_of_station_active_bus_trips = 0
            for trip in active_trips:
                vehicle = trip.vehicle
                total_active_bus_trips += 1

                # Out-of-station buses should not be shown as live/trackable.
                if vehicle.is_out_of_station:
                    out_of_station_active_bus_trips += 1
                    continue

                buses.append({
                    "trip_id": str(trip.id),
                    "vehicle_id": str(vehicle.id),
                    "vehicle_number": vehicle.vehicle_number,
                    "driver_name": trip.driver_name,
                    "location": vehicle.current_location,
                    "is_out_of_station": False
                })

            all_out = (
                total_active_bus_trips > 0 and
                out_of_station_active_bus_trips == total_active_bus_trips
            )
            if all_out:
                return Response({
                    "message": "All active buses are out of station",
                    "buses": [],
                    "all_out_of_station": True,
                })

            return Response({"buses": buses, "all_out_of_station": False})

        # No active trips → check all buses
        all_buses = Vehicle.objects.filter(vehicle_type="bus")
        if not all_buses.exists():
            return Response({"message": "No buses registered", "buses": [], "all_out_of_station": False})

        all_out = all(v.is_out_of_station for v in all_buses)
        if all_out:
            return Response({"message": "All buses are out of station", "buses": [], "all_out_of_station": True})

        return Response({"message": "No active bus trips at the moment", "buses": [], "all_out_of_station": False})


class PublicActiveVehiclesView(APIView):
    """Return all active vehicles (buses and ambulances) with location data for public map display."""
    permission_classes = [AllowAny]

    def get(self, request):
        # Get all active trips (both buses and ambulances)
        active_trips = Trip.objects.filter(is_active=True)

        vehicles = []
        for trip in active_trips:
            vehicle = trip.vehicle
            # Only include vehicles that have location data
            if vehicle.current_location and vehicle.current_location.get('lat') and vehicle.current_location.get('lng'):
                vehicles.append({
                    "trip_id": str(trip.id),
                    "vehicle_id": str(vehicle.id),
                    "vehicle_number": vehicle.vehicle_number,
                    "vehicle_type": vehicle.vehicle_type,
                    "driver_name": trip.driver_name,
                    "location": vehicle.current_location,
                    "is_out_of_station": vehicle.is_out_of_station,
                })

        return Response({"vehicles": vehicles})

class AmbulanceZonesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        from geofence.kendujhar_zone import AMBULANCE_SERVICE_ZONES
        ambulance_active = Trip.objects.filter(
            is_active=True,
            vehicle_type='ambulance'
        ).exists()
        return Response({
            "zones": AMBULANCE_SERVICE_ZONES,
            "ambulance_active": ambulance_active
        })

class BusETAView(APIView):
    """
    Get ETA for a bus route using Google Distance Matrix API.
    
    Query Parameters:
        user_lat: Student's latitude
        user_lng: Student's longitude
    
    Path Parameters:
        bus_id: ID of the bus vehicle
    
    Response:
        {
            "bus_number": "BUS101",
            "bus_location": {"lat": 21.xxx, "lng": 85.xxx},
            "user_location": {"lat": 20.xxx, "lng": 85.xxx},
            "distance_km": 3.2,
            "eta_minutes": 6,
            "route": "GCE Keonjhar → Baitarani Hall of Residence",
            "message": "Using Google Distance Matrix API"
        }
    """
    permission_classes = [AllowAny]

    def get(self, request, bus_id):
        # Get user location from query parameters
        user_lat = request.query_params.get('user_lat')
        user_lng = request.query_params.get('user_lng')
        
        if not all([user_lat, user_lng]):
            return Response(
                {"detail": "user_lat and user_lng required"}, 
                status=400
            )
        
        try:
            vehicle = Vehicle.objects.get(id=bus_id, vehicle_type='bus')
        except Vehicle.DoesNotExist:
            return Response({"detail": "Bus not found"}, status=404)
        
        if not vehicle.current_location:
            return Response({
                "eta_minutes": None,
                "message": "Bus location not available",
                "bus_number": vehicle.vehicle_number
            }, status=200)
        
        # Get bus location
        bus_lat = float(vehicle.current_location.get('lat', 0))
        bus_lng = float(vehicle.current_location.get('lng', 0))
        user_lat = float(user_lat)
        user_lng = float(user_lng)
        
        # Call Google Distance Matrix API
        result = get_google_distance_matrix(bus_lat, bus_lng, user_lat, user_lng)
        
        if not result['success']:
            # Fallback to Haversine formula if API fails
            logger.warning(f"Google API failed: {result['error']}. Using fallback.")
            distance = calculate_distance(bus_lat, bus_lng, user_lat, user_lng)
            eta = calculate_eta(distance, 40)  # Assume 40 km/h
            return Response({
                "bus_number": vehicle.vehicle_number,
                "bus_location": {"lat": bus_lat, "lng": bus_lng},
                "user_location": {"lat": user_lat, "lng": user_lng},
                "distance_km": round(distance, 2),
                "eta_minutes": round(eta, 1),
                "route": "GCE Keonjhar → Baitarani Hall of Residence",
                "message": f"Fallback to Haversine: {result['error']}",
                "method": "haversine"
            })
        
        return Response({
            "bus_number": vehicle.vehicle_number,
            "bus_location": {"lat": bus_lat, "lng": bus_lng},
            "user_location": {"lat": user_lat, "lng": user_lng},
            "distance_km": result['distance_km'],
            "eta_minutes": result['duration_minutes'],
            "route": "GCE Keonjhar → Baitarani Hall of Residence",
            "message": "Using Google Distance Matrix API",
            "method": "google_distance_matrix"
        })


class BusLiveETAView(APIView):
    """Return cached live ETA for the active bus to Baitarani Hall."""
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(calculate_live_eta(), status=200)


class AvailableAmbulancesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        ambulances = Vehicle.objects.filter(vehicle_type='ambulance', assigned_to__isnull=True)
        serializer = VehicleSerializer(ambulances, many=True)
        return Response({"ambulances": serializer.data})


class MyBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(
            Q(phone=request.user.phone) |
            Q(student_registration_id=request.user.registration_id)
        ).order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response({"bookings": serializer.data})


class CheckUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        registration_id = request.data.get('registration_id')
        
        if not phone and not registration_id:
            return Response({"detail": "Phone or registration_id required"}, status=400)
        
        query = Q()
        if phone:
            query |= Q(phone=phone)
        if registration_id:
            query |= Q(registration_id=registration_id)
        
        exists = User.objects.filter(query).exists()
        user = None
        if exists:
            user_obj = User.objects.filter(query).first()
            user = UserSerializer(user_obj).data
        
        return Response({"exists": exists, "user": user})


# ────────────────────────────────────────────────
# GPS & RFID Receiver (device → server)
# ────────────────────────────────────────────────

class ReceiveGPSView(APIView):
    permission_classes = [AllowAny]  # in production → API key or auth

    def post(self, request):
        imei = request.data.get('imei')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        speed = request.data.get('speed')
        timestamp = request.data.get('timestamp')

        if not all([imei, latitude, longitude, speed]):
            return Response({"detail": "Missing required fields"}, status=400)

        try:
            vehicle = Vehicle.objects.get(gps_imei=imei)
        except Vehicle.DoesNotExist:
            return Response({"detail": "Vehicle not found for this IMEI"}, status=404)

        location = {
            "lat": float(latitude),
            "lng": float(longitude),
            "speed": float(speed),
            "timestamp": timestamp or timezone.now().isoformat()
        }

        vehicle.current_location = location
        vehicle.save()

        # Overspeed check (bus only)
        if vehicle.vehicle_type == 'bus' and float(speed) > 40:  # CAMPUS_SPEED_LIMIT
            driver_name = vehicle.assigned_driver_name
            offence = Offence.objects.create(
                offence_type='bus_overspeed',
                driver=vehicle.assigned_to,
                driver_name=driver_name,
                vehicle=vehicle,
                vehicle_number=vehicle.vehicle_number,
                speed=float(speed),
                speed_limit=40,
                location=location,
                is_paid=False
            )
            logger.warning(f"Overspeed: {vehicle.vehicle_number} @ {speed} km/h")

        # If ambulance → update active booking ETA
        if vehicle.vehicle_type == 'ambulance':
            active_booking = Booking.objects.filter(
                vehicle=vehicle,
                status__in=['accepted', 'in_progress']
            ).first()
            if active_booking and active_booking.user_location:
                u_loc = active_booking.user_location
                dist = calculate_distance(
                    location['lat'], location['lng'],
                    u_loc.get('lat', 0), u_loc.get('lng', 0)
                )
                eta = calculate_eta(dist, 60)
                active_booking.eta_minutes = round(eta, 1)
                active_booking.save()
                # In real app → socket emit 'eta_update'

        return Response({"message": "GPS data received", "vehicle_id": str(vehicle.id)})


class UpdateVehicleLocationView(APIView):
    """
    Update vehicle location from mobile driver app.
    
    This endpoint is called by the driver mobile app when tracking a bus/ambulance.
    The driver's phone GPS sends location updates every 10 seconds.
    
    Request body:
    {
        "vehicle_id": "uuid",
        "lat": 21.xxxxx,
        "lng": 85.xxxxx,
        "speed": 45,  (optional)
        "timestamp": "2024-01-01T10:30:00Z"  (optional)
    }
    """
    permission_classes = [AllowAny]  # In production, use IsAuthenticated
    
    def post(self, request):
        vehicle_id = request.data.get('vehicle_id')
        lat = request.data.get('lat')
        lng = request.data.get('lng')
        speed = request.data.get('speed', 0)
        timestamp = request.data.get('timestamp')
        
        if lat is None or lng is None:
            return Response({
                "detail": "lat and lng are required"
            }, status=400)

        # Prefer explicit vehicle_id from client; if absent, infer from active trip.
        vehicle = None
        if vehicle_id:
            try:
                vehicle = Vehicle.objects.get(id=vehicle_id)
            except Vehicle.DoesNotExist:
                return Response({
                    "detail": "Vehicle not found"
                }, status=404)
        elif request.user and request.user.is_authenticated:
            active_trip = Trip.objects.filter(
                driver=request.user,
                is_active=True
            ).select_related('vehicle').first()
            if active_trip:
                vehicle = active_trip.vehicle

        if not vehicle:
            return Response({
                "detail": "vehicle_id required when no active driver trip is found"
            }, status=400)
        
        # Geofence check
        from geofence.utils import is_inside_kendujhar
        if not is_inside_kendujhar(float(lat), float(lng)):
            return Response(
                {
                    "error": "Vehicle outside Kendujhar permitted zone",
                    "code": "OUTSIDE_KEONJHAR",
                },
                status=400
            )
        
        speed_value = float(speed) if speed not in (None, '') else 0.0
        packet_timestamp = timestamp or timezone.now().isoformat()
        is_bus_vehicle = vehicle.vehicle_type == 'bus'
        active_trip_exists = Trip.objects.filter(vehicle=vehicle, is_active=True).exists() if is_bus_vehicle else True
        bus_active = active_trip_exists if is_bus_vehicle else None

        # Store latest GPS packet and packet health fields in location JSON.
        location = {
            "lat": float(lat),
            "lng": float(lng),
            "speed": speed_value,
            "timestamp": packet_timestamp,
            "packet_timestamp": packet_timestamp,
            "server_received_at": timezone.now().isoformat(),
            "driver_active": active_trip_exists if is_bus_vehicle else True,
        }
        if is_bus_vehicle:
            location['bus_active'] = bus_active
        
        vehicle.current_location = location
        vehicle.save()

        if is_bus_vehicle:
            cache.delete(LIVE_ETA_CACHE_KEY)
        
        # Log for debugging
        logger.info(f"Updated location for {vehicle.vehicle_number}: {lat}, {lng}")
        
        # Check overspeed for bus
        if vehicle.vehicle_type == 'bus' and speed_value > 40:
            driver_name = vehicle.assigned_driver_name or "Unknown"
            offence = Offence.objects.create(
                offence_type='bus_overspeed',
                driver=vehicle.assigned_to,
                driver_name=driver_name,
                vehicle=vehicle,
                vehicle_number=vehicle.vehicle_number,
                speed=speed_value,
                speed_limit=40,
                location=location,
                is_paid=False
            )
            logger.warning(f"Overspeed: {vehicle.vehicle_number} @ {speed_value} km/h")
        
        return Response({
            "message": "Location updated successfully",
            "vehicle_id": str(vehicle.id),
            "vehicle_number": vehicle.vehicle_number,
            "driver_active": active_trip_exists,
            "bus_active": bus_active,
            "location": location
        })


class ReceiveRFIDScanView(APIView):
    permission_classes = [AllowAny]  # → secure in production

    def post(self, request):
        rfid_device_id = request.data.get('rfid_device_id')
        student_registration_id = request.data.get('student_registration_id')
        student_name = request.data.get('student_name')
        phone = request.data.get('phone')
        speed = request.data.get('speed')
        timestamp = request.data.get('timestamp')

        if not all([rfid_device_id, student_registration_id, speed]):
            return Response({"detail": "Missing required fields"}, status=400)

        try:
            device = RFIDDevice.objects.get(rfid_id=rfid_device_id)
        except RFIDDevice.DoesNotExist:
            return Response({"detail": "RFID device not registered"}, status=404)

        if float(speed) > 40:  # CAMPUS_SPEED_LIMIT
            try:
                student = User.objects.get(registration_id=student_registration_id)
            except User.DoesNotExist:
                student = None

            Offence.objects.create(
                offence_type='student_speed',
                student=student,
                student_name=student_name,
                student_registration_id=student_registration_id,
                phone=phone,
                speed=float(speed),
                speed_limit=40,
                location={"name": device.location_name},
                rfid_number=rfid_device_id,
                is_paid=False
            )
            logger.warning(f"Student speed violation: {student_name} @ {speed} km/h")
            return Response({"message": "Speed violation recorded"})

        return Response({"message": "Scan recorded, no violation"})