<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js';

const router = useRouter();
const { state } = useUserSession();

const jobRequests = ref([]);
const profileStatus = ref(null); // null = cargando, false = sin perfil, true = tiene perfil
const isLoading = ref(true);
const userAvatar = ref('');
const userDisplayName = ref('');

const goToSetup = () => router.push('/professional/setup');
const goToProfile = () => router.push('/professional/profile');
const goToPost = () => router.push('/create-first-post');

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
  } catch {
    profileStatus.value = false;
  } finally {
    isLoading.value = false;
  }
});
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
              <p>Las solicitudes de clientes que se adapten a tu área aparecerán aquí.</p>
              <button class="btn-primary-action" @click="router.push('/client/explore')">
                Explorar Solicitudes <i class="fa-solid fa-arrow-right"></i>
              </button>
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

@media (max-width: 640px) {
  .quick-actions-grid { grid-template-columns: 1fr; }
  .no-profile-card { padding: 32px 20px; }
  .welcome-card { flex-wrap: wrap; }
  .welcome-btn-profile { width: 100%; justify-content: center; }
}
</style>