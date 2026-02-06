<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute(); 

// --- ESTADO DEL USUARIO Y MENÚ ---
const user = ref({ name: "Cliente", initials: "CL" });
const isMenuOpen = ref(false);
const menuRef = ref(null);

// --- NAVEGACIÓN GENERAL ---
const goTo = (path) => router.push(path);
const isActive = (path) => route.path.includes(path);

// --- LÓGICA DEL MENÚ ---
const toggleMenu = () => isMenuOpen.value = !isMenuOpen.value;

const handleLogout = () => {
  // Limpiar toda la sesión
  localStorage.clear();
  router.push('/login');
};

const goToProfile = () => {
  isMenuOpen.value = false;
  router.push('/client/profile');
};

const addAccount = () => {
  isMenuOpen.value = false; // Cerramos el menú
  router.push('/login');    // Redirigimos al Login
};

// CERRAR MENÚ AL HACER CLIC FUERA
const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    isMenuOpen.value = false;
  }
};

// --- AL CARGAR ---
onMounted(() => {
  document.addEventListener('click', handleClickOutside);

  // Cargar nombre real del localStorage
  const storedName = localStorage.getItem('usuario_nombre');
  if (storedName) {
    user.value.name = storedName;
    // Generar iniciales (Ej: Juan Perez -> JP)
    const parts = storedName.split(' ');
    user.value.initials = parts.length > 1 
      ? (parts[0][0] + parts[1][0]).toUpperCase() 
      : parts[0].substring(0, 2).toUpperCase();
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="dashboard-layout-fullscreen">
    
    <nav class="dash-navbar">
      <div class="dash-brand" @click="goTo('/')">
        <img src="/fotos/logo-servihub.png" alt="ServiHub" class="brand-icon" />
        <span class="brand-text">ServiHub<span class="dot">.</span></span>
      </div>

      <div class="dash-right" ref="menuRef">
        
        <div class="user-trigger" @click="toggleMenu">
          <span class="user-name">{{ user.name }}</span>
          <div class="avatar-circle">
            {{ user.initials }}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" :class="{ 'rotate': isMenuOpen }" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </div>

        <transition name="fade">
          <div v-if="isMenuOpen" class="dropdown-menu">
            <ul>
              <li class="menu-header-item">
                <small>Conectado como</small>
                <strong>{{ user.name }}</strong>
              </li>
              
              <li @click="goToProfile">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Mi Perfil
              </li>
              
              <li @click="addAccount">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 20.25v.75a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75v-.75m-18 0A2.25 2.25 0 015.25 18h13.5A2.25 2.25 0 0121 20.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                Agregar Cuenta
              </li>
              
              <li class="divider"></li>
              
              <li class="logout" @click="handleLogout">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Cerrar Sesión
              </li>
            </ul>
          </div>
        </transition>

      </div>
    </nav>

    <div class="dash-body">
      
      <aside class="dash-sidebar">
        
        <div class="action-area">
           <button class="btn-create" @click="goTo('/client/request')">
             + Pedir Servicio
           </button>
        </div>

        <ul class="menu-list">
          <li :class="{ active: isActive('dashboard') }" @click="goTo('/client/dashboard')">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Inicio
          </li>

          <li :class="{ active: isActive('explore') }" @click="goTo('/client/explore')">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Explorar
          </li>

          <li :class="{ active: isActive('chat') }" @click="goTo('/client/chat')">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Mensajes
          </li>

          <li :class="{ active: isActive('profile') }" @click="goTo('/client/profile')">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mi Perfil
          </li>
        </ul>
      </aside>

      <main class="dash-content">
        <RouterView />
      </main>

    </div>
  </div>
</template>

<style scoped>
.dashboard-layout-fullscreen { display: flex; flex-direction: column; min-height: 100vh; width: 100vw; background-color: #F8F9FA; position: absolute; top: 0; left: 0; }

/* NAVBAR */
.dash-navbar { height: 70px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; position: fixed; top: 0; left: 0; right: 0; z-index: 50; }
.dash-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.brand-icon { height: 32px; width: auto; }
.brand-text { font-size: 20px; font-weight: 800; color: #333; }
.dot { color: #F76B1C; }

/* DERECHA Y MENÚ */
.dash-right { position: relative; display: flex; align-items: center; }

.user-trigger { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 6px 12px; border-radius: 30px; transition: background 0.2s; }
.user-trigger:hover { background-color: #f3f4f6; }
.user-name { font-weight: 600; color: #333; font-size: 0.95rem; }
.avatar-circle { width: 38px; height: 38px; background: #0B4C6F; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.arrow-icon { width: 16px; color: #64748b; transition: transform 0.2s; }
.rotate { transform: rotate(180deg); }

/* DROPDOWN FLOTANTE */
.dropdown-menu { position: absolute; top: 60px; right: 0; width: 220px; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1px solid #e2e8f0; overflow: hidden; z-index: 100; }
.dropdown-menu ul { list-style: none; padding: 5px; margin: 0; }
.dropdown-menu li { display: flex; align-items: center; gap: 10px; padding: 12px 16px; font-size: 0.9rem; color: #4b5563; cursor: pointer; transition: all 0.2s; }
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

/* ANIMACIÓN */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* SIDEBAR Y CONTENIDO */
.dash-body { display: flex; margin-top: 70px; height: calc(100vh - 70px); }
.dash-sidebar { width: 260px; background: white; border-right: 1px solid #e5e7eb; padding: 24px; display: flex; flex-direction: column; height: 100%; position: fixed; left: 0; top: 70px; bottom: 0; }
.menu-list { list-style: none; padding: 0; margin: 20px 0 0 0; }
.menu-list li { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; cursor: pointer; color: #555; font-weight: 500; transition: all 0.2s; margin-bottom: 4px; }
.menu-list li:hover { background: #F3F4F6; color: #111; }
.menu-list li.active { background: #E0F2FE; color: #0B4C6F; font-weight: 600; }
.menu-icon { width: 20px; height: 20px; }
.action-area { margin-bottom: 10px; }
.btn-create { width: 100%; background: #F76B1C; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-create:hover { background: #e05a10; }
.dash-content { margin-left: 260px; padding: 30px; width: 100%; overflow-y: auto; }
</style>