import { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Navigation, Phone, X } from 'lucide-react';
import { toast } from 'sonner';

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyAsZz4Ug4mCoN40gS_2Dv2fcmpwYm9-ctQ';

const LiveAmbulanceMap = ({ studentLoc, driverLoc, destination, eta, distance, driverPhone, onClose, isDriver = false }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);

    useEffect(() => {
        // Load Google Maps script if not already loaded
        if (window.google && window.google.maps) {
            initializeMap();
        } else {
            loadGoogleMapsScript();
        }

        return () => {
            // Cleanup markers
            markersRef.current.forEach(marker => marker?.setMap(null));
        };
    }, []);

    const loadGoogleMapsScript = () => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=marker`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        document.head.appendChild(script);
    };

    const initializeMap = () => {
        if (!mapRef.current) return;

        const center = studentLoc || { lat: 20.2441, lng: 85.8337 };
        
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
            zoom: 15,
            center: center,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true,
            streetViewControl: false,
            styles: [
                {
                    featureType: 'all',
                    elementType: 'labels.text.fill',
                    stylers: [{ color: '#333333' }]
                }
            ]
        });

        addMarkers();
    };

    const addMarkers = () => {
        if (!mapInstanceRef.current) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Student location (pickup)
        if (studentLoc) {
            const studentMarker = new window.google.maps.Marker({
                position: studentLoc,
                map: mapInstanceRef.current,
                title: 'Your Location',
                icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            });
            new window.google.maps.InfoWindow({
                content: '<div style="padding:8px"><strong>Your Location</strong><br/>Pickup Point</div>'
            }).open(mapInstanceRef.current, studentMarker);
            markersRef.current.push(studentMarker);
        }

        // Driver location (ambulance)
        if (driverLoc) {
            const driverMarker = new window.google.maps.Marker({
                position: driverLoc,
                map: mapInstanceRef.current,
                title: 'Ambulance',
                icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            });
            new window.google.maps.InfoWindow({
                content: '<div style="padding:8px"><strong>Ambulance</strong><br/>En route to you</div>'
            }).open(mapInstanceRef.current, driverMarker);
            markersRef.current.push(driverMarker);
        }

        // Draw polyline between student and driver
        if (studentLoc && driverLoc) {
            const polyline = new window.google.maps.Polyline({
                path: [studentLoc, driverLoc],
                geodesic: true,
                strokeColor: '#137fec',
                strokeOpacity: 0.7,
                strokeWeight: 3,
                map: mapInstanceRef.current
            });
            markersRef.current.push(polyline);

            // Fit bounds
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend(studentLoc);
            bounds.extend(driverLoc);
            mapInstanceRef.current.fitBounds(bounds, 50);
        }
    };

    useEffect(() => {
        addMarkers();
    }, [studentLoc, driverLoc]);

    const handlePhoneCall = () => {
        if (driverPhone) {
            window.location.href = `tel:${driverPhone}`;
        } else {
            toast.error('Driver phone not available');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl w-full md:max-w-2xl max-h-[90vh] overflow-auto border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-10">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            🚑 Live Ambulance Tracking
                            <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                LIVE
                            </span>
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Real-time navigation & ETA</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>

                {/* Map Container */}
                <div
                    ref={mapRef}
                    className="w-full h-96 md:h-[500px] bg-slate-100 dark:bg-slate-800"
                />

                {/* Info Panel */}
                <div className="p-6 space-y-4">
                    {/* Real-time Location Status */}
                    <div className="bg-green-50 dark:bg-green-500/10 p-3 rounded-lg border-2 border-green-500/30 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">📍 Real-Time Location Tracking Active</span>
                    </div>

                    {/* Your Location & Ambulance Position */}
                    <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div className="bg-blue-50 dark:bg-blue-500/10 p-2 rounded-lg border border-blue-200 dark:border-blue-500/20">
                            <p className="font-bold text-blue-700 dark:text-blue-400 mb-1">Your Location</p>
                            <p className="font-mono text-slate-700 dark:text-slate-300">{studentLoc?.lat?.toFixed(4)}, {studentLoc?.lng?.toFixed(4)}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-500/10 p-2 rounded-lg border border-red-200 dark:border-red-500/20">
                            <p className="font-bold text-red-700 dark:text-red-400 mb-1">Ambulance Position</p>
                            <p className="font-mono text-slate-700 dark:text-slate-300">{driverLoc?.lat?.toFixed(4)}, {driverLoc?.lng?.toFixed(4)}</p>
                        </div>
                    </div>

                    {/* ETA & Distance */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-200 dark:border-blue-500/30">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">ETA</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{eta || '--'} min</p>
                        </div>

                        <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-2xl border border-green-200 dark:border-green-500/30">
                            <div className="flex items-center gap-2 mb-1">
                                <Navigation size={16} className="text-green-600 dark:text-green-400" />
                                <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Distance</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{distance || '--'} km</p>
                        </div>
                    </div>

                    {/* Destination */}
                    {destination && (
                        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                            <MapPin size={18} className="text-[#137fec] mt-1 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Destination</p>
                                <p className="font-bold text-slate-900 dark:text-white">{destination}</p>
                            </div>
                        </div>
                    )}

                    {/* Status Message */}
                    <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/30">
                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                            🚑 Ambulance is on the way to you. Stay ready and look for the vehicle.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    {!isDriver && driverPhone && (
                        <button
                            onClick={handlePhoneCall}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl"
                        >
                            <Phone size={18} />
                            Call Ambulance Driver
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3 px-4 rounded-2xl transition-colors"
                    >
                        Close Map
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LiveAmbulanceMap;
