<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';
import { ref, computed } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import axios from "axios";
import { useUserSession } from '../composables/useUserSession.js';
import { getPasswordStatus } from '../utils/passwordRules.js';

const { login } = useUserSession();
const router = useRouter();
const step = ref(1); 

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const selectedRole = ref(null);
const errorMessage = ref('');
const successMessage = ref('');
const verificationCode = ref('');
const googleCredential = ref('');
const isLoading = ref(false);

const isGmailEmail = (value) => /^[a-z0-9._%+-]+@(gmail\.com|googlemail\.com)$/i.test(String(value || '').trim());
const passwordStatus = computed(() => getPasswordStatus(password.value));
const passwordChecks = computed(() => passwordStatus.value.checks);
const passwordHint = computed(() => (
  password.value && !passwordStatus.value.isValid ? passwordStatus.value.missingMessage : ''
));

const hasUsableToken = (token) => {
  const cleanToken = String(token || '').trim();
  return cleanToken && cleanToken !== 'temp-token' && cleanToken !== 'dummy-token';
};

const normalizeSessionUser = (user) => ({
  id: user.id,
  nombre: user.nombre || user.name,
  email: user.email,
  rol: user.rol || user.role
});

const dashboardRouteFor = (role) => role === 'profesional'
  ? '/professional/dashboard'
  : '/client/dashboard';

const saveSessionAndEnter = async (user, token) => {
  if (!user?.id || !hasUsableToken(token)) {
    throw new Error('INVALID_REGISTRATION_SESSION');
  }

  const sessionUser = normalizeSessionUser(user);
  login(sessionUser, token);
  await router.replace(dashboardRouteFor(sessionUser.rol));
};

const loginAfterEmailRegistration = async (registeredUser) => {
  const { data } = await axios.post(`${API_URLS.AUTH}/api/login`, {
    email: email.value,
    password: password.value
  });

  return {
    user: data.user || registeredUser,
    token: data.token
  };
};

async function sendRegisterCode() {
  if (isLoading.value) return;
  errorMessage.value = '';
  successMessage.value = '';
  const cleanEmail = String(email.value || '').trim().toLowerCase();

  if (!name.value || !cleanEmail || !password.value || !confirmPassword.value) {
    errorMessage.value = "Completa todos los campos antes de continuar.";
    return;
  }

  if (!isGmailEmail(cleanEmail)) {
    errorMessage.value = "Debes usar una cuenta de Gmail válida.";
    return;
  }
  
  if (!passwordStatus.value.isValid) {
    errorMessage.value = passwordStatus.value.missingMessage;
    return;
  }
  
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Las contraseñas no coinciden.";
    return;
  }

  isLoading.value = true;
  try {
    email.value = cleanEmail;
    const { data } = await axios.post(`${API_URLS.AUTH}/api/register/request-code`, {
      nombre: name.value,
      email: cleanEmail
    });
    successMessage.value = data.message || "Te enviamos un código a tu Gmail.";
    step.value = 2;
  } catch (error) {
    if (error.response?.status === 409) {
      errorMessage.value = "Ese Gmail ya tiene una cuenta en ServiHub. Inicia sesión o usa “Olvidaste tu contraseña”.";
    } else {
      errorMessage.value = error.response?.data?.message || "No se pudo enviar el código.";
    }
  } finally {
    isLoading.value = false;
  }
}

async function handleStep1Submit() {
  await sendRegisterCode();
}

const handleGoogleCallback = async (response) => {
  console.log("Google response received:", response);
  if (response.credential) {
    googleCredential.value = response.credential;
    
    try {
      errorMessage.value = '';
      isLoading.value = true;
      const res = await axios.post(`${API_URLS.AUTH}/api/google`, {
        credential: response.credential
      });

      if (res.data.user) {
        console.log("User already exists, logging in...");
        const { user, token } = res.data;
        await saveSessionAndEnter(user, token);
        return;
      }
    } catch (err) {
      console.log("User does not exist or error:", err.response?.data);
      if (err.response && err.response.status === 404) {
        step.value = 2; 
      } else {
        errorMessage.value = err.response?.data?.error || err.response?.data?.message || "Error al conectar con Google.";
      }
    } finally {
      isLoading.value = false;
    }
  }
};

async function handleRegistration() {
  if (isLoading.value) return;
  console.log("Finalizing registration with role:", selectedRole.value);
  errorMessage.value = '';
  successMessage.value = '';
  if (!selectedRole.value) { errorMessage.value = "Selecciona un rol."; return; }
  if (!googleCredential.value && !verificationCode.value) {
    errorMessage.value = "Ingresa el código que enviamos a tu Gmail.";
    return;
  }

  isLoading.value = true;
  try {
    let response;
    if (googleCredential.value) {
      response = await axios.post(`${API_URLS.AUTH}/api/google`, {
        credential: googleCredential.value,
        rol: selectedRole.value
      });
    } else {
      response = await axios.post(`${API_URLS.AUTH}/api/register`, {
        nombre: name.value,
        email: email.value,
        password: password.value,
        rol: selectedRole.value,
        verification_code: verificationCode.value
      });
    }

    if (!response.data.user?.id) {
      throw new Error('INVALID_REGISTRATION_SESSION');
    }

    let sessionUser = response.data.user;
    let sessionToken = response.data.token;

    if (!googleCredential.value && !hasUsableToken(sessionToken)) {
      const loginSession = await loginAfterEmailRegistration(sessionUser);
      sessionUser = loginSession.user;
      sessionToken = loginSession.token;
    }

    await saveSessionAndEnter(sessionUser, sessionToken);

  } catch (error) {
    console.error("ERROR IN handleRegistration:", error);
    if (error.response && error.response.status === 429) {
      errorMessage.value = "Demasiados intentos. Por favor, espera un minuto e intenta de nuevo.";
    } else if (error.message === 'INVALID_REGISTRATION_SESSION') {
      errorMessage.value = "La cuenta se creó, pero no pudimos iniciar sesión automáticamente. Inicia sesión con tu correo y contraseña.";
    } else if (error.response && error.response.data && (error.response.data.message || error.response.data.error)) {
      errorMessage.value = error.response.data.error || error.response.data.message;
    } else {
      errorMessage.value = "Error en el registro. " + (error.message || "");
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div id="main-content" class="split-screen" tabindex="-1">
    
    <div class="brand-side">
      <div class="brand-overlay">
        <div class="brand-content">
          
          <RouterLink to="/" class="brand-header-link">
            <div class="brand-header">
              <img src="/fotos/logo-servihub.png" alt="Logo ServiHub" class="brand-logo-img">
              <span class="brand-url">Servihub.com</span>
            </div>
          </RouterLink>
          
          <h1>Únete a la mayor red de servicios.</h1>
          <p>Conecta con profesionales de confianza o encuentra nuevos clientes hoy mismo.</p>
          
          <div class="feature-list">
            <div class="feature-item">
              <span class="check">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span> 
              Pagos seguros y protegidos
            </div>
            <div class="feature-item">
              <span class="check">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span> 
              Perfiles verificados
            </div>
            <div class="feature-item">
              <span class="check">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span> 
              Soporte 24/7
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="form-side">
      <div class="form-wrapper">
        
        <div class="form-header">
          <h2>{{ step === 1 ? 'Crear cuenta' : 'Verificación de correo' }}</h2>
          <p>{{ step === 1 ? 'Empieza tu viaje en ServiHub gratis.' : 'Ingresa el código que enviamos a tu Gmail.' }}</p>
        </div>

        <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>
        <div v-if="successMessage" class="success-alert">{{ successMessage }}</div>
        <div v-if="errorMessage.includes('ya tiene una cuenta')" class="account-exists-actions">
          <RouterLink to="/login" class="account-link">Ir a iniciar sesión</RouterLink>
        </div>

        <form v-if="step === 1" @submit.prevent="handleStep1Submit" class="register-form">
          <div class="social-registration">
            <GoogleLogin :callback="handleGoogleCallback" class="google-btn-wrapper" />
          </div>

          <div class="divider">
            <span class="divider-text">o regístrate con tu email</span>
          </div>

          <div class="input-group">
            <label>Nombre Completo</label>
            <input type="text" v-model="name" placeholder="Ej. Juan Pérez">
          </div>
          
          <div class="input-group">
            <label>Correo Electrónico</label>
            <input type="email" v-model="email" placeholder="nombre@gmail.com">
          </div>
          
          <div class="row-inputs">
            <div class="input-group half">
              <label>Contraseña</label>
              <input type="password" v-model="password" placeholder="Mín. 8 caracteres">
            </div>
            <div class="input-group half">
              <label>Confirmar</label>
              <input type="password" v-model="confirmPassword" placeholder="Repetir">
            </div>
          </div>
          <div v-if="password" class="password-feedback">
            <ul class="password-rules">
              <li v-for="check in passwordChecks" :key="check.id" :class="{ met: check.met }">
                {{ check.label }}
              </li>
            </ul>
            <p v-if="passwordHint" class="password-hint">{{ passwordHint }}</p>
          </div>

          <button type="submit" class="primary-btn" :disabled="isLoading">
            {{ isLoading ? 'Enviando...' : 'Continuar' }}
          </button>

          <p class="footer-text">
            ¿Ya tienes cuenta? <RouterLink to="/login" class="link">Inicia sesión</RouterLink>
          </p>
        </form>

        <div v-if="step === 2" class="step-content">
          <div v-if="!googleCredential" class="verification-box">
            <div class="input-group">
              <label>Verificación de correo</label>
              <input
                type="text"
                v-model="verificationCode"
                inputmode="numeric"
                maxlength="6"
                placeholder="123456"
              >
            </div>
            <button @click="sendRegisterCode" class="text-btn resend-btn" :disabled="isLoading">
              Reenviar código
            </button>
          </div>

          <div class="role-selector">
            
            <div 
              class="role-card" 
              :class="{ 'active': selectedRole === 'cliente' }"
              @click="selectedRole = 'cliente'"
            >
              <div class="role-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>
              <div class="role-info">
                <h3>Soy Cliente</h3>
                <p>Quiero contratar servicios para mi hogar o negocio.</p>
              </div>
              <div class="role-check"></div>
            </div>

            <div 
              class="role-card" 
              :class="{ 'active': selectedRole === 'profesional' }"
              @click="selectedRole = 'profesional'"
            >
              <div class="role-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.05c0 .621-.504 1.125-1.125 1.125H5.125c-.621 0-1.125-.504-1.125-1.125v-4.05m16.5 0v-3.825c0-.621-.504-1.125-1.125-1.125H5.125c-.621 0-1.125.504-1.125 1.125v3.825m16.5 0c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H5.125c-.621 0-1.125.504-1.125 1.125v6.65c0 .621.504 1.125 1.125 1.125h14.25Z" />
                </svg>
              </div>
              <div class="role-info">
                <h3>Soy Profesional</h3>
                <p>Quiero ofrecer mis servicios y conseguir clientes.</p>
              </div>
              <div class="role-check"></div>
            </div>

          </div>

          <button @click="handleRegistration" class="primary-btn" :disabled="isLoading">
            {{ isLoading ? 'Registrando...' : 'Finalizar Registro' }}
          </button>
          <button @click="step = 1" class="text-btn" :disabled="isLoading">Volver atrás</button>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* RESET & LAYOUT */
* { box-sizing: border-box; }

.split-screen {
  display: flex;
  min-height: 100vh;
  width: 100vw;
}

/* --- IZQUIERDA (AZUL) --- */
.brand-side {
  flex: 0.8;
  background-image: url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop');
  background-size: cover;
  background-position: center;
  position: relative;
  display: none; 
}
@media (min-width: 1024px) { .brand-side { display: block; } }

.brand-overlay {
  position: absolute; inset: 0;
  background: rgba(11, 76, 111, 0.94);
  display: flex; align-items: center; justify-content: center;
  padding: 60px;
  color: white;
}

.brand-content { max-width: 480px; }

.brand-header-link { text-decoration: none; display: block; width: fit-content; }
.brand-header { display: flex; align-items: center; gap: 15px; margin-bottom: 40px; cursor: pointer; }
.brand-logo-img { height: 50px; background: transparent; }
.brand-url { font-size: 2rem; font-weight: 800; color: white; letter-spacing: -0.5px; }

.brand-content h1 { font-size: 3rem; font-weight: 800; line-height: 1.1; margin-bottom: 24px; }
.brand-content p { font-size: 1.25rem; opacity: 0.9; margin-bottom: 40px; line-height: 1.6; }

/* LISTA DE CARACTERÍSTICAS */
.feature-list { display: flex; flex-direction: column; gap: 16px; }
.feature-item { display: flex; align-items: center; gap: 12px; font-size: 1.1rem; font-weight: 500; }

.check { 
  background: rgba(255,255,255,0.2); width: 28px; height: 28px; border-radius: 50%; 
  display: flex; align-items: center; justify-content: center; color: white;
}
.check svg { width: 18px; height: 18px; stroke-width: 3; }

/* --- DERECHA (FORMULARIO) --- */
.form-side {
  flex: 1.2;
  background: white;
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
}

.form-wrapper { width: 100%; max-width: 600px; display: flex; flex-direction: column; }

.form-header { margin-bottom: 32px; }
.form-header h2 { font-size: 2rem; color: #111; margin: 0 0 8px 0; font-weight: 800; }
.form-header p { color: #666; font-size: 1.1rem; margin: 0; }

/* INPUTS MODERNOS */
.register-form { display: flex; flex-direction: column; gap: 20px; }
.input-group { display: flex; flex-direction: column; gap: 8px; }
.input-group label { font-size: 0.95rem; font-weight: 700; color: #374151; }
.input-group input {
  padding: 16px; background-color: #F9FAFB; border: 1px solid #E5E7EB; 
  border-radius: 12px; font-size: 1rem; width: 100%; transition: all 0.2s ease;
}
.input-group input:focus { background-color: white; border-color: #0B4C6F; outline: none; box-shadow: 0 0 0 4px rgba(11, 76, 111, 0.1); }

.row-inputs { display: flex; gap: 20px; }
.half { flex: 1; }
.password-feedback { margin-top: -8px; }
.password-rules { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px 14px; }
.password-rules li { font-size: 0.78rem; color: #94A3B8; display: flex; align-items: center; gap: 4px; font-weight: 700; }
.password-rules li::before { content: '○'; font-size: 0.68rem; }
.password-rules li.met { color: #16A34A; }
.password-rules li.met::before { content: '●'; }
.password-hint { margin: 8px 0 0; color: #DC2626; font-size: 0.82rem; font-weight: 800; }

.social-registration {
  width: 100%;
  margin-bottom: 10px;
}

.google-btn-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* BOTONES */
.primary-btn {
  background: #0B4C6F;
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  margin-top: 10px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(11, 76, 111, 0.15);
}

.primary-btn:hover {
  background: #093a55;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(11, 76, 111, 0.25);
}

.text-btn { background: none; border: none; color: #666; margin-top: 15px; cursor: pointer; text-decoration: underline; font-size: 1rem; }

/* DIVIDER */
.divider {
  display: flex;
  align-items: center;
  color: #9CA3AF;
  font-size: 0.9rem;
  margin: 15px 0;
  font-weight: 500;
}

.divider-text {
  padding: 0 15px;
  background: white;
  z-index: 1;
}

.divider::before, .divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #E5E7EB;
}

/* ROLES (PASO 2) */
.role-selector { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
.role-card {
  display: flex; align-items: center; gap: 20px;
  padding: 24px; border: 2px solid #E5E7EB; border-radius: 16px;
  cursor: pointer; transition: 0.2s;
}
.role-card:hover { border-color: #0B4C6F; background: #F0F9FF; }
.role-card.active { border-color: #0B4C6F; background: #E0F2FE; }

.role-icon { 
  font-size: 2rem; background: white; width: 60px; height: 60px; 
  display: flex; align-items: center; justify-content: center; 
  border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.05); color: #0B4C6F;
}
.role-icon svg { width: 32px; height: 32px; }

.role-info h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #111; }
.role-info p { margin: 4px 0 0 0; font-size: 0.95rem; color: #666; }
.role-check { width: 24px; height: 24px; border: 2px solid #D1D5DB; border-radius: 50%; margin-left: auto; }
.role-card.active .role-check { background: #0B4C6F; border-color: #0B4C6F; position: relative; }
.role-card.active .role-check::after { content: ""; width: 10px; height: 10px; background: white; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); border-radius: 50%; }

.error-alert { color: #d32f2f; background: #ffebee; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 20px; }
.success-alert { color: #047857; background: #ECFDF5; padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 1px solid #A7F3D0; font-weight: 600; }
.account-exists-actions { margin: -10px 0 18px; text-align: center; }
.account-link { display: inline-flex; align-items: center; justify-content: center; color: #0B4C6F; font-weight: 800; text-decoration: none; }
.account-link:hover { text-decoration: underline; }
.verification-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 18px; margin-bottom: 20px; }
.verification-box input { text-align: center; letter-spacing: 0.45em; font-size: 1.35rem; font-weight: 800; color: #0B4C6F; }
.resend-btn { margin-top: 10px; }
.footer-text { text-align: center; font-size: 1rem; color: #666; margin-top: 24px; }
.link { color: #0B4C6F; font-weight: 700; text-decoration: none; }

@media (max-width: 768px) {
  .form-side { padding: 80px 20px 40px; }
  .row-inputs { flex-direction: column; gap: 20px; }
}

@media (max-width: 480px) {
  .form-header h2 { font-size: 1.5rem; }
  .role-card { padding: 16px; gap: 12px; }
  .role-icon { width: 44px; height: 44px; }
  .role-icon svg { width: 20px; height: 20px; }
  .role-info h3 { font-size: 1rem; }
  .role-info p { font-size: 0.8rem; }
}
</style>
