<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; // Reusamos el mismo CSS para coherencia

const router = useRouter();

// Datos del Cliente (Simulado)
const currentUser = {
  name: "Jean Luis",
  avatar: "https://i.pravatar.cc/150?u=jean", // Avatar de cliente
};

// Categorías para acceso rápido
const categories = [
  { id: 1, name: 'Hogar', icon: '🏠' },
  { id: 2, name: 'Tecnología', icon: '💻' },
  { id: 3, name: 'Mecánica', icon: '🔧' },
  { id: 4, name: 'Limpieza', icon: '🧹' },
  { id: 5, name: 'Educación', icon: '📚' },
];

// Feed de Inspiración (Trabajos de profesionales)
const inspirationFeed = ref([
  {
    id: 101,
    proName: "ElectroFast",
    proAvatar: "https://i.pravatar.cc/150?img=12",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    title: "Instalación de Panel Eléctrico",
    location: "Santiago",
    rating: 4.9
  },
  {
    id: 102,
    proName: "Jardines Verdes",
    proAvatar: "https://i.pravatar.cc/150?img=20",
    image: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=600&q=80",
    title: "Mantenimiento de Jardín",
    location: "La Vega",
    rating: 5.0
  }
]);

// Navegación
const goToDashboard = () => router.push('/client-dashboard');
const goToChat = () => router.push('/client-chat'); // Futuro
const goToProfile = () => router.push('/client-profile'); // Futuro

</script>

<template>
  <div class="dashboard-layout">
    
    <nav class="navbar">
      <div class="nav-brand" style="color: #F76B1C;">SERVIHUB</div> <div class="nav-search">
        <input type="text" placeholder="¿Qué necesitas reparar hoy?">
        <button class="search-btn">🔍</button>
      </div>
      <div class="nav-profile">
        <span class="nav-user-name">{{ currentUser.name }}</span>
        <img :src="currentUser.avatar" class="nav-avatar">
      </div>
    </nav>

    <div class="main-container">
      
      <aside class="sidebar-left">
  <ul class="menu-list">
    <li class="active" @click="goToDashboard">
      <span class="icon">🏠</span> Inicio
    </li>
    <li>
      <span class="icon">🔍</span> Explorar
    </li>
    <li @click="goToChat">
  <span class="icon">💬</span> Mensajes
</li>
    <li @click="goToProfile"> <span class="icon">👤</span> Mi Perfil
    </li>
  </ul>
  
  <div class="action-area">
    <button class="btn-create-post" style="background-color: #0B4C6F;">
      + Pedir Servicio
    </button>
  </div>
</aside>

      <main class="feed-content">
        
        <div class="welcome-banner" style="background: linear-gradient(to right, #fff, #fff3e0);">
          <h2>Hola, {{ currentUser.name }}</h2>
          <p>Encuentra al experto ideal para tu proyecto.</p>
          
          <div class="categories-grid">
            <div v-for="cat in categories" :key="cat.id" class="category-pill">
              <span>{{ cat.icon }}</span> {{ cat.name }}
            </div>
          </div>
        </div>

        <h3 class="section-title">Trabajos Recientes en tu Zona</h3>
        
        <div v-for="post in inspirationFeed" :key="post.id" class="feed-card">
          <div class="card-header">
            <img :src="post.proAvatar" class="post-avatar">
            <div class="post-info">
              <h4>{{ post.proName }}</h4>
              <span class="post-meta">{{ post.location }} • ⭐ {{ post.rating }}</span>
            </div>
            <button class="btn-small-contact">Contactar</button>
          </div>
          
          <div class="card-body">
            <p style="font-weight: 500; margin-bottom: 5px;">{{ post.title }}</p>
            <div class="post-image-container">
              <img :src="post.image" alt="Trabajo">
            </div>
          </div>
        </div>

      </main>

      <aside class="sidebar-right">
        <div class="chat-section">
          <h3>Profesionales Destacados</h3>
          <div class="chat-list">
            <div class="chat-item">
              <img src="https://i.pravatar.cc/150?img=60" class="chat-avatar">
              <div class="chat-details">
                <span class="chat-name">Juan Plomero</span>
                <span class="chat-role">⭐ 4.9</span>
              </div>
            </div>
             <div class="chat-item">
              <img src="https://i.pravatar.cc/150?img=32" class="chat-avatar">
              <div class="chat-details">
                <span class="chat-name">Ana Limpieza</span>
                <span class="chat-role">⭐ 5.0</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos para el Dashboard de Cliente */

.categories-grid {
  display: flex;
  gap: 10px;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.category-pill {
  background: white;
  border: 1px solid #E5E7EB;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.category-pill:hover {
  border-color: #F76B1C;
  color: #F76B1C;
  transform: translateY(-2px);
}

.section-title {
  font-size: 1.1rem;
  color: #666;
  margin: 1rem 0 0.5rem;
  font-weight: 600;
}

.btn-small-contact {
  margin-left: auto; /* Empuja el botón a la derecha */
  padding: 6px 12px;
  background-color: #E0F2FE;
  color: #0B4C6F;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
}
.btn-small-contact:hover {
  background-color: #BAE6FD;
}
</style>