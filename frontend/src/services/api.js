const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : (process.env.NODE_ENV === 'production' ? 'https://reevanta-backend-pg3v.onrender.com/api' : 'http://localhost:8001/api'));

// ─── Token Refresh State ──────────────────────────────────────────────────────
let _refreshPromise = null; // Deduplicate concurrent refresh calls

async function _tryRefreshToken() {
  // If a refresh is already in progress, reuse the same promise
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Refresh failed");
      return res.json();
    })
    .finally(() => {
      _refreshPromise = null;
    });

  return _refreshPromise;
}

// ─── Enterprise API Client ───────────────────────────────────────────────────
export async function apiFetch(endpoint, options = {}, _retried = false) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("reevanta_token") : null;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Ensures HTTP-only cookies are sent/received
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);

    // ── Auto Token Refresh on 401 ──
    if (response.status === 401 && !_retried && !endpoint.includes('/auth/refresh-token') && !endpoint.includes('/auth/logout')) {
      try {
        await _tryRefreshToken();
        // Retry the original request with refreshed token
        return apiFetch(endpoint, options, true);
      } catch {
        // Refresh failed — propagate 401
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.detail || data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status !== 401) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error);
    }
    throw error;
  }
}
