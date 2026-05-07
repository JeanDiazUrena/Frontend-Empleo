<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useUserSession } from '../composables/useUserSession.js';

const route = useRoute();
const router = useRouter();
const { state } = useUserSession();

const myId = computed(() => state.user?.id || localStorage.getItem('usuario_id'));
const myName = computed(() => state.user?.name || localStorage.getItem('usuario_nombre') || 'Yo');

const hasActiveJob = ref(false);
const isSharingLocation = ref(false);
const showAttachmentMenu = ref(false);
const fileInput = ref(null);
const lightbox = ref({ show: false, url: '' });
const acceptingQuoteId = ref(null);

const openLightbox = (url) => {
  lightbox.value = { show: true, url };
};

const downloadImage = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `imagen_${Date.now()}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    window.open(url, '_blank');
  }
};

const triggerFileSelect = (type) => {
  showAttachmentMenu.value = false;
  if (fileInput.value) {
    fileInput.value.setAttribute('accept', type === 'image' ? 'image/*' : '*/*');
    fileInput.value.click();
  }
};

const onFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file || !activeConv.value) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const { data } = await axios.post(`${API_URLS.PERFILES}/api/chat/upload`, formData);
    const tipo = file.type.startsWith('image/') ? 'imagen' : 'archivo';
    
    socket.emit('send_message', {
      conversacion_id: activeConv.value.id,
      remitente_id: myId.value,
      contenido: data.url,
      tipo: tipo
    });
  } catch (err) {
    console.error("Error uploading file:", err);
    showToast('Error al subir el archivo', 'error');
  }
  e.target.value = ''; // Reset input
};

const checkActiveJob = async (profesionalUsuarioId) => {
  if (!profesionalUsuarioId || !myId.value) return;
  try {
    const { data } = await axios.get(`${API_URLS.TRABAJOS}/api/trabajos/cliente/${myId.value}`);
    // Ver si hay un trabajo activo con este profesional específico
    hasActiveJob.value = data.some(j => j.profesional_id === profesionalUsuarioId && j.estado === 'EN_PROGRESO');
  } catch (e) {
    console.error("Error checking active job:", e);
    hasActiveJob.value = false;
  }
};

const shareLocation = () => {
  if (!navigator.geolocation) {
    showToast('Tu navegador no soporta geolocalización', 'error');
    return;
  }

  isSharingLocation.value = true;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const mapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const content = `📍 Mi ubicación: ${mapUrl}`;
      
      socket.emit('send_message', {
        conversacion_id: activeConv.value.id,
        remitente_id: myId.value,
        contenido: content
      });
      
      showToast('Ubicación compartida', 'success');
      isSharingLocation.value = false;
    },
    (error) => {
      console.error(error);
      showToast('Error al obtener ubicación. Asegúrate de dar permisos.', 'error');
      isSharingLocation.value = false;
    },
    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
  );
};

const parseQuote = (content) => {
  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

const formatMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'RD$ 0.00';
};

const acceptQuote = async (quote) => {
  if (!quote?.id || acceptingQuoteId.value) return;

  const confirmed = await askConfirm(`¿Aceptar esta cotización por ${formatMoney(quote.monto_total)}? Se creará el trabajo formal.`);
  if (!confirmed) return;

  acceptingQuoteId.value = quote.id;
  try {
    const { data } = await axios.put(`${API_URLS.TRABAJOS}/api/cotizaciones/${quote.id}/aceptar`, {
      cliente_id: myId.value
    });

    hasActiveJob.value = true;
    showToast('Cotización aceptada. El trabajo fue creado.', 'success');

    socket.emit('send_message', {
      conversacion_id: activeConv.value.id,
      remitente_id: myId.value,
      contenido: `Acepté la cotización por ${formatMoney(quote.monto_total)}. Ya podemos iniciar el trabajo.`
    });

    if (data.trabajo?.id) {
      setTimeout(() => router.push('/client/dashboard'), 900);
    }
  } catch (error) {
    console.error('Error aceptando cotizacion:', error);
    showToast(error.response?.data?.error || 'No se pudo aceptar la cotización', 'error');
  } finally {
    acceptingQuoteId.value = null;
  }
};

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



// Estado
const conversations = ref([]);
const activeConv = ref(null);
const messages = ref([]);
const newMessage = ref('');
const isLoadingConvs = ref(true);
const isLoadingMsgs = ref(false);
const searchQuery = ref('');
const messagesEnd = ref(null);
let socket = null;

const openProfile = (profesionalId) => {
  if (!profesionalId) return;
  router.push(`/client/professional-profile/${profesionalId}`);
};

// Filtrar conversaciones
const filteredConvs = computed(() => {
  if (!searchQuery.value) return conversations.value;
  const q = searchQuery.value.toLowerCase();
  return conversations.value.filter(c => (c.otro_nombre || '').toLowerCase().includes(q));
});

// Total de mensajes no leídos
const unreadTotal = computed(() => {
  return conversations.value.reduce((acc, conv) => acc + (Number(conv.no_leidos) || 0), 0);
});

const onlineUsers = ref([]);

// Conectar socket
const connectSocket = () => {
  socket = io(SOCKET_URL, { query: { userId: myId.value } });
};

// Desconectar
onUnmounted(() => {
  if (socket) socket.disconnect();
});

// Cargar conversaciones
const loadConversations = async () => {
  isLoadingConvs.value = true;
  try {
    const { data } = await axios.get(`${API_URLS.PERFILES}/api/chat/conversaciones/cliente/${myId.value}`);
    conversations.value = data || [];
  } catch (e) {
    console.error(e);
  } finally {
    isLoadingConvs.value = false;
  }
};

// Iniciar o abrir conversación con profesional
const openOrCreateConversation = async (profesionalUsuarioId) => {
  if (!profesionalUsuarioId) return;
  try {
    const { data } = await axios.post(`${API_URLS.PERFILES}/api/chat/conversacion`, {
      cliente_id: myId.value,
      profesional_usuario_id: profesionalUsuarioId
    });
    await loadConversations();
    const found = conversations.value.find(c => c.id === data.id);
    if (found) selectConversation(found);
  } catch (e) {
    console.error(e);
  }
};

// Seleccionar conversación
const selectConversation = async (conv) => {
  // Salir de la sala anterior
  if (activeConv.value && socket) {
    socket.emit('leave_conversation', activeConv.value.id);
  }

  activeConv.value = conv;
  messages.value = [];
  isLoadingMsgs.value = true;

  try {
    const { data } = await axios.get(`${API_URLS.PERFILES}/api/chat/mensajes/${conv.id}`);
    messages.value = data || [];
    scrollToBottom();
  } catch (e) {
    console.error(e);
  } finally {
    isLoadingMsgs.value = false;
  }

  // Verificar si hay trabajo activo para permitir compartir ubicación
  checkActiveJob(conv.profesional_usuario_id);

  // Marcar como leídos
  axios.put(`${API_URLS.PERFILES}/api/chat/leer/${conv.id}`, { lector_id: myId.value }).catch(() => {});
  conv.no_leidos = 0;
  socket.emit('messages_read', { usuarioId: myId.value });

  // Unirse a sala socket
  if (socket) {
    socket.emit('join_conversation', conv.id);
  }
};

// Enviar mensaje
const sendMessage = () => {
  const text = newMessage.value.trim();
  if (!text || !activeConv.value) return;
  newMessage.value = '';

  socket.emit('send_message', {
    conversacion_id: activeConv.value.id,
    remitente_id: myId.value,
    contenido: text
  });
};

const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEnd.value) {
      messagesEnd.value.scrollIntoView({ behavior: 'smooth' });
    }
  });
};

watch(messages, () => {
  scrollToBottom();
}, { deep: true });

const copyToClipboard = (text) => {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Mensaje copiado', 'success');
  }).catch(err => {
    console.error('Error al copiar: ', err);
  });
};

const formatTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hoy';
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
};

onMounted(async () => {
  connectSocket();

  socket.on('online_users', (users) => {
    onlineUsers.value = users;
  });

  // Escuchar mensajes nuevos
  socket.on('new_message', (msg) => {
    if (activeConv.value && msg.conversacion_id === activeConv.value.id) {
      messages.value.push(msg);
      scrollToBottom();
      // Marcar leídos si no los envié yo
      if (msg.remitente_id !== myId.value) {
        axios.put(`${API_URLS.PERFILES}/api/chat/leer/${msg.conversacion_id}`, { lector_id: myId.value }).catch(() => {});
      }
    } else {
      // Actualizar contador de no leídos de la conv correspondiente
      const conv = conversations.value.find(c => c.id === msg.conversacion_id);
      if (conv && msg.remitente_id !== myId.value) conv.no_leidos = (conv.no_leidos || 0) + 1;
    }
    // Actualizar último mensaje en la lista
    const conv = conversations.value.find(c => c.id === msg.conversacion_id);
    if (conv) {
      conv.ultimo_mensaje = msg.contenido;
      conv.ultimo_mensaje_fecha = msg.created_at;
    }
  });

  await loadConversations();

  // Si viene desde el Explore con un profesional, abrir chat directamente
  if (route.query.profesional_id) {
    await openOrCreateConversation(route.query.profesional_id);
  }
});
</script>

<template>
  <div class="chat-shell">

    <!-- ===== LIGHTBOX ===== -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="lightbox.show" class="lightbox-overlay" @click="lightbox.show = false">
          <button class="lightbox-close" @click="lightbox.show = false">×</button>
          <img :src="lightbox.url" class="lightbox-img" @click.stop />
          <div class="lightbox-actions" @click.stop>
            <button @click="downloadImage(lightbox.url)">
              <i class="fa-solid fa-download"></i> Descargar
            </button>
            <a :href="lightbox.url" target="_blank">
              <i class="fa-solid fa-expand"></i> Ver original
            </a>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ===== TOAST ===== -->
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
        <div class="confirm-card">
          <div class="confirm-icon"><i class="fa-solid fa-circle-question"></i></div>
          <p class="confirm-msg">{{ confirmModal.msg }}</p>
          <div class="confirm-actions">
            <button class="confirm-no" @click="handleConfirm(false)">Cancelar</button>
            <button class="confirm-yes" @click="handleConfirm(true)">Confirmar</button>
          </div>
        </div>
      </div>
    </Teleport>

   

    <!-- PANEL IZQUIERDO: LISTA DE CONVERSACIONES -->
    <aside class="chat-sidebar">
      <div class="sidebar-header">
        <h3>Mensajes</h3>
        <span v-if="unreadTotal > 0" class="conv-count">{{ unreadTotal }}</span>
      </div>

      <div class="search-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="s-icon"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" /></svg>
        <input v-model="searchQuery" placeholder="Buscar conversación..." class="search-input" />
      </div>

      <div v-if="isLoadingConvs" class="sidebar-loading">
        <div class="spin"></div>
        <span>Cargando...</span>
      </div>

      <div v-else-if="filteredConvs.length === 0" class="sidebar-empty">
        <div class="empty-chat-icon"><i class="fa-regular fa-comments"></i></div>
        <p>Sin conversaciones aún</p>
        <small>Contacta a un profesional desde <strong>Explorar</strong></small>
      </div>

      <div v-else class="conv-list">
        <div
          v-for="conv in filteredConvs"
          :key="conv.id"
          class="conv-item"
          :class="{ active: activeConv?.id === conv.id }"
          @click="selectConversation(conv)"
        >
          <div class="conv-avatar" :class="conv.otro_avatar ? '' : 'initials-av'">
            <img v-if="conv.otro_avatar" :src="conv.otro_avatar" :alt="conv.otro_nombre" />
            <span v-else>{{ getInitials(conv.otro_nombre) }}</span>
          </div>
          <div class="conv-meta">
            <div class="conv-top">
              <span class="conv-name">{{ conv.otro_nombre || 'Profesional' }}</span>
              <span class="conv-time">{{ formatDate(conv.ultimo_mensaje_fecha) }}</span>
            </div>
            <div class="conv-bottom">
              <span class="conv-last-msg">{{ conv.ultimo_mensaje || 'Sin mensajes aún' }}</span>
              <span v-if="conv.no_leidos > 0" class="unread-badge">{{ conv.no_leidos }}</span>
            </div>
            <div v-if="conv.otro_sub" class="conv-sub">{{ conv.otro_sub }}</div>
          </div>
        </div>
      </div>
    </aside>

    <!-- PANEL DERECHO: VENTANA DE CHAT -->
    <main class="chat-main">

      <!-- Sin conversación seleccionada -->
      <div v-if="!activeConv" class="no-chat-selected">
        <div class="no-chat-icon"><i class="fa-solid fa-message"></i></div>
        <h3>Elige una conversación</h3>
        <p>Selecciona un profesional de la lista para enviarle un mensaje privado.</p>
        <button class="btn-explore" @click="router.push('/client/explore')">
          Explorar Profesionales →
        </button>
      </div>

      <template v-else>
        <!-- HEADER DEL CHAT -->
        <div class="chat-header">
          <div class="chat-header-left" @click="openProfile(activeConv.profesional_usuario_id)" style="cursor: pointer;" title="Ver perfil">
            <div class="header-avatar" :class="activeConv.otro_avatar ? '' : 'initials-av'">
              <img v-if="activeConv.otro_avatar" :src="activeConv.otro_avatar" :alt="activeConv.otro_nombre" />
              <span v-else>{{ getInitials(activeConv.otro_nombre) }}</span>
            </div>
            <div class="header-info">
              <h4>{{ activeConv.otro_nombre || 'Profesional' }}</h4>
              <span class="header-sub">{{ activeConv.otro_sub || 'Profesional' }}</span>
            </div>
          </div>
          <div class="header-status">
            <button v-if="hasActiveJob" class="btn-location" @click="shareLocation" :disabled="isSharingLocation">
              <i class="fa-solid fa-location-crosshairs"></i>
              {{ isSharingLocation ? 'Obteniendo...' : 'Compartir Ubicación' }}
            </button>
            <template v-if="onlineUsers.includes(activeConv.profesional_usuario_id)">
              <span class="online-dot"></span>
              <span>En línea</span>
            </template>
            <template v-else>
              <span class="offline-dot"></span>
              <span class="offline-text">Desconectado</span>
            </template>
          </div>
        </div>

        <!-- MENSAJES -->
        <div class="messages-area">
          <div v-if="isLoadingMsgs" class="msgs-loading">
            <div class="spin"></div>
          </div>

          <div v-else-if="messages.length === 0" class="msgs-empty">
            <div class="wave-emoji"><i class="fa-regular fa-face-smile"></i></div>
            <p>¡Inicia la conversación!</p>
            <small>Los mensajes son privados entre tú y {{ activeConv.otro_nombre }}</small>
          </div>

          <template v-else>
            <div
              v-for="(msg, idx) in messages"
              :key="msg.id"
              class="msg-wrapper"
              :class="msg.remitente_id === myId ? 'msg-mine' : 'msg-theirs'"
            >
              <!-- Fecha separador -->
              <div
                v-if="idx === 0 || formatDate(msg.created_at) !== formatDate(messages[idx-1].created_at)"
                class="date-separator"
              >
                <span>{{ formatDate(msg.created_at) }}</span>
              </div>

              <div class="bubble-row">
                <div class="bubble" :class="msg.remitente_id === myId ? 'bubble-mine' : 'bubble-theirs'">
                  <!-- RENDER SEGÚN TIPO -->
                  <template v-if="msg.tipo === 'imagen'">
                    <div class="image-bubble-wrap">
                      <img :src="msg.contenido" class="msg-image" @click="openLightbox(msg.contenido)" />
                      <button class="img-hover-dl" @click.stop="downloadImage(msg.contenido)">
                        <i class="fa-solid fa-download"></i>
                      </button>
                    </div>
                  </template>
                  
                  <template v-else-if="msg.tipo === 'archivo'">
                    <a :href="msg.contenido" target="_blank" class="msg-file">
                      <i class="fa-solid fa-file-arrow-down"></i>
                      <span>Archivo Adjunto</span>
                    </a>
                  </template>

                  <template v-else-if="msg.tipo === 'cotizacion'">
                    <div class="quote-card" style="background: #f0fdf4; border: 1.5px solid #bbf7d0;">
                      <div class="quote-card-header" style="color: #16a34a;">
                        <i class="fa-solid fa-file-invoice-dollar"></i>
                        <span>Cotización recibida</span>
                      </div>
                      <p style="font-size: 0.88rem; color: #166534; font-weight: 500; margin: 6px 0 0;">
                        El profesional te ha enviado una cotización.
                      </p>
                      <button
                        class="quote-accept-btn"
                        @click="$router.push('/client/dashboard')"
                        style="margin-top: 10px; background: #16a34a;"
                      >
                        <i class="fa-solid fa-arrow-right"></i>
                        Ver en mi Panel
                      </button>
                    </div>
                  </template>

                  <template v-else-if="msg.contenido.includes('https://www.google.com/maps')">
                    <p>{{ msg.contenido.split('https://')[0] }}</p>
                    <a :href="'https://' + msg.contenido.split('https://')[1]" target="_blank" class="location-link">
                      <i class="fa-solid fa-map-location-dot"></i> Ver en Google Maps
                    </a>
                  </template>

                  <p v-else>{{ msg.contenido }}</p>
                  <div class="bubble-meta">
                    <span class="bubble-time">{{ formatTime(msg.created_at) }}</span>
                    <span v-if="msg.remitente_id === myId" class="read-tick" :class="{ read: msg.leido }">
                      <i class="fa-solid fa-check-double"></i>
                    </span>
                    <button v-if="!msg.tipo || msg.tipo === 'texto' || !['imagen','archivo','cotizacion'].includes(msg.tipo)" 
                            class="msg-copy-btn" 
                            @click="copyToClipboard(msg.contenido)" 
                            title="Copiar mensaje">
                      <i class="fa-regular fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div ref="messagesEnd"></div>
          </template>
        </div>

        <!-- INPUT ÁREA -->
        <div class="chat-input-area">
          <div class="attachment-container">
            <button class="btn-plus" @click="showAttachmentMenu = !showAttachmentMenu">
              <i class="fa-solid fa-plus"></i>
            </button>
            
            <Transition name="menu-pop">
              <div v-if="showAttachmentMenu" class="attachment-menu">
                <button @click="triggerFileSelect('image')">
                  <div class="menu-icon img-icon"><i class="fa-solid fa-image"></i></div>
                  <span>Fotos</span>
                </button>
                <button @click="triggerFileSelect('file')">
                  <div class="menu-icon file-icon"><i class="fa-solid fa-file-lines"></i></div>
                  <span>Documento</span>
                </button>
                <button v-if="hasActiveJob" @click="shareLocation">
                  <div class="menu-icon loc-icon"><i class="fa-solid fa-location-dot"></i></div>
                  <span>Ubicación</span>
                </button>
              </div>
            </Transition>
          </div>

          <input type="file" ref="fileInput" style="display:none" @change="onFileChange" />

          <textarea
            v-model="newMessage"
            @keydown="handleKeydown"
            placeholder="Escribe un mensaje..."
            class="msg-input"
            rows="1"
          ></textarea>
          <button class="btn-send" @click="sendMessage" :disabled="!newMessage.trim()">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
            </svg>
          </button>
        </div>
      </template>

    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ===== SHELL ===== */
.chat-shell {
  display: flex;
  height: calc(100vh - 80px);
  border-radius: 20px;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  box-shadow: 0 8px 40px rgba(0,0,0,0.12);
  border: 1px solid rgba(255,255,255,0.1);
}

/* ===== SIDEBAR ===== */
.chat-sidebar {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border-right: 1px solid #E2E8F0;
}

.sidebar-header {
  padding: 24px 20px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #E2E8F0;
}
.sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #1E293B;
  letter-spacing: -0.3px;
}
.conv-count {
  background: linear-gradient(135deg, #3B82F6, #0B4C6F);
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 20px;
  letter-spacing: 0.3px;
}

.search-wrap { position: relative; padding: 14px 14px 8px; }
.s-icon { position: absolute; left: 24px; top: 24px; width: 15px; height: 15px; color: #94A3B8; }
.search-input {
  width: 100%;
  padding: 10px 14px 10px 36px;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  font-size: 0.85rem;
  background: #F8FAFC;
  color: #1e293b;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s, background 0.2s;
}
.search-input::placeholder { color: #94A3B8; }
.search-input:focus { border-color: #3B82F6; background: #EFF6FF; }

.sidebar-loading, .sidebar-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #4B5563;
  padding: 24px;
  text-align: center;
}
.empty-chat-icon { font-size: 2.8rem; color: #1e3a5f; }
.sidebar-empty p { margin: 0; font-weight: 600; color: #6B7280; font-size: 0.9rem; }
.sidebar-empty small { font-size: 0.8rem; color: #374151; }

.conv-list { flex: 1; overflow-y: auto; }
.conv-list::-webkit-scrollbar { width: 4px; }
.conv-list::-webkit-scrollbar-track { background: transparent; }
.conv-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

.conv-item {
  display: flex;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  border-bottom: 1px solid #F1F5F9;
  transition: background 0.15s;
  position: relative;
}
.conv-item:hover { background: #F8FAFC; }
.conv-item.active {
  background: #EFF6FF;
  border-left: 3px solid #3B82F6;
}

.conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #1e3a5f, #0B4C6F);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255,255,255,0.08);
}
.conv-avatar img { width: 100%; height: 100%; object-fit: cover; }
.conv-avatar.initials-av span { font-size: 1rem; font-weight: 800; color: #93C5FD; }

.conv-meta { flex: 1; min-width: 0; }
.conv-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.conv-name { font-size: 0.88rem; font-weight: 700; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 152px; }
.conv-time { font-size: 0.7rem; color: #94A3B8; flex-shrink: 0; }
.conv-bottom { display: flex; justify-content: space-between; align-items: center; }
.conv-last-msg { font-size: 0.78rem; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px; }
.unread-badge {
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  animation: pulse-badge 1.5s infinite;
}
@keyframes pulse-badge { 0%,100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); } 50% { box-shadow: 0 0 0 5px rgba(59,130,246,0); } }
.conv-sub { font-size: 0.7rem; color: #374151; margin-top: 2px; }

/* ===== MAIN AREA ===== */
.chat-main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: #FFFFFF; }

.no-chat-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  gap: 14px;
  padding: 40px;
  text-align: center;
}
.no-chat-icon {
  font-size: 3.5rem;
  color: #BFDBFE;
  width: 90px;
  height: 90px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 24px rgba(59,130,246,0.15);
  border: 2px solid #BFDBFE;
}
.no-chat-selected h3 { margin: 0; font-size: 1.25rem; color: #1e3a5f; font-weight: 800; }
.no-chat-selected p { margin: 0; color: #64748B; font-size: 0.9rem; max-width: 280px; line-height: 1.6; }
.btn-explore {
  background: linear-gradient(135deg, #0B4C6F, #3B82F6);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
  transition: 0.2s;
  box-shadow: 0 4px 12px rgba(11,76,111,0.3);
}
.btn-explore:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(11,76,111,0.4); }

/* CHAT HEADER */
.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 1px 8px rgba(0,0,0,0.04);
}
.chat-header-left { display: flex; align-items: center; gap: 14px; }
.header-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #BFDBFE, #93C5FD);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #EFF6FF;
}
.header-avatar img { width: 100%; height: 100%; object-fit: cover; }
.header-avatar.initials-av span { font-size: 1rem; font-weight: 800; color: #0B4C6F; }
.header-info h4 { margin: 0 0 2px; font-size: 0.95rem; font-weight: 800; color: #111; }
.header-sub { font-size: 0.76rem; color: #64748B; font-weight: 500; }
.header-status { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 600; }
.online-dot { width: 9px; height: 9px; background: #22C55E; border-radius: 50%; box-shadow: 0 0 0 2px #D1FAE5; animation: pulse-online 2s infinite; }
.header-status span:nth-last-child(1) { color: #059669; }
.offline-dot { width: 9px; height: 9px; background: #94A3B8; border-radius: 50%; box-shadow: 0 0 0 2px #E2E8F0; }
.offline-text { color: #64748B !important; }
@keyframes pulse-online { 0%,100% { box-shadow: 0 0 0 2px #D1FAE5; } 50% { box-shadow: 0 0 0 4px rgba(34,197,94,0.2); } }



/* MESSAGES AREA */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: white;
  background-image: radial-gradient(#F1F5F9 1px, transparent 1px);
  background-size: 24px 24px;
}
.messages-area::-webkit-scrollbar { width: 5px; }
.messages-area::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
.msgs-loading { flex: 1; display: flex; align-items: center; justify-content: center; }
.msgs-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
}
.wave-emoji {
  font-size: 2.5rem;
  color: #94A3B8;
  background: white;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  border: 1px solid #E2E8F0;
}
.badge-unread {
  background: #2563EB;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
}
.msgs-empty p { margin: 0; font-size: 1rem; font-weight: 700; color: #475569; }
.msgs-empty small { font-size: 0.82rem; color: #94A3B8; }

.date-separator { text-align: center; margin: 16px 0 8px; }
.date-separator span {
  background: white;
  color: #94A3B8;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  border: 1px solid #E2E8F0;
  letter-spacing: 0.5px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.msg-wrapper { display: flex; flex-direction: column; margin-bottom: 6px; }
.bubble-row { display: flex; }
.msg-mine .bubble-row { justify-content: flex-end; }
.msg-theirs .bubble-row { justify-content: flex-start; }

.bubble {
  max-width: 68%;
  padding: 12px 16px;
  border-radius: 18px;
  position: relative;
  animation: bubble-in 0.2s ease-out;
}
@keyframes bubble-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.bubble p { margin: 0 0 6px; font-size: 0.88rem; line-height: 1.6; word-break: break-word; }
.bubble-mine {
  background: linear-gradient(135deg, #0B4C6F, #1D6FA8);
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 12px rgba(11,76,111,0.25);
}
.bubble-theirs {
  background: white;
  color: #1e293b;
  border-bottom-left-radius: 4px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.bubble-meta { display: flex; align-items: center; justify-content: flex-end; gap: 5px; }
.bubble-time { font-size: 0.66rem; opacity: 0.65; }
.read-tick { font-size: 0.72rem; opacity: 0.5; }
.read-tick.read { opacity: 1; color: #7DD3FC; }

/* INPUT */
.chat-input-area {
  padding: 14px 20px;
  border-top: 1px solid #E2E8F0;
  background: white;
  display: flex;
  align-items: flex-end;
  gap: 12px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.04);
}
.msg-input {
  flex: 1;
  padding: 12px 18px;
  border: 1.5px solid #E2E8F0;
  border-radius: 24px;
  font-size: 0.88rem;
  font-family: inherit;
  outline: none;
  resize: none;
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.5;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #F8FAFC;
  color: #1e293b;
}
.msg-input:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  background: white;
}
.msg-input::placeholder { color: #94A3B8; }
.btn-send {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #0B4C6F, #3B82F6);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(11,76,111,0.35);
}
.btn-send:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 6px 18px rgba(11,76,111,0.45); }
.btn-send:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }
.btn-send svg { width: 18px; height: 18px; color: white; }

/* SPIN */
.spin { width: 28px; height: 28px; border: 3px solid #E2E8F0; border-top-color: #3B82F6; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .chat-sidebar { width: 100%; display: none; }
  .chat-sidebar.visible { display: flex; position: absolute; z-index: 10; left: 0; top: 0; width: 100%; height: 100%; }
}

/* --- TOAST --- */
.app-toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  min-width: 300px; max-width: 90vw;
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; border-radius: 12px;
  font-weight: 600; font-size: 0.9rem;
  box-shadow: 0 10px 40px rgba(0,0,0,0.18); z-index: 99999;
}
.app-toast--success { background: #1E293B; color: white; }
.app-toast--success i { color: #4ADE80; }
.app-toast--error { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
.app-toast--error i { color: #DC2626; }
.app-toast span { flex: 1; }
.toast-close { background: none; border: none; color: inherit; opacity: 0.6; cursor: pointer; font-size: 1.2rem; }
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
  max-width: 380px; width: 100%; text-align: center;
  box-shadow: 0 25px 50px rgba(0,0,0,0.2);
}
.confirm-icon { font-size: 2.5rem; color: #F59E0B; margin-bottom: 16px; }
.confirm-msg { font-size: 0.97rem; color: #334155; line-height: 1.6; margin: 0 0 24px; font-weight: 500; }
.confirm-actions { display: flex; gap: 12px; }
.confirm-no  { flex: 1; padding: 11px; border: 1.5px solid #E2E8F0; border-radius: 8px; background: white; color: #64748B; font-weight: 700; cursor: pointer; transition: 0.2s; }
.confirm-no:hover { background: #F8FAFC; }
.confirm-yes { flex: 1; padding: 11px; border: none; border-radius: 8px; background: #22C55E; color: white; font-weight: 700; cursor: pointer; transition: 0.2s; }
.confirm-yes:hover { background: #16A34A; }


.btn-location {
  background: #EFF6FF;
  color: #3B82F6;
  border: 1.5px solid #BFDBFE;
  border-radius: 8px;
  padding: 8px 14px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 12px;
  transition: 0.2s;
}
.btn-location:hover:not(:disabled) {
  background: #DBEAFE;
  border-color: #3B82F6;
  transform: translateY(-1px);
}
.btn-location:disabled { opacity: 0.6; cursor: not-allowed; }

.location-link {
  display: block;
  margin-top: 8px;
  background: white;
  color: #1E293B;
  padding: 10px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.85rem;
  border: 1px solid #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: 0.2s;
}
.msg-mine .location-link { color: #0B4C6F; }
.location-link:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

.msg-copy-btn {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.5;
  cursor: pointer;
  padding: 0 4px;
  font-size: 0.9rem;
  transition: all 0.2s;
}
.msg-copy-btn:hover { opacity: 1; transform: scale(1.1); }
.bubble-meta { display: flex; align-items: center; gap: 6px; }
/* --- ATTACHMENT PANEL --- */
.attachment-container { position: relative; }
.btn-plus {
  width: 40px; height: 40px; border-radius: 50%; border: none;
  background: #F1F5F9; color: #64748B; cursor: pointer; transition: 0.2s;
  display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
}
.btn-plus:hover { background: #E2E8F0; color: #1E293B; }

.attachment-menu {
  position: absolute; bottom: 60px; left: 0; background: white;
  border-radius: 16px; padding: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; gap: 8px; min-width: 150px;
  border: 1px solid #F1F5F9; z-index: 100;
}
.attachment-menu button {
  display: flex; align-items: center; gap: 12px; padding: 10px;
  border: none; background: none; width: 100%; cursor: pointer;
  border-radius: 10px; transition: 0.2s;
}
.attachment-menu button:hover { background: #F8FAFC; }
.attachment-menu span { font-size: 0.85rem; font-weight: 600; color: #475569; }

.menu-icon {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: white; font-size: 1rem;
}
.img-icon { background: #9333EA; }
.file-icon { background: #2563EB; }
.loc-icon { background: #16A34A; }

.menu-pop-enter-active, .menu-pop-leave-active { transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.menu-pop-enter-from, .menu-pop-leave-to { opacity: 0; transform: scale(0.5) translateY(20px); transform-origin: bottom left; }

.msg-image { max-width: 100%; border-radius: 10px; cursor: pointer; margin-bottom: 5px; border: 1px solid rgba(0,0,0,0.05); }
.msg-file {
  display: flex; align-items: center; gap: 10px; padding: 12px;
  background: rgba(255,255,255,0.15); border-radius: 10px;
  text-decoration: none; color: inherit; font-weight: 700; font-size: 0.85rem;
  border: 1px solid rgba(255,255,255,0.1); margin-bottom: 5px;
}
.bubble-theirs .msg-file { background: #F1F5F9; color: #1E293B; }

/* --- LIGHTBOX --- */
.lightbox-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9);
  z-index: 999999; display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px; backdrop-filter: blur(8px);
}
.lightbox-img { max-width: 90vw; max-height: 80vh; object-fit: contain; border-radius: 8px; box-shadow: 0 0 50px rgba(0,0,0,0.5); }
.lightbox-close {
  position: absolute; top: 30px; right: 30px; background: none; border: none;
  color: white; font-size: 2.5rem; cursor: pointer; opacity: 0.7; transition: 0.2s;
}
.lightbox-close:hover { opacity: 1; transform: scale(1.1); }
.lightbox-actions {
  margin-top: 24px; display: flex; gap: 16px;
}
.lightbox-actions button, .lightbox-actions a {
  background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2);
  padding: 10px 20px; border-radius: 30px; text-decoration: none; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s;
}
.lightbox-actions button:hover, .lightbox-actions a:hover { background: white; color: black; }

.image-bubble-wrap { position: relative; cursor: pointer; }
.img-hover-dl {
  position: absolute; top: 10px; right: 10px; width: 32px; height: 32px;
  background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s;
  cursor: pointer;
}
.image-bubble-wrap:hover .img-hover-dl { opacity: 1; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.quote-card {
  width: 270px; background: white; color: #0F172A; border-radius: 14px;
  border: 1px solid #BFDBFE; overflow: hidden; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}
.quote-card-header {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  background: #EFF6FF; color: #1D4ED8; font-size: 0.8rem; font-weight: 800;
}
.quote-card h4 { margin: 12px 12px 6px; font-size: 0.95rem; font-weight: 800; }
.quote-card p { margin: 0 12px 10px; color: #475569; font-size: 0.82rem; }
.quote-total { margin: 0 12px 8px; font-size: 1.45rem; font-weight: 900; color: #1D4ED8; }
.quote-card small { display: block; margin: 0 12px 12px; color: #64748B; font-weight: 700; }
.quote-accept-btn {
  width: calc(100% - 24px); margin: 0 12px 12px; padding: 10px;
  border: none; border-radius: 9px; background: #22C55E; color: white;
  font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.quote-accept-btn:disabled { opacity: 0.65; cursor: not-allowed; }

/* --- PROFILE MODAL --- */
.profile-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px;
  backdrop-filter: blur(4px);
}
.profile-modal-card {
  background: white; width: 100%; max-width: 420px; border-radius: 20px;
  overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative;
}
.pm-close {
  position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.2);
  color: white; border: none; width: 30px; height: 30px; border-radius: 50%;
  font-size: 1.2rem; cursor: pointer; z-index: 10; display: flex; align-items: center; justify-content: center;
}
.pm-close:hover { background: rgba(0,0,0,0.4); }
.pm-loading { padding: 40px; text-align: center; color: #64748B; font-weight: 600; }
.pm-banner { height: 120px; background: linear-gradient(135deg, #0B4C6F, #1a8fcc); background-size: cover; background-position: center; }
.pm-header { padding: 0 24px 16px; text-align: center; margin-top: -40px; border-bottom: 1px solid #F1F5F9; }
.pm-avatar {
  width: 80px; height: 80px; border-radius: 50%; border: 4px solid white;
  margin: 0 auto 10px; background: #E0F2FE; display: flex; align-items: center; justify-content: center;
  overflow: hidden; font-size: 2rem; font-weight: 800; color: #0B4C6F; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.pm-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pm-header h3 { margin: 0 0 4px; font-size: 1.3rem; font-weight: 800; color: #1E293B; }
.pm-profession { margin: 0 0 10px; color: #3B82F6; font-weight: 600; font-size: 0.9rem; }
.pm-meta { display: flex; justify-content: center; gap: 12px; color: #64748B; font-size: 0.8rem; font-weight: 600; }
.pm-body { padding: 20px 24px; }
.pm-section { margin-bottom: 16px; }
.pm-section h4 { margin: 0 0 8px; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; }
.pm-section p { margin: 0; font-size: 0.9rem; color: #334155; line-height: 1.5; }
.pm-footer { margin-top: 24px; }
.pm-btn-primary {
  width: 100%; background: #0B4C6F; color: white; border: none;
  padding: 12px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s;
}
.pm-btn-primary:hover { background: #083a55; }

</style>
