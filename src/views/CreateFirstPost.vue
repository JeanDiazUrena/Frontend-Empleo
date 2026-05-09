<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import './CreateFirstPost.css';

const router = useRouter();
const route = useRoute();

const fileInputRef = ref(null);
const errorMessage = ref('');
const isPublishing = ref(false);
const isDeleting = ref(false);

// --- TOAST SYSTEM ---
const toast = ref({ show: false, msg: '', type: 'success' });
let toastTimer = null;
const showToast = (msg, type = 'success') => {
  if (toastTimer) clearTimeout(toastTimer);
  toast.value = { show: true, msg, type };
  toastTimer = setTimeout(() => { toast.value.show = false; }, 4000);
};

// --- CONFIRM MODAL ---
const confirmModal = ref({ show: false, msg: '', onConfirm: null });
const askConfirm = (msg) => new Promise((resolve) => {
  confirmModal.value = { show: true, msg, onConfirm: resolve };
});
const handleConfirm = (answer) => {
  confirmModal.value.show = false;
  if (confirmModal.value.onConfirm) confirmModal.value.onConfirm(answer);
};

// Obtenemos el ID de la URL (ej: /edit-post/123)
const postId = route.params.id; 
const isEditing = computed(() => !!postId);

const form = reactive({
  description: '',
  serviceTitle: '', 
  imageFile: null
});

const imagePreview = ref(null);

// AL CARGAR: Si estamos editando, traemos los datos del servidor
onMounted(async () => {
  if (isEditing.value) {
    try {
      const response = await axios.get(`${API_URLS.PERFILES}/api/portfolio/single/${postId}`);
      const data = response.data;
      
      form.description = data.descripcion;
      form.serviceTitle = data.titulo;
      imagePreview.value = data.imagen_url; 
    } catch (error) {
      console.error("Error cargando publicacion:", error);
      errorMessage.value = "Error al cargar los datos para editar.";
    }
  }
});

const triggerFileUpload = () => {
  fileInputRef.value.click();
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    form.imageFile = file;
    imagePreview.value = URL.createObjectURL(file);
    errorMessage.value = ''; 
  }
};

const removeImage = () => {
  form.imageFile = null;
  imagePreview.value = null;
};

// Logica unificada para CREAR o EDITAR
const handlePublish = async () => {
  errorMessage.value = '';

  // Validaciones
  if (!form.description && !imagePreview.value) {
    errorMessage.value = "Error: Debes agregar una descripcion o una imagen.";
    return;
  }
  if (!form.serviceTitle || !form.serviceTitle.trim()) {
    errorMessage.value = "Error: El titulo del servicio es obligatorio.";
    return;
  }
  
  const userId = localStorage.getItem('usuario_id');
  if (!userId) {
    showToast("Sesión expirada. Por favor, inicia sesión de nuevo.", "error");
    setTimeout(() => {
      router.push('/login');
    }, 1500);
    return;
  }

  const formData = new FormData();
  formData.append('profesional_id', userId);
  formData.append('titulo', form.serviceTitle);
  formData.append('descripcion', form.description);
  
  if (form.imageFile) {
    formData.append('imagen', form.imageFile);
  }

  try {
    isPublishing.value = true;
    
    if (isEditing.value) {
      // MODO EDICION (PUT)
      await axios.put(`${API_URLS.PERFILES}/api/portfolio/${postId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast("Publicación actualizada correctamente.", "success");
    } else {
      // MODO CREACION (POST)
      await axios.post(`${API_URLS.PERFILES}/api/portfolio`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast("Publicación creada exitosamente.", "success");
    }

    setTimeout(() => {
      router.push('/professional/profile'); 
    }, 1500);

  } catch (error) {
    console.error("Error al guardar:", error);
    errorMessage.value = "Error de conexion con el servidor.";
  } finally {
    isPublishing.value = false;
  }
};

const handleDelete = async () => {
  const confirmed = await askConfirm("¿Estás seguro de que deseas eliminar esta publicación?");
  if (!confirmed) return;

  try {
    isDeleting.value = true;
    await axios.delete(`${API_URLS.PERFILES}/api/portfolio/${postId}`);
    showToast("Publicación eliminada correctamente.", "success");
    setTimeout(() => {
      router.push('/professional/profile');
    }, 1500);
  } catch (error) {
    console.error("Error al eliminar:", error);
    errorMessage.value = "No se pudo eliminar la publicacion.";
  } finally {
    isDeleting.value = false;
  }
};

const closePost = () => {
  router.push('/professional/profile');
};
</script>

<template>
  <div id="main-content" class="modal-overlay" tabindex="-1">
    <!-- ===== TOAST NOTIFICATION ===== -->
    <Teleport to="body">
      <Transition name="toast-slide">
        <div v-if="toast.show" :class="['app-toast', `app-toast--${toast.type}`]">
          <i :class="toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'"></i>
          <span>{{ toast.msg }}</span>
          <button class="toast-close" @click="toast.show = false">×</button>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== CONFIRM MODAL ===== -->
    <Teleport to="body">
      <div v-if="confirmModal.show" class="confirm-overlay">
        <div class="confirm-card animate-pop">
          <div class="confirm-icon"><i class="fa-solid fa-circle-question"></i></div>
          <p class="confirm-msg">{{ confirmModal.msg }}</p>
          <div class="confirm-actions">
            <button class="confirm-no" @click="handleConfirm(false)">Cancelar</button>
            <button class="confirm-yes" @click="handleConfirm(true)">Sí, eliminar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="modal-container">
      
      <div class="modal-header">
        <button class="btn-close" @click="closePost" title="Cerrar">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        
        <span class="modal-title-small">{{ isEditing ? 'Editar Publicacion' : 'Crear Publicacion' }}</span>
        
        <button class="btn-publish-small" @click="handlePublish" :disabled="isPublishing">
          {{ isPublishing ? 'Guardando...' : (isEditing ? 'Guardar' : 'Publicar') }}
        </button>
      </div>

      <h1 class="main-title">{{ isEditing ? 'Editar Publicacion' : 'Crear Nueva Publicacion' }}</h1>

      <div class="modal-body">
        
        <div class="section">
          <h3 class="section-title">Muestra tu Trabajo</h3>
          
          <div class="upload-area" :class="{ 'has-image': imagePreview }">
            <div v-if="!imagePreview" class="upload-placeholder" @click="triggerFileUpload">
              <p class="upload-text-main">Haz clic para seleccionar fotos</p>
              <button type="button" class="btn-select-gallery">Seleccionar</button>
              <input type="file" ref="fileInputRef" accept="image/*" @change="handleFileChange" hidden>
            </div>

            <div v-else class="preview-container">
              <img :src="imagePreview" alt="Vista previa">
              <button type="button" class="btn-remove-img" @click="removeImage">Quitar imagen</button>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Describe el Trabajo</h3>
          <textarea 
            v-model="form.description" 
            placeholder="Detalles del trabajo..." 
            class="post-textarea"
            rows="4"
          ></textarea>
        </div>

        <div class="section">
          <h3 class="section-title">Servicio Relacionado</h3>
          <input 
            type="text" 
            v-model="form.serviceTitle" 
            class="service-input" 
            placeholder="Ej: Reparacion de laptop..." 
          />
        </div>

      </div>

      <div class="modal-footer footer-actions">
        
        <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>
        
        <button v-if="isEditing" class="btn-delete" @click="handleDelete" :disabled="isDeleting">
          {{ isDeleting ? 'Eliminando...' : 'Eliminar Publicacion' }}
        </button>

        <button class="btn-publish-large" @click="handlePublish" :disabled="isPublishing">
          {{ isPublishing ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Publicar en mi Muro') }}
        </button>
        
      </div>

    </div>
  </div>
</template>

<style scoped>
.service-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}
.service-input:focus {
  outline: none;
  border-color: #0B4C6F;
  box-shadow: 0 0 0 2px rgba(11, 76, 111, 0.1);
}

/* Footer para separar botones */
.footer-actions {
  display: flex;
  justify-content: space-between; 
  align-items: center;
  gap: 10px;
}

/* Estilo boton eliminar */
.btn-delete {
  background-color: white;
  border: 1px solid #dc2626;
  color: #dc2626;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.btn-delete:hover {
  background-color: #fef2f2;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-alert {
  color: #dc2626;
  font-weight: bold;
}

/* --- TOAST SYSTEM --- */
.app-toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  min-width: 320px; max-width: 90vw;
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; border-radius: 12px;
  font-weight: 600; font-size: 0.93rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.18);
  z-index: 99999;
}
.app-toast--success { background: #1E293B; color: white; }
.app-toast--success i { color: #4ADE80; }
.app-toast--error { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
.app-toast--error i { color: #DC2626; }
.app-toast span { flex: 1; }
.toast-close { background: none; border: none; color: inherit; opacity: 0.6; cursor: pointer; font-size: 1.2rem; padding: 0; margin-left: 4px; }
.toast-close:hover { opacity: 1; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.35s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(-50%) translateY(16px); }

/* --- CONFIRM MODAL --- */
.confirm-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.55);
  backdrop-filter: blur(4px); z-index: 99998;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.confirm-card {
  background: white; border-radius: 16px; padding: 36px 32px;
  max-width: 400px; width: 100%; text-align: center;
  box-shadow: 0 25px 50px rgba(0,0,0,0.2);
}
.confirm-icon { font-size: 2.5rem; color: #F59E0B; margin-bottom: 16px; }
.confirm-msg { font-size: 1rem; color: #334155; line-height: 1.6; margin: 0 0 28px; font-weight: 500; }
.confirm-actions { display: flex; gap: 12px; }
.confirm-no  { flex: 1; padding: 12px; border: 1.5px solid #E2E8F0; border-radius: 8px; background: white; color: #64748B; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
.confirm-no:hover { background: #F8FAFC; }
.confirm-yes { flex: 1; padding: 12px; border: none; border-radius: 8px; background: #1E293B; color: white; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
.confirm-yes:hover { background: #0F172A; transform: translateY(-1px); }

.animate-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
