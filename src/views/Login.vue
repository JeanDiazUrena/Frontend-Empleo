<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

import { ref, computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js'; // 1. IMPORTAR CEREBRO
import { getPasswordStatus } from '../utils/passwordRules.js';

const router = useRouter();
const { login } = useUserSession();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const showForgotModal = ref(false);
const forgotStep = ref(1);
const forgotEmail = ref('');
const forgotCode = ref('');
const forgotPassword = ref('');
const forgotConfirmPassword = ref('');

const isGmailEmail = (value) => /^[a-z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i.test(String(value || '').trim());
const forgotPasswordStatus = computed(() => getPasswordStatus(forgotPassword.value));
const forgotPasswordChecks = computed(() => forgotPasswordStatus.value.checks);
const forgotPasswordHint = computed(() => (
  forgotPassword.value && !forgotPasswordStatus.value.isValid ? forgotPasswordStatus.value.missingMessage : ''
));

const goBack = () => {
  if (window.history.length > 1) router.back();
  else router.push('/');
};

const openForgotModal = () => {
  showForgotModal.value = true;
  forgotStep.value = 1;
  forgotEmail.value = email.value || '';
  forgotCode.value = '';
  forgotPassword.value = '';
  forgotConfirmPassword.value = '';
  errorMessage.value = '';
  successMessage.value = '';
};

const closeForgotModal = () => {
  if (isLoading.value) return;
  showForgotModal.value = false;
};

async function sendForgotCode() {
  if (isLoading.value) return;
  errorMessage.value = '';
  successMessage.value = '';

  if (!forgotEmail.value) {
    errorMessage.value = "Ingresa tu Gmail.";
    return;
  }

  if (!isGmailEmail(forgotEmail.value)) {
    errorMessage.value = "Debes usar una cuenta de Gmail válida.";
    return;
  }

  isLoading.value = true;
  try {
    const { data } = await axios.post(`${API_URLS.AUTH}/api/password/forgot-code`, {
      email: forgotEmail.value
    });
    successMessage.value = data.message || "Te enviamos un código a tu Gmail.";
    forgotStep.value = 2;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "No se pudo enviar el código.";
  } finally {
    isLoading.value = false;
  }
}

async function resetPassword() {
  if (isLoading.value) return;
  errorMessage.value = '';
  successMessage.value = '';

  if (!forgotCode.value || !forgotPassword.value || !forgotConfirmPassword.value) {
    errorMessage.value = "Completa el código y la nueva contraseña.";
    return;
  }

  if (!forgotPasswordStatus.value.isValid) {
    errorMessage.value = forgotPasswordStatus.value.missingMessage;
    return;
  }

  if (forgotPassword.value !== forgotConfirmPassword.value) {
    errorMessage.value = "Las contraseñas no coinciden.";
    return;
  }

  isLoading.value = true;
  try {
    const { data } = await axios.post(`${API_URLS.AUTH}/api/password/reset`, {
      email: forgotEmail.value,
      code: forgotCode.value,
      password: forgotPassword.value
    });
    successMessage.value = data.message || "Contraseña actualizada correctamente.";
    email.value = forgotEmail.value;
    password.value = '';
    showForgotModal.value = false;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "No se pudo cambiar la contraseña.";
  } finally {
    isLoading.value = false;
  }
}

async function handleLogin() {
  if (isLoading.value) return;

  errorMessage.value = '';
  successMessage.value = '';
  
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
  <div id="main-content" class="login-page-fullscreen" tabindex="-1">
    
    <nav class="login-nav">
      <div class="nav-left">
        <RouterLink to="/" class="brand-link">
          <img src="/fotos/logo-servihub.png" alt="Logo" class="nav-logo">
          <span>ServiHub.</span>
        </RouterLink>
        <button type="button" class="nav-back" @click="goBack" aria-label="Volver a la pagina anterior">
          &larr; Volver
        </button>
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
          <div v-if="successMessage" class="success-msg">{{ successMessage }}</div>

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
              <button type="button" @click="openForgotModal">¿Olvidaste tu contraseña?</button>
            </div>

            <button type="submit" class="btn-submit" :disabled="isLoading">
              {{ isLoading ? 'Verificando...' : 'Entrar' }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showForgotModal" class="forgot-backdrop" @click.self="closeForgotModal">
        <div class="forgot-card">
          <button class="forgot-close" @click="closeForgotModal">×</button>
          <div class="forgot-icon">
            <i class="fa-solid fa-envelope-open-text"></i>
          </div>
          <h3>Recuperar contraseña</h3>
          <p v-if="forgotStep === 1">Escribe tu Gmail y te enviaremos un código para validar que la cuenta existe y te pertenece.</p>
          <p v-else>Ingresa el código que recibiste y define una contraseña nueva.</p>

          <div v-if="errorMessage" class="error-msg forgot-alert">{{ errorMessage }}</div>
          <div v-if="successMessage" class="success-msg forgot-alert">{{ successMessage }}</div>

          <div class="field" v-if="forgotStep === 1">
            <label>Correo Gmail</label>
            <input type="email" v-model="forgotEmail" placeholder="nombre@gmail.com">
          </div>

          <template v-else>
            <div class="field">
              <label>Código</label>
              <input class="code-input" type="text" v-model="forgotCode" inputmode="numeric" maxlength="6" placeholder="123456">
            </div>
            <div class="field">
              <label>Nueva contraseña</label>
              <input type="password" v-model="forgotPassword" placeholder="Mín. 8 caracteres">
            </div>
            <div v-if="forgotPassword" class="password-feedback">
              <ul class="password-rules">
                <li v-for="check in forgotPasswordChecks" :key="check.id" :class="{ met: check.met }">
                  {{ check.label }}
                </li>
              </ul>
              <p v-if="forgotPasswordHint" class="password-hint">{{ forgotPasswordHint }}</p>
            </div>
            <div class="field">
              <label>Confirmar contraseña</label>
              <input type="password" v-model="forgotConfirmPassword" placeholder="Repetir contraseña">
            </div>
          </template>

          <button
            class="btn-submit forgot-submit"
            :disabled="isLoading"
            @click="forgotStep === 1 ? sendForgotCode() : resetPassword()"
          >
            {{ isLoading ? 'Procesando...' : forgotStep === 1 ? 'Enviar código' : 'Cambiar contraseña' }}
          </button>

          <button v-if="forgotStep === 2" class="forgot-resend" :disabled="isLoading" @click="sendForgotCode">
            Reenviar código
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* TUS MISMOS ESTILOS */
.login-page-fullscreen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: white; z-index: 9999; display: flex; flex-direction: column; }
.login-nav { position: absolute; top: 0; left: 0; width: 100%; height: 80px; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; z-index: 50; }
.nav-left { display: flex; align-items: center; gap: 18px; min-width: 0; }
.brand-link { display: flex; align-items: center; gap: 10px; text-decoration: none; font-size: 1.5rem; font-weight: 800; color: white; }
.nav-logo { height: 35px; }
.nav-back {
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border: 1px solid rgba(255,255,255,0.55);
  border-radius: 999px;
  background: rgba(255,255,255,0.12);
  color: white;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-back:hover { background: rgba(255,255,255,0.2); transform: translateX(-2px); }
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
.password-feedback { margin: -10px 0 18px; }
.password-rules { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px 14px; }
.password-rules li { font-size: 0.76rem; color: #94A3B8; display: flex; align-items: center; gap: 4px; font-weight: 700; }
.password-rules li::before { content: '○'; font-size: 0.68rem; }
.password-rules li.met { color: #16A34A; }
.password-rules li.met::before { content: '●'; }
.password-hint { margin: 8px 0 0; color: #DC2626; font-size: 0.82rem; font-weight: 800; }
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

.success-msg {
  background-color: #ECFDF5;
  color: #047857;
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 25px;
  text-align: center;
  border: 1px solid #A7F3D0;
  font-weight: 600;
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

.forgot button {
  background: none;
  border: none;
  padding: 0;
  color: #0B4C6F;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9rem;
  cursor: pointer;
  font-family: inherit;
}

.forgot-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.forgot-card {
  width: 100%;
  max-width: 440px;
  position: relative;
  background: white;
  border-radius: 22px;
  padding: 34px;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.28);
  border: 1px solid #E2E8F0;
}

.forgot-close {
  position: absolute;
  top: 16px;
  right: 18px;
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
}

.forgot-icon {
  width: 58px;
  height: 58px;
  background: #E0F2FE;
  color: #0B4C6F;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-bottom: 18px;
}

.forgot-card h3 {
  margin: 0 0 8px;
  color: #0F172A;
  font-size: 1.5rem;
  font-weight: 800;
}

.forgot-card p {
  margin: 0 0 22px;
  color: #64748B;
  line-height: 1.55;
  font-size: 0.95rem;
}

.forgot-alert {
  margin-bottom: 18px;
}

.code-input {
  text-align: center;
  letter-spacing: 0.45em;
  font-size: 1.25rem !important;
  font-weight: 800;
  color: #0B4C6F;
}

.forgot-submit {
  margin-top: 8px;
}

.forgot-resend {
  width: 100%;
  margin-top: 14px;
  background: none;
  border: none;
  color: #0B4C6F;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
}

@media (max-width: 1000px) {
  .login-page-fullscreen { position: relative; height: auto; min-height: 100vh; }
  .login-nav { padding: 0 20px; }
  .image-panel { display: none; }
  .form-panel { width: 100%; padding: 80px 20px 40px; }
  .brand-link { color: #0B4C6F; }
  .nav-back { border-color: #BFDBFE; background: #EFF6FF; color: #0B4C6F; }
  .nav-right { display: none; }
}

@media (max-width: 480px) {
  .login-nav { height: 72px; }
  .brand-link span { display: none; }
  .nav-left { gap: 10px; }
  .nav-back { height: 36px; padding: 0 12px; font-size: 0.86rem; }
  .form-header h2 { font-size: 1.8rem; }
  .btn-submit { font-size: 1rem; padding: 14px; }
  .field input { padding: 12px; }
}
</style>
