import { useState, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { publicApi } from '../../lib/api';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import BusETADisplay from '../../components/BusETADisplay';

const Dashboard = () => {
    const { activeBooking, hasActiveBooking } = useBooking();
    const [userLocation, setUserLocation] = useState(null);
    const [buses, setBuses] = useState([]);
    const [allOutOfStation, setAllOutOfStation] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            const [busesRes, etaRes] = await Promise.all([
                publicApi.getBuses(),
                publicApi.getBusLiveETA().catch(() => null),
            ]);
            setBuses(busesRes.data.buses || []);
            // Mark out-of-station if either the buses endpoint OR the live ETA says so.
            // This ensures the banner appears immediately after the driver marks out,
            // without waiting for the next buses-poll cycle.
            const fromBuses = Boolean(busesRes.data.all_out_of_station);
            const fromEta = etaRes?.data?.status === 'OUT_OF_STATION';
            setAllOutOfStation(fromBuses || fromEta);
        } catch (error) {
            console.error('Failed to fetch buses:', error);
            toast.error('Failed to load bus data');
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
        toast.success('Data refreshed');
    };

    useEffect(() => {
        // Get user's current location or use fallback
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                    setLoading(false);
                },
                (error) => {
                    console.warn('Geolocation error (expected in dev):', error.message);
                    // Silently fallback to default location (geolocation often fails on dev/non-https)
                    setUserLocation({ lat: 20.2441, lng: 85.8337 });
                    setLoading(false);
                },
                {
                    timeout: 10000, // Increased timeout
                    enableHighAccuracy: false, // Disable high accuracy for faster response
                    maximumAge: 300000 // Accept cached location up to 5 minutes old
                }
            );
        } else {
            console.warn('Geolocation not supported');
            setUserLocation({ lat: 20.2441, lng: 85.8337 });
            setLoading(false);
        }

        // Fetch buses data
        fetchData();
        const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-[#137fec] mb-4" size={40} />
                <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse text-sm tracking-wide">
                    Loading...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent dark:scrollbar-thumb-slate-700 min-h-screen px-4">
            {/* Active Booking Alert */}
            {hasActiveBooking() && activeBooking && (
                <div className="bg-yellow-50 dark:bg-yellow-500/10 border-l-4 border-yellow-500 rounded-lg p-4 flex items-start gap-3">
                    <div className="text-xl">⚠️</div>
                    <div>
                        <p className="font-bold text-yellow-900 dark:text-yellow-200">Active Medical Booking</p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            Ambulance booking #{activeBooking.id} is in progress. You can't book another ambulance until this is completed.
                        </p>
                    </div>
                </div>
            )}

            {/* Bus Arrival Notification */}
            {userLocation && (
                <section>
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold">Bus Arrival ETA</h2>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className={`p-2 rounded-xl transition-all ${refreshing ? 'animate-spin' : 'hover:bg-white dark:hover:bg-slate-800'}`}
                            title="Refresh"
                        >
                            <RefreshCw size={18} className="text-[#137fec]" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {allOutOfStation ? (
                            <div className="bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 rounded-lg p-4">
                                <p className="font-bold text-amber-900 dark:text-amber-200">Bus is out of station</p>
                                <p className="text-sm text-amber-800 dark:text-amber-300">
                                    ETA is unavailable until the bus returns to station.
                                </p>
                            </div>
                        ) : (
                            <BusETADisplay busNumber={buses?.[0]?.vehicle_number || 'Campus Bus'} />
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Dashboard;
