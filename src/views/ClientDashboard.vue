<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const loading = ref(true);

// --- ESTADO ---
const user = ref({ 
  name: "Cliente", 
  avatar: "" 
});

const activeRequests = ref([]); 
const inspirationFeed = ref([]); 

// Control del Modal
const showIncompleteProfileModal = ref(false);

// --- NAVEGACIÓN ---
const goToExplore = () => router.push('/client/explore');

const goToProfile = () => {
  router.push('/client/profile');
};

const closeWarning = () => {
  showIncompleteProfileModal.value = false;
};

// --- AL CARGAR ---
onMounted(async () => {
  // 1. Recuperar datos de sesión
  const storedName = localStorage.getItem('usuario_nombre');
  const userId = localStorage.getItem('usuario_id');
  
  if (storedName) user.value.name = storedName;

  // 2. VERIFICACIÓN DE PERFIL (CANDADO)
  // Buscamos si ya guardó teléfono y dirección en el localStorage
  const userPhone = localStorage.getItem('usuario_telefono');
  const userAddress = localStorage.getItem('usuario_direccion');

  // Si falta alguno, mostramos el modal elegante con un pequeño retraso
  if (!userPhone || !userAddress) {
    setTimeout(() => {
      showIncompleteProfileModal.value = true;
    }, 800); 
  }

  // 3. CARGAR SOLICITUDES DEL BACKEND
  if (userId) {
    try {
      // Intentamos conectar con el servidor real
      const response = await axios.get(`http://localhost:3000/api/solicitudes/cliente/${userId}`);
      activeRequests.value = response.data;
    } catch (error) {
      console.log("No hay conexión con el servidor de solicitudes (Modo Offline o Error).");
    } finally {
      loading.value = false;
    }
  } else {
    loading.value = false;
  }
});
</script>

<template>
  <div class="client-content-wrapper">
    
    <div v-if="showIncompleteProfileModal" class="modal-overlay">
      <div class="modal-card animate-pop">
        
        <div class="icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="user-icon">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
          </svg>
          <span class="notification-dot">!</span>
        </div>

        <h3>Completa tu Perfil</h3>
        <p>Para conectar con los mejores profesionales, necesitamos validar tu <strong>teléfono</strong> y <strong>dirección</strong>.</p>
        
        <div class="modal-actions">
          <button class="btn-complete" @click="goToProfile">
            Completar ahora
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="arrow-icon"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" /></svg>
          </button>
          
          <button class="btn-later" @click="closeWarning">
            Hacerlo más tarde
          </button>
        </div>
        
        <div class="modal-footer-note">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="lock-icon"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" /></svg>
          No podrás publicar solicitudes hasta completar estos datos.
        </div>
      </div>
    </div>

    <main class="feed-content">
      
      <div class="welcome-banner">
        <h2>Hola, {{ user.name }}</h2>
        <p>¿Qué necesitas resolver hoy?</p>
      </div>

      <div class="ongoing-section">
        <h3 class="section-title" v-if="activeRequests.length > 0">Tus Solicitudes Activas</h3>

        <div v-if="activeRequests.length > 0" class="ongoing-list">
          <div v-for="req in activeRequests" :key="req.id" class="ongoing-card">
            <div class="card-left">
              <div class="status-indicator" :class="req.estado === 'completado' ? 'green' : 'orange'"></div>
              <div class="req-details">
                <h4>{{ req.title || req.titulo }}</h4>
                <span class="req-status">
                  {{ req.status || req.estado || 'Pendiente' }} • {{ new Date(req.fecha_creacion || Date.now()).toLocaleDateString() }}
                </span>
              </div>
            </div>
            
            <button class="btn-view-details" @click="router.push(`/client/request/edit/${req.id}`)">
              Ver Detalles
            </button>
          </div>
        </div>

        <div v-else class="empty-requests-box">
          <p>No tienes solicitudes activas en este momento.</p>
        </div>
      </div>

      <h3 class="section-title">Explora servicios cercanos</h3>
      
      <div v-if="inspirationFeed.length === 0" class="empty-state-container">
        <div class="empty-icon-svg">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ccc" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        </div>
        <h3>Encuentra al experto ideal</h3>
        <p>Desde plomería hasta tecnología, todo en un solo lugar.</p>
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
/* --- ESTILOS DEL MODAL (NUEVOS) --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(11, 76, 111, 0.45); /* Azul ServiHub con transparencia */
  backdrop-filter: blur(5px); /* Efecto cristal */
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}

.modal-card {
  background: white; 
  padding: 40px 30px; 
  border-radius: 24px; 
  width: 90%; max-width: 400px;
  text-align: center; 
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex; flex-direction: column; align-items: center;
}

.animate-pop { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* Ícono Circular */
.icon-container {
  position: relative;
  width: 72px; height: 72px;
  background: #E0F2FE; /* Fondo azul muy suave */
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
}
.user-icon { width: 36px; color: #0B4C6F; } /* Azul Marca */

/* Punto Naranja de Alerta */
.notification-dot {
  position: absolute; top: 0; right: 0;
  width: 24px; height: 24px;
  background: #F76B1C; /* Naranja Marca */
  color: white; font-weight: 800; font-size: 14px;
  border-radius: 50%; border: 3px solid white;
  display: flex; align-items: center; justify-content: center;
}

/* Tipografía Modal */
.modal-card h3 { 
  margin: 0 0 12px 0; 
  color: #1e293b; 
  font-size: 1.5rem; 
  font-weight: 800; 
}
.modal-card p { 
  color: #64748b; 
  margin-bottom: 32px; 
  line-height: 1.6; 
  font-size: 0.95rem;
}
.modal-card p strong { color: #0B4C6F; }

/* Botones Modal */
.modal-actions { width: 100%; display: flex; flex-direction: column; gap: 12px; }

.btn-complete {
  background: #0B4C6F; /* Azul Principal */
  color: white; 
  border: none; 
  padding: 14px; 
  border-radius: 12px; 
  font-weight: 700; font-size: 1rem;
  cursor: pointer; 
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px -1px rgba(11, 76, 111, 0.2);
}
.btn-complete:hover { 
  background: #093a55; 
  transform: translateY(-2px); 
  box-shadow: 0 10px 15px -3px rgba(11, 76, 111, 0.3);
}
.arrow-icon { width: 18px; }

.btn-later {
  background: transparent; border: none;
  padding: 10px; 
  font-weight: 600; font-size: 0.95rem;
  color: #94a3b8; 
  cursor: pointer;
  transition: color 0.2s;
}
.btn-later:hover { color: #64748b; }

/* Nota al pie con candado */
.modal-footer-note {
  margin-top: 24px;
  font-size: 0.75rem;
  color: #F76B1C; /* Texto naranja */
  background: #FFF7ED; /* Fondo naranja muy suave */
  padding: 8px 16px;
  border-radius: 20px;
  display: flex; align-items: center; gap: 6px;
  font-weight: 600;
}
.lock-icon { width: 12px; }

/* --- ESTILOS GENERALES DASHBOARD (YA EXISTENTES) --- */
.client-content-wrapper { display: flex; gap: 24px; width: 100%; padding-bottom: 40px; }
.feed-content { flex: 1; }
.sidebar-right { width: 300px; display: none; } 
@media (min-width: 1024px) { .sidebar-right { display: block; } }

/* Banner */
.welcome-banner { background: linear-gradient(135deg, #0B4C6F 0%, #083a55 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(11, 76, 111, 0.15); }
.welcome-banner h2 { margin: 0 0 5px 0; font-size: 1.8rem; font-weight: 700; }
.welcome-banner p { margin: 0; opacity: 0.9; font-size: 1.1rem; }

/* Listas */
.ongoing-section { margin-bottom: 40px; }
.section-title { font-size: 1.25rem; color: #333; margin-bottom: 15px; font-weight: 700; }
.ongoing-list { display: flex; flex-direction: column; gap: 15px; }
.ongoing-card { background: white; border: 1px solid #E0F2FE; border-left: 4px solid #F76B1C; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: transform 0.2s; }
.ongoing-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.08); }

.card-left { display: flex; align-items: center; gap: 15px; }
.status-indicator { width: 12px; height: 12px; border-radius: 50%; }
.status-indicator.orange { background-color: #F76B1C; box-shadow: 0 0 0 3px rgba(247, 107, 28, 0.2); }
.status-indicator.green { background-color: #22C55E; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2); }

.req-details h4 { margin: 0 0 4px 0; font-size: 1.1rem; color: #333; font-weight: 600; }
.req-status { font-size: 0.9rem; color: #666; text-transform: capitalize; }

.btn-view-details { background: white; border: 1px solid #ccc; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: 0.2s; color: #555; }
.btn-view-details:hover { border-color: #0B4C6F; color: #0B4C6F; background: #F0F9FF; }

.empty-requests-box { padding: 20px; background: #F8FAFC; border-radius: 8px; border: 1px dashed #CBD5E1; color: #64748B; text-align: center; }

/* Feed */
.empty-state-container { text-align: center; padding: 60px; background: white; border: 1px dashed #ccc; border-radius: 12px; }
.empty-icon-svg { width: 64px; height: 64px; margin: 0 auto 15px; }
.btn-outline { margin-top: 20px; padding: 12px 24px; border: 1px solid #0B4C6F; color: #0B4C6F; background: white; border-radius: 6px; cursor: pointer; font-weight: 700; transition: 0.2s; }
.btn-outline:hover { background: #F0F9FF; }

.info-card { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; }
.info-card h3 { font-size: 1.1rem; margin-top: 0; }
.text-muted { color: #888; font-size: 0.9rem; font-style: italic; }
</style>