import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import GoogleLoginPlugin from './plugins/googleLogin'
import { GATEWAY_URL, GOOGLE_CLIENT_ID } from './config'

// --- Configuración Global de Axios ---
axios.defaults.baseURL = GATEWAY_URL;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

axios.interceptors.response.use(
  response => response,
  error => {
    // 🛡️ NO redirigir si el error 401 viene del login o registro
    const isAuthRoute = error.config?.url?.includes('/api/login') || error.config?.url?.includes('/api/register');
    
    if (error.response && error.response.status === 401 && !isAuthRoute) {
      console.warn("Sesión expirada o inválida. Redirigiendo...");
      localStorage.removeItem('token');
      localStorage.removeItem('usuario_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const app = createApp(App)

app.use(router)
app.use(GoogleLoginPlugin, {
  clientId: GOOGLE_CLIENT_ID
})

app.mount('#app')

const userWayAccountId = import.meta.env.VITE_USERWAY_ACCOUNT_ID;
if (userWayAccountId && typeof document !== 'undefined' && !document.getElementById('a11yWidgetSrc')) {
  const userWayScript = document.createElement('script');
  userWayScript.id = 'a11yWidgetSrc';
  userWayScript.src = 'https://cdn.userway.org/widget.js';
  userWayScript.setAttribute('data-account', userWayAccountId);
  userWayScript.async = true;
  document.body.appendChild(userWayScript);
}
