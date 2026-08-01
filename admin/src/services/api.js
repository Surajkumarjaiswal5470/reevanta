import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'production' ? "https://reevanta-backend-pg3v.onrender.com" : "http://localhost:8001");
const API_BASE_URL = `${BACKEND_URL}/api`;

axios.defaults.withCredentials = true;

export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toLowerCase();
  
  try {
    const config = {
      method,
      url,
      data: options.body || options.data,
      headers: options.headers || {},
      withCredentials: true
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.detail || error.response?.data?.message || error.message;
    const err = new Error(msg);
    err.status = error.response?.status;
    throw err;
  }
}
