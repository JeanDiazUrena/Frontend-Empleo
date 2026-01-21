<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const password = ref('');
const errorMessage = ref('');

function handleLogin() {
  errorMessage.value = '';
  
  if (!email.value || !password.value) {
    errorMessage.value = "Por favor ingresa tu correo y contraseña.";
    return;
  }

  console.log("Login con:", email.value);
  router.push('/client/dashboard');
}
</script>

<template>
  <div class="split-screen">
    
    <div class="brand-side">
      <div class="brand-overlay">
        <div class="brand-content">
          <div class="brand-header">
            <img src="/fotos/logo-servihub.png" alt="Logo ServiHub" class="brand-logo-img">
            <span class="brand-url">Servihub.com</span>
          </div>
          
          <h1>Bienvenido de nuevo.</h1>
          <p>Accede a tu cuenta para gestionar tus servicios, revisar solicitudes y conectar con profesionales.</p>
          
          <div class="feature-list">
            <div class="feature-item">
              <span class="check">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </span> 
              Acceso seguro
            </div>
            <div class="feature-item">
              <span class="check">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </span> 
              Gestión en tiempo real
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="form-side">
      <div class="form-wrapper">
        
        <div class="form-header">
          <h2>Iniciar Sesión</h2>
          <p>Ingresa tus credenciales para continuar.</p>
        </div>

        <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>

        <form @submit.prevent="handleLogin" class="login-form">
          
          <button type="button" class="google-btn">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G">
            Continuar con Google
          </button>

          <div class="divider"><span>o ingresa con tu email</span></div>

          <div class="input-group">
            <label>Correo Electrónico</label>
            <input type="email" v-model="email" placeholder="nombre@ejemplo.com">
          </div>
          
          <div class="input-group">
            <label>Contraseña</label>
            <input type="password" v-model="password" placeholder="Ingresa tu contraseña">
          </div>

          <div class="form-options">
            <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" class="primary-btn">Entrar</button>

          <p class="footer-text">
            ¿No tienes cuenta? <RouterLink to="/register" class="link">Regístrate aquí</RouterLink>
          </p>
        </form>

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
  background: white;
}

/* --- IZQUIERDA (AZUL) --- */
.brand-side {
  flex: 0.8; /* Mantiene proporción 40% aprox */
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

/* HEADER DE MARCA */
.brand-header { display: flex; align-items: center; gap: 15px; margin-bottom: 40px; }
.brand-logo-img { height: 50px; background: transparent; }
.brand-url { font-size: 2rem; font-weight: 800; color: white; letter-spacing: -0.5px; }

.brand-content h1 { font-size: 3rem; font-weight: 800; line-height: 1.1; margin-bottom: 24px; }
.brand-content p { font-size: 1.25rem; opacity: 0.9; margin-bottom: 40px; line-height: 1.6; }

.feature-list { display: flex; flex-direction: column; gap: 16px; }
.feature-item { display: flex; align-items: center; gap: 12px; font-size: 1.1rem; font-weight: 500; }
.check { background: rgba(255,255,255,0.2); width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; }
.check svg { width: 18px; height: 18px; stroke-width: 3; }

/* --- DERECHA (FORMULARIO) --- */
.form-side {
  flex: 1.2; /* Ocupa el 60% aprox */
  background: white;
  display: flex; 
  align-items: center; 
  justify-content: center;
  padding: 40px;
}

/* === CAMBIO CLAVE AQUÍ: Aumentado a 700px === */
.form-wrapper { 
  width: 100%; 
  max-width: 700px; /* Mucho más amplio */
  display: flex; 
  flex-direction: column; 
}

.form-header { margin-bottom: 40px; text-align: center; }
.form-header h2 { font-size: 2.5rem; color: #111; margin: 0 0 10px 0; font-weight: 800; }
.form-header p { color: #666; font-size: 1.2rem; margin: 0; }

/* INPUTS */
.login-form { display: flex; flex-direction: column; gap: 24px; } /* Más espacio entre inputs */
.input-group { display: flex; flex-direction: column; gap: 8px; }
.input-group label { font-size: 1rem; font-weight: 700; color: #374151; }
.input-group input {
  padding: 18px; /* Inputs más altos */
  background-color: #F9FAFB; 
  border: 1px solid #E5E7EB; 
  border-radius: 12px; 
  font-size: 1.1rem; 
  width: 100%; 
  transition: all 0.2s ease;
}
.input-group input:focus { background-color: white; border-color: #0B4C6F; outline: none; box-shadow: 0 0 0 4px rgba(11, 76, 111, 0.1); }

/* BOTONES */
.google-btn {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  width: 100%; padding: 16px; background: white; border: 1px solid #E5E7EB; 
  border-radius: 12px; font-weight: 600; font-size: 1.1rem; color: #374151; 
  cursor: pointer; transition: 0.2s;
}
.google-btn:hover { background: #F9FAFB; border-color: #D1D5DB; }
.google-btn img { width: 24px; }

.primary-btn {
  background: #0B4C6F; color: white; border: none; padding: 18px; 
  border-radius: 12px; font-size: 1.2rem; font-weight: 700; cursor: pointer; 
  width: 100%; margin-top: 15px; transition: 0.2s;
}
.primary-btn:hover { background: #093a55; transform: translateY(-1px); }

/* DIVIDER */
.divider { display: flex; align-items: center; color: #9CA3AF; font-size: 1rem; margin: 15px 0; font-weight: 500; }
.divider span { padding: 0 15px; }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #E5E7EB; }

/* EXTRAS */
.form-options { text-align: right; }
.forgot-link { color: #0B4C6F; font-size: 1rem; font-weight: 600; text-decoration: none; }
.forgot-link:hover { text-decoration: underline; }

.error-alert { color: #d32f2f; background: #ffebee; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 25px; font-size: 1rem; }
.footer-text { text-align: center; font-size: 1.1rem; color: #666; margin-top: 30px; }
.link { color: #0B4C6F; font-weight: 700; text-decoration: none; }
</style>