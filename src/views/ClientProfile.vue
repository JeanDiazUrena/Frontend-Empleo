<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession'; 

const router = useRouter();
const { state, updateProfile } = useUserSession(); 

// --- ESTADO LOCAL ---
const user = ref({ 
  name: "", 
  email: "", 
  phone: "", 
  location: "", 
  avatar: "", 
  banner: "", 
  joinDate: "" 
});

const isEditing = ref(false);
const tempUser = ref({}); 
const activeTab = ref('info');
const isLoadingLocation = ref(false);
const serviceHistory = ref([]); 

// Archivos
const avatarFile = ref(null);
const bannerFile = ref(null);

// Referencias DOM
const avatarInput = ref(null);
const bannerInput = ref(null);

const isProfileIncomplete = computed(() => !user.value.phone || !user.value.location);

// --- 1. CARGAR DATOS ---
onMounted(async () => {
  const userId = state.user?.id || localStorage.getItem('usuario_id');
  
  if (!userId) { 
    router.push('/login'); 
    return; 
  }

  // Carga inicial rápida
  user.value = { ...state.user };

  try {
    const { data } = await axios.get(`http://localhost:3001/api/clientes/${userId}`);
    
    if (data) {
      // ACTUALIZAR ESTADO LOCAL Y GLOBAL CON DATOS DE BD
      const userData = {
        name: data.nombre || state.user.name,
        email: data.email || state.user.email,
        phone: data.telefono || "",
        location: data.direccion || "",
        avatar: data.avatar || "", 
        banner: data.banner || "", 
        id: userId
      };

      user.value = { ...userData };
      updateProfile(userData); // Actualiza el cerebro global
    } else {
      startEditing();
    }
  } catch (error) {
    console.error("Error conectando con el servidor:", error);
  }
});

const startEditing = () => {
  tempUser.value = { ...user.value };
  avatarFile.value = null;
  bannerFile.value = null;
  isEditing.value = true;
  activeTab.value = 'info'; 
};

const cancelEditing = () => {
  isEditing.value = false;
};

// --- IMÁGENES ---
const handleImageChange = (event, type) => {
  const file = event.target.files[0];
  if (file) {
    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      tempUser.value.avatar = previewUrl; 
      avatarFile.value = file; 
    } else if (type === 'banner') {
      tempUser.value.banner = previewUrl; 
      bannerFile.value = file; 
    }
  }
};

const triggerAvatarUpload = () => avatarInput.value.click();
const triggerBannerUpload = () => bannerInput.value.click();

// --- GEOLOCALIZACIÓN ---
const detectLocation = () => {
  if (!navigator.geolocation) return alert("GPS no soportado");
  isLoadingLocation.value = true;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      tempUser.value.location = `Ubicación GPS (Lat: ${pos.coords.latitude.toFixed(4)})`;
      isLoadingLocation.value = false;
    },
    () => { isLoadingLocation.value = false; alert("Error al obtener ubicación"); }
  );
};

// --- GUARDAR (SOLUCIÓN DEFINITIVA) ---
const saveChanges = async () => {
  if (!tempUser.value.name || !tempUser.value.phone) {
    alert("Nombre y Teléfono son obligatorios.");
    return;
  }

  try {
    const formData = new FormData();
    // Usamos el ID del estado global o del localStorage
    const currentId = state.user?.id || localStorage.getItem('usuario_id');
    
    formData.append('usuario_id', currentId);
    formData.append('nombre', tempUser.value.name);
    formData.append('email', tempUser.value.email);
    formData.append('phone', tempUser.value.phone);
    formData.append('location', tempUser.value.location);

    if (avatarFile.value) formData.append('avatar', avatarFile.value);
    if (bannerFile.value) formData.append('banner', bannerFile.value);

    // 1. ENVIAR AL BACKEND
    const response = await axios.post('http://localhost:3001/api/clientes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // 2. RECUPERAR DATOS ACTUALIZADOS DEL SERVIDOR
    const updatedClient = response.data.cliente;

    if (updatedClient) {
        const newData = {
            name: updatedClient.nombre,
            email: updatedClient.email,
            phone: updatedClient.telefono,
            location: updatedClient.direccion,
            avatar: updatedClient.avatar, // URL real del servidor
            banner: updatedClient.banner, // URL real del servidor
            id: currentId
        };

        // Actualizamos Local y Global
        user.value = { ...newData };
        updateProfile(newData); 
    }

    isEditing.value = false;
    alert("¡Guardado exitosamente!");

  } catch (error) {
    console.error("Error al guardar:", error);
    alert("Error al conectar con el servidor.");
  }
};

const goToExplore = () => router.push('/client/explore');
</script>

<template>
  <div class="profile-layout">
    
    <div class="profile-header-card">
      <div class="banner-area" :style="(isEditing ? tempUser.banner : user.banner) ? { backgroundImage: `url(${isEditing ? tempUser.banner : user.banner})` } : {}">
        
        <button v-if="isEditing" class="btn-camera banner-cam" title="Cambiar portada" @click="triggerBannerUpload">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
        </button>
        <input type="file" ref="bannerInput" class="hidden" accept="image/*" @change="(e) => handleImageChange(e, 'banner')">
      </div>

      <div class="header-content">
        <div class="avatar-wrapper">
          <div class="avatar-circle" :class="{ 'editable': isEditing }" @click="isEditing ? triggerAvatarUpload() : null">
            <img v-if="(isEditing ? tempUser.avatar : user.avatar)" :src="isEditing ? tempUser.avatar : user.avatar" class="avatar-img">
            <div v-else class="avatar-placeholder-icon">
               <span style="font-size: 3rem; font-weight: bold; color: #ccc;">
                 {{ (isEditing ? tempUser.name : user.name)?.charAt(0).toUpperCase() || 'U' }}
               </span>
            </div>
            <div v-if="isEditing" class="avatar-overlay">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2" class="icon-cam"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /></svg>
            </div>
          </div>
          <input type="file" ref="avatarInput" class="hidden" accept="image/*" @change="(e) => handleImageChange(e, 'avatar')">
        </div>

        <div class="user-text">
          <div class="name-badge">
            <h1>{{ isEditing ? (tempUser.name || 'Sin Nombre') : (user.name || 'Usuario Nuevo') }}</h1>
            <span class="client-badge">Cliente</span>
          </div>
          <div class="meta-info">
            <span class="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-tiny" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              {{ isEditing ? (tempUser.location || 'Sin ubicación') : (user.location || 'Sin ubicación') }}
            </span>
          </div>
        </div>

        <div class="header-actions">
          <button v-if="!isEditing" class="btn-primary-outline" @click="startEditing">
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
        <div class="stat-item">
          <strong>0</strong>
          <span>Guardados</span>
        </div>
      </div>
    </div>

    <div class="profile-grid">
      
      <div class="left-nav">
        <button class="nav-item" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" /></svg>
          Información Personal
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
          <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          Historial de Solicitudes
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'reviews' }" @click="activeTab = 'reviews'">
          <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
          Reseñas Dadas
        </button>
      </div>

      <div class="right-content">
        
        <div v-if="activeTab === 'info'">
          <div class="panel-header">
            <h3>Datos de Contacto</h3>
            <p v-if="isProfileIncomplete && !isEditing" class="warning-text">⚠️ Completa tu perfil para mejorar tu experiencia.</p>
          </div>

          <form v-if="isEditing" @submit.prevent="saveChanges" class="info-form">
            <div class="form-group">
              <label>Nombre Completo</label>
              <input v-model="tempUser.name" type="text" class="form-input" placeholder="Ej. Juan Pérez">
            </div>
            <div class="form-group">
              <label>Correo Electrónico</label>
              <input v-model="tempUser.email" type="email" class="form-input" placeholder="correo@ejemplo.com">
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input v-model="tempUser.phone" type="tel" class="form-input" placeholder="809-000-0000" required>
            </div>
            
            <div class="form-group full-width">
              <label>Dirección Principal</label>
              <div class="input-icon-wrap">
                <svg class="icon-input" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                <input v-model="tempUser.location" type="text" class="form-input with-icon" placeholder="Calle, Sector, Ciudad" required>
                <button type="button" @click="detectLocation" class="btn-location" :disabled="isLoadingLocation">
                  {{ isLoadingLocation ? '...' : '📍 GPS' }}
                </button>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel" @click="cancelEditing">Cancelar</button>
              <button type="submit" class="btn-save">Guardar Cambios</button>
            </div>
          </form>

          <div v-else class="info-display">
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">{{ user.name || '---' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">{{ user.email || '---' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Teléfono:</span>
              <span class="value">{{ user.phone || '---' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Dirección:</span>
              <span class="value">{{ user.location || '---' }}</span>
            </div>
            
            <div v-if="isProfileIncomplete" class="empty-data-msg">
              <p>Aún no has llenado tus datos.</p>
              <button class="btn-small" @click="startEditing">Llenar ahora</button>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'history'">
          <div class="panel-header"><h3>Historial de Servicios</h3></div>
          <div v-if="serviceHistory.length === 0" class="empty-state-panel">
            <div class="empty-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
            </div>
            <h4>No tienes solicitudes previas</h4>
            <p>Cuando contrates un servicio, aparecerá aquí detallado.</p>
            <button class="btn-action" @click="goToExplore">Buscar Profesionales</button>
          </div>
        </div>

        <div v-if="activeTab === 'reviews'">
          <div class="panel-header"><h3>Tus Reseñas</h3></div>
          <div class="empty-state-panel">
            <div class="empty-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
            </div>
            <p>Aún no has calificado a ningún profesional.</p>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* RESET */
.profile-layout { width: 100%; max-width: 1000px; margin: 0 auto; padding-bottom: 50px; }
.hidden { display: none; }
.icon-sm { width: 18px; height: 18px; margin-right: 6px; }
.icon-tiny { width: 14px; height: 14px; margin-right: 4px; }

/* HEADER CARD */
.profile-header-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 24px; }
.banner-area { height: 180px; background-color: #CBD5E1; background-size: cover; background-position: center; position: relative; }
.banner-cam { position: absolute; top: 20px; right: 20px; background: white; padding: 8px; border-radius: 50%; border: none; cursor: pointer; color: #555; box-shadow: 0 2px 5px rgba(0,0,0,0.1); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.banner-cam:hover { transform: scale(1.05); }

.header-content { padding: 0 30px 20px 30px; display: flex; align-items: flex-end; gap: 20px; margin-top: -50px; position: relative; }
.avatar-circle { width: 120px; height: 120px; background: white; border: 4px solid white; border-radius: 50%; overflow: hidden; position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-placeholder-icon { color: #ccc; width: 60px; height: 60px; display:flex; align-items: center; justify-content: center; }
.avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.icon-cam { width: 30px; height: 30px; color: white; }
.editable { cursor: pointer; }

.user-text { flex: 1; padding-top: 10px; }
.name-badge { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
.name-badge h1 { margin: 0; font-size: 1.8rem; font-weight: 800; color: #111; }
.client-badge { background: #E0F2FE; color: #0B4C6F; font-size: 0.75rem; padding: 2px 8px; border-radius: 20px; font-weight: 700; text-transform: uppercase; }
.meta-info { display: flex; gap: 20px; color: #666; font-size: 0.9rem; }
.meta-item { display: flex; align-items: center; }

.header-actions { padding-top: 15px; }
.btn-primary-outline { display: flex; align-items: center; border: 1px solid #0B4C6F; color: #0B4C6F; background: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-primary-outline:hover { background: #F0F9FF; }

/* STATS */
.stats-bar { display: flex; border-top: 1px solid #eee; padding: 15px 30px; gap: 40px; }
.stat-item { display: flex; flex-direction: column; }
.stat-item strong { font-size: 1.1rem; color: #111; }
.stat-item span { font-size: 0.85rem; color: #666; }

/* MAIN GRID */
.profile-grid { display: grid; grid-template-columns: 260px 1fr; gap: 24px; }

/* LEFT NAV */
.left-nav { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; height: fit-content; }
.nav-item { width: 100%; text-align: left; padding: 15px 20px; background: none; border: none; border-bottom: 1px solid #eee; cursor: pointer; font-size: 0.95rem; color: #555; display: flex; align-items: center; transition: 0.2s; font-weight: 500; }
.nav-item:last-child { border-bottom: none; }
.nav-item:hover { background: #f9fafb; color: #0B4C6F; }
.nav-item.active { background: #E0F2FE; color: #0B4C6F; font-weight: 700; border-left: 4px solid #0B4C6F; }
.nav-icon { width: 24px; height: 24px; margin-right: 10px; } /* AQUI ARREGLAMOS LOS ICONOS GIGANTES */

/* RIGHT CONTENT */
.right-content { background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 30px; min-height: 400px; }
.panel-header { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
.panel-header h3 { margin: 0; font-size: 1.3rem; color: #333; }
.warning-text { color: #F76B1C; font-size: 0.9rem; margin: 5px 0 0 0; }

/* INFO DISPLAY */
.info-row { display: flex; margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 8px; }
.info-row .label { width: 120px; font-weight: 600; color: #666; }
.info-row .value { color: #111; font-weight: 500; }
.empty-data-msg { text-align: center; margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
.btn-small { background: #0B4C6F; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; margin-top: 10px; }

/* FORMULARIO */
.info-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full-width { grid-column: span 2; }
.form-group label { font-size: 0.85rem; font-weight: 700; color: #444; }
.form-input { padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; width: 100%; font-size: 0.95rem; }
.form-input:focus { outline: none; border-color: #0B4C6F; box-shadow: 0 0 0 3px rgba(11, 76, 111, 0.1); }
.input-icon-wrap { position: relative; }
.icon-input { position: absolute; left: 10px; top: 10px; width: 20px; color: #999; }
.form-input.with-icon { padding-left: 38px; }



.form-actions { grid-column: span 2; display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
.btn-save { background: #0B4C6F; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-cancel { background: white; border: 1px solid #ccc; color: #555; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }

/* EMPTY STATES */
.empty-state-panel { text-align: center; padding: 40px 20px; color: #666; }
.empty-icon-box { width: 60px; height: 60px; background: #f3f4f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; color: #999; }
.empty-icon-box svg { width: 30px; height: 30px; }
.empty-state-panel h4 { margin: 0 0 5px 0; color: #333; font-size: 1.1rem; }
.empty-state-panel p { margin: 0 0 20px 0; font-size: 0.95rem; }
.btn-action { background: white; border: 1px solid #0B4C6F; color: #0B4C6F; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-action:hover { background: #F0F9FF; }
</style>