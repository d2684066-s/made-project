import React from 'react';

/**
 * Location Permission Guard
 * 
 * UPDATED BEHAVIOR: Location is now requested on-demand when features require it
 * (tracking buses, ambulances, etc.) rather than blocking app entry.
 * This allows users to login first, then grant location permission when needed.
 * 
 * Users can still access the app without location if they decline permission.
 */
export const LocationGuard = ({ children }) => {
  // Simply pass through to children - location will be requested when needed
  return children;
};

export default LocationGuard;
