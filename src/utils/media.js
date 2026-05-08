import { API_URLS } from '../config.js';

export function normalizeMediaUrl(value, uploadBaseUrl = API_URLS.PERFILES) {
  if (!value || typeof value !== 'string') return '';

  const url = value.trim();
  if (!url) return '';
  if (/^(blob:|data:|\/\/)/i.test(url)) return url;

  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      if (parsed.pathname.startsWith('/uploads/')) {
        const isOldLocalUpload =
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname === '::1';

        if (isOldLocalUpload) return `${uploadBaseUrl}${parsed.pathname}`;
      }
    } catch {
      return url;
    }
    return url;
  }
  if (url.startsWith('/fotos/')) return url;

  if (url.startsWith('/uploads/')) return `${uploadBaseUrl}${url}`;
  if (url.startsWith('uploads/')) return `${uploadBaseUrl}/${url}`;

  return url;
}
