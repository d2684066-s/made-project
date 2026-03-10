import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { getUserLocation, calculateDistance, calculateETA } from '../services/locationService';
import { toast } from 'sonner';

const FleetMap = ({ buses = [], onSelectBus }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState('BAITARANI HALL OF RESIDENCE');
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState('leaflet'); // 'leaflet' or 'google'

  const DESTINATIONS = [
    'BAITARANI HALL OF RESIDENCE',
    'BALADEVJEW HALL OF RESIDENCE',
    'MAA TARINI HALL OF RESIDENCE',
    'GANDHAMARDAN HALL OF RESIDENCE',
    'ADMINISTRATIVE BLOCK'
  ];

  // Sample destination coordinates (for demonstration)
  const DESTINATION_COORDS = {
    'BAITARANI HALL OF RESIDENCE': { lat: 20.2441, lng: 85.8337 },
    'BALADEVJEW HALL OF RESIDENCE': { lat: 20.2450, lng: 85.8340 },
    'MAA TARINI HALL OF RESIDENCE': { lat: 20.2435, lng: 85.8345 },
    'GANDHAMARDAN HALL OF RESIDENCE': { lat: 20.2445, lng: 85.8330 },
    'ADMINISTRATIVE BLOCK': { lat: 20.2440, lng: 85.8335 }
  };

  useEffect(() => {
    const initMap = async () => {
      try {
        // Get user location
        const location = await getUserLocation();
        setUserLocation(location);

        // For now, using a simple HTML-based map display
        // In production, integrate with Leaflet or Google Maps
        renderMapUI();
      } catch (error) {
        console.error('Failed to initialize map:', error);
        toast.error('Could not get your location');
      } finally {
        setLoading(false);
      }
    };

    initMap();
  }, []);

  const renderMapUI = () => {
    if (!mapContainer.current) return;

    // Clear existing content
    mapContainer.current.innerHTML = '';

    // Create a simple map container visualization
    const mapDiv = document.createElement('div');
    mapDiv.className = 'w-full h-full bg-gradient-to-b from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center overflow-hidden relative';

    const mapContent = `
      <div class="w-full h-full flex flex-col items-center justify-center relative">
        <!-- Map background (placeholder) -->
        <div class="absolute inset-0 bg-cover bg-center opacity-30" style="background-image: url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23e0e7ff%22 width=%22100%22 height=%22100%22/><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22%23c7d2fe%22/></svg>')"></div>

        <!-- Grid overlay -->
        <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <!-- Marker: User Location -->
        <div class="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div class="w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
          <div class="absolute inset-0 w-6 h-6 bg-green-500 rounded-full opacity-20 animate-ping"></div>
        </div>

        <!-- Marker: Destination -->
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div class="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">📍</div>
        </div>

        <!-- Bus Markers -->
        ${buses.map((bus, idx) => `
          <div class="absolute top-2/3 left-2/5 transform -translate-x-1/2 -translate-y-1/2 z-${15 - idx}">
            <div class="w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">🚌</div>
            <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-slate-800 px-2 py-1 rounded text-xs whitespace-nowrap shadow-md border border-slate-200 dark:border-slate-700">
              ${bus.vehicle_number}
            </div>
          </div>
        `).join('')}

        <!-- Legend -->
        <div class="absolute bottom-5 left-5 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-200 dark:border-slate-700 text-sm z-30">
          <p class="font-bold mb-2 text-slate-900 dark:text-white">Legend</p>
          <div class="space-y-1 text-slate-700 dark:text-slate-300">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Your Location</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Destination</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Active Bus</span>
            </div>
          </div>
        </div>

        <!-- Info Card -->
        <div class="absolute top-5 left-5 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-200 dark:border-slate-700 z-30 max-w-xs">
          <p class="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1">Current Setting</p>
          <p class="text-sm font-bold text-slate-900 dark:text-white mb-2">Central Campus Area</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Showing ${buses.length} active bus(es) and ${DESTINATIONS.length} destinations
          </p>
        </div>
      </div>
    `;

    mapDiv.innerHTML = mapContent;
    mapContainer.current.appendChild(mapDiv);
  };

  const handleGetDirections = (bus) => {
    if (!userLocation) {
      toast.error('Could not get your location');
      return;
    }

    const distance = calculateDistance(userLocation, bus.location || {});
    const eta = calculateETA(distance);

    toast.success(`${bus.vehicle_number}: ${distance}km away, ETA: ${eta}m`);
    onSelectBus && onSelectBus({ bus, distance, eta });
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#137fec] mb-3 mx-auto" size={32} />
          <p className="text-sm text-slate-500 dark:text-slate-400">Initializing map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <div
        ref={mapContainer}
        className="w-full h-96 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg"
      />

      {/* Destination Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
          Select Destination
        </label>
        <select
          value={selectedDestination}
          onChange={(e) => setSelectedDestination(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#137fec]"
        >
          {DESTINATIONS.map((dest) => (
            <option key={dest} value={dest}>
              {dest}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
          <MapPin size={12} />
          {selectedDestination}
        </p>
      </div>

      {/* Active Buses List */}
      {buses.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Active Buses ({buses.length})
          </h3>
          <div className="space-y-2">
            {buses.map((bus) => {
              const distance = userLocation ? calculateDistance(userLocation, bus.location || {}) : 'N/A';
              const eta = distance !== 'N/A' ? calculateETA(distance) : 'N/A';

              return (
                <div
                  key={bus.vehicle_id}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      🚌
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {bus.vehicle_number}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {bus.driver_name} • {distance}km away
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleGetDirections(bus)}
                    className="flex items-center gap-1 bg-[#137fec] hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Navigation size={12} />
                    ETA: {eta}m
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {buses.length === 0 && (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <MapPin className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={32} />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No active buses right now</p>
        </div>
      )}
    </div>
  );
};

export default FleetMap;
