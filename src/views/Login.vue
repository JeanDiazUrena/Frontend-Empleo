<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import './Login.css'; // Importamos el CSS para esta página

// Variables para los campos del formulario
const email = ref('');
const password = ref('');
const rememberMe = ref(false);

// Función para manejar el envío del formulario
// (Aquí es donde te conectarás al backend de Express más adelante)
function handleLogin() {
  console.log('Iniciando sesión con:', email.value, password.value);
  // Lógica de conexión al backend...
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">

      <!-- Ícono del logo -->
      <div class="login-logo-icon">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.87-5.87m0 0L5.87 5.87m5.55 5.55v.007m0 .007L5.87 5.87M11.42 15.17l2.497-2.497M11.42 15.17 7.755 11.5a2.652 2.652 0 0 1 0-3.75m.007 3.75 3.663-3.663m-3.663 3.663 3.663-3.663" />
        </svg>
      </div>

      <h1 class="login-title">Inicia Sesión</h1>
      <p class="login-subtitle">Bienvenido de nuevo a ServiHub.</p>

      <!-- El @submit.prevent evita que la página se recargue -->
      <form @submit.prevent="handleLogin" class="login-form">

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" placeholder="ejemplo@correo.com" required>
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" v-model="password" placeholder="Ingresa tu contraseña" required>
        </div>

        <div class="form-options">
          <div class="form-check">
            <input type="checkbox" id="rememberMe" v-model="rememberMe">
            <label for="rememberMe">Recordarme</label>
          </div>
          <a href="#" class="form-link">¿Olvidaste tu contraseña?</a>
        </div>

        <button type="submit" class="button button--primary button--full">
          Iniciar Sesión
        </button>
      </form>

      <div class="login-divider">
        <span>o</span>
      </div>

      <button class="button button--google">
        <!-- SVG de Google (opcional, pero se ve bien) -->
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M17.64 9.20455c0-.61364-.05455-1.22727-.16364-1.81818H9.18182v3.43636h4.74545c-.20455 1.125-.81818 2.06818-1.63636 2.68182v2.22273h2.86364c1.68182-1.54091 2.66364-3.72727 2.66364-6.32273z"></path>
          <path fill="#34A853" d="M9.18182 18c2.43182 0 4.46818-.80455 5.96364-2.17273l-2.86364-2.22273c-.80455.54545-1.83636.87273-2.98182.87273-2.25 0-4.14545-1.51818-4.83636-3.54545H1.47727v2.28182C2.95455 16.2 5.81818 18 9.18182 18z"></path>
          <path fill="#FBBC05" d="M4.34545 10.74091c-.125-.375-.19545-.78182-.19545-1.21364s.07045-.83864.19545-1.21364V6.03182H1.47727C1.04545 7.02273.818182 8.1.818182 9.23182s.227273 2.20909.660909 3.19091l2.863636-2.28182z"></path>
          <path fill="#EA4335" d="M9.18182 3.63636c1.32273 0 2.5.45909 3.43636 1.35455l2.43182-2.43182C13.5318.45909 11.45 0 9.18182 0 5.81818 0 2.95455 1.8 1.47727 4.31818l2.86818 2.22273c.69091-2.02727 2.58636-3.54545 4.83636-3.54545z"></path>
        </svg>
        Continuar con Google
      </button>

    <p class="login-footer">
  ¿No tienes una cuenta? <RouterLink to="/register" class="form-link">Regístrate</RouterLink>
</p>
    </div>
  </div>
</template>