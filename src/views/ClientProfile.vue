<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; // Reusamos los estilos base

const router = useRouter();

// Datos del Cliente
const user = {
  name: "Jean Luis",
  email: "jean@gmail.com",
  location: "Santiago, RD",
  avatar: "https://i.pravatar.cc/150?u=jean", // Avatar de cliente
  joined: "Diciembre 2025"
};

// Navegación (Igual que en el Dashboard)
const goToDashboard = () => router.push('/client-dashboard');
// const goToChat = () => router.push('/client-chat'); // (Cuando crees el chat de cliente)
const goToProfile = () => router.push('/client-profile'); 

</script>

<template>
  <div class="dashboard-layout">
    
    <nav class="navbar">
      <div class="nav-brand" style="color: #F76B1C;">SERVIHUB</div>
      <div class="nav-profile"><img :src="user.avatar" class="nav-avatar"></div>
    </nav>

    <div class="main-container">
      
      <aside class="sidebar-left">
        <ul class="menu-list">
          <li @click="goToDashboard"><span class="icon">🏠</span> Inicio</li>
          <li><span class="icon">🔍</span> Explorar</li>
          <li><span class="icon">💬</span> Mensajes</li>
          <li class="active" @click="goToProfile"><span class="icon">👤</span> Mi Perfil</li>
        </ul>
        <div class="action-area">
          <button class="btn-create-post" style="background-color: #0B4C6F;">
            + Pedir Servicio
          </button>
        </div>
      </aside>

      <main class="feed-content">
        
        <div class="profile-card-simple">
          <div class="profile-header-bg"></div>
          <div class="profile-body">
            <img :src="user.avatar" class="profile-avatar-xl">
            <h2>{{ user.name }}</h2>
            <p class="user-meta">{{ user.location }} • Miembro desde {{ user.joined }}</p>
            <p class="user-email">{{ user.email }}</p>
            
            <button class="btn-outline">Editar Datos</button>
          </div>
        </div>

        <div class="feed-card" style="padding: 2rem; text-align: center; color: #666;">
          <h3>Historial de Pedidos</h3>
          <p>Aún no has solicitado ningún servicio.</p>
        </div>

      </main>

    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos para esta vista simple */
.profile-card-simple {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #E5E7EB;
  text-align: center;
  margin-bottom: 1.5rem;
}

.profile-header-bg {
  height: 120px;
  background: linear-gradient(to right, #F76B1C, #ffb74d); /* Naranja cliente */
}

.profile-body {
  padding: 0 2rem 2rem;
  margin-top: -60px; /* Subir avatar */
}

.profile-avatar-xl {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 4px solid white;
  object-fit: cover;
  margin-bottom: 1rem;
}

h2 { margin: 0; color: #111; }
.user-meta { color: #666; font-size: 0.9rem; margin: 5px 0; }
.user-email { color: #888; font-size: 0.9rem; margin-bottom: 1.5rem; }

.btn-outline {
  padding: 8px 20px;
  border: 1px solid #E5E7EB;
  background: white;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  color: #333;
}
.btn-outline:hover { background-color: #F9FAFB; }
</style>