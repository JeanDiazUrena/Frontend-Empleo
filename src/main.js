import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import GoogleLoginPlugin from './plugins/googleLogin'
import { GOOGLE_CLIENT_ID } from './config'

// --- Configuración Global de Axios ---
axios.defaults.baseURL = 'http://localhost:4000';

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
    if (error.response && error.response.status === 401) {
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
