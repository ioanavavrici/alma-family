import axios from 'axios';

// Link-ul către serverul tău LIVE
const API_URL = 'https://25husv-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
});

// Adăugăm automat Token-ul de securitate la fiecare cerere
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;