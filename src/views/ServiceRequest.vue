<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; 

const router = useRouter();

const user = {
  name: "Jean Luis",
  avatar: "https://i.pravatar.cc/150?u=jean",
};

const form = ref({
  title: '',
  category: '',
  description: '',
  date: '',
  location: 'Santiago, RD',
  image: null // Aquí guardaremos la foto
});

const isSubmitting = ref(false);
const imagePreview = ref(null); // Para mostrar la foto seleccionada
const fileInput = ref(null);    // Referencia al input oculto

// Función para abrir el selector de archivos al hacer clic en la caja
const triggerFileUpload = () => {
  fileInput.value.click();
};

// Función cuando el usuario selecciona un archivo
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    form.value.image = file;
    // Creamos una URL temporal para ver la imagen
    imagePreview.value = URL.createObjectURL(file);
  }
};

const handleSubmit = () => {
  if (!form.value.title || !form.value.category) {
    alert("Por favor completa los campos principales.");
    return;
  }
  isSubmitting.value = true;
  
  setTimeout(() => {
    isSubmitting.value = false;
    router.push('/client-dashboard');
    alert("🚀 Solicitud enviada con foto adjunta. ¡Prepárate!");
  }, 1500);
};

// Navegación
const goToDashboard = () => router.push('/client-dashboard');
const goToExplore = () => router.push('/client-explore'); 
const goToChat = () => router.push('/client-chat'); 
const goToProfile = () => router.push('/client-profile'); 
</script>

<template>
  <div class="dashboard-layout">
    
 <nav class="navbar">
  <div 
    class="nav-brand" 
    @click="router.push('/')" 
    style="color: #F76B1C; cursor: pointer;"
  >
    SERVIHUB
  </div>

  <div class="nav-profile clickable" @click="goToProfile">
    <span class="nav-user-name">{{ user.name }}</span>
    <img :src="user.avatar" class="nav-avatar">
  </div>
</nav>

    <div class="custom-container-full">
      
      <aside class="sidebar-left">
        <ul class="menu-list">
          <li @click="goToDashboard"><span class="icon">🏠</span> Inicio</li>
          <li @click="goToExplore"><span class="icon">🔍</span> Explorar</li>
          <li @click="goToChat"><span class="icon">💬</span> Mensajes</li>
          <li @click="goToProfile"><span class="icon">👤</span> Mi Perfil</li>
        </ul>
      </aside>

      <main class="main-content-full">
        
        <header class="request-header">
          <div class="header-content">
            <h1>Crear nueva solicitud</h1>
            <p>Cuéntanos qué necesitas y deja que los expertos vengan a ti.</p>
          </div>
        </header>

        <div class="request-grid-layout">
          
          <div class="form-column">
            <form @submit.prevent="handleSubmit" class="modern-form">
              
              <div class="form-section">
                <h3>1. Detalles del servicio</h3>
                
                <div class="input-group">
                  <label>Título breve del problema</label>
                  <input v-model="form.title" type="text" placeholder="Ej: Necesito instalar 3 abanicos de techo" class="big-input">
                </div>

                <div class="input-group">
                  <label>Categoría</label>
                  <select v-model="form.category" class="big-input select-arrow">
                    <option value="" disabled selected>Selecciona la especialidad</option>
                    <option value="electricidad">⚡ Electricidad</option>
                    <option value="plomeria">💧 Plomería</option>
                    <option value="refrigeracion">❄️ Aires Acondicionados</option>
                    <option value="otros">🛠️ Otros / General</option>
                  </select>
                </div>

                <div class="input-group">
                  <label>Descripción detallada</label>
                  <textarea v-model="form.description" rows="4" placeholder="Describe el trabajo..." class="big-textarea"></textarea>
                </div>
              </div>

              <div class="form-section">
                <h3>2. Evidencia Visual (Opcional)</h3>
                <label style="font-weight: 600; color: #374151; margin-bottom: 8px; display:block;">Sube una foto del problema</label>
                
                <div class="upload-box" @click="triggerFileUpload">
                  <input 
                    type="file" 
                    ref="fileInput" 
                    class="hidden-input" 
                    accept="image/*" 
                    @change="handleFileChange"
                  >
                  
                  <div v-if="!imagePreview" class="upload-placeholder">
                    <span class="upload-icon">📷</span>
                    <p><strong>Haz clic para subir una foto</strong> o arrástrala aquí</p>
                    <span class="upload-hint">JPG, PNG (Máx 5MB)</span>
                  </div>

                  <div v-else class="image-preview-container">
                    <img :src="imagePreview" class="preview-img">
                    <button type="button" class="btn-remove-img" @click.stop="imagePreview = null">✖</button>
                  </div>
                </div>
              </div>

              <div class="form-section">
                <h3>3. Ubicación y Fecha</h3>
                <div class="two-col-inputs">
                  <div class="input-group">
                    <label>¿Dónde es el trabajo?</label>
                    <input v-model="form.location" type="text" class="big-input" style="background-color: #f9fafb;">
                  </div>
                  <div class="input-group">
                    <label>Fecha preferida</label>
                    <input v-model="form.date" type="date" class="big-input">
                  </div>
                </div>
              </div>

              <div class="form-footer">
                <button type="submit" class="btn-submit-large" :disabled="isSubmitting">
                  {{ isSubmitting ? 'Publicando...' : 'Publicar Solicitud Ahora 🚀' }}
                </button>
              </div>

            </form>
          </div>

          <div class="info-sidebar-column">
            <div class="info-card box-shadow-hover">
              <h3>¿Cómo funciona?</h3>
              <ul class="steps-list">
                <li><span class="step-num">1</span><div><strong>Publica:</strong> Describe tu problema.</div></li>
                <li><span class="step-num">2</span><div><strong>Recibe ofertas:</strong> Expertos te contactarán.</div></li>
                <li><span class="step-num">3</span><div><strong>Elige:</strong> Contrata al mejor.</div></li>
              </ul>
            </div>
            <div class="info-card box-shadow-hover" style="background: #E0F2FE; border-color: #BAE6FD;">
              <h3>💡 Consejo Pro</h3>
              <p style="font-size: 0.9rem; color: #0B4C6F;">
                ¡Incluir una foto aumenta tus respuestas en un <strong>40%</strong>! Ayuda al técnico a entender qué herramientas traer.
              </p>
            </div>
          </div>

        </div>

      </main>

    </div>
  </div>
</template>

<style scoped>
/* --- ESTILOS PREVIOS MANTENIDOS --- */
.custom-container-full { margin-left: 260px; display: block; min-height: 100vh; background-color: white; }
.main-content-full { width: 100%; }
.request-header { background: linear-gradient(to right, #0B4C6F, #1e6b94); color: white; padding: 3rem 2rem; }
.header-content { max-width: 1200px; margin: 0 auto; }
.request-header h1 { margin: 0; font-size: 2.5rem; font-weight: 800; }
.request-grid-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; max-width: 1200px; margin: 2rem auto; padding: 0 2rem; align-items: start; }
.form-section { margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #eee; }
.form-section h3 { font-size: 1.3rem; color: #111; margin-bottom: 1.5rem; }
.input-group { margin-bottom: 1.5rem; }
.input-group label { display: block; font-weight: 600; margin-bottom: 8px; color: #374151; }
.big-input, .big-textarea { width: 100%; padding: 14px 16px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 1rem; transition: all 0.2s; background: white; }
.big-input:focus, .big-textarea:focus { outline: none; border-color: #F76B1C; box-shadow: 0 0 0 3px rgba(247, 107, 28, 0.1); }
.two-col-inputs { display: flex; gap: 20px; }
.two-col-inputs .input-group { flex: 1; }
.btn-submit-large { width: 100%; padding: 16px; background-color: #F76B1C; color: white; border: none; border-radius: 8px; font-size: 1.2rem; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.btn-submit-large:hover { background-color: #e05a10; }
.info-card { background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
.steps-list { list-style: none; padding: 0; margin: 0; }
.steps-list li { display: flex; gap: 15px; margin-bottom: 1.2rem; font-size: 0.95rem; color: #555; }
.step-num { background: #E0F2FE; color: #0B4C6F; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }

/* --- NUEVOS ESTILOS PARA SUBIDA DE FOTOS --- */
.upload-box {
  border: 2px dashed #D1D5DB;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  background-color: #F9FAFB;
  transition: all 0.2s;
  position: relative;
}
.upload-box:hover {
  border-color: #0B4C6F;
  background-color: #F0F9FF;
}

.hidden-input { display: none; }

.upload-icon { font-size: 2.5rem; display: block; margin-bottom: 10px; opacity: 0.7; }
.upload-placeholder p { color: #374151; margin: 5px 0; }
.upload-hint { font-size: 0.85rem; color: #9CA3AF; }

/* Previsualización de Imagen */
.image-preview-container {
  position: relative;
  display: inline-block;
}
.preview-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.btn-remove-img {
  position: absolute;
  top: -10px;
  right: -10px;
  background: red;
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  cursor: pointer;
  font-weight: bold;
}
</style>