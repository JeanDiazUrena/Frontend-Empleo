<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute(); 

// 1. ESTADO INICIAL VACÍO (Esperando datos del Backend)
const user = ref({
  name: "", 
  role: ""
});

// 2. CÁLCULO AUTOMÁTICO DE INICIALES (Ej: "Juan Perez" -> "JP")
const userInitials = computed(() => {
  if (!user.value.name) return ''; // Si no hay nombre, no muestra nada
  const parts = user.value.name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
});

// 3. AQUÍ SE CARGARÁN LOS DATOS REALES
onMounted(() => {
  // AQUI VA LA LOGICA DE CONEXION (AXIOS GET /api/me)
  
  // Por ahora, intentamos leer del localStorage si el Login guardó algo
  const storedName = localStorage.getItem('user_name');
  if (storedName) {
    user.value.name = storedName;
    user.value.role = "Profesional Verificado"; // O lo que traiga la BD
  }
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

      <div class="dash-right">
        <span class="user-name">{{ user.name }}</span>
        <div class="avatar-circle">
          {{ userInitials }}
        </div>
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
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100vw; 
  background-color: #F8F9FA;
  position: absolute; 
  top: 0;
  left: 0;
}

/* NAVBAR */
.dash-navbar {
  height: 70px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
}

.dash-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.brand-icon { height: 32px; width: auto; }
.brand-text { font-size: 20px; font-weight: 800; color: #333; }
.dot { color: #F76B1C; }

.dash-right { display: flex; align-items: center; gap: 12px; }
.avatar-circle { width: 36px; height: 36px; background: #0B4C6F; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; }

/* CUERPO DEL DASHBOARD */
.dash-body {
  display: flex;
  margin-top: 70px; 
  height: calc(100vh - 70px);
}

/* SIDEBAR */
.dash-sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid #e5e7eb;
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: fixed;
  left: 0;
  top: 70px;
  bottom: 0;
}

.mini-profile { display: flex; align-items: center; gap: 12px; padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px; cursor: pointer; }
.avatar-circle-lg { width: 48px; height: 48px; background: #0B4C6F; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 700; }
.info h4 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #333; min-height: 1.2em; } /* min-height evita saltos si está vacío */
.role-text { margin: 0; font-size: 0.8rem; color: #777; min-height: 1em; }

/* MENÚ */
.menu-list { list-style: none; padding: 0; margin: 0; }
.menu-list li { 
  display: flex; align-items: center; gap: 12px; 
  padding: 12px 16px; border-radius: 8px; 
  cursor: pointer; color: #555; font-weight: 500; 
  transition: all 0.2s; margin-bottom: 4px; 
}
.menu-list li:hover { background: #F3F4F6; color: #111; }
.menu-list li.active { background: #E0F2FE; color: #0B4C6F; font-weight: 600; }

/* ÍCONOS SVG */
.menu-icon { width: 20px; height: 20px; }

/* CONTENIDO PRINCIPAL */
.dash-content {
  margin-left: 260px; 
  padding: 30px;
  width: 100%;
  overflow-y: auto;
}
</style>