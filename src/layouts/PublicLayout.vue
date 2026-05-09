<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRouter, useRoute } from 'vue-router';
import { useUserSession } from '../composables/useUserSession'; // 1. IMPORTAR CEREBRO

const router = useRouter();
const route = useRoute();

// 2. USAR ESTADO GLOBAL (Ya no necesitamos leer localStorage manualmente aquí)
const { state, isLoggedIn, userInitials, logout } = useUserSession();

// Variables visuales del menú
const isMenuOpen = ref(false);
const menuRef = ref(null);

// --- LÓGICA INTELIGENTE DE EXPLORAR ---
const handleExplore = async () => {
  if (isLoggedIn.value) {
    // Si está logueado -> Entra a la app
    router.push('/client/explore');
  } else {
    // Si NO está logueado -> Scroll en el Home
    if (route.path !== '/') {
      await router.push('/');
      setTimeout(() => scrollToSection(), 100);
    } else {
      scrollToSection();
    }
  }
};

const scrollToSection = () => {
  const section = document.getElementById('explorar-seccion');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
};

// --- ACCIONES DEL MENÚ ---
const toggleMenu = () => isMenuOpen.value = !isMenuOpen.value;

const handleLogout = () => {
  logout(state.user.id);
  isMenuOpen.value = false;
  router.push('/login');
};

const goToProfile = () => {
  isMenuOpen.value = false;
  if (state.user.role === 'profesional') {
    router.push('/professional/settings');
  } else {
    router.push('/client/profile');
  }
};

const addAccount = () => {
  isMenuOpen.value = false;
  router.push('/login');
};

const goToDashboard = () => {
  if (state.user.role === 'profesional') {
    router.push('/professional/dashboard');
  } else {
    router.push('/client/dashboard');
  }
};

const { switchAccount } = useUserSession();
const handleSwitch = (id) => {
  if (id === state.user.id) return;
  switchAccount(id);
  isMenuOpen.value = false;
  // Redirigir al dashboard correspondiente
  goToDashboard();
};

// CERRAR AL HACER CLIC FUERA
const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    isMenuOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>

<template>
  <div class="public-layout">
    
    <header class="navbar">
      <div class="container nav-content">
        <div class="brand" role="button" tabindex="0" aria-label="Ir al inicio" @keydown.enter.prevent="router.push('/').then(() => window.scrollTo(0,0))" @keydown.space.prevent="router.push('/').then(() => window.scrollTo(0,0))" @click="router.push('/').then(() => window.scrollTo(0,0))" style="cursor: pointer;">
          <img src="/fotos/logo-servihub.png" alt="Logo" class="logo-icon">
          <span class="logo-text">ServiHub<span class="dot">.</span></span>
        </div>
        
        <nav class="nav-links">
          
          <a href="#explorar-seccion" @click.prevent="handleExplore" class="link">Explorar</a>

          <template v-if="!isLoggedIn">
            <RouterLink to="/login" class="link">Iniciar Sesión</RouterLink>
            <RouterLink to="/register" class="btn-join">Unirse</RouterLink>
          </template>

          <template v-else>
            <button @click="goToDashboard" class="btn-dashboard">
              Ir a mi Dashboard
            </button>
            
            <div class="user-menu-container" ref="menuRef">
              <button type="button" class="user-trigger" :aria-expanded="isMenuOpen" aria-haspopup="menu" @click="toggleMenu">
                <span class="user-name">{{ state.user.name }}</span>
                <div class="avatar-circle">
                  {{ userInitials }}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" :class="{ 'rotate': isMenuOpen }" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                </svg>
              </button>

              <transition name="fade">
                <div v-if="isMenuOpen" class="dropdown-menu">
                  <ul>
                    <li class="menu-header-item">
                      <small>Cuentas activas</small>
                    </li>
                    <li v-for="acc in state.accounts" :key="acc.id" @click="handleSwitch(acc.id)" class="account-item" :class="{ current: acc.id === state.user.id }">
                      <div class="acc-avatar">{{ acc.name[0] }}</div>
                      <div class="acc-info">
                        <strong>{{ acc.name }}</strong>
                        <small>{{ acc.role }}</small>
                      </div>
                      <i v-if="acc.id === state.user.id" class="fa-solid fa-circle-check current-icon"></i>
                    </li>

                    <li class="divider"></li>
                    
                    <li @click="goToProfile">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      Configuración de Perfil
                    </li>
                    <li @click="addAccount">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 20.25v.75a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75v-.75m-18 0A2.25 2.25 0 015.25 18h13.5A2.25 2.25 0 0121 20.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                      Agregar Nueva Cuenta
                    </li>
                    <li class="divider"></li>
                    <li class="logout" @click="handleLogout">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Cerrar Sesión Actual
                    </li>
                  </ul>
                </div>
              </transition>
            </div>
          </template>

        </nav>
      </div>
    </header>

    <main id="main-content" class="page-content" tabindex="-1">
      <RouterView />
    </main>

    <footer class="footer">
      <div class="container">
        <p>© ServiHub 2026. Todos los derechos reservados.</p>
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* ESTILOS VISUALES IDÉNTICOS A TU DISEÑO ORIGINAL */
.public-layout { display: flex; flex-direction: column; min-height: 100vh; }
.navbar { border-bottom: 1px solid #e5e7eb; background: white; padding: 15px 0; position: sticky; top: 0; z-index: 50; }
.nav-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.5rem; color: #111; text-decoration: none; }
.logo-icon { height: 32px; }
.dot { color: #F76B1C; }
.nav-links { display: flex; gap: 25px; align-items: center; }
.link { font-weight: 600; color: #666; transition: 0.2s; text-decoration: none; cursor: pointer; }
.link:hover { color: #0B4C6F; }
.btn-join { background: transparent; border: 1px solid #F76B1C; color: #F76B1C; padding: 8px 20px; border-radius: 6px; font-weight: 700; transition: 0.2s; text-decoration: none; }
.btn-join:hover { background: #F76B1C; color: white; }
.btn-dashboard { background: #0B4C6F; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }
.btn-dashboard:hover { background: #093a55; transform: translateY(-1px); }

/* MENÚ DE USUARIO */
.user-menu-container { position: relative; }
.user-trigger { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px 8px; border-radius: 30px; transition: background 0.2s; border: 1px solid transparent; background: transparent; font: inherit; }
.user-trigger:hover { background-color: #f3f4f6; border-color: #e5e7eb; }
.user-name { font-weight: 600; color: #333; font-size: 0.9rem; }
.avatar-circle { width: 34px; height: 34px; background: #F76B1C; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.arrow-icon { width: 14px; color: #64748b; transition: transform 0.2s; }
.rotate { transform: rotate(180deg); }

/* DROPDOWN */
.dropdown-menu { position: absolute; top: 50px; right: 0; width: 220px; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; overflow: hidden; z-index: 100; }
.dropdown-menu ul { list-style: none; padding: 5px; margin: 0; }
.dropdown-menu li { display: flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 0.9rem; color: #4b5563; cursor: pointer; transition: all 0.2s; }
.dropdown-menu li:hover { background-color: #F3F4F6; color: #0B4C6F; }
.dropdown-menu li svg { width: 18px; height: 18px; color: #94a3b8; transition: color 0.2s; }
.dropdown-menu li:hover svg { color: #0B4C6F; }
.menu-header-item { flex-direction: column; align-items: flex-start !important; cursor: default !important; border-bottom: 1px solid #f3f4f6; background-color: #f9fafb !important; pointer-events: none; }
.menu-header-item small { color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
.menu-header-item strong { color: #333; font-size: 1rem; }
.divider { height: 1px; background-color: #e2e8f0; margin: 5px 0; padding: 0 !important; cursor: default !important; }
.logout { color: #ef4444 !important; }
.logout svg { color: #ef4444 !important; }
.logout:hover { background-color: #fef2f2 !important; }

/* MULTI ACCOUNT STYLES */
.account-item {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  padding: 10px 16px !important;
  cursor: pointer;
  border-left: 3px solid transparent;
}
.account-item.current {
  background-color: #f8fafc;
  border-left-color: #F76B1C;
}
.account-item:hover {
  background-color: #f1f5f9;
}
.acc-avatar {
  width: 28px;
  height: 28px;
  background: #0B4C6F;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.8rem;
}
.acc-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.acc-info strong {
  font-size: 0.85rem;
  color: #1e293b;
  line-height: 1.2;
}
.acc-info small {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: capitalize;
}
.current-icon {
  color: #F76B1C;
  font-size: 0.8rem;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

.page-content { flex: 1; }
.footer { border-top: 1px solid #e5e7eb; padding: 30px 0; text-align: center; color: #888; font-size: 0.9rem; margin-top: auto; }
@media (max-width: 768px) {
  .navbar { padding: 10px 0; }
  .nav-content { gap: 12px; padding: 0 14px; }
  .brand { font-size: 1.15rem; min-width: 0; }
  .logo-icon { height: 28px; }
  .nav-links { gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
  .link { font-size: 0.85rem; }
  .btn-join, .btn-dashboard { padding: 8px 12px; font-size: 0.85rem; }
  .user-name { display: none; }
  .dropdown-menu { right: 0; width: min(90vw, 260px); }
}
</style>
