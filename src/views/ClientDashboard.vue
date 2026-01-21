<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// --- DATOS (Listos para conectar a BD) ---
const user = ref({ name: "Jean Luis", avatar: "" }); 

// SOLICITUDES EN CURSO (ON GOING REQUESTS)
// Cuando el usuario cree una solicitud, la BD la devolverá aquí.
const activeRequests = ref([
  // EJEMPLO DE CÓMO SE VERÁ (Descomenta para probar visualmente):
  
  {
    id: 1,
    title: "Reparación de Aire Acondicionado",
    status: "Buscando Profesional", // O "En Camino", "En Proceso"
    date: "Hace 2 horas",
    icon: "❄️" 
  }
  
]);

const inspirationFeed = ref([]); 

const goToExplore = () => router.push('/client/explore');
</script>

<template>
  <div class="client-content-wrapper">
    
    <main class="feed-content">
      
      <div class="welcome-banner">
        <h2>Hola, {{ user.name }}</h2>
        <p>¿Qué necesitas resolver hoy?</p>
      </div>

     <div v-for="req in activeRequests" :key="req.id" class="ongoing-card">
  <div class="card-left">
    <div class="status-indicator"></div>
    <div class="req-details">
      <h4>{{ req.title }}</h4>
      <span class="req-status">{{ req.status }} • {{ req.date }}</span>
    </div>
  </div>
  
  <button class="btn-view-details" @click="router.push(`/client/request/edit/${req.id}`)">
    Editar / Ver
  </button>
</div>

      <h3 class="section-title">Trabajos Recientes en tu Zona</h3>
      
      <div v-if="inspirationFeed.length === 0" class="empty-state-container">
        <div class="empty-icon-svg">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ccc" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        </div>
        <h3>Explora servicios cercanos</h3>
        <p>Encuentra al experto ideal para tu próximo proyecto.</p>
        <button @click="goToExplore" class="btn-outline">Buscar Profesionales</button>
      </div>

    </main>

    <aside class="sidebar-right">
      <div class="info-card">
        <h3>Profesionales Destacados</h3>
        <p class="text-muted">Pronto verás recomendaciones aquí.</p>
      </div>
    </aside>

  </div>
</template>

<style scoped>
.client-content-wrapper { display: flex; gap: 24px; width: 100%; padding-bottom: 40px; }
.feed-content { flex: 1; }
.sidebar-right { width: 300px; display: none; } /* Oculto en móvil */
@media (min-width: 1024px) { .sidebar-right { display: block; } }

/* BANNER */
.welcome-banner { background: linear-gradient(135deg, #0B4C6F 0%, #083a55 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(11, 76, 111, 0.15); }
.welcome-banner h2 { margin: 0 0 5px 0; font-size: 1.8rem; font-weight: 700; }
.welcome-banner p { margin: 0; opacity: 0.9; font-size: 1.1rem; }

/* ON GOING REQUESTS (NUEVO) */
.ongoing-section { margin-bottom: 30px; }
.ongoing-list { display: flex; flex-direction: column; gap: 15px; }
.ongoing-card { background: white; border: 1px solid #E0F2FE; border-left: 4px solid #F76B1C; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.card-left { display: flex; align-items: center; gap: 15px; }
.status-indicator { width: 10px; height: 10px; background-color: #22C55E; border-radius: 50%; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2); }
.req-details h4 { margin: 0 0 4px 0; font-size: 1.1rem; color: #333; }
.req-status { font-size: 0.9rem; color: #666; font-weight: 500; }
.btn-view-details { background: white; border: 1px solid #ccc; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: 0.2s; }
.btn-view-details:hover { border-color: #0B4C6F; color: #0B4C6F; }

/* FEED GENÉRICO */
.section-title { font-size: 1.25rem; color: #333; margin-bottom: 20px; font-weight: 700; }
.empty-state-container { text-align: center; padding: 60px; background: white; border: 1px dashed #ccc; border-radius: 12px; }
.empty-icon-svg { width: 64px; height: 64px; margin: 0 auto 15px; }
.btn-outline { margin-top: 20px; padding: 12px 24px; border: 1px solid #0B4C6F; color: #0B4C6F; background: white; border-radius: 6px; cursor: pointer; font-weight: 700; transition: 0.2s; }
.btn-outline:hover { background: #F0F9FF; }

/* RIGHT SIDEBAR */
.info-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
.info-card h3 { font-size: 1.1rem; margin-top: 0; }
.text-muted { color: #888; font-size: 0.9rem; font-style: italic; }
</style>