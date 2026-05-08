import { API_URLS } from '../config.js';

const SERVICE_BY_LOCAL_PORT = {
  3010: API_URLS.PERFILES,
  3001: API_URLS.PERFILES,
  3003: API_URLS.TRABAJOS,
};

export function normalizeMediaUrl(value) {
  if (!value || typeof value !== 'string') return '';

  const url = value.trim();
  if (!url) return '';
  if (/^(blob:|data:|\/\/)/i.test(url)) return url;
  if (url.startsWith('/fotos/')) return url;

  try {
    const parsed = new URL(url);
    const localServiceUrl = SERVICE_BY_LOCAL_PORT[parsed.port];
    if ((parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') && localServiceUrl) {
      return `${localServiceUrl}${parsed.pathname}`;
    }
    return url;
  } catch {}

  if (url.startsWith('/uploads/')) return `${API_URLS.PERFILES}${url}`;
  if (url.startsWith('uploads/')) return `${API_URLS.PERFILES}/${url}`;

  return url;
}
