<template>
  <div class="setup-container">
    <header class="setup-header">
      <div class="logo">SERVIHUB - Configuración Profesional</div>
    </header>

    <div class="form-wrapper">
      <div class="form-card">
        <h2>Crea tu Perfil de Éxito</h2>
        <p class="subtitle">Completa estos datos para que los clientes confíen en tu trabajo.</p>

        <form @submit.prevent="saveProfile">
          
          <div class="form-section images-section">
            <h3 class="section-title">1. Tu Imagen Profesional</h3>
            
            <div class="profile-images-container">
              <div class="cover-upload" :style="{ backgroundImage: form.cover ? `url(${form.cover})` : 'none' }">
                <label for="coverInput" class="cover-label">
                  <span v-if="!form.cover">📷 Subir Foto de Portada</span>
                  <span v-else class="change-cover-text">Cambiar Portada</span>
                </label>
                <input type="file" id="coverInput" accept="image/*" @change="handleCoverChange" hidden />
              </div>

              <div class="avatar-upload">
                <div class="avatar-preview">
                  <span v-if="!form.avatar">👤</span>
                  <img v-else :src="form.avatar" alt="Preview" />
                </div>
                <label for="avatarInput" class="btn-upload-avatar">Cambiar Foto</label>
                <input type="file" id="avatarInput" accept="image/*" @change="handleAvatarChange" hidden />
              </div>
            </div>
            <p class="image-hint">Una buena foto de portada y perfil atraen más clientes.</p>
          </div>

          <div class="form-section professional-info-section">
            <h3 class="section-title">2. Detalles Profesionales</h3>
            <div class="form-grid">
              
              <div class="input-group full-width">
                <label for="profession">Profesión / Título Principal *</label>
                <input 
                  type="text" 
                  id="profession" 
                  v-model="form.profession" 
                  placeholder="Ej. Plomero Certificado, Desarrollador Web..." 
                  required
                />
              </div>

              <div class="input-group full-width">
                <label for="bio">Biografía Breve *</label>
                <textarea 
                  id="bio" 
                  v-model="form.bio" 
                  placeholder="Cuéntanos sobre tu experiencia, lo que te hace único y por qué los clientes deberían elegirte." 
                  rows="4"
                  required
                ></textarea>
              </div>

              <div class="input-group">
                <label for="category">Categoría Principal *</label>
                <select id="category" v-model="form.category" required>
                  <option value="" disabled selected>Selecciona una opción</option>
                  <option value="hogar">Hogar y Reparaciones</option>
                  <option value="tecnologia">Tecnología e Informática</option>
                  <option value="educacion">Clases y Educación</option>
                  <option value="belleza">Belleza y Cuidado Personal</option>
                  <option value="eventos">Eventos y Entretenimiento</option>
                  <option value="otros">Otros Servicios</option>
                </select>
              </div>

              <div class="input-group">
                <label for="experience">Años de Experiencia</label>
                <input 
                  type="number" 
                  id="experience" 
                  v-model="form.experience" 
                  placeholder="Ej. 5" 
                  min="0"
                />
              </div>

              <div class="input-group full-width">
                <label for="skills">Especialidades / Habilidades (Separadas por comas)</label>
                <input 
                  type="text" 
                  id="skills" 
                  v-model="form.skills" 
                  placeholder="Ej. Instalación de grifos, Reparación de fugas, Mantenimiento..." 
                />
              </div>

              <div class="input-group full-width">
                <label for="website">Sitio Web o Portafolio (Opcional)</label>
                <input 
                  type="url" 
                  id="website" 
                  v-model="form.website" 
                  placeholder="https://tu-sitio-web.com" 
                />
              </div>

            </div>
          </div>

          <div class="form-section contact-info-section">
            <h3 class="section-title">3. Contacto y Zona de Trabajo</h3>
            <div class="form-grid">
              
              <div class="input-group">
                <label for="phone">Teléfono / WhatsApp *</label>
                <input 
                  type="tel" 
                  id="phone" 
                  v-model="form.phone" 
                  placeholder="Ej. 809-555-5555" 
                  required
                />
              </div>

              <div class="input-group">
                <label for="emailPublic">Email de Contacto Público (Opcional)</label>
                <input 
                  type="email" 
                  id="emailPublic" 
                  v-model="form.emailPublic" 
                  placeholder="Ej. contacto@tuempresa.com" 
                />
              </div>

              <div class="input-group">
                <label for="location">Ciudad Base *</label>
                <input 
                  type="text" 
                  id="location" 
                  v-model="form.location" 
                  placeholder="Ej. Santiago, Santo Domingo" 
                  required
                />
              </div>

              <div class="input-group">
                <label for="coverageArea">Zona de Cobertura (Opcional)</label>
                <input 
                  type="text" 
                  id="coverageArea" 
                  v-model="form.coverageArea" 
                  placeholder="Ej. Todo el Cibao, Distrito Nacional..." 
                />
              </div>

              <div class="input-group full-width">
                <label for="workingHours">Horario de Trabajo Habitual</label>
                <textarea 
                  id="workingHours" 
                  v-model="form.workingHours" 
                  placeholder="Ej. Lunes a Viernes: 8am - 6pm. Sábados: 9am - 1pm." 
                  rows="3"
                ></textarea>
              </div>

            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary">Guardar Perfil y Continuar</button>
          </div>

        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import './ProfessionalSetup.css';

const router = useRouter();

const form = reactive({
  avatar: null,
  cover: null, // Nueva foto de portada
  profession: '',
  bio: '',
  category: '',
  experience: null, // Nuevo campo
  skills: '', // Nuevo campo (string separado por comas)
  website: '', // Nuevo campo
  phone: '',
  emailPublic: '', // Nuevo campo
  location: '', // Nuevo campo
  coverageArea: '', // Nuevo campo
  workingHours: '' // Nuevo campo
});

// Funciones para manejar la selección de imágenes
const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    form.avatar = URL.createObjectURL(file); // Creamos URL temporal para preview
  }
};

const handleCoverChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    form.cover = URL.createObjectURL(file); // Creamos URL temporal para preview
  }
};

const saveProfile = () => {
  // Aquí iría la lógica para enviar los datos a tu Backend (Node.js)
  console.log('Guardando perfil completo:', form);
  
  // Simulación de redirección al siguiente paso (Crear primer post)
  router.push('/create-first-post'); 
};
</script>