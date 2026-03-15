import { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { useAuth } from '../../core/auth.context';
import { RefreshCw, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { publicApi } from '../../lib/api';

const API_URL = 'http://localhost:8000';

const DEFAULT_ZONES = [
    { name: 'Baitarani Hall of Residency', lat: 21.6363125, lng: 85.61898438, radius: 500 },
    { name: 'Gandhamardan Hall of Residence', lat: 21.6441625, lng: 85.57992188, radius: 500 },
    { name: 'Maa Tarini Hall of Residence', lat: 21.6441375, lng: 85.57757813, radius: 500 },
    { name: 'Baladevjew Hall of Residence', lat: 21.6449125, lng: 85.58048438, radius: 500 },
    { name: 'Administrative Block', lat: 21.6459469, lng: 85.5802506, radius: 500 },
];

const ActiveTrip = () => {
    const { user, token } = useAuth();
    const [userLocation, setUserLocation] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeBooking, setActiveBooking] = useState(null);
    const [zoneMarkers, setZoneMarkers] = useState(DEFAULT_ZONES);
    const [mapInstance, setMapInstance] = useState(null);

    // Google Maps configuration
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    });

    const mapContainerStyle = {
        width: '100%',
        height: '70vh',
        borderRadius: '16px',
        WebkitOverflowScrolling: 'touch',
    };

    const center = useMemo(() => ({
        lat: 21.641, // Center of Kendujhar area
        lng: 85.583,
    }), []);

    const normalizeZones = useCallback((zones) => {
        if (!Array.isArray(zones)) return [];
        return zones
            .map((zone) => ({
                name: zone?.name || 'Ambulance Zone',
                lat: Number(zone?.lat),
                lng: Number(zone?.lng),
                radius: Number(zone?.radius) || 500,
            }))
            .filter((zone) => Number.isFinite(zone.lat) && Number.isFinite(zone.lng));
    }, []);

    // Calculate bounds for a list of zones
    const getBounds = useCallback((zones) => {
        const bounds = new window.google.maps.LatLngBounds();
        zones.forEach((zone) => {
            bounds.extend({ lat: zone.lat, lng: zone.lng });
        });
        return bounds;
    }, []);

    const visibleZones = useMemo(() => {
        const allZones = normalizeZones(zoneMarkers);
        if (!activeBooking) {
            return allZones;
        }

        const place = String(activeBooking?.place || activeBooking?.pickup_location || '').toLowerCase().trim();
        const details = String(activeBooking?.place_details || activeBooking?.pickup_details || '').toLowerCase();

        const matchedZone = allZones.find((zone) => {
            const zoneName = zone.name.toLowerCase();
            return (
                (place && (zoneName === place || zoneName.includes(place) || place.includes(zoneName))) ||
                (details && details.includes(zoneName))
            );
        });

        if (matchedZone) {
            return [matchedZone];
        }

        const bookingLat = Number(activeBooking?.user_location?.lat ?? activeBooking?.user_location?.latitude);
        const bookingLng = Number(activeBooking?.user_location?.lng ?? activeBooking?.user_location?.longitude);

        if (Number.isFinite(bookingLat) && Number.isFinite(bookingLng)) {
            return [{
                name: activeBooking?.place || 'Selected Pickup Location',
                lat: bookingLat,
                lng: bookingLng,
                radius: 500,
            }];
        }

        return allZones;
    }, [activeBooking, normalizeZones, zoneMarkers]);

    // Restrict map to Kendujhar region
    const mapOptions = {
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy',
        restriction: {
            latLngBounds: {
                north: 22.20,
                south: 21.40,
                east: 86.40,
                west: 85.30,
            },
            strictBounds: true,
        },
        styles: [
            // Hide all points of interest
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
            },
            // Hide business points
            {
                featureType: 'poi.business',
                stylers: [{ visibility: 'off' }],
            },
            // Hide transit stations
            {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
            },
            // Simplify the map to show only roads and our markers
            {
                featureType: 'landscape',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
            },
            {
                featureType: 'administrative',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
            },
        ],
    };

    // Fit bounds when map loads
    const onMapLoad = useCallback((mapInstance) => {
        setMapInstance(mapInstance);
        if (window.google && window.google.maps) {
            const zonesToFit = visibleZones.length > 0 ? visibleZones : DEFAULT_ZONES;
            if (zonesToFit.length > 0) {
                const bounds = getBounds(zonesToFit);
                mapInstance.fitBounds(bounds, 80);
                const listener = window.google.maps.event.addListener(mapInstance, 'idle', () => {
                    if (mapInstance.getZoom() > 16) {
                        mapInstance.setZoom(16);
                    }
                    window.google.maps.event.removeListener(listener);
                });
            }
        }
    }, [getBounds, visibleZones]);

    const fetchZones = useCallback(async () => {
        try {
            const response = await publicApi.getAmbulanceZones();
            const data = response?.data || {};
            const zonesFromApi = normalizeZones(data.zones);
            setZoneMarkers(zonesFromApi.length > 0 ? zonesFromApi : DEFAULT_ZONES);
        } catch (error) {
            console.error('Error fetching ambulance zones:', error);
            setZoneMarkers(DEFAULT_ZONES);
        }
    }, [normalizeZones]);

    const fetchActiveBooking = useCallback(async () => {
        if (user?.driver_type !== 'ambulance' || !token) {
            setActiveBooking(null);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/driver/current-booking/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                setActiveBooking(null);
                return;
            }

            const data = await response.json();
            setActiveBooking(data?.booking || null);
        } catch (error) {
            console.error('Error fetching active booking:', error);
            setActiveBooking(null);
        }
    }, [token, user?.driver_type]);

    useEffect(() => {
        // Get user's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    setUserLocation(center);
                }
            );
        } else {
            setUserLocation(center);
        }

        fetchZones();
        fetchActiveBooking();
    }, [center, fetchActiveBooking, fetchZones]);

    useEffect(() => {
        if (user?.driver_type !== 'ambulance' || !token) {
            return;
        }

        const intervalId = setInterval(() => {
            fetchActiveBooking();
        }, 10000);

        return () => clearInterval(intervalId);
    }, [fetchActiveBooking, token, user?.driver_type]);

    useEffect(() => {
        if (!mapInstance || !window.google || visibleZones.length === 0) {
            return;
        }

        const bounds = getBounds(visibleZones);
        mapInstance.fitBounds(bounds, 80);
        if (mapInstance.getZoom() > 16) {
            mapInstance.setZoom(16);
        }
    }, [getBounds, mapInstance, visibleZones]);

    const handleRefresh = async () => {
        setRefreshing(true);
        // Refresh user location, zones and active booking
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setRefreshing(false);
                    toast.success('Location refreshed');
                },
                (error) => {
                    console.error('Error refreshing location:', error);
                    setRefreshing(false);
                    toast.error('Failed to refresh location');
                }
            );
        }

        await Promise.all([fetchZones(), fetchActiveBooking()]);
        setRefreshing(false);
    };

    if (loadError) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <div className="text-red-500 text-center">
                    <div className="text-lg font-semibold">Map Error</div>
                    <div className="text-sm">Unable to load Google Maps</div>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <div className="animate-spin text-[#137fec] mb-4" style={{width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #137fec', borderRadius: '50%'}}></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse text-sm tracking-wide">
                    Loading ambulance locations...
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">🚑 Ambulance Service Areas</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {activeBooking ? `Active pickup at: ${activeBooking.place || 'Selected location'}` : 'Available pickup locations'}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Refresh Location"
                >
                    <RefreshCw size={20} className={`text-[#137fec] ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Map */}
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={14}
                center={userLocation || center}
                options={mapOptions}
                onLoad={onMapLoad}
            >
                {/* Driver Location */}
                {userLocation && (
                    <Marker
                        position={userLocation}
                        title="Your Location"
                        icon={{
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="20" cy="20" r="18" fill="#137fec" stroke="white" stroke-width="3"/>
                                    <circle cx="20" cy="20" r="8" fill="white"/>
                                    <text x="20" y="26" text-anchor="middle" fill="#137fec" font-size="12" font-weight="bold">🚑</text>
                                </svg>
                            `),
                            scaledSize: new window.google.maps.Size(40, 40),
                            anchor: new window.google.maps.Point(20, 40),
                        }}
                    />
                )}

                {/* Ambulance Locations */}
                {visibleZones.map((location, index) => (
                    <Marker
                        key={`${location.name}-${index}`}
                        position={{ lat: location.lat, lng: location.lng }}
                        title={location.name}
                        icon={{
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="20" cy="20" r="18" fill="#dc2626" stroke="white" stroke-width="3"/>
                                    <circle cx="20" cy="20" r="8" fill="white"/>
                                    <text x="20" y="26" text-anchor="middle" fill="#dc2626" font-size="12" font-weight="bold">📍</text>
                                </svg>
                            `),
                            scaledSize: new window.google.maps.Size(40, 40),
                            anchor: new window.google.maps.Point(20, 40),
                        }}
                    />
                ))}
            </GoogleMap>

            {/* Location List */}
            <div className="mt-4 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Service Locations:</h3>
                {visibleZones.map((location, index) => (
                    <div key={`${location.name}-list-${index}`} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <MapPin size={16} className="text-red-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{location.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActiveTrip;
