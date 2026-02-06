<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

const isEditing = computed(() => !!route.params.id);
const requestId = route.params.id;

// Estado del Modal de Bloqueo
const showBlockModal = ref(false);

const form = ref({ 
  title: '', 
  category: '', 
  description: '', 
  image: null 
});

const isSubmitting = ref(false);
const fileInput = ref(null);
const imagePreview = ref(null);

// --- AL CARGAR ---
onMounted(() => {
  // 1. VERIFICACIÓN DE PERFIL (CANDADO)
  const userPhone = localStorage.getItem('usuario_telefono');
  const userAddress = localStorage.getItem('usuario_direccion');

  if (!userPhone || !userAddress) {
    // EN LUGAR DE ALERT, MOSTRAMOS EL MODAL
    showBlockModal.value = true;
    return; // Detenemos la ejecución aquí
  }

  // 2. Si es edición, cargar datos
  if (isEditing.value) {
    cargarDatosSimulados();
  }
});

// --- ACCIONES DEL MODAL ---
const goToProfile = () => router.push('/client/profile');
const goBack = () => router.push('/client/dashboard');

// ... (Resto de funciones de carga, imagen y submit igual que antes) ...
const cargarDatosSimulados = () => {
  form.value.title = "Reparación Ejemplo";
  form.value.category = "refrigeracion";
  form.value.description = "Ejemplo de descripción...";
};

const triggerUpload = () => fileInput.value.click();

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    form.value.image = file; 
    imagePreview.value = URL.createObjectURL(file);
  }
};

const removeImage = () => {
  form.value.image = null;
  imagePreview.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

const handleSubmit = async () => {
  if (!form.value.title || !form.value.category) return;
  isSubmitting.value = true;
  
  setTimeout(() => {
    isSubmitting.value = false;
    router.push('/client/dashboard');
  }, 1500);
};
</script>

<template>
  <div class="request-wrapper">
    
    <div v-if="showBlockModal" class="modal-overlay">
      <div class="modal-card animate-pop">
        <div class="icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="alert-icon">
            <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />
          </svg>
        </div>

        <h3>¡Faltan Datos!</h3>
        <p>No puedes publicar una solicitud sin tener un <strong>número de contacto</strong> y <strong>dirección</strong> registrados.</p>
        
        <div class="modal-actions">
          <button class="btn-complete" @click="goToProfile">
            Ir a mi Perfil
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="arrow-icon"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" /></svg>
          </button>
          
          <button class="btn-cancel" @click="goBack">
            Cancelar y Volver
          </button>
        </div>
      </div>
    </div>

    <header class="request-header" :class="{ 'blurred': showBlockModal }">
      <div class="header-text">
        <h1>{{ isEditing ? 'Editar Solicitud' : 'Crear nueva solicitud' }}</h1>
        <p>Cuéntanos qué necesitas y deja que los expertos vengan a ti.</p>
      </div>
      <button class="btn-close-edit" @click="goBack">Cancelar</button>
    </header>

    <div class="form-container" :class="{ 'blurred': showBlockModal }">
      <form @submit.prevent="handleSubmit" class="modern-form">
        
        <div class="input-group">
          <label>Título breve</label>
          <input v-model="form.title" type="text" placeholder="Ej: Necesito instalar abanicos" class="form-input">
        </div>
        
        <div class="input-group">
          <label>Categoría</label>
          <div class="select-wrapper">
            <select v-model="form.category" class="form-select">
              <option value="" disabled selected>Selecciona una especialidad</option>
              <option value="electricidad">⚡ Electricidad</option>
              <option value="plomeria">💧 Plomería</option>
              </select>
          </div>
        </div>

        <div class="input-group">
          <label>Descripción detallada</label>
          <textarea v-model="form.description" rows="4" class="form-textarea" placeholder="Detalles..."></textarea>
        </div>

        <div class="input-group">
          <label>Evidencia Visual</label>
          <div class="upload-box" :class="{ 'has-image': imagePreview }">
            <div v-if="imagePreview" class="preview-wrapper">
              <img :src="imagePreview" alt="Evidencia">
              <button type="button" class="btn-remove" @click="removeImage">✕</button>
            </div>
            <div v-else class="upload-placeholder" @click="triggerUpload">
              <div class="icon-upload">📷</div>
              <p>Haz clic para agregar foto</p>
            </div>
            <input type="file" ref="fileInput" accept="image/*" @change="handleFileChange" class="hidden-input">
          </div>
        </div>

        <button type="submit" class="btn-submit" :disabled="isSubmitting">Publicar Solicitud</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.request-wrapper { width: 100%; padding-bottom: 40px; position: relative; }

/* EFECTO BORROSO DE FONDO */
.blurred { filter: blur(5px); pointer-events: none; user-select: none; opacity: 0.6; transition: all 0.3s; }

/* MODAL DE BLOQUEO */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(11, 76, 111, 0.6); /* Azul oscuro transparente */
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}

.modal-card {
  background: white; padding: 40px 30px; border-radius: 20px;
  width: 90%; max-width: 380px; text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.animate-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.icon-container {
  width: 70px; height: 70px; background: #FEF3C7; /* Amarillo suave */
  border-radius: 50%; margin: 0 auto 20px;
  display: flex; align-items: center; justify-content: center;
}
.alert-icon { width: 35px; color: #F59E0B; /* Naranja/Amarillo alerta */ }

.modal-card h3 { margin: 0 0 10px 0; color: #1e293b; font-size: 1.5rem; font-weight: 800; }
.modal-card p { color: #64748b; margin-bottom: 30px; line-height: 1.5; }

.modal-actions { display: flex; flex-direction: column; gap: 10px; }

.btn-complete {
  background: #0B4C6F; color: white; border: none; padding: 14px;
  border-radius: 10px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: transform 0.2s;
}
.btn-complete:hover { transform: translateY(-2px); background: #093a55; }
.arrow-icon { width: 18px; }

.btn-cancel {
  background: transparent; border: 1px solid #cbd5e1; color: #64748b;
  padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer;
}
.btn-cancel:hover { background: #f1f5f9; }

/* ESTILOS DEL FORMULARIO (Mismos de antes) */
.request-header { background: #0B4C6F; color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; display: flex; justify-content: space-between; }
.header-text h1 { margin: 0; font-size: 2rem; font-weight: 800; }
.btn-close-edit { background: rgba(255,255,255,0.2); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.form-container { background: white; padding: 40px; border-radius: 12px; border: 1px solid #e5e7eb; max-width: 800px; margin: 0 auto; }
.input-group { margin-bottom: 20px; }
.input-group label { display: block; font-weight: 700; color: #374151; margin-bottom: 8px; }
.form-input, .form-select, .form-textarea { width: 100%; padding: 14px; border: 1px solid #d1d5db; border-radius: 8px; }
.btn-submit { width: 100%; padding: 16px; background: #F76B1C; color: white; border: none; border-radius: 8px; font-weight: 800; cursor: pointer; margin-top: 10px; }
.upload-box { border: 2px dashed #d1d5db; padding: 20px; text-align: center; cursor: pointer; }
.hidden-input { display: none; }
</style>