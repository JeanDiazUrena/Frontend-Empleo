<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js';

const router = useRouter();
const { state } = useUserSession();

const jobRequests = ref([]);
const professionalJobs = ref([]);
const profileStatus = ref(null); // null = cargando, false = sin perfil, true = tiene perfil
const isLoading = ref(true);
const userAvatar = ref('');
const userDisplayName = ref('');

const goToSetup = () => router.push('/professional/setup');
const goToProfile = () => router.push('/professional/profile');
const goToPost = () => router.push('/create-first-post');

const contactClient = async (clienteId) => {
  try {
    const userId = state.user?.id || localStorage.getItem('usuario_id');
    await axios.post('http://localhost:3001/api/chat/conversacion', {
      cliente_id: clienteId,
      profesional_usuario_id: userId
    });
    router.push('/professional/chat');
  } catch(e) {
    console.error("Error al contactar:", e);
  }
};

const acceptJobRequest = async (req) => {
  const confirmHire = confirm(`¿Deseas aceptar la solicitud de ${req.cliente_nombre}? Se creará un trabajo formal.`);
  if (!confirmHire) return;

  try {
    const userId = state.user?.id || localStorage.getItem('usuario_id');
    const res = await axios.post('http://localhost:3003/api/trabajos', {
      cliente_id: req.cliente_id,
      profesional_id: userId,
      solicitud_id: req.id
    });
    
    if (res.data.success) {
      alert("¡Trabajo aceptado! Ahora puedes verlo en tus trabajos activos.");
      jobRequests.value = jobRequests.value.filter(r => r.id !== req.id);
      professionalJobs.value.unshift(res.data.trabajo);
    }
  } catch(e) {
    console.error(e);
    alert("Error al intentar aceptar la solicitud.");
  }
};

onMounted(async () => {
  const userId = state.user?.id || localStorage.getItem('usuario_id');
  if (!userId) { router.push('/login'); return; }

  // Cargar foto y nombre para mostrar en el dashboard
  userDisplayName.value = state.user?.name || localStorage.getItem('usuario_nombre') || 'Profesional';
  userAvatar.value = localStorage.getItem('usuario_avatar') || '';

  try {
    const { data } = await axios.get(`http://localhost:3001/api/profesionales/${userId}`);
    profileStatus.value = !!data;
    // Si el perfil tiene avatar, actualizarlo
    if (data?.avatar_url) {
      userAvatar.value = data.avatar_url;
      localStorage.setItem('usuario_avatar', data.avatar_url);
    }
    if (data?.nombre) userDisplayName.value = data.nombre;

      try {
        const solRes = await axios.get(`http://localhost:3001/api/solicitudes?profesional_id=${userId}`);
        jobRequests.value = solRes.data;
      } catch(e) { console.error("Error cargando solicitudes", e); }

      try {
        const trabRes = await axios.get(`http://localhost:3003/api/trabajos/profesional/${userId}`);
        professionalJobs.value = trabRes.data;
      } catch(e) { console.error("Error cargando trabajos", e); }
      
    } catch {
    profileStatus.value = false;
  } finally {
    isLoading.value = false;
  }
});

const finalizarTrabajo = async (trabajoId) => {
    try {
        const userId = state.user?.id || localStorage.getItem('usuario_id');
        const res = await axios.put(`http://localhost:3003/api/trabajos/${trabajoId}/terminar`, {
            profesional_id: userId
        });
        if (res.data.success) {
            alert("Has marcado el trabajo como terminado. El cliente debe confirmar para liberar el pago.");
            // Update local state
            const job = professionalJobs.value.find(j => j.id === trabajoId);
            if (job) job.estado = 'FINALIZADO_PROFESIONAL';
        }
    } catch(e) {
        alert("Error al finalizar el trabajo.");
        console.error(e);
    }
};
</script>

<template>
  <div class="dashboard-view">

    <!-- CARGANDO -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando tu panel...</p>
    </div>

    <template v-else>

      <!-- ===== TARJETA DE BIENVENIDA CON FOTO ===== -->
      <div class="welcome-card">
        <div class="welcome-avatar">
          <img v-if="userAvatar" :src="userAvatar" class="welcome-avatar-img" alt="foto" />
          <div v-else class="welcome-avatar-initials">
            {{ userDisplayName?.charAt(0).toUpperCase() || 'P' }}
          </div>
        </div>
        <div class="welcome-text">
          <p class="welcome-greeting">Bienvenido de vuelta</p>
          <h2 class="welcome-name">{{ userDisplayName }}</h2>
        </div>
        <button class="welcome-btn-profile" @click="goToProfile">
          Ver mi perfil
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
        </button>
      </div>

      <!-- ===== SIN PERFIL: CTA SETUP ===== -->
      <div v-if="!profileStatus" class="no-profile-card">
        <div class="npc-icon"><i class="fa-solid fa-rocket"></i></div>
        <h2>¡Completa tu perfil profesional!</h2>
        <p>Para que los clientes puedan encontrarte y contratarte, necesitas configurar tu perfil con tu información, habilidades y horario.</p>
        <div class="npc-steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">Agrega tu foto y datos profesionales</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">Define tu horario de atención</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">¡Aparece en el directorio de clientes!</div>
          </div>
        </div>
        <button class="btn-setup-now" @click="goToSetup">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="btn-icon"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
          Crear mi Perfil Ahora
        </button>
      </div>

      <!-- ===== CON PERFIL ===== -->
      <template v-else>

        <!-- ACCIONES RÁPIDAS -->
        <div class="quick-actions-grid">
          <button class="qa-card" @click="goToSetup">
            <div class="qa-icon"><i class="fa-solid fa-pencil"></i></div>
            <div class="qa-text">
              <strong>Editar Perfil</strong>
              <span>Actualiza tus datos, habilidades y horario</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="qa-arrow"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
          </button>

          <button class="qa-card" @click="goToPost">
            <div class="qa-icon"><i class="fa-solid fa-camera"></i></div>
            <div class="qa-text">
              <strong>Publicar Trabajo</strong>
              <span>Muestra un trabajo en tu portafolio</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="qa-arrow"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
          </button>

          <button class="qa-card" @click="goToProfile">
            <div class="qa-icon"><i class="fa-regular fa-eye"></i></div>
            <div class="qa-text">
              <strong>Ver mi Perfil</strong>
              <span>Así es como te ven los clientes</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="qa-arrow"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
          </button>
        </div>

        <!-- BANNER INFORMATIVO -->
        <div class="info-banner">
          <div class="info-banner-icon"><i class="fa-solid fa-circle-check"></i></div>
          <div class="info-banner-text">
            <strong>Tu perfil está activo y visible</strong>
            <p>Los clientes de ServiHub pueden encontrarte en la página de explorar. Mantén tu información actualizada para recibir más contactos.</p>
          </div>
        </div>

        <!-- TRABAJOS EN CURSO (NUEVO EFECTO DOMINÓ) -->
        <div class="section-card" style="margin-bottom: 24px;" v-if="professionalJobs.length > 0">
          <div class="sc-header">
            <h3>Tus Trabajos Activos</h3>
            <p>Trabajos en progreso. MÁRCALOS COMO TERMINADOS cuando finalices para que el cliente confirme.</p>
          </div>

          <div class="jobs-list">
            <div v-for="job in professionalJobs" :key="job.id" class="job-card" style="border-left: 4px solid #1E293B;">
              <div class="job-header">
                <div>
                  <h4 style="margin:0 0 4px; font-size:1.1rem; color:#1E293B;">Trabajo #{{ job.id }}</h4>
                  <span style="font-size: 0.85rem; font-weight:600; color:#F76B1C;" v-if="job.estado === 'EN_PROGRESO'">EN PROGRESO</span>
                  <span style="font-size: 0.85rem; font-weight:600; color:#22C55E;" v-else-if="job.estado === 'FINALIZADO_PROFESIONAL'">ESPERANDO CLIENTE</span>
                  <span style="font-size: 0.85rem; font-weight:600; color:#94A3B8;" v-else>{{ job.estado }}</span>
                </div>
                <span class="job-category">{{ new Date(job.fecha_creacion).toLocaleDateString() }}</span>
              </div>
              
              <div class="job-footer" v-if="job.estado === 'EN_PROGRESO'">
                <button class="btn-primary-action job-action-btn" style="background: #F76B1C;" @click="finalizarTrabajo(job.id)">
                  <i class="fa-solid fa-flag-checkered"></i> Marcar como terminado
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SOLICITUDES DE TRABAJO -->
        <div class="section-card">
          <div class="sc-header">
            <h3>Oportunidades de Trabajo</h3>
            <p>Solicitudes de clientes que necesitan tus servicios</p>
          </div>

          <div v-if="jobRequests.length === 0" class="empty-jobs">
            <div class="empty-jobs-icon">
              <i class="fa-solid fa-briefcase"></i>
            </div>
            <div class="empty-jobs-text">
              <h4>No hay solicitudes activas</h4>
              <p>Las solicitudes de clientes que necesitan tus servicios aparecerán aquí.</p>
            </div>
          </div>

          <div v-else class="jobs-list">
            <div v-for="req in jobRequests" :key="req.id" class="job-card">
              <div class="job-header">
                <div class="client-info">
                  <img v-if="req.cliente_avatar" :src="req.cliente_avatar.startsWith('http') ? req.cliente_avatar : `http://localhost:3001${req.cliente_avatar}`" class="client-avatar" alt="Avatar"/>
                  <div v-else class="client-avatar-initial">{{ req.cliente_nombre ? req.cliente_nombre.charAt(0) : 'C' }}</div>
                  <div class="client-details">
                    <h4>{{ req.cliente_nombre || 'Cliente' }}</h4>
                    <span>{{ new Date(req.fecha_creacion).toLocaleDateString() }}</span>
                  </div>
                </div>
                <span class="job-category">{{ req.categoria }}</span>
              </div>
              <h3 class="job-title">{{ req.titulo }}</h3>
              <p class="job-desc">{{ req.descripcion }}</p>

              <div v-if="req.imagen_url" class="job-image">
                <img :src="req.imagen_url" alt="Referencia" />
              </div>

              <div class="job-footer">
                <button class="job-action-btn" style="background: white; color: #1E293B; border: 1px solid #CBD5E1; margin-right: 8px; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s;" @click="contactClient(req.cliente_id)">
                  <i class="fa-solid fa-paper-plane"></i> Charla
                </button>
                <button class="btn-primary-action job-action-btn" @click="acceptJobRequest(req)">
                  <i class="fa-solid fa-check"></i> Tomar Trabajo
                </button>
              </div>
            </div>
          </div>
        </div>

      </template>
    </template>

  </div>
</template>

<style scoped>
.dashboard-view { font-family: 'Inter', sans-serif; width: 100%; }

/* LOADING */
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 16px; color: #94A3B8; }
.spinner { width: 32px; height: 32px; border: 2.5px solid #E2E8F0; border-top-color: #334155; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ===== TARJETA DE BIENVENIDA ===== */
.welcome-card {
  display: flex; align-items: center; gap: 16px;
  background: white; border: 1px solid #E2E8F0;
  border-radius: 12px; padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.welcome-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  overflow: hidden; flex-shrink: 0;
  background: #334155; display: flex; align-items: center; justify-content: center;
  border: 2px solid #E2E8F0;
}
.welcome-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.welcome-avatar-initials { font-size: 1.4rem; font-weight: 700; color: white; }
.welcome-text { flex: 1; min-width: 0; }
.welcome-greeting { margin: 0 0 2px; font-size: 0.78rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.welcome-name { margin: 0; font-size: 1.2rem; font-weight: 800; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.welcome-btn-profile {
  display: inline-flex; align-items: center; gap: 6px;
  background: #F8FAFC; border: 1.5px solid #E2E8F0;
  color: #475569; padding: 8px 14px; border-radius: 6px;
  font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: 0.2s;
  flex-shrink: 0;
}
.welcome-btn-profile svg { width: 15px; height: 15px; }
.welcome-btn-profile:hover { border-color: #334155; color: #1E293B; background: white; }

/* SIN PERFIL */
.no-profile-card {
  background: white; border-radius: 12px; border: 1px solid #E2E8F0;
  padding: 48px 40px; text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.npc-icon { font-size: 2.5rem; margin-bottom: 16px; color: #CBD5E1; }
.no-profile-card h2 { margin: 0 0 12px; font-size: 1.4rem; font-weight: 800; color: #0F172A; }
.no-profile-card p { color: #64748B; font-size: 0.93rem; max-width: 480px; margin: 0 auto 28px; line-height: 1.6; }
.npc-steps { display: flex; flex-direction: column; gap: 12px; max-width: 380px; margin: 0 auto 32px; text-align: left; }
.step { display: flex; align-items: center; gap: 14px; }
.step-num { width: 30px; height: 30px; background: #1E293B; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0; }
.step-text { color: #475569; font-size: 0.9rem; font-weight: 500; }
.btn-setup-now {
  background: #1E293B;
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
}
.btn-setup-now:hover { background: #0F172A; transform: translateY(-2px); }
.btn-icon { width: 20px; height: 20px; }

.btn-primary-action {
  margin-top: 16px;
  background: #1E293B;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}
.btn-primary-action:hover { background: #0F172A; transform: translateY(-1px); }

/* QUICK ACTIONS */
.quick-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 14px; margin-bottom: 20px; }
.qa-card {
  display: flex; align-items: center; gap: 16px;
  background: white; border: 1.5px solid #E2E8F0;
  border-radius: 10px; padding: 18px 20px;
  cursor: pointer; text-align: left; transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.qa-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.07); border-color: #CBD5E1; }
.qa-icon { font-size: 1.5rem; flex-shrink: 0; color: #475569; }
.qa-text { flex: 1; }
.qa-text strong { display: block; font-size: 0.98rem; font-weight: 700; color: #1E293B; margin-bottom: 3px; }
.qa-text span { font-size: 0.78rem; color: #94A3B8; }
.qa-arrow { width: 16px; height: 16px; color: #CBD5E1; flex-shrink: 0; }
.qa-card:hover .qa-arrow { color: #475569; }

/* INFO BANNER */
.info-banner { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px 18px; display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; }
.info-banner-icon { font-size: 1.2rem; flex-shrink: 0; color: #94A3B8; }
.info-banner-text strong { display: block; color: #334155; font-size: 0.9rem; margin-bottom: 3px; }
.info-banner-text p { margin: 0; color: #64748B; font-size: 0.82rem; line-height: 1.5; }

/* SECTION CARD */
.section-card { background: white; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }
.sc-header { padding: 18px 22px; border-bottom: 1px solid #F1F5F9; }
.sc-header h3 { margin: 0 0 3px; font-size: 0.98rem; font-weight: 700; color: #1E293B; }
.sc-header p { margin: 0; font-size: 0.82rem; color: #94A3B8; }

.empty-jobs { display: flex; align-items: flex-start; gap: 20px; padding: 30px; }
.empty-jobs-icon { width: 56px; height: 56px; background: #F1F5F9; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.5rem; color: #CBD5E1; }
.empty-jobs-text { display: flex; flex-direction: column; align-items: flex-start; }
.empty-jobs-text h4 { margin: 0 0 6px; font-size: 1rem; color: #1E293B; font-weight: 700; }
.empty-jobs-text p { margin: 0; font-size: 0.88rem; line-height: 1.5; color: #64748B; }

.jobs-list { display: flex; flex-direction: column; padding: 20px; gap: 20px; }
.job-card { border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; transition: box-shadow 0.2s; }
.job-card:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.client-info { display: flex; align-items: center; gap: 12px; }
.client-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.client-avatar-initial { width: 44px; height: 44px; border-radius: 50%; background: #334155; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; }
.client-details h4 { margin: 0 0 2px; font-size: 1rem; color: #1E293B; font-weight: 700; }
.client-details span { font-size: 0.8rem; color: #94A3B8; }
.job-category { background: #F1F5F9; color: #475569; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
.job-title { margin: 0 0 8px; font-size: 1.15rem; color: #0F172A; font-weight: 800; }
.job-desc { margin: 0 0 16px; font-size: 0.92rem; line-height: 1.6; color: #475569; }
.job-image { margin-bottom: 16px; border-radius: 8px; overflow: hidden; max-height: 250px; background: #F8FAFC; border: 1px solid #E2E8F0; }
.job-image img { width: 100%; height: 100%; object-fit: contain; }
.job-footer { display: flex; justify-content: flex-end; }
.job-action-btn { width: auto; padding: 10px 20px; font-size: 0.9rem; }

@media (max-width: 768px) {
  .welcome-card { flex-direction: column; text-align: center; gap: 12px; }
  .welcome-btn-profile { width: 100%; justify-content: center; }
  
  .qa-card { padding: 16px; align-items: flex-start; }
  .qa-icon { font-size: 1.2rem; }
  .qa-text strong { font-size: 0.9rem; }
  .qa-text span { font-size: 0.72rem; }
  
  .job-header { flex-direction: column; gap: 10px; }
  .job-category { align-self: flex-start; }
  .job-footer { flex-direction: column; gap: 8px; }
  .job-action-btn { width: 100%; justify-content: center; margin-right: 0 !important; }
}

@media (max-width: 480px) {
  .no-profile-card { padding: 30px 16px; }
  .npc-steps { gap: 10px; }
  .step-text { font-size: 0.8rem; }
}
</style>