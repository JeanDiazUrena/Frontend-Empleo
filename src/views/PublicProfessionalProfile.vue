<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { normalizeMediaUrl } from '../utils/media.js';
import LocationMap from '../components/LocationMap.vue';

const route = useRoute();
const router = useRouter();

const user = ref({ 
  name: "", profession: "", bio: "", category: "", experience: 0,
  emailPublic: "", phone: "", city: "", sector: "", website: "",
  workingHours: null, skills: "", avatar: "", cover: "", joinDate: "", usuario_id: null
});

const activeTab = ref('info');
const portfolioItems = ref([]); 
const reviews = ref([]);
const isLoading = ref(true);

const normalizePortfolioItems = (items = []) =>
  items.map(item => ({
    ...item,
    imagen_url: normalizeMediaUrl(item.imagen_url || '')
  }));

// --- TOAST SYSTEM ---
const toast = ref({ show: false, msg: '', type: 'success' });
let toastTimer = null;
const showToast = (msg, type = 'success') => {
  if (toastTimer) clearTimeout(toastTimer);
  toast.value = { show: true, msg, type };
  toastTimer = setTimeout(() => { toast.value.show = false; }, 4000);
};

// --- CONFIRM MODAL ---
const confirmModal = ref({ show: false, msg: '', onConfirm: null });
const askConfirm = (msg) => new Promise((resolve) => {
  confirmModal.value = { show: true, msg, onConfirm: resolve };
});
const handleConfirm = (answer) => {
  confirmModal.value.show = false;
  if (confirmModal.value.onConfirm) confirmModal.value.onConfirm(answer);
};

// --- HORARIO PARSEADO ---
const parsedSchedule = computed(() => {
  if (!user.value.workingHours) return null;
  try {
    const parsed = JSON.parse(user.value.workingHours);
    if (typeof parsed === 'object') return parsed;
  } catch {}
  return null; // Es texto plano, se mostrará diferente
});

// --- SKILLS COMO ARRAY ---
const skillsArray = computed(() => {
  if (!user.value.skills) return [];
  return user.value.skills.split(',').map(s => s.trim()).filter(Boolean);
});

const openDays = computed(() => {
  if (!parsedSchedule.value) return [];
  return Object.entries(parsedSchedule.value).filter(([, d]) => d.open);
});
const closedDays = computed(() => {
  if (!parsedSchedule.value) return [];
  return Object.entries(parsedSchedule.value).filter(([, d]) => !d.open);
});

// Lógica de estado Activo en tiempo real
const getCurrentDayName = () => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[new Date().getDay()];
};

const currentDayName = ref(getCurrentDayName());
const currentTime = ref(new Date());
let timeInterval = null;

const checkIsOpenNow = (dayName, dayData) => {
  if (!dayData.open || !dayData.from || !dayData.to) return false;
  if (dayName !== currentDayName.value) return false;

  const [fromH, fromM] = dayData.from.split(':').map(Number);
  const [toH, toM] = dayData.to.split(':').map(Number);
  
  const now = currentTime.value;
  const nowTotal = now.getHours() * 60 + now.getMinutes();
  const fromTotal = fromH * 60 + (fromM || 0);
  let toTotal = toH * 60 + (toM || 0);

  if (toTotal <= fromTotal) {
    if (nowTotal >= fromTotal || nowTotal <= toTotal) return true;
  } else {
    if (nowTotal >= fromTotal && nowTotal <= toTotal) return true;
  }
  return false;
};

onMounted(async () => {
  timeInterval = setInterval(() => {
    currentTime.value = new Date();
    currentDayName.value = getCurrentDayName();
  }, 60000);

  const userId = route.params.id;
  if (!userId) { router.push('/client/explore'); return; }

  user.value.name = "Profesional";

  try {
    const { data } = await axios.get(`${API_URLS.PERFILES}/api/profesionales/${userId}`);
    
    if (data) {
      user.value = {
        name: data.nombre || "Profesional",
        profession: data.profesion || "",
        bio: data.biografia || "",
        category: data.categoria_nombre || data.categoria || "", 
        experience: data.anios_experiencia || 0,
        emailPublic: data.email_publico || "",
        phone: data.telefono || "",
        city: data.ciudad || "",
        sector: data.sector || "",
        website: data.sitio_web || "",
        workingHours: data.horario_texto || null,
        skills: data.habilidades || "",
        avatar: normalizeMediaUrl(data.avatar_url || ""),
        cover: normalizeMediaUrl(data.cover_url || ""),
        joinDate: (data.created_at || data.fecha_registro) ? new Date(data.created_at || data.fecha_registro).toLocaleDateString('es-DO', { year: 'numeric', month: 'long' }) : "",
        usuario_id: data.usuario_id || userId
      };
      
      portfolioItems.value = normalizePortfolioItems(data.portfolio || []);
      
      // LOAD REVIEWS
      try {
        const reviewRes = await axios.get(`${API_URLS.TRABAJOS}/api/resenas/profesional/${userId}`);
        const fetchedReviews = reviewRes.data;
        for (let r of fetchedReviews) {
          try {
            const cRes = await axios.get(`${API_URLS.PERFILES}/api/clientes/${r.cliente_id}`);
            r.cliente_nombre = cRes.data?.nombre || "Cliente";
            r.cliente_avatar = normalizeMediaUrl(cRes.data?.avatar || '');
          } catch(e) { r.cliente_nombre = "Cliente"; }
        }
        reviews.value = fetchedReviews;
      } catch(e) {
        console.error("Error loading reviews:", e);
      }
      
    } else {
      router.push('/professional/setup');
    }
  } catch (error) {
    console.error("Error conectando con el servidor:", error);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval);
});

const goToRequest = () => {
  if (user.value.usuario_id) {
    router.push({ path: '/client/request', query: { profesional_id: user.value.usuario_id } });
  }
};
const goToChat = () => {
  if (user.value.usuario_id) {
    router.push({ path: '/client/chat', query: { profesional_id: user.value.usuario_id } });
  }
};

// Estilo corporativo neutro para cualquier categoría
const categoryStyle = computed(() => {
  return { bg: '#F1F5F9', text: '#334155' };
});
</script>

<template>
  <div class="profile-layout">
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

    <!-- ===== CONFIRM MODAL ===== -->
    <Teleport to="body">
      <div v-if="confirmModal.show" class="confirm-overlay">
        <div class="confirm-card animate-pop">
          <div class="confirm-icon"><i class="fa-solid fa-circle-question"></i></div>
          <p class="confirm-msg">{{ confirmModal.msg }}</p>
          <div class="confirm-actions">
            <button class="confirm-no" @click="handleConfirm(false)">Cancelar</button>
            <button class="confirm-yes" @click="handleConfirm(true)">Sí, eliminar</button>
          </div>
        </div>
      </div>
    </Teleport>

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
      <!-- ===== HEADER CARD ===== -->
      <div class="profile-header-card">
        <div
          class="banner-area"
          :class="{ 'banner-has-photo': !user.cover && user.avatar }"
        >
          <!-- Foto de perfil como fondo difuminado si no hay cover -->
          <div
            v-if="!user.cover && user.avatar"
            class="banner-photo-bg"
            :style="{ backgroundImage: `url(${user.avatar})` }"
          ></div>
          <!-- Imagen de cover si está configurada -->
          <div
            v-if="user.cover"
            class="banner-cover-img"
            :style="{ backgroundImage: `url(${user.cover})` }"
          ></div>
          <div class="banner-overlay"></div>
        </div>

        <div class="header-content">
          <div class="avatar-wrapper">
            <div class="avatar-circle">
              <img v-if="user.avatar" :src="user.avatar" class="avatar-img" alt="avatar" @error="user.avatar = ''" />
              <div v-else class="avatar-initials">
                {{ user.name?.charAt(0).toUpperCase() || 'P' }}
              </div>
            </div>
            <span class="online-dot" title="Disponible"></span>
          </div>

          <div class="user-text">
            <div class="name-row">
              <h1>{{ user.name }}</h1>
              <span class="verified-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.491 4.491 0 0 1-3.497-1.307 4.491 4.491 0 0 1-1.307-3.497A4.49 4.49 0 0 1 2.25 12a4.49 4.49 0 0 1 1.549-3.397 4.491 4.491 0 0 1 1.307-3.497 4.491 4.491 0 0 1 3.497-1.307Zm7.007 6.387a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" /></svg>
                Verificado
              </span>
            </div>

            <div class="meta-chips">
              <span class="meta-chip profession">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="chip-icon"><path fill-rule="evenodd" d="M6 3.75A2.75 2.75 0 0 1 8.75 1h2.5A2.75 2.75 0 0 1 14 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 0 1 6 4.193V3.75Zm6.5 0v.325a41.622 41.622 0 0 0-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25ZM10 10a1 1 0 0 0-1 1v.01a1 1 0 0 0 1 1h.01a1 1 0 0 0 1-1V11a1 1 0 0 0-1-1H10Z" clip-rule="evenodd" /></svg>
                {{ user.profession || 'Sin profesión' }}
              </span>
              <span class="meta-chip location" v-if="user.city">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="chip-icon"><path fill-rule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clip-rule="evenodd" /></svg>
                {{ user.city }}, {{ user.sector }}
              </span>
              <span class="meta-chip experience">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="chip-icon"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd" /></svg>
                {{ user.experience }} años de exp.
              </span>
              <span
                v-if="user.category"
                class="meta-chip category-chip"
                :style="{ background: categoryStyle.bg, color: categoryStyle.text }"
              >
                {{ user.category }}
              </span>
            </div>
          </div>

          <div class="header-actions" style="display: flex; gap: 10px;">
            <button class="btn-edit" @click="goToChat">
              <i class="fa-regular fa-paper-plane"></i>
              Mensaje
            </button>
            <button class="btn-edit" style="background: #0B4C6F; color: white;" @click="goToRequest">
              <i class="fa-solid fa-clipboard-list"></i>
              Solicitar
            </button>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat-item">
            <strong>{{ portfolioItems.length }}</strong>
            <span>En Portafolio</span>
          </div>
          <div class="stat-item">
            <strong>{{ reviews.length }}</strong>
            <span>Reseñas</span>
          </div>
          <div class="stat-item" v-if="user.joinDate">
            <strong>{{ user.joinDate }}</strong>
            <span>Miembro desde</span>
          </div>
        </div>
      </div>

      <!-- ===== TABS NAVIGATION ===== -->
      <div class="tabs-nav">
        <button :class="['tab-btn', { active: activeTab === 'info' }]" @click="activeTab = 'info'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>
          Información
        </button>
        <button :class="['tab-btn', { active: activeTab === 'schedule' }]" @click="activeTab = 'schedule'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd" /></svg>
          Horario
        </button>
        <button :class="['tab-btn', { active: activeTab === 'portfolio' }]" @click="activeTab = 'portfolio'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909.47.47a.75.75 0 1 1-1.06 1.06L6.53 8.091a.75.75 0 0 0-1.06 0l-2.97 2.97ZM12 7a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clip-rule="evenodd" /></svg>
          Portafolio
        </button>
        <button :class="['tab-btn', { active: activeTab === 'reviews' }]" @click="activeTab = 'reviews'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" /></svg>
          Reseñas
        </button>
      </div>

      <!-- ===== TAB: INFORMACIÓN ===== -->
      <div v-if="activeTab === 'info'" class="content-grid">

        <!-- Sobre mí -->
        <div class="info-card full-card">
          <div class="card-header-label">Sobre mí</div>
          <p class="bio-text">{{ user.bio || 'Sin descripción.' }}</p>
        </div>

        <!-- Datos de Contacto -->
        <div class="info-card">
          <div class="card-header-label">Contacto</div>
          <div class="contact-list">
            <div class="contact-item" v-if="user.phone">
              <div class="contact-icon phone-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clip-rule="evenodd" /></svg>
              </div>
              <div class="contact-info">
                <span class="contact-label">Teléfono</span>
                <span class="contact-val">{{ user.phone }}</span>
              </div>
            </div>
            <div class="contact-item" v-if="user.emailPublic">
              <div class="contact-icon email-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" /><path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" /></svg>
              </div>
              <div class="contact-info">
                <span class="contact-label">Email</span>
                <span class="contact-val">{{ user.emailPublic }}</span>
              </div>
            </div>
            <div class="contact-item" v-if="user.website">
              <div class="contact-icon web-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z" clip-rule="evenodd" /></svg>
              </div>
              <div class="contact-info">
                <span class="contact-label">Sitio Web</span>
                <a :href="user.website" target="_blank" class="contact-link">{{ user.website }}</a>
              </div>
            </div>
            <div class="contact-item" v-if="user.city">
              <div class="contact-icon loc-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clip-rule="evenodd" /></svg>
              </div>
              <div class="contact-info">
                <span class="contact-label">Ubicación</span>
                <span class="contact-val">{{ user.city }}, {{ user.sector }}</span>
              </div>
            </div>
          </div>
          <LocationMap
            :location-text="[user.city, user.sector].filter(Boolean).join(', ')"
            title="Ubicación del profesional"
            height="240px"
          />
        </div>

        <!-- Habilidades -->
        <div class="info-card">
          <div class="card-header-label">Habilidades &amp; Especialidades</div>
          <div v-if="skillsArray.length > 0" class="skills-cloud">
            <span v-for="skill in skillsArray" :key="skill" class="skill-bubble">
              {{ skill }}
            </span>
          </div>
          <p v-else class="empty-text">Sin habilidades registradas.</p>
        </div>

      </div>

      <!-- ===== TAB: HORARIO ===== -->
      <div v-if="activeTab === 'schedule'" class="content-block">

        <!-- Horario estructurado (formato JSON) -->
        <div v-if="parsedSchedule" class="schedule-view-card">
          <div class="schedule-view-header">
            <h3>Horario de Atención</h3>
            <span class="open-count">{{ openDays.length }} días disponible</span>
          </div>
          <div class="schedule-view-grid">
            <div
              v-for="([day, dayData]) in Object.entries(parsedSchedule)"
              :key="day"
              class="schedule-view-row"
              :class="dayData.open ? 'row-open' : 'row-closed'"
            >
              <div class="sched-day">{{ day }}</div>
              <div v-if="dayData.open" class="sched-status" :class="checkIsOpenNow(day, dayData) ? 'active-now' : 'open-status'">
                <span class="status-dot" :class="{ 'is-green': checkIsOpenNow(day, dayData) }"></span>
                {{ checkIsOpenNow(day, dayData) ? 'Activo ahora' : 'Abierto' }}
              </div>
              <div v-else class="sched-status closed-status">
                Cerrado
              </div>
              <div v-if="dayData.open" class="sched-time">
                {{ dayData.from }} <span class="time-arrow">→</span> {{ dayData.to }}
              </div>
              <div v-else class="sched-time closed-text">—</div>
            </div>
          </div>
        </div>

        <!-- Horario como texto plano (compatibilidad) -->
        <div v-else-if="user.workingHours" class="info-card full-card">
          <div class="card-header-label">Horario de Atención</div>
          <p class="bio-text" style="white-space: pre-line;">{{ user.workingHours }}</p>
        </div>

        <!-- Sin horario -->
        <div v-else class="empty-state-full">
          <div class="empty-icon"><i class="fa-regular fa-clock"></i></div>
          <h4>Sin horario configurado</h4>
          <p>Configura tu disponibilidad para que los clientes sepan cuándo contactarte.</p>
          <button @click="router.back()" class="btn-cta">Volver</button>
        </div>
      </div>

      <!-- ===== TAB: PORTAFOLIO ===== -->
      <div v-if="activeTab === 'portfolio'" class="content-block">

        <div class="portfolio-header">
          <div>
            <h3 class="port-title">Mis Trabajos</h3>
            <p class="port-subtitle">{{ portfolioItems.length }} trabajo{{ portfolioItems.length !== 1 ? 's' : '' }} publicado{{ portfolioItems.length !== 1 ? 's' : '' }}</p>
          </div>
        </div>

        <!-- Estado vacío -->
        <div v-if="portfolioItems.length === 0" class="empty-state-full">
          <div class="empty-icon"><i class="fa-regular fa-image"></i></div>
          <h4>Portafolio vacío</h4>
          <p>Este profesional aún no ha subido trabajos a su portafolio.</p>
        </div>

        <!-- Grid de trabajos -->
        <div v-else class="portfolio-grid">
          <div v-for="item in portfolioItems" :key="item.id" class="portfolio-card">
            <div class="port-img-wrap">
              <img :src="item.imagen_url" :alt="item.titulo" class="portfolio-img" />
            </div>
            <div class="port-content">
              <h5>{{ item.titulo }}</h5>
              <p>{{ item.descripcion }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== TAB: RESEÑAS ===== -->
      <div v-if="activeTab === 'reviews'" class="content-block">
        <div v-if="reviews.length === 0" class="empty-state-full">
          <div class="empty-icon"><i class="fa-solid fa-star"></i></div>
          <h4>Aún no tienes reseñas</h4>
          <p>Completa servicios y pide a tus clientes que te dejen una valoración.</p>
        </div>
        
        <div v-else class="reviews-list" style="display: flex; flex-direction: column; gap: 16px;">
          <div v-for="resena in reviews" :key="resena.id" class="review-card" style="background: white; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img v-if="resena.cliente_avatar" :src="resena.cliente_avatar" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" alt="Avatar" />
                <div v-else style="width: 44px; height: 44px; border-radius: 50%; background: #F1F5F9; color: #1E293B; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem;">{{ resena.cliente_nombre?.charAt(0) || 'C' }}</div>
                <div>
                  <h4 style="margin: 0; color: #0F172A; font-size: 1rem;">{{ resena.cliente_nombre }}</h4>
                  <span style="font-size: 0.8rem; color: #94A3B8;">{{ new Date(resena.created_at || resena.fecha_creacion).toLocaleDateString() }}</span>
                </div>
              </div>
              <div style="display: flex; color: #F59E0B; font-size: 1.1rem; gap: 2px;">
                <i v-for="i in 5" :key="i" :class="i <= resena.calificacion ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
              </div>
            </div>
            <p style="margin: 0; color: #475569; font-size: 0.95rem; line-height: 1.5;">{{ resena.comentario || 'El cliente dejó una calificación de ' + resena.calificacion + ' estrellas.' }}</p>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped>
/* ===== LAYOUT ===== */
.profile-layout { width: 100%; max-width: 960px; margin: 0 auto; padding-bottom: 60px; font-family: 'Inter', sans-serif; }

/* ===== HEADER CARD ===== */
.profile-header-card { background: white; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }

/* Banner corporativo: oscuro y neutro, sin colores brillantes */
.banner-area { height: 180px; background: linear-gradient(135deg, #1E293B 0%, #334155 60%, #475569 100%); background-size: cover; background-position: center; position: relative; overflow: hidden; }
/* Fondo: foto de perfil difuminada cuando no hay cover */
.banner-photo-bg { position: absolute; inset: -20px; background-size: cover; background-position: center; filter: blur(18px) brightness(0.4) saturate(0.7); transform: scale(1.1); }
/* Fondo: imagen de cover directa */
.banner-cover-img { position: absolute; inset: 0; background-size: cover; background-position: center; }
.banner-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.15); }

.header-content { padding: 0 28px 20px; display: flex; align-items: flex-start; gap: 20px; }
.avatar-wrapper { margin-top: -56px; position: relative; z-index: 2; flex-shrink: 0; }
.avatar-circle { width: 120px; height: 120px; background: white; border: 4px solid white; border-radius: 50%; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.12); display: flex; align-items: center; justify-content: center; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-initials { font-size: 3rem; font-weight: 800; color: #1E293B; background: #F1F5F9; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
/* Punto de estado eliminado (no aplica visualmente) */
.online-dot { display: none; }

.user-text { flex: 1; padding-top: 12px; min-width: 0; }

.name-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 10px; }
.name-row h1 { margin: 0; font-size: 1.65rem; font-weight: 800; color: #0F172A; line-height: 1.2; }

/* Badge verificado: tono neutro corporativo */
.verified-badge { display: inline-flex; align-items: center; gap: 4px; background: #EFF6FF; color: #0B4C6F; border: 1px solid #BFDBFE; font-size: 0.76rem; font-weight: 700; padding: 3px 10px; border-radius: 4px; letter-spacing: 0.03em; }
.verified-badge svg { width: 13px; height: 13px; }

/* Chips de metadatos: todos grises/neutros */
.meta-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.meta-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 0.82rem; font-weight: 600; padding: 5px 12px; border-radius: 20px; background: #F1F5F9; color: #475569; border: none; }
.chip-icon { width: 13px; height: 13px; opacity: 0.8; }
.profession { background: #EFF6FF; color: #0B4C6F; } 
.location { background: #EFF6FF; color: #0B4C6F; }  
.experience { } /* Hereda el estilo base neutro */
.category-chip { background: #EFF6FF; color: #0B4C6F; border: none; padding: 4px 10px; border-radius: 6px; font-weight: 600; }

.header-actions { padding-top: 16px; flex-shrink: 0; }
.btn-edit { display: inline-flex; align-items: center; gap: 6px; background: white; border: 1.5px solid #0B4C6F; color: #0B4C6F; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 0.88rem; cursor: pointer; transition: 0.2s; }
.btn-edit:hover { background: #0B4C6F; color: white; }
.btn-icon { width: 15px; height: 15px; }

.stats-bar { display: flex; border-top: 1px solid #F1F5F9; padding: 14px 28px; gap: 40px; background: #FAFBFC; }
.stat-item { display: flex; flex-direction: column; }
.stat-item strong { font-size: 1.05rem; font-weight: 800; color: #0F172A; }
.stat-item span { font-size: 0.78rem; color: #94A3B8; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }

/* ===== TABS ===== */
.tabs-nav { display: flex; background: white; border-radius: 8px; border: 1px solid #E2E8F0; overflow: hidden; margin-bottom: 20px; }
.tab-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 13px 12px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-size: 0.88rem; font-weight: 600; color: #94A3B8; transition: 0.2s; }
.tab-btn svg { width: 16px; height: 16px; }
.tab-btn:hover { color: #0B4C6F; background: #F8FAFC; }
.tab-btn.active { color: #0B4C6F; border-bottom-color: #0B4C6F; background: #F0F9FF; }

/* ===== CONTENT GRID ===== */
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.content-block { display: flex; flex-direction: column; gap: 16px; }
.full-card { grid-column: 1 / -1; }

.info-card { background: white; border-radius: 8px; border: 1px solid #E2E8F0; padding: 24px; }
.card-header-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8; margin-bottom: 16px; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px; }
.bio-text { color: #475569; font-size: 0.93rem; line-height: 1.75; margin: 0; }

/* Contacto: íconos monocromáticos sin colores vivos */
.contact-list { display: flex; flex-direction: column; gap: 16px; }
.contact-item { display: flex; align-items: center; gap: 14px; }
.contact-icon { width: 34px; height: 34px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #F1F5F9; color: #475569; }
.contact-icon svg { width: 16px; height: 16px; }
/* Todos azules monócromos */
.phone-icon { background: #EFF6FF; color: #0B4C6F; }
.email-icon { background: #EFF6FF; color: #0B4C6F; }
.web-icon   { background: #EFF6FF; color: #0B4C6F; }
.loc-icon   { background: #EFF6FF; color: #0B4C6F; }
.contact-info { display: flex; flex-direction: column; }
.contact-label { font-size: 0.7rem; color: #94A3B8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.contact-val { font-size: 0.92rem; color: #1E293B; font-weight: 500; margin-top: 1px; }
.contact-link { font-size: 0.88rem; color: #334155; font-weight: 500; text-decoration: none; margin-top: 1px; }
.contact-link:hover { text-decoration: underline; color: #1E293B; }

/* Habilidades: neutro, sin colores vivos */
.skills-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
.skill-bubble { background: #F8FAFC; color: #334155; border: 1px solid #CBD5E1; font-size: 0.83rem; font-weight: 500; padding: 5px 13px; border-radius: 4px; }
.empty-text { color: #94A3B8; font-size: 0.9rem; font-style: italic; }

/* ===== SCHEDULE VIEW ===== */
.schedule-view-card { background: white; border-radius: 8px; border: 1px solid #E2E8F0; overflow: hidden; }
.schedule-view-header { padding: 18px 24px; border-bottom: 1px solid #F1F5F9; display: flex; justify-content: space-between; align-items: center; }
.schedule-view-header h3 { margin: 0; font-size: 0.95rem; font-weight: 700; color: #1E293B; }
.open-count { background: #F1F5F9; color: #475569; font-size: 0.78rem; font-weight: 700; padding: 4px 12px; border-radius: 4px; border: 1px solid #E2E8F0; }

.schedule-view-grid { display: flex; flex-direction: column; }
.schedule-view-row { display: grid; grid-template-columns: 130px 110px 1fr; align-items: center; padding: 12px 24px; border-bottom: 1px solid #F8FAFC; transition: background 0.15s; gap: 12px; }
.schedule-view-row:last-child { border-bottom: none; }
.schedule-view-row:hover { background: #FAFBFC; }
.row-open { }
.row-closed { opacity: 0.45; }

.sched-day { font-weight: 600; color: #1E293B; font-size: 0.92rem; }
.sched-status { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 600; }
.open-status { color: #475569; }
.closed-status { color: #94A3B8; }
.active-now { color: #059669; }
.status-dot { width: 7px; height: 7px; background: #94A3B8; border-radius: 50%; }
.row-open .status-dot { background: #475569; }
.status-dot.is-green { background: #10B981; box-shadow: 0 0 0 2px #D1FAE5; }
.sched-time { font-size: 0.88rem; color: #475569; font-weight: 500; }
.closed-text { color: #CBD5E1; }
.time-arrow { color: #CBD5E1; margin: 0 6px; font-weight: 400; }

/* ===== PORTFOLIO ===== */
.portfolio-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.port-title { margin: 0 0 4px; font-size: 1.05rem; font-weight: 700; color: #0F172A; }
.port-subtitle { margin: 0; font-size: 0.83rem; color: #94A3B8; }

.btn-add-portfolio { display: inline-flex; align-items: center; gap: 6px; background: #F76B1C; color: white; border: none; padding: 9px 16px; border-radius: 6px; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
.btn-add-portfolio:hover { background: #ea580c; transform: translateY(-1px); }
.add-icon { width: 16px; height: 16px; }

.portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
.portfolio-card { background: white; border-radius: 8px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: box-shadow 0.2s, transform 0.2s; }
.portfolio-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.09); transform: translateY(-2px); }

.port-img-wrap { position: relative; overflow: hidden; }
.portfolio-img { width: 100%; height: 200px; object-fit: cover; display: block; transition: transform 0.3s; }
.portfolio-card:hover .portfolio-img { transform: scale(1.03); }

.port-actions-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; gap: 10px; opacity: 0; transition: opacity 0.2s; }
.port-img-wrap:hover .port-actions-overlay { opacity: 1; }
.port-action-btn { width: 38px; height: 38px; border-radius: 6px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
.port-action-btn svg { width: 16px; height: 16px; }
.port-action-btn:hover { transform: scale(1.08); }
.port-action-btn.edit { background: white; color: #1E293B; }
.port-action-btn.delete { background: #FEE2E2; color: #DC2626; }
.port-action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.deleting-spinner { font-size: 1rem; animation: spin 1s linear infinite; display: block; }
@keyframes spin { to { transform: rotate(360deg); } }

.port-content { padding: 14px 16px; }
.port-content h5 { margin: 0 0 5px 0; font-size: 0.95rem; color: #0F172A; font-weight: 700; }
.port-content p { margin: 0; font-size: 0.83rem; color: #64748B; line-height: 1.55; }

/* ===== MODAL PORTAFOLIO ===== */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
.portfolio-modal { background: white; border-radius: 12px; width: 100%; max-width: 520px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 90vh; }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; border-bottom: 1px solid #F1F5F9; }
.modal-header h3 { margin: 0; font-size: 1rem; font-weight: 800; color: #0F172A; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94A3B8; line-height: 1; padding: 0 4px; transition: color 0.2s; }
.modal-close:hover { color: #1E293B; }

.modal-body { padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 20px; }

.image-upload-zone { border: 1.5px dashed #CBD5E1; border-radius: 8px; cursor: pointer; overflow: hidden; position: relative; min-height: 200px; display: flex; align-items: center; justify-content: center; transition: border-color 0.2s; background: #FAFBFC; }
.image-upload-zone:hover { border-color: #475569; }
.img-preview-port { width: 100%; height: 100%; max-height: 240px; object-fit: cover; display: block; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px; text-align: center; }
.upload-svg { width: 36px; height: 36px; color: #CBD5E1; }
.upload-placeholder p { margin: 0; font-weight: 600; color: #475569; font-size: 0.92rem; }
.upload-placeholder span { font-size: 0.78rem; color: #94A3B8; }
.change-img-overlay { position: absolute; inset: 0; background: rgba(15,23,42,0.45); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.92rem; opacity: 0; transition: opacity 0.2s; }
.image-upload-zone:hover .change-img-overlay { opacity: 1; }

.modal-field { display: flex; flex-direction: column; gap: 6px; }
.modal-field label { font-size: 0.82rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.05em; }
.modal-field input, .modal-field textarea { padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 6px; font-size: 0.93rem; font-family: inherit; background: #FAFBFC; resize: vertical; transition: border-color 0.2s; color: #1E293B; }
.modal-field input:focus, .modal-field textarea:focus { border-color: #475569; background: white; outline: none; box-shadow: 0 0 0 3px rgba(71,85,105,0.1); }
.char-hint { font-size: 0.75rem; color: #94A3B8; text-align: right; }

.modal-error { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 6px; padding: 10px 14px; color: #DC2626; font-size: 0.85rem; font-weight: 600; }

.modal-footer { display: flex; gap: 12px; justify-content: flex-end; padding: 16px 24px; border-top: 1px solid #F1F5F9; }
.btn-modal-cancel { padding: 9px 18px; background: white; border: 1.5px solid #E2E8F0; border-radius: 6px; font-weight: 600; font-size: 0.88rem; color: #64748B; cursor: pointer; transition: 0.2s; }
.btn-modal-cancel:hover { border-color: #94A3B8; color: #334155; }
.btn-modal-save { padding: 9px 22px; background: #1E293B; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.2s; }
.btn-modal-save:hover:not(:disabled) { background: #0F172A; }
.btn-modal-save:disabled { opacity: 0.55; cursor: not-allowed; }

/* ===== EMPTY STATES ===== */
.empty-state-full { background: white; border-radius: 8px; border: 1px solid #E2E8F0; text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 2.4rem; margin-bottom: 16px; color: #CBD5E1; }
.empty-state-full h4 { margin: 0 0 8px 0; font-size: 1rem; color: #1E293B; font-weight: 700; }
.empty-state-full p { margin: 0 0 24px 0; color: #94A3B8; font-size: 0.88rem; }
.btn-cta { background: #1E293B; color: white; border: none; padding: 9px 22px; border-radius: 6px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.2s; }
.btn-cta:hover { background: #0F172A; }

/* LOADING SKELETON */
.loading-skeleton { background: white; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; }
.skel-banner { height: 180px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 400%; animation: shimmer 1.4s ease infinite; }
.skel-content { padding: 20px 28px; display: flex; gap: 20px; align-items: flex-start; }
.skel-circle { width: 80px; height: 80px; border-radius: 50%; background: #f0f0f0; margin-top: -40px; flex-shrink: 0; }
.skel-lines { flex: 1; display: flex; flex-direction: column; gap: 12px; padding-top: 8px; }
.skel-line { height: 14px; border-radius: 4px; background: #f0f0f0; }
.w60 { width: 60%; } .w40 { width: 40%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* RESPONSIVE */
@media (max-width: 768px) {
  .header-content { flex-direction: column; align-items: center; text-align: center; padding: 0 20px 24px; }
  .avatar-wrapper { margin-top: -60px; margin-left: 0; }
  .user-text { padding-top: 16px; width: 100%; }
  .name-row { justify-content: center; }
  .meta-chips { justify-content: center; gap: 6px; }
  .header-actions { width: 100%; margin-top: 10px; }
  .btn-edit { width: 100%; justify-content: center; }
  
  .stats-bar { padding: 16px; gap: 15px; flex-wrap: wrap; justify-content: center; }
  .stat-item { align-items: center; flex: 1; min-width: 80px; }
  .stat-item strong { font-size: 1rem; }
  .stat-item span { font-size: 0.65rem; }

  .content-grid { grid-template-columns: 1fr; }
  .full-card { grid-column: 1; }
  
  .tab-btn { font-size: 0.75rem; padding: 12px 8px; }
  .tab-btn svg { width: 14px; height: 14px; }
  .tab-btn span { display: none; } /* Ocultar texto si el espacio es crítico */
  
  .portfolio-grid { grid-template-columns: 1fr; }
  .schedule-view-row { grid-template-columns: 1fr 1fr; gap: 8px; }
  .sched-time { grid-column: 1 / -1; margin-top: 4px; padding-left: 20px; }

  .portfolio-header { flex-direction: column; gap: 12px; align-items: stretch; }
  .btn-add-portfolio { width: 100%; justify-content: center; }
}

@media (max-width: 480px) {
  .banner-area { height: 140px; }
  .avatar-circle { width: 100px; height: 100px; }
  .name-row h1 { font-size: 1.4rem; }
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

/* --- CONFIRM MODAL --- */
.confirm-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.55);
  backdrop-filter: blur(4px); z-index: 99998;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.confirm-card {
  background: white; border-radius: 16px; padding: 36px 32px;
  max-width: 400px; width: 100%; text-align: center;
  box-shadow: 0 25px 50px rgba(0,0,0,0.2);
}
.confirm-icon { font-size: 2.5rem; color: #F59E0B; margin-bottom: 16px; }
.confirm-msg { font-size: 1rem; color: #334155; line-height: 1.6; margin: 0 0 28px; font-weight: 500; }
.confirm-actions { display: flex; gap: 12px; }
.confirm-no  { flex: 1; padding: 12px; border: 1.5px solid #E2E8F0; border-radius: 8px; background: white; color: #64748B; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
.confirm-no:hover { background: #F8FAFC; }
.confirm-yes { flex: 1; padding: 12px; border: none; border-radius: 8px; background: #1E293B; color: white; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.95rem; }
.confirm-yes:hover { background: #0F172A; transform: translateY(-1px); }

.animate-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
