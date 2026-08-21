import axios from 'axios';

const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: defaultBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 45000
});

// Server warm-up / cold-start state listener
const warmupListeners = new Set();
let pendingSlowRequests = 0;

const notifyWarmup = (isWarming) => {
  warmupListeners.forEach((fn) => {
    try {
      fn(isWarming);
    } catch {}
  });
};

export const subscribeServerWarmup = (callback) => {
  warmupListeners.add(callback);
  return () => warmupListeners.delete(callback);
};

// Immediate background pre-warmup ping when app loads
try {
  const healthUrl = defaultBaseUrl.replace(/\/api\/?$/, '/api/health');
  axios.get(healthUrl, { timeout: 60000 }).catch(() => {});
} catch {}

// Request interceptor: Attach JWT token & setup cold-start timer
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('liberty_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set a timer to notify UI if request takes longer than 2.2s (server sleeping)
    config._warmupTimer = setTimeout(() => {
      pendingSlowRequests++;
      notifyWarmup(true);
    }, 2200);

    return config;
  },
  (error) => Promise.reject(error)
);

// Helper to clear timer
const cleanupRequestTimer = (config) => {
  if (config && config._warmupTimer) {
    clearTimeout(config._warmupTimer);
    if (pendingSlowRequests > 0) {
      pendingSlowRequests--;
      if (pendingSlowRequests === 0) {
        notifyWarmup(false);
      }
    }
  }
};

// Response interceptor: Handle 401 unauthenticated & clear cold-start timers
api.interceptors.response.use(
  (response) => {
    cleanupRequestTimer(response.config);
    return response;
  },
  (error) => {
    if (error.config) {
      cleanupRequestTimer(error.config);
    }
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
