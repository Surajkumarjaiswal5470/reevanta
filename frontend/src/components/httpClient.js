import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE_URL = BACKEND_URL ? `${BACKEND_URL}/api` : null;

const client = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 10000,
});

function isCancelError(err) {
  return axios.isCancel?.(err) || err?.name === "CanceledError" || err?.name === "AbortError";
}

function normalizeError(err) {
  // Preserve cancellation errors as-is so callers can keep checking
  // err.name / axios.isCancel without extra unwrapping.
  if (isCancelError(err)) return err;

  const message =
    err.response?.data?.message ||
    err.response?.data?.error ||
    err.message ||
    "Something went wrong. Please try again.";
  const normalized = new Error(message);
  normalized.status = err.response?.status;
  normalized.original = err;
  return normalized;
}

/**
 * Thin, shared wrapper around axios so every component talks to the
 * backend the same way: one base URL, one timeout, one error shape,
 * and one place to add auth headers / interceptors later.
 */
export const httpClient = {
  isConfigured: () => !!API_BASE_URL,

  async get(path, config = {}) {
    if (!API_BASE_URL) throw new Error("API is not configured");
    try {
      const res = await client.get(path, config);
      return res.data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  async post(path, body, config = {}) {
    if (!API_BASE_URL) throw new Error("API is not configured");
    try {
      const res = await client.post(path, body, config);
      return res.data;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  isCancelError,
};
