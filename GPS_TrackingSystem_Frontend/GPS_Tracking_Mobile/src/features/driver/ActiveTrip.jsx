import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../core/auth.context';
import { driverApi } from '../../lib/api';
import { toast } from 'sonner';
import NavigationMap from '../../components/NavigationMap';
import { ArrowLeft, MoreVertical, MapPin, User, Phone, Info, AlertCircle, Play, Square } from 'lucide-react';

const ActiveTrip = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showMap, setShowMap] = useState(false);
    const [driverLocation, setDriverLocation] = useState(null);

    useEffect(() => {
        fetchActiveTrip();
        
        // Get location immediately
        updateLocation();
        
        // Update location every 10 seconds
        const interval = setInterval(updateLocation, 10000);
        
        return () => clearInterval(interval);
    }, []);

    const updateLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setDriverLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    // code: 2 = position temporarily unavailable (weak signal, indoors)
                    if (error.code === 2) {
                        // Don't spam console - this is normal when GPS signal weak or indoors
                        return;
                    } else if (error.code === 1) {
                        // Permission denied
                        console.warn('Geolocation permission denied');
                    } else {
                        console.error('Error getting location:', error);
                    }
                }
            );
        }
    };

    const fetchActiveTrip = async () => {
        try {
            const response = await driverApi.getActiveTrip(token);
            if (response.data.trip) {
                setTrip(response.data.trip);
            }
        } catch (error) {
            console.error('Error fetching trip:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEndTrip = async () => {
        if (!trip) {
            toast.error('No active trip found');
            return;
        }

        try {
            // Check if we need to complete a booking first (for ambulance drivers)
            if (trip.booking_data) {
                // Complete the booking first
                await driverApi.completeBooking(trip.booking_data.id, token);
            }

            // Then end the trip
            const response = await driverApi.endTrip(trip.id, token);
            console.log('End trip response:', response);
            toast.success("Trip ended successfully");
            
            // Navigate back after a short delay
            setTimeout(() => {
                navigate('/driver/dashboard');
            }, 1000);
        } catch (error) {
            console.error('Failed to end trip:', error);
            toast.error("Failed to end trip: " + (error.response?.data?.detail || error.message));
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col bg-[#f6f7f8] dark:bg-[#101922] text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden pb-32 transition-colors duration-300">
            {/* Top Header */}
            <header className="flex items-center bg-[#f6f7f8]/80 dark:bg-[#101922]/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300">
                <button
                    onClick={() => navigate('/driver/dashboard')}
                    className="flex h-10 w-10 shrink-0 items-center justify-center hover:text-[#137fec] transition-colors active:scale-95"
                    title="Go back"
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">Active Trip</h2>
                <button className="hover:bg-slate-200 dark:hover:bg-slate-800 p-2 rounded-full transition-colors active:scale-95" title="More options">
                    <MoreVertical size={20} className="text-[#137fec]" />
                </button>
            </header>

            <main className="flex-1 w-full max-w-md mx-auto">
                {/* Error/Empty State */}
                {loading ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="h-8 w-8 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-semibold text-lg animate-pulse">Loading trip details...</p>
                    </div>
                ) : !trip ? (
                    <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center min-h-[50vh] bg-white dark:bg-slate-900/50 m-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <AlertCircle size={40} className="mb-2 text-slate-400" />
                        <p className="font-semibold text-lg text-slate-900 dark:text-white">No active trip found</p>
                        <p className="text-sm mt-1">Start a trip from the dashboard first.</p>
                        <button
                            onClick={() => navigate('/driver/dashboard')}
                            className="mt-6 px-6 py-2 bg-[#137fec] text-white font-bold rounded-lg shadow-md hover:bg-[#137fec]/90 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Trip Progress Section */}
                        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-800/50 m-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                            <div className="flex gap-6 justify-between items-center">
                                <p className="text-base font-semibold">Trip Progress</p>
                                <p className="text-[#137fec] text-sm font-bold">In Progress</p>
                            </div>
                            <div className="rounded-full bg-slate-200 dark:bg-slate-700 h-3 overflow-hidden shadow-inner">
                                <div className="h-full rounded-full bg-gradient-to-r from-[#137fec] to-blue-400 relative" style={{ width: '50%' }}>
                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Logistics Quick Action */}
                        <div className="px-4 pb-4">
                            <button 
                                onClick={() => setShowMap(true)}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#137fec] hover:bg-blue-600 text-white font-bold rounded-xl border border-blue-400 dark:border-blue-600 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                            >
                                <MapPin size={18} />
                                Show Navigation Map
                            </button>
                        </div>

                        {/* Map/Location Preview */}
                        <div className="px-4 pb-4">
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center">
                                <div className="text-center">
                                    <MapPin size={40} className="mb-2 text-slate-400 inline-block mx-auto" />
                                    <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Map view coming soon</p>
                                </div>
                                <div className="absolute bottom-3 left-3 bg-white dark:bg-[#101922] border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                                    <div className="h-2.5 w-2.5 bg-[#137fec] rounded-full animate-pulse shadow-[0_0_8px_rgba(19,127,236,0.6)]"></div>
                                    <span className="text-xs font-bold tracking-wide">GPS Active</span>
                                </div>
                            </div>
                        </div>

                        {/* Current Pickup Card */}
                        <h3 className="text-lg font-bold leading-tight tracking-tight px-4 pb-2 pt-2">Next Destination</h3>
                        <div className="px-4 pb-4">
                            {trip?.booking_data ? (
                                <div className="flex flex-col gap-4 rounded-xl bg-white dark:bg-slate-900/80 p-5 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                                    {/* Info Row */}
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-[#137fec] shadow-md flex items-center justify-center">
                                            <User size={24} className="text-[#137fec]" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <h4 className="text-lg font-bold">{trip.booking_data.student_name || 'Student'}</h4>
                                            <p className="text-[#137fec] text-sm font-semibold">Active Booking</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (trip.booking_data.phone) {
                                                    window.location.href = `tel:${trip.booking_data.phone}`;
                                                } else {
                                                    toast.error('Student phone number not available');
                                                }
                                            }}
                                            className="ml-auto h-10 w-10 flex items-center justify-center rounded-full bg-[#137fec]/10 text-[#137fec] hover:bg-[#137fec]/20 active:scale-90 transition-all"
                                            title="Call Student"
                                        >
                                            <Phone size={18} />
                                        </button>
                                    </div>

                                    <div className="h-px bg-slate-100 dark:bg-slate-800 w-full"></div>

                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-[#137fec] mt-0.5 flex-shrink-0" />
                                        <div className="flex flex-col">
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Pickup Location</p>
                                            <p className="text-base font-bold">{trip.booking_data.pickup_location || 'Location not specified'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-[#137fec] mt-0.5 flex-shrink-0" />
                                        <div className="flex flex-col">
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Drop Location</p>
                                            <p className="text-base font-bold">{trip.booking_data.drop_location || 'Location not specified'}</p>
                                        </div>
                                    </div>

                                    {trip.booking_data.notes && (
                                        <div className="flex items-start gap-3">
                                            <Info size={18} className="text-[#137fec] mt-0.5 flex-shrink-0" />
                                            <div className="flex flex-col">
                                                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">Note</p>
                                                <p className="text-sm font-medium italic text-slate-700 dark:text-slate-300">"{trip.booking_data.notes}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <AlertCircle size={40} className="mb-2 text-slate-400 mx-auto" />
                                    <p className="font-semibold text-slate-500 dark:text-slate-400">No booking details available</p>
                                </div>
                            )}
                        </div>

                        {/* Sticky Bottom Action Buttons */}
                        <div className="fixed bottom-0 sm:bottom-4 inset-x-0 mx-auto max-w-md p-4 bg-gradient-to-t from-white via-white dark:from-[#101922] dark:via-[#101922] to-transparent z-20 pb-safe">
                            <div className="flex gap-4">
                                <button className="flex-1 py-4 px-6 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 cursor-not-allowed">
                                    <Play size={18} />
                                    TRIP STARTED
                                </button>
                                <button
                                    onClick={handleEndTrip}
                                    className="flex-1 py-4 px-6 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                                >
                                    <Square size={18} />
                                    END TRIP
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>

            {/* Show Navigation Map Modal */}
            {showMap && trip?.booking_data && trip.booking_data.user_location && (
                <NavigationMap
                    driverLocation={driverLocation || { lat: 0, lng: 0 }}
                    patientLocation={trip.booking_data.user_location}
                    onClose={() => setShowMap(false)}
                    patient={trip.booking_data}
                    onCall={() => {
                        if (trip.booking_data.phone) {
                            window.location.href = `tel:${trip.booking_data.phone}`;
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ActiveTrip;
