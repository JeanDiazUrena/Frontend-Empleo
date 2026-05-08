import { API_URLS } from '../config.js';

export function normalizeMediaUrl(value) {
  if (!value || typeof value !== 'string') return '';

  const url = value.trim();
  if (!url) return '';
  if (/^(blob:|data:|https?:\/\/|\/\/)/i.test(url)) return url;
  if (url.startsWith('/fotos/')) return url;

  if (url.startsWith('/uploads/')) return `${API_URLS.PERFILES}${url}`;
  if (url.startsWith('uploads/')) return `${API_URLS.PERFILES}/${url}`;

  return url;
}
