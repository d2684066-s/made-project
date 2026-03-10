import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RefreshCcw, Phone, MapPin, Navigation, Clock, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import { publicApi } from '../../lib/api';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { toast } from 'sonner';

const TrackBus = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const bus = location.state?.bus || null;

    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [buses, setBuses] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Google Maps configuration
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    });

    const mapContainerStyle = {
        width: '100%',
        height: '70vh',
        borderRadius: '16px',
    };

    const center = {
        lat: 20.2441, // Default to Keonjhar coordinates
        lng: 85.8337,
    };

    useEffect(() => {
        if (!bus) {
            toast.error("No bus selected for tracking.");
            navigate('/student/dashboard');
            return;
        }

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
                    // Use default location if geolocation fails
                    setUserLocation(center);
                }
            );
        } else {
            setUserLocation(center);
        }

        fetchETA();
        fetchData();
        const interval = setInterval(() => {
            fetchETA();
            fetchData();
        }, 15000); // refresh every 15 seconds
        return () => clearInterval(interval);
    }, [bus]);

    const fetchETA = async () => {
        if (!bus) return;
        setLoading(true);
        try {
            // Mocking user coordinates for testing purposes (e.g. university campus coordinates)
            const userLat = userLocation?.lat || 34.0522;
            const userLng = userLocation?.lng || -118.2437;
            const response = await publicApi.getBusETA(bus.vehicle_id, userLat, userLng);

            if (response.data) {
                setEta(response.data.eta || "Unknown");
                setDistance(response.data.distance || "calculating...");
            }
        } catch (error) {
            console.error("Failed to fetch ETA:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            const busesRes = await publicApi.getBuses();
            setBuses(busesRes.data.buses || []);
        } catch (error) {
            console.error('Failed to fetch buses:', error);
            toast.error('Failed to load bus data');
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
        toast.success('Map data refreshed');
    };

    if (loadError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-red-500 mb-4">Error loading Google Maps</div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Please check your internet connection and try again.
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin text-[#137fec] mb-4" style={{width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #137fec', borderRadius: '50%'}}></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse text-sm tracking-wide">
                    Loading map...
                </p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 mb-6 px-4 pt-4">
                <button
                    onClick={() => navigate(-1)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
                    title="Go back"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-black tracking-tight">Track Live</h2>
                    <p className="text-[10px] text-[#137fec] font-bold uppercase tracking-widest">Live Syncing</p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`p-2 rounded-xl transition-all ${refreshing ? 'animate-spin' : 'hover:bg-white dark:hover:bg-slate-800'}`}
                    title="Refresh"
                >
                    <RefreshCcw size={18} className="text-[#137fec]" />
                </button>
            </div>

            {/* Google Maps Section */}
            <div className="relative mb-8">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        zoom={15}
                        center={userLocation || center}
                        options={{
                            zoomControl: true,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: true,
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
                        {/* Bus Markers */}
                        {buses.map((busMarker) => {
                            if (!busMarker.location || !busMarker.location.lat || !busMarker.location.lng) return null;
                            
                            return (
                                <Marker
                                    key={busMarker.vehicle_id}
                                    position={{
                                        lat: parseFloat(busMarker.location.lat),
                                        lng: parseFloat(busMarker.location.lng)
                                    }}
                                    title={`${busMarker.vehicle_number} - ${busMarker.driver_name}`}
                                    icon={{
                                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="3"/>
                                                <circle cx="20" cy="20" r="8" fill="white"/>
                                                <text x="20" y="26" text-anchor="middle" fill="#10b981" font-size="12" font-weight="bold">🚌</text>
                                            </svg>
                                        `),
                                        scaledSize: new window.google.maps.Size(40, 40),
                                        anchor: new window.google.maps.Point(20, 40),
                                    }}
                                />
                            );
                        })}
                    </GoogleMap>
                </div>

                <div className="absolute bottom-6 right-6 flex flex-col gap-3">
                    <button className="bg-white dark:bg-slate-900 h-12 w-12 rounded-2xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-800 hover:scale-105 active:scale-95 transition-all text-[#137fec]">
                        <Navigation size={22} />
                    </button>
                </div>
            </div>

            {/* Status Card */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">ETA</p>
                    <h3 className="text-3xl font-black text-[#137fec]">
                        {loading && !eta ? '...' : eta || 'N/A'}
                    </h3>
                    <Clock size={40} className="absolute -right-4 -bottom-4 text-[#137fec]/5 rotate-12" />
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">Distance</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">
                        {distance || '---'}
                    </h3>
                    <MapPin size={40} className="absolute -right-4 -bottom-4 text-slate-400/5 -rotate-12" />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
                <button
                    onClick={fetchETA}
                    className="flex-1 bg-[#137fec] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-600 transition-all active:scale-[0.98]"
                >
                    <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh Live</span>
                </button>
                <button className="px-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
                    <Phone size={18} />
                </button>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-5 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-[#137fec]">
                        <Truck size={30} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Vehicle Details</p>
                        <h4 className="text-lg font-bold">{bus?.vehicle_number || "GCE-BUS-01"}</h4>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={18} className="text-green-500" />
                            <span className="text-sm font-bold">Driver</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{bus?.driver_name || "Assigned Driver"}</span>
                    </div>
                    
                    {bus?.driver_phone && (
                        <button
                            onClick={() => window.location.href = `tel:${bus.driver_phone}`}
                            className="w-full flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-[#137fec]" />
                                <span className="text-sm font-bold text-[#137fec]">Contact Driver</span>
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{bus.driver_phone}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackBus;
