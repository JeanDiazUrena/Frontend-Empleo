<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; 

const router = useRouter();

// DATOS DEL USUARIO (Reactivos)
const user = ref({
  name: "Jean Luis",
  headline: "Cliente Premium • Buscando expertos en Remodelación",
  location: "Santiago, República Dominicana",
  email: "jean@gmail.com",
  avatar: "https://i.pravatar.cc/150?u=jean",
  banner: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1000&q=80"
});

// ESTADO DE EDICIÓN
const isEditing = ref(false);
const tempUser = ref({}); 

// Referencias para los inputs de archivos (ocultos)
const bannerInput = ref(null);
const avatarInput = ref(null);

// --- FUNCIONES DE EDICIÓN ---
const startEditing = () => {
  tempUser.value = { ...user.value }; 
  isEditing.value = true;
};

const saveChanges = () => {
  user.value = { ...tempUser.value };
  isEditing.value = false;
  // Aquí podrías agregar una alerta: alert("Datos guardados correctamente");
};

const cancelEditing = () => {
  isEditing.value = false;
};

// --- FUNCIONES DE FOTOS ---
// 1. Abrir selector de archivos
const triggerBannerUpload = () => bannerInput.value.click();
const triggerAvatarUpload = () => avatarInput.value.click();

// 2. Procesar cambio de Portada
const handleBannerChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Creamos una URL temporal para ver la imagen inmediatamente
    user.value.banner = URL.createObjectURL(file);
  }
};

// 3. Procesar cambio de Avatar
const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    user.value.avatar = URL.createObjectURL(file);
  }
};

// NAVEGACIÓN
const goToDashboard = () => router.push('/client-dashboard');
const goToExplore = () => router.push('/client-explore'); 
const goToChat = () => router.push('/client-chat'); 
const goToProfile = () => router.push('/client-profile'); 
</script>

<template>
  <div class="dashboard-layout">
    
    <nav class="navbar">
      <div class="nav-brand" @click="router.push('/')" style="color: #F76B1C; cursor: pointer;">
        SERVIHUB
      </div>
      <div class="nav-search">
         <input type="text" placeholder="Buscar..." readonly>
      </div>
      <div class="nav-profile clickable" @click="goToProfile">
        <img :src="user.avatar" class="nav-avatar">
      </div>
    </nav>

    <div class="custom-container">
      
      <aside class="sidebar-left">
        <ul class="menu-list">
          <li @click="goToDashboard"><span class="icon">🏠</span> Inicio</li>
          <li @click="goToExplore"><span class="icon">🔍</span> Explorar</li>
          <li @click="goToChat"><span class="icon">💬</span> Mensajes</li>
          <li class="active" @click="goToProfile"><span class="icon">👤</span> Mi Perfil</li>
        </ul>
        <div class="action-area">
           <button @click="router.push('/request-service')" class="btn-create-post" style="background-color: #0B4C6F;">+ Pedir Servicio</button>
        </div>
      </aside>

      <main class="custom-content">
        
        <div class="linkedin-grid">
          
          <div class="main-col">
            
            <div class="profile-card">
              <div class="banner-area" :style="{ backgroundImage: `url(${user.banner})` }">
                <button class="btn-camera" title="Cambiar portada" @click="triggerBannerUpload">📷</button>
                <input type="file" ref="bannerInput" class="hidden-input" accept="image/*" @change="handleBannerChange">
              </div>

              <div class="profile-info-padding">
                <div class="avatar-wrapper">
                  <div class="avatar-container-editable" @click="triggerAvatarUpload">
                    <img :src="user.avatar" class="profile-avatar-big">
                    <div class="avatar-overlay">📷</div>
                  </div>
                  <input type="file" ref="avatarInput" class="hidden-input" accept="image/*" @change="handleAvatarChange">
                </div>

                <div class="info-content">
                  
                  <div v-if="!isEditing" class="view-mode">
                    <div class="name-row">
                      <h1>{{ user.name }}</h1>
                      <span class="badge-verify">Verificado</span>
                    </div>
                    <p class="headline">{{ user.headline }}</p>
                    <p class="location-text">{{ user.location }} • <a href="#">{{ user.email }}</a></p>
                    
                    <div class="action-buttons">
                      <button class="btn-primary-lkd">Tengo interés en...</button>
                      <button class="btn-secondary-lkd" @click="startEditing">Editar perfil</button>
                    </div>
                  </div>

                  <div v-else class="edit-mode">
                    <label class="edit-label">Nombre Completo</label>
                    <input v-model="tempUser.name" placeholder="Nombre" class="input-lkd">
                    
                    <label class="edit-label">Titular (Headline)</label>
                    <input v-model="tempUser.headline" placeholder="Titular" class="input-lkd">
                    
                    <label class="edit-label">Ubicación</label>
                    <input v-model="tempUser.location" placeholder="Ubicación" class="input-lkd">
                    
                    <label class="edit-label">Correo Electrónico</label>
                    <input v-model="tempUser.email" placeholder="Email" class="input-lkd">

                    <div class="edit-actions">
                      <button @click="saveChanges" class="btn-primary-lkd">Guardar Cambios</button>
                      <button @click="cancelEditing" class="btn-secondary-lkd">Cancelar</button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div class="section-card">
              <h3>Sugerencias para ti</h3>
              <div class="suggestion-box">
                <div class="icon-bulb">💡</div>
                <div class="suggestion-text">
                  <strong>Completa tu perfil</strong>
                  <p>Los clientes con foto de perfil tienen 3x más respuestas de profesionales.</p>
                </div>
              </div>
            </div>

            <div class="section-card">
              <h3>Actividad Reciente</h3>
              <div class="empty-activity">
                <p>No has realizado pedidos recientes.</p>
                <button class="btn-text">Mostrar todo</button>
              </div>
            </div>

          </div>

          <div class="side-col">
            <div class="side-card">
              <div class="side-header">
                <h3>Idioma del perfil</h3>
                <span class="edit-icon">✎</span>
              </div>
              <p class="side-text">Español</p>
              <div class="divider"></div>
              <div class="side-header">
                <h3>Perfil público y URL</h3>
                <span class="edit-icon">✎</span>
              </div>
              <p class="side-text">www.servihub.com/in/jean-luis</p>
            </div>

            <div class="side-card">
              <h3>Profesionales recomendados</h3>
              <div class="people-list">
                <div class="person-item">
                  <div class="person-avatar" style="background: #e0f2fe;">JM</div>
                  <div class="person-info">
                    <strong>Juan M.</strong>
                    <span>Plomero Experto</span>
                    <button class="btn-connect">+ Contactar</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>

    </div>
  </div>
</template>

<style scoped>
/* --- ESTRUCTURA GENERAL --- */
.custom-container { margin-left: 260px; padding: 1.5rem; display: block; min-height: 100vh; background-color: #F3F2EF; }
.custom-content { width: 100%; max-width: 1128px; margin: 0 auto; }
.linkedin-grid { display: grid; grid-template-columns: 3fr 1.2fr; gap: 24px; align-items: start; }
.profile-card, .section-card, .side-card { background: white; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden; margin-bottom: 10px; position: relative; }

/* --- BANNER --- */
.banner-area { height: 200px; background-size: cover; background-position: center; position: relative; background-color: #a0b4b7; }
.btn-camera { position: absolute; top: 20px; right: 20px; background: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; color: #0B4C6F; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
.hidden-input { display: none; } /* Ocultar el input file feo */

/* --- AVATAR EDITABLE --- */
.profile-info-padding { padding: 0 24px 24px 24px; position: relative; }
.avatar-wrapper { margin-top: -100px; margin-bottom: 15px; width: 152px; height: 152px; position: relative; }

.avatar-container-editable {
  width: 100%; height: 100%;
  border-radius: 50%;
  border: 4px solid white;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  background: white;
}
.profile-avatar-big { width: 100%; height: 100%; object-fit: cover; }

/* Overlay de cámara al pasar el mouse sobre el avatar */
.avatar-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 1.5rem;
  opacity: 0; transition: opacity 0.2s;
}
.avatar-container-editable:hover .avatar-overlay { opacity: 1; }

/* --- TEXTOS PERFIL --- */
.name-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
.name-row h1 { font-size: 24px; font-weight: 600; color: #191919; margin: 0; }
.badge-verify { background: #E8F0FE; color: #0B4C6F; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
.headline { font-size: 16px; color: #191919; margin-bottom: 8px; }
.location-text { font-size: 14px; color: #757575; margin-bottom: 16px; }
.location-text a { color: #0B4C6F; text-decoration: none; font-weight: 600; }

/* --- BOTONES --- */
.action-buttons { display: flex; gap: 10px; }
.btn-primary-lkd { background-color: #0a66c2; color: white; border: none; padding: 6px 16px; border-radius: 24px; font-weight: 600; font-size: 1rem; cursor: pointer; }
.btn-secondary-lkd { background-color: white; color: #0a66c2; border: 1px solid #0a66c2; padding: 6px 16px; border-radius: 24px; font-weight: 600; font-size: 1rem; cursor: pointer; }

/* --- FORMULARIO EDICIÓN --- */
.edit-mode { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #eee; }
.edit-label { display: block; font-size: 0.85rem; font-weight: 600; color: #555; margin-bottom: 4px; margin-top: 10px; }
.input-lkd { display: block; width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 0.95rem; }
.edit-actions { margin-top: 15px; display: flex; gap: 10px; }

/* --- SECCIONES EXTRA --- */
.section-card, .side-card { padding: 20px; }
.section-card h3, .side-card h3 { font-size: 18px; margin: 0 0 15px 0; }
.suggestion-box { border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; display: flex; gap: 15px; background: #f9fafb; }
.icon-bulb { font-size: 24px; }
.suggestion-text p { margin: 5px 0 0; color: #666; font-size: 14px; }
.side-header { display: flex; justify-content: space-between; align-items: center; }
.side-text { color: #666; font-size: 14px; margin-top: 5px; }
.divider { height: 1px; background: #e0e0e0; margin: 15px 0; }
.person-item { display: flex; gap: 10px; margin-bottom: 15px; }
.person-avatar { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #555; }
.person-info { display: flex; flex-direction: column; }
.btn-connect { background: white; border: 1px solid #666; border-radius: 16px; padding: 2px 12px; font-weight: 600; color: #666; cursor: pointer; font-size: 14px; }
</style>