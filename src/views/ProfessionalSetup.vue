<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

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

// --- TOAST SYSTEM ---
const toast = ref({ show: false, msg: '', type: 'success' });
let toastTimer = null;
const showToast = (msg, type = 'success') => {
  if (toastTimer) clearTimeout(toastTimer);
  toast.value = { show: true, msg, type };
  toastTimer = setTimeout(() => { toast.value.show = false; }, 4000);
};

const locationsDB = {
  "Santiago de los Caballeros": ["Villa Olga", "Los Jardines", "Gurabo", "El Embrujo", "Pekin", "Cienfuegos", "Centro Historico"],
  "Santo Domingo": ["Piantini", "Naco", "Gazcue", "Bella Vista", "Zona Colonial", "Arroyo Hondo", "Los Prados"],
  "La Vega": ["Villa Palmarito", "Las Carolinas", "El Hatico", "Centro Ciudad"],
  "Puerto Plata": ["Torre Alta", "Bayardo", "Playa Dorada", "San Felipe"]
};

const commonProfessions = [
  "Plomero", "Electricista", "Abogado", "Desarrollador Web",
  "Contador", "Diseñador Gráfico", "Chef", "Carpintero",
  "Pintor", "Mecánico", "Técnico AC", "Médico", "Psicólogo", "Arquitecto"
];

const CATEGORIES = ["Hogar", "Tecnología", "Educación", "Belleza", "Eventos", "Salud", "Legal", "Construcción", "Otros"];
const HOURS = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
               "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM"];

const selectedProfessionSelect = ref("");
const availableSectors = ref([]);

// --- NUEVO: SCHEDULE MANAGER (Horario por días) ---
const schedule = reactive({
  Lunes:     { open: true,  from: "8:00 AM", to: "5:00 PM" },
  Martes:    { open: true,  from: "8:00 AM", to: "5:00 PM" },
  Miércoles: { open: true,  from: "8:00 AM", to: "5:00 PM" },
  Jueves:    { open: true,  from: "8:00 AM", to: "5:00 PM" },
  Viernes:   { open: true,  from: "8:00 AM", to: "5:00 PM" },
  Sábado:    { open: false, from: "9:00 AM", to: "1:00 PM" },
  Domingo:   { open: false, from: "9:00 AM", to: "1:00 PM" },
});

// --- NUEVO: SKILLS TAGS ---
const skillTags = ref([]);
const skillInput = ref('');

const addSkill = () => {
  const val = skillInput.value.trim();
  if (val && !skillTags.value.includes(val)) {
    skillTags.value.push(val);
  }
  skillInput.value = '';
};

const removeSkill = (index) => {
  skillTags.value.splice(index, 1);
};

const handleSkillKeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addSkill();
  } else if (e.key === 'Backspace' && skillInput.value === '' && skillTags.value.length > 0) {
    skillTags.value.pop();
  }
};

// --- FORM ---
const form = reactive({
  profession: '', bio: '', category: '', experience: null, 
  website: '', phone: '', emailPublic: '',
  location: '', coverageArea: '',
  priceFrom: '', priceTo: '', priceUnit: 'hora',
});

onMounted(async () => {
  const userId = localStorage.getItem("usuario_id");
  if (!userId) { router.push("/login"); return; }

  try {
    const { data } = await axios.get(`${API_URLS.PERFILES}/api/profesionales/${userId}`);
    
    if (data) {
      isEditingMode.value = true;
      form.bio = data.biografia || '';
      form.experience = data.anios_experiencia || 0;
      form.phone = data.telefono || '';
      form.emailPublic = data.email_publico || '';
      form.website = data.sitio_web || '';
      form.category = data.categoria_nombre || '';
      form.location = data.ciudad || '';
      form.coverageArea = data.sector || '';

      // Cargar habilidades como tags
      if (data.habilidades) {
        skillTags.value = data.habilidades.split(',').map(s => s.trim()).filter(Boolean);
      }

      // Intentar parsear horario JSON
      if (data.horario_texto) {
        try {
          const parsedSchedule = JSON.parse(data.horario_texto);
          Object.keys(parsedSchedule).forEach(day => {
            if (schedule[day]) {
              schedule[day] = parsedSchedule[day];
            }
          });
        } catch {
          // Si es texto plano, dejamos el schedule por defecto
        }
      }

      if (commonProfessions.includes(data.profesion)) {
        selectedProfessionSelect.value = data.profesion;
        form.profession = data.profesion;
      } else if (data.profesion) {
        selectedProfessionSelect.value = 'Otro';
        form.profession = data.profesion;
      }

      if (data.ciudad) {
        availableSectors.value = locationsDB[form.location] || [];
      }

      if (data.avatar_url) previewAvatar.value = data.avatar_url;
      if (data.cover_url) previewCover.value = data.cover_url;

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
  if (file.size > 50 * 1024 * 1024) { showToast("El archivo es demasiado grande (máximo 50MB).", "error"); return false; }
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
    // Guardar horario como JSON estructurado
    formData.append('horario', JSON.stringify(schedule));
    // Guardar habilidades como string separado por comas
    formData.append('habilidades', skillTags.value.join(', ')); 

    if (fileAvatar.value) formData.append('avatar', fileAvatar.value);
    if (fileCover.value) formData.append('cover', fileCover.value);

    await axios.post(`${API_URLS.PERFILES}/api/perfiles`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    showToast("¡Perfil guardado con éxito!", "success");
    setTimeout(() => {
      router.push('/professional/profile');
    }, 1000);

  } catch (error) {
    console.error("Error:", error);
    showToast("Error al guardar el perfil. Revisa la conexión.", "error");
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <div class="setup-container">
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

    <header class="setup-header">
      <div class="header-content">
        <div class="brand-logo" @click="goHome">
          <img src="/fotos/logo-servihub.png" alt="Logo" class="logo-img" />
          <span class="brand-text">ServiHub<span class="dot">.</span></span>
        </div>
        <div class="header-meta">
          <span class="header-badge">
            <i class="fa-solid fa-pencil" v-if="isEditingMode"></i>
            <i class="fa-solid fa-rocket" v-else></i>
            {{ isEditingMode ? ' Modo Edición' : ' Crear Perfil' }}
          </span>
        </div>
      </div>
    </header>

    <div class="form-wrapper">
      <div class="setup-layout">

        <!-- SIDEBAR DE PROGRESO -->
        <aside class="progress-sidebar">
          <h4>Tu Perfil</h4>
          <ul class="progress-list">
            <li class="progress-item done"><span class="check-icon"><i class="fa-solid fa-check"></i></span> Imágenes</li>
            <li class="progress-item done"><span class="check-icon"><i class="fa-solid fa-check"></i></span> Datos Profesionales</li>
            <li class="progress-item done"><span class="check-icon"><i class="fa-solid fa-check"></i></span> Habilidades</li>
            <li class="progress-item done"><span class="check-icon"><i class="fa-solid fa-check"></i></span> Contacto &amp; Ubicación</li>
            <li class="progress-item done"><span class="check-icon"><i class="fa-solid fa-check"></i></span> Horario de Atención</li>
          </ul>
          <div class="sidebar-tip">
            <span><i class="fa-regular fa-lightbulb"></i></span>
            <p>Un perfil completo recibe <strong>3x más clientes</strong> que uno sin información.</p>
          </div>
        </aside>

        <!-- FORMULARIO PRINCIPAL -->
        <div class="form-card">
          <h2>{{ isEditingMode ? 'Editar Perfil Profesional' : 'Crea tu Perfil Profesional' }}</h2>
          <p class="subtitle">Completa tu información para conectar con clientes potenciales.</p>

          <form @submit.prevent="saveProfile">

            <!-- ============================================ -->
            <!-- SECCION 1: IMÁGENES                          -->
            <!-- ============================================ -->
            <div class="form-section">
              <h3 class="section-title">
                <span class="section-num">1</span>
                Imágenes de Perfil
              </h3>
              <div class="profile-images-container">
                <div class="cover-upload" :class="{ 'has-image': previewCover }" :style="coverStyle">
                  <label for="coverInput" class="cover-label">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="upload-icon"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
                    <span>{{ previewCover ? 'Cambiar Portada' : 'Agregar Foto de Portada' }}</span>
                  </label>
                  <input type="file" id="coverInput" accept="image/*" @change="handleCoverChange" hidden />
                </div>
                <div class="avatar-upload">
                  <div class="avatar-preview">
                    <img v-if="previewAvatar" :src="previewAvatar" class="img-preview-real" />
                    <span v-else class="placeholder-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" /></svg>
                    </span>
                  </div>
                  <label for="avatarInput" class="btn-upload-avatar"><i class="fa-solid fa-camera"></i> Foto de Perfil</label>
                  <input type="file" id="avatarInput" accept="image/*" @change="handleAvatarChange" hidden />
                </div>
              </div>
              <p class="image-hint">Recomendado: Portada 1200×300px · Foto 400×400px</p>
            </div>

            <!-- ============================================ -->
            <!-- SECCION 2: DATOS PROFESIONALES               -->
            <!-- ============================================ -->
            <div class="form-section">
              <h3 class="section-title">
                <span class="section-num">2</span>
                Datos Profesionales
              </h3>
              <div class="form-grid">

                <div class="input-group full-width">
                  <label>Profesión / Título *</label>
                  <div class="profession-selector">
                    <select v-model="selectedProfessionSelect" @change="handleProfessionChange">
                      <option value="" disabled>Selecciona tu profesión</option>
                      <option v-for="job in commonProfessions" :key="job" :value="job">{{ job }}</option>
                      <option value="Otro">Otra profesión...</option>
                    </select>
                    <input
                      v-if="selectedProfessionSelect === 'Otro'"
                      type="text"
                      v-model="form.profession"
                      placeholder="Ej: Técnico de Refrigeración"
                      class="mt-2"
                      required
                    />
                  </div>
                </div>

                <div class="input-group full-width">
                  <label for="bio">Biografía Profesional *
                    <span class="char-counter-inline">{{ form.bio.length }}/500</span>
                  </label>
                  <textarea
                    id="bio"
                    v-model="form.bio"
                    placeholder="Describe tu experiencia, especialidades y lo que te hace destacar..."
                    rows="4"
                    maxlength="500"
                    required
                  ></textarea>
                </div>

                <div class="input-group">
                  <label for="category">Categoría Principal *</label>
                  <select id="category" v-model="form.category" required>
                    <option value="" disabled>Selecciona...</option>
                    <option v-for="cat in CATEGORIES" :key="cat" :value="cat.toLowerCase()">{{ cat }}</option>
                  </select>
                </div>

                <div class="input-group">
                  <label for="experience">Años de Experiencia</label>
                  <div class="input-with-unit">
                    <input type="number" id="experience" v-model="form.experience" placeholder="0" min="0" max="50"/>
                    <span class="unit-label">años</span>
                  </div>
                </div>

                <div class="input-group full-width">
                  <label for="website">Sitio Web / Portfolio (Opcional)</label>
                  <div class="input-icon-wrap">
                    <span class="input-prefix"><i class="fa-solid fa-globe"></i></span>
                    <input type="url" id="website" v-model="form.website" placeholder="https://mi-sitio-web.com" />
                  </div>
                </div>
              </div>
            </div>

            <!-- ============================================ -->
            <!-- SECCION 3: HABILIDADES (TAGS)                -->
            <!-- ============================================ -->
            <div class="form-section">
              <h3 class="section-title">
                <span class="section-num">3</span>
                Habilidades &amp; Especialidades
              </h3>
              <p class="section-desc">Agrega las habilidades que mejor te describen. Presiona Enter para añadir cada una.</p>
              <div class="tags-input-container">
                <div class="tags-area">
                  <span v-for="(skill, i) in skillTags" :key="i" class="skill-tag">
                    {{ skill }}
                    <button type="button" @click="removeSkill(i)" class="tag-remove">×</button>
                  </span>
                  <input
                    type="text"
                    v-model="skillInput"
                    @keydown="handleSkillKeydown"
                    @blur="addSkill"
                    placeholder="Ej: Instalación, Reparación..."
                    class="tag-input-field"
                  />
                </div>
                <p v-if="skillTags.length === 0" class="tags-hint">Aún no tienes habilidades. ¡Empieza a escribir!</p>
              </div>
            </div>

            <!-- ============================================ -->
            <!-- SECCION 4: CONTACTO & UBICACIÓN              -->
            <!-- ============================================ -->
            <div class="form-section">
              <h3 class="section-title">
                <span class="section-num">4</span>
                Contacto &amp; Ubicación
              </h3>
              <div class="form-grid">
                <div class="input-group">
                  <label for="phone">Teléfono de Contacto *</label>
                  <div class="input-icon-wrap">
                    <span class="input-prefix"><i class="fa-solid fa-phone"></i></span>
                    <input type="tel" id="phone" v-model="form.phone" placeholder="809-555-5555" required />
                  </div>
                </div>
                <div class="input-group">
                  <label for="emailPublic">Email de Trabajo (Público)</label>
                  <div class="input-icon-wrap">
                    <span class="input-prefix"><i class="fa-solid fa-envelope"></i></span>
                    <input type="email" id="emailPublic" v-model="form.emailPublic" placeholder="contacto@ejemplo.com" />
                  </div>
                </div>
                <div class="input-group">
                  <label>Ciudad *</label>
                  <select v-model="form.location" @change="updateSectors" required>
                    <option value="" disabled>Selecciona ciudad</option>
                    <option v-for="(sectores, ciudad) in locationsDB" :key="ciudad" :value="ciudad">{{ ciudad }}</option>
                  </select>
                </div>
                <div class="input-group">
                  <label>Sector / Área</label>
                  <select v-model="form.coverageArea" :disabled="!form.location">
                    <option value="" disabled>{{ form.location ? 'Selecciona sector' : 'Elige ciudad primero' }}</option>
                    <option v-for="sector in availableSectors" :key="sector" :value="sector">{{ sector }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- ============================================ -->
            <!-- SECCION 5: HORARIO DE ATENCIÓN               -->
            <!-- ============================================ -->
            <div class="form-section">
              <h3 class="section-title">
                <span class="section-num">5</span>
                Horario de Atención
              </h3>
              <p class="section-desc">Configura tu disponibilidad semanal para que los clientes sepan cuándo contactarte.</p>
              
              <div class="schedule-grid">
                <div
                  v-for="(dayData, dayName) in schedule"
                  :key="dayName"
                  class="schedule-row"
                  :class="{ 'is-closed': !dayData.open }"
                >
                  <div class="day-toggle">
                    <label class="toggle-switch">
                      <input type="checkbox" v-model="dayData.open" />
                      <span class="toggle-slider"></span>
                    </label>
                    <span class="day-name">{{ dayName }}</span>
                  </div>

                  <div v-if="dayData.open" class="time-range">
                    <select v-model="dayData.from" class="time-select">
                      <option v-for="h in HOURS" :key="h" :value="h">{{ h }}</option>
                    </select>
                    <span class="time-sep">→</span>
                    <select v-model="dayData.to" class="time-select">
                      <option v-for="h in HOURS" :key="h" :value="h">{{ h }}</option>
                    </select>
                  </div>
                  <div v-else class="closed-label">
                    <span>No disponible</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- BOTON GUARDAR -->
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="router.push('/professional/dashboard')">
                Cancelar
              </button>
              <button type="submit" class="btn-primary" :disabled="isSaving">
                <span v-if="isSaving" class="spinner">⟳</span>
                <span v-if="isSaving">Guardando...</span>
            <span v-else>
              <i class="fa-solid fa-save" v-if="isEditingMode"></i>
              <i class="fa-solid fa-rocket" v-else></i>
              {{ isEditingMode ? ' Guardar Cambios' : ' Publicar Perfil' }}
            </span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ====== LAYOUT GENERAL ====== */
.setup-container { background: #F0F4F8; min-height: 100vh; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; }

/* HEADER */
.setup-header { background: #fff; border-bottom: 1px solid #e5e7eb; padding: 16px 32px; }
.header-content { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.brand-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.logo-img { height: 38px; }
.brand-text { font-size: 1.4rem; font-weight: 800; color: #111; }
.dot { color: #F97316; }
.header-badge { background: #EEF2FF; color: #4338CA; font-size: 0.85rem; font-weight: 700; padding: 4px 12px; border-radius: 20px; }

/* LAYOUT DOS COLUMNAS */
.form-wrapper { flex: 1; padding: 32px; display: flex; justify-content: center; }
.setup-layout { display: flex; gap: 28px; width: 100%; max-width: 1100px; align-items: flex-start; }

/* SIDEBAR */
.progress-sidebar { width: 240px; background: white; border-radius: 16px; padding: 24px; border: 1px solid #e5e7eb; position: sticky; top: 20px; flex-shrink: 0; }
.progress-sidebar h4 { margin: 0 0 16px 0; color: #111; font-size: 1rem; font-weight: 700; }
.progress-list { list-style: none; padding: 0; margin: 0 0 20px 0; display: flex; flex-direction: column; gap: 10px; }
.progress-item { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #555; font-weight: 500; }
.progress-item.done { color: #059669; }
.check-icon { width: 22px; height: 22px; background: #D1FAE5; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #059669; font-weight: 800; flex-shrink: 0; }
.sidebar-tip { background: #FFFBEB; border: 1px solid #FEF3C7; border-radius: 10px; padding: 12px; display: flex; gap: 8px; align-items: flex-start; }
.sidebar-tip p { margin: 0; font-size: 0.8rem; color: #92400E; line-height: 1.5; }

/* FORM CARD */
.form-card { flex: 1; background: white; border-radius: 16px; padding: 36px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.form-card h2 { font-size: 1.6rem; font-weight: 800; color: #111; margin-bottom: 6px; }
.subtitle { color: #6B7280; margin-bottom: 32px; font-size: 0.95rem; }

/* SECCIONES */
.form-section { margin-bottom: 36px; padding-bottom: 36px; border-bottom: 1px solid #F3F4F6; }
.form-section:last-child { border-bottom: none; margin-bottom: 0; }

.section-title { display: flex; align-items: center; gap: 12px; font-size: 1.1rem; font-weight: 700; color: #111; margin-bottom: 6px; }
.section-num { width: 28px; height: 28px; background: #0B4C6F; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; flex-shrink: 0; }
.section-desc { color: #6B7280; font-size: 0.9rem; margin-bottom: 20px; margin-top: 0; }

/* GRID */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-group.full-width { grid-column: 1 / -1; }
.input-group label { font-weight: 600; color: #374151; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; }

.input-group input, .input-group select, .input-group textarea {
  padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px;
  font-size: 0.95rem; font-family: inherit; background: #FAFAFA;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-group input:focus, .input-group select:focus, .input-group textarea:focus {
  border-color: #0B4C6F; box-shadow: 0 0 0 3px rgba(11,76,111,0.1); outline: none; background: white;
}
.input-group textarea { resize: vertical; }

/* INPUT CON PREFIJO */
.input-icon-wrap { position: relative; display: flex; align-items: center; }
.input-prefix { position: absolute; left: 12px; font-size: 1rem; z-index: 1; pointer-events: none; }
.input-icon-wrap input { padding-left: 36px; width: 100%; }

/* INPUT CON UNIDAD */
.input-with-unit { display: flex; align-items: center; border: 1.5px solid #E5E7EB; border-radius: 10px; overflow: hidden; background: #FAFAFA; }
.input-with-unit:focus-within { border-color: #0B4C6F; box-shadow: 0 0 0 3px rgba(11,76,111,0.1); background: white; }
.input-with-unit input { border: none; background: transparent; flex: 1; padding: 10px 14px; outline: none; }
.unit-label { padding: 10px 14px; background: #F3F4F6; color: #6B7280; font-size: 0.85rem; font-weight: 600; border-left: 1px solid #E5E7EB; white-space: nowrap; }

/* PROFESSION SELECTOR */
.profession-selector { display: flex; flex-direction: column; gap: 10px; }
.mt-2 { margin-top: 0; padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 0.95rem; font-family: inherit; background: #FAFAFA; }
.char-counter-inline { font-size: 0.8rem; color: #9CA3AF; font-weight: 400; }

/* IMÁGENES */
.profile-images-container { position: relative; margin-bottom: 60px; }
.cover-upload { width: 100%; height: 180px; background-color: #E5E7EB; background-size: cover; background-position: center; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 2px dashed #CBD5E0; transition: all 0.3s; cursor: pointer; }
.cover-upload:hover { border-color: #0B4C6F; }
.cover-upload.has-image { border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.cover-label { background: rgba(255,255,255,0.9); padding: 8px 18px; border-radius: 20px; cursor: pointer; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
.upload-icon { width: 18px; height: 18px; }
.avatar-upload { position: absolute; bottom: -50px; left: 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.avatar-preview { width: 100px; height: 100px; border-radius: 50%; background: white; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden; display: flex; align-items: center; justify-content: center; }
.img-preview-real { width: 100%; height: 100%; object-fit: cover; }
.placeholder-icon svg { width: 50px; height: 50px; color: #9CA3AF; }
.btn-upload-avatar { font-size: 0.8rem; color: #0B4C6F; background: white; border: 1.5px solid #0B4C6F; padding: 5px 12px; border-radius: 20px; cursor: pointer; font-weight: 600; transition: 0.2s; white-space: nowrap; }
.btn-upload-avatar:hover { background: #0B4C6F; color: white; }
.image-hint { font-size: 0.8rem; color: #9CA3AF; text-align: center; margin-top: 0; }

/* ======= SKILLS TAGS ======= */
.tags-input-container { border: 1.5px solid #E5E7EB; border-radius: 10px; background: #FAFAFA; transition: border-color 0.2s; }
.tags-input-container:focus-within { border-color: #0B4C6F; box-shadow: 0 0 0 3px rgba(11,76,111,0.1); background: white; }
.tags-area { display: flex; flex-wrap: wrap; gap: 8px; padding: 10px 12px; min-height: 48px; align-items: center; }
.skill-tag { display: inline-flex; align-items: center; gap: 6px; background: #EEF2FF; color: #4F46E5; font-size: 0.85rem; font-weight: 600; padding: 4px 10px; border-radius: 20px; border: 1px solid #C7D2FE; }
.tag-remove { background: none; border: none; color: #818CF8; cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0; display: flex; align-items: center; transition: color 0.2s; }
.tag-remove:hover { color: #4F46E5; }
.tag-input-field { border: none; background: transparent; outline: none; font-size: 0.9rem; flex: 1; min-width: 150px; font-family: inherit; padding: 4px 0; }
.tags-hint { color: #9CA3AF; font-size: 0.85rem; padding: 0 14px 10px; margin: 0; }

/* ======= SCHEDULE MANAGER ======= */
.schedule-grid { display: flex; flex-direction: column; gap: 8px; }
.schedule-row {
  display: flex; align-items: center; gap: 16px;
  padding: 12px 16px; border-radius: 10px;
  border: 1.5px solid #E5E7EB; background: white;
  transition: all 0.2s;
}
.schedule-row:not(.is-closed) { border-color: #BFDBFE; background: #F0F9FF; }
.schedule-row.is-closed { opacity: 0.6; }
.day-toggle { display: flex; align-items: center; gap: 12px; width: 160px; flex-shrink: 0; }
.day-name { font-weight: 600; color: #111; font-size: 0.9rem; }

/* Toggle Switch */
.toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; inset: 0; background: #D1D5DB; border-radius: 24px; cursor: pointer; transition: 0.3s; }
.toggle-slider::before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
.toggle-switch input:checked + .toggle-slider { background: #0B4C6F; }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }

.time-range { display: flex; align-items: center; gap: 10px; flex: 1; }
.time-select { padding: 6px 10px; border: 1.5px solid #BFDBFE; border-radius: 8px; background: white; font-size: 0.85rem; font-weight: 500; color: #1D4ED8; cursor: pointer; flex: 1; max-width: 130px; }
.time-sep { color: #6B7280; font-weight: 600; font-size: 1rem; }
.closed-label { color: #9CA3AF; font-size: 0.85rem; font-weight: 500; font-style: italic; }

/* ACCIONES */
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 10px; }
.btn-secondary { padding: 12px 24px; background: white; border: 1.5px solid #E5E7EB; border-radius: 10px; font-weight: 600; color: #6B7280; cursor: pointer; transition: 0.2s; }
.btn-secondary:hover { border-color: #9CA3AF; color: #374151; }
.btn-primary { padding: 12px 32px; background: #0B4C6F; color: white; border: none; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(11,76,111,0.25); }
.btn-primary:hover:not(:disabled) { background: #093a55; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
.spinner { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* RESPONSIVE */
@media (max-width: 900px) {
  .progress-sidebar { display: none; }
  .form-grid { grid-template-columns: 1fr; }
  .input-group.full-width { grid-column: 1; }
  .form-wrapper { padding: 16px; }
  .form-card { padding: 20px; }
  .day-toggle { width: 120px; }
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
</style>