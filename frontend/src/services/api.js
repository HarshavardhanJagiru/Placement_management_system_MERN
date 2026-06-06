import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for 401 Unauthorized (expired token, etc)
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized, logging out...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // We can let the AuthContext hook handle redirecting if needed
    }
    return Promise.reject(error);
  }
);

export default API;
