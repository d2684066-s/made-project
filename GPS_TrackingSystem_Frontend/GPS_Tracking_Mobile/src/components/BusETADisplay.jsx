import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { publicApi } from '../lib/api';

/**
 * Bus ETA Display Component
 * 
 * Shows estimated time of arrival for bus to Baitarani Hall
 * Updates every 3 minutes
 * 
 * Props:
 * - busId: UUID of the bus vehicle
 * - userLat: Student's current latitude
 * - userLng: Student's current longitude
 * - busNumber: Display name of the bus
 */
export const BusETADisplay = ({ busId, userLat, userLng, busNumber = 'BUS101' }) => {
    const [eta, setEta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);

    const fetchETA = useCallback(async () => {
        if (!busId || !userLat || !userLng) {
            setError('Missing required location data');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await publicApi.getBusETA(busId, userLat, userLng);
            
            if (response.data) {
                setEta({
                    distance: response.data.distance_km,
                    eta: response.data.eta_minutes,
                    busLocation: response.data.bus_location,
                    route: response.data.route || 'GCE Keonjhar → Baitarani Hall of Residence',
                    method: response.data.method
                });
                setLastUpdateTime(new Date());
            }
        } catch (err) {
            console.error('Failed to fetch ETA:', err);
            setError('Failed to fetch bus ETA. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [busId, userLat, userLng]);

    // Initial fetch
    useEffect(() => {
        fetchETA();
    }, [busId, userLat, userLng, fetchETA]);

    // Refresh every 3 minutes
    useEffect(() => {
        const interval = setInterval(fetchETA, 3 * 60 * 1000); // 3 minutes
        return () => clearInterval(interval);
    }, [busId, userLat, userLng, fetchETA]);

    if (loading && !eta) {
        return (
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-blue-500" size={20} />
                    <p className="text-slate-600 dark:text-slate-400">Fetching bus ETA...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-6 border border-red-200 dark:border-red-800 shadow-sm">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                    <div>
                        <p className="font-semibold text-red-700 dark:text-red-400">Error</p>
                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!eta) {
        return (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-slate-600 dark:text-slate-400">Bus information unavailable</p>
            </div>
        );
    }

    const formatTime = (minutes) => {
        if (!minutes || minutes === null) return '—';
        if (minutes < 1) return 'Arriving now';
        if (minutes < 2) return '< 2 min';
        return `${Math.round(minutes)} min`;
    };

    const getETAStatus = (minutes) => {
        if (!minutes) return { color: 'gray', label: 'Unknown' };
        if (minutes < 2) return { color: 'green', label: 'Almost here' };
        if (minutes < 5) return { color: 'yellow', label: 'Coming soon' };
        return { color: 'blue', label: 'On the way' };
    };

    const status = getETAStatus(eta.eta);
    const colorClasses = {
        green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
        yellow: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300',
        blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
        gray: 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
    };

    return (
        <div className={`rounded-2xl p-6 border shadow-sm ${colorClasses[status.color]}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg`}>
                        <Clock size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-75">ETA Status</p>
                        <p className="font-semibold text-base">{status.label}</p>
                    </div>
                </div>
                {loading && (
                    <Loader2 className="animate-spin opacity-50" size={18} />
                )}
            </div>

            {/* Main ETA Display */}
            <div className="mb-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl">
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">Arrival Time</p>
                    <p className="text-4xl font-black">{formatTime(eta.eta)}</p>
                </div>
            </div>

            {/* Distance */}
            <div className="flex items-center gap-3 mb-4 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                <MapPin size={16} className="opacity-75" />
                <div className="flex-1">
                    <p className="text-xs opacity-75">Distance</p>
                    <p className="font-semibold">{eta.distance} km</p>
                </div>
            </div>

            {/* Bus Info */}
            <div className="mb-4 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                <p className="text-xs opacity-75 mb-1">Bus</p>
                <p className="font-bold text-sm">{busNumber}</p>
            </div>

            {/* Route Info */}
            <div className="mb-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                <p className="text-xs opacity-75 mb-1">Route</p>
                <p className="text-sm font-medium">{eta.route}</p>
            </div>

            {/* Last Update Time */}
            {lastUpdateTime && (
                <div className="text-xs opacity-50 mt-3">
                    Last updated: {lastUpdateTime.toLocaleTimeString()}
                </div>
            )}

            {/* Refresh Button */}
            <button
                onClick={fetchETA}
                disabled={loading}
                className="w-full mt-3 py-2 px-3 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-50 transition-all text-sm font-semibold uppercase tracking-wider"
            >
                {loading ? 'Updating...' : 'Refresh'}
            </button>
        </div>
    );
};

export default BusETADisplay;
