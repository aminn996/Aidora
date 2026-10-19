// Updated: Simplified error handling, disabled IP fallback
import { useEffect, useRef, useState } from 'react';
import GEOLOCATION_CONFIG, { getAccuracyLevel } from '../config/geolocation.config';

export default function useGeolocation() {
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [accuracy, setAccuracy] = useState(null);
  const [permission, setPermission] = useState('prompt'); // 'granted' | 'denied' | 'prompt'
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null); // 'gps' | 'ip' | 'default'
  const [timestamp, setTimestamp] = useState(null);
  const [address, setAddress] = useState(null); // Reverse geocoded address
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef(null);

  // Load from cache first
  useEffect(() => {
    if (!GEOLOCATION_CONFIG.FEATURES.cacheResults) return;
    
    try {
      const cached = JSON.parse(
        localStorage.getItem(GEOLOCATION_CONFIG.PRIVACY.storageKey) || 'null'
      );
      if (cached && Date.now() - cached.timestamp < GEOLOCATION_CONFIG.CACHE_TTL) {
        setCoords(cached.coords);
        setAccuracy(cached.accuracy || null);
        setSource(cached.source || null);
        setTimestamp(cached.timestamp);
        setAddress(cached.address || null);
        setLoading(false);
      }
    } catch {}
  }, []);

  // Query permission if available
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((res) => setPermission(res.state))
        .catch(() => {});
    }
  }, []);

  const saveCache = (data) => {
    if (!GEOLOCATION_CONFIG.FEATURES.cacheResults) return;
    
    try {
      localStorage.setItem(
        GEOLOCATION_CONFIG.PRIVACY.storageKey,
        JSON.stringify({ ...data, timestamp: Date.now() })
      );
    } catch {}
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lat, lng) => {
    if (!GEOLOCATION_CONFIG.FEATURES.reverseGeocode) return null;
    
    try {
      const url = GEOLOCATION_CONFIG.REVERSE_GEOCODE.url(lat, lng);
      const response = await fetch(url);
      const data = await response.json();
      const parsed = GEOLOCATION_CONFIG.REVERSE_GEOCODE.parser(data);
      setAddress(parsed);
      return parsed;
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
      return null;
    }
  };

  // Try IP-based geolocation as fallback
  const tryIPGeolocation = async () => {
    if (!GEOLOCATION_CONFIG.FEATURES.ipFallback) {
      useFallbackCoords();
      return;
    }

    for (const service of GEOLOCATION_CONFIG.IP_SERVICES) {
      try {
        const response = await fetch(service.url);
        const data = await response.json();
        const location = service.parser(data);
        
        const next = {
          coords: { lat: location.lat, lng: location.lng },
          accuracy: location.accuracy,
          source: 'ip',
        };
        
        setCoords(next.coords);
        setAccuracy(next.accuracy);
        setSource(next.source);
        setTimestamp(Date.now());
        setError(null);
        setLoading(false);
        
        await reverseGeocode(location.lat, location.lng);
        saveCache(next);
        return;
      } catch (err) {
        // Silently try next service
        continue;
      }
    }
    
    // All IP services failed, use default
    useFallbackCoords();
  };

  const useFallbackCoords = () => {
    const defaultCoords = GEOLOCATION_CONFIG.DEFAULT_COORDS;
    const next = {
      coords: defaultCoords,
      accuracy: null,
      source: 'default',
    };
    
    setCoords(defaultCoords);
    setAccuracy(null);
    setSource('default');
    setTimestamp(Date.now());
    setLoading(false);
    saveCache(next);
  };

  const handleSuccess = async (pos) => {
    const next = {
      coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      accuracy: pos.coords.accuracy,
      source: 'gps',
    };
    
    setCoords(next.coords);
    setAccuracy(next.accuracy);
    setSource(next.source);
    setTimestamp(Date.now());
    setError(null);
    setLoading(false);
    
    await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
    saveCache(next);
  };

  const handleError = async (err) => {
    // Only show error for permission denied, otherwise silently fallback
    if (err?.code === 1) {
      setError(GEOLOCATION_CONFIG.ERROR_MESSAGES.PERMISSION_DENIED);
    }
    
    // Try IP-based fallback (silent for all errors)
    await tryIPGeolocation();
  };

  const refresh = () => {
    if (!('geolocation' in navigator)) {
      setError(GEOLOCATION_CONFIG.ERROR_MESSAGES.NOT_SUPPORTED);
      useFallbackCoords();
      return;
    }
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      GEOLOCATION_CONFIG.GPS_OPTIONS
    );
  };

  const startWatch = () => {
    if (!('geolocation' in navigator)) return;
    if (!GEOLOCATION_CONFIG.FEATURES.watchPosition) return;
    if (watchIdRef.current != null) return; // already watching
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      GEOLOCATION_CONFIG.WATCH_OPTIONS
    );
  };

  const stopWatch = () => {
    if (watchIdRef.current != null && navigator.geolocation.clearWatch) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };


  return {
    coords,
    accuracy,
    accuracyLevel: accuracy ? getAccuracyLevel(accuracy) : null,
    permission,
    error,
    source,
    timestamp,
    address,
    loading,
    refresh,
    startWatch,
    stopWatch,
  };
}
