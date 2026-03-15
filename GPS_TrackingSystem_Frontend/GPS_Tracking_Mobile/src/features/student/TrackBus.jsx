import { Fragment, useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker, Circle } from '@react-google-maps/api';
import { RefreshCw, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { publicApi } from '../../lib/api';

const TrackBus = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [zoneMarkers, setZoneMarkers] = useState([]);
    const [ambulanceActive, setAmbulanceActive] = useState(false);
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

    const fallbackZones = useMemo(() => ([
        { name: 'Baitarani Hall of Residency', lat: 21.6363125, lng: 85.61898438, radius: 500 },
        { name: 'Gandhamardan Hall of Residence', lat: 21.6441625, lng: 85.57992188, radius: 500 },
        { name: 'Maa Tarini Hall of Residence', lat: 21.6441375, lng: 85.57757813, radius: 500 },
        { name: 'Baladevjew Hall of Residence', lat: 21.6449125, lng: 85.58048438, radius: 500 },
        { name: 'Administrative Block', lat: 21.6459469, lng: 85.5802506, radius: 500 },
    ]), []);

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

    // Calculate bounds for a list of zone coordinates
    const getBounds = useCallback((zones) => {
        const bounds = new window.google.maps.LatLngBounds();
        zones.forEach((zone) => {
            bounds.extend({ lat: zone.lat, lng: zone.lng });
        });
        return bounds;
    }, []);

    // Restrict map to Kendujhar bounds
    const mapOptions = {
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        gestureHandling: 'greedy',
        restriction: {
            latLngBounds: {
                north: 22.20, // North boundary
                south: 21.40, // South boundary
                east: 86.40,  // East boundary
                west: 85.30,  // West boundary
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
            const initialZones = zoneMarkers.length > 0 ? zoneMarkers : fallbackZones;
            if (initialZones.length > 0) {
                const bounds = getBounds(initialZones);
                mapInstance.fitBounds(bounds, 80);

                // Clamp zoom so markers stay visible as a group.
                const listener = window.google.maps.event.addListener(mapInstance, 'idle', () => {
                    if (mapInstance.getZoom() > 16) {
                        mapInstance.setZoom(16);
                    }
                    window.google.maps.event.removeListener(listener);
                });
            }
        }
    }, [fallbackZones, getBounds, zoneMarkers]);

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

        // Fetch ambulance zones
        const fetchZones = async () => {
            try {
                const response = await publicApi.getAmbulanceZones();
                const data = response?.data || {};
                console.log("Zones API Response:", data);
                const normalizedApiZones = normalizeZones(data.zones);
                const zonesFromApi = normalizedApiZones.length > 0
                    ? normalizedApiZones
                    : normalizeZones(fallbackZones);
                setZoneMarkers(zonesFromApi);
                setAmbulanceActive(Boolean(data.ambulance_active));
            } catch (error) {
                console.error('Failed to fetch zones:', error);
                // Keep markers visible even if API call fails on mobile/local network.
                setZoneMarkers(normalizeZones(fallbackZones));
                setAmbulanceActive(false);
            }
        };
        fetchZones();
    }, [center, fallbackZones, normalizeZones]);

    useEffect(() => {
        if (!mapInstance || !window.google || zoneMarkers.length === 0) {
            return;
        }

        const bounds = getBounds(zoneMarkers);
        mapInstance.fitBounds(bounds, 80);

        if (mapInstance.getZoom() > 16) {
            mapInstance.setZoom(16);
        }
    }, [getBounds, mapInstance, zoneMarkers]);

    const handleRefresh = async () => {
        setRefreshing(true);
        // Refresh user location
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

    const shouldRenderZoneMarkers = zoneMarkers.length > 0;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">🚑 Ambulance Service Areas</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {ambulanceActive ? 'Ambulance trip currently active' : 'Available pickup locations'}
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
                zoom={12}
                center={center}
                options={mapOptions}
                onLoad={onMapLoad}
            >
                {/* User Location */}
                {userLocation && (
                    <Marker
                        position={userLocation}
                        title="Your Location"
                        icon={{
                            path: window.google.maps.SymbolPath.CIRCLE,
                            fillColor: '#137fec',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: 9,
                        }}
                    />
                )}

                {/* Ambulance Zones */}
                {shouldRenderZoneMarkers && zoneMarkers.map((zone, index) => (
                    <Fragment key={index}>
                        <Marker
                            position={{ lat: zone.lat, lng: zone.lng }}
                            title={zone.name}
                            icon={{
                                path: window.google.maps.SymbolPath.CIRCLE,
                                fillColor: '#dc2626',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 2,
                                scale: 8,
                            }}
                            zIndex={1000}
                            onClick={() => {
                                window.open(`https://www.google.com/maps?q=${zone.lat},${zone.lng}`, '_blank');
                            }}
                        />
                        <Circle
                            center={{ lat: zone.lat, lng: zone.lng }}
                            radius={zone.radius}
                            options={{
                                fillColor: '#dc2626',
                                fillOpacity: 0.1,
                                strokeColor: '#dc2626',
                                strokeOpacity: 0.3,
                                strokeWeight: 2,
                            }}
                        />
                    </Fragment>
                ))}
            </GoogleMap>

            {/* Location List */}
            <div className="mt-4 space-y-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Ambulance Service Zones:</h3>
                {shouldRenderZoneMarkers && zoneMarkers.map((zone, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <MapPin size={16} className="text-red-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{zone.name}</span>
                        <button
                            onClick={() => window.open(`https://www.google.com/maps?q=${zone.lat},${zone.lng}`, '_blank')}
                            className="ml-auto text-xs bg-red-500 text-white px-2 py-1 rounded"
                        >
                            Open in Maps
                        </button>
                    </div>
                ))}
                {!shouldRenderZoneMarkers && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <MapPin size={16} className="text-slate-400" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Zone markers are temporarily unavailable.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackBus;
