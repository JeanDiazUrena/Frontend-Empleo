<script setup>
import { reactive, ref, onMounted, computed } from 'vue'; 
import { useRouter } from 'vue-router';
import axios from "axios";
import './ProfessionalSetup.css'; 

const router = useRouter();
const isSaving = ref(false);
const isEditingMode = ref(false);

const fileAvatar = ref(null);
const fileCover = ref(null);
const previewAvatar = ref(null);
const previewCover = ref(null);

const locationsDB = {
  "Santiago de los Caballeros": ["Villa Olga", "Los Jardines", "Gurabo", "El Embrujo", "Pekin", "Cienfuegos", "Centro Historico"],
  "Santo Domingo": ["Piantini", "Naco", "Gazcue", "Bella Vista", "Zona Colonial", "Arroyo Hondo", "Los Prados"],
  "La Vega": ["Villa Palmarito", "Las Carolinas", "El Hatico", "Centro Ciudad"],
  "Puerto Plata": ["Torre Alta", "Bayardo", "Playa Dorada", "San Felipe"]
};
const commonProfessions = ["Plomero", "Electricista", "Abogado", "Desarrollador Web"];
const selectedProfessionSelect = ref("");
const availableSectors = ref([]);

const form = reactive({
  profession: '', bio: '', category: '', experience: null, 
  skills: '', website: '', phone: '', emailPublic: '',
  location: '', coverageArea: '', workingHours: ''
});

onMounted(async () => {
  const userId = localStorage.getItem("usuario_id");
  if (!userId) { router.push("/login"); return; }

  try {
    const { data } = await axios.get(`http://localhost:3001/api/profesionales/${userId}`);
    
    if (data) {
        isEditingMode.value = true;
        form.bio = data.bio || '';
        form.experience = data.experience || 0;
        form.phone = data.phone || '';
        form.emailPublic = data.emailPublic || '';
        form.website = data.website || '';
        form.workingHours = data.workingHours || '';
        form.skills = data.skills || '';
        form.category = data.category || ''; 

        if (commonProfessions.includes(data.profession)) {
            selectedProfessionSelect.value = data.profession;
            form.profession = data.profession;
        } else {
            selectedProfessionSelect.value = 'Otro';
            form.profession = data.profession;
        }

        if (data.city) {
            form.location = data.city;
            availableSectors.value = locationsDB[form.location] || [];
            form.coverageArea = data.sector || '';
        }

        if (data.avatar) previewAvatar.value = data.avatar;
        if (data.cover) previewCover.value = data.cover;
    } else {
        isEditingMode.value = false;
    }
  } catch (error) {
    isEditingMode.value = false;
  }
});

const goHome = () => router.push('/');

const handleProfessionChange = () => {
  form.profession = selectedProfessionSelect.value !== 'Otro' ? selectedProfessionSelect.value : '';
};

const updateSectors = () => {
  availableSectors.value = (form.location && locationsDB[form.location]) ? locationsDB[form.location] : [];
  form.coverageArea = "";
};

const validateFileSize = (file) => {
    if (file.size > 50 * 1024 * 1024) { alert("Archivo muy grande."); return false; }
    return true;
};

const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file && validateFileSize(file)) {
    fileAvatar.value = file;
    previewAvatar.value = URL.createObjectURL(file);
  }
};

const handleCoverChange = (event) => {
  const file = event.target.files[0];
  if (file && validateFileSize(file)) {
    fileCover.value = file;
    previewCover.value = URL.createObjectURL(file);
  }
};

const coverStyle = computed(() => {
  return previewCover.value ? { backgroundImage: `url(${previewCover.value})` } : {}; 
});

const saveProfile = async () => {
  const usuario_id = localStorage.getItem("usuario_id");
  const usuario_nombre = localStorage.getItem("usuario_nombre");

  if (!usuario_id) return;
  isSaving.value = true;

  try {
    const formData = new FormData();
    formData.append('usuario_id', usuario_id);
    formData.append('nombre', usuario_nombre || '');
    formData.append('profesion', form.profession);
    formData.append('biografia', form.bio);
    formData.append('categoria', form.category);
    formData.append('anios_experiencia', form.experience || 0);
    formData.append('sitio_web', form.website || '');
    formData.append('telefono', form.phone);
    formData.append('email_publico', form.emailPublic || '');
    formData.append('ciudad', form.location);
    formData.append('sector', form.coverageArea);
    formData.append('horario', form.workingHours || '');
    formData.append('habilidades', form.skills); 

    if (fileAvatar.value) formData.append('avatar', fileAvatar.value);
    if (fileCover.value) formData.append('cover', fileCover.value);

    await axios.post("http://localhost:3001/api/perfiles", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    alert("Perfil guardado con exito!");
    
    if (isEditingMode.value) {
        router.push('/professional/profile');
    } else {
        localStorage.clear(); 
        router.push('/login');
    }

  } catch (error) {
    console.error("Error:", error);
    alert("Error al guardar.");
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="setup-container">
    <header class="setup-header">
      <div class="header-content">
        <div class="brand-logo" @click="goHome">
          <img src="/fotos/logo-servihub.png" alt="Logo" class="logo-img" />
          <span class="brand-text">ServiHub<span class="dot">.</span></span>
        </div>
      </div>
    </header>

    <div class="form-wrapper">
      <div class="form-card">
        <h2>{{ isEditingMode ? 'Editar Perfil' : 'Crea tu Perfil' }}</h2>
        <p class="subtitle">Manten tu informacion actualizada.</p>

        <form @submit.prevent="saveProfile">
          
          <div class="form-section images-section">
            <h3 class="section-title">1. Imagenes</h3>
            <div class="profile-images-container">
              <div class="cover-upload" :class="{ 'has-image': previewCover }" :style="coverStyle">
                <label for="coverInput" class="cover-label">
                  <span v-if="!previewCover">Subir Portada</span>
                  <span v-else class="change-cover-text">Cambiar</span>
                </label>
                <input type="file" id="coverInput" accept="image/*" @change="handleCoverChange" hidden />
              </div>
              <div class="avatar-upload">
                <div class="avatar-preview">
                  <img v-if="previewAvatar" :src="previewAvatar" class="img-preview-real" />
                  <span v-else class="placeholder-icon">IMG</span>
                </div>
                <label for="avatarInput" class="btn-upload-avatar">Cambiar Foto</label>
                <input type="file" id="avatarInput" accept="image/*" @change="handleAvatarChange" hidden />
              </div>
            </div>
          </div>

          <div class="form-section professional-info-section">
            <h3 class="section-title">2. Datos Profesionales</h3>
            <div class="form-grid">
              
              <div class="input-group full-width">
                <label>Profesion *</label>
                <select v-model="selectedProfessionSelect" @change="handleProfessionChange" class="mb-2">
                  <option value="" disabled selected>Selecciona tu profesión</option>
                  <option v-for="job in commonProfessions" :key="job" :value="job">{{ job }}</option>
                  <option value="Otro">Otro</option>
                </select>
                <input v-if="selectedProfessionSelect === 'Otro'" type="text" v-model="form.profession" placeholder="Escribe tu titulo (Ej: Técnico de Refrigeración)" required />
              </div>

              <div class="input-group full-width">
                <label for="bio">Biografia *</label>
                <textarea id="bio" v-model="form.bio" placeholder="Describe brevemente tu experiencia y servicios..." rows="4" maxlength="256" required></textarea>
                <div class="char-counter">{{ form.bio.length }} / 256</div>
              </div>

              <div class="input-group">
                <label for="category">Categoria *</label>
                <select id="category" v-model="form.category" required>
                  <option value="" disabled selected>Selecciona</option>
                  <option value="hogar">Hogar</option>
                  <option value="tecnologia">Tecnologia</option>
                  <option value="educacion">Educacion</option>
                  <option value="belleza">Belleza</option>
                  <option value="eventos">Eventos</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              <div class="input-group">
                <label for="experience">Anios Exp.</label>
                <input type="number" id="experience" v-model="form.experience" placeholder="Ej: 5" min="0"/>
              </div>

              <div class="input-group full-width">
                <label for="skills">Habilidades</label>
                <input type="text" id="skills" v-model="form.skills" placeholder="Ej: Instalacion, Mantenimiento, Reparacion..." />
              </div>

              <div class="input-group full-width">
                <label for="website">Web (Opcional)</label>
                <input type="url" id="website" v-model="form.website" placeholder="https://mi-sitio-web.com" />
              </div>
            </div>
          </div>

          <div class="form-section contact-info-section">
            <h3 class="section-title">3. Contacto</h3>
            <div class="form-grid">
              <div class="input-group">
                <label for="phone">Telefono *</label>
                <input type="tel" id="phone" v-model="form.phone" placeholder="Ej: 809-555-5555" required />
              </div>
              <div class="input-group">
                <label for="emailPublic">Email Publico</label>
                <input type="email" id="emailPublic" v-model="form.emailPublic" placeholder="contacto@ejemplo.com" />
              </div>
              <div class="input-group">
                <label>Ciudad *</label>
                <select v-model="form.location" @change="updateSectors" required>
                  <option value="" disabled>Selecciona</option>
                  <option v-for="(sectores, ciudad) in locationsDB" :key="ciudad" :value="ciudad">{{ ciudad }}</option>
                </select>
              </div>
              <div class="input-group">
                <label>Sector *</label>
                <select v-model="form.coverageArea" :disabled="!form.location">
                  <option value="" disabled selected>Selecciona</option>
                  <option v-for="sector in availableSectors" :key="sector" :value="sector">{{ sector }}</option>
                </select>
              </div>
              <div class="input-group full-width">
                <label for="workingHours">Horario</label>
                <textarea id="workingHours" v-model="form.workingHours" placeholder="Ej: Lunes a Viernes de 8:00 AM a 5:00 PM" rows="3"></textarea>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="isSaving">
              {{ isSaving ? 'Guardando...' : (isEditingMode ? 'Guardar Cambios' : 'Crear Perfil') }}
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-header { background-color: #ffffff; border-bottom: 1px solid #e5e7eb; padding: 15px 0; display: flex; justify-content: center; }
.header-content { width: 100%; max-width: 1100px; display: flex; justify-content: flex-start; padding: 0 20px; }
.brand-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.logo-img { height: 40px; width: auto; object-fit: contain; }
.brand-text { font-family: 'Inter', sans-serif; font-weight: 800; font-size: 1.5rem; color: #111827; letter-spacing: -0.5px; line-height: 1; }
.dot { color: #F97316; }
.animate-fade-in { animation: fadeIn 0.3s ease-in; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
.mb-2 { margin-bottom: 10px; }
.location-wrapper { display: flex; gap: 10px; width: 100%; }
.location-wrapper select { flex: 1; }
.char-counter { text-align: right; font-size: 0.85rem; color: #666; margin-top: 4px; }
.limit-reached { color: #d9534f; font-weight: bold; }
button:disabled { opacity: 0.7; cursor: not-allowed; }
.cover-upload { height: 180px; background-color: #E2E8F0; background-size: cover; background-position: center; border-radius: 8px; position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 50px; border: 2px dashed #CBD5E1; transition: all 0.3s ease; }
.cover-upload.has-image { border: 2px solid #fff; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.cover-label { background: rgba(255, 255, 255, 0.9); padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: 600; color: #333; transition: 0.2s; }
.cover-label:hover { transform: scale(1.05); }
.avatar-upload { position: absolute; bottom: -40px; left: 30px; display: flex; flex-direction: column; align-items: center; }
.avatar-preview { width: 110px; height: 110px; border-radius: 50%; background: white; border: 4px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; }
.img-preview-real { width: 100%; height: 100%; object-fit: cover; }
.placeholder-icon { font-size: 3rem; color: #94A3B8; }
.btn-upload-avatar { font-size: 0.85rem; color: #0B4C6F; background: white; border: 1px solid #0B4C6F; padding: 4px 12px; border-radius: 15px; cursor: pointer; font-weight: 600; }
.btn-upload-avatar:hover { background: #0B4C6F; color: white; }
</style>