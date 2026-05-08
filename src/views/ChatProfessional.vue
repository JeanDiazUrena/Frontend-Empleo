<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useUserSession } from '../composables/useUserSession.js';
import { normalizeMediaUrl } from '../utils/media.js';
import LocationMap from '../components/LocationMap.vue';

const router = useRouter();
const { state } = useUserSession();

const myId = computed(() => state.user?.id || localStorage.getItem('usuario_id'));

const conversations = ref([]);
const activeConv = ref(null);
const messages = ref([]);
const newMessage = ref('');
const profBankInfo = ref({
  banco: 'Banco Popular',
  numero_cuenta: '792012345',
  tipo: 'Corriente',
  titular: state.user?.name || 'Profesional ServiHub'
});
const isLoadingConvs = ref(true);
const isLoadingMsgs = ref(false);
const searchQuery = ref('');
const messagesEnd = ref(null);
let socket = null;

const showAttachmentMenu = ref(false);
const fileInput = ref(null);
const pendingAttachment = ref(null);
const isSendingAttachment = ref(false);
const isSharingLocation = ref(false);
const lightbox = ref({ show: false, url: '' });

const openLightbox = (url) => {
  lightbox.value = { show: true, url };
};

const openClientProfile = (clienteId) => {
  if (!clienteId) return;
  router.push(`/professional/client-profile/${clienteId}`);
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
    fileInput.value.setAttribute('accept', type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,image/*,application/*');
    fileInput.value.click();
  }
};

const formatFileSize = (bytes = 0) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const closeAttachmentPreview = () => {
  if (pendingAttachment.value?.previewUrl) URL.revokeObjectURL(pendingAttachment.value.previewUrl);
  pendingAttachment.value = null;
  if (fileInput.value) fileInput.value.value = '';
};

const onFileChange = (e) => {
  const file = e.target.files[0];
  if (!file || !activeConv.value) return;

  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE) {
    console.warn('Archivo demasiado pesado (Máximo 50MB)');
    e.target.value = '';
    return;
  }

  if (pendingAttachment.value?.previewUrl) URL.revokeObjectURL(pendingAttachment.value.previewUrl);
  pendingAttachment.value = {
    file,
    isImage: file.type.startsWith('image/'),
    previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    caption: ''
  };
};

const sendPendingAttachment = async () => {
  if (!pendingAttachment.value || !activeConv.value || isSendingAttachment.value) return;
  const { file, caption } = pendingAttachment.value;
  const formData = new FormData();
  formData.append('file', file);

  try {
    isSendingAttachment.value = true;
    const { data } = await axios.post(`${API_URLS.PERFILES}/api/chat/upload`, formData);
    const tipo = file.type.startsWith('image/') ? 'imagen' : 'archivo';
    
    socket.emit('send_message', {
      conversacion_id: activeConv.value.id,
      remitente_id: myId.value,
      contenido: normalizeMediaUrl(data.url),
      tipo: tipo,
      nombre_archivo: data.filename || file.name,
      metadata: {
        mimetype: data.mimetype || file.type,
        size: data.size || file.size,
        caption: caption?.trim() || ''
      }
    });
    closeAttachmentPreview();
  } catch (err) {
    console.error("Error uploading file:", err);
  } finally {
    isSendingAttachment.value = false;
  }
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  // Opcional: mostrar un toast de éxito si tienes el sistema inyectado
};

const enviarDatosBancarios = () => {
  if (!activeConv.value) return;
  showAttachmentMenu.value = false;
  
  // Enviamos los datos como un string JSON
  const bankDataString = JSON.stringify(profBankInfo.value);
  
  socket.emit('send_message', {
    conversacion_id: activeConv.value.id,
    remitente_id: myId.value,
    contenido: bankDataString,
    tipo: 'bank_info'
  });
};



const compartirUbicacion = () => {
  if (!activeConv.value) return;
  showAttachmentMenu.value = false;

  if (navigator.geolocation) {
    isSharingLocation.value = true;
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

      socket.emit('send_message', {
        conversacion_id: activeConv.value.id,
        remitente_id: myId.value,
        contenido: JSON.stringify({ latitude, longitude, url: mapsUrl, label: 'Mi ubicacion' }),
        tipo: 'ubicacion',
        metadata: { accuracy: position.coords.accuracy }
      });
      isSharingLocation.value = false;
    }, (err) => {
      console.error('Error obteniendo ubicacion:', err);
      isSharingLocation.value = false;
    });
  }
};

const parseLocation = (content) => {
  try {
    const location = JSON.parse(content);
    if (location?.latitude && location?.longitude) return location;
  } catch {
    const match = String(content || '').match(/https:\/\/www\.google\.com\/maps\?q=([-0-9.]+),([-0-9.]+)/);
    if (match) return { latitude: match[1], longitude: match[2], url: match[0], label: 'Ubicacion compartida' };
  }
  return null;
};

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

const connectSocket = () => {
  socket = io(SOCKET_URL, { query: { userId: myId.value } });
};

onUnmounted(() => {
  if (socket) socket.disconnect();
});

const loadConversations = async () => {
  isLoadingConvs.value = true;
  try {
    const { data } = await axios.get(`${API_URLS.PERFILES}/api/chat/conversaciones/profesional/${myId.value}`);
    conversations.value = (data || []).map(conv => ({
      ...conv,
      otro_avatar: normalizeMediaUrl(conv.otro_avatar || '')
    }));
  } catch (e) {
    console.error(e);
  } finally {
    isLoadingConvs.value = false;
  }
};

const selectConversation = async (conv) => {
  if (activeConv.value && socket) socket.emit('leave_conversation', activeConv.value.id);

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

  axios.put(`${API_URLS.PERFILES}/api/chat/leer/${conv.id}`, { lector_id: myId.value }).catch(() => {});
  conv.no_leidos = 0;
  if (socket) {
    socket.emit('messages_read', { usuarioId: myId.value });
    socket.emit('join_conversation', conv.id);
  }
};

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
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEnd.value) messagesEnd.value.scrollIntoView({ behavior: 'smooth' });
  });
};

watch(messages, () => {
  scrollToBottom();
}, { deep: true });

const copyToClipboardText = (text) => {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    alert('Mensaje copiado');
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

  // Cargar datos bancarios reales del profesional
  try {
    const { data: finData } = await axios.get(`${API_URLS.PERFILES}/api/profesionales/${myId.value}/financiero`);
    if (finData) {
      profBankInfo.value = {
        banco: finData.banco || 'No especificado',
        numero_cuenta: finData.cuenta_bancaria || 'No especificado',
        tipo: 'Corriente', // Opcional: podrías añadir este campo a la DB también
        titular: state.user?.name || 'Profesional ServiHub'
      };
    }
  } catch (err) {
    console.log("No se pudieron cargar datos financieros para el chat, usando defaults.");
  }

  socket.on('online_users', (users) => {
    onlineUsers.value = users;
  });

  socket.on('new_message', (msg) => {
    if (activeConv.value && msg.conversacion_id === activeConv.value.id) {
      messages.value.push(msg);
      scrollToBottom();
      if (msg.remitente_id !== myId.value) {
        axios.put(`${API_URLS.PERFILES}/api/chat/leer/${msg.conversacion_id}`, { lector_id: myId.value }).catch(() => {});
      }
    } else {
      const conv = conversations.value.find(c => c.id === msg.conversacion_id);
      if (conv && msg.remitente_id !== myId.value) conv.no_leidos = (conv.no_leidos || 0) + 1;
    }
    const conv = conversations.value.find(c => c.id === msg.conversacion_id);
    if (conv) { conv.ultimo_mensaje = msg.contenido; conv.ultimo_mensaje_fecha = msg.created_at; }
  });

  await loadConversations();
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

    <Teleport to="body">
      <Transition name="fade">
        <div v-if="pendingAttachment" class="attachment-preview-overlay" @click="closeAttachmentPreview">
          <div class="attachment-preview-card" @click.stop>
            <div class="attachment-preview-header">
              <h3>{{ pendingAttachment.isImage ? 'Enviar foto' : 'Enviar documento' }}</h3>
              <button @click="closeAttachmentPreview">x</button>
            </div>
            <div class="attachment-preview-body">
              <img v-if="pendingAttachment.isImage" :src="pendingAttachment.previewUrl" class="attachment-preview-image" alt="Vista previa" />
              <div v-else class="attachment-preview-file">
                <i class="fa-solid fa-file-lines"></i>
                <strong>{{ pendingAttachment.file.name }}</strong>
                <span>{{ formatFileSize(pendingAttachment.file.size) }}</span>
              </div>
              <textarea v-model="pendingAttachment.caption" class="attachment-caption" placeholder="Agregar comentario..." rows="2"></textarea>
            </div>
            <div class="attachment-preview-actions">
              <button class="preview-cancel" @click="closeAttachmentPreview">Cancelar</button>
              <button class="preview-send" @click="sendPendingAttachment" :disabled="isSendingAttachment">
                <i class="fa-solid fa-paper-plane"></i>
                {{ isSendingAttachment ? 'Enviando...' : 'Enviar' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>




    <!-- SIDEBAR -->
    <aside class="chat-sidebar">
      <div class="sidebar-header">
        <h3>Mensajes</h3>
        <span v-if="unreadTotal > 0" class="conv-count">{{ unreadTotal }}</span>
      </div>

      <div class="search-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="s-icon"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" /></svg>
        <input v-model="searchQuery" placeholder="Buscar cliente..." class="search-input" />
      </div>

      <div v-if="isLoadingConvs" class="sidebar-loading">
        <div class="spin"></div><span>Cargando...</span>
      </div>

      <div v-else-if="filteredConvs.length === 0" class="sidebar-empty">
        <div class="empty-chat-icon"><i class="fa-regular fa-comments"></i></div>
        <p>Sin mensajes aún</p>
        <small>Cuando los clientes te contacten aparecerán aquí.</small>
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
              <span class="conv-name">{{ conv.otro_nombre || 'Cliente' }}</span>
              <span class="conv-time">{{ formatDate(conv.ultimo_mensaje_fecha) }}</span>
            </div>
            <div class="conv-bottom">
              <span class="conv-last-msg">{{ conv.ultimo_mensaje || 'Sin mensajes aún' }}</span>
              <span v-if="conv.no_leidos > 0" class="unread-badge">{{ conv.no_leidos }}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- MAIN CHAT -->
    <main class="chat-main">

      <div v-if="!activeConv" class="no-chat-selected">
        <div class="no-chat-icon"><i class="fa-solid fa-message"></i></div>
        <h3>Mensajería Profesional</h3>
        <p>Selecciona un cliente de la lista para responder sus mensajes.</p>
        <div class="nchat-tip">
          <span><i class="fa-regular fa-lightbulb"></i></span>
          <span>Responde rápido para generar confianza con tus futuros clientes.</span>
        </div>
      </div>

      <template v-else>
        <!-- HEADER -->
        <div class="chat-header">
          <div class="chat-header-left" @click="openClientProfile(activeConv.cliente_id)" style="cursor: pointer;" title="Ver perfil">
            <div class="header-avatar" :class="activeConv.otro_avatar ? '' : 'initials-av'">
              <img v-if="activeConv.otro_avatar" :src="activeConv.otro_avatar" :alt="activeConv.otro_nombre" />
              <span v-else>{{ getInitials(activeConv.otro_nombre) }}</span>
            </div>
            <div class="header-info">
              <h4>{{ activeConv.otro_nombre || 'Cliente' }}</h4>
              <span class="header-sub">Cliente ServiHub</span>
            </div>
          </div>
          <div class="header-status">
            <template v-if="onlineUsers.includes(activeConv.cliente_id)">
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
          <div v-if="isLoadingMsgs" class="msgs-loading"><div class="spin"></div></div>

          <div v-else-if="messages.length === 0" class="msgs-empty">
            <div class="wave-emoji"><i class="fa-regular fa-face-smile"></i></div>
            <p>Aún no hay mensajes</p>
            <small>Envía una respuesta para iniciar la conversación</small>
          </div>

          <template v-else>
            <div
              v-for="(msg, idx) in messages"
              :key="msg.id"
              class="msg-wrapper"
              :class="msg.remitente_id === myId ? 'msg-mine' : 'msg-theirs'"
            >
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
                      <img :src="normalizeMediaUrl(msg.contenido)" class="msg-image" @click="openLightbox(normalizeMediaUrl(msg.contenido))" />
                      <button class="img-hover-dl" @click.stop="downloadImage(normalizeMediaUrl(msg.contenido))">
                        <i class="fa-solid fa-download"></i>
                      </button>
                    </div>
                  </template>
                  
                  <template v-else-if="msg.tipo === 'archivo'">
                    <a :href="normalizeMediaUrl(msg.contenido)" target="_blank" class="msg-file" :title="msg.nombre_archivo || 'Descargar archivo'">
                      <div class="file-icon-wrap">
                        <i class="fa-solid fa-file-lines"></i>
                      </div>
                      <div class="file-info-wrap">
                        <span class="file-name-text">{{ msg.nombre_archivo || 'Archivo Adjunto' }}</span>
                        <span class="file-action-text">{{ msg.metadata?.size ? formatFileSize(msg.metadata.size) : 'Haga clic para descargar' }}</span>
                      </div>
                    </a>
                  </template>

                  <template v-else-if="msg.tipo === 'ubicacion' || parseLocation(msg.contenido)">
                    <div class="location-card">
                      <i class="fa-solid fa-map-location-dot"></i>
                      <div>
                        <strong>{{ parseLocation(msg.contenido)?.label || 'Ubicacion compartida' }}</strong>
                        <a :href="parseLocation(msg.contenido)?.url" target="_blank">Ver en Google Maps</a>
                      </div>
                    </div>
                    <p v-if="msg.metadata?.caption" class="media-caption">{{ msg.metadata.caption }}</p>
                  </template>

                  <template v-else-if="msg.tipo === 'bank_info'">
                    <div class="bank-info-card">
                      <div class="bic-header">
                        <i class="fa-solid fa-building-columns"></i>
                        <span>Datos de Pago</span>
                      </div>
                      <div class="bic-body">
                        <div class="bic-field">
                          <label>Banco</label>
                          <p>{{ JSON.parse(msg.contenido).banco }}</p>
                        </div>
                        <div class="bic-field">
                          <label>Número de Cuenta</label>
                          <div class="bic-row">
                            <span class="acc-num">{{ JSON.parse(msg.contenido).numero_cuenta }}</span>
                            <button class="copy-btn" @click="copyToClipboard(JSON.parse(msg.contenido).numero_cuenta)" title="Copiar cuenta">
                              <i class="fa-regular fa-copy"></i>
                            </button>
                          </div>
                        </div>
                        <div class="bic-field">
                          <label>Titular</label>
                          <p>{{ JSON.parse(msg.contenido).titular }}</p>
                        </div>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="msg.tipo === 'cotizacion'">
                    <div class="bank-info-card" style="background-color: #f0fdf4; border-color: #bbf7d0;">
                      <div class="bic-header" style="color: #16a34a;">
                        <i class="fa-solid fa-file-invoice-dollar"></i>
                        <span>Cotización enviada</span>
                      </div>
                      <div class="bic-body">
                        <p style="font-size: 0.9rem; color: #166534; font-weight: 500;">
                          Se ha enviado una cotización al cliente.
                        </p>
                        <p style="font-size: 0.8rem; color: #15803d; margin-top: 4px;">
                          El cliente puede revisarla y aceptarla desde su panel.
                        </p>
                      </div>
                    </div>
                  </template>

                  <template v-else-if="msg.contenido.includes('https://www.google.com/maps')">
                    <p>{{ msg.contenido.split('https://')[0] }}</p>
                    <a :href="'https://' + msg.contenido.split('https://')[1]" target="_blank" class="location-link">
                      <i class="fa-solid fa-map-location-dot"></i> Ver en Google Maps
                    </a>
                    <p v-if="msg.metadata?.caption" class="media-caption">{{ msg.metadata.caption }}</p>
                  </template>

                  <p v-else>{{ msg.contenido }}</p>
                  <div class="bubble-meta">
                    <span class="bubble-time">{{ formatTime(msg.created_at) }}</span>
                    <span v-if="msg.remitente_id === myId" class="read-tick" :class="{ read: msg.leido }">
                      <i class="fa-solid fa-check-double"></i>
                    </span>
                    <button v-if="!msg.tipo || msg.tipo === 'texto' || !['imagen','archivo','cotizacion','bank_info','ubicacion'].includes(msg.tipo)" 
                            class="msg-copy-btn" 
                            @click="copyToClipboardText(msg.contenido)" 
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

        <!-- INPUT -->
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
                  <span>Documentos</span>
                </button>

                <div class="menu-divider"></div>



                <button v-if="activeConv.metodo_pago === 'TRANSFERENCIA'" @click="enviarDatosBancarios" class="menu-special">
                  <div class="menu-icon bank-icon text-blue-600"><i class="fa-solid fa-building-columns"></i></div>
                  <span>Información Bancaria</span>
                </button>

                <button @click="compartirUbicacion" class="menu-special">
                  <div class="menu-icon loc-icon text-orange-600"><i class="fa-solid fa-location-dot"></i></div>
                  <span>Compartir Ubicación</span>
                </button>
              </div>
            </Transition>
          </div>

          <input type="file" ref="fileInput" style="display:none" @change="onFileChange" />

          <textarea
            v-model="newMessage"
            @keydown="handleKeydown"
            placeholder="Responde al cliente... (Enter para enviar)"
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
  width: 300px;
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
  border-bottom: 1px solid rgba(255,255,255,0.07);
}
.sidebar-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: #1E293B;
  letter-spacing: -0.3px;
}
.conv-count {
  background: linear-gradient(135deg, #F76B1C, #c95210);
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 9px;
  border-radius: 20px;
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
.search-input:focus { border-color: #F76B1C; background: #FFF7ED; }

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
.empty-chat-icon { font-size: 2.8rem; color: #2d1a0e; }
.sidebar-empty p { margin: 0; font-weight: 600; color: #6B7280; font-size: 0.9rem; }
.sidebar-empty small { font-size: 0.8rem; color: #374151; }

.conv-list { flex: 1; overflow-y: auto; }
.conv-list::-webkit-scrollbar { width: 4px; }
.conv-list::-webkit-scrollbar-track { background: transparent; }
.conv-list::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 4px; }

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
  background: #FFF7ED;
  border-left: 3px solid #F76B1C;
}

.conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #3d1a06, #7c2d12);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255,255,255,0.08);
}
.conv-avatar img { width: 100%; height: 100%; object-fit: cover; }
.conv-avatar.initials-av span { font-size: 1rem; font-weight: 800; color: #FDBA74; }

.conv-meta { flex: 1; min-width: 0; }
.conv-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.conv-name { font-size: 0.88rem; font-weight: 700; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 138px; }
.conv-time { font-size: 0.7rem; color: #94A3B8; flex-shrink: 0; }
.conv-bottom { display: flex; justify-content: space-between; align-items: center; }
.conv-last-msg { font-size: 0.78rem; color: #64748B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 158px; }
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
@keyframes pulse-badge { 0%,100% { box-shadow: 0 0 0 0 rgba(247,107,28,0.4); } 50% { box-shadow: 0 0 0 5px rgba(247,107,28,0); } }

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
  color: #FDBA74;
  width: 90px;
  height: 90px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 24px rgba(247,107,28,0.15);
  border: 2px solid #FED7AA;
}
.no-chat-selected h3 { margin: 0; font-size: 1.25rem; color: #7c2d12; font-weight: 800; }
.no-chat-selected p { margin: 0; color: #92400E; font-size: 0.9rem; max-width: 290px; line-height: 1.6; }
.nchat-tip {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: white;
  border: 1px solid #FED7AA;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 0.84rem;
  color: #92400E;
  max-width: 320px;
  box-shadow: 0 2px 8px rgba(247,107,28,0.1);
}

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
  background: linear-gradient(135deg, #FED7AA, #FDBA74);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #FFF7ED;
}
.header-avatar img { width: 100%; height: 100%; object-fit: cover; }
.header-avatar.initials-av span { font-size: 1rem; font-weight: 800; color: #7c2d12; }
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
  animation: bubble-in 0.2s ease-out;
}
@keyframes bubble-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

.bubble p { margin: 0 0 6px; font-size: 0.88rem; line-height: 1.6; word-break: break-word; }
.bubble-mine {
  background: linear-gradient(135deg, #c95210, #F76B1C);
  color: white;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 12px rgba(247,107,28,0.3);
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
.read-tick.read { opacity: 1; color: #FED7AA; }

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
  border-color: #F76B1C;
  box-shadow: 0 0 0 3px rgba(247,107,28,0.1);
  background: white;
}
.msg-input::placeholder { color: #94A3B8; }
.btn-send {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #c95210, #F76B1C);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(247,107,28,0.4);
}
.btn-send:hover:not(:disabled) { transform: scale(1.08); box-shadow: 0 6px 18px rgba(247,107,28,0.5); }
.btn-send:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }
.btn-send svg { width: 18px; height: 18px; color: white; }

.spin { width: 28px; height: 28px; border: 3px solid #E2E8F0; border-top-color: #F76B1C; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 640px) {
  .chat-sidebar { width: 100%; display: none; }
  .chat-sidebar.visible { display: flex; position: absolute; z-index: 10; left: 0; top: 0; width: 100%; height: 100%; }
}


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
.msg-mine .location-link { color: #c95210; }
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
  position: absolute; bottom: 65px; left: 0; background: white;
  border-radius: 16px; padding: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; gap: 4px; min-width: 190px;
  border: 1px solid #E2E8F0; z-index: 100;
}
.attachment-menu button {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  border: none; background: none; width: 100%; cursor: pointer;
  border-radius: 10px; transition: all 0.2s;
}
.attachment-menu button:hover { background: #F8FAFC; }
.attachment-menu span { font-size: 0.85rem; font-weight: 600; color: #475569; }

.menu-divider { height: 1px; background: #F1F5F9; margin: 4px 6px; }
.menu-icon { 
  width: 34px; height: 34px; border-radius: 10px; 
  display: flex; align-items: center; justify-content: center; font-size: 1rem; 
  flex-shrink: 0;
}
.img-icon   { background: #E0F2FE; color: #0284C7; }
.file-icon  { background: #F1F5F9; color: #64748B; }
.bank-icon  { background: #EFF6FF; color: #2563EB; }
.quote-icon { background: #ECFDF5; color: #059669; }
.loc-icon   { background: #FFF7ED; color: #EA580C; }

.menu-pop-enter-active, .menu-pop-leave-active { transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.menu-pop-enter-from, .menu-pop-leave-to { opacity: 0; transform: scale(0.8) translateY(10px); transform-origin: bottom left; }

.msg-image { max-width: 100%; border-radius: 10px; cursor: pointer; margin-bottom: 5px; border: 1px solid rgba(0,0,0,0.05); }
.msg-file {
  display: flex; align-items: center; gap: 10px; padding: 12px;
  background: rgba(255,255,255,0.15); border-radius: 10px;
  text-decoration: none; color: inherit; font-weight: 700; font-size: 0.85rem;
  border: 1px solid rgba(255,255,255,0.1); margin-bottom: 5px;
}
.bubble-theirs .msg-file { background: #F1F5F9; color: #1E293B; }

/* === BANK INFO CARD === */
.bank-info-card {
  width: 240px;
  background: white;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #E2E8F0;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}
.msg-mine .bank-info-card {
  border-color: #FED7AA;
}
.bic-header {
  background: #F8FAFC;
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #E2E8F0;
  color: #1E293B;
  font-weight: 700;
  font-size: 0.8rem;
}
.msg-mine .bic-header {
  background: #FFF7ED;
  color: #c95210;
  border-bottom-color: #FFEDD5;
}
.bic-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bic-field label {
  display: block;
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #94A3B8;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}
.bic-field p {
  margin: 0;
  font-size: 0.85rem;
  color: #1E293B;
  font-weight: 600;
}
.bic-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #F1F5F9;
  padding: 6px 10px;
  border-radius: 8px;
}
.acc-num {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 700;
  font-size: 0.9rem;
  color: #1E293B;
}
.copy-btn {
  background: white;
  border: 1px solid #E2E8F0;
  color: #64748B;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}
.copy-btn:hover {
  background: #1E293B;
  color: white;
  border-color: #1E293B;
}

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

.attachment-preview-overlay {
  position: fixed; inset: 0; z-index: 999999;
  background: rgba(15, 23, 42, 0.62);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; backdrop-filter: blur(5px);
}
.attachment-preview-card {
  width: min(520px, 100%);
  max-height: 92vh;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
}
.attachment-preview-header, .attachment-preview-actions {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px; border-bottom: 1px solid #E2E8F0;
}
.attachment-preview-header h3 { margin: 0; font-size: 1rem; color: #0F172A; }
.attachment-preview-header button {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: #F1F5F9; color: #475569; cursor: pointer;
}
.attachment-preview-body { padding: 18px; display: grid; gap: 14px; }
.attachment-preview-image {
  width: 100%; max-height: 58vh; object-fit: contain;
  background: #0F172A; border-radius: 12px;
}
.attachment-preview-file {
  display: grid; gap: 8px; justify-items: center;
  padding: 34px 18px; border: 1.5px dashed #CBD5E1; border-radius: 12px;
  color: #334155; text-align: center;
}
.attachment-preview-file i { font-size: 2.4rem; color: #F76B1C; }
.attachment-preview-file span { color: #64748B; font-weight: 700; }
.attachment-caption {
  width: 100%; border: 1.5px solid #E2E8F0; border-radius: 12px;
  padding: 12px; resize: vertical; font: inherit; outline: none;
}
.attachment-caption:focus { border-color: #F76B1C; box-shadow: 0 0 0 3px rgba(247,107,28,0.12); }
.attachment-preview-actions { border-top: 1px solid #E2E8F0; border-bottom: none; gap: 10px; }
.preview-cancel, .preview-send {
  flex: 1; border-radius: 10px; padding: 12px; font-weight: 800; cursor: pointer; border: none;
}
.preview-cancel { background: white; color: #64748B; border: 1.5px solid #E2E8F0; }
.preview-send { background: #F76B1C; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; }
.preview-send:disabled { opacity: 0.65; cursor: not-allowed; }

.location-card {
  display: flex; gap: 12px; align-items: center;
  min-width: 220px; padding: 12px; border-radius: 12px;
  background: rgba(255,255,255,0.16); border: 1px solid rgba(255,255,255,0.16);
}
.bubble-theirs .location-card { background: #FFF7ED; border-color: #FED7AA; }
.location-card i { font-size: 1.35rem; }
.location-card div { display: flex; flex-direction: column; gap: 3px; }
.location-card a { color: inherit; font-size: 0.8rem; font-weight: 800; }
.media-caption { margin-top: 6px !important; }

.quote-modal-overlay {
  position: fixed; inset: 0; z-index: 99999;
  display: flex; align-items: center; justify-content: center;
  background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);
  padding: 20px;
}
.quote-modal-card {
  width: 100%; max-width: 440px; background: white; border-radius: 16px;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25); overflow: hidden;
}
.quote-modal-header, .quote-modal-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; border-bottom: 1px solid #E2E8F0;
}
.quote-modal-header h3 { margin: 0; font-size: 1.05rem; font-weight: 800; color: #0F172A; }
.quote-modal-header button { border: none; background: #F1F5F9; color: #64748B; width: 34px; height: 34px; border-radius: 50%; cursor: pointer; }
.quote-modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.quote-modal-body label { display: flex; flex-direction: column; gap: 7px; }
.quote-modal-body span { font-size: 0.78rem; font-weight: 800; color: #475569; text-transform: uppercase; }
.quote-modal-body input, .quote-modal-body textarea, .quote-modal-body select {
  border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 11px 12px;
  font: inherit; color: #0F172A; outline: none; resize: vertical;
}
.quote-modal-body input:focus, .quote-modal-body textarea:focus, .quote-modal-body select:focus { border-color: #F76B1C; box-shadow: 0 0 0 3px rgba(247, 107, 28, 0.12); }
.quote-modal-body small { color: #64748B; font-size: 0.78rem; font-weight: 600; }
.quote-modal-footer { border-top: 1px solid #E2E8F0; border-bottom: none; gap: 10px; }
.quote-cancel, .quote-submit { flex: 1; border-radius: 10px; padding: 12px; font-weight: 800; cursor: pointer; border: none; }
.quote-cancel { background: white; color: #64748B; border: 1.5px solid #E2E8F0; }
.quote-submit { background: #F76B1C; color: white; display: flex; align-items: center; justify-content: center; gap: 8px; }
.quote-submit:disabled { opacity: 0.65; cursor: not-allowed; }
.quote-card {
  width: 260px; background: white; color: #0F172A; border-radius: 14px;
  border: 1px solid #BBF7D0; overflow: hidden; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}
.quote-card-header {
  display: flex; align-items: center; gap: 8px; padding: 10px 12px;
  background: #ECFDF5; color: #047857; font-size: 0.8rem; font-weight: 800;
}
.quote-card h4 { margin: 12px 12px 6px; font-size: 0.95rem; font-weight: 800; }
.quote-card p { margin: 0 12px 10px; color: #475569; font-size: 0.82rem; }
.quote-total { margin: 0 12px 8px; font-size: 1.45rem; font-weight: 900; color: #047857; }
.quote-card small { display: block; margin: 0 12px 12px; color: #64748B; font-weight: 700; }
.quote-edit-btn {
  width: calc(100% - 24px); margin: 0 12px 12px; padding: 9px 10px;
  border: 1.5px solid #BBF7D0; border-radius: 9px; background: #F0FDF4; color: #047857;
  font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}

/* Mensajes de Archivo */
.msg-file {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.9);
  padding: 10px 14px;
  border-radius: 12px;
  text-decoration: none;
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  min-width: 200px;
  margin-bottom: 4px;
}
.msg-file:hover {
  background: #FFFFFF;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.file-icon-wrap {
  width: 36px;
  height: 36px;
  background: #F1F5F9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
  font-size: 1.1rem;
}
.file-info-wrap {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  text-align: left;
}
.file-name-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1E293B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.file-action-text {
  font-size: 0.7rem;
  color: #94A3B8;
}
.bubble-mine .msg-file { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.2); color: white; }
.bubble-mine .file-icon-wrap { background: rgba(255,255,255,0.2); color: white; }
.bubble-mine .file-name-text { color: white; }
.bubble-mine .file-action-text { color: rgba(255,255,255,0.7); }
</style>
