<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; 

const router = useRouter();

// DATOS DEL PROFESIONAL (Expandidos)
const user = ref({
  name: "Wilson Montero",
  headline: "Técnico Especialista en Electricidad y Refrigeración Residencial",
  location: "Santiago, República Dominicana",
  email: "wilson.pro@servihub.com",
  phone: "829-555-0192",
  website: "www.wilsonrepara.com",
  bio: "Profesional con más de 8 años de experiencia en instalaciones eléctricas y mantenimiento de aires acondicionados. Me especializo en diagnósticos rápidos y soluciones duraderas. Certificado por INFOTEP.",
  availability: "Lunes a Sábado, 8:00 AM - 6:00 PM",
  avatar: "", 
  banner: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80",
  rating: "4.9/5.0",
  jobs: 124,
  skills: ['Electricidad Residencial', 'Instalación de Aires', 'Reparación de Fugas', 'Mantenimiento Preventivo'],
  certifications: ['Técnico Electricista INFOTEP', 'Certificación HVAC Nivel 2']
});

const isEditing = ref(false);
const tempUser = ref({}); 

const startEditing = () => { tempUser.value = { ...user.value }; isEditing.value = true; };
const saveChanges = () => { user.value = { ...tempUser.value }; isEditing.value = false; };
const cancelEditing = () => isEditing.value = false;

// NAVEGACIÓN
const goToDashboard = () => router.push('/professional-dashboard');
const goToChat = () => router.push('/professional-chat'); 
const goToProfile = () => router.push('/professional-profile'); 
</script>

<template>
  <div class="dashboard-layout">
    <nav class="navbar">
      <div class="nav-brand" @click="goToDashboard" style="cursor: pointer;">
        SERVIHUB <span class="pro-badge">PRO</span>
      </div>
      <div class="nav-profile clickable" @click="goToProfile">
        <span class="nav-user-name" v-if="!isEditing">{{ user.name }}</span>
        <div class="avatar-placeholder-sm"></div>
      </div>
    </nav>

    <div class="custom-container">
      <aside class="sidebar-left">
        <ul class="menu-list">
          <li @click="goToDashboard"><span class="icon">📋</span> Solicitudes</li>
          <li @click="goToChat"><span class="icon">💬</span> Mensajes</li>
          <li class="active" @click="goToProfile"><span class="icon">👤</span> Mi Perfil</li>
        </ul>
      </aside>

      <main class="custom-content">
        <div class="profile-grid">
          
          <div class="main-col">
            
            <div class="card profile-header-card">
              <div class="banner-area" :style="{ backgroundImage: `url(${user.banner})` }">
                <button class="btn-edit-banner">Cambiar portada</button>
              </div>
              <div class="profile-content-pad">
                <div class="avatar-wrapper">
                  <div class="profile-avatar-big-placeholder">WM</div>
                </div>
                
                <div class="info-header">
                   <div class="name-verified-row">
                     <h1>{{ user.name }}</h1>
                     <span class="verified-tag">Verificado</span>
                   </div>
                   <p class="headline">{{ user.headline }}</p>
                   <p class="location-text">{{ user.location }}</p>
                </div>

                <div class="actions-toolbar">
                  <button v-if="!isEditing" class="btn-primary-outline" @click="startEditing">Editar perfil</button>
                  <button class="btn-secondary-outline">Compartir</button>
                </div>

                <div v-if="isEditing" class="edit-form-overlay">
                    <h3>Editando Información Básica</h3>
                    <label>Nombre</label>
                    <input v-model="tempUser.name" class="clean-input">
                    <label>Titular</label>
                    <input v-model="tempUser.headline" class="clean-input">
                    <label>Biografía (Sobre Mí)</label>
                    <textarea v-model="tempUser.bio" class="clean-textarea" rows="3"></textarea>
                    <div class="edit-actions">
                      <button @click="cancelEditing" class="btn-cancel">Cancelar</button>
                      <button @click="saveChanges" class="btn-save">Guardar Cambios</button>
                    </div>
                  </div>

              </div>

              <div class="stats-contact-bar">
                <div class="stat-item">
                  <span class="stat-label">Calificación</span>
                  <span class="stat-value">{{ user.rating }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Trabajos</span>
                  <span class="stat-value">{{ user.jobs }} Completados</span>
                </div>
                <div class="contact-divider"></div>
                 <div class="contact-item">
                  <svg xmlns="http://www.w3.org/2000/svg" class="contact-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                  <span>{{ user.phone }}</span>
                </div>
                <div class="contact-item">
                  <svg xmlns="http://www.w3.org/2000/svg" class="contact-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" /></svg>
                  <a :href="'http://' + user.website" target="_blank" class="web-link">{{ user.website }}</a>
                </div>
              </div>
            </div>

            <div class="card section-card">
              <h3>Sobre Mí</h3>
              <p class="bio-text">{{ user.bio }}</p>
              
              <div class="availability-box">
                <span class="avail-label">Horario de Disponibilidad:</span>
                <span class="avail-value">{{ user.availability }}</span>
              </div>
            </div>

            <div class="card section-card">
              <div class="section-header-row">
                <h3>Portafolio de Trabajos</h3>
                <button class="btn-text-action">Gestionar</button>
              </div>
              <div class="portfolio-grid">
                <div class="portfolio-item add-new">
                  <span class="plus-icon">+</span> Add
                </div>
                <div class="portfolio-item" style="background-image: url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&q=80');"></div>
                <div class="portfolio-item" style="background-image: url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=300&q=80');"></div>
              </div>
            </div>

          </div>

          <div class="side-col">
            
            <div class="card side-card">
              <h3>Habilidades y Especialidades</h3>
              <div class="tags-container">
                <span v-for="skill in user.skills" :key="skill" class="skill-tag">{{ skill }}</span>
              </div>
            </div>

             <div class="card side-card">
              <h3>Certificaciones</h3>
              <ul class="cert-list">
                <li v-for="cert in user.certifications" :key="cert">
                  <span class="cert-icon">📜</span> {{ cert }}
                </li>
              </ul>
            </div>

          </div>

        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* --- ESTRUCTURA BASE (Minimalista) --- */
.custom-container { margin-left: 260px; padding: 2rem; display: block; background: #F8F9FA; min-height: 100vh; }
.custom-content { max-width: 1000px; margin: 0 auto; }
.profile-grid { display: grid; grid-template-columns: 2.5fr 1fr; gap: 24px; align-items: start; }

/* --- TARJETAS GENÉRICAS (Diseño Plano y Limpio) --- */
.card {
  background: white;
  border-radius: 8px;
  border: 1px solid #E5E7EB; /* Borde gris muy suave */
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); /* Sombra casi invisible */
  margin-bottom: 24px;
  overflow: hidden;
}
.section-card, .side-card { padding: 24px; }
h3 { margin: 0 0 16px 0; font-size: 1.1rem; font-weight: 700; color: #111; }

/* --- HEADER DEL PERFIL --- */
.banner-area { height: 160px; background-size: cover; background-position: center; position: relative; background-color: #E5E7EB; }
.btn-edit-banner { 
  position: absolute; top: 16px; right: 16px; 
  background: rgba(255,255,255,0.9); border: 1px solid #ccc; 
  padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; color: #555;
}

.profile-content-pad { padding: 0 24px 24px; }
.avatar-wrapper { margin-top: -60px; margin-bottom: 16px; }
.profile-avatar-big-placeholder {
  width: 120px; height: 120px; background: #0B4C6F; border: 4px solid white; 
  border-radius: 50%; color: white; display: flex; align-items: center; 
  justify-content: center; font-size: 2.5rem; font-weight: 700;
}

.name-verified-row { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.name-verified-row h1 { font-size: 1.8rem; margin: 0; font-weight: 700; color: #111; }
.verified-tag { 
  background: #E0F2FE; color: #0B4C6F; font-size: 0.75rem; 
  padding: 4px 8px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
}

.headline { font-size: 1.1rem; color: #333; margin: 0 0 8px 0; line-height: 1.4; }
.location-text { font-size: 0.9rem; color: #777; margin: 0 0 20px 0; }

.actions-toolbar { display: flex; gap: 12px; margin-bottom: 10px; }
.btn-primary-outline, .btn-secondary-outline {
  background: white; border: 1px solid #0B4C6F; color: #0B4C6F;
  padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 0.9rem;
}
.btn-primary-outline:hover { background: #F0F9FF; }
.btn-secondary-outline { border-color: #ccc; color: #555; }
.btn-secondary-outline:hover { border-color: #999; color: #333; }

/* --- BARRA DE ESTADÍSTICAS Y CONTACTO (NUEVA) --- */
.stats-contact-bar {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: #F9FAFB;
  border-top: 1px solid #E5E7EB;
  gap: 24px;
  font-size: 0.9rem;
}
.stat-item { display: flex; flex-direction: column; }
.stat-label { font-size: 0.8rem; color: #777; }
.stat-value { font-weight: 700; color: #111; }
.contact-divider { width: 1px; height: 30px; background: #E5E7EB; }
.contact-item { display: flex; align-items: center; gap: 8px; color: #555; }
.contact-icon { width: 18px; height: 18px; color: #9CA3AF; }
.web-link { color: #0B4C6F; text-decoration: none; font-weight: 600; }

/* --- SECCIÓN SOBRE MÍ (NUEVA) --- */
.bio-text { color: #444; line-height: 1.6; margin-bottom: 20px; }
.availability-box { display: flex; gap: 10px; align-items: center; background: #F3F4F6; padding: 12px; border-radius: 6px; }
.avail-label { font-weight: 600; color: #555; font-size: 0.9rem; }
.avail-value { color: #0B4C6F; font-weight: 600; }

/* --- PORTAFOLIO (MINIMALISTA) --- */
.section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.btn-text-action { background: none; border: none; color: #0B4C6F; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
.portfolio-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.portfolio-item { aspect-ratio: 1; border-radius: 6px; background-size: cover; background-position: center; background-color: #eee; }
.add-new { border: 1px dashed #ccc; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; color: #777; font-size: 0.8rem; background: #F9FAFB; }
.plus-icon { font-size: 1.5rem; margin-bottom: 5px; color: #ccc; }

/* --- SIDEBAR --- */
.tags-container { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-tag { background: white; border: 1px solid #E5E7EB; color: #555; padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 500; }
.cert-list { list-style: none; padding: 0; margin: 0; }
.cert-list li { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 0.9rem; color: #555; display: flex; gap: 10px; }
.cert-list li:last-child { border-bottom: none; }
.cert-icon { font-size: 1.1rem; }

/* --- FORMULARIO EDICIÓN (LIMPIO) --- */
.edit-form-overlay { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; }
.edit-form-overlay label { display: block; margin-bottom: 5px; font-size: 0.85rem; font-weight: 600; color: #555; }
.clean-input, .clean-textarea { display: block; width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.95rem; font-family: inherit; }
.clean-input:focus, .clean-textarea:focus { outline: none; border-color: #0B4C6F; }
.edit-actions { display: flex; gap: 10px; margin-top: 10px; }
.btn-save { flex: 1; background: #0B4C6F; color: white; border: none; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-cancel { flex: 1; background: white; border: 1px solid #ccc; color: #555; padding: 10px; border-radius: 6px; font-weight: 600; cursor: pointer; }

/* Badge y Avatars del Nav */
.avatar-placeholder-sm { width: 32px; height: 32px; background: #ddd; border-radius: 50%; }
.pro-badge { background: #0B4C6F; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; vertical-align: middle; margin-left: 5px; }
</style>