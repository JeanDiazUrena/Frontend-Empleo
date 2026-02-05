<script setup>
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
      const response = await axios.get(`http://localhost:3001/api/portfolio/single/${postId}`);
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
    alert("Sesion expirada.");
    router.push('/login');
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
      await axios.put(`http://localhost:3001/api/portfolio/${postId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Publicacion actualizada correctamente.");
    } else {
      // MODO CREACION (POST)
      await axios.post('http://localhost:3001/api/portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Publicacion creada exitosamente.");
    }

    router.push('/professional/profile'); 

  } catch (error) {
    console.error("Error al guardar:", error);
    errorMessage.value = "Error de conexion con el servidor.";
  } finally {
    isPublishing.value = false;
  }
};

// Logica para ELIMINAR
const handleDelete = async () => {
  if (!confirm("Estas seguro de que deseas eliminar esta publicacion?")) {
    return;
  }

  try {
    isDeleting.value = true;
    await axios.delete(`http://localhost:3001/api/portfolio/${postId}`);
    alert("Publicacion eliminada.");
    router.push('/professional/profile');
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
  <div class="modal-overlay">
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
</style>