<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const step = ref(1); 

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const selectedRole = ref(null);
const errorMessage = ref('');

function handleStep1Submit() {
  errorMessage.value = '';
  
  if (!name.value || !email.value || !password.value) {
    errorMessage.value = "Por favor completa todos los campos.";
    return;
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Las contraseñas no coinciden.";
    return;
  }
  
  // Simulación de validación de correo existente
  const emailsRegistrados = ['test@correo.com'];
  if (emailsRegistrados.includes(email.value)) {
    errorMessage.value = "Este correo ya está registrado.";
    return;
  }
  
  step.value = 2; // Avanzar al paso de roles
}

async function handleRegistration() {
  errorMessage.value = '';
  
  if (!selectedRole.value) {
    errorMessage.value = "Selecciona un rol para continuar.";
    return;
  }

  console.log("Registrando:", { name: name.value, role: selectedRole.value });

  // --- LÓGICA DE REDIRECCIÓN CORREGIDA ---
  if (selectedRole.value === 'profesional') {
    // 1. El profesional va a su CONFIGURACIÓN INICIAL primero
    router.push('/professional-setup'); 
  } else {
    // 2. El cliente va directo a su DASHBOARD
    router.push('/client/dashboard'); 
  }
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
          <h2>{{ step === 1 ? 'Crear cuenta' : 'Personaliza tu experiencia' }}</h2>
          <p>{{ step === 1 ? 'Empieza tu viaje en ServiHub gratis.' : 'Selecciona tu perfil para continuar.' }}</p>
        </div>

        <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>

        <form v-if="step === 1" @submit.prevent="handleStep1Submit" class="register-form">
          
          <button type="button" class="google-btn">
            <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G">
            Continuar con Google
          </button>

          <div class="divider"><span>o regístrate con tu email</span></div>

          <div class="input-group">
            <label>Nombre Completo</label>
            <input type="text" v-model="name" placeholder="Ej. Juan Pérez">
          </div>
          
          <div class="input-group">
            <label>Correo Electrónico</label>
            <input type="email" v-model="email" placeholder="nombre@ejemplo.com">
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

          <button type="submit" class="primary-btn">Continuar</button>

          <p class="footer-text">
            ¿Ya tienes cuenta? <RouterLink to="/login" class="link">Inicia sesión</RouterLink>
          </p>
        </form>

        <div v-if="step === 2" class="step-content">
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

          <button @click="handleRegistration" class="primary-btn">Finalizar Registro</button>
          <button @click="step = 1" class="text-btn">Volver atrás</button>
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

/* HEADER DE MARCA */
.brand-header { display: flex; align-items: center; gap: 15px; margin-bottom: 40px; }
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

/* BOTONES */
.google-btn {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  width: 100%; padding: 14px; background: white; border: 1px solid #E5E7EB; 
  border-radius: 12px; font-weight: 600; font-size: 1rem; color: #374151; 
  cursor: pointer; transition: 0.2s;
}
.google-btn:hover { background: #F9FAFB; border-color: #D1D5DB; }
.google-btn img { width: 20px; }

.primary-btn {
  background: #0B4C6F; color: white; border: none; padding: 16px; 
  border-radius: 12px; font-size: 1.1rem; font-weight: 700; cursor: pointer; 
  width: 100%; margin-top: 10px; transition: 0.2s;
}
.primary-btn:hover { background: #093a55; transform: translateY(-1px); }

.text-btn { background: none; border: none; color: #666; margin-top: 15px; cursor: pointer; text-decoration: underline; font-size: 1rem; }

/* DIVIDER */
.divider { display: flex; align-items: center; color: #9CA3AF; font-size: 0.9rem; margin: 10px 0; font-weight: 500; }
.divider span { padding: 0 15px; }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: #E5E7EB; }

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
.footer-text { text-align: center; font-size: 1rem; color: #666; margin-top: 24px; }
.link { color: #0B4C6F; font-weight: 700; text-decoration: none; }
</style>