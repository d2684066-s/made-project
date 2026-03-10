
import random
import math
from datetime import datetime, timezone, timedelta
from rest_framework_simplejwt.tokens import AccessToken
from .models import User
import requests
import os
from django.conf import settings

def generate_otp(length=6):
    return str(random.randint(10**(length-1), 10**length - 1))

# In-memory OTP store (use Redis in production)
otp_storage = {}

def send_otp_mock(phone: str, otp: str):
    otp_storage[phone] = {
        'otp': otp,
        'expires': datetime.now(timezone.utc) + timedelta(minutes=10)
    }
    print(f"[MOCK OTP] Sent {otp} to {phone}")  # replace with real SMS later
    return True

def verify_otp_mock(phone: str, otp: str) -> bool:
    if phone in otp_storage:
        stored = otp_storage[phone]
        if stored['otp'] == otp and stored['expires'] > datetime.now(timezone.utc):
            del otp_storage[phone]
            return True
    return False

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def calculate_eta(distance_km: float, speed_kmh: float) -> float:
    if speed_kmh <= 0:
        return 0
    return (distance_km / speed_kmh) * 60

# Google Distance Matrix API Integration
def get_google_distance_matrix(origin_lat: float, origin_lng: float, 
                               destination_lat: float, destination_lng: float) -> dict:
    """
    Get distance and duration from Google Distance Matrix API.
    
    Args:
        origin_lat, origin_lng: Starting point coordinates
        destination_lat, destination_lng: Ending point coordinates
    
    Returns:
        {
            'distance_km': float,
            'duration_minutes': float,
            'success': bool,
            'error': str (if failed)
        }
    """
    try:
        # Get API key from environment or Django settings
        api_key = os.getenv('GOOGLE_MAPS_API_KEY') or getattr(settings, 'GOOGLE_MAPS_API_KEY', None)
        
        if not api_key:
            return {
                'success': False,
                'error': 'Google Maps API key not configured',
                'distance_km': None,
                'duration_minutes': None
            }
        
        # Format coordinates
        origins = f"{origin_lat},{origin_lng}"
        destinations = f"{destination_lat},{destination_lng}"
        
        # Build request URL
        url = "https://maps.googleapis.com/maps/api/distancematrix/json"
        params = {
            'origins': origins,
            'destinations': destinations,
            'key': api_key,
            'units': 'metric'  # Use metric units (km, m, etc)
        }
        
        # Make API request
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code != 200:
            return {
                'success': False,
                'error': f'API request failed with status {response.status_code}',
                'distance_km': None,
                'duration_minutes': None
            }
        
        data = response.json()
        
        # Check API response status
        if data.get('status') != 'OK':
            return {
                'success': False,
                'error': f"API error: {data.get('status')} - {data.get('error_message', 'Unknown error')}",
                'distance_km': None,
                'duration_minutes': None
            }
        
        # Extract distance and duration from first result
        if not data.get('rows') or not data['rows'][0].get('elements'):
            return {
                'success': False,
                'error': 'No route found',
                'distance_km': None,
                'duration_minutes': None
            }
        
        element = data['rows'][0]['elements'][0]
        
        # Check if route is possible
        if element.get('status') != 'OK':
            return {
                'success': False,
                'error': f"Route error: {element.get('status')}",
                'distance_km': None,
                'duration_minutes': None
            }
        
        # Extract values
        distance_meters = element['distance']['value']
        duration_seconds = element['duration']['value']
        
        # Convert to km and minutes
        distance_km = distance_meters / 1000
        duration_minutes = duration_seconds / 60
        
        return {
            'success': True,
            'distance_km': round(distance_km, 2),
            'duration_minutes': round(duration_minutes, 1),
            'error': None
        }
    
    except requests.RequestException as e:
        return {
            'success': False,
            'error': f'Network error: {str(e)}',
            'distance_km': None,
            'duration_minutes': None
        }
    except Exception as e:
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'distance_km': None,
            'duration_minutes': None
        }

# Custom JWT creation (if you want to match exactly the old format)
# This is the part where we create the JWT token for authentication and authorization
# when the clinet does the login here
def create_access_token(user: User):
    token = AccessToken.for_user(user)
    token['user_id'] = str(user.id)
    token['role'] = user.role
    return str(token)