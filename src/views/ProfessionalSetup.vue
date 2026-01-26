<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from "axios";
import './ProfessionalSetup.css'; 

const router = useRouter();

// --- DATOS ESTÁTICOS ---
const locationsDB = {
  "Santiago de los Caballeros": ["Villa Olga", "Villa Olímpica", "Los Jardines", "Gurabo", "El Embrujo", "Pekín", "Cienfuegos", "Centro Histórico"],
  "Santo Domingo": ["Piantini", "Naco", "Gazcue", "Bella Vista", "Zona Colonial", "Arroyo Hondo", "Los Prados"],
  "La Vega": ["Villa Palmarito", "Las Carolinas", "El Hatico", "Centro Ciudad"],
  "Puerto Plata": ["Torre Alta", "Bayardo", "Playa Dorada", "San Felipe"]
};

const commonProfessions = [
  "Desarrollador Web", "Plomero", "Electricista", "Diseñador Gráfico",
  "Abogado", "Contador", "Profesor de Idiomas", "Carpintero",
  "Maquillista", "Fotógrafo", "Mecánico", "Personal Trainer"
];

const selectedProfessionSelect = ref("");
const availableSectors = ref([]);
const geoStatus = ref("");
const isSaving = ref(false);

const form = reactive({
  avatar: null,
  cover: null,
  profession: '',
  bio: '',
  category: '',
  experience: null,
  skills: '',
  website: '',
  phone: '',
  emailPublic: '',
  location: '',
  coverageArea: '', 
  workingHours: '',
  latitude: null,
  longitude: null
});

// --- VALIDAR SESIÓN AL CARGAR ---
onMounted(() => {
  const userId = localStorage.getItem("usuario_id");
  if (!userId) {
    alert(" Por seguridad, debes iniciar sesión antes de configurar tu perfil.");
    router.push("/login");
  } else {
    console.log(" ID de usuario detectado:", userId);
  }
});

// --- FUNCIONES UI ---
const handleProfessionChange = () => {
  if (selectedProfessionSelect.value !== 'Otro') {
    form.profession = selectedProfessionSelect.value;
  } else {
    form.profession = '';
  }
};

const updateSectors = () => {
  if (form.location && locationsDB[form.location]) {
    availableSectors.value = locationsDB[form.location];
    form.coverageArea = ""; 
  } else {
    availableSectors.value = [];
  }
};

const detectLocation = () => {
  if (!navigator.geolocation) {
    geoStatus.value = "Tu navegador no soporta geolocalización.";
    return;
  }
  geoStatus.value = "Localizando...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      form.latitude = latitude;
      form.longitude = longitude;
      form.location = "Santiago de los Caballeros"; 
      updateSectors();
      geoStatus.value = "Ubicación detectada: Santiago";
    },
    (error) => {
      console.error(error);
      geoStatus.value = "No se pudo obtener la ubicación.";
    }
  );
};

const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) form.avatar = URL.createObjectURL(file);
};
const handleCoverChange = (event) => {
  const file = event.target.files[0];
  if (file) form.cover = URL.createObjectURL(file);
};

// --- GUARDAR PERFIL (CONEXIÓN AL BACKEND) ---
const saveProfile = async () => {
  const usuario_id = localStorage.getItem("usuario_id");

  if (!usuario_id) {
    alert("Error de sesión. ID de usuario perdido.");
    return;
  }

  isSaving.value = true;

  try {
    const habilidadesArray = form.skills ? form.skills.split(",").map(h => h.trim()) : [];

    const payload = {
      usuario_id: usuario_id,
      profesion: form.profession,
      biografia: form.bio,
      categoria: form.category,
      anios_experiencia: form.experience || 0,
      sitio_web: form.website,
      telefono: form.phone,
      email_publico: form.emailPublic,
      ciudad: form.location,
      sector: form.coverageArea,
      horario: form.workingHours,
      habilidades: habilidadesArray
    };

    console.log(" Enviando datos al puerto 3001:", payload);

    //  CAMBIO CRUCIAL: PUERTO 3001
    await axios.post("http://localhost:3001/api/perfiles", payload);

    alert("¡Perfil configurado exitosamente!");
    router.push("/client/dashboard"); // O a donde quieras redirigir

  } catch (error) {
    console.error(" Error al guardar perfil:", error);
    
    if (error.code === "ERR_NETWORK") {
      alert("Error: El servidor del puerto 3001 está apagado.");
    } else {
      // Muestra el error real que viene del backend
      const msg = error.response?.data?.message || "Error desconocido";
      alert("Hubo un error: " + msg);
    }
  } finally {
    isSaving.value = false;
  }
};
</script>

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
          </div>

          <div class="form-section professional-info-section">
            <h3 class="section-title">2. Detalles Profesionales</h3>
            <div class="form-grid">
              
              <div class="input-group full-width">
                <label>Profesión / Título Principal *</label>
                <select v-model="selectedProfessionSelect" @change="handleProfessionChange" class="mb-2">
                  <option value="" disabled selected>Selecciona tu profesión</option>
                  <option v-for="job in commonProfessions" :key="job" :value="job">{{ job }}</option>
                  <option value="Otro">Otro (Escribir manualmente)</option>
                </select>

                <input 
                  v-if="selectedProfessionSelect === 'Otro'"
                  type="text" 
                  v-model="form.profession" 
                  placeholder="Escribe tu profesión específica aquí..." 
                  required
                  class="animate-fade-in"
                />
              </div>

              <div class="input-group full-width">
                <label for="bio">Biografía Breve *</label>
                <textarea 
                  id="bio" 
                  v-model="form.bio" 
                  placeholder="Cuéntanos sobre tu experiencia..." 
                  rows="4"
                  maxlength="256"
                  required
                ></textarea>
                <div class="char-counter" :class="{ 'limit-reached': form.bio.length >= 256 }">
                  {{ form.bio.length }} / 256 caracteres
                </div>
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
                <input type="number" id="experience" v-model="form.experience" placeholder="Ej. 5" min="0"/>
              </div>

              <div class="input-group full-width">
                <label for="skills">Habilidades</label>
                <input type="text" id="skills" v-model="form.skills" placeholder="Ej. Grifos, Fugas, Tuberías PVC..." />
              </div>

              <div class="input-group full-width">
                <label for="website">Sitio Web (Opcional)</label>
                <input type="url" id="website" v-model="form.website" placeholder="https://..." />
              </div>
            </div>
          </div>

          <div class="form-section contact-info-section">
            <h3 class="section-title">3. Contacto y Zona de Trabajo</h3>
            <div class="form-grid">
              
              <div class="input-group">
                <label for="phone">Teléfono / WhatsApp *</label>
                <input type="tel" id="phone" v-model="form.phone" placeholder="809-555-5555" required />
              </div>

              <div class="input-group">
                <label for="emailPublic">Email Público (Opcional)</label>
                <input type="email" id="emailPublic" v-model="form.emailPublic" placeholder="contacto@..." />
              </div>

              <div class="input-group">
                <label>Ciudad Base *</label>
                <div class="location-wrapper">
                  <select v-model="form.location" @change="updateSectors" required>
                    <option value="" disabled>Elige tu ciudad</option>
                    <option v-for="(sectores, ciudad) in locationsDB" :key="ciudad" :value="ciudad">
                      {{ ciudad }}
                    </option>
                  </select>
                  
                  <button type="button" class="btn-geo" @click="detectLocation" title="Usar mi ubicación actual">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-geo">
                      <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
                <small v-if="geoStatus" class="geo-status">{{ geoStatus }}</small>
              </div>

              <div class="input-group">
                <label>Zona de Cobertura (Sector) *</label>
                <select v-model="form.coverageArea" :disabled="!form.location">
                  <option value="" disabled selected>
                    {{ form.location ? 'Selecciona un sector' : 'Primero elige una ciudad' }}
                  </option>
                  <option v-for="sector in availableSectors" :key="sector" :value="sector">
                    {{ sector }}
                  </option>
                </select>
              </div>

              <div class="input-group full-width">
                <label for="workingHours">Horario de Trabajo</label>
                <textarea id="workingHours" v-model="form.workingHours" placeholder="Ej. Lunes a Viernes 8am - 6pm" rows="3"></textarea>
              </div>

            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-primary" :disabled="isSaving">
              {{ isSaving ? 'Guardando...' : 'Guardar Perfil y Continuar' }}
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Estilos específicos que no estén en el CSS importado */
.animate-fade-in { animation: fadeIn 0.3s ease-in; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
.mb-2 { margin-bottom: 10px; }
.location-wrapper { display: flex; gap: 10px; }
.location-wrapper select { flex: 1; }
.btn-geo { display: flex; align-items: center; justify-content: center; padding: 0 12px; background: #EBF4F8; border: 1px solid #c5c6c9; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; height: 46px; }
.btn-geo:hover { background: white; border-color: #F76B1C; box-shadow: 0 2px 5px rgba(247, 107, 28, 0.15); }
.icon-geo { width: 24px; height: 24px; color: #0B4C6F; transition: transform 0.2s ease; }
.btn-geo:hover .icon-geo { color: #F76B1C; transform: translateY(-2px); }
.geo-status { display: block; margin-top: 5px; font-size: 0.8rem; color: #0B4C6F; }
.char-counter { text-align: right; font-size: 0.85rem; color: #666; margin-top: 4px; }
.limit-reached { color: #d9534f; font-weight: bold; }
button:disabled { opacity: 0.7; cursor: not-allowed; }
</style>