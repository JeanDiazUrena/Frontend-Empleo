<script setup>
import { ref, onMounted } from 'vue';

const loading = ref(true);
const user = ref({
  name: '', headline: '', location: '', banner: null, 
  rating: '0.0', jobs: 0, skills: [], certifications: [], bio: ''
});

const fetchProfile = async () => {
  // Simulación
  loading.value = false;
};

onMounted(() => {
  fetchProfile();
});
</script>

<template>
  <div class="profile-view">
    
    <div v-if="loading" class="loading-state">Cargando...</div>

    <div v-else class="profile-grid">
      <div class="main-col">
        <div class="card profile-header-card">
          <div class="banner-area" :style="user.banner ? { backgroundImage: `url(${user.banner})` } : {}"></div>
          
          <div class="profile-content-pad">
            <div class="avatar-wrapper">
              <div class="profile-avatar-big-placeholder">
                {{ user.name ? user.name.charAt(0) : '?' }}
              </div>
            </div>
            
            <div class="info-header">
               <h1>{{ user.name || 'Usuario Nuevo' }} <span v-if="user.name" class="verified-tag">Verificado</span></h1>
               <p class="headline">{{ user.headline || 'Sin título profesional aún' }}</p>
               <p class="location-text" v-if="user.location">📍 {{ user.location }}</p>
            </div>

            <div class="stats-bar">
               <div class="stat-item">
                 <svg class="stat-icon star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                   <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
                 </svg>
                 <span>{{ user.rating }}</span>
               </div>
               
               <div class="stat-item">
                 <svg class="stat-icon trophy" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                   <path fill-rule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h14.625c.414 0 .75-.336.75-.75a2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.348zm13.668 8.046c.545-.974.857-2.098.857-3.294a45.6 45.6 0 012.006.348 5.266 5.266 0 01-2.863 3.207z" clip-rule="evenodd" />
                 </svg>
                 <span>{{ user.jobs }} Trabajos</span>
               </div>
            </div>
          </div>
          
          <div class="card-section">
            <h3>Sobre Mí</h3>
            <p v-if="user.bio">{{ user.bio }}</p>
            <p v-else class="text-muted">Aún no has escrito una biografía.</p>
          </div>
        </div>
      </div>

      <div class="side-col">
        <div class="card side-card">
          <h3>Habilidades</h3>
          <div v-if="user.skills.length > 0" class="tags-container">
            <span v-for="skill in user.skills" :key="skill" class="skill-tag">{{ skill }}</span>
          </div>
          <p v-else class="text-muted">No hay habilidades registradas.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* (MISMOS ESTILOS DE ANTES, SOLO AGREGAMOS ESTO) */

.profile-grid { display: grid; grid-template-columns: 2.5fr 1fr; gap: 24px; align-items: start; }
.card { background: white; border-radius: 8px; border: 1px solid #E5E7EB; overflow: hidden; margin-bottom: 20px; }
.banner-area { height: 160px; background-size: cover; background-position: center; background-color: #E5E7EB; }
.profile-content-pad { padding: 0 24px 20px; position: relative; }
.avatar-wrapper { margin-top: -50px; margin-bottom: 15px; }
.profile-avatar-big-placeholder { width: 100px; height: 100px; background: #0B4C6F; color: white; border: 4px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; }
.info-header h1 { margin: 0 0 5px; font-size: 1.5rem; color: #111; }
.verified-tag { font-size: 0.7rem; background: #E0F2FE; color: #0B4C6F; padding: 2px 6px; border-radius: 4px; vertical-align: middle; }
.headline { color: #333; font-weight: 500; margin: 0 0 5px; }
.location-text { color: #777; font-size: 0.9rem; margin: 0; }
.card-section { padding: 24px; border-top: 1px solid #eee; }
.side-card { padding: 20px; }
.tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-tag { background: #F3F4F6; padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; color: #555; }
.text-muted { color: #999; font-style: italic; font-size: 0.9rem; }
.loading-state { padding: 50px; text-align: center; color: #666; font-size: 1.2rem; }

/* NUEVOS ESTILOS PARA LA BARRA DE ESTADÍSTICAS */
.stats-bar {
  display: flex;
  gap: 24px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #444;
  font-size: 0.95rem;
}

.stat-icon {
  width: 18px;
  height: 18px;
}

.star { color: #FFB33E; /* Amarillo Estrella Fiverr */ }
.trophy { color: #F76B1C; /* Naranja ServiHub */ }
</style>