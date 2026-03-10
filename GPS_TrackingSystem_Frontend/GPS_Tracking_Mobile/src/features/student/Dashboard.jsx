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
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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
                () => {
                    // Silently fallback to default location (geolocation often fails on dev/non-https)
                    setUserLocation({ lat: 20.2441, lng: 85.8337 });
                    setLoading(false);
                },
                { timeout: 5000, enableHighAccuracy: false }
            );
        } else {
            setUserLocation({ lat: 20.2441, lng: 85.8337 });
            setLoading(false);
        }

        // Fetch buses data
        fetchData();
        const interval = setInterval(fetchData, 15000); // Refresh every 15 seconds
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
        <div className="space-y-8 animate-in fade-in duration-500">
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
            {buses && buses.length > 0 && userLocation && (
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
                        {buses.map((bus) => (
                            <BusETADisplay
                                key={bus.vehicle_id}
                                busId={bus.vehicle_id}
                                userLat={userLocation.lat}
                                userLng={userLocation.lng}
                                busNumber={bus.vehicle_number || 'BUS'}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default Dashboard;
