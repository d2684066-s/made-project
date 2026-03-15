import React, { useEffect, useState } from 'react';
import { MapPin, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

const LocationServiceCheck = ({ onPermissionGranted, onPermissionDenied }) => {
  const [status, setStatus] = useState('checking'); // checking, enabled, disabled, error
  const [message, setMessage] = useState('Checking location services...');

  useEffect(() => {
    checkLocationPermission();

    // Re-check when the user comes back to this tab after changing browser/OS settings
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkLocationPermission();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const checkLocationPermission = () => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setStatus('disabled');
      setMessage('Location services are not available on this device');
      if (onPermissionDenied) onPermissionDenied();
      return;
    }

    // Check permission status (works on modern browsers)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        if (permission.state === 'granted') {
          localStorage.setItem('location_permission_granted', 'true');
          setStatus('enabled');
          setMessage('Location services are enabled ✓');
          if (onPermissionGranted) onPermissionGranted();
        } else if (permission.state === 'denied') {
          setStatus('disabled');
          setMessage('Location access denied. Please enable in browser settings.');
          if (onPermissionDenied) onPermissionDenied();
        } else {
          // prompt state - try to get location to trigger the browser prompt
          requestLocation();
        }

        // Listen for permission changes (e.g. user allows in address bar)
        permission.addEventListener('change', () => {
          if (permission.state === 'granted') {
            localStorage.setItem('location_permission_granted', 'true');
            setStatus('enabled');
            setMessage('Location services are enabled ✓');
            if (onPermissionGranted) onPermissionGranted();
          } else if (permission.state === 'denied') {
            setStatus('disabled');
            setMessage('Location access denied. Please enable in browser settings.');
          }
        });
      });
    } else {
      // Fallback for browsers that don't support permission API
      requestLocation();
    }
  };

  const requestLocation = () => {
    setStatus('checking');
    setMessage('Requesting location access...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location permission granted:', position);
        setStatus('enabled');
        setMessage('Location access granted! You can now use navigation features.');
        localStorage.setItem('location_permission_granted', 'true');
        if (onPermissionGranted) onPermissionGranted();
      },
      (error) => {
        console.error('Geolocation error:', error);

        if (error.code === error.PERMISSION_DENIED) {
          // Hard denial — user explicitly blocked it
          setStatus('disabled');
          setMessage('Location access denied. Click the lock icon in the address bar and allow location, then tap "Enable Location Services" below.');
          if (onPermissionDenied) onPermissionDenied();
        } else {
          // POSITION_UNAVAILABLE or TIMEOUT — permission was granted but hardware/OS
          // location is off or slow. Let the user proceed rather than blocking the app.
          const hint = error.code === error.TIMEOUT
            ? 'Location is taking too long — GPS signal may be weak.'
            : 'Location hardware unavailable. Enable Location Services in your device/OS settings.';
          setStatus('disabled');
          setMessage(hint + ' You can still continue — some GPS features may be limited.');
          // Do NOT auto-call onPermissionDenied; let user decide via buttons below.
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleEnableLocation = () => {
    setStatus('checking');
    setMessage('Requesting location access...');
    requestLocation();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl relative z-[10000]">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {status === 'checking' && (
            <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Loader2 size={40} className="text-blue-500 animate-spin" />
            </div>
          )}
          {status === 'enabled' && (
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse">
              <CheckCircle size={40} className="text-green-500" />
            </div>
          )}
          {status === 'disabled' && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle size={40} className="text-red-500" />
            </div>
          )}
          {status === 'error' && (
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <MapPin size={40} className="text-yellow-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-3">
          {status === 'checking' && 'Checking Location'}
          {status === 'enabled' && 'Location Enabled'}
          {status === 'disabled' && 'Enable Location Services'}
          {status === 'error' && 'Location Required'}
        </h2>

        {/* Message */}
        <p className="text-slate-600 dark:text-slate-400 text-center mb-6 text-sm leading-relaxed">
          {message}
        </p>

        {/* Additional Info for Disabled State */}
        {status === 'disabled' && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl mb-6 border border-yellow-200 dark:border-yellow-700">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
              <strong>Why we need location services:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Real-time navigation to patient locations</li>
                <li>Accurate distance and ETA calculations</li>
                <li>Live tracking for dispatcher visibility</li>
              </ul>
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3">
          {status === 'disabled' && (
            <>
              <button
                onClick={handleEnableLocation}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <MapPin size={18} />
                Try Again
              </button>
              <button
                onClick={() => {
                  if (onPermissionGranted) onPermissionGranted();
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                Continue Anyway
              </button>
              <button
                onClick={() => {
                  if (onPermissionDenied) onPermissionDenied();
                }}
                className="w-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl transition-all active:scale-95"
              >
                Continue Without Location
              </button>
            </>
          )}

          {status === 'enabled' && (
            <button
              onClick={() => {
                if (onPermissionGranted) onPermissionGranted();
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Continue
            </button>
          )}

          {status === 'checking' && (
            <div className="w-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed opacity-50">
              <Loader2 size={18} className="animate-spin" />
              Checking...
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-6">
          Location permission can be changed in your device's browser settings at any time.
        </p>
      </div>
    </div>
  );
};

export default LocationServiceCheck;
