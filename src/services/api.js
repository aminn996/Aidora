import axios from 'axios';

const api = axios.create({
  // Use a same-origin API in production by default. Set VITE_API_BASE when the
  // Express API is deployed separately from the Vercel frontend.
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
