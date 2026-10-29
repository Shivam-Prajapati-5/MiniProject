import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_URL || '/api';
const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, '') || '/api';

const derivedSocketUrl = normalizedBaseUrl.startsWith('http') && normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl.slice(0, -4)
  : '';

export const API_BASE_URL = normalizedBaseUrl;

const isLocalhost = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.endsWith('.local')
);

// Live Render backend where the Node.js/Socket.IO server is deployed
const PRODUCTION_BACKEND_URL = 'https://miniproject-39kl.onrender.com';

export const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL
  || derivedSocketUrl
  || (!isLocalhost ? PRODUCTION_BACKEND_URL : '')
  || (typeof window !== 'undefined' ? window.location.origin : '')
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: normalizedBaseUrl,
  withCredentials: true,
});

export default api;
