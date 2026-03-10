/**
 * Location and ETA Calculation Service
 * Handles geolocation, distance calculation, and ETA computation
 */

/**
 * Check if location permission is granted
 * @returns {Promise<boolean>} True if location is permitted
 */
export const checkLocationPermission = async () => {
  if (!navigator.permissions || !navigator.permissions.query) {
    console.warn('Permissions API not available, attempting geolocation');
    return true; // Assume allowed if API not available
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.status === 'granted';
  } catch (error) {
    console.warn('Could not check permission:', error);
    return true; // Default to allowing if check fails
  }
};

/**
 * Request location permission and location data
 * @returns {Promise<Object>} {lat, lng, accuracy} or throws error
 */
export const requestLocationPermission = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
        });
      },
      (error) => {
        if (error.code === 1) { // PERMISSION_DENIED
          reject(new Error('Location permission denied. Please enable location to use this app.'));
        } else if (error.code === 2) {
          reject(new Error('Location unavailable'));
        } else {
          reject(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  if (!coord1?.lat || !coord2?.lat) return 0;

  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
};

/**
 * Calculate ETA in minutes
 * @param {number} distanceKm - Distance in kilometers
 * @param {number} averageSpeed - Average speed in km/h (default: 50)
 * @returns {number} ETA in minutes
 */
export const calculateETA = (distanceKm, averageSpeed = 50) => {
  if (!distanceKm || distanceKm <= 0) return 0;
  const timeInHours = parseFloat(distanceKm) / averageSpeed;
  return Math.ceil(timeInHours * 60); // Convert to minutes and round up
};

/**
 * Get current user location using browser Geolocation API
 * @returns {Promise<Object>} {lat, lng, accuracy}
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        resolve({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy,
        });
      },
      (error) => {
        // if the position is unavailable, we can optionally provide a reasonable
        // fallback such as the campus center coordinates so the map still renders
        if (error.code === 2) { // POSITION_UNAVAILABLE
          console.warn('Geolocation POSITION_UNAVAILABLE, using campus default');
          resolve({ lat: 20.2441, lng: 85.8337, accuracy: null });
        } else {
          reject(error);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Watch user location with continuous updates
 * @param {Function} callback - Called with {lat, lng, accuracy}
 * @returns {number} Watch ID for cleanup
 */
export const watchUserLocation = (callback) => {
  if (!navigator.geolocation) {
    console.error("Geolocation not supported");
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      callback({
        lat: latitude,
        lng: longitude,
        accuracy: accuracy,
      });
    },
    (error) => console.error("Watch location error:", error),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000, // Update every 1 second
    }
  );
};

/**
 * Stop watching user location
 * @param {number} watchId - ID returned from watchUserLocation
 */
export const stopWatchingLocation = (watchId) => {
  if (watchId !== null && watchId !== undefined) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Generate unique booking ID
 * Format: BOOKING_<timestamp>_<random>
 * @returns {string} Unique booking ID
 */
export const generateBookingId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `BOOKING_${timestamp}_${random}`;
};

/**
 * Format time for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time like "2:30 PM"
 */
export const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date like "Mar 6, 2026"
 */
export const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Calculate booking status with color
 * @param {string} status - Booking status: pending, accepted, in_progress, completed, cancelled
 * @returns {Object} {color, icon, label}
 */
export const getBookingStatusStyle = (status) => {
  const statusMap = {
    pending: {
      color: "bg-yellow-500",
      bgLight: "bg-yellow-50 dark:bg-yellow-500/10",
      textColor: "text-yellow-600 dark:text-yellow-400",
      label: "Pending",
      icon: "⏱️",
      dotColor: "bg-yellow-500",
    },
    accepted: {
      color: "bg-green-500",
      bgLight: "bg-green-50 dark:bg-green-500/10",
      textColor: "text-green-600 dark:text-green-400",
      label: "Accepted",
      icon: "✓",
      dotColor: "bg-green-500",
    },
    in_progress: {
      color: "bg-blue-500",
      bgLight: "bg-blue-50 dark:bg-blue-500/10",
      textColor: "text-blue-600 dark:text-blue-400",
      label: "On the way",
      icon: "🚑",
      dotColor: "bg-yellow-500",
    },
    completed: {
      color: "bg-red-500",
      bgLight: "bg-red-50 dark:bg-red-500/10",
      textColor: "text-red-600 dark:text-red-400",
      label: "Completed",
      icon: "✓",
      dotColor: "bg-red-500",
    },
    cancelled: {
      color: "bg-gray-500",
      bgLight: "bg-gray-50 dark:bg-gray-500/10",
      textColor: "text-gray-600 dark:text-gray-400",
      label: "Cancelled",
      icon: "✗",
      dotColor: "bg-gray-500",
    },
  };

  return statusMap[status] || statusMap.pending;
};

/**
 * Check if ambulance icon should be disabled
 * @param {Array} bookings - User's bookings
 * @returns {boolean} True if user has active booking
 */
export const hasActiveBooking = (bookings) => {
  return bookings?.some((b) =>
    ["pending", "accepted", "in_progress"].includes(b.status)
  );
};

export default {
  calculateDistance,
  calculateETA,
  getUserLocation,
  watchUserLocation,
  stopWatchingLocation,
  generateBookingId,
  formatTime,
  formatDate,
  getBookingStatusStyle,
  hasActiveBooking,
};
