import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useGeolocation from '../hooks/useGeolocation';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [locationSynced, setLocationSynced] = useState(false);
  const geo = useGeolocation();

  // Update API token
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Verify token on load
  useEffect(() => {
    const verify = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        setUser(res.data.user);
        setToken(savedToken);
      } catch (error) {
        console.error('Token verification failed:', error);
        localStorage.removeItem('token');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const newToken = res.data.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(res.data.user);
    // trigger location sync after login when coords available
    setLocationSynced(false);
    return res.data;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post('/auth/register', payload);
    const newToken = res.data.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(res.data.user);
    setLocationSynced(false);
    return res.data;
  }, []);

  const googleLogin = useCallback(async (googleId, email, name, profilePicture) => {
    const res = await api.post('/auth/google', {
      googleId,
      email,
      name,
      profilePicture,
    });
    const newToken = res.data.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(res.data.user);
    return res.data;
  }, []);

  const facebookLogin = useCallback(async (facebookId, email, name, profilePicture) => {
    const res = await api.post('/auth/facebook', {
      facebookId,
      email,
      name,
      profilePicture,
    });
    const newToken = res.data.token;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(res.data.user);
    return res.data;
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data.user);
    return res.data;
  }, []);

  // Auto-sync provider location once per session when coords available
  useEffect(() => {
    const maybeSync = async () => {
      if (!user || locationSynced) return;
      if (user.role !== 'provider') return; // only providers geo-sync
      if (!geo.coords) return; // wait for geolocation
      try {
        await updateProfile({
          location: {
            coordinates: [geo.coords.lng, geo.coords.lat],
            address: undefined,
          },
        });
        setLocationSynced(true);
      } catch (e) {
        // ignore sync error silently for UX
        console.warn('Location sync failed:', e?.message || e);
      }
    };
    maybeSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, geo.coords]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        isAuthenticated: !!user,
        login,
        register,
        googleLogin,
        facebookLogin,
        updateProfile,
        logout,
        apiClient: api,
        geolocation: geo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
