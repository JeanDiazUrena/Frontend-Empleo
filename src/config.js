const GATEWAY_URL = 'http://localhost:4000';

export const API_URLS = {
    AUTH: `${GATEWAY_URL}/auth-service`,
    PERFILES: `${GATEWAY_URL}/perfiles-service`,
    PAGOS: `${GATEWAY_URL}/pagos-service`,
    TRABAJOS: `${GATEWAY_URL}/trabajos-service`,
    NOTIFICACIONES: `${GATEWAY_URL}/notificaciones-service`,
};

export const SOCKET_URL = `${GATEWAY_URL}/perfiles-service`;
