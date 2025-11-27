<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import './CreateFirstPost.css';

const router = useRouter();
const fileInputRef = ref(null);

const form = reactive({
  description: '',
  serviceId: '',
  imageFile: null
});

const imagePreview = ref(null);

// Simulación de servicios (esto vendría del backend o del paso anterior)
const myServices = [
  { id: 1, name: 'Reparación de Laptops' },
  { id: 2, name: 'Instalación de Software' },
  { id: 3, name: 'Mantenimiento Preventivo' }
];

// --- Funciones ---

// Abre el selector de archivos
const triggerFileUpload = () => {
  fileInputRef.value.click();
};

// Maneja el archivo seleccionado
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    form.imageFile = file;
    imagePreview.value = URL.createObjectURL(file);
  }
};

// Elimina la imagen
const removeImage = () => {
  form.imageFile = null;
  imagePreview.value = null;
};

// Maneja la acción de publicar
const handlePublish = () => {
  if (!form.description && !form.imageFile) {
    alert("Por favor, añade una descripción o una imagen.");
    return;
  }
  if (!form.serviceId) {
    alert("Por favor, selecciona un servicio relacionado.");
    return;
  }

  console.log("--- PUBLICANDO POST ---");
  console.log("Descripción:", form.description);
  console.log("Servicio ID:", form.serviceId);
  console.log("Archivo:", form.imageFile ? form.imageFile.name : 'Ninguno');

  alert("¡Publicación creada con éxito!");
  router.push('/dashboard');
};

// Cierra el modal
const closePost = () => {
  router.push('/dashboard');
};
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <button class="btn-close" @click="closePost" title="Cerrar">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-close">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <span class="modal-title-small">Crear Publicación</span>
        <button class="btn-publish-small" @click="handlePublish">Publicar</button>
      </div>

      <h1 class="main-title">Crear Nueva Publicación</h1>

      <div class="modal-body">
        
        <div class="section">
          <h3 class="section-title">Muestra tu Trabajo</h3>
          
          <div class="upload-area" :class="{ 'has-image': imagePreview }">
            
            <div v-if="!imagePreview" class="upload-placeholder" @click="triggerFileUpload">
              <p class="upload-text-main">Arrastra y suelta fotos o videos</p>
              <p class="upload-text-sub">o selecciona desde tu dispositivo</p>
              <button type="button" class="btn-select-gallery">Seleccionar de la galería</button>
              <input 
                type="file" 
                ref="fileInputRef" 
                accept="image/*" 
                @change="handleFileChange" 
                hidden
              >
            </div>

            <div v-else class="preview-container">
              <img :src="imagePreview" alt="Preview del trabajo">
              <button type="button" class="btn-remove-img" @click="removeImage" title="Eliminar imagen">✕</button>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">Describe el Trabajo Realizado</h3>
          <textarea 
            v-model="form.description" 
            placeholder="Escribe una descripción detallada de tu trabajo, los materiales usados, el tiempo que tomó, etc." 
            class="post-textarea"
            rows="4"
          ></textarea>
        </div>

        <div class="section">
          <h3 class="section-title">Servicios Relacionados</h3>
          <div class="select-wrapper">
            <select v-model="form.serviceId" class="service-select">
              <option value="" disabled selected>Asocia esta publicación a un servicio</option>
              <option v-for="service in myServices" :key="service.id" :value="service.id">
                {{ service.name }}
              </option>
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="select-icon">
              <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

      </div>

      <div class="modal-footer">
        <button class="btn-publish-large" @click="handlePublish">
          Publicar en mi Muro
        </button>
      </div>

    </div>
  </div>
</template>