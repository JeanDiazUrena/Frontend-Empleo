<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '@/composables/useUserSession'; // 1. IMPORTAR CEREBRO

const router = useRouter();
const { state, updateProfile } = useUserSession(); // 2. USAR ESTADO GLOBAL

// Variables locales para la interfaz
const isEditing = ref(false);
const activeTab = ref('info');
const isLoadingLocation = ref(false);
const serviceHistory = ref([]); 

// Variables temporales (Solo existen mientras editas)
const tempUser = ref({}); 

// Manejo de Archivos
const avatarFile = ref(null);
const bannerFile = ref(null);
const avatarInput = ref(null);
const bannerInput = ref(null);

// Computado: ¿Falta información crítica?
const isProfileIncomplete = computed(() => !state.user.phone || !state.user.location);

// --- 1. AL CARGAR (Sincronizar Datos) ---
onMounted(async () => {
  const userId = state.user.id;
  
  if (!userId) { 
    router.push('/login'); 
    return; 
  }

  // Cargar datos FRESCOS de la base de datos (Puerto 3001)
  try {
    const { data } = await axios.get(`http://localhost:3001/api/clientes/${userId}`);
    
    if (data) {
      // ACTUALIZAR EL CEREBRO GLOBAL CON DATOS DE BD
      updateProfile({
        name: data.nombre,
        email: data.email,
        phone: data.telefono,
        location: data.direccion,
        avatar: data.avatar,
        // banner: data.banner // Si tu backend maneja banner
      });
    } else {
      // Si el usuario existe en memoria pero no en BD (raro), forzamos edición
      startEditing();
    }
  } catch (error) {
    console.error("Error conectando con el servidor:", error);
  }
});

// --- 2. EDICIÓN ---
const startEditing = () => {
  // Clonamos el estado global a una variable temporal para no romper la UI mientras escribes
  tempUser.value = { ...state.user };
  avatarFile.value = null;
  bannerFile.value = null;
  isEditing.value = true;
  activeTab.value = 'info'; 
};

const cancelEditing = () => {
  isEditing.value = false;
  // Si estaba vacío y canceló, quizas redirigir o dejarlo así
};

// --- 3. IMÁGENES ---
const handleImageChange = (event, type) => {
  const file = event.target.files[0];
  if (file) {
    const previewUrl = URL.createObjectURL(file);
    if (type === 'avatar') {
      tempUser.value.avatar = previewUrl; 
      avatarFile.value = file;
    } else if (type === 'banner') {
      tempUser.value.banner = previewUrl; // (Ojo: asegurar que backend soporte banner)
      bannerFile.value = file;
    }
  }
};

const triggerAvatarUpload = () => avatarInput.value.click();
const triggerBannerUpload = () => bannerInput.value.click();

// --- 4. GEOLOCALIZACIÓN ---
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

// --- 5. GUARDAR (CRÍTICO) ---
const saveChanges = async () => {
  if (!tempUser.value.name || !tempUser.value.phone) {
    alert("Nombre y Teléfono son obligatorios.");
    return;
  }

  try {
    const formData = new FormData();
    formData.append('usuario_id', state.user.id);
    formData.append('nombre', tempUser.value.name);
    formData.append('email', tempUser.value.email);
    formData.append('phone', tempUser.value.phone);
    formData.append('location', tempUser.value.location);

    if (avatarFile.value) formData.append('avatar', avatarFile.value);
    if (bannerFile.value) formData.append('banner', bannerFile.value);

    // ENVIAR AL BACKEND
    await axios.post('http://localhost:3001/api/clientes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // --- LA SOLUCIÓN A TUS ERRORES ---
    // Actualizamos el estado global inmediatamente
    updateProfile({
      name: tempUser.value.name,
      phone: tempUser.value.phone,
      location: tempUser.value.location,
      avatar: tempUser.value.avatar // Nota: Idealmente usar la URL que devuelve el backend
    });

    isEditing.value = false;
    alert("¡Perfil actualizado correctamente!");

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
      <div class="banner-area" :style="(isEditing ? tempUser.banner : state.user.banner) ? { backgroundImage: `url(${isEditing ? tempUser.banner : state.user.banner})` } : {}">
        <button v-if="isEditing" class="btn-camera banner-cam" title="Cambiar portada" @click="triggerBannerUpload">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
        </button>
        <input type="file" ref="bannerInput" class="hidden" accept="image/*" @change="(e) => handleImageChange(e, 'banner')">
      </div>

      <div class="header-content">
        <div class="avatar-wrapper">
          <div class="avatar-circle" :class="{ 'editable': isEditing }" @click="isEditing ? triggerAvatarUpload() : null">
            
            <img v-if="(isEditing ? tempUser.avatar : state.user.avatar)" :src="isEditing ? tempUser.avatar : state.user.avatar" class="avatar-img">
            
            <div v-else class="avatar-placeholder-icon">
               <span style="font-size: 3rem; font-weight: bold; color: #ccc;">
                 {{ (isEditing ? tempUser.name : state.user.name)?.charAt(0).toUpperCase() || 'C' }}
               </span>
            </div>

            <div v-if="isEditing" class="avatar-overlay">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /></svg>
            </div>
          </div>
          <input type="file" ref="avatarInput" class="hidden" accept="image/*" @change="(e) => handleImageChange(e, 'avatar')">
        </div>

        <div class="user-text">
          <div class="name-badge">
            <h1>{{ isEditing ? (tempUser.name || 'Sin Nombre') : (state.user.name || 'Usuario Nuevo') }}</h1>
            <span class="client-badge">Cliente</span>
          </div>
          <div class="meta-info">
            <span class="meta-item">
              <svg xmlns="http://www.w3.org/2000/svg" class="icon-tiny" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
              {{ isEditing ? (tempUser.location || 'Sin ubicación') : (state.user.location || 'Sin ubicación') }}
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
      </div>
    </div>

    <div class="profile-grid">
      
      <div class="left-nav">
        <button class="nav-item" :class="{ active: activeTab === 'info' }" @click="activeTab = 'info'">
          Información Personal
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
          Historial de Solicitudes
        </button>
        <button class="nav-item" :class="{ active: activeTab === 'reviews' }" @click="activeTab = 'reviews'">
          Reseñas Dadas
        </button>
      </div>

      <div class="right-content">
        
        <div v-if="activeTab === 'info'">
          <div class="panel-header">
            <h3>Datos de Contacto</h3>
            <p v-if="isProfileIncomplete && !isEditing" class="warning-text">⚠️ Completa tu perfil para publicar solicitudes.</p>
          </div>

          <form v-if="isEditing" @submit.prevent="saveChanges" class="info-form">
            <div class="form-group">
              <label>Nombre Completo</label>
              <input v-model="tempUser.name" type="text" class="form-input" placeholder="Tu nombre">
            </div>
            <div class="form-group">
              <label>Correo Electrónico</label>
              <input v-model="tempUser.email" type="email" class="form-input" disabled style="background: #f0f0f0;">
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input v-model="tempUser.phone" type="tel" class="form-input" placeholder="809-000-0000" required>
            </div>
            <div class="form-group full-width">
              <label>Dirección Principal</label>
              <div class="input-icon-wrap">
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
              <span class="value">{{ state.user.name || '---' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">{{ state.user.email || '---' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Teléfono:</span>
              <span class="value">{{ state.user.phone || '---' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Dirección:</span>
              <span class="value">{{ state.user.location || '---' }}</span>
            </div>
            
            <div v-if="isProfileIncomplete" class="empty-data-msg">
              <p>Faltan datos importantes.</p>
              <button class="btn-small" @click="startEditing">Llenar ahora</button>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'history'">
          <div class="panel-header"><h3>Historial</h3></div>
          <div class="empty-state-panel">
            <h4>No tienes historial aún</h4>
            <button class="btn-action" @click="goToExplore">Explorar Servicios</button>
          </div>
        </div>

        <div v-if="activeTab === 'reviews'">
          <div class="panel-header"><h3>Reseñas</h3></div>
          <div class="empty-state-panel">
            <p>No has escrito reseñas.</p>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* REUTILIZANDO TUS ESTILOS EXISTENTES PARA MANTENER DISEÑO */
.profile-layout { width: 100%; max-width: 1000px; margin: 0 auto; padding-bottom: 50px; }
.hidden { display: none; }
.icon-sm { width: 18px; height: 18px; margin-right: 6px; }
.icon-tiny { width: 14px; height: 14px; margin-right: 4px; }

.profile-header-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 24px; }
.banner-area { height: 180px; background-color: #CBD5E1; background-size: cover; background-position: center; position: relative; }
.banner-cam { position: absolute; top: 20px; right: 20px; background: white; padding: 8px; border-radius: 50%; border: none; cursor: pointer; color: #555; box-shadow: 0 2px 5px rgba(0,0,0,0.1); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }

.header-content { padding: 0 30px 20px 30px; display: flex; align-items: flex-end; gap: 20px; margin-top: -50px; position: relative; }
.avatar-circle { width: 120px; height: 120px; background: white; border: 4px solid white; border-radius: 50%; overflow: hidden; position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; cursor: pointer; }
.avatar-overlay svg { width: 30px; height: 30px; color: white; }

.user-text { flex: 1; padding-top: 10px; }
.name-badge h1 { margin: 0; font-size: 1.8rem; font-weight: 800; color: #111; }
.client-badge { background: #E0F2FE; color: #0B4C6F; font-size: 0.75rem; padding: 2px 8px; border-radius: 20px; font-weight: 700; text-transform: uppercase; margin-left: 10px; }
.meta-info { display: flex; gap: 20px; color: #666; font-size: 0.9rem; margin-top: 5px; }

.header-actions { padding-top: 15px; }
.btn-primary-outline { display: flex; align-items: center; border: 1px solid #0B4C6F; color: #0B4C6F; background: white; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-primary-outline:hover { background: #F0F9FF; }

.stats-bar { display: flex; border-top: 1px solid #eee; padding: 15px 30px; gap: 40px; }
.stat-item { display: flex; flex-direction: column; }
.stat-item strong { font-size: 1.1rem; color: #111; }
.stat-item span { font-size: 0.85rem; color: #666; }

.profile-grid { display: grid; grid-template-columns: 260px 1fr; gap: 24px; }
.left-nav { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; height: fit-content; }
.nav-item { width: 100%; text-align: left; padding: 15px 20px; background: none; border: none; border-bottom: 1px solid #eee; cursor: pointer; font-size: 0.95rem; color: #555; display: flex; align-items: center; transition: 0.2s; font-weight: 500; }
.nav-item.active { background: #E0F2FE; color: #0B4C6F; font-weight: 700; border-left: 4px solid #0B4C6F; }

.right-content { background: white; border-radius: 12px; border: 1px solid #e5e7eb; padding: 30px; min-height: 400px; }
.panel-header { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
.panel-header h3 { margin: 0; font-size: 1.3rem; color: #333; }
.warning-text { color: #F76B1C; font-size: 0.9rem; margin: 5px 0 0 0; font-weight: 600; }

.info-form { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full-width { grid-column: span 2; }
.form-input { padding: 10px 12px; border: 1px solid #ccc; border-radius: 6px; width: 100%; }
.form-actions { grid-column: span 2; display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px; }
.btn-save { background: #0B4C6F; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-cancel { background: white; border: 1px solid #ccc; color: #555; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }

.info-row { display: flex; margin-bottom: 15px; border-bottom: 1px dashed #eee; padding-bottom: 8px; }
.info-row .label { width: 120px; font-weight: 600; color: #666; }
.empty-data-msg { text-align: center; margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
.btn-small { background: #0B4C6F; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; margin-top: 10px; }
.empty-state-panel { text-align: center; padding: 40px 20px; color: #666; }
.btn-action { background: white; border: 1px solid #0B4C6F; color: #0B4C6F; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
</style>