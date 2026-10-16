import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useGeolocation from '../hooks/useGeolocation';
import { calculateDistance, formatDistance } from '../config/geolocation.config';

const GeolocationSettings = () => {
  const {
    coords,
    accuracy,
    accuracyLevel,
    permission,
    error,
    source,
    address,
    loading,
    refresh,
  } = useGeolocation();

  const [testCoords, setTestCoords] = useState({ lat: '', lng: '' });
  const [testDistance, setTestDistance] = useState(null);

  const calculateTestDistance = () => {
    if (!coords || !testCoords.lat || !testCoords.lng) return;
    
    const distance = calculateDistance(
      coords.lat,
      coords.lng,
      parseFloat(testCoords.lat),
      parseFloat(testCoords.lng)
    );
    setTestDistance(formatDistance(distance));
  };

  const getSourceBadge = () => {
    const badges = {
      gps: { color: 'bg-green-500', text: 'GPS', icon: '📍' },
      ip: { color: 'bg-yellow-500', text: 'IP-Based', icon: '🌐' },
      default: { color: 'bg-gray-500', text: 'Default', icon: '📌' },
    };
    const badge = badges[source] || badges.default;
    return (
      <span className={`${badge.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  const getPermissionBadge = () => {
    const badges = {
      granted: { color: 'bg-green-500', text: 'Granted', icon: '✓' },
      denied: { color: 'bg-red-500', text: 'Denied', icon: '✗' },
      prompt: { color: 'bg-blue-500', text: 'Not Set', icon: '?' },
    };
    const badge = badges[permission] || badges.prompt;
    return (
      <span className={`${badge.color} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
        {badge.icon} {badge.text}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
      >
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
          📍 Location Settings
        </h2>

        {/* Current Location Status */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Current Location
          </h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Detecting location...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 dark:bg-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Coordinates</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {coords
                    ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
                    : 'Not available'}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Accuracy</p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {accuracy ? `±${accuracy.toFixed(0)}m (${accuracyLevel})` : 'Unknown'}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Source</p>
                <div className="mt-2">{getSourceBadge()}</div>
              </div>

              <div className="bg-yellow-50 dark:bg-gray-700 rounded-lg p-6">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Permission</p>
                <div className="mt-2">{getPermissionBadge()}</div>
              </div>
            </div>
          )}

          {address && (
            <div className="mt-6 bg-indigo-50 dark:bg-gray-700 rounded-lg p-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Address</p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {address.address}
              </p>
              {address.city && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {address.city}, {address.state} {address.postalCode}
                </p>
              )}
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded"
            >
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </motion.div>
          )}
        </div>

        {/* Actions */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Actions
          </h3>
          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refresh}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md"
            >
              🔄 Refresh Location
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (navigator.permissions) {
                  navigator.permissions
                    .query({ name: 'geolocation' })
                    .then(() => alert('Check your browser location settings'))
                    .catch(() => alert('Please check your browser settings manually'));
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md"
            >
              ⚙️ Check Permissions
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                localStorage.removeItem('userLocation');
                refresh();
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md"
            >
              🗑️ Clear Cache
            </motion.button>
          </div>
        </div>

        {/* Distance Calculator */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Distance Calculator
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="number"
              step="0.000001"
              placeholder="Test Latitude"
              value={testCoords.lat}
              onChange={(e) => setTestCoords({ ...testCoords, lat: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              step="0.000001"
              placeholder="Test Longitude"
              value={testCoords.lng}
              onChange={(e) => setTestCoords({ ...testCoords, lng: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={calculateTestDistance}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Calculate
            </button>
          </div>
          {testDistance && (
            <div className="mt-4 p-4 bg-green-100 rounded-lg">
              <p className="text-lg font-semibold text-green-800">
                Distance: {testDistance}
              </p>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">
            ℹ️ How Location Detection Works
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>
              <strong>GPS (Best):</strong> Uses your device's GPS for high accuracy (±5-50m)
            </li>
            <li>
              <strong>IP-Based (Fallback):</strong> Uses your IP address for approximate location
              (±50km)
            </li>
            <li>
              <strong>Default:</strong> Uses configured default coordinates if all else fails
            </li>
            <li>
              <strong>Privacy:</strong> Location data is cached locally for 15 minutes
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default GeolocationSettings;
