import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth.context';
import { driverApi } from '../../lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2, Power, Navigation, Phone, ChevronRight, Truck, Siren, Activity, Clock, RefreshCw, X, MapPin } from 'lucide-react';
import NavigationMap from '../../components/NavigationMap';
import LocationServiceCheck from '../../components/LocationServiceCheck';

const API_URL = 'http://localhost:8000'; // backend URL

const Dashboard = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();

    const [vehicles, setVehicles] = useState([]);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [activeTrip, setActiveTrip] = useState(null);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [isOnline, setIsOnline] = useState(true);
    const [loading, setLoading] = useState(true);
    const [assigningVehicle, setAssigningVehicle] = useState(false);
    const [showVehicleChange, setShowVehicleChange] = useState(false);
    const [availableVehicles, setAvailableVehicles] = useState([]);
    const [currentBooking, setCurrentBooking] = useState(null);
    const [eta, setEta] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [showNavigationMap, setShowNavigationMap] = useState(false);
    const [showLocationPermissionCheck, setShowLocationPermissionCheck] = useState(false);

    const isBusDriver = user?.driver_type === 'bus';

    const handleRefreshDashboard = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchVehicles(),
                fetchActiveTrip(),
                fetchPendingRequests(),
                !isBusDriver && fetchCurrentBooking()
            ]);
            toast.success('Dashboard refreshed');
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            toast.error('Failed to refresh dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);
            try {
                // For ambulance drivers: Check if location permission was already granted
                if (!isBusDriver) {
                    const locationGranted = localStorage.getItem('location_permission_granted');
                    if (!locationGranted) {
                        // Show location permission check - wait for user action
                        setShowLocationPermissionCheck(true);
                        setLoading(false);
                        return; // Don't fetch other data until location permission is handled
                    }
                }

                // Only fetch data if we don't need to check location permission
                await Promise.all([
                    fetchVehicles(),
                    fetchActiveTrip(),
                    fetchPendingRequests(),
                    !isBusDriver && fetchCurrentBooking()
                ]);
            } catch (err) {
                console.error("Dashboard init error:", err);
            } finally {
                setLoading(false);
            }
        };
        initDashboard();

        const interval = setInterval(() => {
            fetchActiveTrip();
            fetchPendingRequests();
        }, 15000);

        return () => clearInterval(interval);
    }, [user, token, isBusDriver]);

    const fetchVehicles = async () => {
        try {
            const type = isBusDriver ? 'bus' : 'ambulance';
            const response = await driverApi.getAvailableVehicles(type, token);
            const vehiclesList = response.data.vehicles || [];
            setVehicles(vehiclesList);
            
            // Check if any vehicle is currently assigned to this driver
            const assignedVehicle = vehiclesList.find(v => v.assigned_to);
            
            // Try to restore from localStorage if not found in response
            const lastAssignedId = localStorage.getItem(`${type}_assigned_vehicle_${user?.id}`);
            if (lastAssignedId && !assignedVehicle) {
                const restoredVehicle = vehiclesList.find(v => v.id === lastAssignedId);
                if (restoredVehicle) {
                    setSelectedVehicle(restoredVehicle);
                }
            } else if (assignedVehicle && !selectedVehicle) {
                setSelectedVehicle(assignedVehicle);
                localStorage.setItem(`${type}_assigned_vehicle_${user?.id}`, assignedVehicle.id);
            }
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
        }
    };

    const fetchActiveTrip = async () => {
        try {
            const response = await driverApi.getActiveTrip(token);
            if (response.data.trip) {
                setActiveTrip(response.data.trip);
                setSelectedVehicle(response.data.trip.vehicle_data || { vehicle_number: response.data.trip.vehicle_id });
            }
        } catch (error) { }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await driverApi.getPendingBookings(token);
            if (response.data.bookings) {
                setPendingRequests(response.data.bookings.slice(0, 3) || []);
            }
        } catch (error) { }
    };

    const handleEngineOK = async () => {
        if (!isOnline) {
            toast.error('Please turn on shift status first');
            // Auto logout after showing error
            setTimeout(() => {
                navigate('/login');
                toast.info('Please start your shift before assigning a vehicle.');
            }, 2000);
            return;
        }

        if (selectedVehicle) {
            toast.info('Vehicle already assigned');
            return;
        }

        setAssigningVehicle(true);
        try {
            // Auto-assign first available vehicle
            if (vehicles.length === 0) {
                toast.error('No vehicles available');
                return;
            }

            const vehicleToAssign = vehicles[0]; // Take first available
            await driverApi.assignVehicle(vehicleToAssign.id, token);
            
            setSelectedVehicle(vehicleToAssign);
            
            // Store in localStorage to persist on refresh
            const type = isBusDriver ? 'bus' : 'ambulance';
            localStorage.setItem(`${type}_assigned_vehicle_${user?.id}`, vehicleToAssign.id);
            
            toast.success(`${isBusDriver ? 'Bus' : 'Ambulance'} assigned successfully!`);
            
            // TODO: API call to notify public/student app about bus assignment
            
        } catch (error) {
            console.error('Failed to assign vehicle:', error);
            toast.error('Failed to assign vehicle');
        } finally {
            setAssigningVehicle(false);
        }
    };

    const handleShiftToggle = async (online) => {
        setIsOnline(online);
        if (!online) {
            // Going offline - stop GPS, log timestamp, auto-logout
            try {
                if (activeTrip) {
                    await driverApi.endTrip(activeTrip.id, token);
                    toast.info('Trip ended due to shift completion');
                }
                if (selectedVehicle) {
                    await driverApi.releaseVehicle(selectedVehicle.id, token);
                    toast.info('Vehicle released');
                    
                    // Clear from localStorage
                    const type = isBusDriver ? 'bus' : 'ambulance';
                    localStorage.removeItem(`${type}_assigned_vehicle_${user?.id}`);
                    localStorage.removeItem('location_permission_granted');
                }
                setSelectedVehicle(null);
                setActiveTrip(null);
                setCurrentBooking(null);
                
                // Auto logout after a short delay
                setTimeout(() => {
                    logout(); // Call logout from auth context
                    navigate('/login', { replace: true });
                    toast.success('Shift ended. Logged out automatically.');
                }, 1000);
            } catch (error) {
                console.error('Error ending shift:', error);
                toast.error('Error ending shift');
                setIsOnline(true); // Reset toggle if error
            }
        } else {
            // Going online - could start GPS tracking here
            toast.success('Shift started. GPS tracking activated.');
        }
    };

    const handleVehicleChange = async (vehicleId) => {
        const oldVehicle = selectedVehicle;
        try {
            // Assign new vehicle first (safer approach)
            const vehicleToAssign = availableVehicles.find(v => v.id === vehicleId);
            if (!vehicleToAssign) {
                toast.error('Selected vehicle not found');
                return;
            }
            
            // Try to assign new vehicle first
            await driverApi.assignVehicle(vehicleId, token);
            
            // Only release old vehicle if new assignment succeeded
            if (oldVehicle) {
                try {
                    await driverApi.releaseVehicle(oldVehicle.id, token);
                } catch (releaseError) {
                    // If release fails, it's okay - vehicle might already be released
                    console.warn('Could not release old vehicle, but new one assigned:', releaseError);
                }
                
                const type = isBusDriver ? 'bus' : 'ambulance';
                localStorage.removeItem(`${type}_assigned_vehicle_${user?.id}`);
            }
            
            // Update UI
            setSelectedVehicle(vehicleToAssign);
            
            // Store in localStorage
            const type = isBusDriver ? 'bus' : 'ambulance';
            localStorage.setItem(`${type}_assigned_vehicle_${user?.id}`, vehicleId);
            
            toast.success(`${isBusDriver ? 'Bus' : 'Ambulance'} changed successfully!`);
            setShowVehicleChange(false);
            
            // Refresh vehicle list
            setTimeout(() => {
                fetchVehicles();
            }, 500);
        } catch (error) {
            console.error('Failed to change vehicle:', error);
            toast.error('Failed to change vehicle: ' + (error.response?.data?.detail || error.message));
            // Refresh vehicles to sync state
            fetchVehicles();
        }
    };

    const fetchAvailableVehicles = async () => {
        try {
            const vehicleType = isBusDriver ? 'bus' : 'ambulance';
            const response = await driverApi.getAvailableVehicles(vehicleType, token);
            setAvailableVehicles(response.data?.vehicles || []);
        } catch (error) {
            console.error('Failed to fetch available vehicles:', error);
            toast.error('Failed to load available vehicles');
        }
    };

    const fetchCurrentBooking = async () => {
        if (isBusDriver) return; // Only for ambulance drivers
        
        try {
            // Get current active booking for this driver
            const response = await axios.get(`${API_URL}/api/driver/current-booking/`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // backend now returns { booking: {...} } or { booking: null }
            const bookingData = response.data?.booking || null;
            if (bookingData) {
                setCurrentBooking(bookingData);
                calculateETA(bookingData);
            } else {
                setCurrentBooking(null);
            }
        } catch (error) {
            // unexpected errors still logged
            console.error('Failed to fetch current booking:', error);
        }
    };

    const calculateETA = (booking) => {
        if (!booking || !booking.user_location) return;

        // Get driver's current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const driverLat = position.coords.latitude;
                    const driverLng = position.coords.longitude;
                    setDriverLocation({ lat: driverLat, lng: driverLng });

                    // Calculate distance and ETA
                    const userLat = booking.user_location.latitude || booking.user_location.lat;
                    const userLng = booking.user_location.longitude || booking.user_location.lng;

                    if (userLat && userLng) {
                        const distance = getDistance(driverLat, driverLng, userLat, userLng);
                        // Assume average speed of 30 km/h for ambulance
                        const etaMinutes = Math.ceil((distance / 30) * 60);
                        setEta({ distance: distance.toFixed(1), minutes: etaMinutes });
                    }
                },
                (error) => {
                    // code: 2 = position temporarily unavailable (weak signal, indoors)
                    if (error.code === 2) {
                        // Don't spam console - this is normal when GPS signal weak or indoors
                        return;
                    } else if (error.code === 1) {
                        console.warn('Geolocation permission denied');
                    } else {
                        console.error('Unexpected geolocation error:', error);
                    }
                }
            );
        }
    };

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const d = R * c; // Distance in km
        return d;
    };

    const deg2rad = (deg) => {
        return deg * (Math.PI/180);
    };

    const handleEndTrip = async () => {
        // For ambulance drivers: complete the booking
        // For bus drivers: end the trip
        
        if (!isBusDriver && currentBooking) {
            // Ambulance driver - complete the booking
            return handleCompleteBooking();
        }
        
        if (!activeTrip) {
            toast.error('No active trip found');
            return;
        }
        
        try {
            const response = await driverApi.endTrip(activeTrip.id, token);
            console.log('End trip response:', response);
            
            setActiveTrip(null);
            setCurrentBooking(null);
            setShowNavigationMap(false);
            
            toast.success('Trip ended successfully!');
            
            setTimeout(() => {
                fetchActiveTrip();
                fetchCurrentBooking();
                fetchPendingRequests();
            }, 500);
            
        } catch (error) {
            console.error('Failed to end trip:', error);
            const errorMsg = error.response?.data?.detail || error.message;
            toast.error('Failed to end trip: ' + errorMsg);
            setTimeout(() => {
                fetchActiveTrip();
                fetchCurrentBooking();
            }, 500);
        }
    };

    const handleCompleteBooking = async () => {
        if (!currentBooking) {
            toast.error('No active booking found');
            return;
        }

        try {
            const response = await driverApi.completeBooking(currentBooking.id, token);
            console.log('Complete booking response:', response);
            
            setCurrentBooking(null);
            setShowNavigationMap(false);
            
            toast.success('Booking completed successfully!');
            
            setTimeout(() => {
                fetchCurrentBooking();
                fetchPendingRequests();
            }, 500);
            
        } catch (error) {
            console.error('Failed to complete booking:', error);
            const errorMsg = error.response?.data?.detail || error.message;
            toast.error('Failed to complete booking: ' + errorMsg);
            setTimeout(() => {
                fetchCurrentBooking();
            }, 500);
        }
    };

    useEffect(() => {
        if (showVehicleChange) {
            fetchAvailableVehicles();
        }
    }, [showVehicleChange]);

    useEffect(() => {
        if (!isBusDriver && token) {
            fetchCurrentBooking();
            
            // when driver comes online we use shared helper defined later
            // get location immediately
            updateDriverLocation();
            
            // Update location and ETA every 10 seconds
            const interval = setInterval(() => {
                updateDriverLocation();
                if (currentBooking) {
                    calculateETA(currentBooking);
                }
            }, 10000);
            
            return () => clearInterval(interval);
        }
    }, [isBusDriver, token, currentBooking]);

    // helper wrapper to reduce noise when permission denied
    const updateDriverLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setDriverLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    // code: 1 = permission denied, code: 2 = temporarily unavailable (weak signal, indoors, etc.)
                    if (error.code === 1) {
                        // permission denied - show once
                        if (!localStorage.getItem('geo_error_shown')) {
                            toast.error('Location Permission Required', {
                                description: 'Please enable location permissions for accurate ambulance tracking'
                            });
                            localStorage.setItem('geo_error_shown', '1');
                        }
                    } else if (error.code === 2) {
                        // Position unavailable - don't spam console, just silently retry
                        // Common when indoors or poor GPS signal
                        return;
                    } else {
                        console.error('Unexpected geolocation error:', error);
                    }
                }
            );
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-[#137fec] mb-4" size={40} />
                <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse text-sm tracking-wide">Connecting to dispatcher...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
            {/* Status & Shift Info */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl transition-all ${isOnline ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                            <Power size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mb-1">Shift Status</p>
                            <h3 className={`text-xl font-black ${isOnline ? 'text-green-500' : 'text-slate-500'}`}>
                                {isOnline ? 'Active on Duty' : 'Offline'}
                            </h3>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isOnline}
                            onChange={(e) => handleShiftToggle(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-8 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                    </label>
                </div>
            </div>

            {/* Vehicle Card */}
            <section>
                <div className="flex items-center justify-between mb-5 px-1">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <div className="bg-blue-500/10 p-2 rounded-lg text-[#137fec]">
                            {isBusDriver ? <Truck size={18} /> : <Siren size={18} />}
                        </div>
                        Active Vehicle
                    </h2>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefreshDashboard}
                            disabled={loading}
                            className={`p-2 rounded-lg transition-all ${loading ? 'animate-spin' : 'hover:bg-white dark:hover:bg-slate-800'}`}
                            title="Refresh dashboard"
                        >
                            <RefreshCw size={18} className="text-[#137fec]" />
                        </button>
                        <button
                            onClick={() => setShowVehicleChange(true)}
                            className="text-[10px] font-black uppercase tracking-widest text-[#137fec] hover:underline"
                        >
                            Select Engine
                        </button>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 shadow-2xl group transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-blue-500/10 h-52">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#137fec]/20 via-transparent to-black/60 z-10"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#137fec]/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>

                    <div className="relative z-20 p-8 flex flex-col h-full justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                                <span className="text-[10px] text-white/50 font-black uppercase tracking-[0.3em]">Operational</span>
                            </div>
                            <h3 className="text-3xl font-black text-white">
                                {selectedVehicle?.vehicle_number || 'No Vehicle'}
                            </h3>
                            <p className="text-white/40 font-mono text-sm tracking-[0.2em] mt-2">
                                {isBusDriver ? 'UNIT-TRANS-GCE' : 'EMERGENCY-UNIT-1'}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleEngineOK}
                                disabled={assigningVehicle}
                                className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10 hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {assigningVehicle ? (
                                    <RefreshCw size={14} className="text-green-400 animate-spin" />
                                ) : (
                                    <Activity size={14} className="text-green-400" />
                                )}
                                <span className="text-xs font-bold text-white uppercase">
                                    {assigningVehicle ? 'Assigning...' : 'Engine OK'}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="absolute right-0 bottom-0 pointer-events-none opacity-20 transition-all group-hover:opacity-40 translate-x-10 translate-y-10 group-hover:translate-x-4 group-hover:translate-y-4">
                        {isBusDriver ? (
                            <Truck size={280} className="text-white rotate-[15deg]" />
                        ) : (
                            <Siren size={280} className="text-white rotate-[15deg]" />
                        )}
                    </div>
                </div>
            </section>

            {/* Main Action / Trip - Only for Ambulance Drivers */}
            {!isBusDriver && (
                <section>
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <div className="bg-purple-500/10 p-2 rounded-lg text-purple-500">
                                <Navigation size={18} />
                            </div>
                            Current Mission
                        </h2>
                        {currentBooking && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#137fec] px-3 py-1 bg-[#137fec]/10 rounded-full">Active</span>
                        )}
                    </div>

                    {currentBooking ? (
                        <div className="space-y-6">
                            {/* Booking Details */}
                            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                            {currentBooking.student_name || 'Emergency Patient'}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            ID: {currentBooking.student_registration_id}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {currentBooking.phone}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                                            {currentBooking.status}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-red-500" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                Pickup Location
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {currentBooking.place_details || currentBooking.place}
                                            </p>
                                        </div>
                                    </div>

                                    {eta && (
                                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    Distance: {eta.distance} km
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    ETA: {eta.minutes} minutes
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-[#137fec]">
                                                    {eta.minutes}m
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mini Map */}
                            {driverLocation && currentBooking.user_location && (
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        {/* Simple map placeholder - in real implementation, use react-leaflet */}
                                        <div className="h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                                            <div className="text-center">
                                                <MapPin size={32} className="mx-auto mb-2 text-[#137fec]" />
                                                <p className="text-sm font-medium">Live Tracking</p>
                                                <p className="text-xs">Distance: {eta?.distance || '0'} km</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowNavigationMap(true)}
                                    className="flex-1 bg-[#137fec] hover:bg-blue-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98]"
                                >
                                    <Navigation size={20} />
                                    <span>Navigate</span>
                                </button>
                                <button
                                    onClick={handleEndTrip}
                                    className="px-6 py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-red-500/20 transition-all active:scale-[0.98]"
                                >
                                    <span>End Trip</span>
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (currentBooking?.phone) {
                                            window.location.href = `tel:${currentBooking.phone}`;
                                        }
                                    }}
                                    className="h-14 w-14 bg-green-100 dark:bg-green-500/10 rounded-2xl flex items-center justify-center text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20 transition-all"
                                >
                                    <Phone size={20} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900/50 p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all"
                            onClick={() => navigate('/driver/pending-requests')}
                        >
                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] mb-4 text-slate-300 group-hover:scale-110 group-hover:rotate-6 transition-all">
                                <Navigation size={40} />
                            </div>
                            <h4 className="text-lg font-bold mb-2">No Active Mission</h4>
                            <p className="text-sm text-slate-400 max-w-[200px] mb-6">Check pending requests to accept new bookings.</p>
                            <button className="text-[#137fec] font-black uppercase tracking-widest text-[10px] border-2 border-[#137fec]/20 px-6 py-3 rounded-full hover:bg-[#137fec] hover:text-white transition-all shadow-sm">
                                View Requests
                            </button>
                        </div>
                    )}
                </section>
            )}

            {/* Pending Requests - Only for Ambulance Drivers */}
            {!isBusDriver && (
                <section className="pb-10">
                    <div className="flex items-center justify-between mb-5 px-1">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
                                <Clock size={18} />
                            </div>
                            Queue Management
                        </h2>
                        <button onClick={() => navigate('/driver/pending-requests')} className="text-[10px] font-black uppercase tracking-widest text-[#137fec] hover:underline">See Queue ({pendingRequests.length})</button>
                    </div>

                    <div className="grid gap-3">
                        {pendingRequests.length === 0 ? (
                            <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-center text-sm text-slate-400 font-medium italic">
                                Empty Queue. Enjoy your break!
                            </div>
                        ) : (
                            pendingRequests.map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => navigate('/driver/pending-requests')}
                                    className="bg-white dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-white dark:hover:bg-slate-900 transition-all hover:shadow-lg shadow-blue-500/5"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all ${req.priority === 'high' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-[#137fec]'}`}>
                                            {req.priority === 'high' ? <Activity size={24} /> : <Truck size={24} />}
                                        </div>
                                        <div>
                                            <p className="text-base font-bold dark:text-white group-hover:text-[#137fec] transition-colors">{req.student_name || req.student_registration_id || 'Passenger Request'}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{new Date(req.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                <span className="h-1 w-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
                                                <span className="text-[10px] text-[#137fec] font-black uppercase tracking-widest truncate max-w-[120px]">{req.place || req.pickup_location || 'Campus Stop'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-[#137fec] group-hover:translate-x-1 transition-all" />
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {/* Vehicle Change Modal */}
            {showVehicleChange && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                Change {isBusDriver ? 'Bus' : 'Ambulance'}
                            </h3>
                            <button
                                onClick={() => setShowVehicleChange(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {availableVehicles.length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                                    No {isBusDriver ? 'buses' : 'ambulances'} available
                                </p>
                            ) : (
                                availableVehicles.map(vehicle => (
                                    <button
                                        key={vehicle.id}
                                        onClick={() => handleVehicleChange(vehicle.id)}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left border border-slate-200 dark:border-slate-600"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {vehicle.vehicle_number}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {vehicle.model || 'Standard Model'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                    Available
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Map Modal */}
            {/* Location Service Check Modal */}
            {showLocationPermissionCheck && (
                <LocationServiceCheck
                    onPermissionGranted={async () => {
                        localStorage.setItem('location_permission_granted', 'true');
                        setShowLocationPermissionCheck(false);
                        
                        // Now fetch remaining data
                        setLoading(true);
                        try {
                            await Promise.all([
                                fetchVehicles(),
                                fetchActiveTrip(),
                                fetchPendingRequests(),
                                !isBusDriver && fetchCurrentBooking()
                            ]);
                        } catch (err) {
                            console.error("Dashboard data fetch error:", err);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    onPermissionDenied={() => {
                        // User denied location but can still use app
                        setShowLocationPermissionCheck(false);
                        setLoading(true);
                        
                        setTimeout(async () => {
                            try {
                                await Promise.all([
                                    fetchVehicles(),
                                    fetchActiveTrip(),
                                    fetchPendingRequests(),
                                    !isBusDriver && fetchCurrentBooking()
                                ]);
                            } catch (err) {
                                console.error("Dashboard data fetch error:", err);
                            } finally {
                                setLoading(false);
                            }
                        }, 500);
                    }}
                />
            )}

            {showNavigationMap && currentBooking && (
                <NavigationMap
                    driverLocation={driverLocation || { lat: 0, lng: 0 }}
                    patientLocation={currentBooking.user_location}
                    onClose={() => setShowNavigationMap(false)}
                    distance={eta?.distance}
                    eta={eta}
                    patient={currentBooking}
                    onCall={() => {
                        if (currentBooking.phone) {
                            window.location.href = `tel:${currentBooking.phone}`;
                        }
                    }}
                />
            )}
        </div>
    );
};

export default Dashboard;
