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
            <button type="submit" class="btn-primary">Guardar Perfil y Continuar</button>
          </div>

        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import './ProfessionalSetup.css'; // Asegúrate que tu CSS esté vinculado

const router = useRouter();

// --- ESTADO Y DATOS ---

// 1. Base de datos simulada de Ubicaciones (RD)
// En una app real, esto vendría de una API o Base de Datos
const locationsDB = {
  "Santiago de los Caballeros": ["Villa Olga", "Villa Olímpica", "Los Jardines", "Gurabo", "El Embrujo", "Pekín", "Cienfuegos", "Centro Histórico"],
  "Santo Domingo": ["Piantini", "Naco", "Gazcue", "Bella Vista", "Zona Colonial", "Arroyo Hondo", "Los Prados"],
  "La Vega": ["Villa Palmarito", "Las Carolinas", "El Hatico", "Centro Ciudad"],
  "Puerto Plata": ["Torre Alta", "Bayardo", "Playa Dorada", "San Felipe"]
};

// 2. Lista de Profesiones Comunes
const commonProfessions = [
  "Desarrollador Web", "Plomero", "Electricista", "Diseñador Gráfico",
  "Abogado", "Contador", "Profesor de Idiomas", "Carpintero",
  "Maquillista", "Fotógrafo", "Mecánico", "Personal Trainer"
];

const selectedProfessionSelect = ref(""); // Variable temporal para el select
const availableSectors = ref([]); // Lista dinámica de sectores
const geoStatus = ref(""); // Mensaje de estado del GPS

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
  latitude: null, // Guardaremos coordenadas si usan GPS
  longitude: null
});

// --- LÓGICA DE PROFESIÓN ---
const handleProfessionChange = () => {
  if (selectedProfessionSelect.value !== 'Otro') {
    // Si elige una de la lista, guardamos esa en el form
    form.profession = selectedProfessionSelect.value;
  } else {
    // Si elige 'Otro', limpiamos el form para que escriba
    form.profession = '';
  }
};

// --- LÓGICA DE UBICACIÓN ---

// A. Actualizar sectores cuando cambia la ciudad
const updateSectors = () => {
  if (form.location && locationsDB[form.location]) {
    availableSectors.value = locationsDB[form.location];
    form.coverageArea = ""; // Resetear sector al cambiar ciudad
  } else {
    availableSectors.value = [];
  }
};

// B. Geolocalización (Pedir al navegador)
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
      
      // AQUÍ OCURRE LA MAGIA:
      // En una app real, llamarías a una API (Google Maps o OpenStreetMap) 
      // para convertir lat/long en "Santiago". 
      // Por ahora, simularemos que detectó Santiago para que veas el efecto:
      
      form.location = "Santiago de los Caballeros"; 
      updateSectors(); // Carga los sectores de Santiago automáticamente
      geoStatus.value = "Ubicación detectada: Santiago";
    },
    (error) => {
      console.error(error);
      geoStatus.value = "No se pudo obtener la ubicación. Activa el GPS.";
    }
  );
};

// --- LÓGICA DE IMÁGENES (Igual que antes) ---
const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) form.avatar = URL.createObjectURL(file);
};
const handleCoverChange = (event) => {
  const file = event.target.files[0];
  if (file) form.cover = URL.createObjectURL(file);
};

const saveProfile = () => {
  console.log('Perfil guardado:', form);
  // Aquí enviarías form a tu backend
  router.push('/create-first-post');
};
</script>

<style scoped>
/* Agrega estos estilos a tu CSS o déjalos aquí */

/* Animación suave para el input de "Otro" */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.mb-2 { margin-bottom: 10px; }

/* Contenedor de ubicación + botón GPS */
.location-wrapper {
  display: flex;
  gap: 10px;
}
.location-wrapper select {
  flex: 1; /* El select ocupa todo el espacio posible */
}
.btn-geo {
  padding: 0 15px;
  font-size: 1.2rem;
  background: #EBF4F8;
  border: 1px solid #c5c6c9;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-geo:hover {
  background: #dcebf2;
  border-color: #0B4C6F;
}
.geo-status {
  display: block;
  margin-top: 5px;
  font-size: 0.8rem;
  color: #0B4C6F;
}

/* Contador de caracteres */
.char-counter {
  text-align: right; font-size: 0.85rem; color: #666; margin-top: 4px;
}
.limit-reached { color: #d9534f; font-weight: bold; }


.btn-geo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  background: #EBF4F8; /* Fondo suave */
  border: 1px solid #c5c6c9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 46px; /* Misma altura que el input select */
}

/* Estilo del Ícono SVG */
.icon-geo {
  width: 24px;
  height: 24px;
  color: #0B4C6F; /* Azul de tu marca */
  transition: transform 0.2s ease;
}

/* Efecto al pasar el mouse */
.btn-geo:hover {
  background: white;
  border-color: #F76B1C; /* Borde naranja al hacer hover */
  box-shadow: 0 2px 5px rgba(247, 107, 28, 0.15);
}

.btn-geo:hover .icon-geo {
  color: #F76B1C; /* El ícono cambia a naranja */
  transform: translateY(-2px); /* Pequeño salto animado */
}

/* Efecto al hacer click */
.btn-geo:active {
  transform: scale(0.95);
}
</style>