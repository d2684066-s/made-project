/**
 * Allowed Service Locations in Kendujhar District
 * Only ambulances can serve in these 5 specific locations
 */

export const ALLOWED_LOCATIONS = [
  {
    id: 'baitarani',
    name: 'Baitarani Hall of Residency',
    coordinates: {
      lat: 21.636879,
      lng: 85.616539,
    },
    radius: 0.5, // 500 meters radius
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3708.693103434443!2d85.61651857527355!3d21.63687938016908!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1efd000fc08a91%3A0xb149e4f5af6bebcd!2sBaitarani%20Hall%20of%20residency!5e0!3m2!1sen!2sin!4v1772826334920!5m2!1sen!2sin',
  },
  {
    id: 'gandhamardan',
    name: 'Gandhamardan Hall of Residence',
    coordinates: {
      lat: 21.644158,
      lng: 85.572660,
    },
    radius: 0.5,
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7417.0123687844625!2d85.57266011577633!3d21.644158072500066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1f031ffe4d72a7%3A0x88b79512b804b4f9!2sGandhamardan%20Hall%20of%20Residence!5e0!3m2!1sen!2sin!4v1772826452596!5m2!1sen!2sin',
  },
  {
    id: 'maa-tarini',
    name: 'Maa Tarini Hall of Residence',
    coordinates: {
      lat: 21.644158,
      lng: 85.572660,
    },
    radius: 0.5,
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7417.0123687844625!2d85.57266011577633!3d21.644158072500066!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1f039f7da105b7%3A0x282bb4580c869459!2sMaa%20Tarini%20Hall%20of%20Residence!5e0!3m2!1sen!2sin!4v1772826515013!5m2!1sen!2sin',
  },
  {
    id: 'baladevjew',
    name: 'Baladevjew Hall of Residence',
    coordinates: {
      lat: 21.644576,
      lng: 85.568625,
    },
    radius: 0.5,
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7416.990869876012!2d85.56862590832952!3d21.644576589119772!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1f02f2f558f05b%3A0xdc9428f4b671e563!2sKeonjhar%20(Kendujhar)%2C%20Odisha%20758002!5e0!3m2!1sen!2sin!4v1772826601301!5m2!1sen!2sin',
  },
  {
    id: 'admin-block',
    name: 'Administrative Block',
    coordinates: {
      lat: 21.645471,
      lng: 85.576493,
    },
    radius: 0.5,
    embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3708.472456589465!2d85.57649329253626!3d21.645471196683793!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a1f02f2e61fb24d%3A0xf40f3332fa8967e4!2sKeonjhar%20(Kendujhar)%2C%20Odisha%20758002!5e0!3m2!1sen!2sin!4v1772826669114!5m2!1sen!2sin',
  },
];

/**
 * Check if a coordinate is within Kendujhar service area
 * @param {Object} coord - {lat, lng}
 * @returns {Array} Matching allowed locations or empty
 */
export const checkLocationValidity = (coord) => {
  if (!coord?.lat || !coord?.lng) return [];

  return ALLOWED_LOCATIONS.filter((location) => {
    const distance = calculateDistance(coord, location.coordinates);
    return distance <= location.radius; // within radius
  });
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (coord1, coord2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
};

/**
 * Get embed URL for a location
 * @param {string} locationId - Location ID
 * @returns {string} Embed URL or null
 */
export const getLocationEmbedUrl = (locationId) => {
  const location = ALLOWED_LOCATIONS.find((l) => l.id === locationId);
  return location?.embedUrl || null;
};
