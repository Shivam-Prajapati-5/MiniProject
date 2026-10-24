import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_URL || '/api';
const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, '') || '/api';

const derivedSocketUrl = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl.slice(0, -4)
  : normalizedBaseUrl;

export const API_BASE_URL = normalizedBaseUrl;
export const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL
  || (import.meta.env.PROD ? 'https://miniproject-39kl.onrender.com' : '')
  || derivedSocketUrl
  || window.location.origin
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: normalizedBaseUrl,
  withCredentials: true,
});

export default api;
