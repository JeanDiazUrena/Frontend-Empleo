<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; 

const router = useRouter();

const currentUser = {
  name: "Wilson Montero",
  role: "Técnico Especialista",
  location: "Santiago, RD",
  avatar: "", 
  cover: null, // Si es null, sale el degradado por defecto
  stats: {
    views: 120,
    rating: 4.8
  }
};

// --- SIN DATOS FALSOS (Arrays vacíos para probar estado limpio) ---
const feedPosts = ref([]); 
const myClients = ref([]);

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
      <div class="nav-search">
        <input type="text" placeholder="Buscar...">
        <button class="search-btn">🔍</button>
      </div>
      <div class="nav-profile clickable" @click="goToProfile" title="Ir a mi perfil">
        <span class="nav-user-name">{{ currentUser.name }}</span>
        <img :src="currentUser.avatar" class="nav-avatar">
      </div>
    </nav>

    <div class="main-container">
      
      <aside class="sidebar-left">
        <ul class="menu-list">
          <li class="active" @click="goToDashboard"><span class="icon">🏠</span> Inicio</li>
          <li @click="goToChat"><span class="icon">💬</span> Mensajes</li>
          <li @click="goToProfile"><span class="icon">👤</span> Mi Perfil</li>
        </ul>
        <div class="action-area">
          <button class="btn-create-post" @click="goToCreatePost">+ Nuevo Trabajo</button>
        </div>
      </aside>

      <main class="feed-content">
        
        <div class="profile-header-card">
          <div class="cover-area" :class="{ 'no-cover': !currentUser.cover }"></div>
          
          <div class="profile-info-section">
            <div class="avatar-container">
              <img :src="currentUser.avatar" class="profile-avatar-lg">
            </div>
            <div class="text-container">
              <h1>{{ currentUser.name }}</h1>
              <p class="role-text">{{ currentUser.role }} • {{ currentUser.location }}</p>
              <div class="stats-badges">
                <span class="badge-gray">⭐ {{ currentUser.stats.rating }} Calificación</span>
                <span class="badge-gray">👁️ {{ currentUser.stats.views }} Visitas</span>
              </div>
            </div>
            <button class="btn-edit-small" @click="goToProfile">Ver Completo</button>
          </div>
        </div>
        <div v-if="feedPosts.length === 0" class="empty-feed-state">
          <div class="empty-icon">📭</div>
          <h3>Tu muro está tranquilo</h3>
          <p>Publica tu último trabajo para que los clientes te vean.</p>
          <button class="btn-ghost" @click="goToCreatePost">Crear publicación</button>
        </div>

        <div v-else v-for="post in feedPosts" :key="post.id" class="feed-card">
           </div>
      </main>

      <aside class="sidebar-right">
        <div class="chat-section">
          <h3 style="margin-bottom: 1rem;">Tus Clientes</h3>
          <div v-if="myClients.length === 0" class="empty-mini-state">
            <p>No tienes mensajes nuevos.</p>
          </div>
          <div v-else class="chat-list">
             </div>
        </div>
      </aside>

    </div>
  </div>
</template>

<style scoped>
.profile-header-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E5E7EB;
  margin-bottom: 1.5rem; /* Espacio antes del feed */
}

.cover-area {
  height: 150px; /* Un poco más bajo que en la página de perfil completa */
  background-color: #E5E7EB;
  background-size: cover;
  background-position: center;
}
.cover-area.no-cover {
  background: linear-gradient(to right, #0B4C6F, #2d89b5);
}

.profile-info-section {
  padding: 0 1.5rem 1.5rem;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.avatar-container {
  margin-top: -40px; /* Para subir la foto sobre la portada */
  margin-right: 1rem;
}

.profile-avatar-lg {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  background: white;
}

.text-container {
  flex: 1;
  padding-top: 0.5rem;
}

.text-container h1 { margin: 0; font-size: 1.3rem; color: #111; font-weight: 700; }
.role-text { margin: 2px 0 8px; color: #666; font-size: 0.9rem; }

.stats-badges {
  display: flex;
  gap: 10px;
}
.badge-gray {
  background: #F3F4F6;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: #555;
  font-weight: 500;
}

.btn-edit-small {
  padding: 6px 12px;
  border: 1px solid #E5E7EB;
  background: white;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  color: #555;
  transition: background 0.2s;
}
.btn-edit-small:hover { background-color: #F9FAFB; }
</style>