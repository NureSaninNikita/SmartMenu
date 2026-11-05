import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_SMARTMENU_API_URL || (import.meta.env.DEV
    ? 'http://localhost:5022'
    : ''),
});

export default api;
