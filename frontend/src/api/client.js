import axios from 'axios';

// Get the base URL from env, and aggressively strip out '/users' if it exists there,
// so we have a clean root matching `/api/v1` for all feature endpoints.
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1/users';
const BASE_URL = rawUrl.replace(/\/users\/?$/, '');

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default client;
