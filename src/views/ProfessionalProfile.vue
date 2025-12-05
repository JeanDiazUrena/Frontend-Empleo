<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; 
// Reutilizamos estilos del Dashboard, pero añadiremos unos pocos específicos para el perfil abajo en un <style scoped> o archivo nuevo si prefieres.

const router = useRouter();

// Datos del Usuario (Lo que llenaste en el setup)
const user = {
  name: "Wilson Montero",
  role: "Técnico Especialista",
  location: "Santiago, RD",
  avatar: "https://i.pravatar.cc/150?u=wilson",
  // Si no hay portada, usamos un color o patrón por defecto
  cover: null, 
};

const activeTab = ref('muro');
const myPosts = ref([]); // Muro vacío al inicio

// Navegación
const goToDashboard = () => router.push('/professional-dashboard');
const goToChat = () => router.push('/chat');
const goToProfile = () => router.push('/profile');
const goToCreatePost = () => router.push('/create-first-post');

</script>

<template>
  <div class="dashboard-layout">
    
    <nav class="navbar">
      <div class="nav-brand">SERVIHUB <span class="pro-badge">PRO</span></div>
      <div class="nav-profile"><img :src="user.avatar" class="nav-avatar"></div>
    </nav>

    <div class="main-container">
      
      <aside class="sidebar-left">
        <ul class="menu-list">
          <li @click="goToDashboard"><span class="icon">🏠</span> Inicio</li>
          <li @click="goToChat"><span class="icon">💬</span> Mensajes</li>
          <li class="active" @click="goToProfile"><span class="icon">👤</span> Mi Perfil</li>
        </ul>
        <div class="action-area">
          <button class="btn-create-post" @click="goToCreatePost">+ Nuevo Trabajo</button>
        </div>
      </aside>

      <main class="feed-content">
        
        <div class="profile-header-card">
          <div class="cover-area" :class="{ 'no-cover': !user.cover }"></div>
          
          <div class="profile-info-section">
            <div class="avatar-container">
              <img :src="user.avatar" class="profile-avatar-lg">
            </div>
            <div class="text-container">
              <h1>{{ user.name }}</h1>
              <p class="role-text">{{ user.role }} • {{ user.location }}</p>
              <div class="stats-text">
                <span><strong>0</strong> Seguidores</span> • 
                <span><strong>0</strong> Reseñas</span>
              </div>
            </div>
            <button class="btn-edit-profile">Editar Perfil</button>
          </div>

          <div class="profile-tabs">
            <div class="tab" :class="{ active: activeTab === 'muro' }" @click="activeTab = 'muro'">Muro</div>
            <div class="tab" :class="{ active: activeTab === 'servicios' }" @click="activeTab = 'servicios'">Servicios</div>
            <div class="tab" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">Información</div>
          </div>
        </div>

        <div class="tab-content-area">
          
          <div v-if="activeTab === 'muro'">
            <div v-if="myPosts.length === 0" class="empty-state-box">
              <div class="icon-placeholder">📷</div>
              <h3>Tu portafolio está vacío</h3>
              <p>Sube fotos de tus trabajos para que los clientes vean tu calidad.</p>
              <button class="btn-outline" @click="goToCreatePost">Subir primer trabajo</button>
            </div>
          </div>

          <div v-if="activeTab === 'servicios'">
            <div class="empty-state-box">
              <h3>No has agregado servicios</h3>
              <p>Define qué ofreces y cuánto cobras (aprox).</p>
              <button class="btn-outline">Agregar Servicio</button>
            </div>
          </div>

        </div>

      </main>

      <aside class="sidebar-right">
        <div class="chat-section">
          <h3>Tu Progreso</h3>
          <div style="padding: 1rem; color: #666; font-size: 0.9rem;">
            Completa tu perfil para alcanzar el 100%.
            <div style="background: #eee; height: 8px; border-radius: 4px; margin-top: 5px;">
              <div style="background: #F76B1C; width: 40%; height: 100%; border-radius: 4px;"></div>
            </div>
          </div>
        </div>
      </aside>

    </div>
  </div>
</template>

<style scoped>
/* Estilos Específicos para el Perfil (Scoped para no romper lo demás) */

.profile-header-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E5E7EB;
}

.cover-area {
  height: 180px;
  background-color: #E5E7EB;
}
.cover-area.no-cover {
  background: linear-gradient(to right, #0B4C6F, #1e6b94);
}

.profile-info-section {
  padding: 0 1.5rem 1.5rem;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.avatar-container {
  margin-top: -50px;
  margin-right: 1.5rem;
}

.profile-avatar-lg {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
}

.text-container {
  flex: 1;
  padding-top: 10px;
}

.text-container h1 { margin: 0; font-size: 1.5rem; color: #111; }
.role-text { margin: 2px 0; color: #666; font-size: 0.95rem; }
.stats-text { font-size: 0.85rem; color: #555; margin-top: 5px;}

.btn-edit-profile {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

/* Tabs */
.profile-tabs {
  display: flex;
  border-top: 1px solid #eee;
  margin-top: 1rem;
}
.tab {
  padding: 1rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  border-bottom: 3px solid transparent;
}
.tab.active {
  color: #0B4C6F;
  border-bottom-color: #0B4C6F;
}

/* Empty States dentro del perfil */
.empty-state-box {
  background: white;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  padding: 3rem;
  text-align: center;
  margin-top: 1rem;
}
.icon-placeholder { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; }
.btn-outline {
  margin-top: 1rem;
  padding: 8px 16px;
  border: 1px solid #F76B1C;
  color: #F76B1C;
  background: white;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
</style>