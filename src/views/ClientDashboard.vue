<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; 

const router = useRouter();

// Datos del Cliente
const user = {
  name: "Jean Luis",
  avatar: "https://i.pravatar.cc/150?u=jean", // Esto sí lo dejamos para que se vea tu foto
};

// --- CAMBIO 1: LISTA VACÍA ---
// Ya no hay datos falsos aquí. Esperamos a la base de datos.
const inspirationFeed = ref([]); 

// Navegación
const goToDashboard = () => router.push('/client-dashboard');
const goToExplore = () => router.push('/client-explore'); // <--- Nueva ruta que crearemos luego
const goToChat = () => router.push('/client-chat'); 
const goToProfile = () => router.push('/client-profile'); 

</script>

<template>
  <div class="dashboard-layout">
    
    <nav class="navbar">
       <div 
    class="nav-brand" 
    @click="router.push('/')" 
    style="color: #F76B1C; cursor: pointer;"
  >
    SERVIHUB
  </div>
      <div class="nav-search">
        <input @click="goToExplore" type="text" placeholder="¿Qué necesitas reparar hoy?" readonly style="cursor: pointer;">
        <button @click="goToExplore" class="search-btn">🔍</button>
      </div>
      <div class="nav-profile clickable" @click="goToProfile">
        <span class="nav-user-name">{{ user.name }}</span>
        <img :src="user.avatar" class="nav-avatar">
      </div>
    </nav>

    <div class="main-container">
      
      <aside class="sidebar-left">
        <ul class="menu-list">
          <li class="active" @click="goToDashboard"><span class="icon">🏠</span> Inicio</li>
          <li @click="goToExplore"><span class="icon">🔍</span> Explorar</li>
          <li @click="goToChat"><span class="icon">💬</span> Mensajes</li>
          <li @click="goToProfile"><span class="icon">👤</span> Mi Perfil</li>
        </ul>
        
        <div class="action-area">
         <button @click="router.push('/request-service')" class="btn-create-post" style="background-color: #0B4C6F;">+ Pedir Servicio</button>
        </div>
      </aside>

      <main class="feed-content">
        
        <div class="welcome-banner" style="background: linear-gradient(to right, #fff, #fff3e0);">
          <h2>Hola, {{ user.name }}</h2>
          <p>Bienvenido a ServiHub.</p>
        </div>

        <h3 class="section-title">Trabajos Recientes en tu Zona</h3>
        
        <div v-if="inspirationFeed.length === 0" class="empty-state-container">
          <div class="empty-icon">👷‍♂️</div>
          <h3>No se han encontrado profesionales aún</h3>
          <p>Actualmente no hay profesionales registrados en tu zona o la base de datos está vacía.</p>
          <button @click="goToExplore" class="btn-outline">Intentar buscar manualmente</button>
        </div>

        <div v-else v-for="post in inspirationFeed" :key="post.id" class="feed-card">
           </div>

      </main>

      <aside class="sidebar-right">
        <div class="chat-section">
          <h3>Profesionales Destacados</h3>
          <div class="empty-mini-state">
            <p>No hay destacados por ahora.</p>
          </div>
        </div>
      </aside>

    </div>
  </div>
</template>

<style scoped>
/* Estilos del Estado Vacío */
.empty-state-container {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  border: 1px dashed #ccc;
  margin-top: 1rem;
}
.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}
.empty-state-container h3 {
  color: #333;
  margin-bottom: 0.5rem;
}
.empty-state-container p {
  color: #666;
  margin-bottom: 1.5rem;
}
.btn-outline {
  padding: 10px 20px;
  border: 1px solid #0B4C6F;
  color: #0B4C6F;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.btn-outline:hover { background: #f0f9ff; }

/* Pequeño estilo para mensaje vacío lateral */
.empty-mini-state {
  padding: 1rem;
  text-align: center;
  color: #888;
  font-style: italic;
  font-size: 0.9rem;
}
</style>