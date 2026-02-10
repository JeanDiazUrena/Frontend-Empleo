<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute(); 

// --- 1. ESTADO DEL USUARIO ---
const user = ref({
  name: "", 
  role: ""
});

// Variables para el Menú
const isMenuOpen = ref(false);
const menuRef = ref(null);

// --- 2. LÓGICA EXISTENTE (Iniciales) ---
const userInitials = computed(() => {
  if (!user.value.name) return ''; 
  const parts = user.value.name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts.length > 0 ? parts[0][0].toUpperCase() : '?';
});

// --- 3. FUNCIONES DEL MENÚ ---
const toggleMenu = () => isMenuOpen.value = !isMenuOpen.value;

const handleLogout = () => {
  localStorage.clear();
  router.push('/login');
};

const goToProfile = () => {
  isMenuOpen.value = false;
  router.push('/professional/profile');
};

const addAccount = () => {
  isMenuOpen.value = false;
  router.push('/login');
};

// Cerrar al hacer clic fuera
const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    isMenuOpen.value = false;
  }
};

// --- 4. CICLO DE VIDA ---
onMounted(() => {
  document.addEventListener('click', handleClickOutside);

  // Cargar datos del localStorage
  const storedName = localStorage.getItem('usuario_nombre') || localStorage.getItem('user_name');
  if (storedName) {
    user.value.name = storedName;
    user.value.role = "Profesional Verificado"; 
  }
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// NAVEGACIÓN
const goTo = (path) => router.push(path);
const isActive = (path) => route.path.includes(path);
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
            {{ userInitials }}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" :class="{ 'rotate': isMenuOpen }" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </div>

        <transition name="fade">
          <div v-if="isMenuOpen" class="dropdown-menu">
            <ul>
              <li class="menu-header-item">
                <small>Cuenta Profesional</small>
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
        <div class="mini-profile" @click="goTo('/professional/profile')">
           <div class="avatar-circle-lg">
             {{ userInitials }}
           </div>
           <div class="info">
             <h4>{{ user.name || 'Cargando...' }}</h4>
             <p class="role-text">{{ user.role || '---' }}</p>
           </div>
        </div>

        <ul class="menu-list">
          <li :class="{ active: isActive('dashboard') }" @click="goTo('/professional/dashboard')">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Solicitudes
          </li>

          <li :class="{ active: isActive('chat') }" @click="goTo('/professional/chat')">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Mensajes
          </li>

          <li :class="{ active: isActive('profile') }" @click="goTo('/professional/profile')">
            <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
/* RESET & FULL WIDTH */
.dashboard-layout-fullscreen {
  display: flex; flex-direction: column; min-height: 100vh; width: 100vw; background-color: #F8F9FA; position: absolute; top: 0; left: 0;
}

/* NAVBAR */
.dash-navbar {
  height: 70px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; position: fixed; top: 0; left: 0; right: 0; z-index: 50;
}
.dash-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.brand-icon { height: 32px; width: auto; }
.brand-text { font-size: 20px; font-weight: 800; color: #333; }
.dot { color: #F76B1C; }

/* --- DERECHA Y MENÚ (NUEVOS ESTILOS) --- */
.dash-right { position: relative; display: flex; align-items: center; }

.user-trigger { 
  display: flex; align-items: center; gap: 10px; 
  cursor: pointer; padding: 6px 12px; 
  border-radius: 30px; transition: background 0.2s; 
  border: 1px solid transparent;
}
.user-trigger:hover { background-color: #f3f4f6; border-color: #e5e7eb; }

.user-name { font-weight: 600; color: #333; font-size: 0.95rem; }
.avatar-circle { 
  width: 36px; height: 36px; 
  background: #0B4C6F; color: white; 
  border-radius: 50%; 
  display: flex; align-items: center; justify-content: center; 
  font-weight: bold; font-size: 0.9rem;
}
.arrow-icon { width: 16px; color: #64748b; transition: transform 0.2s; }
.rotate { transform: rotate(180deg); }

/* MENU DESPLEGABLE */
.dropdown-menu { 
  position: absolute; top: 60px; right: 0; 
  width: 220px; background: white; 
  border-radius: 12px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.15); 
  border: 1px solid #e2e8f0; 
  overflow: hidden; z-index: 100; 
}
.dropdown-menu ul { list-style: none; padding: 5px; margin: 0; }
.dropdown-menu li { 
  display: flex; align-items: center; gap: 10px; 
  padding: 12px 16px; font-size: 0.9rem; color: #4b5563; 
  cursor: pointer; transition: all 0.2s; 
}
.dropdown-menu li:hover { background-color: #F3F4F6; color: #0B4C6F; }
.dropdown-menu li svg { width: 18px; height: 18px; color: #94a3b8; transition: color 0.2s; }
.dropdown-menu li:hover svg { color: #0B4C6F; }

.menu-header-item { 
  flex-direction: column; align-items: flex-start !important; 
  cursor: default !important; 
  border-bottom: 1px solid #f3f4f6; 
  background-color: #f9fafb !important; 
  pointer-events: none; 
}
.menu-header-item small { color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; font-weight: 700; }
.menu-header-item strong { color: #333; font-size: 1rem; }

.divider { height: 1px; background-color: #e2e8f0; margin: 5px 0; padding: 0 !important; cursor: default !important; }
.logout { color: #ef4444 !important; }
.logout svg { color: #ef4444 !important; }
.logout:hover { background-color: #fef2f2 !important; }

/* ANIMACIÓN */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* --- RESTO DEL DASHBOARD (Sidebar, etc) --- */
.dash-body { display: flex; margin-top: 70px; height: calc(100vh - 70px); }
.dash-sidebar { width: 260px; background: white; border-right: 1px solid #e5e7eb; padding: 24px; display: flex; flex-direction: column; height: 100%; position: fixed; left: 0; top: 70px; bottom: 0; }
.mini-profile { display: flex; align-items: center; gap: 12px; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; cursor: pointer; }
.avatar-circle-lg { width: 48px; height: 48px; background: #0B4C6F; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 700; }
.info h4 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #333; min-height: 1.2em; }
.role-text { margin: 0; font-size: 0.8rem; color: #777; min-height: 1em; }
.menu-list { list-style: none; padding: 0; margin: 0; }
.menu-list li { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; cursor: pointer; color: #555; font-weight: 500; transition: all 0.2s; margin-bottom: 4px; }
.menu-list li:hover { background: #F3F4F6; color: #111; }
.menu-list li.active { background: #E0F2FE; color: #0B4C6F; font-weight: 600; }
.menu-icon { width: 20px; height: 20px; }
.dash-content { margin-left: 260px; padding: 30px; width: 100%; overflow-y: auto; }
</style>