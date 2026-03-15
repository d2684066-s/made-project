import { useState, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { ALLOWED_LOCATIONS } from '../config/allowedLocations';

const AmbulanceLocationsMap = ({ selectedLocation = null, showAllLocations = true }) => {
    const [userLocation, setUserLocation] = useState(null);

    // Google Maps configuration
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    });

    const mapContainerStyle = {
        width: '100%',
        height: '300px',
        borderRadius: '16px',
        WebkitOverflowScrolling: 'touch',
    };

    const center = {
        lat: 21.641, // Center of Kendujhar area
        lng: 85.583,
    };

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
    }, []);

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
                    Loading map...
                </p>
            </div>
        );
    }

    // Determine which locations to show
    let locationsToShow = [];
    if (showAllLocations) {
        locationsToShow = ALLOWED_LOCATIONS;
    } else if (selectedLocation) {
        // Find the selected location
        const selectedLoc = ALLOWED_LOCATIONS.find(loc =>
            loc.name.toLowerCase().includes(selectedLocation.toLowerCase()) ||
            selectedLocation.toLowerCase().includes(loc.name.toLowerCase())
        );
        if (selectedLoc) {
            locationsToShow = [selectedLoc];
        } else {
            locationsToShow = ALLOWED_LOCATIONS; // fallback
        }
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={14}
                center={userLocation || center}
                options={{
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    gestureHandling: 'greedy',
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }],
                        },
                    ],
                }}
            >
                {/* User Location */}
                {userLocation && (
                    <Marker
                        position={userLocation}
                        title="Your Location"
                        icon={{
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="20" cy="20" r="18" fill="#137fec" stroke="white" stroke-width="3"/>
                                    <circle cx="20" cy="20" r="8" fill="white"/>
                                </svg>
                            `),
                            scaledSize: new window.google.maps.Size(40, 40),
                            anchor: new window.google.maps.Point(20, 40),
                        }}
                    />
                )}

                {/* Ambulance Locations */}
                {locationsToShow.map((location) => (
                    <Marker
                        key={location.id}
                        position={location.coordinates}
                        title={location.name}
                        icon={{
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="20" cy="20" r="18" fill="#dc2626" stroke="white" stroke-width="3"/>
                                    <circle cx="20" cy="20" r="8" fill="white"/>
                                    <text x="20" y="26" text-anchor="middle" fill="#dc2626" font-size="12" font-weight="bold">🚑</text>
                                </svg>
                            `),
                            scaledSize: new window.google.maps.Size(40, 40),
                            anchor: new window.google.maps.Point(20, 40),
                        }}
                    />
                ))}
            </GoogleMap>
        </div>
    );
};

export default AmbulanceLocationsMap;