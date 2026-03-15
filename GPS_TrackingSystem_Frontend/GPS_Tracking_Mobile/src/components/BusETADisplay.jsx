import { useState, useEffect, useCallback } from 'react';
import { Clock, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { publicApi } from '../lib/api';

/**
 * Student ETA card powered by /api/public/bus/eta-live/.
 * Backend response is cached for 3 minutes and polled on same interval.
 */
export const BusETADisplay = ({ busNumber = 'Campus Bus' }) => {
    const [eta, setEta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdateTime, setLastUpdateTime] = useState(null);

    const fetchETA = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await publicApi.getBusLiveETA();
            if (response.data) {
                setEta(response.data);
                setLastUpdateTime(new Date());
            }
        } catch (err) {
            console.error('Failed to fetch live ETA:', err);
            setError('Failed to fetch live bus ETA. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchETA();
    }, [fetchETA]);

    useEffect(() => {
        // Poll every 30 seconds so students see real-time status changes.
        const interval = setInterval(fetchETA, 30 * 1000);
        return () => clearInterval(interval);
    }, [fetchETA]);

    if (loading && !eta) {
        return (
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-blue-500" size={20} />
                    <p className="text-slate-600 dark:text-slate-400">Fetching live bus ETA...</p>
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
                <p className="text-slate-600 dark:text-slate-400">Bus ETA unavailable</p>
            </div>
        );
    }

    const isActive = eta.status === 'ACTIVE' && eta.eta_minutes !== null;
    const isStarted = eta.status === 'STARTED';
    const isOutOfStation = eta.status === 'OUT_OF_STATION';
    const isNotStarted = eta.status === 'NOT_STARTED';
    const etaMinutes = isActive ? Math.max(1, Math.round(Number(eta.eta_minutes))) : null;

    if (!isActive) {
        const cardClass = isOutOfStation
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200'
            : isStarted
            ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
            : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400';

        return (
            <div className={`rounded-2xl p-6 border shadow-sm ${cardClass}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Clock size={18} />
                        <p className="font-semibold text-base">Bus ETA Status</p>
                    </div>
                    {loading && <Loader2 className="animate-spin opacity-50" size={18} />}
                </div>

                {isNotStarted && (
                    <p className="text-sm font-medium">No bus trip running right now.</p>
                )}
                {isStarted && (
                    <>
                        <p className="text-sm font-medium">Bus trip is active.</p>
                        <p className="text-xs mt-1 font-semibold opacity-80">
                            Waiting for live GPS — ETA will appear shortly.
                        </p>
                    </>
                )}
                {isOutOfStation && (
                    <>
                        <p className="text-sm font-medium">Bus is out of station.</p>
                        <p className="text-xs mt-1 font-semibold">
                            ETA is unavailable until the bus returns to station.
                        </p>
                    </>
                )}
                {!isNotStarted && !isStarted && !isOutOfStation && (
                    <p className="text-sm font-medium">{eta.message || 'No bus trip running right now.'}</p>
                )}

                {lastUpdateTime && (
                    <div className="text-xs opacity-60 mt-3">
                        Last updated: {lastUpdateTime.toLocaleTimeString()}
                    </div>
                )}

                <button
                    onClick={fetchETA}
                    disabled={loading}
                    className="w-full mt-3 py-2 px-3 rounded-lg bg-white/50 dark:bg-slate-800 hover:bg-white/70 dark:hover:bg-slate-700 disabled:opacity-50 transition-all text-sm font-semibold uppercase tracking-wider"
                >
                    {loading ? 'Updating...' : 'Refresh'}
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-2xl p-6 border shadow-sm bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock size={18} />
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider opacity-75">Live ETA</p>
                        <p className="font-semibold text-base">{eta.bus_number || busNumber}</p>
                    </div>
                </div>
                {loading && <Loader2 className="animate-spin opacity-50" size={18} />}
            </div>

            <div className="mb-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl text-center">
                <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-1">Arrival Update</p>
                <p className="text-2xl font-black">Bus arriving in {etaMinutes} minutes</p>
            </div>

            <div className="flex items-center gap-3 mb-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-lg">
                <MapPin size={16} className="opacity-75" />
                <div className="flex-1">
                    <p className="text-xs opacity-75">Destination</p>
                    <p className="font-semibold">{eta.destination || 'Baitarani Hall of Residence'}</p>
                </div>
            </div>

            {typeof eta.distance_km === 'number' && (
                <div className="text-sm opacity-90 mb-2">Distance: {eta.distance_km} km</div>
            )}

            {lastUpdateTime && (
                <div className="text-xs opacity-60 mt-2">
                    Last updated: {lastUpdateTime.toLocaleTimeString()}
                </div>
            )}

            <button
                onClick={fetchETA}
                disabled={loading}
                className="w-full mt-3 py-2 px-3 rounded-lg bg-white/30 hover:bg-white/50 disabled:opacity-50 transition-all text-sm font-semibold uppercase tracking-wider"
            >
                {loading ? 'Updating...' : 'Refresh'}
            </button>
        </div>
    );
};

export default BusETADisplay;
