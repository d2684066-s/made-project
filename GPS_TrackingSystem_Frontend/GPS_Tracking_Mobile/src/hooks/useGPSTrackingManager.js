import { useEffect, useState } from 'react';
import { useGPSTracking } from './useGPSTracking';
import { toast } from 'sonner';

/**
 * Custom hook to manage GPS tracking lifecycle for driver trips
 * 
 * This hook handles:
 * - Starting GPS tracking when a trip starts
 * - Stopping GPS tracking when a trip ends
 * - Managing errors and user notifications
 * - Displaying real-time location updates
 * 
 * Usage:
 * const { startTracking, stopTracking, location, error } = useGPSTrackingManager(vehicleId, isTripActive);
 */
export const useGPSTrackingManager = (vehicleId, isTripActive = false) => {
    const { isTracking, error, lastLocation, startTracking: startGPS, stopTracking: stopGPS } = useGPSTracking(vehicleId);
    const [trackingState, setTrackingState] = useState('idle'); // idle, starting, active, stopping, error

    // Auto start/stop tracking based on trip status
    useEffect(() => {
        if (isTripActive && vehicleId && !isTracking) {
            setTrackingState('starting');
            startGPS();
            setTrackingState('active');
            toast.success('GPS Tracking Started', {
                description: 'Sending location updates every 5 seconds'
            });
        } else if (!isTripActive && isTracking) {
            setTrackingState('stopping');
            stopGPS();
            setTrackingState('idle');
            toast.info('GPS Tracking Stopped');
        }
    }, [isTripActive, vehicleId, isTracking, startGPS, stopGPS]);

    // Handle errors
    useEffect(() => {
        if (error) {
            setTrackingState('error');
            toast.error('GPS Error', {
                description: error
            });
        }
    }, [error]);

    const manualStart = () => {
        startGPS();
        toast.success('GPS Tracking Started');
    };

    const manualStop = () => {
        stopGPS();
        toast.info('GPS Tracking Stopped');
    };

    return {
        isTracking,
        error,
        location: lastLocation,
        trackingState,
        startTracking: manualStart,
        stopTracking: manualStop
    };
};
