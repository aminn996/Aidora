/**
 * Geolocation Configuration
 * Configure location detection settings for the application
 */

export const GEOLOCATION_CONFIG = {
  // Cache duration for stored location (in milliseconds)
  CACHE_TTL: 15 * 60 * 1000, // 15 minutes

  // Default fallback coordinates (Tunis, Tunisia)
  DEFAULT_COORDS: {
    lat: 36.8065,
    lng: 10.1815,
  },

  // GPS/Browser Geolocation Settings
  GPS_OPTIONS: {
    enableHighAccuracy: true, // Use GPS if available (more accurate but slower)
    timeout: 5000, // Maximum wait time for location (5 seconds)
    maximumAge: 0, // Don't use cached position
  },

  // Watch Position Settings (for continuous tracking)
  WATCH_OPTIONS: {
    enableHighAccuracy: true,
    timeout: 8000,
    maximumAge: 0,
  },

  // IP-based Geolocation Fallback Services
  // Services are tried in order until one succeeds
  IP_SERVICES: [
    {
      name: 'ipapi',
      url: 'https://ipapi.co/json/',
      parser: (data) => ({
        lat: data.latitude,
        lng: data.longitude,
        city: data.city,
        country: data.country_name,
        accuracy: 50000, // IP-based is less accurate (~50km)
      }),
    },
    {
      name: 'ip-api',
      url: 'http://ip-api.com/json/',
      parser: (data) => ({
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country,
        accuracy: 50000,
      }),
    },
  ],

  // Reverse Geocoding Settings (coords to address)
  REVERSE_GEOCODE: {
    enabled: true,
    // Using OpenStreetMap Nominatim (free, no API key required)
    provider: 'nominatim',
    url: (lat, lng) =>
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    parser: (data) => ({
      address: data.display_name,
      city: data.address.city || data.address.town || data.address.village,
      state: data.address.state,
      country: data.address.country,
      postalCode: data.address.postcode,
    }),
  },

  // Error Messages
  ERROR_MESSAGES: {
    PERMISSION_DENIED: 'Location permission denied. Please enable location access in your browser settings.',
    POSITION_UNAVAILABLE: 'Location information is unavailable. Trying IP-based detection...',
    TIMEOUT: 'Location request timed out. Using fallback location.',
    NOT_SUPPORTED: 'Geolocation is not supported by your browser.',
    UNKNOWN: 'An unknown error occurred while detecting location.',
  },

  // Feature Flags
  FEATURES: {
    autoStart: true, // Automatically start location detection
    watchPosition: false, // Continuously track location changes
    ipFallback: false, // Use IP-based location if GPS fails (disabled due to CORS)
    reverseGeocode: false, // Convert coordinates to address (disabled to reduce API calls)
    cacheResults: true, // Store location in localStorage
    showAccuracy: true, // Display accuracy information to users
  },

  // Privacy Settings
  PRIVACY: {
    requireConsent: false, // Ask user before detecting location
    anonymizeIP: false, // Strip last octet from IP for privacy
    storageKey: 'userLocation', // localStorage key for cached location
  },

  // Distance Calculation Settings
  DISTANCE: {
    unit: 'km', // 'km' or 'miles'
    maxRadius: 50, // Maximum search radius in configured unit
    precisionDecimals: 2, // Decimal places for distance display
  },
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Convert to miles if configured
  if (GEOLOCATION_CONFIG.DISTANCE.unit === 'miles') {
    return distance * 0.621371;
  }

  return distance;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if coordinates are within radius of a center point
 * @param {object} center - Center coordinates {lat, lng}
 * @param {object} point - Point to check {lat, lng}
 * @param {number} radiusKm - Radius in kilometers
 * @returns {boolean} True if point is within radius
 */
export function isWithinRadius(center, point, radiusKm) {
  const distance = calculateDistance(center.lat, center.lng, point.lat, point.lng);
  return distance <= radiusKm;
}

/**
 * Format distance for display
 * @param {number} distance - Distance in configured unit
 * @returns {string} Formatted distance string
 */
export function formatDistance(distance) {
  const { unit, precisionDecimals } = GEOLOCATION_CONFIG.DISTANCE;
  const rounded = distance.toFixed(precisionDecimals);
  return `${rounded} ${unit}`;
}

/**
 * Get accuracy level description
 * @param {number} accuracy - Accuracy in meters
 * @returns {string} Human-readable accuracy level
 */
export function getAccuracyLevel(accuracy) {
  if (!accuracy) return 'Unknown';
  if (accuracy < 10) return 'Very High';
  if (accuracy < 50) return 'High';
  if (accuracy < 100) return 'Medium';
  if (accuracy < 500) return 'Low';
  return 'Very Low';
}

export default GEOLOCATION_CONFIG;
