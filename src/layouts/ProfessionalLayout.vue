<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js';
import { normalizeMediaUrl } from '../utils/media.js';
import { EXPIRED_NOTIFICATION_MESSAGE, resolveNotificationTarget } from '../utils/smartNotifications.js';


const router = useRouter();
const route = useRoute(); 

// --- 1. ESTADO DEL USUARIO ---
const user = ref({
  name: "", 
  role: "",
  avatar: ""
});

// Variables para el Menú
const isMenuOpen = ref(false);
const menuRef = ref(null);
const unreadCount = ref(0);
let socket = null;

// --- NOTIFICACIONES ---
const notifications = ref([]);
const unreadNotifCount = ref(0);
const isNotifOpen = ref(false);
const notifRef = ref(null);
const notifNotice = ref({ show: false, message: '', type: 'info' });
const resolvingNotifId = ref(null);

let notifInterval = null;
let notifNoticeTimer = null;

const isRequestAborted = (error) => {
  return error?.code === 'ERR_CANCELED' || error?.message === 'Request aborted';
};

const hasValidToken = () => {
  const token = localStorage.getItem('token');
  return !!token && token !== 'dummy-token';
};

const fetchNotifications = async (targetUserId = state.user.id) => {
  const userId = targetUserId;
  if (!userId || !hasValidToken()) return;
  try {
    const { data } = await axios.get(`${API_URLS.NOTIFICACIONES}/notificaciones/${userId}`);
    notifications.value = data;
    unreadNotifCount.value = data.filter(n => !n.is_read).length;
  } catch (e) {
    if (!isRequestAborted(e) && e?.response?.status !== 403) console.error(e);
  }
};

const markAsRead = async (id) => {
  if (!hasValidToken()) return;
  try {
    await axios.put(`${API_URLS.NOTIFICACIONES}/notificaciones/${id}/read`);
    fetchNotifications();
  } catch (e) {
    if (!isRequestAborted(e) && e?.response?.status !== 403) console.error(e);
  }
};

const showNotifNotice = (message, type = 'info') => {
  if (notifNoticeTimer) clearTimeout(notifNoticeTimer);
  notifNotice.value = { show: true, message, type };
  notifNoticeTimer = setTimeout(() => {
    notifNotice.value.show = false;
  }, 3500);
};

const handleNotifClick = async (notif) => {
  if (resolvingNotifId.value) return;
  resolvingNotifId.value = notif.id;

  if (!notif.is_read) {
    await markAsRead(notif.id);
  }

  try {
    const target = await resolveNotificationTarget(notif, 'professional');

    if (target.expired) {
      const currentNotif = notifications.value.find((item) => item.id === notif.id) || notif;
      currentNotif._statusMessage = EXPIRED_NOTIFICATION_MESSAGE;
      currentNotif._statusType = 'expired';
      showNotifNotice(EXPIRED_NOTIFICATION_MESSAGE, 'warning');
      return;
    }

    isNotifOpen.value = false;
    if (target.to) router.push(target.to);
    else router.push(target);
  } catch (error) {
    const currentNotif = notifications.value.find((item) => item.id === notif.id) || notif;
    currentNotif._statusMessage = 'No se pudo abrir esta notificacion';
    currentNotif._statusType = 'expired';
    showNotifNotice('No se pudo abrir esta notificacion', 'warning');
  } finally {
    resolvingNotifId.value = null;
  }
};

const toggleNotif = () => {
  isNotifOpen.value = !isNotifOpen.value;
  if (isNotifOpen.value) {
    isMenuOpen.value = false;
  }
};

const fetchUnreadCount = async (targetUserId = state.user.id) => {
  const userId = targetUserId;
  if (!userId) return;
  try {
    const { data } = await axios.get(`${API_URLS.PERFILES}/api/chat/unread-count/${userId}`);
    unreadCount.value = data.count || 0;
  } catch (e) {
    if (!isRequestAborted(e)) console.error(e);
  }
};

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

const { state, switchAccount, logout, updateProfile } = useUserSession();

const handleLogout = () => {
  logout(state.user.id);
  router.push('/login');
};

const handleSwitch = (id) => {
  if (String(id) === String(state.user.id)) return;
  switchAccount(id);
  isMenuOpen.value = false;
  // Redirigir según el nuevo rol
  if (state.user.role === 'profesional') {
    router.push('/professional/dashboard');
  } else {
    router.push('/client/dashboard');
  }
};

const goToProfile = () => {
  isMenuOpen.value = false;
  router.push('/professional/settings');
};

const addAccount = () => {
  isMenuOpen.value = false;
  router.push('/login');
};

const syncUserFromSession = () => {
  user.value.name = state.user.name || localStorage.getItem('usuario_nombre') || localStorage.getItem('user_name') || 'Profesional';
  user.value.role = 'Profesional Verificado';
  user.value.avatar = normalizeMediaUrl(state.user?.avatar || localStorage.getItem('usuario_avatar') || localStorage.getItem('user_avatar') || '');
};

const resetLayoutRealtime = (userId) => {
  if (notifInterval) clearInterval(notifInterval);
  notifInterval = null;
  if (socket) socket.disconnect();
  socket = null;

  if (!userId) return;

  fetchUnreadCount(userId);
  fetchNotifications(userId);
  notifInterval = setInterval(() => fetchNotifications(userId), 15000);

  socket = io(SOCKET_URL, {
    query: { userId },
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5
  });

  socket.on('notification_new_message', (msg) => {
    if (String(state.user.id) === String(userId) && msg.remitente_id !== userId) {
      unreadCount.value++;
    }
  });

  socket.on('update_unread_count', (data) => {
    if (String(state.user.id) === String(userId) && data.usuarioId === userId) {
      fetchUnreadCount(userId);
    }
  });
};

// Cerrar al hacer clic fuera
const handleClickOutside = (event) => {
  if (menuRef.value && !menuRef.value.contains(event.target)) {
    isMenuOpen.value = false;
  }
  if (notifRef.value && !notifRef.value.contains(event.target)) {
    isNotifOpen.value = false;
  }
};

// --- 4. CICLO DE VIDA ---
onMounted(async () => {
  document.addEventListener('click', handleClickOutside);

  // Cargar nombre y avatar del localStorage inmediatamente
  const storedName = localStorage.getItem('usuario_nombre') || localStorage.getItem('user_name');
  const storedAvatar = normalizeMediaUrl(state.user?.avatar || localStorage.getItem('usuario_avatar') || localStorage.getItem('user_avatar') || '');
  if (storedName) {
    user.value.name = storedName;
    user.value.role = "Profesional Verificado";
    user.value.avatar = storedAvatar;
  }

  // Consultar la API para obtener la foto real aunque no haya pasado por el perfil aún
  const userId = localStorage.getItem('usuario_id');
  if (userId) {
    fetchUnreadCount();
    fetchNotifications();
    notifInterval = setInterval(fetchNotifications, 15000);
    
    // Freno de reconexión para evitar error 429
    socket = io(SOCKET_URL, { 
      query: { userId },
      reconnectionAttempts: 5,
      reconnectionDelay: 5000, 
      reconnectionDelayMax: 10000,
      randomizationFactor: 0.5
    });

    socket.on('notification_new_message', (msg) => {
      if (msg.remitente_id !== userId) {
        unreadCount.value++;
      }
    });

    socket.on('update_unread_count', (data) => {
      if (data.usuarioId === userId) {
        fetchUnreadCount();
      }
    });

    try {
      const res = await fetch(`${API_URLS.PERFILES}/api/profesionales/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (String(state.user.id) !== String(userId)) return;
        const avatar = normalizeMediaUrl(data?.avatar_url || '');
        user.value.avatar = avatar;
        avatar ? localStorage.setItem('usuario_avatar', avatar) : localStorage.removeItem('usuario_avatar');
        if (data?.nombre) {
          user.value.name = data.nombre;
          user.value.role = "Profesional Verificado";
        }
        updateProfile({
          name: data?.nombre || user.value.name,
          email: data?.email_publico || state.user.email,
          phone: data?.telefono || '',
          location: [data?.ciudad, data?.sector].filter(Boolean).join(', '),
          avatar
        });
      }
    } catch (_) { /* silencioso si la petición falla */ }
  }
});

watch(() => state.user.id, (userId, previousId) => {
  if (userId === previousId) return;
  isMenuOpen.value = false;
  isNotifOpen.value = false;
  notifications.value = [];
  unreadNotifCount.value = 0;
  unreadCount.value = 0;
  syncUserFromSession();
  resetLayoutRealtime(userId);
});

watch(() => [state.user.name, state.user.avatar], syncUserFromSession);

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  if (socket) socket.disconnect();
  if (notifInterval) clearInterval(notifInterval);
  if (notifNoticeTimer) clearTimeout(notifNoticeTimer);
});

// NAVEGACIÓN
const goTo = (path) => router.push(path);
const isActive = (path) => {
  if (path === 'profile') return route.name === 'ProfessionalProfile';
  return route.path.includes(`/${path}`);
};
</script>

<template>
  <div class="dashboard-layout-fullscreen">
    
    <nav class="dash-navbar">
      <div class="dash-brand" @click="goTo('/')">
        <img src="/fotos/logo-servihub.png" alt="ServiHub" class="brand-icon" />
        <span class="brand-text">ServiHub<span class="dot">.</span></span>
      </div>

      <div class="dash-right">
        
        <div class="notif-trigger" ref="notifRef" @click="toggleNotif">
          <svg xmlns="http://www.w3.org/2000/svg" class="bell-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span v-if="unreadNotifCount > 0" class="notif-badge-top">{{ unreadNotifCount }}</span>

          <transition name="fade">
            <div v-if="isNotifOpen" class="notif-menu" @click.stop>
              <div class="notif-header">
                <strong>Notificaciones</strong>
              </div>
              <div class="notif-body">
                <div v-if="notifNotice.show" class="notif-notice" :class="notifNotice.type">
                  {{ notifNotice.message }}
                </div>
                <div v-if="notifications.length === 0" class="no-notifs">
                  No tienes notificaciones
                </div>
                <div v-for="notif in notifications" :key="notif.id" class="notif-item" :class="{ unread: !notif.is_read, resolving: resolvingNotifId === notif.id }" @click="handleNotifClick(notif)">
                  <div class="notif-content">
                    <strong>{{ notif.title }}</strong>
                    <p>{{ notif.message }}</p>
                    <small v-if="resolvingNotifId === notif.id" class="notif-status">Revisando destino...</small>
                    <small v-if="notif._statusMessage" class="notif-status" :class="notif._statusType">{{ notif._statusMessage }}</small>
                    <small>{{ new Date(notif.created_at).toLocaleString() }}</small>
                  </div>
                  <div v-if="!notif.is_read" class="unread-dot"></div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <div class="user-trigger" ref="menuRef" @click="toggleMenu">
          <span class="user-name">{{ user.name }}</span>
          <div class="avatar-circle">
            <img v-if="user.avatar" :src="user.avatar" class="avatar-img" alt="foto" @error="user.avatar = ''" />
            <span v-else>{{ userInitials }}</span>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" class="arrow-icon" :class="{ 'rotate': isMenuOpen }" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
          </svg>
        </div>

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
                Configuración
              </li>
              
              <li @click="addAccount">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 20.25v.75a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75v-.75m-18 0A2.25 2.25 0 015.25 18h13.5A2.25 2.25 0 0121 20.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                Agregar Cuenta
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
    </nav>

    <div class="dash-body">
      
      <aside class="dash-sidebar">
        <div class="mini-profile" @click="goTo('/professional/profile')">
           <div class="avatar-circle-lg">
             <img
               v-if="user.avatar"
               :src="user.avatar"
               class="avatar-img"
               alt="foto de perfil"
               @error="user.avatar = ''"
             />
             <span v-else>{{ userInitials }}</span>
           </div>
           <div class="info">
             <h4>{{ user.name || 'Mi perfil' }}</h4>
             <p class="role-text">{{ user.role || 'Profesional' }}</p>
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
            <span style="flex: 1;">Mensajes</span>
            <span v-if="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
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
        <RouterView :key="`${state.user.id}:${route.fullPath}`" />
      </main>

      <!-- BOTTOM NAV PARA MÓVIL (PROFESIONAL) -->
      <nav class="bottom-nav">
        <div class="nav-item" :class="{ active: isActive('dashboard') }" @click="goTo('/professional/dashboard')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span>Tareas</span>
        </div>
        <div class="nav-item" :class="{ active: isActive('chat') }" @click="goTo('/professional/chat')" style="position: relative;">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span>Chat</span>
          <span v-if="unreadCount > 0" class="notif-badge-mobile">{{ unreadCount }}</span>
        </div>
        <div class="nav-item" :class="{ active: isActive('profile') }" @click="goTo('/professional/profile')">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span>Mi Perfil</span>
        </div>
        <div class="nav-item" @click="toggleMenu">
          <div class="avatar-circle" style="width: 24px; height: 24px;">
            <img v-if="user.avatar" :src="user.avatar" class="avatar-img" />
            <span v-else style="font-size: 0.6rem">{{ userInitials }}</span>
          </div>
          <span>Menú</span>
        </div>
      </nav>

    </div>
  </div>
</template>

<style scoped>
/* RESET & FULL WIDTH */
.dashboard-layout-fullscreen {
  display: flex; flex-direction: column; min-height: 100vh; width: 100%; max-width: 100vw; background-color: #F8F9FA; position: relative; overflow-x: hidden;
}

/* NAVBAR */
.dash-navbar {
  height: 70px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
}
.dash-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.brand-icon { height: 32px; width: auto; }
.brand-text { font-size: 20px; font-weight: 800; color: #333; }
.dot { color: #1E293B; }

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
  background: #334155; color: white; 
  border-radius: 50%; 
  display: flex; align-items: center; justify-content: center; 
  font-weight: bold; font-size: 0.9rem;
  overflow: hidden;
}
.avatar-circle .avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.arrow-icon { width: 16px; color: #64748b; transition: transform 0.2s; }
.rotate { transform: rotate(180deg); }

/* MENU DESPLEGABLE */
.dropdown-menu { 
  position: absolute; top: 60px; right: 0; 
  width: 220px; background: white; 
  border-radius: 12px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.15); 
  border: 1px solid #e2e8f0; 
  overflow: hidden; z-index: 1100; 
}
.dropdown-menu ul { list-style: none; padding: 5px; margin: 0; }
.dropdown-menu li { 
  display: flex; align-items: center; gap: 10px; 
  padding: 12px 16px; font-size: 0.9rem; color: #4b5563; 
  cursor: pointer; transition: all 0.2s; 
}
.dropdown-menu li:hover { background-color: #F8FAFC; color: #1E293B; }
.dropdown-menu li svg { width: 18px; height: 18px; color: #94a3b8; transition: color 0.2s; }
.dropdown-menu li:hover svg { color: #1E293B; }

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


/* ANIMACIÓN */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

/* NOTIFICACIONES */
.notif-trigger { position: relative; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; transition: background 0.2s; margin-right: 10px; }
.notif-trigger:hover { background-color: #f3f4f6; }
.bell-icon { width: 22px; height: 22px; color: #4b5563; }
.notif-badge-top { position: absolute; top: -2px; right: -2px; background: #ef4444; color: white; font-size: 0.65rem; font-weight: bold; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2px solid white; }
.notif-menu { position: absolute; top: 60px; right: -10px; width: 320px; background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); border: 1px solid #e2e8f0; overflow: hidden; z-index: 1100; cursor: default; }
.notif-header { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.notif-body { max-height: 300px; overflow-y: auto; }
.no-notifs { padding: 20px; text-align: center; color: #94a3b8; font-size: 0.9rem; }
.notif-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.2s; }
.notif-item:hover { background: #f8fafc; }
.notif-item.unread { background: #eff6ff; }
.notif-item.resolving { opacity: 0.72; pointer-events: none; }
.notif-notice { margin: 10px 12px 0; padding: 9px 10px; border-radius: 8px; font-size: 0.78rem; font-weight: 700; }
.notif-notice.warning { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
.notif-content strong { display: block; font-size: 0.9rem; color: #1e293b; margin-bottom: 2px; }
.notif-content p { margin: 0 0 4px 0; font-size: 0.8rem; color: #64748b; line-height: 1.3; }
.notif-content small { display: block; font-size: 0.7rem; color: #94a3b8; }
.notif-status { margin-bottom: 4px; color: #0b4c6f !important; font-weight: 800; }
.notif-status.expired { color: #b45309 !important; }
.unread-dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; flex-shrink: 0; }

/* --- RESTO DEL DASHBOARD (Sidebar, etc) --- */
.dash-body { display: flex; margin-top: 70px; height: calc(100vh - 70px); width: 100%; overflow-x: hidden; }
.dash-sidebar { width: 260px; background: white; border-right: 1px solid #e5e7eb; padding: 24px; display: flex; flex-direction: column; height: 100%; position: fixed; left: 0; top: 70px; bottom: 0; }
.mini-profile { display: flex; align-items: center; gap: 12px; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; cursor: pointer; }
.mini-profile {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 8px 20px;
  border-bottom: 1px solid #F1F5F9;
  margin-bottom: 20px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}
.mini-profile:hover { background: #F8FAFC; }
.avatar-circle-lg {
  width: 52px; height: 52px;
  background: #1E293B; color: white;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.15rem; font-weight: 700;
  overflow: hidden; flex-shrink: 0;
  border: 2px solid #E2E8F0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.avatar-circle-lg .avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block; }
.info h4 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #1E293B; min-height: 1.2em; }
.role-text { margin: 0; font-size: 0.8rem; color: #94A3B8; min-height: 1em; }
.menu-list { list-style: none; padding: 0; margin: 0; }
.menu-list li { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; cursor: pointer; color: #555; font-weight: 500; transition: all 0.2s; margin-bottom: 4px; }
.menu-list li:hover { background: #F1F5F9; color: #1E293B; }
.menu-list li.active { background: #E2E8F0; color: #1E293B; font-weight: 600; }
.menu-icon { width: 20px; height: 20px; }
.dash-content { margin-left: 260px; padding: 30px; width: 100%; overflow-y: auto; }

/* === RESPONSIVE TOOLS === */
.bottom-nav { display: none; }

@media (max-width: 900px) {
  .dash-navbar { padding: 0 16px; }
  .user-name { display: none; }
}

@media (max-width: 768px) {
  .dash-sidebar { display: none; }
  .dash-content { margin-left: 0; padding: 20px; padding-bottom: 90px; }

  .bottom-nav {
    display: flex; justify-content: space-around; align-items: center;
    position: fixed; bottom: 0; left: 0; right: 0;
    height: 65px; background: white;
    border-top: 1px solid #e5e7eb; z-index: 100;
  }
  .nav-item {
    display: flex; flex-direction: column; align-items: center;
    gap: 4px; color: #64748b; cursor: pointer; flex: 1;
  }
  .nav-item svg { width: 22px; height: 22px; }
  .nav-item span { font-size: 0.7rem; font-weight: 600; }
  .nav-item.active { color: #1E293B; }
}

.notif-badge {
  background: #2563EB; color: white;
  font-size: 0.75rem; font-weight: 700;
  padding: 2px 0; border-radius: 50%;
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  margin-left: auto;
}
.notif-badge-mobile {
  position: absolute; top: 5px; right: 25%;
  background: #2563EB; color: white;
  font-size: 0.65rem; font-weight: 800;
  padding: 1px 6px; border-radius: 10px;
  border: 2px solid white;
}
</style>
