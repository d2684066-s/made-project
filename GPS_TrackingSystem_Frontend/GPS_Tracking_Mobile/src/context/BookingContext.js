import React, { createContext, useContext, useState, useCallback } from 'react';
import { publicApi } from '../lib/api';

/**
 * BookingContext - Manages global ambulance booking state
 * Ensures only one active booking per student at a time
 */
const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);

  /**
   * Fetch notifications from backend by phone
   */
  const fetchNotifications = useCallback(async (phone) => {
    try {
      if (!phone) return;
      const response = await publicApi.getNotifications(phone);
      if (response.data && response.data.notifications) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, []);

  /**
   * Create a new booking
   */
  const createBooking = useCallback((bookingData) => {
    // Check if already has active booking
    if (activeBooking) {
      return {
        success: false,
        message: "You already have an active booking",
      };
    }

    const newBooking = {
      id: bookingData.booking_id,
      ...bookingData,
      status: "pending",
      createdAt: new Date(),
      eta: null,
      updatedAt: new Date(),
      notifications: [],
    };

    setActiveBooking(newBooking);
    return { success: true, booking: newBooking };
  }, [activeBooking]);

  /**
   * Update booking status
   */
  const updateBookingStatus = useCallback((bookingId, status, data = {}) => {
    setActiveBooking((prev) => {
      if (!prev || prev.id !== bookingId) return prev;
      return {
        ...prev,
        status,
        updatedAt: new Date(),
        ...data,
      };
    });
  }, []);

  /**
   * Update booking ETA
   */
  const updateBookingETA = useCallback((bookingId, eta, distance) => {
    setActiveBooking((prev) => {
      if (!prev || prev.id !== bookingId) return prev;
      return {
        ...prev,
        eta,
        distance,
        updatedAt: new Date(),
      };
    });
  }, []);

  /**
   * Add notification to booking (used locally as well)
   */
  const addNotification = useCallback((bookingId, notification) => {
    setActiveBooking((prev) => {
      if (!prev || prev.id !== bookingId) return prev;
      return {
        ...prev,
        notifications: [...(prev.notifications || []), notification],
      };
    });

    // Also add to global notifications
    setNotifications((prev) => [
      ...prev,
      { bookingId, ...notification, timestamp: new Date() },
    ]);
  }, []);

  /**
   * Complete or cancel booking
   */
  const completeBooking = useCallback((bookingId, status = "completed") => {
    setActiveBooking((prev) => {
      if (!prev || prev.id !== bookingId) return prev;

      const completedBooking = {
        ...prev,
        status,
        completedAt: new Date(),
      };

      // Move to history
      setBookingHistory((hist) => [completedBooking, ...hist]);

      return null; // Clear active booking
    });
  }, []);

  /**
   * Check if has active booking
   */
  const hasActiveBooking = useCallback(() => {
    return activeBooking !== null;
  }, [activeBooking]);

  /**
   * Get active booking details
   */
  const getActiveBooking = useCallback(() => {
    return activeBooking;
  }, [activeBooking]);

  /**
   * Clear specific notification
   */
  const clearNotification = useCallback((bookingId, notificationToRemove) => {
    setNotifications((prev) =>
      prev.filter((n) => !(n.bookingId === bookingId && n.timestamp === notificationToRemove.timestamp))
    );
  }, []);

  /**
   * Clear all notifications for a booking
   */
  const clearNotifications = useCallback((bookingId) => {
    setNotifications((prev) =>
      prev.filter((n) => n.bookingId !== bookingId)
    );
  }, []);

  const value = {
    // State
    activeBooking,
    bookingHistory,
    notifications,

    // Actions
    createBooking,
    updateBookingStatus,
    updateBookingETA,
    addNotification,
    clearNotification,
    completeBooking,
    hasActiveBooking,
    getActiveBooking,
    clearNotifications,
    fetchNotifications,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

/**
 * Hook to use Booking Context
 */
export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return context;
};

export default BookingContext;
