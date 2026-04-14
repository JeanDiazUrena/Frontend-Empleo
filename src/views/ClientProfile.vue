<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js';

const router = useRouter();
const { state, updateProfile } = useUserSession();

// --- ESTADO ---
const user = ref({
  name: "", email: "", phone: "", location: "",
  avatar: "", banner: "", joinDate: "", id: null
});

const activeTab = ref('info');
const isLoading = ref(true);
const isSaving = ref(false);
const saveSuccess = ref(false);
const saveError = ref('');
const serviceHistory = ref([]);

// Archivos de imagen
const avatarFile = ref(null);
const bannerFile = ref(null);
const avatarPreview = ref('');
const bannerPreview = ref('');

// Referencias DOM
const avatarInput = ref(null);
const bannerInput = ref(null);

// Edit modal
const showEditModal = ref(false);
const editForm = ref({ name: '', email: '', phone: '', location: '' });

// Locations dropdown
const locationsDB = {
  "Santiago de los Caballeros": ["Villa Olga", "Los Jardines", "Gurabo", "El Embrujo", "Pekin", "Cienfuegos", "Centro Histórico"],
  "Santo Domingo": ["Piantini", "Naco", "Gazcue", "Bella Vista", "Zona Colonial", "Arroyo Hondo", "Los Prados"],
  "La Vega": ["Villa Palmarito", "Las Carolinas", "El Hatico", "Centro Ciudad"],
  "Puerto Plata": ["Torre Alta", "Bayardo", "Playa Dorada", "San Felipe"]
};

const selectedCity = ref('');
const selectedSector = ref('');
const availableSectors = computed(() =>
  selectedCity.value ? (locationsDB[selectedCity.value] || []) : []
);
const updateCity = () => { selectedSector.value = ''; };

const isProfileIncomplete = computed(() => !user.value.phone || !user.value.location);
const userInitials = computed(() => {
  const n = user.value.name || '';
  const parts = n.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.substring(0, 2).toUpperCase() || 'U';
});

// --- CARGAR DATOS ---
onMounted(async () => {
  const userId = state.user?.id || localStorage.getItem('usuario_id');
  if (!userId) { router.push('/login'); return; }

  user.value = {
    ...user.value,
    name: state.user?.name || localStorage.getItem('usuario_nombre') || '',
    email: state.user?.email || '',
    id: userId
  };

  try {
    const { data } = await axios.get(`http://localhost:3001/api/clientes/${userId}`);
    if (data) {
      user.value = {
        name: data.nombre || user.value.name,
        email: data.email || user.value.email,
        phone: data.telefono || '',
        location: data.direccion || '',
        avatar: data.avatar || '',
        banner: data.banner || '',
        joinDate: data.created_at
          ? new Date(data.created_at).toLocaleDateString('es-DO', { year: 'numeric', month: 'long' })
          : '',
        id: userId
      };
      updateProfile({ name: user.value.name, email: user.value.email, avatar: user.value.avatar });

      // Precargar solicitudes
      try {
        const reqRes = await axios.get(`http://localhost:3000/api/solicitudes/cliente/${userId}`);
        serviceHistory.value = reqRes.data || [];
      } catch {}
    }
  } catch (error) {
    console.error('Error cargando perfil:', error);
  } finally {
    isLoading.value = false;
  }
});

// --- EDITAR ---
const openEditModal = () => {
  editForm.value = {
    name: user.value.name,
    email: user.value.email,
    phone: user.value.phone,
    location: user.value.location
  };
  avatarFile.value = null;
  bannerFile.value = null;
  avatarPreview.value = user.value.avatar;
  bannerPreview.value = user.value.banner;

  // Preseleccionar ciudad/sector si los datos existen
  const parts = user.value.location ? user.value.location.split(',').map(s => s.trim()) : [];
  if (parts.length >= 2 && locationsDB[parts[0]]) {
    selectedCity.value = parts[0];
    selectedSector.value = parts[1] || '';
  } else {
    selectedCity.value = '';
    selectedSector.value = '';
  }

  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  saveError.value = '';
};

const handleImageChange = (event, type) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) { saveError.value = 'Imagen muy grande (máx. 20MB).'; return; }
  const url = URL.createObjectURL(file);
  if (type === 'avatar') { avatarFile.value = file; avatarPreview.value = url; }
  else                   { bannerFile.value = file;  bannerPreview.value = url; }
};

// --- GUARDAR ---
const saveChanges = async () => {
  saveError.value = '';
  if (!editForm.value.name.trim() || !editForm.value.phone.trim()) {
    saveError.value = 'Nombre y Teléfono son obligatorios.';
    return;
  }

  isSaving.value = true;
  const locationString = selectedCity.value && selectedSector.value
    ? `${selectedCity.value}, ${selectedSector.value}`
    : (editForm.value.location || '');

  try {
    const formData = new FormData();
    formData.append('usuario_id', user.value.id);
    formData.append('nombre', editForm.value.name);
    formData.append('email', editForm.value.email);
    formData.append('phone', editForm.value.phone);
    formData.append('location', locationString);
    if (avatarFile.value) formData.append('avatar', avatarFile.value);
    if (bannerFile.value) formData.append('banner', bannerFile.value);

    const response = await axios.post('http://localhost:3001/api/clientes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const updatedClient = response.data.cliente;
    if (updatedClient) {
      const newData = {
        name: updatedClient.nombre,
        email: updatedClient.email,
        phone: updatedClient.telefono,
        location: updatedClient.direccion,
        avatar: updatedClient.avatar,
        banner: updatedClient.banner,
        id: user.value.id,
        joinDate: user.value.joinDate
      };
      user.value = { ...newData };
      updateProfile(newData);
    }

    saveSuccess.value = true;
    setTimeout(() => { saveSuccess.value = false; }, 3000);
    closeEditModal();
  } catch (error) {
    saveError.value = 'Error al conectar con el servidor. Intenta de nuevo.';
    console.error('Error al guardar:', error);
  } finally {
    isSaving.value = false;
  }
};

// --- ESTADO DE SOLICITUDES ---
const statusConfig = {
  pendiente:   { label: 'Pendiente',   color: '#F59E0B', bg: '#FEF3C7' },
  activo:      { label: 'Activo',      color: '#3B82F6', bg: '#DBEAFE' },
  completado:  { label: 'Completado',  color: '#10B981', bg: '#D1FAE5' },
  cancelado:   { label: 'Cancelado',   color: '#EF4444', bg: '#FEE2E2' },
};
const getStatus = (s) => statusConfig[s?.toLowerCase()] || { label: s || 'Pendiente', color: '#6B7280', bg: '#F3F4F6' };

const goToExplore = () => router.push('/client/explore');
const goToRequest = (id) => router.push(`/client/request/edit/${id}`);
</script>

<template>
  <div class="profile-layout">

    <!-- LOADING SKELETON -->
    <div v-if="isLoading" class="loading-skeleton">
      <div class="skel-banner"></div>
      <div class="skel-content">
        <div class="skel-circle"></div>
        <div class="skel-lines">
          <div class="skel-line w60"></div>
          <div class="skel-line w40"></div>
        </div>
      </div>
    </div>

    <template v-else>

      <!-- ===== BANNER + AVATAR CARD ===== -->
      <div class="profile-header-card">

        <div
          class="banner-area"
          :style="user.banner ? { backgroundImage: `url(${user.banner})` } : {}"
        >
          <div class="banner-overlay"></div>
        </div>

        <div class="header-content">
          <div class="avatar-wrapper">
            <div class="avatar-circle">
              <img v-if="user.avatar" :src="user.avatar" class="avatar-img" alt="avatar">
              <div v-else class="avatar-initials">{{ userInitials }}</div>
            </div>
            <!-- Dot solo si hay número -->
            <span v-if="user.phone" class="status-dot" title="Contactable"></span>
          </div>

          <div class="user-text">
            <div class="name-row">
              <h1>{{ user.name || 'Cliente' }}</h1>
              <span class="client-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="badge-icon"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>
                Cliente ServiHub
              </span>
            </div>

            <div class="meta-chips">
              <span class="meta-chip" v-if="user.location">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="chip-icon"><path fill-rule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clip-rule="evenodd" /></svg>
                {{ user.location }}
              </span>
              <span class="meta-chip chip-phone" v-if="user.phone">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="chip-icon"><path fill-rule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clip-rule="evenodd" /></svg>
                {{ user.phone }}
              </span>
              <span class="meta-chip chip-join" v-if="user.joinDate">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="chip-icon"><path fill-rule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clip-rule="evenodd" /></svg>
                Miembro desde {{ user.joinDate }}
              </span>

              <!-- Alerta de perfil incompleto -->
              <span v-if="isProfileIncomplete" class="meta-chip chip-warning" @click="openEditModal">
                <i class="fa-solid fa-triangle-exclamation"></i> Perfil incompleto — Completar
              </span>
            </div>
          </div>

          <div class="header-actions">
            <button class="btn-edit" @click="openEditModal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="btn-icon"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
              Editar Perfil
            </button>
          </div>
        </div>

        <!-- STATS BAR -->
        <div class="stats-bar">
          <div class="stat-item">
            <strong>{{ serviceHistory.length }}</strong>
            <span>Solicitudes</span>
          </div>
          <div class="stat-item">
            <strong>{{ serviceHistory.filter(s => s.estado === 'completado').length }}</strong>
            <span>Completadas</span>
          </div>
          <div class="stat-item">
            <strong>0</strong>
            <span>Favoritos</span>
          </div>
        </div>
      </div>

      <!-- ===== TOAST ÉXITO ===== -->
      <Transition name="toast">
        <div v-if="saveSuccess" class="toast-success">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="toast-icon"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clip-rule="evenodd" /></svg>
          ¡Perfil guardado correctamente!
        </div>
      </Transition>

      <!-- ===== TABS NAV ===== -->
      <div class="tabs-nav">
        <button :class="['tab-btn', { active: activeTab === 'info' }]" @click="activeTab = 'info'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>
          Mi Información
        </button>
        <button :class="['tab-btn', { active: activeTab === 'history' }]" @click="activeTab = 'history'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd" /></svg>
          Historial
          <span v-if="serviceHistory.length" class="tab-count">{{ serviceHistory.length }}</span>
        </button>
        <button :class="['tab-btn', { active: activeTab === 'reviews' }]" @click="activeTab = 'reviews'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" /></svg>
          Mis Reseñas
        </button>
      </div>

      <!-- ===== TAB: INFORMACIÓN ===== -->
      <div v-if="activeTab === 'info'" class="content-grid">

        <!-- Datos personales -->
        <div class="info-card full-card">
          <div class="card-header-label">Datos de Contacto</div>
          <div class="contact-grid">

            <div class="contact-item">
              <div class="contact-icon name-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>
              </div>
              <div class="contact-info">
                <span class="contact-label">Nombre Completo</span>
                <span class="contact-val">{{ user.name || '—' }}</span>
              </div>
            </div>

            <div class="contact-item">
              <div class="contact-icon email-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>
              </div>
              <div class="contact-info">
                <span class="contact-label">Correo Electrónico</span>
                <span class="contact-val">{{ user.email || '—' }}</span>
              </div>
            </div>

            <div class="contact-item">
              <div class="contact-icon phone-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clip-rule="evenodd" /></svg>
              </div>
              <div class="contact-info">
                <span class="contact-label">Teléfono</span>
                <span class="contact-val" :class="{ 'missing': !user.phone }">
                  {{ user.phone || 'Sin teléfono — Completa tu perfil' }}
                </span>
              </div>
            </div>

            <div class="contact-item">
              <div class="contact-icon loc-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clip-rule="evenodd" /></svg>
              </div>
              <div class="contact-info">
                <span class="contact-label">Dirección / Sector</span>
                <span class="contact-val" :class="{ 'missing': !user.location }">
                  {{ user.location || 'Sin dirección — Completa tu perfil' }}
                </span>
              </div>
            </div>
          </div>

          <!-- CTA si incompleto -->
          <div v-if="isProfileIncomplete" class="incomplete-cta">
            <div class="incomplete-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div class="incomplete-text">
              <strong>Perfil incompleto</strong>
              <p>Agrega tu teléfono y dirección para que los profesionales puedan contactarte.</p>
            </div>
            <button class="btn-complete" @click="openEditModal">Completar ahora →</button>
          </div>
        </div>

      </div>

      <!-- ===== TAB: HISTORIAL ===== -->
      <div v-if="activeTab === 'history'" class="content-block">

        <div v-if="serviceHistory.length === 0" class="empty-state-full">
          <div class="empty-icon"><i class="fa-solid fa-clipboard-list"></i></div>
          <h4>Sin solicitudes aún</h4>
          <p>Cuando contrates un servicio, podrás ver el historial completo aquí.</p>
          <button class="btn-cta" @click="goToExplore">Explorar Profesionales</button>
        </div>

        <div v-else class="history-list">
          <div
            v-for="req in serviceHistory"
            :key="req.id"
            class="history-card"
          >
            <div class="history-left">
              <div class="history-status-dot"
                :style="{ background: getStatus(req.estado).color }">
              </div>
              <div class="history-info">
                <h5>{{ req.title || req.titulo || 'Solicitud #' + req.id }}</h5>
                <div class="history-meta">
                  <span class="hist-date">
                    {{ new Date(req.fecha_creacion || Date.now()).toLocaleDateString('es-DO', { day:'2-digit', month:'short', year:'numeric' }) }}
                  </span>
                  <span
                    class="hist-status-badge"
                    :style="{ color: getStatus(req.estado).color, background: getStatus(req.estado).bg }"
                  >
                    {{ getStatus(req.estado).label }}
                  </span>
                </div>
              </div>
            </div>
            <button class="btn-view" @click="goToRequest(req.id)">Ver detalles →</button>
          </div>
        </div>

      </div>

      <!-- ===== TAB: RESEÑAS ===== -->
      <div v-if="activeTab === 'reviews'" class="content-block">
        <div class="empty-state-full">
          <div class="empty-icon"><i class="fa-solid fa-star"></i></div>
          <h4>Sin reseñas aún</h4>
          <p>Cuando califiques a un profesional, tus reseñas aparecerán aquí.</p>
        </div>
      </div>

    </template>

    <!-- ============================= -->
    <!-- MODAL DE EDICIÓN              -->
    <!-- ============================= -->
    <Teleport to="body">
      <div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
        <div class="edit-modal">

          <div class="modal-header">
            <h3>Editar Perfil</h3>
            <button class="modal-close" @click="closeEditModal">×</button>
          </div>

          <div class="modal-body">

            <!-- IMÁGENES -->
            <div class="images-section">
              <div
                class="banner-upload"
                :style="bannerPreview ? { backgroundImage: `url(${bannerPreview})` } : {}"
                @click="bannerInput.click()"
              >
                <div class="banner-upload-hint">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="cam-svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" stroke-width="2" /></svg>
                  <span>{{ bannerPreview ? 'Cambiar portada' : 'Agregar portada' }}</span>
                </div>
              </div>
              <input ref="bannerInput" type="file" accept="image/*" hidden @change="e => handleImageChange(e, 'banner')" />

              <div class="avatar-upload-wrap">
                <div class="modal-avatar" @click="avatarInput.click()">
                  <img v-if="avatarPreview" :src="avatarPreview" class="modal-avatar-img" alt="avatar">
                  <div v-else class="modal-avatar-initials">{{ userInitials }}</div>
                  <div class="avatar-cam-overlay">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" class="cam-svg-sm"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><circle cx="12" cy="13" r="3" stroke-width="2" /></svg>
                  </div>
                </div>
                <input ref="avatarInput" type="file" accept="image/*" hidden @change="e => handleImageChange(e, 'avatar')" />
                <span class="avatar-hint">Foto de perfil</span>
              </div>
            </div>

            <!-- CAMPOS -->
            <div class="modal-form-grid">

              <div class="modal-field">
                <label>Nombre Completo *</label>
                <div class="field-icon-wrap">
                  <span class="field-prefix"><i class="fa-solid fa-user"></i></span>
                  <input type="text" v-model="editForm.name" placeholder="Juan Pérez" />
                </div>
              </div>

              <div class="modal-field">
                <label>Correo Electrónico</label>
                <div class="field-icon-wrap">
                  <span class="field-prefix"><i class="fa-solid fa-envelope"></i></span>
                  <input type="email" v-model="editForm.email" placeholder="correo@ejemplo.com" />
                </div>
              </div>

              <div class="modal-field">
                <label>Teléfono *</label>
                <div class="field-icon-wrap">
                  <span class="field-prefix"><i class="fa-solid fa-phone"></i></span>
                  <input type="tel" v-model="editForm.phone" placeholder="809-555-5555" />
                </div>
              </div>

              <div class="modal-field">
                <label>Ciudad</label>
                <select v-model="selectedCity" @change="updateCity">
                  <option value="">Selecciona ciudad</option>
                  <option v-for="(s, c) in locationsDB" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>

              <div class="modal-field">
                <label>Sector / Área</label>
                <select v-model="selectedSector" :disabled="!selectedCity">
                  <option value="">{{ selectedCity ? 'Selecciona sector' : 'Elige ciudad primero' }}</option>
                  <option v-for="s in availableSectors" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>

              <div class="modal-field full-field">
                <label>O escribe la dirección manualmente</label>
                <div class="field-icon-wrap">
                  <span class="field-prefix"><i class="fa-solid fa-location-dot"></i></span>
                  <input
                    type="text"
                    v-model="editForm.location"
                    placeholder="Ej: Calle Principal #12, Los Jardines, Santiago"
                  />
                </div>
                <span class="field-hint">Si seleccionas ciudad y sector, se usará esa combinación.</span>
              </div>

            </div>

            <!-- ERROR -->
            <div v-if="saveError" class="modal-error">{{ saveError }}</div>

          </div>

          <div class="modal-footer">
            <button class="btn-modal-cancel" @click="closeEditModal">Cancelar</button>
            <button class="btn-modal-save" @click="saveChanges" :disabled="isSaving">
              <span v-if="isSaving">Guardando...</span>
              <span v-else><i class="fa-solid fa-floppy-disk"></i> Guardar Cambios</span>
            </button>
          </div>

        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
/* ===== LAYOUT ===== */
.profile-layout { width: 100%; max-width: 960px; margin: 0 auto; padding-bottom: 60px; font-family: 'Inter', sans-serif; }

/* ===== HEADER CARD ===== */
.profile-header-card { background: white; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.banner-area { height: 200px; background: linear-gradient(135deg, #0B4C6F 0%, #1a6fa0 40%, #16a34a 100%); background-size: cover; background-position: center; position: relative; }
.banner-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.1); }

.header-content { padding: 0 28px 20px; display: flex; align-items: flex-start; gap: 20px; flex-wrap: wrap; }
.avatar-wrapper { margin-top: -56px; position: relative; z-index: 2; flex-shrink: 0; }
.avatar-circle { width: 120px; height: 120px; background: white; border: 4px solid white; border-radius: 50%; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initials { font-size: 2.5rem; font-weight: 800; color: #0B4C6F; background: #E0F2FE; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.status-dot { position: absolute; bottom: 8px; right: 8px; width: 16px; height: 16px; background: #22C55E; border: 3px solid white; border-radius: 50%; }

.user-text { flex: 1; padding-top: 12px; min-width: 0; }
.name-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.name-row h1 { margin: 0; font-size: 1.65rem; font-weight: 800; color: #111; }

.client-badge { display: inline-flex; align-items: center; gap: 5px; background: #E0F2FE; color: #0B4C6F; font-size: 0.78rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; }
.badge-icon { width: 14px; height: 14px; }

.meta-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.meta-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 0.82rem; font-weight: 600; padding: 4px 12px; border-radius: 20px; background: #F1F5F9; color: #475569; border: none; }
.chip-icon { width: 14px; height: 14px; }
.chip-phone { background: #EFF6FF; color: #0B4C6F; }
.chip-join { background: #EFF6FF; color: #0B4C6F; }
.chip-warning { background: #FEF3C7; color: #92400E; cursor: pointer; border: 1px solid #FCD34D; transition: 0.2s; padding: 4px 10px; border-radius: 20px; }
.chip-warning:hover { background: #FEF9C3; }

.header-actions { padding-top: 14px; flex-shrink: 0; }
.btn-edit { display: inline-flex; align-items: center; gap: 6px; background: white; border: 1.5px solid #0B4C6F; color: #0B4C6F; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
.btn-edit:hover { background: #0B4C6F; color: white; }
.btn-icon { width: 16px; height: 16px; }

.stats-bar { display: flex; border-top: 1px solid #F3F4F6; padding: 16px 28px; gap: 40px; background: #FAFAFA; }
.stat-item { display: flex; flex-direction: column; }
.stat-item strong { font-size: 1.1rem; font-weight: 800; color: #111; }
.stat-item span { font-size: 0.8rem; color: #6B7280; margin-top: 2px; }

/* ===== TOAST ===== */
.toast-success { position: fixed; bottom: 30px; right: 30px; background: #059669; color: white; padding: 12px 20px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 25px rgba(5,150,105,0.3); z-index: 10000; }
.toast-icon { width: 20px; height: 20px; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }

/* ===== TABS ===== */
.tabs-nav { display: flex; background: white; border-radius: 12px; border: 1px solid #E5E7EB; overflow: hidden; margin-bottom: 20px; }
.tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 12px; background: none; border: none; border-bottom: 3px solid transparent; cursor: pointer; font-size: 0.9rem; font-weight: 600; color: #6B7280; transition: 0.2s; }
.tab-btn svg { width: 18px; height: 18px; }
.tab-btn:hover { color: #0B4C6F; background: #F8FAFC; }
.tab-btn.active { color: #0B4C6F; border-bottom-color: #0B4C6F; background: #F0F9FF; }
.tab-count { background: #0B4C6F; color: white; font-size: 0.72rem; font-weight: 800; padding: 2px 7px; border-radius: 20px; }

/* ===== CONTENT ===== */
.content-grid { display: grid; gap: 16px; }
.content-block { display: flex; flex-direction: column; gap: 16px; }
.full-card { grid-column: 1 / -1; }

.info-card { background: white; border-radius: 12px; border: 1px solid #E5E7EB; padding: 24px; }
.card-header-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6B7280; margin-bottom: 20px; }

/* Contacto Grid */
.contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
.contact-item { display: flex; align-items: center; gap: 14px; }
.contact-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #F8FAFC; }
.contact-icon svg { width: 20px; height: 20px; }
.name-icon { background: #EFF6FF; color: #0B4C6F; }
.email-icon { background: #EFF6FF; color: #0B4C6F; }
.phone-icon { background: #EFF6FF; color: #0B4C6F; }
.loc-icon { background: #EFF6FF; color: #0B4C6F; }
.contact-info { display: flex; flex-direction: column; min-width: 0; }
.contact-label { font-size: 0.75rem; color: #9CA3AF; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
.contact-val { font-size: 0.95rem; color: #111; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.contact-val.missing { color: #F59E0B; font-style: italic; font-weight: 500; }

/* Incomplete CTA */
.incomplete-cta { display: flex; align-items: center; gap: 16px; background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 12px; padding: 16px 20px; margin-top: 16px; }
.incomplete-icon { font-size: 1.5rem; flex-shrink: 0; }
.incomplete-text { flex: 1; }
.incomplete-text strong { display: block; color: #92400E; font-size: 0.95rem; margin-bottom: 2px; }
.incomplete-text p { margin: 0; color: #92400E; font-size: 0.85rem; }
.btn-complete { background: #F59E0B; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; white-space: nowrap; transition: 0.2s; }
.btn-complete:hover { background: #D97706; }

/* ===== HISTORIAL ===== */
.history-list { display: flex; flex-direction: column; gap: 12px; }
.history-card { background: white; border-radius: 12px; border: 1px solid #E5E7EB; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; transition: box-shadow 0.2s; }
.history-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.history-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
.history-status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.history-info { min-width: 0; }
.history-info h5 { margin: 0 0 4px 0; font-size: 1rem; color: #111; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history-meta { display: flex; align-items: center; gap: 10px; }
.hist-date { font-size: 0.82rem; color: #9CA3AF; }
.hist-status-badge { font-size: 0.78rem; font-weight: 700; padding: 2px 10px; border-radius: 20px; }
.btn-view { background: white; border: 1.5px solid #0B4C6F; color: #0B4C6F; padding: 7px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: 0.2s; }
.btn-view:hover { background: #0B4C6F; color: white; }

/* ===== EMPTY STATES ===== */
.empty-state-full { background: white; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state-full h4 { margin: 0 0 8px; font-size: 1.1rem; color: #111; font-weight: 700; }
.empty-state-full p { margin: 0 0 24px; color: #6B7280; font-size: 0.9rem; }
.btn-cta { background: #0B4C6F; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-cta:hover { background: #093a55; }

/* ===== LOADING SKELETON ===== */
.loading-skeleton { background: white; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; }
.skel-banner { height: 200px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 400%; animation: shimmer 1.4s ease infinite; }
.skel-content { padding: 20px 28px; display: flex; gap: 20px; }
.skel-circle { width: 80px; height: 80px; border-radius: 50%; background: #f0f0f0; margin-top: -40px; flex-shrink: 0; }
.skel-lines { flex: 1; display: flex; flex-direction: column; gap: 12px; padding-top: 8px; }
.skel-line { height: 16px; border-radius: 8px; background: #f0f0f0; }
.w60 { width: 60%; } .w40 { width: 40%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ===== MODAL ===== */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
.edit-modal { background: white; border-radius: 20px; width: 100%; max-width: 560px; box-shadow: 0 25px 60px rgba(0,0,0,0.25); display: flex; flex-direction: column; max-height: 90vh; }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #F3F4F6; }
.modal-header h3 { margin: 0; font-size: 1.1rem; font-weight: 800; color: #111; }
.modal-close { background: none; border: none; font-size: 1.6rem; cursor: pointer; color: #6B7280; line-height: 1; padding: 0 4px; transition: color 0.2s; }
.modal-close:hover { color: #111; }

.modal-body { padding: 0 0 4px 0; overflow-y: auto; display: flex; flex-direction: column; gap: 0; }

/* Imágenes en modal */
.images-section { position: relative; margin-bottom: 56px; }
.banner-upload { height: 160px; background: linear-gradient(135deg, #0B4C6F, #16a34a); background-size: cover; background-position: center; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.banner-upload-hint { background: rgba(0,0,0,0.4); border-radius: 20px; padding: 6px 14px; display: flex; align-items: center; gap: 6px; color: white; font-size: 0.85rem; font-weight: 600; transition: opacity 0.2s; }
.cam-svg { width: 16px; height: 16px; }

.avatar-upload-wrap { position: absolute; bottom: -48px; left: 24px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.modal-avatar { width: 96px; height: 96px; border-radius: 50%; background: white; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); overflow: hidden; position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.modal-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.modal-avatar-initials { font-size: 2rem; font-weight: 800; color: #0B4C6F; background: #E0F2FE; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
.avatar-cam-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
.modal-avatar:hover .avatar-cam-overlay { opacity: 1; }
.cam-svg-sm { width: 22px; height: 22px; }
.avatar-hint { font-size: 0.75rem; color: #9CA3AF; font-weight: 600; }

/* Form grid */
.modal-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 8px 24px 20px; }
.modal-field { display: flex; flex-direction: column; gap: 6px; }
.modal-field.full-field { grid-column: 1 / -1; }
.modal-field label { font-size: 0.85rem; font-weight: 700; color: #374151; }

.field-icon-wrap { position: relative; display: flex; align-items: center; }
.field-prefix { position: absolute; left: 12px; font-size: 0.9rem; pointer-events: none; z-index: 1; }
.field-icon-wrap input { padding: 10px 14px 10px 36px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 0.9rem; font-family: inherit; background: #FAFAFA; width: 100%; transition: border-color 0.2s; }
.field-icon-wrap input:focus { border-color: #0B4C6F; background: white; outline: none; box-shadow: 0 0 0 3px rgba(11,76,111,0.1); }

.modal-field select { padding: 10px 14px; border: 1.5px solid #E5E7EB; border-radius: 10px; font-size: 0.9rem; font-family: inherit; background: #FAFAFA; transition: border-color 0.2s; }
.modal-field select:focus { border-color: #0B4C6F; outline: none; box-shadow: 0 0 0 3px rgba(11,76,111,0.1); background: white; }
.modal-field select:disabled { opacity: 0.5; cursor: not-allowed; }
.field-hint { font-size: 0.78rem; color: #9CA3AF; }

.modal-error { margin: 0 24px 16px; background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 10px 14px; color: #DC2626; font-size: 0.88rem; font-weight: 600; }

.modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid #F3F4F6; }
.btn-modal-cancel { padding: 10px 20px; background: white; border: 1.5px solid #E5E7EB; border-radius: 8px; font-weight: 600; color: #6B7280; cursor: pointer; transition: 0.2s; }
.btn-modal-cancel:hover { border-color: #9CA3AF; }
.btn-modal-save { padding: 10px 24px; background: #0B4C6F; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-modal-save:hover:not(:disabled) { background: #093a55; }
.btn-modal-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .contact-grid { grid-template-columns: 1fr; }
  .modal-form-grid { grid-template-columns: 1fr; }
  .modal-field.full-field { grid-column: 1; }
  .meta-chips { gap: 6px; }
}
</style>