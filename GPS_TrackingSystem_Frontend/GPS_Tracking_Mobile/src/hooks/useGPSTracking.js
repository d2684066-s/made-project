import { useEffect, useRef, useState } from 'react';
import { driverApi } from '../lib/api';

const LOCATION_UPDATE_INTERVAL = 10000; // 10 seconds

/**
 * Hook to manage GPS tracking for driver mobile app
 * 
 * Sends location updates to backend every 10 seconds
 * Uses navigator.geolocation.watchPosition() for continuous tracking
 * 
 * Usage:
 * const { isTracking, error, lastLocation, startTracking, stopTracking } = useGPSTracking(vehicleId);
 * 
 * @param {string} vehicleId - The UUID of the vehicle being tracked
 * @returns {object} - { isTracking, error, lastLocation, startTracking, stopTracking }
 */
export const useGPSTracking = (vehicleId) => {
    const [isTracking, setIsTracking] = useState(false);
    const [error, setError] = useState(null);
    const [lastLocation, setLastLocation] = useState(null);
    const watchIdRef = useRef(null);
    const intervalIdRef = useRef(null);
    const locationBufferRef = useRef(null);

    const sendLocationUpdate = async (latitude, longitude, speed) => {
        if (!vehicleId) {
            console.error('Vehicle ID is required to send location update');
            return null;
        }

        try {
            const response = await driverApi.updateVehicleLocation(vehicleId, latitude, longitude, speed || 0);
            console.log('Location update sent:', response.data);
            return response.data;
        } catch (err) {
            console.error('Failed to send location update:', err);
            // Don't throw - just log, so tracking continues even if update fails
            return null;
        }
    };

    const startTracking = () => {
        if (!vehicleId) {
            setError('Vehicle ID is required to start tracking');
            return;
        }

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setIsTracking(true);
        setError(null);

        // Watch position with high accuracy
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, speed, accuracy } = position.coords;
                
                // Store latest location
                locationBufferRef.current = {
                    latitude,
                    longitude,
                    speed: speed || 0,
                    accuracy
                };

                setLastLocation({
                    latitude,
                    longitude,
                    speed: speed || 0,
                    accuracy,
                    timestamp: new Date().toISOString()
                });

                console.log(`GPS Update: Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}, Speed ${(speed || 0).toFixed(1)}km/h, Accuracy ${accuracy.toFixed(0)}m`);
            },
            (error) => {
                console.error('Geolocation error:', error);
                setError(`GPS Error: ${error.message}`);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );

        // Send location to backend every 10 seconds
        intervalIdRef.current = setInterval(() => {
            if (locationBufferRef.current) {
                const { latitude, longitude, speed } = locationBufferRef.current;
                sendLocationUpdate(latitude, longitude, speed);
            }
        }, LOCATION_UPDATE_INTERVAL);

        console.log('GPS tracking started for vehicle:', vehicleId);
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        if (intervalIdRef.current !== null) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
        }

        setIsTracking(false);
        locationBufferRef.current = null;
        console.log('GPS tracking stopped');
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTracking();
        };
    }, []);

    // Handle vehicle ID changes
    useEffect(() => {
        if (!vehicleId && isTracking) {
            stopTracking();
            setError('Vehicle ID is missing');
        }
    }, [vehicleId, isTracking]);

    return {
        isTracking,
        error,
        lastLocation,
        startTracking,
        stopTracking
    };
};
