<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js'; // 1. IMPORTAR CEREBRO

const router = useRouter();
const { login } = useUserSession();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function handleLogin() {
  if (isLoading.value) return;

  errorMessage.value = '';
  
  if (!email.value || !password.value) {
    errorMessage.value = "Por favor completa todos los campos.";
    return;
  }

  isLoading.value = true;

  try {
    // 1. CONEXIÓN AL BACKEND
    const response = await axios.post(`${API_URLS.AUTH}/api/login`, {
      email: email.value,
      password: password.value
    });

    const { token, user: basicUser } = response.data;
    
    // Preparamos el objeto final combinando datos
    let fullUserData = { ...basicUser };

    // ---------------------------------------------------------
    // PASO 2: RECUPERAR DATOS DEL PERFIL (Puerto 3001)
    // ---------------------------------------------------------
    // Si es cliente, vamos a buscar su teléfono y dirección al otro servidor
    if (basicUser.rol === 'cliente') {
      try {
        const profileResponse = await axios.get(`${API_URLS.PERFILES}/api/clientes/${basicUser.id}`);
        const profileData = profileResponse.data;

        if (profileData) {
          // AQUÍ OCURRE LA MAGIA:
          // Le pegamos el teléfono y dirección de la BD 3001 al usuario que vamos a guardar
          fullUserData.telefono = profileData.telefono;
          fullUserData.direccion = profileData.direccion;
          fullUserData.avatar = profileData.avatar; 
          // (Si tuvieras banner también lo agregas aquí)
        }
      } catch (profileError) {
        console.warn("No se pudo cargar el perfil detallado (3001), se usaran datos básicos.");
      }
    }

    // ---------------------------------------------------------
    // PASO 3: GUARDAR EN EL CEREBRO Y REDIRIGIR
    // ---------------------------------------------------------
    // Ahora 'fullUserData' tiene ID, Nombre, Email (del 3000) Y Teléfono, Dirección (del 3001)
    login(fullUserData, token);

    console.log("Login completo. Datos fusionados:", fullUserData);

    if (fullUserData.rol === 'profesional') {
      router.push('/professional/dashboard');
    } else {
      router.push('/client/dashboard');
    }

  } catch (error) {
    console.error("Error de autenticación:", error);

    if (error.response?.status === 429) {
      errorMessage.value = "Render está limitando temporalmente el servicio. Espera un minuto y vuelve a intentar.";
    } else if (error.response) {
      errorMessage.value = error.response.data.message || "Credenciales incorrectas.";
    } else if (error.request) {
      errorMessage.value = "Error de conexión: El servidor no responde.";
    } else {
      errorMessage.value = "Ocurrió un error inesperado.";
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleGoogleCallback(response) {
  if (isLoading.value) return;

  if (!response.credential) return;
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    const res = await axios.post(`${API_URLS.AUTH}/api/google`, {
      credential: response.credential
    });

    const { token, user: basicUser } = res.data;
    let fullUserData = { ...basicUser };

    if (basicUser.rol === 'cliente') {
      try {
        const profileResponse = await axios.get(`${API_URLS.PERFILES}/api/clientes/${basicUser.id}`);
        const profileData = profileResponse.data;
        if (profileData) {
          fullUserData.telefono = profileData.telefono;
          fullUserData.direccion = profileData.direccion;
          fullUserData.avatar = profileData.avatar; 
        }
      } catch (profileError) { console.warn("No extra data"); }
    }

    login(fullUserData, token);
    if (fullUserData.rol === 'profesional') {
      router.push('/professional/dashboard');
    } else {
      router.push('/client/dashboard');
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      errorMessage.value = "Cuenta no encontrada. Por favor regístrate como Cliente o Profesional primero.";
    } else {
      errorMessage.value = "Error al iniciar sesión con Google.";
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="login-page-fullscreen">
    
    <nav class="login-nav">
      <div class="nav-left">
        <RouterLink to="/" class="brand-link">
          <img src="/fotos/logo-servihub.png" alt="Logo" class="nav-logo">
          <span>ServiHub.</span>
        </RouterLink>
      </div>
      <div class="nav-right">
        <span class="nav-text">¿No tienes cuenta?</span>
        <RouterLink to="/register" class="btn-nav-outline">Regístrate</RouterLink>
      </div>
    </nav>

    <div class="split-layout">
      <div class="image-panel">
        <div class="overlay">
          <div class="content-box">
            <h1>Bienvenido de nuevo.</h1>
            <p>La plataforma donde profesionales y clientes conectan de forma segura.</p>
            <div class="pills">
              <span> Seguro</span>
              <span> Rápido</span>
              <span> Confiable</span>
            </div>
          </div>
        </div>
      </div>

      <div class="form-panel">
        <div class="form-content">
          <div class="form-header">
            <h2>Iniciar Sesión</h2>
            <p>Ingresa tus credenciales para continuar.</p>
          </div>

          <div v-if="errorMessage" class="error-msg">{{ errorMessage }}</div>

          <form @submit.prevent="handleLogin">
          <div class="social-login">
            <GoogleLogin :callback="handleGoogleCallback" class="google-btn-wrapper" />
          </div>

          <div class="separator">
            <span class="separator-text">o continuar con email</span>
          </div>

            <div class="field">
              <label>Correo Electrónico</label>
              <input type="email" v-model="email" placeholder="nombre@ejemplo.com">
            </div>
            
            <div class="field">
              <label>Contraseña</label>
              <input type="password" v-model="password" placeholder="Ingresa tu contraseña">
            </div>

            <div class="forgot">
              <a href="#">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" class="btn-submit" :disabled="isLoading">
              {{ isLoading ? 'Verificando...' : 'Entrar' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* TUS MISMOS ESTILOS */
.login-page-fullscreen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: white; z-index: 9999; display: flex; flex-direction: column; }
.login-nav { position: absolute; top: 0; left: 0; width: 100%; height: 80px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; z-index: 50; }
.brand-link { display: flex; align-items: center; gap: 10px; text-decoration: none; font-size: 1.5rem; font-weight: 800; color: white; }
.nav-logo { height: 35px; }
.nav-right { display: flex; gap: 15px; align-items: center; }
.nav-text { color: #666; font-size: 0.95rem; }
.btn-nav-outline { text-decoration: none; border: 1px solid #0B4C6F; color: #0B4C6F; padding: 8px 20px; border-radius: 6px; font-weight: 600; }
.split-layout { display: flex; width: 100%; height: 100%; }
.image-panel { width: 40%; background-image: url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop'); background-size: cover; background-position: center; position: relative; }
.overlay { position: absolute; inset: 0; background: rgba(11, 76, 111, 0.92); display: flex; align-items: center; justify-content: center; padding: 40px; color: white; }
.content-box { max-width: 400px; margin-top: 60px; }
.content-box h1 { font-size: 2.8rem; font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
.pills { display: flex; gap: 10px; margin-top: 20px; }
.pills span { background: rgba(255,255,255,0.2); padding: 5px 15px; border-radius: 20px; font-size: 0.85rem; }
.form-panel { width: 60%; display: flex; align-items: center; justify-content: center; padding: 40px; position: relative; }
.form-content { width: 100%; max-width: 550px; margin-top: 40px; }
.form-header { text-align: center; margin-bottom: 40px; }
.form-header h2 { font-size: 2.5rem; color: #111; margin-bottom: 10px; font-weight: 800; }
.field { margin-bottom: 20px; }
.field label { display: block; font-weight: 700; margin-bottom: 8px; color: #374151; }
.field input { width: 100%; padding: 16px; border: 1px solid #D1D5DB; border-radius: 10px; font-size: 1rem; background: #F9FAFB; }
.field input:focus { border-color: #0B4C6F; background: white; outline: none; }
.social-login {
  margin-bottom: 25px;
  width: 100%;
}

.google-btn-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.separator {
  display: flex;
  align-items: center;
  color: #9CA3AF;
  margin: 25px 0;
  font-size: 0.9rem;
}

.separator-text {
  padding: 0 15px;
  background: white;
  z-index: 1;
}

.separator::before, .separator::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #E5E7EB;
}

.btn-submit {
  width: 100%;
  background: #0B4C6F;
  color: white;
  padding: 16px;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(11, 76, 111, 0.15);
}

.btn-submit:hover {
  background: #083a55;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(11, 76, 111, 0.25);
}

.btn-submit:disabled {
  background: #CBD5E1;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error-msg {
  background-color: #FEE2E2;
  color: #DC2626;
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 25px;
  text-align: center;
  border: 1px solid #FCA5A5;
  font-weight: 500;
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.forgot {
  text-align: right;
  margin-bottom: 10px;
}

.forgot a {
  color: #0B4C6F;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
}

@media (max-width: 1000px) {
  .login-page-fullscreen { position: relative; height: auto; min-height: 100vh; }
  .login-nav { padding: 0 20px; }
  .image-panel { display: none; }
  .form-panel { width: 100%; padding: 80px 20px 40px; }
  .brand-link { color: #0B4C6F; }
  .nav-right { display: none; }
}

@media (max-width: 480px) {
  .form-header h2 { font-size: 1.8rem; }
  .btn-submit { font-size: 1rem; padding: 14px; }
  .field input { padding: 12px; }
}
</style>
