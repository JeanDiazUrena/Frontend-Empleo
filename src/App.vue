<script setup>
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

const route = useRoute();

// DETECCIÓN DE DASHBOARD
// Si es una ruta privada, ocultamos Navbar y Footer públicos.
const isDashboard = computed(() => {
  // 1. Verificación por meta datos del router
  if (route.meta && route.meta.hideNavbar) return true;
  // 2. Verificación por URL (seguridad extra)
  const p = route.path;
  return p.startsWith('/client') || p.startsWith('/professional') || p.includes('dashboard');
});
</script>

<template>
  <div class="app-wrapper">
    
    <header v-if="!isDashboard" class="servihub-navbar">
      <div class="nav-content">
        <div class="nav-left">
          <RouterLink to="/" class="brand-logo">
            <img src="/fotos/logo-servihub.png" alt="Logo" class="logo-icon">
            <span class="logo-text">ServiHub<span class="dot">.</span></span>
          </RouterLink>
        </div>
        <div class="nav-right desktop-only">
          <RouterLink to="/client/explore" class="nav-link">Explorar</RouterLink>
          <RouterLink to="/login" class="nav-link">Iniciar Sesión</RouterLink>
          <RouterLink to="/register" class="btn-join">Unirse</RouterLink>
        </div>
      </div>
    </header>

    <main class="main-view">
      <RouterView />
    </main>

    <footer v-if="!isDashboard" class="fiverr-footer">
      <div class="footer-content">
        <p class="copyright">© ServiHub. 2026</p>
      </div>
    </footer>

  </div>
</template>

<style>
/* =========================================
   1. VARIABLES GLOBALES (Tus colores)
   ========================================= */
:root { 
  --servi-blue: #0B4C6F;
  --servi-orange: #F76B1C;
  --servi-gray: #F5F7FA;
  --servi-text: #222222;
  --servi-white: #FFFFFF;
  --servi-text-light: #6b7280;
}

/* =========================================
   2. RESETEO BÁSICO
   ========================================= */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body { 
  margin: 0; 
  padding: 0; 
  font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif; 
  line-height: 1.6;
  font-weight: 400;
  color: var(--servi-text);
  background-color: var(--servi-white);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

/* =========================================
   3. ESTRUCTURA FLEXBOX (Sticky Footer Fix)
   ========================================= */
/* Esta clase reemplaza lo que antes tenías en #app */
.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Ocupa toda la altura de la ventana */
  width: 100%;
}

/* Esta clase fuerza al contenido a ocupar el espacio disponible */
.main-view {
  flex: 1; 
  display: flex;
  flex-direction: column;
  width: 100%;
}

/* =========================================
   4. NAVBAR PÚBLICO
   ========================================= */
.servihub-navbar { 
  background: var(--servi-white); 
  border-bottom: 1px solid #e4e5e7; 
  padding: 15px 0; 
  width: 100%;
  position: relative;
  z-index: 100;
}

.nav-content { 
  max-width: 1280px; 
  margin: 0 auto; 
  padding: 0 32px; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  width: 100%;
}

.brand-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; cursor: pointer; }
.logo-icon { height: 32px; width: auto; }
.logo-text { font-weight: 800; font-size: 24px; color: var(--servi-text); letter-spacing: -0.5px; }
.dot { color: var(--servi-orange); }

.nav-right { display: flex; gap: 24px; align-items: center; }

.nav-link { 
  color: var(--servi-text-light); 
  font-weight: 600; 
  font-size: 16px;
  text-decoration: none;
  transition: 0.2s; 
}
.nav-link:hover { color: var(--servi-orange); }

.btn-join { 
  border: 1px solid var(--servi-orange); 
  color: var(--servi-orange); 
  padding: 8px 20px; 
  border-radius: 4px; 
  text-decoration: none;
  font-weight: 700; 
  transition: 0.2s; 
}
.btn-join:hover { background: var(--servi-orange); color: var(--servi-white); }

@media (max-width: 768px) {
  .desktop-only { display: none; }
}

/* =========================================
   5. FOOTER PÚBLICO
   ========================================= */
.fiverr-footer { 
  border-top: 1px solid #e4e5e7; 
  padding: 40px 0; 
  background: var(--servi-white);
  width: 100%;
  margin-top: auto; /* Asegura que se quede al fondo si falta contenido */
}

.footer-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
  text-align: center;
  color: var(--servi-text-light);
  font-size: 14px;
}
</style>