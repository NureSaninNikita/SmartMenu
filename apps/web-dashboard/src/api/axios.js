import axios from 'axios';
import { clearSession, readSession } from '../services/authSession';

const api = axios.create({
  baseURL: import.meta.env.DEV
    ? '/api'
    : (import.meta.env.VITE_SMARTMENU_API_URL || ''),
});

api.interceptors.request.use((config) => {
  const token = readSession()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      clearSession();
    }
    return Promise.reject(error);
  },
);

export default api;
