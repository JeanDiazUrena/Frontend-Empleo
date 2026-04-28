<script setup>
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

const isHiring = ref(false);

const contratarProfesional = async () => {
    if (!activeConv.value) return;
    const confirmed = await askConfirm(`¿Deseas contratar formalmente a ${activeConv.value.otro_nombre}? Esto creará un trabajo en progreso.`);
    if (!confirmed) return;

    isHiring.value = true;
    try {
        const res = await axios.post('http://localhost:3003/api/trabajos', {
            cliente_id: myId.value,
            profesional_id: activeConv.value.profesional_usuario_id,
            solicitud_id: null
        });

        if (res.data.success) {
            showToast('¡Profesional contratado! Puedes ver el progreso en tu panel.', 'success');
            setTimeout(() => router.push('/client/dashboard'), 2000);
        }
    } catch(e) {
        console.error(e);
        showToast('Error al intentar contratar al profesional.', 'error');
    } finally {
        isHiring.value = false;
    }
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
  socket = io('http://localhost:3001', { query: { userId: myId.value } });
};

// Desconectar
onUnmounted(() => {
  if (socket) socket.disconnect();
});

// Cargar conversaciones
const loadConversations = async () => {
  isLoadingConvs.value = true;
  try {
    const { data } = await axios.get(`http://localhost:3001/api/chat/conversaciones/cliente/${myId.value}`);
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
    const { data } = await axios.post('http://localhost:3001/api/chat/conversacion', {
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
    const { data } = await axios.get(`http://localhost:3001/api/chat/mensajes/${conv.id}`);
    messages.value = data || [];
    scrollToBottom();
  } catch (e) {
    console.error(e);
  } finally {
    isLoadingMsgs.value = false;
  }

  // Marcar como leídos
  axios.put(`http://localhost:3001/api/chat/leer/${conv.id}`, { lector_id: myId.value }).catch(() => {});
  conv.no_leidos = 0;

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
        axios.put(`http://localhost:3001/api/chat/leer/${msg.conversacion_id}`, { lector_id: myId.value }).catch(() => {});
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
            <button class="confirm-yes" @click="handleConfirm(true)">¡Sí, contratar!</button>
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
          <div class="chat-header-left">
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
            <button class="btn-hire" @click="contratarProfesional" :disabled="isHiring">
                <i class="fa-solid fa-handshake"></i> Contratar Profesional
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
                  <p>{{ msg.contenido }}</p>
                  <div class="bubble-meta">
                    <span class="bubble-time">{{ formatTime(msg.created_at) }}</span>
                    <span v-if="msg.remitente_id === myId" class="read-tick" :class="{ read: msg.leido }">
                      <i class="fa-solid fa-check-double"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div ref="messagesEnd"></div>
          </template>
        </div>

        <!-- INPUT ÁREA -->
        <div class="chat-input-area">
          <textarea
            v-model="newMessage"
            @keydown="handleKeydown"
            placeholder="Escribe un mensaje... (Enter para enviar)"
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
  background: #3B82F6;
  color: white;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 800;
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

.btn-hire {
    background: #22C55E;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-right: 12px;
    transition: all 0.2s;
    box-shadow: 0 2px 6px rgba(34, 197, 94, 0.3);
}
.btn-hire:hover:not(:disabled) {
    background: #16A34A;
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(34, 197, 94, 0.4);
}
.btn-hire:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

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


</style>