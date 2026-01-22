<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(true);

// --- ESTADO INICIAL (VACÍO PARA BASE DE DATOS) ---
const user = ref({
  id: null,
  name: "", 
  location: "",
  joinDate: "",
  avatar: "", 
  cover: "", 
  profession: "",       
  bio: "",              
  experience: 0,        
  skills: "", // String que vendrá de la BD: "Skill1, Skill2"
  workingHours: "",     
  phone: "",
  portfolio: [] 
});

// Convertir string de habilidades a Array para visualización
const formattedSkills = computed(() => {
  if (!user.value.skills) return [];
  return user.value.skills.split(',').map(skill => skill.trim());
});

// --- ACCIONES ---
const goToEditProfile = () => router.push('/professional-setup');
const goToCreatePost = () => router.push('/create-first-post');

const editPost = (postId) => {
  // Lógica futura: router.push(`/professional/post/edit/${postId}`);
  router.push('/create-first-post');
};

// --- CARGA DE DATOS (CONEXIÓN BACKEND) ---
const fetchProfile = async () => {
  try {
    // AQUÍ CONECTARÁS TU BASE DE DATOS:
    // const { data } = await axios.get('/api/professional/profile');
    // user.value = data;
    
    // Por ahora, solo quitamos el loading para que veas la estructura vacía
    loading.value = false;
    
  } catch (error) {
    console.error("Error al cargar perfil", error);
    loading.value = false;
  }
};

onMounted(() => {
  fetchProfile();
});
</script>

<template>
  <div class="profile-view">
    
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
    </div>

    <div v-else class="profile-container">
      
      <div class="profile-header">
        <div class="cover-image" :style="user.cover ? { backgroundImage: `url(${user.cover})` } : {}"></div>
        
        <div class="header-body">
          <div class="avatar-container">
            <img v-if="user.avatar" :src="user.avatar" alt="Avatar" class="avatar-img">
            <div v-else class="avatar-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
          </div>

          <div class="header-info">
            <div class="main-info">
              <h1>{{ user.name || 'Nombre del Profesional' }}</h1>
              <span v-if="user.name" class="pro-badge">Verificado</span>
            </div>
            
            <h2 class="profession-title">{{ user.profession || 'Profesión no definida' }}</h2>
            
            <div class="meta-row">
              <span class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                {{ user.location || 'Ubicación' }}
              </span>
              <span class="meta-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {{ user.joinDate || 'Fecha de registro' }}
              </span>
            </div>
          </div>

          <div class="header-actions">
            <button class="btn-edit" @click="goToEditProfile">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      <div class="profile-grid-layout">
        
        <div class="main-column">
          
          <section class="content-card">
            <h3>Sobre Mí</h3>
            <p v-if="user.bio" class="bio-text">{{ user.bio }}</p>
            <p v-else class="text-muted">Aún no has agregado una descripción.</p>
          </section>

          <section class="content-card">
            <div class="section-header">
              <h3>Portafolio de Trabajos</h3>
            </div>
            
            <div class="portfolio-grid">
              
              <div v-for="work in user.portfolio" :key="work.id" class="portfolio-item group">
                <div class="portfolio-img-wrapper">
                  <img :src="work.image" alt="Trabajo">
                  <button class="btn-edit-post" @click.stop="editPost(work.id)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                </div>
                <div class="portfolio-info">
                  <h4>{{ work.service }}</h4>
                  <p>{{ work.description }}</p>
                </div>
              </div>

              <div class="portfolio-item add-new-card" @click="goToCreatePost">
                <div class="plus-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                <span>Agregar Trabajo</span>
              </div>

            </div>
          </section>

        </div>

        <div class="side-column">
          
          <div class="content-card side-card">
            <h3>Detalles Profesionales</h3>
            <div class="detail-row">
              <span class="label">Experiencia:</span>
              <span class="value">{{ user.experience ? user.experience + ' Años' : '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Horario:</span>
              <span class="value">{{ user.workingHours || '-' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Teléfono:</span>
              <span class="value link">{{ user.phone || '-' }}</span>
            </div>
          </div>

          <div class="content-card side-card">
            <h3>Habilidades</h3>
            <div class="skills-container">
              <span v-for="(skill, index) in formattedSkills" :key="index" class="skill-tag">
                {{ skill }}
              </span>
              <span v-if="formattedSkills.length === 0" class="text-muted">Sin habilidades registradas</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  </div>
</template>

<style scoped>
/* ESTRUCTURA */
.profile-view { width: 100%; padding-bottom: 50px; }
.profile-container { max-width: 1100px; margin: 0 auto; }

/* HEADER */
.profile-header { background: white; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; margin-bottom: 24px; position: relative; }
.cover-image { height: 200px; background-size: cover; background-position: center; background-color: #E2E8F0; } /* Fondo gris por defecto */
.header-body { padding: 0 30px 25px 30px; display: flex; align-items: flex-end; gap: 20px; margin-top: -60px; position: relative; }

.avatar-container { width: 130px; height: 130px; border-radius: 50%; border: 4px solid white; background: #fff; overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder { width: 100%; height: 100%; background: #0B4C6F; color: white; display: flex; align-items: center; justify-content: center; }

.header-info { flex: 1; padding-bottom: 5px; padding-top: 65px; } 
.main-info h1 { margin: 0; font-size: 1.8rem; font-weight: 800; color: #111; line-height: 1.2; }
.pro-badge { background: #0B4C6F; color: white; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; font-weight: 600; vertical-align: middle; margin-left: 10px; }
.profession-title { margin: 2px 0 8px 0; font-size: 1.1rem; color: #4B5563; font-weight: 500; }
.meta-row { display: flex; gap: 15px; color: #6B7280; font-size: 0.9rem; }
.meta-item { display: flex; align-items: center; gap: 6px; }

.header-actions { padding-bottom: 10px; }
.btn-edit { display: flex; align-items: center; gap: 8px; border: 1px solid #D1D5DB; background: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; color: #374151; cursor: pointer; transition: 0.2s; }
.btn-edit:hover { background: #F3F4F6; border-color: #0B4C6F; color: #0B4C6F; }

/* GRID */
.profile-grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }

/* CARTAS */
.content-card { background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
.content-card h3 { margin: 0 0 16px 0; font-size: 1.1rem; font-weight: 700; color: #111; border-bottom: 1px solid #F3F4F6; padding-bottom: 10px; }
.bio-text { line-height: 1.6; color: #4B5563; white-space: pre-line; }

/* PORTAFOLIO GRID */
.portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }

.portfolio-item { border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; transition: 0.2s; position: relative; background: white; }
.portfolio-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px); }

.portfolio-img-wrapper { height: 140px; overflow: hidden; position: relative; background: #f0f0f0; }
.portfolio-img-wrapper img { width: 100%; height: 100%; object-fit: cover; }

/* Botón flotante editar post */
.btn-edit-post { position: absolute; top: 8px; right: 8px; background: white; border: 1px solid #ddd; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0; transition: 0.2s; color: #555; }
.portfolio-item:hover .btn-edit-post { opacity: 1; }
.btn-edit-post:hover { background: #0B4C6F; border-color: #0B4C6F; color: white; }

.portfolio-info { padding: 12px; }
.portfolio-info h4 { margin: 0 0 4px 0; font-size: 0.95rem; font-weight: 700; color: #333; }
.portfolio-info p { margin: 0; font-size: 0.85rem; color: #666; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* CARD AGREGAR */
.add-new-card { border: 2px dashed #CBD5E1; background: #F8FAFC; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; height: 100%; min-height: 220px; color: #64748B; transition: 0.2s; }
.add-new-card:hover { border-color: #0B4C6F; color: #0B4C6F; background: #F0F9FF; }
.add-new-card span { font-weight: 600; margin-top: 8px; font-size: 0.9rem; }

/* DETALLES SIDEBAR */
.side-card { padding: 20px; }
.detail-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem; border-bottom: 1px dashed #F3F4F6; padding-bottom: 8px; }
.detail-row:last-child { border: none; }
.detail-row .label { color: #6B7280; font-weight: 500; }
.detail-row .value { color: #111; font-weight: 600; text-align: right; max-width: 60%; }
.link { color: #0B4C6F; cursor: pointer; }

/* SKILLS */
.skills-container { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-tag { background: #F0F9FF; color: #0B4C6F; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; border: 1px solid #E0F2FE; }
.text-muted { color: #999; font-style: italic; font-size: 0.85rem; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .profile-grid-layout { grid-template-columns: 1fr; }
  .header-body { flex-direction: column; align-items: center; text-align: center; margin-top: -65px; }
  .header-info { padding-top: 10px; }
}

.loading-state { text-align: center; padding: 50px; }
.spinner { border: 4px solid #f3f3f3; border-top: 4px solid #0B4C6F; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>