<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; 

const router = useRouter();

const user = {
  name: "Jean Luis",
  avatar: "https://i.pravatar.cc/150?u=jean",
};

const searchQuery = ref('');
const selectedCategory = ref('');
const selectedLocation = ref('');
const professionals = ref([]); 

// Navegación
const goToDashboard = () => router.push('/client-dashboard');
const goToExplore = () => router.push('/client-explore');
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
      <div class="nav-profile clickable" @click="goToProfile">
        <span class="nav-user-name">{{ user.name }}</span>
        <img :src="user.avatar" class="nav-avatar">
      </div>
    </nav>

    <div class="main-container explore-mode">
      
      <aside class="sidebar-left">
        <ul class="menu-list">
          <li @click="goToDashboard"><span class="icon">🏠</span> Inicio</li>
          <li class="active" @click="goToExplore"><span class="icon">🔍</span> Explorar</li>
          <li @click="goToChat"><span class="icon">💬</span> Mensajes</li>
          <li @click="goToProfile"><span class="icon">👤</span> Mi Perfil</li>
        </ul>
        <div class="action-area">
          <button @click="router.push('/request-service')" class="btn-create-post" style="background-color: #0B4C6F;">+ Pedir Servicio</button>
        </div>
      </aside>

      <main class="feed-content full-width-content">
        
        <div class="explore-hero-full">
          <div class="hero-content">
            <h1>Encuentra al profesional ideal</h1>
            <p>Busca por nombre, servicio o especialidad.</p>
            
            <div class="big-search-bar">
              <span class="search-icon-lg">🔍</span>
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Ej: Plomero, Reparación de Aire, Limpieza..."
              >
              <button class="btn-search-main">Buscar</button>
            </div>

            <div class="filters-bar">
              <select v-model="selectedCategory" class="filter-select">
                <option value="">Todas las Categorías</option>
                <option value="hogar">Hogar</option>
                <option value="tecnologia">Tecnología</option>
                <option value="mecanica">Mecánica</option>
              </select>

              <select v-model="selectedLocation" class="filter-select">
                <option value="">Toda República Dominicana</option>
                <option value="santiago">Santiago</option>
                <option value="santodomingo">Santo Domingo</option>
              </select>
            </div>
          </div>
        </div>

        <div class="results-area-full">
          <h3 class="results-title">Resultados de búsqueda</h3>

          <div v-if="professionals.length === 0" class="empty-search-state-wide">
            <div class="empty-img">🕵️‍♀️</div>
            <h2>No hemos encontrado resultados</h2>
            <p>
              Todavía no hay profesionales registrados que coincidan con tu búsqueda 
              <strong>"{{ searchQuery }}"</strong>.
            </p>
          </div>
          <div v-else class="pros-mosaic-grid"></div>
        </div>

      </main>

    </div>
  </div>
</template>

<style scoped>
/* --- AQUÍ ESTÁ EL AJUSTE FINAL --- */

.explore-mode {
  display: block !important; 
  /* 1. Quitamos el límite de anchura para que se estire al 100% de la pantalla */
  max-width: 100% !important; 
  /* 2. Reducimos el padding derecho para aprovechar más espacio */
  padding-right: 1rem !important; 
}

.full-width-content {
  width: 100% !important;
  max-width: none !important;
}

/* --- ESTILOS VISUALES --- */
.explore-hero-full {
  background: linear-gradient(135deg, #0B4C6F 0%, #083a55 100%);
  width: 100%;
  padding: 5rem 2rem; 
  text-align: center;
  color: white;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.explore-hero-full h1 { font-size: 2.8rem; margin-bottom: 0.5rem; font-weight: 800; }
.explore-hero-full p { opacity: 0.9; margin-bottom: 2.5rem; font-size: 1.2rem; }

.big-search-bar {
  display: flex;
  align-items: center;
  background: white;
  border-radius: 60px;
  padding: 10px 10px 10px 30px;
  max-width: 1000px; /* Hice la barra un poco más ancha también */
  margin: 0 auto 2rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
}

.search-icon-lg { font-size: 1.5rem; margin-right: 15px; opacity: 0.5; color: #333; }
.big-search-bar input { border: none; background: transparent; flex: 1; font-size: 1.2rem; padding: 10px; outline: none; color: #333; }

.btn-search-main {
  background-color: #F76B1C;
  color: white;
  border: none;
  padding: 15px 45px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-search-main:hover { transform: scale(1.05); background-color: #e65a0b; }

.filters-bar { display: flex; justify-content: center; gap: 15px; flex-wrap: wrap; }
.filter-select {
  padding: 12px 25px;
  border-radius: 30px;
  border: 1px solid rgba(255,255,255,0.4);
  background: rgba(255,255,255,0.2);
  color: white;
  cursor: pointer;
  font-size: 1rem;
}
.filter-select option { color: #333; }

.results-area-full { width: 100%; padding: 0 1rem; }
.results-title { color: #333; margin-bottom: 1.5rem; font-size: 1.5rem; border-bottom: 2px solid #eee; padding-bottom: 10px; }

.empty-search-state-wide {
  text-align: center;
  padding: 6rem 2rem;
  background: white;
  border: 1px dashed #ccc;
  border-radius: 12px;
  width: 100%;
}
.empty-img { font-size: 5rem; margin-bottom: 1.5rem; }
.empty-search-state-wide h2 { color: #333; font-size: 2rem; margin-bottom: 1rem; }
</style>