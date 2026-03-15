from django.core.cache import cache
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from core.models import Trip
from core.utils import calculate_distance, calculate_eta

# Fixed destination for student ETA card.
BAITARANI_HALL_COORDS = {
    "lat": 21.6363125,
    "lng": 85.61898438,
}

LIVE_ETA_CACHE_KEY = "bus_live_eta_v1"
LIVE_ETA_CACHE_SECONDS = 3 * 60
FRESH_PACKET_WINDOW_SECONDS = 180
# If no GPS packet has arrived for this long, the trip is considered stale/abandoned.
STALE_TRIP_THRESHOLD_SECONDS = 2 * 60 * 60  # 2 hours
DEFAULT_MOVING_SPEED_KMH = 35.0


def _safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _parse_timestamp(timestamp_value):
    if not timestamp_value:
        return None

    parsed = parse_datetime(str(timestamp_value))
    if parsed is None:
        return None

    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def _inactive_payload(message):
    return {
        "status": "NOT_STARTED",
        "eta_minutes": None,
        "distance_km": None,
        "destination": "Baitarani Hall of Residence",
        "message": message,
        "cached": False,
    }


def _started_payload(message):
    return {
        "status": "STARTED",
        "eta_minutes": None,
        "distance_km": None,
        "destination": "Baitarani Hall of Residence",
        "message": message,
        "cached": False,
    }


def _out_of_station_payload(message="Bus is out of station. ETA unavailable"):
    return {
        "status": "OUT_OF_STATION",
        "eta_minutes": None,
        "distance_km": None,
        "destination": "Baitarani Hall of Residence",
        "message": message,
        "cached": False,
    }


def _active_payload(trip):
    vehicle = trip.vehicle
    location = vehicle.current_location or {}

    if vehicle.is_out_of_station:
        return _out_of_station_payload()

    if location.get("bus_active") is False:
        return _inactive_payload("No bus trip currently running")

    lat = _safe_float(location.get("lat"))
    lng = _safe_float(location.get("lng"))
    if lat is None or lng is None:
        # If trip was created long ago with no GPS at all → treat as stale
        trip_age = (timezone.now() - trip.start_time).total_seconds()
        if trip_age > STALE_TRIP_THRESHOLD_SECONDS:
            return _inactive_payload("No bus trip currently running")
        return _started_payload("Bus started. Waiting for GPS location")

    packet_timestamp = location.get("timestamp") or location.get("packet_timestamp")
    packet_dt = _parse_timestamp(packet_timestamp)
    if packet_dt is None:
        trip_age = (timezone.now() - trip.start_time).total_seconds()
        if trip_age > STALE_TRIP_THRESHOLD_SECONDS:
            return _inactive_payload("No bus trip currently running")
        return _started_payload("Bus started. Waiting for first GPS packet")

    packet_age_seconds = (timezone.now() - packet_dt).total_seconds()
    if packet_age_seconds > STALE_TRIP_THRESHOLD_SECONDS:
        # GPS data is hours old — trip is effectively abandoned
        return _inactive_payload("No bus trip currently running")
    if packet_age_seconds > FRESH_PACKET_WINDOW_SECONDS:
        return _started_payload("Bus started. Waiting for fresh GPS packet")

    reported_speed = _safe_float(location.get("speed")) or 0.0
    effective_speed = reported_speed if reported_speed > 5 else DEFAULT_MOVING_SPEED_KMH

    distance_km = calculate_distance(
        lat,
        lng,
        BAITARANI_HALL_COORDS["lat"],
        BAITARANI_HALL_COORDS["lng"],
    )
    eta_minutes = max(1.0, calculate_eta(distance_km, effective_speed))

    rounded_eta = int(round(eta_minutes))

    return {
        "status": "ACTIVE",
        "bus_id": str(vehicle.id),
        "bus_number": vehicle.vehicle_number,
        "bus_location": {
            "lat": lat,
            "lng": lng,
        },
        "distance_km": round(distance_km, 2),
        "eta_minutes": round(eta_minutes, 1),
        "destination": "Baitarani Hall of Residence",
        "driver_active": True,
        "packet_timestamp": packet_dt.isoformat(),
        "cache_seconds": LIVE_ETA_CACHE_SECONDS,
        "cached": False,
        "message": f"Bus arriving in {rounded_eta} minutes",
    }


def calculate_live_eta():
    """
    Calculate and cache bus ETA to Baitarani Hall.

    Returns cached ACTIVE ETA for up to 3 minutes. If no active trip or fresh
    packet is present, returns NOT_STARTED without caching stale status.
    """
    active_trips = list(
        Trip.objects.select_related("vehicle")
        .filter(is_active=True, vehicle_type="bus")
        .order_by("-start_time")
    )

    if not active_trips:
        return _inactive_payload("No bus trip running right now")

    active_trip = next(
        (trip for trip in active_trips if not trip.vehicle.is_out_of_station),
        None,
    )
    if active_trip is None:
        return _out_of_station_payload()

    # Auto-detect trips that were never ended (e.g. server/app crash, test leftovers).
    # If the trip started more than STALE_TRIP_THRESHOLD_SECONDS ago, it is considered
    # abandoned and is closed in-place so the student panel shows the correct status.
    trip_age_secs = (timezone.now() - active_trip.start_time).total_seconds()
    if trip_age_secs > STALE_TRIP_THRESHOLD_SECONDS:
        active_trip.is_active = False
        active_trip.end_time = timezone.now()
        active_trip.save(update_fields=["is_active", "end_time"])
        v = active_trip.vehicle
        loc = v.current_location or {}
        loc["bus_active"] = False
        loc["trip_status"] = "ENDED"
        v.current_location = loc
        v.save(update_fields=["current_location"])
        cache.delete(LIVE_ETA_CACHE_KEY)
        return _inactive_payload("No bus trip running right now")

    current_location = active_trip.vehicle.current_location or {}
    current_packet_dt = _parse_timestamp(
        current_location.get("packet_timestamp") or current_location.get("timestamp")
    )

    cached = cache.get(LIVE_ETA_CACHE_KEY)
    if cached:
        cached_bus_id = cached.get("bus_id")
        if cached_bus_id and str(cached_bus_id) != str(active_trip.vehicle.id):
            cached = None

    if cached:
        cached_packet_dt = _parse_timestamp(cached.get("packet_timestamp"))
        if cached_packet_dt is not None:
            cache_age_seconds = (timezone.now() - cached_packet_dt).total_seconds()
            has_newer_packet = (
                current_packet_dt is not None and current_packet_dt > cached_packet_dt
            )

            if cache_age_seconds <= LIVE_ETA_CACHE_SECONDS and not has_newer_packet:
                cached_payload = dict(cached)
                cached_payload["cached"] = True
                return cached_payload

    payload = _active_payload(active_trip)
    if payload.get("status") == "ACTIVE":
        cache.set(LIVE_ETA_CACHE_KEY, payload, LIVE_ETA_CACHE_SECONDS)

    return payload
