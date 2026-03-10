import axios from 'axios';
import { toast } from 'sonner';

// The Backend URL should ideally come from env
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Attach token if available
    const token = localStorage.getItem('gce_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // Show success toasts for creation/update actions
    if (response.config.method !== 'get' && response.status >= 200 && response.status < 300) {
      toast.success(response.data?.message || 'Operation successful');
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    const endpoint = error.config?.url || '';

    // Don't show error toast for login/signup requests - let them handle their own errors
    if (endpoint.includes('/auth/login') || endpoint.includes('/auth/signup')) {
      return Promise.reject(error);
    }

    // SOLID Principle: Single Responsibility for Global Error Handling
    switch (status) {
      case 400:
        toast.error(`Bad Request: ${message}`);
        break;
      case 401:
        toast.error('Unauthorized: Please login again.');
        localStorage.removeItem('gce_token');
        // Handle redirect if needed (can be handled in the Context or layout)
        break;
      case 403:
        toast.error(`Forbidden: You don't have permission to access this.`);
        break;
      case 404:
        toast.error('Not Found: The requested resource is missing.');
        break;
      case 500:
        toast.error('Server Error: Something went wrong on the server.');
        break;
      default:
        toast.error(`An unexpected error occurred: ${message}`);
    }

    return Promise.reject(error);
  }
);

export default api;
