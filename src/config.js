const GATEWAY_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export const API_URLS = {
    AUTH: `${GATEWAY_URL}/auth-service`,
    PERFILES: `${GATEWAY_URL}/perfiles-service`,
    PAGOS: `${GATEWAY_URL}/pagos-service`,
    TRABAJOS: `${GATEWAY_URL}/trabajos-service`,
    NOTIFICACIONES: `${GATEWAY_URL}/notificaciones-service`,
};

export const SOCKET_URL = GATEWAY_URL;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '508703218994-7doqu36adap4tttlbln0vn7oib8jp1l0.apps.googleusercontent.com';
