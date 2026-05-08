export const GATEWAY_URL = 'https://servihub-gateway.onrender.com';

export const API_URLS = {
    AUTH: `${GATEWAY_URL}/auth-service`,
    PERFILES: `${GATEWAY_URL}/perfiles-service`,
    PAGOS: `${GATEWAY_URL}/pagos-service`,
    TRABAJOS: `${GATEWAY_URL}/trabajos-service`,
    NOTIFICACIONES: `${GATEWAY_URL}/notificaciones-service`,
};

export const SOCKET_URL = GATEWAY_URL;

// 👇 ESTA ES LA LÍNEA QUE VERCEL TE ESTÁ PIDIENDO A GRITOS 👇
export const GOOGLE_CLIENT_ID = '508703218994-7doqu36adap4tttlbln0vn7oib8jp1l0.apps.googleusercontent.com';