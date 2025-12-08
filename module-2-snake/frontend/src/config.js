// API Configuration
// In production (Docker), use relative URL so Nginx can proxy
// In development, use localhost:5000

const getApiBaseUrl = () => {
  // Check if we're in production mode
  if (process.env.NODE_ENV === 'production') {
    // Use relative URL - Nginx will proxy /api to backend
    return '/api';
  }
  
  // Development mode - use environment variable or default
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;
