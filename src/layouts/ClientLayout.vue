<script setup>
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute(); 

// DATOS VACÍOS (Esperando BD)
const user = {
  name: "", // Se llenará al iniciar sesión
  avatar: "" 
};

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
        <span v-if="user.name" class="user-name">{{ user.name }}</span>
        <div class="avatar-circle">
          {{ user.name ? user.name.charAt(0) : '?' }}
        </div>
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
/* REUSAMOS LOS ESTILOS LIMPIOS DEL PROFESIONAL */
.dashboard-layout-fullscreen { display: flex; flex-direction: column; min-height: 100vh; width: 100vw; background-color: #F8F9FA; position: absolute; top: 0; left: 0; }

.dash-navbar { height: 70px; background: white; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 0 30px; position: fixed; top: 0; left: 0; right: 0; z-index: 50; }
.dash-brand { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.brand-icon { height: 32px; width: auto; }
.brand-text { font-size: 20px; font-weight: 800; color: #333; }
.dot { color: #F76B1C; }

.dash-right { display: flex; align-items: center; gap: 12px; }
.avatar-circle { width: 36px; height: 36px; background: #0B4C6F; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }

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