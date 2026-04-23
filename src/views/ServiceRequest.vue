<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js';

const router = useRouter();
const route  = useRoute();
const { state } = useUserSession();

// ─── ESTADO GENERAL ───────────────────────────────────────────
const isEditing   = computed(() => !!route.params.id);
const showBlock   = ref(false);
const step        = ref(1);          // Formulario multi-paso: 1, 2, 3
const isSubmitting = ref(false);
const submitted   = ref(false);
const toastMsg    = ref('');
const fileInput   = ref(null);
const imagePreview = ref(null);
const formError   = ref('');

// ─── FORMULARIO ───────────────────────────────────────────────
const form = ref({
  title:       '',
  category:    '',
  description: '',
  urgency:     'normal',
  budget_min:  '',
  budget_max:  '',
  location:    '',
  availability:'',
  image:       null,
});

// ─── CATEGORÍAS ───────────────────────────────────────────────
const categoryOptions = [
  'Electricidad', 'Plomería', 'Refrigeración', 'Carpintería',
  'Pintura', 'Tecnología', 'Jardinería', 'Mudanzas',
  'Limpieza', 'Seguridad', 'Climatización', 'Construcción',
  'Mecánica', 'Cerrajería', 'Gasfitería', 'Fumigación',
];

// Combobox de categoría
const categoryInput  = ref('');
const showCatDropdown = ref(false);
const filteredCategories = computed(() => {
  if (!categoryInput.value) return categoryOptions;
  return categoryOptions.filter(c =>
    c.toLowerCase().includes(categoryInput.value.toLowerCase())
  );
});
const selectCategory = (cat) => {
  form.value.category = cat;
  categoryInput.value = cat;
  showCatDropdown.value = false;
};
const onCategoryInput = () => {
  form.value.category = categoryInput.value;
  showCatDropdown.value = true;
};
const closeCatDropdown = () => setTimeout(() => { showCatDropdown.value = false; }, 150);

const urgencyOptions = [
  { id: 'urgente',  label: 'Urgente',  desc: 'Lo antes posible', color: '#EF4444' },
  { id: 'normal',   label: 'Normal',   desc: 'Esta semana',       color: '#F59E0B' },
  { id: 'flexible', label: 'Flexible', desc: 'Sin prisa',         color: '#22C55E' },
];

// ─── VALIDACIONES POR PASO ────────────────────────────────────
const step1Valid = computed(() => form.value.category.trim() !== '' && form.value.title.length >= 5);
const step2Valid = computed(() => form.value.description.length >= 20);
const step3Valid = computed(() => true); // Paso 3 es opcional

// ─── NAVEGACIÓN DEL FORMULARIO ────────────────────────────────
const nextStep = () => {
  formError.value = '';
  if (step.value === 1 && !step1Valid.value) {
    formError.value = 'Selecciona una categoría y escribe un título de al menos 5 caracteres.';
    return;
  }
  if (step.value === 2 && !step2Valid.value) {
    formError.value = 'La descripción debe tener al menos 20 caracteres para ayudar al profesional.';
    return;
  }
  step.value++;
};
const prevStep = () => { formError.value = ''; step.value--; };

// ─── PROGRESO ─────────────────────────────────────────────────
const progressWidth = computed(() => `${((step.value - 1) / 2) * 100}%`);

// ─── CARGA DE IMAGEN ──────────────────────────────────────────
const triggerUpload   = () => fileInput.value.click();
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) { formError.value = 'La imagen no debe superar 10 MB.'; return; }
  form.value.image = file;
  imagePreview.value = URL.createObjectURL(file);
};
const removeImage = () => {
  form.value.image = null;
  imagePreview.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

// ─── TOAST ────────────────────────────────────────────────────
const showToast = (msg) => {
  toastMsg.value = msg;
  setTimeout(() => toastMsg.value = '', 3500);
};

// ─── ENVÍO ────────────────────────────────────────────────────
const handleSubmit = async () => {
  formError.value = '';
  isSubmitting.value = true;

  const userId = state.user?.id || localStorage.getItem('usuario_id');
  if (!userId) {
    formError.value = 'No se pudo obtener tu sesión. Por favor vuelve a iniciar sesión.';
    isSubmitting.value = false;
    return;
  }

  const fd = new FormData();
  fd.append('cliente_id', userId);
  fd.append('titulo',      form.value.title);
  fd.append('categoria',   form.value.category);
  fd.append('descripcion', form.value.description);
  fd.append('urgencia',    form.value.urgency);
  fd.append('ubicacion',   form.value.location);
  fd.append('disponibilidad', form.value.availability);
  if (form.value.budget_min) fd.append('presupuesto_min', form.value.budget_min);
  if (form.value.budget_max) fd.append('presupuesto_max', form.value.budget_max);
  if (form.value.image)      fd.append('imagen', form.value.image);
  if (route.query.profesional_id) {
    fd.append('profesional_id', route.query.profesional_id);
  }

  try {
    await axios.post('http://localhost:3001/api/solicitudes', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    submitted.value = true;
  } catch (err) {
    console.error(err);
    formError.value = 'Ocurrió un error al publicar. Verifica tu conexión e intenta de nuevo.';
  } finally {
    isSubmitting.value = false;
  }
};

// ─── AL MONTAR ────────────────────────────────────────────────
onMounted(() => {
  const phone   = localStorage.getItem('usuario_telefono');
  const address = localStorage.getItem('usuario_direccion');
  if (!phone || !address) showBlock.value = true;

  // Pre-cargar ubicación del usuario si existe
  if (address) form.value.location = address;
});
</script>

<template>
  <div class="sr-wrapper">

    <!-- ═══════════════════════════════════════
         MODAL DE BLOQUEO
    ═══════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showBlock" class="block-overlay">
        <div class="block-card pop-in">
          <div class="block-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z" clip-rule="evenodd"/></svg>
          </div>
          <h3>Perfil incompleto</h3>
          <p>Para publicar solicitudes necesitas tener<br><strong>número de teléfono</strong> y <strong>dirección</strong> en tu perfil.</p>
          <div class="block-actions">
            <button class="btn-goto-profile" @click="router.push('/client/profile')">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z"/></svg>
              Completar mi perfil
            </button>
            <button class="btn-go-back" @click="router.push('/client/dashboard')">Volver al dashboard</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══════════════════════════════════════
         TOAST DE ÉXITO
    ═══════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="toastMsg" class="toast">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd"/></svg>
        {{ toastMsg }}
      </div>
    </Teleport>

    <!-- ═══════════════════════════════════════
         PANTALLA DE ÉXITO (post-submit)
    ═══════════════════════════════════════ -->
    <div v-if="submitted" class="success-screen pop-in">
      <div class="success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd"/></svg>
      </div>
      <h2>Solicitud publicada</h2>
      <p>Los profesionales especializados en <strong>{{ form.category }}</strong> recibirán tu solicitud y te contactarán pronto.</p>
      <div class="success-pills">
        <span>{{ form.title }}</span>
        <span>Urgencia: {{ urgencyOptions.find(u=>u.id===form.urgency)?.label }}</span>
        <span v-if="form.budget_max">Hasta RD$ {{ form.budget_max }}</span>
      </div>
      <div class="success-actions">
        <button class="btn-primary" @click="router.push('/client/dashboard')">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z" clip-rule="evenodd"/></svg>
          Ir al dashboard
        </button>
        <button class="btn-outline" @click="submitted=false; step=1; form.title=''; form.category=''; form.description=''; form.image=null; imagePreview=null;">
          Nueva solicitud
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════
         FORMULARIO PRINCIPAL
    ═══════════════════════════════════════ -->
    <div v-else :class="{ 'blurred': showBlock }">

      <!-- CABECERA -->
      <header class="sr-header">
        <div class="header-left">
          <button class="btn-back" @click="router.push('/client/dashboard')">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd"/></svg>
          </button>
          <div>
            <h1>{{ isEditing ? 'Editar solicitud' : 'Nueva solicitud' }}</h1>
            <p>Cuéntanos qué necesitas y los expertos vendrán a ti</p>
          </div>
        </div>
        <div class="step-badge">Paso {{ step }} de 3</div>
      </header>

      <!-- BARRA DE PROGRESO -->
      <div class="progress-container">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressWidth }"></div>
        </div>
        <div class="step-indicators">
          <div v-for="s in 3" :key="s" :class="['step-dot', { done: step > s, active: step === s }]">
            <span>{{ s }}</span>
            <div class="step-label">{{ ['¿Qué necesitas?','Detalles','Extras'][s-1] }}</div>
          </div>
        </div>
      </div>

      <!-- CONTENIDO DEL FORMULARIO -->
      <div class="form-card">

        <!-- ─── PASO 1: Categoría y título ─── -->
        <div v-if="step === 1" class="step-content">
          <div class="step-intro">
            <h2>¿Qué tipo de servicio necesitas?</h2>
            <p>Selecciona o escribe una categoría, luego ponle un título</p>
          </div>

          <!-- Combobox de categoría -->
          <div class="field-group">
            <label>Categoría <span class="required">*</span></label>
            <div class="combobox-wrap">
              <svg class="combobox-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd"/></svg>
              <input
                v-model="categoryInput"
                type="text"
                class="combobox-input"
                placeholder="Busca o escribe una categoría..."
                @input="onCategoryInput"
                @focus="showCatDropdown = true"
                @blur="closeCatDropdown"
                autocomplete="off"
              />
              <button v-if="categoryInput" type="button" class="combobox-clear" @click="categoryInput=''; form.value&&(form.value.category=''); showCatDropdown=false;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
              </button>
              <div v-if="showCatDropdown && filteredCategories.length > 0" class="cat-dropdown">
                <button
                  v-for="cat in filteredCategories"
                  :key="cat"
                  type="button"
                  class="cat-option"
                  :class="{ selected: form.category === cat }"
                  @mousedown.prevent="selectCategory(cat)"
                >
                  <svg v-if="form.category === cat" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="check-icon"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clip-rule="evenodd"/></svg>
                  {{ cat }}
                </button>
                <div v-if="categoryInput && !filteredCategories.includes(categoryInput)" class="cat-option cat-custom" @mousedown.prevent="selectCategory(categoryInput)">
                  Usar "{{ categoryInput }}" como categoría personalizada
                </div>
              </div>
            </div>
            <span v-if="form.category" class="cat-selected-tag">Seleccionado: <strong>{{ form.category }}</strong></span>
          </div>

          <div class="field-group">
            <label>Título de la solicitud <span class="required">*</span></label>
            <input
              v-model="form.title"
              type="text"
              :placeholder="form.category ? `Ej: Necesito ${form.category.toLowerCase()} para...` : 'Ej: Necesito instalar un abanico...'" 
              maxlength="80"
              class="field-input"
            />
            <div class="char-count">{{ form.title.length }}/80</div>
          </div>
        </div>

        <!-- ─── PASO 2: Descripción y urgencia ─── -->
        <div v-if="step === 2" class="step-content">
          <div class="step-intro">
            <h2>Cuéntanos más detalles</h2>
            <p>Entre más detalles, mejores propuestas recibirás</p>
          </div>

          <div class="field-group">
            <label>Descripción <span class="required">*</span></label>
            <textarea
              v-model="form.description"
              rows="5"
              class="field-input"
              placeholder="Describe el problema o servicio que necesitas. Por ejemplo: El compresor del aire acondicionado no arranca, hace 2 semanas dejó de funcionar. Marca LG, 12,000 BTU..."
              maxlength="600"
            ></textarea>
            <div class="char-count">{{ form.description.length }}/600</div>
            <div class="tips-row">
              <span class="tip-badge">Tip</span>
              <span>Menciona el modelo/marca, tiempo del problema, intentos previos de reparación.</span>
            </div>
          </div>

          <div class="field-group">
            <label>Nivel de urgencia</label>
            <div class="urgency-grid">
              <button
                v-for="opt in urgencyOptions"
                :key="opt.id"
                type="button"
                :class="['urgency-btn', { selected: form.urgency === opt.id }]"
                :style="form.urgency === opt.id ? { borderColor: opt.color, background: opt.color + '12' } : {}"
                @click="form.urgency = opt.id"
              >
                <span class="urgency-dot" :style="{ background: opt.color }"></span>
                <div>
                  <strong>{{ opt.label }}</strong>
                  <p>{{ opt.desc }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Evidencia visual -->
          <div class="field-group">
            <label>Foto del problema <span class="optional">(opcional)</span></label>
            <div class="upload-area" :class="{ 'has-img': imagePreview }" @click="!imagePreview && triggerUpload()">
              <div v-if="imagePreview" class="img-preview-wrap">
                <img :src="imagePreview" alt="Evidencia" />
                <button type="button" class="remove-img-btn" @click.stop="removeImage">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
                </button>
              </div>
              <div v-else class="upload-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clip-rule="evenodd"/></svg>
                <p>Haz clic para subir foto</p>
                <span>JPG, PNG o WEBP · Máx 10 MB</span>
              </div>
            </div>
            <input type="file" ref="fileInput" accept="image/*" @change="handleFileChange" style="display:none;" />
          </div>
        </div>

        <!-- ─── PASO 3: Extras ─── -->
        <div v-if="step === 3" class="step-content">
          <div class="step-intro">
            <h2>Últimos detalles</h2>
            <p>Información adicional para atraer mejores propuestas</p>
          </div>

          <div class="two-col">
            <div class="field-group">
              <label>Presupuesto mínimo (RD$)</label>
              <div class="input-prefix-wrap">
                <span class="prefix">RD$</span>
                <input v-model="form.budget_min" type="number" min="0" class="field-input prefix-input" placeholder="0" />
              </div>
            </div>
            <div class="field-group">
              <label>Presupuesto máximo (RD$)</label>
              <div class="input-prefix-wrap">
                <span class="prefix">RD$</span>
                <input v-model="form.budget_max" type="number" min="0" class="field-input prefix-input" placeholder="5,000" />
              </div>
            </div>
          </div>

          <div class="field-group">
            <label>Ubicación del servicio</label>
            <input v-model="form.location" type="text" class="field-input" placeholder="Ej: Piantini, Santo Domingo" />
          </div>

          <div class="field-group">
            <label>¿Cuándo estás disponible?</label>
            <select v-model="form.availability" class="field-input">
              <option value="">Selecciona disponibilidad</option>
              <option value="manana">Mañana (8am - 12pm)</option>
              <option value="tarde">Tarde (12pm - 6pm)</option>
              <option value="noche">Noche (6pm - 9pm)</option>
              <option value="finde">Fines de semana</option>
              <option value="cualquier">Cualquier momento</option>
            </select>
          </div>

          <!-- Resumen de la solicitud -->
          <div class="summary-card">
            <h4>Resumen de tu solicitud</h4>
            <div class="summary-row">
              <span class="summary-label">Categoría</span>
              <span>{{ form.category }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Título</span>
              <span>{{ form.title }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Urgencia</span>
              <span class="urgency-tag" :style="{ color: urgencyOptions.find(u=>u.id===form.urgency)?.color }">
                ● {{ urgencyOptions.find(u=>u.id===form.urgency)?.label }}
              </span>
            </div>
            <div v-if="form.budget_max" class="summary-row">
              <span class="summary-label">Presupuesto</span>
              <span>Hasta RD$ {{ Number(form.budget_max).toLocaleString() }}</span>
            </div>
            <div v-if="imagePreview" class="summary-row">
              <span class="summary-label">Foto</span>
              <span>✅ Incluida</span>
            </div>
          </div>
        </div>

        <!-- ─── ERROR ─── -->
        <div v-if="formError" class="form-error">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/></svg>
          {{ formError }}
        </div>

        <!-- ─── ACCIONES ─── -->
        <div class="form-actions">
          <button v-if="step > 1" type="button" class="btn-prev" @click="prevStep">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clip-rule="evenodd"/></svg>
            Atrás
          </button>
          <button v-if="step < 3" type="button" class="btn-next" @click="nextStep">
            Continuar
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clip-rule="evenodd"/></svg>
          </button>
          <button v-if="step === 3" type="button" class="btn-submit" :disabled="isSubmitting" @click="handleSubmit">
            <span v-if="isSubmitting" class="spinner"></span>
            <template v-else>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z"/></svg>
              Publicar solicitud
            </template>
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.sr-wrapper {
  font-family: 'Inter', sans-serif;
  max-width: 760px;
  margin: 0 auto;
  padding: 0 0 60px;
}

/* ─── BLOQUEO ─── */
.blurred { filter: blur(6px); pointer-events: none; user-select: none; opacity: 0.5; }

.block-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}
.block-card {
  background: white; border-radius: 20px; padding: 40px 32px;
  max-width: 400px; width: 90%; text-align: center;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3);
}
.block-icon {
  width: 72px; height: 72px;
  background: linear-gradient(135deg, #FEF3C7, #FDE68A);
  border-radius: 50%; margin: 0 auto 24px;
  display: flex; align-items: center; justify-content: center;
  color: #D97706;
}
.block-icon svg { width: 36px; height: 36px; }
.block-card h3 { font-size: 1.4rem; font-weight: 800; color: #0F172A; margin: 0 0 10px; }
.block-card p  { font-size: 0.92rem; color: #64748B; line-height: 1.6; margin: 0 0 28px; }
.block-card p strong { color: #0F172A; }
.block-actions { display: flex; flex-direction: column; gap: 12px; }
.btn-goto-profile {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(135deg, #1E293B, #0F172A);
  color: white; border: none; padding: 14px 20px;
  border-radius: 12px; font-weight: 700; font-size: 0.95rem;
  cursor: pointer; transition: transform .2s, box-shadow .2s;
}
.btn-goto-profile:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,.2); }
.btn-goto-profile svg { width: 18px; }
.btn-go-back { background: none; border: 1.5px solid #E2E8F0; color: #64748B; padding: 12px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: .2s; }
.btn-go-back:hover { background: #F8FAFC; }

/* ─── TOAST ─── */
.toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: #1E293B; color: white;
  padding: 14px 24px; border-radius: 12px;
  display: flex; align-items: center; gap: 10px;
  font-weight: 600; font-size: 0.92rem;
  box-shadow: 0 10px 30px rgba(0,0,0,.25);
  z-index: 99999;
  animation: slideUp .35s ease;
}
.toast svg { width: 18px; color: #4ADE80; }
@keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* ─── ÉXITO ─── */
.success-screen {
  text-align: center; padding: 64px 24px;
  background: white; border-radius: 20px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 4px 24px rgba(0,0,0,.04);
}
.success-icon {
  width: 80px; height: 80px;
  background: linear-gradient(135deg, #D1FAE5, #A7F3D0);
  border-radius: 50%; margin: 0 auto 24px;
  display: flex; align-items: center; justify-content: center;
  color: #10B981;
}
.success-icon svg { width: 44px; height: 44px; }
.success-screen h2 { font-size: 1.8rem; font-weight: 800; color: #0F172A; margin: 0 0 12px; }
.success-screen p  { font-size: 1rem; color: #64748B; line-height: 1.6; margin: 0 0 24px; max-width: 440px; margin-inline: auto; }
.success-screen p strong { color: #0F172A; }
.success-pills { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 32px; }
.success-pills span  { background: #F1F5F9; color: #475569; padding: 6px 14px; border-radius: 99px; font-size: 0.85rem; font-weight: 600; }
.success-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* ─── HEADER ─── */
.sr-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 28px 0 24px;
  border-bottom: 1px solid #F1F5F9;
  margin-bottom: 28px;
}
.header-left { display: flex; align-items: center; gap: 14px; }
.sr-header h1 { font-size: 1.5rem; font-weight: 800; color: #0F172A; margin: 0; }
.sr-header p  { font-size: 0.85rem; color: #94A3B8; margin: 2px 0 0; }
.btn-back {
  width: 40px; height: 40px; border-radius: 10px;
  border: 1.5px solid #E2E8F0; background: white;
  display: flex; align-items: center; justify-content: center;
  color: #64748B; cursor: pointer; flex-shrink: 0; transition: .2s;
}
.btn-back:hover { border-color: #CBD5E1; background: #F8FAFC; }
.btn-back svg { width: 18px; }
.step-badge { background: #EFF6FF; color: #3B82F6; font-weight: 700; font-size: 0.82rem; padding: 6px 14px; border-radius: 99px; }

/* ─── PROGRESO ─── */
.progress-container { margin-bottom: 32px; }
.progress-track { height: 4px; background: #F1F5F9; border-radius: 99px; margin-bottom: 20px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #3B82F6, #8B5CF6); border-radius: 99px; transition: width .5s cubic-bezier(.4,0,.2,1); }
.step-indicators { display: flex; justify-content: space-between; }
.step-dot {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  position: relative;
}
.step-dot > span {
  width: 28px; height: 28px; border-radius: 50%;
  background: #E2E8F0; color: #94A3B8;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.78rem; font-weight: 800;
  transition: .3s;
}
.step-dot.active > span { background: #3B82F6; color: white; box-shadow: 0 0 0 4px rgba(59,130,246,.2); }
.step-dot.done > span  { background: #1E293B; color: white; }
.step-label { font-size: 0.72rem; color: #94A3B8; font-weight: 600; white-space: nowrap; }
.step-dot.active .step-label { color: #3B82F6; }

/* ─── TARJETA DEL FORMULARIO ─── */
.form-card {
  background: white; border: 1px solid #E2E8F0;
  border-radius: 20px; padding: 40px;
  box-shadow: 0 4px 24px rgba(0,0,0,.04);
}

/* ─── INTRO DEL PASO ─── */
.step-intro { text-align: center; margin-bottom: 28px; }
.step-intro h2 { font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0 0 6px; }
.step-intro p  { font-size: 0.88rem; color: #94A3B8; margin: 0; }

/* ─── COMBOBOX DE CATEGORÍA ─── */
.combobox-wrap {
  position: relative;
}
.combobox-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  width: 16px; color: #94A3B8; pointer-events: none;
}
.combobox-input {
  width: 100%; padding: 11px 40px 11px 36px;
  border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 0.93rem; font-family: 'Inter', sans-serif; color: #1E293B;
  background: white; transition: border-color .2s;
}
.combobox-input:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
.combobox-input::placeholder { color: #CBD5E1; }
.combobox-clear {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  width: 24px; height: 24px; border-radius: 50%;
  background: #F1F5F9; border: none; color: #94A3B8;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: .15s;
}
.combobox-clear:hover { background: #E2E8F0; color: #475569; }
.combobox-clear svg { width: 13px; }
.cat-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: white; border: 1.5px solid #E2E8F0; border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
  z-index: 100; max-height: 220px; overflow-y: auto;
}
.cat-option {
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; background: none; border: none;
  text-align: left; font-size: 0.88rem; color: #1E293B;
  cursor: pointer; transition: .15s; font-family: 'Inter', sans-serif;
}
.cat-option:hover { background: #F8FAFC; }
.cat-option.selected { color: #3B82F6; font-weight: 700; background: #EFF6FF; }
.cat-option.cat-custom { color: #6366F1; font-style: italic; border-top: 1px solid #F1F5F9; }
.check-icon { width: 15px; flex-shrink: 0; color: #3B82F6; }
.cat-selected-tag {
  font-size: 0.76rem; color: #64748B; margin-top: 4px;
}
.cat-selected-tag strong { color: #1E293B; }


/* ─── CAMPOS ─── */
.field-group { display: flex; flex-direction: column; gap: 7px; margin-bottom: 22px; }
.field-group label { font-size: 0.78rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: .07em; }
.required { color: #EF4444; }
.optional  { color: #94A3B8; font-weight: 500; text-transform: none; letter-spacing: 0; font-size: 0.75rem; }
.field-input {
  padding: 12px 14px; border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 0.93rem; font-family: 'Inter', sans-serif; color: #1E293B;
  background: white; width: 100%; transition: border-color .2s;
  appearance: none; -webkit-appearance: none;
}
.field-input:focus { outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }
.field-input::placeholder { color: #CBD5E1; }
.char-count { font-size: 0.72rem; color: #94A3B8; text-align: right; }
.mt-6 { margin-top: 8px; }

.tips-row { display: flex; align-items: flex-start; gap: 8px; margin-top: 4px; font-size: 0.78rem; color: #64748B; line-height: 1.5; }
.tip-badge { background: #FEF3C7; color: #92400E; padding: 2px 8px; border-radius: 99px; font-weight: 700; font-size: 0.72rem; white-space: nowrap; }

/* ─── URGENCIA ─── */
.urgency-grid { display: flex; gap: 10px; flex-wrap: wrap; }
.urgency-btn {
  flex: 1; min-width: 120px;
  display: flex; align-items: center; gap: 10px;
  padding: 14px; border: 1.5px solid #E2E8F0; border-radius: 10px;
  background: white; cursor: pointer; transition: .2s; text-align: left;
}
.urgency-btn:hover { background: #F8FAFC; }
.urgency-btn.selected { box-shadow: 0 0 0 3px rgba(0,0,0,.06); }
.urgency-btn strong { display: block; font-size: 0.88rem; color: #0F172A; }
.urgency-btn p { margin: 0; font-size: 0.76rem; color: #94A3B8; }
.urgency-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

/* ─── UPLOAD ─── */
.upload-area {
  border: 2px dashed #CBD5E1; border-radius: 12px; overflow: hidden;
  cursor: pointer; transition: .2s; background: #F8FAFC;
}
.upload-area:hover:not(.has-img) { border-color: #94A3B8; background: #F1F5F9; }
.upload-area.has-img { border-style: solid; border-color: #E2E8F0; cursor: default; }
.upload-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 36px 20px; color: #94A3B8;
}
.upload-placeholder svg { width: 40px; }
.upload-placeholder p { margin: 0; font-weight: 600; color: #64748B; }
.upload-placeholder span { font-size: 0.75rem; }
.img-preview-wrap { position: relative; }
.img-preview-wrap img { width: 100%; max-height: 260px; object-fit: cover; display: block; }
.remove-img-btn {
  position: absolute; top: 10px; right: 10px;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(0,0,0,.55); color: white; border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: .2s;
}
.remove-img-btn:hover { background: rgba(0,0,0,.8); }
.remove-img-btn svg { width: 16px; }

/* ─── PASO 3: DOS COLUMNAS ─── */
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.input-prefix-wrap { position: relative; display: flex; align-items: center; }
.prefix { position: absolute; left: 13px; font-size: 0.85rem; font-weight: 700; color: #94A3B8; }
.prefix-input { padding-left: 48px !important; }

/* ─── RESUMEN ─── */
.summary-card {
  background: #F8FAFC; border: 1px solid #E2E8F0;
  border-radius: 12px; padding: 20px; margin-top: 8px;
}
.summary-card h4 { font-size: 0.88rem; font-weight: 800; color: #0F172A; margin: 0 0 14px; }
.summary-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid #F1F5F9;
  font-size: 0.85rem; color: #1E293B;
}
.summary-row:last-child { border-bottom: none; }
.summary-label { color: #94A3B8; font-weight: 600; }
.urgency-tag { font-weight: 700; }

/* ─── ERROR ─── */
.form-error {
  display: flex; align-items: center; gap: 8px;
  background: #FEF2F2; color: #DC2626;
  border: 1px solid #FECACA; border-radius: 10px;
  padding: 12px 16px; font-size: 0.85rem; font-weight: 600;
  margin-top: 20px;
}
.form-error svg { width: 18px; flex-shrink: 0; }

/* ─── ACCIONES ─── */
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 28px; padding-top: 24px; border-top: 1px solid #F1F5F9; }
.btn-prev {
  display: flex; align-items: center; gap: 6px;
  background: white; border: 1.5px solid #E2E8F0; color: #64748B;
  padding: 12px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: .2s;
}
.btn-prev:hover { border-color: #CBD5E1; background: #F8FAFC; }
.btn-prev svg { width: 16px; }
.btn-next {
  display: flex; align-items: center; gap: 8px;
  background: #1E293B; color: white;
  padding: 12px 24px; border-radius: 10px; font-weight: 700; border: none;
  cursor: pointer; transition: .2s; margin-left: auto;
}
.btn-next:hover { background: #0F172A; transform: translateY(-1px); }
.btn-next svg { width: 16px; }
.btn-submit {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, #3B82F6, #6366F1);
  color: white; padding: 13px 28px; border-radius: 10px;
  font-weight: 800; font-size: 0.95rem; border: none;
  cursor: pointer; transition: .2s; box-shadow: 0 4px 14px rgba(59,130,246,.35);
  margin-left: auto;
}
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59,130,246,.4); }
.btn-submit:disabled { opacity: .6; cursor: not-allowed; }
.btn-submit svg { width: 17px; }

/* ─── BOTONES GENERALES ─── */
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  background: #1E293B; color: white;
  padding: 12px 24px; border-radius: 10px; font-weight: 700;
  border: none; cursor: pointer; transition: .2s;
}
.btn-primary:hover { background: #0F172A; transform: translateY(-1px); }
.btn-primary svg { width: 17px; }
.btn-outline {
  display: inline-flex; align-items: center; gap: 8px;
  background: white; color: #475569;
  border: 1.5px solid #E2E8F0; padding: 12px 20px;
  border-radius: 10px; font-weight: 700; cursor: pointer; transition: .2s;
}
.btn-outline:hover { border-color: #CBD5E1; background: #F8FAFC; }

/* ─── SPINNER ─── */
.spinner {
  width: 18px; height: 18px;
  border: 2.5px solid rgba(255,255,255,.3);
  border-top-color: white; border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── ANIMACIÓN ─── */
.pop-in { animation: popIn .4s cubic-bezier(.175,.885,.32,1.275); }
@keyframes popIn { from { opacity: 0; transform: scale(.95) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }

/* ─── RESPONSIVE ─── */
@media (max-width: 600px) {
  .form-card { padding: 24px 18px; }
  .categories-grid { grid-template-columns: repeat(3, 1fr); }
  .two-col { grid-template-columns: 1fr; }
  .urgency-grid { flex-direction: column; }
  .form-actions { flex-direction: column-reverse; }
  .btn-next, .btn-submit { margin-left: 0; width: 100%; justify-content: center; }
  .btn-prev { width: 100%; justify-content: center; }
  .step-dot .step-label { display: none; }
}
</style>