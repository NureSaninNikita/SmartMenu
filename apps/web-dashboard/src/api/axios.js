import axios from 'axios';
import { clearSession, readSession } from '../services/authSession';

const api = axios.create({
  baseURL: import.meta.env.VITE_SMARTMENU_API_URL || (import.meta.env.DEV
    ? '/api'
    : ''),
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
