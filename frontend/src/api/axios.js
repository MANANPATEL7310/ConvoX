import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/users';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // This automatically sends cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
});

// No interceptors needed for cookie-based authentication!
// Browser automatically sends JWT cookie with every request.

export default api;
