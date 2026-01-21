<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// Detectar si estamos en modo edición (si hay un ID en la URL)
const isEditing = computed(() => !!route.params.id);
const requestId = route.params.id;

// Datos del formulario
const form = ref({ 
  title: '', 
  category: '', 
  description: '', 
  date: '', 
  image: null 
});

const isSubmitting = ref(false);
const fileInput = ref(null);
const imagePreview = ref(null);

// --- AL CARGAR LA PÁGINA ---
onMounted(() => {
  if (isEditing.value) {
    cargarDatosExistentes();
  }
});

// Función para simular que traemos datos de la BD (Backend)
const cargarDatosExistentes = () => {
  console.log(`Cargando datos para la solicitud ID: ${requestId}...`);
  
  // SIMULACIÓN: Aquí harías: const { data } = await axios.get(`/api/requests/${requestId}`)
  // Por ahora, llenamos con datos falsos para que veas que funciona
  form.value = {
    title: "Reparación de Aire Acondicionado",
    category: "refrigeracion",
    description: "El equipo hace un ruido extraño y no enfría la habitación principal.",
    date: "", // Opcional
    image: null
  };
  // Si hubiera imagen guardada en BD: imagePreview.value = 'https://url-de-la-imagen.jpg';
};

// --- MANEJO DE FOTOS ---
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

// --- GUARDAR O ACTUALIZAR ---
const handleSubmit = () => {
  if (!form.value.title || !form.value.category) {
    alert("Por favor completa el título y la categoría.");
    return;
  }

  isSubmitting.value = true;
  
  if (isEditing.value) {
    console.log("ACTUALIZANDO solicitud ID:", requestId, form.value);
    // Aquí harías: await axios.put(`/api/requests/${requestId}`, form.value)
  } else {
    console.log("CREANDO nueva solicitud:", form.value);
    // Aquí harías: await axios.post('/api/requests', form.value)
  }

  setTimeout(() => {
    isSubmitting.value = false;
    router.push('/client/dashboard');
  }, 1000);
};
</script>

<template>
  <div class="request-wrapper">
    
    <header class="request-header">
      <div class="header-text">
        <h1>{{ isEditing ? 'Editar Solicitud' : 'Crear nueva solicitud' }}</h1>
        <p v-if="isEditing">Modifica los detalles de tu solicitud #{{ requestId }}.</p>
        <p v-else>Cuéntanos qué necesitas y deja que los expertos vengan a ti.</p>
      </div>
      <button v-if="isEditing" class="btn-close-edit" @click="router.push('/client/dashboard')">
        Cancelar
      </button>
    </header>

    <div class="form-container">
      <form @submit.prevent="handleSubmit" class="modern-form">
        
        <div class="input-group">
          <label>Título breve</label>
          <input 
            v-model="form.title" 
            type="text" 
            placeholder="Ej: Necesito instalar abanicos de techo"
            class="form-input"
          >
        </div>
        
        <div class="input-group">
          <label>Categoría</label>
          <div class="select-wrapper">
            <select v-model="form.category" class="form-select">
              <option value="" disabled selected>Selecciona una especialidad</option>
              <option value="electricidad">⚡ Electricidad</option>
              <option value="plomeria">💧 Plomería</option>
              <option value="refrigeracion">❄️ Aires Acondicionados</option>
              <option value="carpinteria">🪚 Carpintería</option>
              <option value="pintura">🎨 Pintura</option>
              <option value="limpieza">🧹 Limpieza</option>
              <option value="tecnologia">💻 Tecnología</option>
              <option value="otros">🛠️ Otros Servicios</option>
            </select>
          </div>
        </div>

        <div class="input-group">
          <label>Descripción detallada</label>
          <textarea 
            v-model="form.description" 
            rows="4" 
            class="form-textarea"
            placeholder="Describe el problema, marca del equipo, o detalles específicos..."
          ></textarea>
        </div>

        <div class="input-group">
          <label>Evidencia Visual</label>
          
          <div class="upload-box" :class="{ 'has-image': imagePreview }">
            
            <div v-if="imagePreview" class="preview-wrapper">
              <img :src="imagePreview" alt="Evidencia">
              <button type="button" class="btn-remove" @click="removeImage">✕</button>
            </div>

            <div v-else class="upload-placeholder" @click="triggerUpload">
              <div class="icon-upload">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              </div>
              <p>Haz clic para agregar una foto</p>
            </div>

            <input 
              type="file" 
              ref="fileInput" 
              accept="image/*" 
              @change="handleFileChange" 
              class="hidden-input"
            >
          </div>
        </div>

        <button type="submit" class="btn-submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Publicar Solicitud') }}
        </button>

      </form>
    </div>
  </div>
</template>

<style scoped>
.request-wrapper { width: 100%; padding-bottom: 40px; }

/* HEADER */
.request-header { 
  background: #0B4C6F; color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; 
  box-shadow: 0 4px 12px rgba(11, 76, 111, 0.2); 
  display: flex; justify-content: space-between; align-items: flex-start;
}
.header-text h1 { margin: 0 0 10px 0; font-size: 2rem; font-weight: 800; }
.header-text p { margin: 0; font-size: 1.1rem; opacity: 0.9; }

.btn-close-edit { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: 0.2s; }
.btn-close-edit:hover { background: rgba(255,255,255,0.3); }

/* FORM CONTAINER */
.form-container { background: white; padding: 40px; border-radius: 12px; border: 1px solid #e5e7eb; max-width: 800px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }

.input-group { margin-bottom: 25px; }
.input-group label { display: block; font-weight: 700; color: #374151; margin-bottom: 8px; font-size: 0.95rem; }

/* INPUTS */
.form-input, .form-select, .form-textarea { width: 100%; padding: 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 1rem; transition: 0.2s; background-color: #fff; font-family: inherit; }
.form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #0B4C6F; box-shadow: 0 0 0 3px rgba(11, 76, 111, 0.1); }
.form-textarea { resize: vertical; min-height: 120px; }

/* UPLOAD BOX */
.upload-box { border: 2px dashed #D1D5DB; border-radius: 12px; min-height: 150px; display: flex; align-items: center; justify-content: center; background-color: #F9FAFB; transition: 0.2s; position: relative; overflow: hidden; cursor: pointer; }
.upload-box:hover { border-color: #0B4C6F; background-color: #F0F9FF; }
.upload-box.has-image { border-style: solid; padding: 0; background: black; cursor: default; }

.upload-placeholder { text-align: center; width: 100%; height: 100%; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.icon-upload { margin-bottom: 5px; opacity: 0.6; color: #0B4C6F; }
.upload-placeholder p { font-weight: 600; color: #4B5563; margin: 0; }

.hidden-input { display: none; }

/* PREVIEW */
.preview-wrapper { width: 100%; height: 250px; position: relative; }
.preview-wrapper img { width: 100%; height: 100%; object-fit: contain; } 
.btn-remove { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.btn-remove:hover { background: rgba(220, 38, 38, 0.9); }

/* BUTTON */
.btn-submit { width: 100%; padding: 16px; background: #F76B1C; color: white; border: none; border-radius: 8px; font-weight: 800; font-size: 1.1rem; cursor: pointer; transition: 0.2s; margin-top: 10px; }
.btn-submit:hover { background: #e05a10; transform: translateY(-1px); }
.btn-submit:disabled { background: #ccc; cursor: not-allowed; transform: none; }
</style>