const getAPIUrl = () => {
  // First priority: environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.trim();
  }
  
  // Second priority: localhost detection
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // Production fallback
    return 'https://subscriber-increasing-web-backend.onrender.com';
  }
  
  // Server-side or unknown environment
  return 'https://subscriber-increasing-web-backend.onrender.com';
};

export const API = getAPIUrl();

// Debug log (remove in production if needed)
if (import.meta.env.DEV) {
  console.log('🔗 API Base URL:', API);
}
