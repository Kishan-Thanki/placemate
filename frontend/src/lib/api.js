// Centralized API helpers
const API_BASE = import.meta.env.VITE_API_URL;

export function getApiBase() {
    console.log('API_BASE:', API_BASE);
  return API_BASE.replace(/\/+$/, '');
}

export function buildUrl(path) {
  const base = getApiBase();
  if (!path) return base;
  // Ensure path starts with /
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export async function fetchJSON(path, options = {}) {
  const url = path.startsWith('http') ? path : buildUrl(path);
  console.log('Fetching URL:', url);
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data, res };
}

export default {
  getApiBase,
  buildUrl,
  fetchJSON,
};
