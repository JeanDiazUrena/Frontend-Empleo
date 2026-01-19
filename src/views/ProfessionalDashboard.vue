<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; 

const router = useRouter();

// Usuario Actual (Profesional)
const currentUser = {
  name: "Wilson Montero",
  role: "Técnico Especialista",
  location: "Santiago, RD",
  avatar: "", // Dejamos esto vacío como pediste
};

// --- LISTA DE SOLICITUDES DE CLIENTES (VACÍA POR AHORA) ---
// Aquí llegarán los trabajos que publiquen los clientes
const jobRequests = ref([]); 

// Navegación
// Asegúrate de que las funciones de navegación se vean así:
// En tu script setup:
const goToDashboard = () => router.push('/professional-dashboard');
const goToChat = () => router.push('/professional-chat'); // <--- CORREGIDO
const goToProfile = () => router.push('/professional-profile'); // <--- CORREGIDO

</script>

<template>
  <div class="dashboard-layout">
    
    <nav class="navbar">
      <div class="nav-brand" @click="goToDashboard" style="cursor: pointer;">
        SERVIHUB <span class="pro-badge">PRO</span>
      </div>
      
      <div class="nav-search">
        <input type="text" placeholder="Buscar trabajos..." readonly>
        <button class="search-btn">🔍</button>
      </div>

      <div class="nav-profile clickable" @click="goToProfile">
        <span class="nav-user-name">{{ currentUser.name }}</span>
        <div class="avatar-placeholder-sm"></div>
      </div>
    </nav>

    <div class="custom-container">
      
      <aside class="sidebar-left">
        <div class="mini-profile-card" @click="goToProfile">
          <div class="avatar-placeholder-md"></div>
          <div class="mini-profile-info">
            <h4>{{ currentUser.name }}</h4>
            <p>{{ currentUser.role }}</p>
          </div>
        </div>

        <ul class="menu-list">
          <li class="active" @click="goToDashboard"><span class="icon">📋</span> Solicitudes</li>
          <li @click="goToChat"><span class="icon">💬</span> Mensajes</li>
          <li @click="goToProfile"><span class="icon">👤</span> Mi Perfil</li>
        </ul>
        
        <div class="action-area">
          <button class="btn-create-post" @click="goToProfile">Ver mi Portafolio</button>
        </div>
      </aside>

      <main class="custom-content">
        
        <header class="section-header">
          <h2>Oportunidades de Trabajo</h2>
          <p>Encuentra clientes que necesitan tus servicios hoy.</p>
        </header>

        <div v-if="jobRequests.length === 0" class="empty-jobs-state">
          <div class="empty-icon">📭</div>
          <h3>No hay trabajos disponibles por ahora</h3>
          <p>
            Actualmente no hay solicitudes de clientes en tu zona o categoría.
            ¡Mantente atento, las oportunidades llegarán pronto!
          </p>
          <button class="btn-refresh" @click="goToDashboard">🔄 Actualizar lista</button>
        </div>

        <div v-else class="jobs-list">
          <div v-for="job in jobRequests" :key="job.id" class="job-card">
            <div class="job-header">
               <span class="job-category">{{ job.category }}</span>
               <span class="job-date">{{ job.date }}</span>
             </div>
             <h3>{{ job.title }}</h3>
             <p>{{ job.description }}</p>
             <div class="job-footer">
               <span class="job-location">📍 {{ job.location }}</span>
               <button class="btn-apply">Contactar Cliente</button>
             </div>
          </div>
        </div>

      </main>

    </div>
  </div>
</template>

<style scoped>
/* --- ESTRUCTURA PERSONALIZADA (Igual que en Cliente) --- */
.custom-container {
  margin-left: 260px;
  padding: 2rem;
  display: block; /* Rompemos el grid por defecto */
  min-height: 100vh;
  background-color: #F8F9FA;
}

.custom-content {
  width: 100%;
  max-width: 900px; /* Ancho cómodo para leer trabajos */
  margin: 0 auto;
}

/* --- ESTILOS VISUALES --- */
.section-header {
  margin-bottom: 2rem;
}
.section-header h2 { margin: 0 0 5px 0; color: #111; font-size: 1.8rem; }
.section-header p { margin: 0; color: #666; }

/* Estado Vacío */
.empty-jobs-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  border: 1px dashed #ccc;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.empty-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.6; }
.empty-jobs-state h3 { color: #333; margin-bottom: 0.5rem; }
.empty-jobs-state p { color: #666; max-width: 400px; margin: 0 auto 1.5rem auto; }

.btn-refresh {
  background: white;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  color: #0B4C6F;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-refresh:hover { background: #f0f9ff; border-color: #0B4C6F; }

/* Placeholders de Avatar */
.avatar-placeholder-sm { width: 32px; height: 32px; background: #ddd; border-radius: 50%; }
.avatar-placeholder-md { width: 48px; height: 48px; background: #ddd; border-radius: 50%; margin-right: 10px; }

.mini-profile-card { display: flex; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; margin-bottom: 1rem; cursor: pointer; }
.mini-profile-info h4 { margin: 0; font-size: 0.9rem; }
.mini-profile-info p { margin: 0; font-size: 0.8rem; color: #666; }

/* Badge PRO */
.pro-badge { background: #0B4C6F; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; vertical-align: middle; margin-left: 5px; }
</style>