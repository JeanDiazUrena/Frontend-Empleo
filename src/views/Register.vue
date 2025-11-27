<script setup>
import { ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router'; // 1. Importamos useRouter
import './Register.css'; 

// Inicializamos el router
const router = useRouter();

// --- Lógica de Múltiples Pasos ---
const step = ref(1); 

// --- Variables (estado) para el formulario ---
const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const selectedRole = ref(null);

// --- Funciones ---

function handleStep1Submit() {
  if (password.value !== confirmPassword.value) {
    alert("Las contraseñas no coinciden.");
    return;
  }
  // Avanzar al paso 2
  step.value = 2;
}

function handleRegistration() {
  if (!selectedRole.value) {
    alert("Por favor, selecciona un rol.");
    return;
  }
  
  // Simulación: Aquí se enviarían los datos (nombre, email, pass) al backend para CREAR el usuario
  console.log("Usuario creado:", email.value, "Rol:", selectedRole.value);

  // --- Lógica de Redirección ---
  if (selectedRole.value === 'profesional') {
    // Si es PROFESIONAL, lo mandamos a completar su perfil
    router.push('/professional-setup');
  } else {
    // Si es CLIENTE, lo mandamos directo al inicio (Home)
    router.push('/'); 
  }
}
</script>

<template>
  <div class="register-page">
    
    <div class="register-card" v-if="step === 1">
      <div class="register-logo">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.87-5.87m0 0L5.87 5.87m5.55 5.55v.007m0 .007L5.87 5.87M11.42 15.17l2.497-2.497M11.42 15.17 7.755 11.5a2.652 2.652 0 0 1 0-3.75m.007 3.75 3.663-3.663m-3.663 3.663 3.663-3.663" /></svg>
      </div>

      <h1 class="register-title">Crea tu cuenta</h1>

      <button class="button button--google">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.20455c0-.61364-.05455-1.22727-.16364-1.81818H9.18182v3.43636h4.74545c-.20455 1.125-.81818 2.06818-1.63636 2.68182v2.22273h2.86364c1.68182-1.54091 2.66364-3.72727 2.66364-6.32273z"></path><path fill="#34A853" d="M9.18182 18c2.43182 0 4.46818-.80455 5.96364-2.17273l-2.86364-2.22273c-.80455.54545-1.83636.87273-2.98182.87273-2.25 0-4.14545-1.51818-4.83636-3.54545H1.47727v2.28182C2.95455 16.2 5.81818 18 9.18182 18z"></path><path fill="#FBBC05" d="M4.34545 10.74091c-.125-.375-.19545-.78182-.19545-1.21364s.07045-.83864.19545-1.21364V6.03182H1.47727C1.04545 7.02273.818182 8.1.818182 9.23182s.227273 2.20909.660909 3.19091l2.863636-2.28182z"></path><path fill="#EA4335" d="M9.18182 3.63636c1.32273 0 2.5.45909 3.43636 1.35455l2.43182-2.43182C13.5318.45909 11.45 0 9.18182 0 5.81818 0 2.95455 1.8 1.47727 4.31818l2.86818 2.22273c.69091-2.02727 2.58636-3.54545 4.83636-3.54545z"></path></svg>
        <span>Registrarse con Google</span>
      </button>

      <div class="login-divider"><span>o</span></div>

      <form @submit.prevent="handleStep1Submit" class="register-form">
        <div class="form-group">
          <label for="name">Nombre</label>
          <input type="text" id="name" v-model="name" placeholder="Ingresa tu nombre" required>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" placeholder="tu@email.com" required>
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" v-model="password" placeholder="••••••••" required>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña</label>
          <input type="password" id="confirmPassword" v-model="confirmPassword" placeholder="••••••••" required>
        </div>

        <p class="form-terms">
          Al crear una cuenta, aceptas nuestros 
          <a href="#" class="form-link">Términos de Servicio</a> y 
          <a href="#" class="form-link">Política de Privacidad</a>.
        </p>

        <button type="submit" class="button button--primary button--full">
          Crear cuenta
        </button>
      </form>

      <p class="register-footer">
        ¿Ya tienes una cuenta? <RouterLink to="/login" class="form-link">Inicia sesión</RouterLink>
      </p>
    </div>

    <div class="register-card" v-if="step === 2">
      <h1 class="register-title">¿Cómo usarás la plataforma?</h1>
      <p class="register-subtitle">Selecciona una opción para continuar</p>

      <div class="role-selector">
        
        <div 
          class="role-option"
          :class="{ 'selected': selectedRole === 'cliente' }"
          @click="selectedRole = 'cliente'"
        >
          <div class="role-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          </div>
          <h3 class="role-title">Busco un servicio</h3>
          <p class="role-description">Quiero encontrar y contratar profesionales.</p>
        </div>

        <div 
          class="role-option"
          :class="{ 'selected': selectedRole === 'profesional' }"
          @click="selectedRole = 'profesional'"
        >
          <div class="role-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.05c0 .621-.504 1.125-1.125 1.125H5.125c-.621 0-1.125-.504-1.125-1.125v-4.05m16.5 0v-3.825c0-.621-.504-1.125-1.125-1.125H5.125c-.621 0-1.125.504-1.125 1.125v3.825m16.5 0c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H5.125c-.621 0-1.125.504-1.125 1.125v6.65c0 .621.504 1.125 1.125 1.125h14.25Z" /></svg>
          </div>
          <h3 class="role-title">Quiero ofrecer mis servicios</h3>
          <p class="role-description">Busco crear mi portafolio y conectar con clientes.</p>
        </div>

      </div>

      <button @click="handleRegistration" class="button button--primary button--full">
        Continuar
      </button>
    </div>

  </div>
</template>