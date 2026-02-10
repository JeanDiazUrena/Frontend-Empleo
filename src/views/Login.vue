<script setup>
import { ref } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '@/composables/useUserSession'; // 1. IMPORTAR CEREBRO

const router = useRouter();
const { login } = useUserSession(); // 2. USAR FUNCIÓN CENTRALIZADA

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

async function handleLogin() {
  errorMessage.value = '';
  
  if (!email.value || !password.value) {
    errorMessage.value = "Por favor completa todos los campos.";
    return;
  }

  isLoading.value = true;

  try {
    // 1. CONEXIÓN AL BACKEND
    const response = await axios.post('http://localhost:3000/api/login', {
      email: email.value,
      password: password.value
    });

    const { token, user } = response.data;

    // 2. ACTUALIZAR SESIÓN GLOBAL (Aquí ocurre la magia)
    // Al usar login(), el cerebro actualiza el localStorage Y el estado reactivo.
    // Esto hace que el navbar cambie inmediatamente sin recargar.
    login(user, token);

    console.log("Login exitoso. Rol detectado:", user.rol);

    // 3. REDIRECCIÓN
    if (user.rol === 'profesional') {
      router.push('/professional/dashboard');
    } else {
      router.push('/client/dashboard');
    }

  } catch (error) {
    console.error("Error de autenticación:", error);

    if (error.response) {
      errorMessage.value = error.response.data.message || "Usuario o contraseña incorrectos.";
    } else if (error.request) {
      errorMessage.value = "Error de conexión: El servidor no responde.";
    } else {
      errorMessage.value = "Ocurrió un error inesperado.";
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
            <button type="button" class="btn-google">
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G">
              Continuar con Google
            </button>

            <div class="separator"><span>o ingresa con tu email</span></div>

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
/* TUS ESTILOS ORIGINALES (NO TOCADOS) */
.login-page-fullscreen {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: white; z-index: 9999; display: flex; flex-direction: column;
}

.login-nav {
  position: absolute; top: 0; left: 0; width: 100%; height: 80px;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 40px; z-index: 50;
}
.brand-link { display: flex; align-items: center; gap: 10px; text-decoration: none; font-size: 1.5rem; font-weight: 800; color: white; }
.nav-logo { height: 35px; }
.nav-right { display: flex; gap: 15px; align-items: center; }
.nav-text { color: #666; font-size: 0.95rem; }
.btn-nav-outline { text-decoration: none; border: 1px solid #0B4C6F; color: #0B4C6F; padding: 8px 20px; border-radius: 6px; font-weight: 600; }

.split-layout { display: flex; width: 100%; height: 100%; }

.image-panel {
  width: 40%;
  background-image: url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2070&auto=format&fit=crop');
  background-size: cover; background-position: center; position: relative;
}
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

.btn-google { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 14px; background: white; border: 1px solid #D1D5DB; border-radius: 10px; font-weight: 600; cursor: pointer; }
.btn-submit { width: 100%; background: #0B4C6F; color: white; padding: 16px; border: none; border-radius: 10px; font-size: 1.1rem; font-weight: 700; cursor: pointer; margin-top: 20px; transition: 0.3s; }
.btn-submit:disabled { background: #ccc; cursor: not-allowed; }

.error-msg { background-color: #FEE2E2; color: #DC2626; padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: center; border: 1px solid #FCA5A5; }

.separator { display: flex; align-items: center; color: #9CA3AF; margin: 20px 0; }
.separator span { padding: 0 15px; }
.separator::before, .separator::after { content: ""; flex: 1; height: 1px; background: #E5E7EB; }

.forgot { text-align: right; }
.forgot a { color: #0B4C6F; font-weight: 600; text-decoration: none; font-size: 0.9rem; }

@media (max-width: 1000px) {
  .image-panel { display: none; }
  .form-panel { width: 100%; padding: 20px; }
  .brand-link { color: #0B4C6F; }
  .nav-right { display: none; }
}
</style>