import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { X, Navigation, Phone } from 'lucide-react';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const driverIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 10a2 2 0 110-4 2 2 0 010 4zm0 2a3 3 0 110-6 3 3 0 010 6zm0 2a5 5 0 110-10 5 5 0 010 10z"/></svg></div>`,
  className: 'custom-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const patientIcon = L.divIcon({
  html: `<div class="flex items-center justify-center w-10 h-10 bg-red-500 rounded-full border-4 border-white shadow-lg"><svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 6a1 1 0 112 0 1 1 0 01-2 0zm0 8a1 1 0 102 0v-2a1 1 0 10-2 0v2z"/></svg></div>`,
  className: 'custom-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const NavigationMap = ({ driverLocation, patientLocation, onClose, distance, eta, patient, onCall }) => {
  const [map, setMap] = useState(null);

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const hasValidLocations = 
    driverLocation?.lat && 
    driverLocation?.lng && 
    patientLocation?.latitude && 
    patientLocation?.longitude;

  const dist = hasValidLocations 
    ? calculateDistance(
        driverLocation.lat,
        driverLocation.lng,
        patientLocation.latitude,
        patientLocation.longitude
      )
    : Number(distance) || 0;

  // Ensure dist is a valid number before calling toFixed
  const validDist = typeof dist === 'number' && !isNaN(dist) ? dist : 0;

  const etaMinutes = eta?.minutes || Math.ceil((validDist / 30) * 60);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation size={24} className="text-[#137fec]" />
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Navigation</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {dist.toFixed(1)} km • {etaMinutes} min
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={24} className="text-slate-500 dark:text-slate-400" />
        </button>
      </div>

      {/* Map */}
      {hasValidLocations ? (
        <div className="flex-1 relative">
          <MapContainer
            center={[driverLocation.lat, driverLocation.lng]}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            ref={setMap}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Driver Marker */}
            <Marker
              position={[driverLocation.lat, driverLocation.lng]}
              icon={driverIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-blue-600">Your Location</p>
                  <p className="text-sm text-slate-600">
                    {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Patient Marker */}
            <Marker
              position={[patientLocation.latitude, patientLocation.longitude]}
              icon={patientIcon}
            >
              <Popup>
                <div className="text-center">
                  <p className="font-bold text-red-600">Pickup Location</p>
                  <p className="text-sm font-semibold">{patient?.student_name || 'Patient'}</p>
                  <p className="text-sm text-slate-600">
                    {patientLocation.latitude.toFixed(4)}, {patientLocation.longitude.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Route Line */}
            <Polyline
              positions={[
                [driverLocation.lat, driverLocation.lng],
                [patientLocation.latitude, patientLocation.longitude],
              ]}
              color="#137fec"
              weight={4}
              opacity={0.8}
              dashArray="10, 5"
            />
          </MapContainer>

          {/* Status Overlay */}
          <div className="absolute bottom-6 left-6 right-6 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[10px] text-slate-500 dark:textvalidDslate-400 uppercase font-bold">Distance</p>
                <p className="text-xl font-black text-[#137fec]">{dist.toFixed(1)}</p>
                <p className="text-[10px] text-slate-500">km</p>
              </div>
              <div className="text-center border-l border-r border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold">ETA</p>
                <p className="text-xl font-black text-green-500">{etaMinutes}</p>
                <p className="text-[10px] text-slate-500">min</p>
              </div>
              <div className="text-center">
                <button
                  onClick={onCall}
                  className="w-10 h-10 rounded-full bg-[#137fec] text-white flex items-center justify-center mx-auto hover:bg-blue-600 transition-all"
                  title="Call Patient"
                >
                  <Phone size={18} />
                </button>
                <p className="text-[10px] text-slate-500 mt-1">Call</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
          <div className="text-center">
            <Navigation size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">No Location Data</p>
            <p className="text-sm text-slate-400">
              Enable location services to show the map
            </p>
          </div>
        </div>
      )}

      {/* Bottom Info Bar */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-slate-900 dark:text-white">{patient?.student_name || 'Patient'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Waiting for pickup</p>
          </div>
          <span className="px-3 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
            ACTIVE
          </span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
          📍 {patient?.place_details || 'Pickup location'} → {patient?.remarks || 'Destination'}
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors text-slate-900 dark:text-white"
        >
          Close Map
        </button>
      </div>
    </div>
  );
};

export default NavigationMap;
