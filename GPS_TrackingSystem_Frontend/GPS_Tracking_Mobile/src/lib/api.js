import axios from 'axios';

/**
 * ============================================================================
 * IMPORTANT: TO CONNECT THIS APP TO YOUR BACKEND
 * ============================================================================
 * 
 * 1. Edit the API_URL variable below and uncomment it
 * 2. Replace 'http://localhost:8000' with your actual backend URL
 * 
 * Example:
 *   const API_URL = 'http://localhost:8000';
 *   const API_URL = 'https://your-domain.com';  // For production
 * 
 * ============================================================================
 */

const API_URL = 'http://localhost:8000'; // backend URL (modify for production)

// const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

/**
 * ============================================================================
 * PUBLIC API FUNCTIONS - STUDENT APP
 * ============================================================================
 */
export const publicApi = {
  /**
   * Get list of active buses
   * Backend endpoint: GET /api/public/buses/
   */
  async getBuses() {
    try {
      const response = await axios.get(`${API_URL}/api/public/buses/`);
      return response;

      // mock data removed
      // return {
      //   data: {
      //     buses: [
      //       { vehicle_id: 1, vehicle_number: 'BUS001', driver_name: 'Driver 1', location: { speed: 45 } },
      //       { vehicle_id: 2, vehicle_number: 'BUS002', driver_name: 'Driver 2', location: { speed: 50 } }
      //     ],
      //     all_out_of_station: false,
      //     message: 'Sample buses (mock data - connect backend)'
      //   }
      // };
    } catch (error) {
      console.error('Failed to fetch buses:', error);
      throw error;
    }
  },

  /**
   * Get ETA for a specific bus
   * Backend endpoint: GET /api/public/bus/{vehicle_id}/eta/?user_lat={lat}&user_lng={lng}
   */
  async getBusETA(vehicleId, lat, lng) {
    try {
      const response = await axios.get(`${API_URL}/api/public/bus/${vehicleId}/eta/`, {
        params: { user_lat: lat, user_lng: lng }
      });
      return response;
    } catch (error) {
      console.error('Failed to get ETA:', error);
      throw error;
    }
  },

  /**
   * Get live cached ETA to Baitarani Hall for currently active bus trip.
   * Backend endpoint: GET /api/public/bus/eta-live/
   */
  async getBusLiveETA() {
    try {
      const response = await axios.get(`${API_URL}/api/public/bus/eta-live/`);
      return response;
    } catch (error) {
      console.error('Failed to get live bus ETA:', error);
      throw error;
    }
  },

  /**
   * Get available ambulances
   * Backend endpoint: GET /api/public/ambulances/
   */
  async getAmbulances() {
    try {
      const response = await axios.get(`${API_URL}/api/public/ambulances/`);
      return response;
    } catch (error) {
      console.error('Failed to fetch ambulances:', error);
      throw error;
    }
  },

  /**
   * Get ambulance service zones
   * Backend endpoint: GET /api/public/ambulance-zones/
   */
  async getAmbulanceZones() {
    try {
      const response = await axios.get(`${API_URL}/api/public/ambulance-zones/`);
      return response;
    } catch (error) {
      console.error('Failed to fetch ambulance zones:', error);
      throw error;
    }
  },

  /**
   * Book an ambulance
   * Backend endpoint: POST /api/public/ambulance/book/
   */
  async bookAmbulance(bookingData) {
    try {
      const response = await axios.post(`${API_URL}/api/public/ambulance/book/`, bookingData);
      return response;
    } catch (error) {
      console.error('Failed to book ambulance:', error);
      throw error;
    }
  },

  /**
   * View my bookings
   * Backend endpoint: GET /api/public/my-bookings/
   */
  async getMyBookings(token) {
    try {
      if (!token) {
        throw new Error('Authentication required: token is missing');
      }
      const response = await axios.get(`${API_URL}/api/public/my-bookings/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      throw error;
    }
  },

  // report help/issue
  async submitIssue(issueData, token) {
    try {
      const response = await axios.post(`${API_URL}/api/public/issues/`, issueData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return response;
    } catch (error) {
      console.error("Failed to submit issue:", error);
      throw error;
    }
  },

  /**
   * Fetch notifications for a student by phone
   * Backend endpoint: GET /api/public/notifications/?phone={phone}
   */
  async getNotifications(phone) {
    try {
      if (!phone) {
        throw new Error('Phone number required');
      }
      const response = await axios.get(`${API_URL}/api/public/notifications/`, {
        params: { phone }
      });
      return response;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }
};

/**
 * ============================================================================
 * DRIVER API FUNCTIONS - BUS & AMBULANCE DRIVERS
 * ============================================================================
 */
export const driverApi = {
  /**
   * Get driver's active trip
   * Backend endpoint: GET /api/driver/active-trip/
   */
  async getActiveTrip(token) {
    try {
      const response = await axios.get(`${API_URL}/api/driver/active-trip/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      console.error('Failed to get active trip:', error);
      throw error;
    }
  },

  /**
   * Update vehicle location from mobile driver app
   * Backend endpoint: POST /api/driver/location/update/
   */
  async updateVehicleLocation(vehicleId, lat, lng, speed = 0) {
    try {
      const response = await axios.post(`${API_URL}/api/driver/location/update/`, {
        vehicle_id: vehicleId,
        lat: lat,
        lng: lng,
        speed: speed,
        timestamp: new Date().toISOString()
      });
      return response;
    } catch (error) {
      console.error('Failed to update vehicle location:', error);
      throw error;
    }
  },

  /**
   * Update driver's location (legacy method)
   * Backend endpoint: POST /api/gps/receive/
   */
  async updateLocation(token, lat, lng, vehicleId) {
    try {
      const response = await axios.post(`${API_URL}/api/gps/receive/`, {
        latitude: lat,
        longitude: lng,
        vehicle_id: vehicleId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      console.error('Failed to update location:', error);
      throw error;
    }
  },

  /**
   * Get trip history
   * Backend endpoint: GET /api/driver/my-trips/
   */
  async getMyTrips(token) {
    try {
      const response = await axios.get(`${API_URL}/api/driver/my-trips/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response;
    } catch (error) {
      console.error('Failed to get trip history:', error);
      throw error;
    }
  }
};

// Extended driver API helpers used by driver pages
driverApi.getAvailableVehicles = async (type, token) => {
  try {
    const response = await axios.get(`${API_URL}/api/driver/available-vehicles/${type}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to get available vehicles:', error);
    throw error;
  }
};

driverApi.assignVehicle = async (vehicleId, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/driver/assign-vehicle/${vehicleId}/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to assign vehicle:', error);
    throw error;
  }
};

driverApi.releaseVehicle = async (vehicleId, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/driver/release-vehicle/${vehicleId}/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to release vehicle:', error);
    throw error;
  }
};

driverApi.startTrip = async (vehicleId, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/driver/start-trip/`, { vehicle_id: vehicleId }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to start trip:', error);
    throw error;
  }
};

driverApi.endTrip = async (tripId, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/driver/end-trip/${tripId}/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to end trip:', error);
    throw error;
  }
};

driverApi.markOutOfStation = async (vehicleId, isOutOfStation = true, token = null) => {
  // Backward compatibility: allow previous signature (vehicleId, token)
  if (typeof isOutOfStation === 'string' && token === null) {
    token = isOutOfStation;
    isOutOfStation = true;
  }

  try {
    const response = await axios.post(`${API_URL}/api/driver/mark-out-of-station/${vehicleId}/`, {
      is_out_of_station: Boolean(isOutOfStation),
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to mark out of station:', error);
    throw error;
  }
};

// Booking-related endpoints for ambulance drivers
driverApi.getPendingBookings = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/api/driver/pending-bookings/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to get pending bookings:', error);
    throw error;
  }
};

driverApi.acceptBooking = async (bookingId, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/driver/accept-booking/${bookingId}/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to accept booking:', error);
    throw error;
  }
};

driverApi.abortBooking = async (bookingId, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/driver/abort-booking/${bookingId}/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to abort booking:', error);
    throw error;
  }
};

driverApi.verifyOTP = async (bookingId, otp, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/driver/verify-otp/`, { booking_id: bookingId, otp }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to verify OTP:', error);
    throw error;
  }
};

driverApi.completeBooking = async (bookingId, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/driver/complete-booking/${bookingId}/`, {}, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error('Failed to complete booking:', error);
    throw error;
  }
};

// allow drivers to report issues as well
driverApi.submitIssue = async (issueData, token) => {
  try {
    const response = await axios.post(`${API_URL}/api/public/issues/`, issueData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    return response;
  } catch (error) {
    console.error("Failed to submit issue (driver):", error);
    throw error;
  }
};

/**
 * ============================================================================
 * HOW TO WIRE THIS UP TO YOUR BACKEND
 * ============================================================================
 * 
 * 1. Go to /Users/durga/xyz/frontend_public_driver/src/context/AuthContext.js
 *    - Find the line: const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
 *    - Update if needed
 * 
 * 2. Uncomment the axios.get/post lines in each function above
 * 3. Comment out or remove the mock return statements
 * 4. Make sure your backend is running
 * 5. Test each endpoint one by one
 * 
 * ============================================================================
 */
