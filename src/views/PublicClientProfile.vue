<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const route = useRoute();

// --- ESTADO ---
const user = ref({
  name: "", email: "", phone: "", location: "",
  avatar: "", banner: "", joinDate: "", id: null
});

const activeTab = ref('info');
const isLoading = ref(true);
const serviceHistory = ref([]);     
const clientReviews = ref([]);

const userInitials = computed(() => {
  const n = user.value.name || '';
  const parts = n.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.substring(0, 2).toUpperCase() || 'U';
});

// --- CARGAR DATOS ---
onMounted(async () => {
  const userId = route.params.id;
  if (!userId) { router.push('/professional/dashboard'); return; }

  try {
    const { data } = await axios.get(`${API_URLS.PERFILES}/api/clientes/${userId}`);
    if (data) {
      user.value = {
        name: data.nombre || '',
        email: data.email || '',
        phone: data.telefono || '',
        location: data.direccion || '',
        avatar: data.avatar || '',
        banner: data.banner || '',
        joinDate: data.created_at
          ? new Date(data.created_at).toLocaleDateString('es-DO', { year: 'numeric', month: 'long' })
          : '',
        id: userId
      };

      // Precargar solicitudes
      try {
        const reqRes = await axios.get(`${API_URLS.PERFILES}/api/solicitudes/cliente/${userId}`);
        serviceHistory.value = reqRes.data || [];
      } catch {}

      // LOAD REVIEWS GIVEN BY CLIENT
      try {
        const reviewRes = await axios.get(`${API_URLS.TRABAJOS}/api/resenas/cliente/${userId}`);
        const fetchedReviews = reviewRes.data;
        for (let r of fetchedReviews) {
          try {
            const pRes = await axios.get(`${API_URLS.PERFILES}/api/profesionales/${r.profesional_id}`);
            r.profesional_nombre = pRes.data?.nombre || "Profesional";
            r.profesional_avatar = pRes.data?.avatar_url || null;
            r.profesion = pRes.data?.profesion || "";
          } catch(e) { r.profesional_nombre = "Profesional"; }
        }
        clientReviews.value = fetchedReviews;
      } catch(e) {
        console.error("Error loading reviews:", e);
      }
    }
  } catch (error) {
    console.error('Error cargando perfil:', error);
  } finally {
    isLoading.value = false;
  }
});

// --- ESTADO DE SOLICITUDES ---
const statusConfig = {
  pendiente:   { label: 'Pendiente',   color: '#F59E0B', bg: '#FEF3C7' },
  activo:      { label: 'Activo',      color: '#3B82F6', bg: '#DBEAFE' },
  completado:  { label: 'Completado',  color: '#10B981', bg: '#D1FAE5' },
  cancelado:   { label: 'Cancelado',   color: '#EF4444', bg: '#FEE2E2' },
};
const getStatus = (s) => statusConfig[s?.toLowerCase()] || { label: s || 'Pendiente', color: '#6B7280', bg: '#F3F4F6' };

const goToExplore = () => router.push('/client/explore');
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
              <span class="meta-chip chip-join" v-if="user.joinDate">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="chip-icon"><path fill-rule="evenodd" d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z" clip-rule="evenodd" /></svg>
                Miembro desde {{ user.joinDate }}
              </span>
            </div>
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

      <!-- ===== TABS NAV ===== -->
      <div class="tabs-nav">
        <button :class="['tab-btn', { active: activeTab === 'info' }]" @click="activeTab = 'info'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" /></svg>
          Información
        </button>
        <button :class="['tab-btn', { active: activeTab === 'history' }]" @click="activeTab = 'history'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clip-rule="evenodd" /></svg>
          Historial
          <span v-if="serviceHistory.length" class="tab-count">{{ serviceHistory.length }}</span>
        </button>
        <button :class="['tab-btn', { active: activeTab === 'reviews' }]" @click="activeTab = 'reviews'">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clip-rule="evenodd" /></svg>
          Reseñas
        </button>
      </div>

      <!-- ===== TAB: INFORMACIÓN ===== -->
      <div v-if="activeTab === 'info'" class="content-grid">
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
                <span class="contact-val">{{ user.phone || 'No especificado' }}</span>
              </div>
            </div>

            <div class="contact-item">
              <div class="contact-icon loc-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clip-rule="evenodd" /></svg>
              </div>
              <div class="contact-info">
                <span class="contact-label">Dirección / Sector</span>
                <span class="contact-val">{{ user.location || 'No especificada' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== TAB: HISTORIAL ===== -->
      <div v-if="activeTab === 'history'" class="content-block">
        <div v-if="serviceHistory.length === 0" class="empty-state-full">
          <div class="empty-icon"><i class="fa-solid fa-clipboard-list"></i></div>
          <h4>Sin solicitudes aún</h4>
          <p>Este cliente aún no ha realizado solicitudes de servicio.</p>
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
          </div>
        </div>
      </div>

      <!-- ===== TAB: RESEÑAS ===== -->
      <div v-if="activeTab === 'reviews'" class="content-block">
        <div v-if="clientReviews.length === 0" class="empty-state-full">
          <div class="empty-icon"><i class="fa-solid fa-star"></i></div>
          <h4>Sin reseñas aún</h4>
          <p>Este cliente aún no ha calificado a ningún profesional.</p>
        </div>

        <div v-else class="reviews-list" style="display: flex; flex-direction: column; gap: 16px;">
          <div v-for="resena in clientReviews" :key="resena.id" class="review-card" style="background: white; border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img v-if="resena.profesional_avatar" :src="resena.profesional_avatar" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" alt="Pro">
                <div v-else style="width: 48px; height: 48px; border-radius: 50%; background: #EFF6FF; color: #0B4C6F; display: flex; align-items: center; justify-content: center; font-weight: bold;">{{ resena.profesional_nombre?.charAt(0) || 'P' }}</div>
                <div>
                  <h4 style="margin: 0; color: #111; font-size: 1rem;">{{ resena.profesional_nombre }}</h4>
                  <p style="margin: 0; font-size: 0.8rem; color: #6B7280;">{{ resena.profesion }}</p>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="display: flex; color: #F59E0B; font-size: 1rem; gap: 2px; justify-content: flex-end; margin-bottom: 4px;">
                  <i v-for="i in 5" :key="i" :class="i <= resena.calificacion ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
                </div>
                <span style="font-size: 0.75rem; color: #9CA3AF;">{{ new Date(resena.fecha_creacion).toLocaleDateString() }}</span>
              </div>
            </div>
            <div style="background: #F8FAFC; border-radius: 8px; padding: 12px; border-left: 4px solid #0B4C6F;">
              <p style="margin: 0; color: #374151; font-size: 0.92rem; line-height: 1.5; font-style: italic;">"{{ resena.comentario || 'Sin comentario' }}"</p>
            </div>
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
.profile-header-card { background: white; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.banner-area { height: 200px; background: linear-gradient(135deg, #071E38 0%, #0B4C6F 100%); background-size: cover; background-position: center; position: relative; }
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

.stats-bar { display: flex; border-top: 1px solid #F3F4F6; padding: 16px 28px; gap: 40px; background: #FAFAFA; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-item strong { font-size: 1.5rem; font-weight: 800; color: #0B4C6F; }
.stat-item span { font-size: 0.75rem; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 2px; }

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

/* ===== EMPTY STATES ===== */
.empty-state-full { background: white; border-radius: 12px; border: 1px solid #E5E7EB; text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state-full h4 { margin: 0 0 8px; font-size: 1.1rem; color: #111; font-weight: 700; }
.empty-state-full p { margin: 0 0 24px; color: #6B7280; font-size: 0.9rem; }

/* ===== LOADING SKELETON ===== */
.loading-skeleton { background: white; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; }
.skel-banner { height: 200px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 400%; animation: shimmer 1.4s ease infinite; }
.skel-content { padding: 20px 28px; display: flex; gap: 20px; }
.skel-circle { width: 80px; height: 80px; border-radius: 50%; background: #f0f0f0; margin-top: -40px; flex-shrink: 0; }
.skel-lines { flex: 1; display: flex; flex-direction: column; gap: 12px; padding-top: 8px; }
.skel-line { height: 16px; border-radius: 8px; background: #f0f0f0; }
.w60 { width: 60%; } .w40 { width: 40%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 768px) {
  .contact-grid { grid-template-columns: 1fr; }
}
</style>