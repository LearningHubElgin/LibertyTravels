import axios from 'axios';

const defaultBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://libertytourandtravels.onrender.com/api'
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: defaultBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('liberty_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 unauthenticated & normalize error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if we're on login page already
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('liberty_token');
        localStorage.removeItem('liberty_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
