<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js'; // 1. IMPORTAR CEREBRO

const router = useRouter();
const { state, updateProfile } = useUserSession(); // 2. USAR ESTADO GLOBAL

const loading = ref(true);
const activeRequests = ref([]); 
const featuredProfessionals = ref([]); 
const clientJobs = ref([]); 

// Control del Modal
const showIncompleteProfileModal = ref(false);

// --- NAVEGACIÓN ---
const goToExplore = () => router.push('/client/explore');
const goToProfile = () => router.push('/client/profile');
const closeWarning = () => showIncompleteProfileModal.value = false;

// --- AL CARGAR ---
onMounted(async () => {
  // Usamos el ID del estado global (más seguro que localStorage directo)
  const userId = state.user.id;

  if (userId) {
    try {
      // 1. SINCRONIZAR PERFIL (Puerto 3001)
      // Pedimos los datos más recientes a la base de datos
      const { data } = await axios.get(`http://localhost:3001/api/clientes/${userId}`);
      
      if (data) {
        // Actualizamos el cerebro con la información fresca
        updateProfile({
          name: data.nombre,
          phone: data.telefono,
          location: data.direccion,
          avatar: data.avatar
        });

        // Verificamos si falta información CRÍTICA para mostrar el modal
        if (!data.telefono || !data.direccion) {
          console.log("Perfil incompleto detectado.");
          // El usuario solicitó no mostrar el modal:
          // setTimeout(() => {
          //   showIncompleteProfileModal.value = true;
          // }, 1000); 
        }
      }

      // 2. CARGAR SOLICITUDES (Puerto 3001)
      try {
        const requestsRes = await axios.get(`http://localhost:3001/api/solicitudes/cliente/${userId}`);
        activeRequests.value = requestsRes.data;
      } catch (reqError) {
        console.log("El usuario no tiene solicitudes o el servicio 3001 no responde.");
      }

      // 3. CARGAR PROFESIONALES DESTACADOS (Puerto 3001)
      try {
        const prosRes = await axios.get('http://localhost:3001/api/profesionales');
        if (prosRes.data && prosRes.data.length > 0) {
          // Filtramos profesionales que no tengan nombre (evita crashes en el render)
          const validPros = prosRes.data.filter(p => p.nombre);
          featuredProfessionals.value = validPros.slice(0, 4);
        }
      } catch (err) {
        console.log("No se pudieron cargar los profesionales destacados.");
      }

      // 4. CARGAR TRABAJOS (Puerto 3003)
      try {
          const trabajosRes = await axios.get(`http://localhost:3003/api/trabajos/cliente/${userId}`);
          clientJobs.value = trabajosRes.data;
      } catch (err) {
          console.log("El servicio de trabajos (3003) no está disponible o no hay trabajos.");
      }

    } catch (error) {
      console.error("Error cargando dashboard:", error);
      // Si falla la conexión con BD, confiamos en lo que hay en memoria local
      if (!state.user.phone || !state.user.location) {
         console.log("Faltan datos en memoria local, pero no mostramos modal.");
      }
    } finally {
      loading.value = false;
    }
  } else {
    // Si no hay ID, mandamos al login
    router.push('/login');
  }
});

const confirmarTrabajo = async (trabajoId) => {
    try {
        const res = await axios.post(`http://localhost:3003/api/trabajos/${trabajoId}/confirmar`, {
            cliente_id: state.user.id
        });
        if (res.data.success) {
            router.push(`/client/review/${trabajoId}?ref=${res.data.profesional_id}`);
        }
    } catch(e) {
        alert("Error al confirmar el trabajo.");
        console.error(e);
    }
};
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
        <div class="banner-content">
          <h2>Hola, {{ state.user.name }}</h2>
          <p>¿Qué necesitas resolver hoy?</p>
        </div>
        <button @click="router.push('/client/request')" class="btn-primary-action">
          <i class="fa-solid fa-plus"></i> Publicar Solicitud
        </button>
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
              Ver Detalles <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div v-else class="empty-requests-box">
          <p>No tienes solicitudes activas en este momento.</p>
        </div>
      </div>

      <div class="ongoing-section">
        <h3 class="section-title" v-if="clientJobs.length > 0">Tus Trabajos en Curso</h3>
        <div v-if="clientJobs.length > 0" class="ongoing-list">
          <div v-for="job in clientJobs" :key="job.id" class="ongoing-card">
            <div class="card-left">
              <div class="status-indicator" :class="job.estado === 'FINALIZADO_PROFESIONAL' ? 'orange' : 'green'"></div>
              <div class="req-details">
                <h4>Trabajo #{{ job.id }}</h4>
                <span class="req-status">
                  Estado: {{ job.estado }} • {{ new Date(job.fecha_creacion).toLocaleDateString() }}
                </span>
              </div>
            </div>
            
            <button v-if="job.estado === 'FINALIZADO_PROFESIONAL' || job.estado === 'EN_PROGRESO'" class="btn-primary-action" style="padding:8px 16px; font-size:0.9rem" @click="confirmarTrabajo(job.id)">
              <i class="fa-solid fa-check"></i> Confirmar & Calificar
            </button>
          </div>
        </div>
      </div>

      <h3 class="section-title">Explora servicios cercanos</h3>
      
      <div v-if="featuredProfessionals.length === 0" class="empty-state-container">
        <div class="empty-icon-svg">
           <i class="fa-solid fa-users" style="font-size: 3rem; color: #cbd5e1;"></i>
        </div>
        <h3>Encuentra al experto ideal</h3>
        <p>Desde plomería hasta tecnología, todo en un solo lugar.</p>
        <button @click="goToExplore" class="btn-outline">
          <i class="fa-solid fa-magnifying-glass"></i> Explorar Directorio
        </button>
      </div>

      <div v-else class="services-grid">
        <div v-for="pro in featuredProfessionals" :key="pro.usuario_id" class="pro-card" @click="goToExplore">
          <div class="pro-avatar">
            <img v-if="pro.avatar && typeof pro.avatar === 'string'" :src="pro.avatar.startsWith('http') ? pro.avatar : `http://localhost:3001${pro.avatar}`" alt="Avatar">
            <span v-else>{{ (pro.nombre || 'P').charAt(0) }}</span>
          </div>
          <div class="pro-info">
            <h4>{{ pro.nombre }}</h4>
            <p>{{ pro.profesion || 'Profesional' }}</p>
            <div class="pro-rating">
              <i class="fa-solid fa-star" style="color: #FBBF24;"></i>
              <span>{{ pro.rating || 'Nuevo' }}</span>
            </div>
          </div>
        </div>
      </div>

    </main>

    <aside class="sidebar-right">
      <div class="info-card stats-card">
        <h3>Tu Resumen</h3>
        <div class="stat-row">
          <div class="stat-icon"><i class="fa-solid fa-clipboard-list"></i></div>
          <div class="stat-text">
            <strong>{{ activeRequests.length }}</strong>
            <span>Solicitudes Activas</span>
          </div>
        </div>
      </div>

      <div class="info-card action-card">
        <div class="card-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3>¿No encuentras lo que buscas?</h3>
        <p class="text-muted">Explora nuestro directorio completo de expertos.</p>
        <button @click="goToExplore" class="btn-explore-full">
          Ir al Directorio <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </aside>

  </div>
</template>

<style scoped>
/* --- ESTILOS DEL MODAL --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(11, 76, 111, 0.45);
  backdrop-filter: blur(5px);
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

.icon-container {
  position: relative;
  width: 72px; height: 72px;
  background: #E0F2FE;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
}
.user-icon { width: 36px; color: #0B4C6F; }

.notification-dot {
  position: absolute; top: 0; right: 0;
  width: 24px; height: 24px;
  background: #F76B1C;
  color: white; font-weight: 800; font-size: 14px;
  border-radius: 50%; border: 3px solid white;
  display: flex; align-items: center; justify-content: center;
}

.modal-card h3 { margin: 0 0 12px 0; color: #1e293b; font-size: 1.5rem; font-weight: 800; }
.modal-card p { color: #64748b; margin-bottom: 32px; line-height: 1.6; font-size: 0.95rem; }
.modal-card p strong { color: #0B4C6F; }

.modal-actions { width: 100%; display: flex; flex-direction: column; gap: 12px; }

.btn-complete {
  background: #0B4C6F; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; box-shadow: 0 4px 6px -1px rgba(11, 76, 111, 0.2);
}
.btn-complete:hover { background: #093a55; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(11, 76, 111, 0.3); }
.arrow-icon { width: 18px; }

.btn-later {
  background: transparent; border: none; padding: 10px; font-weight: 600; font-size: 0.95rem; color: #94a3b8; cursor: pointer; transition: color 0.2s;
}
.btn-later:hover { color: #64748b; }

.modal-footer-note {
  margin-top: 24px; font-size: 0.75rem; color: #F76B1C; background: #FFF7ED; padding: 8px 16px; border-radius: 20px; display: flex; align-items: center; gap: 6px; font-weight: 600;
}
.lock-icon { width: 12px; }

/* --- ESTILOS GENERALES --- */
.client-content-wrapper { display: flex; gap: 24px; width: 100%; padding-bottom: 40px; }
.feed-content { flex: 1; }
.sidebar-right { width: 300px; display: none; } 
@media (min-width: 1024px) { .sidebar-right { display: block; } }

.welcome-banner { 
  background: linear-gradient(135deg, #0B4C6F 0%, #083a55 100%); 
  padding: 30px; 
  border-radius: 12px; 
  color: white; 
  margin-bottom: 30px; 
  box-shadow: 0 4px 15px rgba(11, 76, 111, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.welcome-banner h2 { margin: 0 0 5px 0; font-size: 1.8rem; font-weight: 700; }
.welcome-banner p { margin: 0; opacity: 0.9; font-size: 1.1rem; }
.btn-primary-action {
  background: #F76B1C;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  gap: 8px;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-primary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(247, 107, 28, 0.3);
}

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

.btn-view-details { 
  background: white; 
  border: 1px solid #cbd5e1; 
  padding: 10px 18px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: 700; 
  font-size: 0.9rem; 
  transition: all 0.2s ease; 
  color: #334155; 
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.btn-view-details:hover { 
  border-color: #0B4C6F; 
  color: #0B4C6F; 
  background: #F0F9FF;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(11, 76, 111, 0.1);
}

.empty-requests-box { padding: 30px 20px; background: #F8FAFC; border-radius: 10px; border: 1.5px dashed #CBD5E1; color: #64748B; text-align: center; font-weight: 500;}

.empty-state-container { text-align: center; padding: 60px; background: white; border: 1.5px dashed #cbd5e1; border-radius: 12px; }
.empty-icon-svg { width: 64px; height: 64px; margin: 0 auto 15px; }
.btn-outline { 
  margin-top: 20px; 
  padding: 12px 28px; 
  border: 2px solid #0B4C6F; 
  color: #0B4C6F; 
  background: white; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: 700; 
  font-size: 1rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-outline:hover { 
  background: #0B4C6F;
  color: white; 
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(11, 76, 111, 0.2);
}

.info-card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);}
.info-card h3 { font-size: 1.15rem; margin-top: 0; color: #1e293b; font-weight: 800; }
.text-muted { color: #64748b; font-size: 0.95rem; line-height: 1.4; }

.action-card {
  text-align: center;
}
.action-card .card-icon {
  font-size: 2.8rem;
  color: #0B4C6F;
  margin-bottom: 16px;
  background: #E0F2FE;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin: 0 auto 16px;
}
.action-card h3 { margin-bottom: 8px; font-size: 1.1rem; }
.action-card p { margin-bottom: 20px; }

.btn-explore-full {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #0B4C6F 0%, #083a55 100%);
  border: none;
  color: white;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(11, 76, 111, 0.2);
}
.btn-explore-full:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(11, 76, 111, 0.35);
  background: linear-gradient(135deg, #083a55 0%, #05263a 100%);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 8px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  background: #E0F2FE;
  color: #0B4C6F;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.stat-text {
  display: flex;
  flex-direction: column;
}
.stat-text strong {
  font-size: 1.5rem;
  color: #1e293b;
  line-height: 1.2;
}
.stat-text span {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

/* CARDS DE PROFESIONALES DESTACADOS */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 20px;
}
.pro-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.pro-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.06);
  border-color: #cbd5e1;
}
.pro-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pro-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pro-avatar span { font-size: 2rem; font-weight: 800; color: #94a3b8; }
.pro-info h4 { margin: 0 0 4px 0; font-size: 1.05rem; color: #1e293b; font-weight: 700; }
.pro-info p { margin: 0 0 10px 0; font-size: 0.9rem; color: #64748b; text-transform: capitalize; }
.pro-rating { display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; color: #475569; font-size: 0.95rem; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .welcome-banner { flex-direction: column; text-align: center; gap: 20px; padding: 24px 20px; }
  .welcome-banner h2 { font-size: 1.5rem; }
  .btn-primary-action { width: 100%; justify-content: center; }
  
  .ongoing-card { flex-direction: column; align-items: stretch; gap: 15px; }
  .card-left { align-items: flex-start; }
  .btn-view-details { width: 100%; justify-content: center; }
  
  .empty-state-container { padding: 40px 20px; }
  .services-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .welcome-banner h2 { font-size: 1.3rem; }
  .stat-row { flex-direction: column; text-align: center; padding: 20px; }
}
</style>