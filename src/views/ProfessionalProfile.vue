<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession'; 

const router = useRouter();
const { state, updateProfile } = useUserSession(); 

// --- ESTADO SOLO DE LECTURA ---
const user = ref({ 
  name: "", profession: "", bio: "", category: "", experience: 0,
  emailPublic: "", phone: "", city: "", sector: "", website: "",
  workingHours: "", skills: "", avatar: "", cover: "", joinDate: "" 
});

const activeTab = ref('info');
const portfolioItems = ref([]); 
const serviceHistory = ref([]); // Puedes llenarlo después si tienes API

// --- CARGAR DATOS ---
onMounted(async () => {
  const userId = state.user?.id || localStorage.getItem('usuario_id');
  if (!userId) { router.push('/login'); return; }

  // Nombre básico por si no ha cargado
  user.value.name = state.user?.name || localStorage.getItem('usuario_nombre') || "Profesional";

  try {
    const { data } = await axios.get(`http://localhost:3001/api/profesionales/${userId}`);
    
    if (data) {
      user.value = {
        name: data.nombre || state.user?.name,
        profession: data.profesion || "",
        bio: data.biografia || "",
        category: data.categoria_nombre || data.categoria || "", 
        experience: data.anios_experiencia || 0,
        emailPublic: data.email_publico || "",
        phone: data.telefono || "",
        city: data.ciudad || "",
        sector: data.sector || "",
        website: data.sitio_web || "",
        workingHours: data.horario_texto || "",
        skills: data.habilidades || "",
        avatar: data.avatar_url || "", 
        cover: data.cover_url || "",   
        joinDate: data.fecha_registro ? new Date(data.fecha_registro).toLocaleDateString() : ""
      };
      
      portfolioItems.value = data.portfolio || [];

      // Sincronizar
      updateProfile({
        name: user.value.name,
        email: user.value.emailPublic,
        avatar: user.value.avatar
      });
      
    } else {
      // Si no existe el perfil, que vaya directo a crearlo
      router.push('/professional/setup');
    }
  } catch (error) {
    console.error("Error conectando con el servidor:", error);
  }
});

// --- BOTÓN MÁGICO: IR A EDITAR ---
const goToEdit = () => {
  router.push('/professional/setup'); 
};
</script>

<template>
  <div class="profile-layout">
    
    <div class="profile-header-card">
      <div class="banner-area" :style="user.cover ? { backgroundImage: `url(${user.cover})` } : {}"></div>

      <div class="header-content">
        <div class="avatar-wrapper">
          <div class="avatar-circle">
            <img v-if="user.avatar" :src="user.avatar" class="avatar-img">
            <div v-else class="avatar-placeholder-icon">
               <span style="font-size: 3.5rem; font-weight: bold; color: #cbd5e1;">
                 {{ user.name?.charAt(0).toUpperCase() || 'P' }}
               </span>
            </div>
          </div>
        </div>

        <div class="user-text">
          <div class="name-badge">
            <h1>{{ user.name || 'Profesional' }}</h1>
            <span class="pro-badge">Profesional</span>
          </div>
          <div class="meta-info">
            <span class="meta-item" style="color: #1d4ed8; font-weight: 600;">
              {{ user.profession || 'Sin profesión' }}
            </span>
            <span class="meta-item">
              📍 {{ user.city ? `${user.city}, ${user.sector}` : 'Sin ubicación' }}
            </span>
          </div>
        </div>

        <div class="header-actions">
          <button class="btn-primary-outline" @click="goToEdit">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
            Editar Perfil
          </button>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-item">
          <strong>{{ serviceHistory.length }}</strong>
          <span>Solicitudes</span>
        </div>
        <div class="stat-item">
          <strong>0</strong>
          <span>Reseñas</span>
        </div>
      </div>
    </div>

    <div class="profile-grid">
      
      <div class="left-nav">
        <button class="nav-item" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>
          Información Profesional
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'portfolio' }" @click="activeTab = 'portfolio'">
          <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
          Mi Portafolio
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'reviews' }" @click="activeTab = 'reviews'">
          <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
          Reseñas Recibidas
        </button>
      </div>

      <div class="right-content">
        
        <div v-if="activeTab === 'info'">
          <div class="panel-header">
            <h3>Información Profesional</h3>
          </div>

          <div class="info-display">
            <div class="info-row full"><span class="label">Sobre mí:</span> <span class="value">{{ user.bio || 'Sin descripción' }}</span></div>
            <div class="info-row"><span class="label">Profesión:</span> <span class="value">{{ user.profession || '---' }}</span></div>
            <div class="info-row"><span class="label">Categoría:</span> <span class="value">{{ user.category || '---' }}</span></div>
            <div class="info-row"><span class="label">Experiencia:</span> <span class="value">{{ user.experience ? user.experience + ' años' : '---' }}</span></div>
            <div class="info-row"><span class="label">Teléfono:</span> <span class="value">{{ user.phone || '---' }}</span></div>
            <div class="info-row"><span class="label">Email de Trabajo:</span> <span class="value">{{ user.emailPublic || '---' }}</span></div>
            <div class="info-row"><span class="label">Ubicación:</span> <span class="value">{{ user.city ? `${user.city}, ${user.sector}` : '---' }}</span></div>
            <div class="info-row"><span class="label">Horario:</span> <span class="value">{{ user.workingHours || '---' }}</span></div>
            <div class="info-row full"><span class="label">Habilidades:</span> <span class="value">{{ user.skills || '---' }}</span></div>
            <div class="info-row full"><span class="label">Web:</span> <span class="value">{{ user.website || '---' }}</span></div>
          </div>
        </div>

        <div v-if="activeTab === 'portfolio'">
          <div class="panel-header"><h3>Portafolio de Trabajos</h3></div>
          <div v-if="portfolioItems.length === 0" class="empty-state-panel">
            <div class="empty-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            </div>
            <h4>No tienes trabajos en tu portafolio</h4>
          </div>
          <div v-else class="portfolio-grid">
             <div v-for="item in portfolioItems" :key="item.id" class="portfolio-card">
                <img :src="item.imagen_url" alt="Trabajo">
                <div class="port-content">
                  <h5>{{ item.titulo }}</h5>
                  <p>{{ item.descripcion }}</p>
                </div>
             </div>
          </div>
        </div>

        <div v-if="activeTab === 'reviews'">
          <div class="panel-header"><h3>Reseñas de Clientes</h3></div>
          <div class="empty-state-panel">
            <p>Aún no tienes reseñas.</p>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
.profile-layout { width: 100%; max-width: 1000px; margin: 0 auto; padding-bottom: 50px; }
.icon-sm { width: 18px; height: 18px; margin-right: 6px; }

.profile-header-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: visible; margin-bottom: 24px; }
.banner-area { height: 180px; background-color: #3b82f6; background-size: cover; background-position: center; border-radius: 12px 12px 0 0;}

.header-content { padding: 0 30px 20px 30px; display: flex; align-items: flex-start; gap: 20px; }
.avatar-wrapper { margin-top: -60px; position: relative; z-index: 2; }
.avatar-circle { width: 130px; height: 130px; background: white; border: 4px solid white; border-radius: 50%; overflow: hidden; position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder-icon { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f8fafc; }

.user-text { flex: 1; padding-top: 15px; }
.name-badge { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
.name-badge h1 { margin: 0; font-size: 1.8rem; font-weight: 800; color: #111; }
.pro-badge { background: #dbeafe; color: #1d4ed8; font-size: 0.75rem; padding: 2px 8px; border-radius: 20px; font-weight: 700; text-transform: uppercase; margin-left: 10px; }
.meta-info { display: flex; gap: 15px; color: #666; font-size: 0.95rem; margin-top: 5px; align-items: center;}

.header-actions { padding-top: 15px; }
.btn-primary-outline { display: flex; align-items: center; border: 1px solid #1d4ed8; color: #1d4ed8; background: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-primary-outline:hover { background: #eff6ff; }

.stats-bar { display: flex; border-top: 1px solid #eee; padding: 15px 30px; gap: 40px; }
.stat-item { display: flex; flex-direction: column; }
.stat-item strong { font-size: 1.1rem; color: #111; }
.stat-item span { font-size: 0.85rem; color: #666; }

.profile-grid { display: grid; grid-template-columns: 260px 1fr; gap: 24px; }
.left-nav { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; height: fit-content; }
.nav-item { width: 100%; text-align: left; padding: 15px 20px; background: none; border: none; border-bottom: 1px solid #eee; cursor: pointer; font-size: 0.95rem; color: #555; display: flex; align-items: center; font-weight: 500; transition: 0.2s;}
.nav-item:hover { background: #f9fafb; color: #1d4ed8; }
.nav-item.active { background: #eff6ff; color: #1d4ed8; font-weight: 700; border-left: 4px solid #1d4ed8; }
.nav-icon { width: 24px; height: 24px; margin-right: 10px; flex-shrink: 0; }

.right-content { background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 30px; min-height: 400px; }
.panel-header { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
.panel-header h3 { margin: 0; font-size: 1.3rem; color: #333; }

.info-display { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.info-row { display: flex; flex-direction: column; border-bottom: 1px dashed #eee; padding-bottom: 8px; }
.info-row.full { grid-column: span 2; }
.info-row .label { font-size: 0.85rem; font-weight: 600; color: #6b7280; margin-bottom: 4px; }
.info-row .value { font-size: 1rem; font-weight: 600; color: #111827; }

.empty-state-panel { text-align: center; padding: 40px 20px; color: #666; }
.empty-icon-box { width: 60px; height: 60px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; color: #999; }
.empty-icon-box svg { width: 30px; height: 30px; }

.portfolio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.portfolio-card { border: 1px solid #eee; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.portfolio-card img { width: 100%; height: 150px; object-fit: cover; }
.port-content { padding: 12px; }
.port-content h5 { margin: 0 0 5px 0; font-size: 1rem; color: #111; }
.port-content p { margin: 0; font-size: 0.85rem; color: #666; }
</style>