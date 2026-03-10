import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import { ALLOWED_LOCATIONS, checkLocationValidity } from '../config/allowedLocations';
import { getUserLocation, calculateDistance, calculateETA } from '../services/locationService';

/**
 * Location Picker Component
 * Displays 5 allowed Kendujhar locations with distance from driver
 * Allows selection of pickup location for ambulance booking
 */
const LocationPicker = ({ 
  onLocationSelected, 
  onClose,
  driverLocation = null,
  showDistance = true
}) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [distances, setDistances] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialLocation = async () => {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
      } catch (error) {
        console.error('Failed to get user location:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialLocation();
  }, []);

  useEffect(() => {
    // Calculate distances from driver location (if available)
    if (driverLocation) {
      const newDistances = {};
      ALLOWED_LOCATIONS.forEach(loc => {
        const distance = calculateDistance(
          driverLocation.lat,
          driverLocation.lng,
          loc.coordinates.lat,
          loc.coordinates.lng
        );
        newDistances[loc.id] = {
          distance: distance.toFixed(1),
          eta: Math.ceil((distance / 50) * 60) // 50 km/h average speed
        };
      });
      setDistances(newDistances);
    }
  }, [driverLocation]);

  const handleSelectLocation = (location) => {
    setSelectedLocation(location.id);
    const eta = distances[location.id];
    
    if (onLocationSelected) {
      onLocationSelected({
        id: location.id,
        name: location.name,
        coordinates: location.coordinates,
        distance: eta?.distance || 0,
        eta: eta?.eta || 0,
        placeDetails: location.name
      });
    }
    
    if (onClose) {
      setTimeout(onClose, 300);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin">
              <MapPin className="text-[#137fec]" size={32} />
            </div>
          </div>
          <p className="text-center text-slate-600 dark:text-slate-400">Loading locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end md:justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl md:rounded-3xl w-full md:max-w-md max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Select Pickup Location
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {ALLOWED_LOCATIONS.length} locations available in Kendujhar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Locations List */}
        <div className="p-4 space-y-3">
          {ALLOWED_LOCATIONS.map((location) => {
            const distance = distances[location.id];
            const isSelected = selectedLocation === location.id;

            return (
              <button
                key={location.id}
                onClick={() => handleSelectLocation(location)}
                className={`w-full text-left p-4 rounded-2xl transition-all duration-200 border-2 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-500/10 border-[#137fec] shadow-lg shadow-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-[#137fec] hover:bg-blue-50 dark:hover:bg-blue-500/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Location Icon */}
                  <div className={`p-3 rounded-xl mt-1 flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#137fec] text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    <MapPin size={18} />
                  </div>

                  {/* Location Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {location.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {location.coordinates.lat.toFixed(4)}°, {location.coordinates.lng.toFixed(4)}°
                    </p>

                    {/* Distance & ETA */}
                    {distance && showDistance && (
                      <div className="flex gap-4 mt-2 text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Distance: </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {distance.distance} km
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">ETA: </span>
                          <span className="font-bold text-[#137fec]">
                            {distance.eta} min
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-5 h-5 rounded-full bg-[#137fec] flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Service Radius Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
          <p className="flex items-center gap-2">
            <span className="text-[#137fec]">ℹ</span>
            Ambulance service available within {ALLOWED_LOCATIONS[0].radius * 1000}m radius of each location
          </p>
        </div>

        {/* Embed Map Section (if location selected) */}
        {selectedLocation && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Location Map</p>
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-40 bg-slate-100 dark:bg-slate-800">
              <iframe
                width="100%"
                height="160"
                style={{ border: 'none' }}
                title={ALLOWED_LOCATIONS.find(l => l.id === selectedLocation)?.name}
                src={ALLOWED_LOCATIONS.find(l => l.id === selectedLocation)?.embedUrl || ''}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPicker;
