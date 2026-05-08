<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js';
import { normalizeMediaUrl } from '../utils/media.js';

const router = useRouter();
const { state } = useUserSession();

const jobRequests = ref([]);
const professionalJobs = ref([]);
const profileStatus = ref(null); // null = cargando, false = sin perfil, true = tiene perfil
const isLoading = ref(true);
const userAvatar = ref('');
const userDisplayName = ref('');
const hasPaymentMethod = ref(true);
const showPaymentBlock = ref(false);

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

// --- MODAL DETALLE ---
const selectedRequest = ref(null);
const showDetailModal = ref(false);
const showPastJobs = ref(false);

// --- COTIZACION MODAL ---
const showQuoteModal = ref(false);
const isSendingQuote = ref(false);
const quoteTargetJob = ref(null);
const quoteForm = ref({ titulo: '', descripcion: '', monto_total: '', metodo_pago: 'EFECTIVO' });
// Map of trabajo_id -> cotizacion object
const jobCotizaciones = ref({});

// --- TRANSFERENCIA MODAL ---
const showTransferModal = ref(false);
const isConfirmingTransfer = ref(false);
const transferTargetJob = ref(null);

const openTransferModal = (job) => {
  transferTargetJob.value = {
    ...job,
    comprobante_url: normalizeMediaUrl(job?.comprobante_url || '', API_URLS.TRABAJOS)
  };
  showTransferModal.value = true;
};

const getCotizacionForJob = (jobId) => jobCotizaciones.value[String(jobId)] || null;

const loadCotizacionesForJobs = async (jobs) => {
  const activeJobs = jobs.filter(j => j.estado === 'EN_PROGRESO');
  for (const job of activeJobs) {
    try {
      const { data } = await axios.get(`${API_URLS.TRABAJOS}/api/cotizaciones/trabajo/${job.id}`);
      if (data) jobCotizaciones.value[String(job.id)] = data;
    } catch(e) { /* no cotizacion yet */ }
  }
};

const openQuoteModal = (job) => {
  quoteTargetJob.value = job;
  const existing = getCotizacionForJob(job.id);
  quoteForm.value = {
    titulo: existing?.titulo || job.titulo || 'Cotización de servicio',
    descripcion: existing?.descripcion || '',
    monto_total: existing?.monto_total || '',
    metodo_pago: existing?.metodo_pago || job.metodo_pago || 'EFECTIVO'
  };
  showQuoteModal.value = true;
};

const enviarCotizacion = async () => {
  const monto = Number(quoteForm.value.monto_total);
  if (!Number.isFinite(monto) || monto <= 0) {
    showToast('Ingresa un monto válido.', 'error');
    return;
  }
  if (!quoteTargetJob.value) return;

  isSendingQuote.value = true;
  try {
    const userId = state.user?.id || localStorage.getItem('usuario_id');
    const job = quoteTargetJob.value;
    const existing = getCotizacionForJob(job.id);

    let savedCot;
    if (existing) {
      // EDIT existing
      const { data } = await axios.put(`${API_URLS.TRABAJOS}/api/cotizaciones/${existing.id}`, {
        profesional_id: userId,
        solicitud_id: existing.solicitud_id || null,
        titulo: quoteForm.value.titulo || 'Cotización de servicio',
        descripcion: quoteForm.value.descripcion,
        monto_total: monto,
        metodo_pago: quoteForm.value.metodo_pago
      });
      savedCot = data.cotizacion;
      showToast('¡Cotización actualizada! El cliente podrá ver el nuevo precio.', 'success');
    } else {
      // CREATE new
      const { data } = await axios.post(`${API_URLS.TRABAJOS}/api/cotizaciones`, {
        trabajo_id: job.id,
        solicitud_id: job.solicitud_id || null,
        cliente_id: job.cliente_id,
        profesional_id: userId,
        titulo: quoteForm.value.titulo || 'Cotización de servicio',
        descripcion: quoteForm.value.descripcion,
        monto_total: monto,
        metodo_pago: quoteForm.value.metodo_pago
      });
      savedCot = data.cotizacion;
      showToast('¡Cotización enviada! El cliente la verá en su panel.', 'success');
    }

    // Update local state
    if (savedCot) jobCotizaciones.value[String(job.id)] = savedCot;
    showQuoteModal.value = false;
  } catch (error) {
    showToast(error.response?.data?.error || 'No se pudo enviar la cotización.', 'error');
  } finally {
    isSendingQuote.value = false;
  }
};

const formatMoney = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'A coordinar';
};

const openDetail = (req) => {
  selectedRequest.value = {
    ...req,
    cliente_nombre: req.cliente_nombre || 'Cliente',
    categoria: req.categoria || 'Servicio'
  };
  showDetailModal.value = true;
};

const openJobDetail = (job) => {
  // Para profesional, usamos la misma lógica que openDetail pero adaptada si es necesario
  selectedRequest.value = {
    ...job,
    cliente_nombre: job.cliente_nombre || 'Cliente',
    categoria: job.categoria || 'Servicio',
    titulo: job.titulo,
    descripcion: job.descripcion,
    horario: job.horario,
    presupuesto: job.presupuesto,
    isWorkDetail: true // Flag to distinguish in modal
  };
  showDetailModal.value = true;
};

const closeDetail = () => {
  selectedRequest.value = null;
  showDetailModal.value = false;
};

const goToSetup = () => router.push('/professional/setup');
const goToProfile = () => router.push('/professional/profile');
const goToPost = () => router.push('/create-first-post');
const goToPayments = () => router.push('/professional/settings?tab=payments');

const contactClient = async (clienteId) => {
  try {
    const userId = state.user?.id || localStorage.getItem('usuario_id');
    await axios.post(`${API_URLS.PERFILES}/api/chat/conversacion`, {
      cliente_id: clienteId,
      profesional_usuario_id: userId
    });
    router.push('/professional/chat');
  } catch(e) {
    console.error("Error al contactar:", e);
  }
};

const acceptJobRequest = async (req) => {
  if (!hasPaymentMethod.value) {
    showPaymentBlock.value = true;
    return;
  }

  const confirmed = await askConfirm(`¿Deseas aceptar la solicitud de ${req.cliente_nombre}? El cliente deberá confirmar para iniciar el trabajo.`);
  if (!confirmed) return;

  try {
    const userId = state.user?.id || localStorage.getItem('usuario_id');
    
    // Postulamos al profesional. Esto cambia el estado a 'POR_CONFIRMAR'
    const res = await axios.put(`${API_URLS.PERFILES}/api/solicitudes/${req.id}/postular`, {
      profesional_id: userId
    });
    
    if (res.data) {
      showToast('¡Interés enviado! Esperando confirmación del cliente.', 'success');
      
      // Refrescamos la lista local eliminando la que ya aceptamos
      jobRequests.value = jobRequests.value.filter(r => r.id !== req.id);

      // Crear chat automático con mensaje de postulación
      try {
        await axios.post(`${API_URLS.PERFILES}/api/chat/conversacion`, {
          cliente_id: req.cliente_id,
          profesional_usuario_id: userId,
          solicitud_titulo: req.titulo,
          solicitud_descripcion: `He aceptado tu solicitud: "${req.titulo}". Estoy listo para comenzar en cuanto confirmes.`
        });
      } catch (err) { console.error("Error al iniciar chat:", err); }

      closeDetail();
    }
  } catch(e) {
    console.error(e);
    showToast(e.response?.data?.error || 'Error al intentar aceptar la solicitud.', 'error');
  }
};

onMounted(async () => {
  const userId = state.user?.id || localStorage.getItem('usuario_id');
  if (!userId) { router.push('/login'); return; }

  // Cargar foto y nombre para mostrar en el dashboard
  userDisplayName.value = state.user?.name || localStorage.getItem('usuario_nombre') || 'Profesional';
  userAvatar.value = normalizeMediaUrl(state.user?.avatar || localStorage.getItem('usuario_avatar') || '');

  try {
    const { data } = await axios.get(`${API_URLS.PERFILES}/api/profesionales/${userId}`);
    profileStatus.value = !!data;
    // Si el perfil tiene avatar, actualizarlo
    const avatar = normalizeMediaUrl(data?.avatar_url || '');
    userAvatar.value = avatar;
    avatar ? localStorage.setItem('usuario_avatar', avatar) : localStorage.removeItem('usuario_avatar');
    if (data?.nombre) userDisplayName.value = data.nombre;

    try {
      const solRes = await axios.get(`${API_URLS.PERFILES}/api/solicitudes?profesional_id=${userId}`);
      jobRequests.value = solRes.data.map(s => ({
        ...s,
        cliente_avatar: normalizeMediaUrl(s.cliente_avatar || ''),
        cliente_nombre: s.cliente_nombre || 'Cliente',
        categoria: s.categoria || 'Servicio'
      }));
    } catch(e) { console.error("Error cargando solicitudes", e); }

    // Check financial status
    try {
      const finRes = await axios.get(`${API_URLS.PERFILES}/api/profesionales/${userId}/financiero`);
      if (!finRes.data.stripe_card_token) {
         hasPaymentMethod.value = false;
      }
    } catch(e) { 
       hasPaymentMethod.value = false;
    }

    try {
      const trabRes = await axios.get(`${API_URLS.TRABAJOS}/api/trabajos/profesional/${userId}`);
      professionalJobs.value = trabRes.data.map(j => ({
        ...j,
        cliente_avatar: normalizeMediaUrl(j.cliente_avatar || ''),
        cliente_nombre: j.cliente_nombre || 'Cliente',
        categoria: j.categoria || 'Servicio'
      }));
      // Load cotizaciones for active jobs
      await loadCotizacionesForJobs(professionalJobs.value);
    } catch(e) { console.error("Error cargando trabajos", e); }
    
  } catch {
    profileStatus.value = false;
  } finally {
    isLoading.value = false;
  }
});

const finalizarTrabajo = async (trabajoId) => {
    const cotizacion = getCotizacionForJob(trabajoId);
    if (!cotizacion) {
        showToast('Debes enviar una cotización al cliente antes de marcar el trabajo como terminado.', 'error');
        return;
    }
    if (cotizacion.estado === 'PENDIENTE') {
        showToast('El cliente aún no ha aceptado la cotización. Debe aceptarla antes de finalizar el trabajo.', 'info');
        return;
    }
    
    const confirmed = await askConfirm('¿Confirmas que el trabajo fue completado? El cliente deberá validarlo para liberar el pago.');
    if (!confirmed) return;
    try {
        const userId = state.user?.id || localStorage.getItem('usuario_id');
        const res = await axios.put(`${API_URLS.TRABAJOS}/api/trabajos/${trabajoId}/terminar`, {
            profesional_id: userId
        });
        if (res.data.success) {
            showToast('¡Trabajo marcado como terminado! El cliente debe confirmar para liberar el pago.', 'success');
            const job = professionalJobs.value.find(j => j.id === trabajoId);
            if (job) job.estado = 'FINALIZADO_PROFESIONAL';
        }
    } catch(e) {
        showToast('Error al finalizar el trabajo. Intenta de nuevo.', 'error');
        console.error(e);
    }
};

const confirmarTransferencia = async () => {
  if (!transferTargetJob.value) return;
  
  isConfirmingTransfer.value = true;
  try {
    const userId = state.user?.id || localStorage.getItem('usuario_id');
    const { data } = await axios.post(`${API_URLS.TRABAJOS}/api/trabajos/${transferTargetJob.value.id}/confirmar-transferencia`, {
      profesional_id: userId
    });
    
    if (data.success) {
      showToast('¡Pago confirmado con éxito! El trabajo ha sido finalizado.', 'success');
      showTransferModal.value = false;
      // Refrescamos la lista
      const trabRes = await axios.get(`${API_URLS.TRABAJOS}/api/trabajos/profesional/${userId}`);
      professionalJobs.value = trabRes.data;
    }
  } catch (error) {
    showToast(error.response?.data?.error || 'Error al confirmar la transferencia.', 'error');
  } finally {
    isConfirmingTransfer.value = false;
  }
};
</script>

<template>
  <div class="dashboard-view">

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
            <button class="confirm-yes" @click="handleConfirm(true)">Sí, confirmar</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL DE BLOQUEO POR FALTA DE MÉTODO DE PAGO -->
    <Teleport to="body">
      <div v-if="showPaymentBlock" class="confirm-overlay" @click.self="showPaymentBlock = false">
        <div class="payment-block-card animate-pop">
          <div class="pb-header-gradient"></div>
          <button @click="showPaymentBlock = false" class="pb-close-btn">
            <i class="fa-solid fa-xmark"></i>
          </button>
          
          <div class="pb-content">
            <div class="pb-icon-circle">
              <i class="fa-solid fa-credit-card"></i>
            </div>
            
            <h3 class="pb-title">Método de Cobro Requerido</h3>
            <p class="pb-desc">
              Para poder recibir solicitudes y aceptar trabajos, necesitas ingresar una tarjeta para que el sistema pueda cobrar automáticamente la comisión (10%) por el uso de la plataforma.
            </p>
            
            <div class="pb-actions">
              <button class="pb-btn-primary" @click="goToPayments">
                <i class="fa-solid fa-gear"></i>
                Configurar Método de Pago
              </button>
              <button class="pb-btn-secondary" @click="showPaymentBlock = false">
                Hacerlo más tarde
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== MODAL: CREAR COTIZACION ===== -->
    <Teleport to="body">
      <div v-if="showQuoteModal" class="confirm-overlay" @click.self="showQuoteModal = false">
        <div class="confirm-card" style="max-width: 520px; text-align: left; padding: 0; overflow: hidden;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0B4C6F, #1D6FA8); padding: 22px 26px; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 900;">
                  {{ quoteTargetJob && getCotizacionForJob(quoteTargetJob.id) ? 'Editar Cotización' : 'Enviar Cotización' }}
                </h3>
                <p style="margin: 4px 0 0; font-size: 0.78rem; opacity: 0.85;">Para: <strong>{{ quoteTargetJob?.cliente_nombre || 'Cliente' }}</strong> • {{ quoteTargetJob?.titulo || 'Trabajo' }}</p>
              </div>
              <button @click="showQuoteModal = false" style="background: rgba(255,255,255,0.15); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1.1rem;">×</button>
            </div>
          </div>

          <!-- Body -->
          <div style="padding: 24px 26px; display: flex; flex-direction: column; gap: 16px;">
            <!-- Título -->
            <div class="qm-field">
              <label class="qm-label"><i class="fa-solid fa-heading"></i> Título de la cotización</label>
              <input v-model="quoteForm.titulo" type="text" placeholder="Ej. Instalación eléctrica completa" class="qm-input" />
            </div>

            <!-- Monto -->
            <div class="qm-field">
              <label class="qm-label"><i class="fa-solid fa-money-bill-wave"></i> Monto total (RD$)</label>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.1rem; font-weight: 900; color: #0F172A;">RD$</span>
                <input v-model="quoteForm.monto_total" type="number" min="1" step="0.01" placeholder="0.00" class="qm-input" style="flex: 1; font-size: 1.5rem; font-weight: 800; text-align: center;" />
              </div>
            </div>

            <!-- Método de pago -->
            <div class="qm-field">
              <label class="qm-label"><i class="fa-solid fa-wallet"></i> Método de cobro</label>
              <select v-model="quoteForm.metodo_pago" class="qm-input">
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
              </select>
            </div>

            <!-- Descripción -->
            <div class="qm-field">
              <label class="qm-label"><i class="fa-solid fa-align-left"></i> Detalle (opcional)</label>
              <textarea v-model="quoteForm.descripcion" rows="3" placeholder="Describe qué incluye esta cotización..." class="qm-input" style="resize: vertical; min-height: 80px;"></textarea>
            </div>

            <!-- Comisión info -->
            <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 10px; padding: 12px 14px; font-size: 0.82rem; color: #92400E;">
              <i class="fa-solid fa-circle-info"></i>
              La plataforma cobra una <strong>comisión del 10%</strong> al finalizarse el trabajo.
              Si el monto es RD$ {{ Number(quoteForm.monto_total) > 0 ? Number(quoteForm.monto_total).toLocaleString('es-DO') : '0' }},
              la comisión será aproximadamente <strong>RD$ {{ (Number(quoteForm.monto_total) * 0.1).toLocaleString('es-DO', { minimumFractionDigits: 2 }) }}</strong>.
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 16px 26px 24px; display: flex; gap: 12px; border-top: 1px solid #F1F5F9;">
            <button @click="showQuoteModal = false" style="flex: 1; padding: 12px; border: 1.5px solid #E2E8F0; border-radius: 10px; background: white; color: #64748B; font-weight: 700; cursor: pointer; font-size: 0.95rem;">Cancelar</button>
            <button @click="enviarCotizacion" :disabled="isSendingQuote" style="flex: 2; padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, #10B981, #059669); color: white; font-weight: 800; cursor: pointer; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <i v-if="isSendingQuote" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-paper-plane"></i>
              {{ isSendingQuote ? 'Enviando...' : 'Enviar Cotización al Cliente' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- CARGANDO -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando tu panel...</p>
    </div>

    <template v-else>

      <!-- ===== TARJETA DE BIENVENIDA CON FOTO ===== -->
      <div class="welcome-card">
        <div class="welcome-avatar">
          <img v-if="userAvatar" :src="userAvatar" class="welcome-avatar-img" alt="foto" />
          <div v-else class="welcome-avatar-initials">
            {{ userDisplayName?.charAt(0).toUpperCase() || 'P' }}
          </div>
        </div>
        <div class="welcome-text">
          <p class="welcome-greeting">Bienvenido de vuelta</p>
          <h2 class="welcome-name">{{ userDisplayName }}</h2>
        </div>
        <button class="welcome-btn-profile" @click="goToProfile">
          Ver mi perfil
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
        </button>
      </div>

      <!-- ===== SIN PERFIL: CTA SETUP ===== -->
      <div v-if="!profileStatus" class="no-profile-card">
        <div class="npc-icon"><i class="fa-solid fa-rocket"></i></div>
        <h2>¡Completa tu perfil profesional!</h2>
        <p>Para que los clientes puedan encontrarte y contratarte, necesitas configurar tu perfil con tu información, habilidades y horario.</p>
        <div class="npc-steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">Agrega tu foto y datos profesionales</div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">Define tu horario de atención</div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">¡Aparece en el directorio de clientes!</div>
          </div>
        </div>
        <button class="btn-setup-now" @click="goToSetup">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="btn-icon"><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>
          Crear mi Perfil Ahora
        </button>
      </div>

      <!-- ===== CON PERFIL ===== -->
      <template v-else>

        <!-- ACCIONES RÁPIDAS -->
        <div class="quick-actions-grid">
          <button class="qa-card" @click="goToSetup">
            <div class="qa-icon"><i class="fa-solid fa-pencil"></i></div>
            <div class="qa-text">
              <strong>Editar Perfil</strong>
              <span>Actualiza tus datos, habilidades y horario</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="qa-arrow"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
          </button>

          <button class="qa-card" @click="goToPost">
            <div class="qa-icon"><i class="fa-solid fa-camera"></i></div>
            <div class="qa-text">
              <strong>Publicar Trabajo</strong>
              <span>Muestra un trabajo en tu portafolio</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="qa-arrow"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
          </button>

          <button class="qa-card" @click="goToProfile">
            <div class="qa-icon"><i class="fa-regular fa-eye"></i></div>
            <div class="qa-text">
              <strong>Ver mi Perfil</strong>
              <span>Así es como te ven los clientes</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="qa-arrow"><path fill-rule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" /></svg>
          </button>
        </div>

        <!-- BANNER INFORMATIVO -->
        <div class="info-banner">
          <div class="info-banner-icon"><i class="fa-solid fa-circle-check"></i></div>
          <div class="info-banner-text">
            <strong>Tu perfil está activo y visible</strong>
            <p>Los clientes de ServiHub pueden encontrarte en la página de explorar. Mantén tu información actualizada para recibir más contactos.</p>
          </div>
        </div>

        <!-- PAGOS PENDIENTES DE CONFIRMACIÓN (TRANSFERENCIA) -->
        <div class="section-card" style="margin-bottom: 24px; border-color: #F59E0B; background: #FFFBEB;" v-if="professionalJobs.filter(j => j.estado === 'ESPERANDO_CONFIRMACION_TRANSFERENCIA').length > 0">
          <div class="sc-header" style="border-bottom-color: #FEF3C7;">
            <h3 style="color: #92400E;"><i class="fa-solid fa-triangle-exclamation"></i> Pagos por Confirmar</h3>
            <p style="color: #B45309;">El cliente ha subido un comprobante de transferencia. Verifica tu cuenta y confirma el pago.</p>
          </div>

          <div class="jobs-list">
            <div v-for="job in professionalJobs.filter(j => j.estado === 'ESPERANDO_CONFIRMACION_TRANSFERENCIA')" :key="job.id" class="job-card" style="border-left: 4px solid #F59E0B; background: white;">
              <div class="job-header">
                <div>
                  <h4 style="margin:0 0 4px; font-size:1.1rem; color:#1E293B;">{{ job.titulo }}</h4>
                  <div style="display: flex; gap: 15px; margin-bottom: 8px;">
                    <span style="font-size: 0.9rem; font-weight: 700; color: #0F172A;">
                      {{ formatMoney(job.monto_acordado) }}
                    </span>
                    <span style="font-size: 0.8rem; color: #64748B;"><i class="fa-solid fa-user"></i> {{ job.cliente_nombre }}</span>
                  </div>
                </div>
                <span class="job-category" style="background: #FEF3C7; color: #92400E;">PENDIENTE DE VERIFICACIÓN</span>
              </div>
              
              <div class="job-footer">
                <button class="job-action-btn" style="background: #F59E0B; color: white; border: none;" @click="openTransferModal(job)">
                  <i class="fa-solid fa-magnifying-glass-dollar"></i> Verificar Pago
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- MODAL DE CONFIRMACIÓN DE TRANSFERENCIA -->
        <Teleport to="body">
          <div v-if="showTransferModal" class="confirm-overlay" @click.self="showTransferModal = false">
            <div class="confirm-card" style="max-width: 500px; padding: 0; overflow: hidden;">
              <div class="modal-header">
                <h3>Verificar Transferencia</h3>
                <button @click="showTransferModal = false" class="btn-close">&times;</button>
              </div>
              
              <div class="modal-body" style="padding: 20px;">
                <div style="margin-bottom: 20px; padding: 15px; background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 0.85rem; color: #64748B;">Monto a recibir:</span>
                    <strong style="color: #0F172A;">{{ formatMoney(transferTargetJob?.monto_acordado) }}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="font-size: 0.85rem; color: #64748B;">Cliente:</span>
                    <strong style="color: #0F172A;">{{ transferTargetJob?.cliente_nombre }}</strong>
                  </div>
                </div>

                <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 10px;">Comprobante enviado por el cliente:</label>
                <div style="width: 100%; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0; background: #F1F5F9; margin-bottom: 20px;">
                  <img :src="transferTargetJob?.comprobante_url" style="width: 100%; display: block; max-height: 400px; object-fit: contain;" alt="Comprobante" />
                </div>

                <div style="background: #EFF6FF; border: 1px solid #DBEAFE; border-radius: 10px; padding: 12px; font-size: 0.82rem; color: #1E40AF; margin-bottom: 20px;">
                  <i class="fa-solid fa-circle-info"></i>
                  Al confirmar, el trabajo se marcará como pagado y se debitará la comisión de tu billetera. Asegúrate de que el dinero esté en tu cuenta.
                </div>
              </div>

              <div class="modal-footer" style="padding: 16px 20px 20px; background: #F8FAFC;">
                <button @click="showTransferModal = false" style="flex: 1; padding: 12px; border: 1.5px solid #E2E8F0; border-radius: 8px; background: white; color: #64748B; font-weight: 700; cursor: pointer;">Cancelar</button>
                <button @click="confirmarTransferencia" :disabled="isConfirmingTransfer" style="flex: 2; padding: 12px; border: none; border-radius: 8px; background: #F59E0B; color: white; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                  <i v-if="isConfirmingTransfer" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-check-double"></i>
                  {{ isConfirmingTransfer ? 'Confirmando...' : 'Confirmar Pago Recibido' }}
                </button>
              </div>
            </div>
          </div>
        </Teleport>

        <!-- TRABAJOS EN CURSO -->
        <div class="section-card" style="margin-bottom: 24px;" v-if="professionalJobs.filter(j => j.estado === 'EN_PROGRESO').length > 0">
          <div class="sc-header">
            <h3>Tus Trabajos Activos</h3>
            <p>Trabajos en progreso. MÁRCALOS COMO TERMINADOS cuando finalices.</p>
          </div>

          <div class="jobs-list">
            <div v-for="job in professionalJobs.filter(j => j.estado === 'EN_PROGRESO')" :key="job.id" class="job-card" style="border-left: 4px solid #1E293B;">
              <div class="job-header">
                <div>
                  <h4 style="margin:0 0 4px; font-size:1.1rem; color:#1E293B;">{{ job.titulo || 'Contratación Directa' }}</h4>
                  <p v-if="job.descripcion" style="margin: 0 0 8px; font-size: 0.9rem; color: #64748B;">{{ job.descripcion.slice(0, 100) }}{{ job.descripcion.length > 100 ? '...' : '' }}</p>
                  <div style="display: flex; gap: 15px; margin-bottom: 8px;">
                    <span v-if="job.presupuesto" style="font-size: 0.8rem; color: #475569;"><i class="fa-solid fa-money-bill-wave"></i> {{ job.presupuesto }}</span>
                    <span v-if="job.horario" style="font-size: 0.8rem; color: #475569;"><i class="fa-solid fa-clock"></i> {{ job.horario }}</span>
                  </div>
                  <span style="font-size: 0.85rem; font-weight:600; color:#F76B1C;" v-if="job.estado === 'EN_PROGRESO'">EN PROGRESO</span>
                  <span style="font-size: 0.85rem; font-weight:600; color:#22C55E;" v-else-if="job.estado === 'FINALIZADO_PROFESIONAL'">ESPERANDO CLIENTE</span>
                </div>
                <span class="job-category">{{ new Date(job.created_at || job.fecha_creacion).toLocaleDateString() }}</span>
              </div>
              
              <div class="job-footer">
                <button class="job-action-btn" style="background: white; color: #1E293B; border: 1px solid #CBD5E1; margin-right: 8px;" @click="openJobDetail(job)">
                  <i class="fa-solid fa-circle-info"></i> Más información
                </button>
                <!-- COTIZACIÓN: Enviar si no existe, Editar si ya existe -->
                <button v-if="job.estado === 'EN_PROGRESO'" class="job-action-btn" :style="getCotizacionForJob(job.id) ? 'background: #059669; color:white; border:none; margin-right: 8px;' : 'background: #0B4C6F; color:white; border:none; margin-right: 8px;'" @click="openQuoteModal(job)">
                  <i :class="getCotizacionForJob(job.id) ? 'fa-solid fa-pen' : 'fa-solid fa-file-invoice-dollar'"></i>
                  {{ getCotizacionForJob(job.id) ? 'Editar Cotización' : 'Enviar Cotización' }}
                </button>
                <!-- MARCAR TERMINADO: Solo visible si ya existe una cotización y ha sido ACEPTADA -->
                <button v-if="job.estado === 'EN_PROGRESO' && getCotizacionForJob(job.id) && getCotizacionForJob(job.id).estado === 'ACEPTADA'" class="btn-primary-action job-action-btn" style="background: #F76B1C; margin-top:0" @click="finalizarTrabajo(job.id)">
                  <i class="fa-solid fa-flag-checkered"></i> Marcar como terminado
                </button>
                <!-- Aviso si no hay cotización aún -->
                <span v-if="job.estado === 'EN_PROGRESO' && !getCotizacionForJob(job.id)" style="font-size: 0.75rem; color: #94A3B8; font-style: italic; align-self: center;">
                  Envía la cotización primero
                </span>
                <!-- Aviso si la cotización está pendiente de aceptación -->
                <span v-if="job.estado === 'EN_PROGRESO' && getCotizacionForJob(job.id) && getCotizacionForJob(job.id).estado === 'PENDIENTE'" style="font-size: 0.75rem; color: #94A3B8; font-style: italic; align-self: center;">
                  <i class="fa-solid fa-clock-rotate-left"></i> Esperando aceptación del cliente
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- TRABAJOS ANTERIORES (Profesional) -->
        <div class="past-jobs-section" v-if="professionalJobs.filter(j => j.estado === 'CONFIRMADO_CLIENTE' || j.estado === 'FINALIZADO_PROFESIONAL').length > 0">
          <button class="past-jobs-toggle" @click="showPastJobs = !showPastJobs" style="border: 1px solid #E2E8F0; border-radius: 10px; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: white; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 10px; font-weight: 700; color: #1E293B;">
              <i class="fa-solid fa-clock-rotate-left"></i>
              <span>Trabajos Pasados</span>
              <span style="background: #F1F5F9; color: #64748B; font-size: 0.75rem; padding: 2px 8px; border-radius: 20px;">{{ professionalJobs.filter(j => j.estado === 'CONFIRMADO_CLIENTE' || j.estado === 'FINALIZADO_PROFESIONAL').length }}</span>
            </div>
            <i :class="showPastJobs ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
          </button>
          
          <div v-if="showPastJobs" style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
            <div v-for="job in professionalJobs.filter(j => j.estado === 'CONFIRMADO_CLIENTE' || j.estado === 'FINALIZADO_PROFESIONAL')" :key="job.id" class="job-card" style="opacity: 0.8;">
              <div class="job-header">
                <div>
                  <h4 style="margin:0 0 4px; font-size:1rem; color:#1E293B;">{{ job.titulo || 'Contratación Directa' }}</h4>
                  <span style="font-size: 0.8rem; color:#22C55E; font-weight:700;" v-if="job.estado === 'CONFIRMADO_CLIENTE'">COMPLETADO</span>
                  <span style="font-size: 0.8rem; color:#F59E0B; font-weight:700;" v-else>ESPERANDO CLIENTE</span>
                </div>
                <span class="job-category">{{ new Date(job.created_at || job.fecha_creacion).toLocaleDateString() }}</span>
              </div>
              <div class="job-footer">
                <button class="job-action-btn" style="background: #F0F9FF; color: #0B4C6F; border: 1.5px solid #0B4C6F;" @click="router.push(`/professional/receipt/${job.solicitud_id || job.id}`)">
                  <i class="fa-solid fa-file-invoice"></i> Ver Recibo
                </button>
                <button class="job-action-btn" style="background: white; color: #1E293B; border: 1px solid #CBD5E1;" @click="openJobDetail(job)">
                  <i class="fa-solid fa-circle-info"></i> Detalles
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- SOLICITUDES DE TRABAJO -->
        <div class="section-card">
          <div class="sc-header">
            <h3>Oportunidades de Trabajo</h3>
            <p>Solicitudes de clientes que necesitan tus servicios</p>
          </div>

          <div v-if="jobRequests.length === 0" class="empty-jobs">
            <div class="empty-jobs-icon">
              <i class="fa-solid fa-briefcase"></i>
            </div>
            <div class="empty-jobs-text">
              <h4>No hay solicitudes activas</h4>
              <p>Las solicitudes de clientes que necesitan tus servicios aparecerán aquí.</p>
            </div>
          </div>

          <div v-else class="jobs-list">
            <div v-for="req in jobRequests" :key="req.id" class="job-card">
              <div class="job-header">
                <div class="client-info">
                  <img v-if="req.cliente_avatar" :src="req.cliente_avatar" class="client-avatar" alt="Avatar"/>
                  <div v-else class="client-avatar-initial">{{ req.cliente_nombre ? req.cliente_nombre.charAt(0) : 'C' }}</div>
                  <div class="client-details">
                    <h4>{{ req.cliente_nombre || 'Cliente' }}</h4>
                    <span>{{ new Date(req.created_at || req.fecha_creacion).toLocaleDateString() }}</span>
                  </div>
                </div>
                <span class="job-category">{{ req.categoria }}</span>
              </div>
              <h3 class="job-title">{{ req.titulo }}</h3>
              <p class="job-desc">{{ req.descripcion }}</p>

              <div v-if="req.imagen_url" class="job-image">
                <img :src="req.imagen_url" alt="Referencia" />
              </div>

              <div class="job-footer">
                <button class="job-action-btn" style="background: white; color: #1E293B; border: 1px solid #CBD5E1; margin-right: 8px; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s;" @click="openDetail(req)">
                  <i class="fa-solid fa-circle-info"></i> Más información
                </button>
                
                <template v-if="req.estado === 'POR_CONFIRMAR' || req.estado === 'por_confirmar'">
                  <div class="waiting-badge">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                    Esperando confirmación del cliente
                  </div>
                </template>
                <template v-else>
                  <button class="btn-primary-action job-action-btn" @click="acceptJobRequest(req)">
                    <i class="fa-solid fa-check"></i> Tomar Trabajo
                  </button>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- ===== MODAL DETALLE DE SOLICITUD ===== -->
        <Teleport to="body">
          <div v-if="showDetailModal && selectedRequest" class="modal-overlay" @click.self="closeDetail">
            <div class="modal-content animate-pop">
              <div class="modal-header">
                <h3>Detalles de la Solicitud</h3>
                <button class="btn-close" @click="closeDetail">×</button>
              </div>
              
              <div class="modal-body">
                <div class="detail-client">
                  <img v-if="selectedRequest.cliente_avatar" :src="selectedRequest.cliente_avatar" class="modal-avatar" />
                  <div v-else class="modal-avatar-initial">{{ selectedRequest.cliente_nombre?.charAt(0) || 'C' }}</div>
                  <div>
                    <strong>{{ selectedRequest.cliente_nombre || 'Cliente' }}</strong>
                    <span>Publicado el {{ new Date(selectedRequest.created_at || selectedRequest.fecha_creacion).toLocaleDateString() }}</span>
                  </div>
                </div>

                <div class="detail-info">
                  <label>Título:</label>
                  <p class="detail-title">{{ selectedRequest.titulo }}</p>

                  <div class="detail-meta-grid">
                    <div class="detail-meta-item">
                      <label><i class="fa-solid fa-tag"></i> Categoría</label>
                      <p class="detail-tag">{{ selectedRequest.categoria }}</p>
                    </div>
                    <div class="detail-meta-item" v-if="selectedRequest.urgencia">
                      <label><i class="fa-solid fa-bolt"></i> Urgencia</label>
                      <p class="detail-tag" :class="{
                        'tag-urgente': selectedRequest.urgencia === 'urgente',
                        'tag-normal': selectedRequest.urgencia === 'normal',
                        'tag-flexible': selectedRequest.urgencia === 'flexible'
                      }">{{ selectedRequest.urgencia }}</p>
                    </div>
                    <div class="detail-meta-item" v-if="selectedRequest.disponibilidad || selectedRequest.horario || selectedRequest.isWorkDetail">
                      <label><i class="fa-solid fa-clock"></i> Horario</label>
                      <p class="detail-tag">{{ 
                        selectedRequest.horario || 
                        ({
                          'manana': 'Mañana (8am – 12pm)',
                          'tarde': 'Tarde (12pm – 6pm)',
                          'noche': 'Noche (6pm – 9pm)',
                          'finde': 'Fines de semana',
                          'cualquier': 'Cualquier momento'
                        }[selectedRequest.disponibilidad] || selectedRequest.disponibilidad) || 'A coordinar'
                      }}</p>
                    </div>
                    <div class="detail-meta-item" v-if="selectedRequest.presupuesto_min || selectedRequest.presupuesto_max || selectedRequest.presupuesto || selectedRequest.isWorkDetail">
                      <label><i class="fa-solid fa-money-bill-wave"></i> Monto total:</label>
                      <p class="detail-budget">
                        <span v-if="selectedRequest.presupuesto">{{ selectedRequest.presupuesto }}</span>
                        <span v-else-if="!selectedRequest.presupuesto_min && !selectedRequest.presupuesto_max">A coordinar</span>
                        <template v-else>
                          <span v-if="selectedRequest.presupuesto_min">RD$ {{ Number(selectedRequest.presupuesto_min).toLocaleString() }}</span>
                          <span v-if="selectedRequest.presupuesto_min && selectedRequest.presupuesto_max"> – </span>
                          <span v-if="selectedRequest.presupuesto_max">RD$ {{ Number(selectedRequest.presupuesto_max).toLocaleString() }}</span>
                        </template>
                      </p>
                    </div>
                    <div class="detail-meta-item" v-if="selectedRequest.metodo_pago">
                      <label><i class="fa-solid fa-wallet"></i> Pago Preferido</label>
                      <p class="detail-tag flex items-center gap-2">
                        <i v-if="selectedRequest.metodo_pago === 'EFECTIVO'" class="fa-solid fa-money-bill-wave text-green-600"></i>
                        <i v-else-if="selectedRequest.metodo_pago === 'TRANSFERENCIA'" class="fa-solid fa-building-columns text-blue-600"></i>
                        <i v-else-if="selectedRequest.metodo_pago === 'TARJETA_CREDITO'" class="fa-solid fa-credit-card text-purple-600"></i>
                        {{ 
                          selectedRequest.metodo_pago === 'TARJETA_CREDITO' ? 'Tarjeta de Crédito' : 
                          selectedRequest.metodo_pago.charAt(0) + selectedRequest.metodo_pago.slice(1).toLowerCase()
                        }}
                      </p>
                    </div>
                    <div class="detail-meta-item" v-if="selectedRequest.ubicacion">
                      <label><i class="fa-solid fa-location-dot"></i> Ubicación</label>
                      <p class="detail-tag">{{ selectedRequest.ubicacion }}</p>
                    </div>
                  </div>

                  <label>Descripción completa:</label>
                  <p class="detail-description">{{ selectedRequest.descripcion }}</p>
                </div>

                <div v-if="selectedRequest.imagen_url" class="detail-image">
                  <label>Imagen de referencia:</label>
                  <img :src="selectedRequest.imagen_url" alt="Referencia" />
                </div>
              </div>

              <div class="modal-footer" v-if="!selectedRequest.isWorkDetail">
                <button class="btn-chat-alt" @click="contactClient(selectedRequest.cliente_id)">
                  <i class="fa-solid fa-paper-plane"></i> Chatear primero
                </button>
                <button class="btn-accept-alt" @click="acceptJobRequest(selectedRequest)">
                  <i class="fa-solid fa-check"></i> Aceptar y Empezar
                </button>
              </div>
            </div>
          </div>
        </Teleport>

      </template>
    </template>

  </div>
</template>

<style scoped>
.dashboard-view { font-family: 'Inter', sans-serif; width: 100%; }

/* LOADING */
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; gap: 16px; color: #94A3B8; }
.spinner { width: 32px; height: 32px; border: 2.5px solid #E2E8F0; border-top-color: #334155; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* --- MODAL DETALLE SOLICITUD --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}

.modal-content {
  background: white; border-radius: 16px;
  width: 100%; max-width: 550px;
  max-height: 90vh; overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex; flex-direction: column;
}

.animate-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 20px 24px; border-bottom: 1px solid #F1F5F9;
  display: flex; justify-content: space-between; align-items: center;
}
.modal-header h3 { margin: 0; font-size: 1.2rem; font-weight: 800; color: #0F172A; }
.btn-close { background: none; border: none; font-size: 1.5rem; color: #94A3B8; cursor: pointer; transition: 0.2s; }
.btn-close:hover { color: #0F172A; }

.modal-body { padding: 24px; }

.detail-client {
  display: flex; align-items: center; gap: 14px;
  padding: 14px; background: #F8FAFC; border-radius: 10px; margin-bottom: 24px;
}
.modal-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
.modal-avatar-initial { width: 48px; height: 48px; border-radius: 50%; background: #334155; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.detail-client strong { display: block; font-size: 1rem; color: #0F172A; }
.detail-client span { font-size: 0.8rem; color: #94A3B8; }

.detail-info label { display: block; font-size: 0.75rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
.detail-title { font-size: 1.25rem; font-weight: 800; color: #0F172A; margin: 0 0 16px; }
.detail-tag { display: inline-block; background: #F1F5F9; color: #475569; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; margin-bottom: 20px; text-transform: capitalize; }
.detail-description { font-size: 1rem; line-height: 1.6; color: #334155; margin: 0 0 24px; white-space: pre-wrap; }

.detail-image img { width: 100%; border-radius: 12px; border: 1px solid #E2E8F0; margin-top: 8px; }

.modal-footer {
  padding: 20px 24px; border-top: 1px solid #F1F5F9;
  display: flex; gap: 12px;
}
.btn-chat-alt, .btn-accept-alt {
  flex: 1; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-chat-alt { background: white; color: #475569; border: 1.5px solid #E2E8F0; }
.btn-chat-alt:hover { border-color: #334155; color: #0F172A; }
.btn-accept-alt { background: #F76B1C; color: white; border: none; }
.btn-accept-alt:hover { background: #E05A10; transform: translateY(-2px); }

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

/* --- MODAL META GRID --- */
.detail-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.detail-meta-item label { display: flex; align-items: center; gap: 5px; font-size: 0.72rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 5px; }
.detail-budget { font-size: 1rem; font-weight: 700; color: #0F172A; margin: 0; }
.tag-urgente { background: #FEF2F2 !important; color: #DC2626 !important; }
.tag-normal  { background: #FFFBEB !important; color: #D97706 !important; }
.tag-flexible { background: #F0FDF4 !important; color: #16A34A !important; }

/* MODAL DE BLOQUEO DE PAGOS */
.payment-block-card {
  max-width: 480px;
  width: 90%;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
  text-align: center;
}
.pb-header-gradient {
  height: 6px;
  background: linear-gradient(90deg, #3B82F6 0%, #2563EB 50%, #1E40AF 100%);
}
.pb-content {
  padding: 40px 32px;
}
.pb-icon-circle {
  width: 72px;
  height: 72px;
  background: #EFF6FF;
  color: #2563EB;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 24px;
}
.pb-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 12px;
}
.pb-desc {
  font-size: 0.9rem;
  color: #64748B;
  line-height: 1.6;
  margin: 0 0 32px;
}
.pb-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pb-btn-primary {
  background: #1E293B;
  color: white;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.pb-btn-primary:hover {
  background: #0F172A;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.pb-btn-secondary {
  background: white;
  color: #64748B;
  border: 1.5px solid #E2E8F0;
  padding: 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  transition: all 0.2s;
}
.pb-btn-secondary:hover {
  background: #F8FAFC;
  color: #1E293B;
  border-color: #CBD5E1;
}
.pb-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: #F1F5F9;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #94A3B8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}
.pb-close-btn:hover {
  background: #E2E8F0;
  color: #475569;
}

/* ===== TARJETA DE BIENVENIDA ===== */
.welcome-card {
  display: flex; align-items: center; gap: 16px;
  background: white; border: 1px solid #E2E8F0;
  border-radius: 12px; padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.welcome-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  overflow: hidden; flex-shrink: 0;
  background: #334155; display: flex; align-items: center; justify-content: center;
  border: 2px solid #E2E8F0;
}
.welcome-avatar-img { width: 100%; height: 100%; object-fit: cover; }
.welcome-avatar-initials { font-size: 1.4rem; font-weight: 700; color: white; }
.welcome-text { flex: 1; min-width: 0; }
.welcome-greeting { margin: 0 0 2px; font-size: 0.78rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }
.welcome-name { margin: 0; font-size: 1.2rem; font-weight: 800; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.welcome-btn-profile {
  display: inline-flex; align-items: center; gap: 6px;
  background: #F8FAFC; border: 1.5px solid #E2E8F0;
  color: #475569; padding: 8px 14px; border-radius: 6px;
  font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: 0.2s;
  flex-shrink: 0;
}
.welcome-btn-profile svg { width: 15px; height: 15px; }
.welcome-btn-profile:hover { border-color: #334155; color: #1E293B; background: white; }

/* SIN PERFIL */
.no-profile-card {
  background: white; border-radius: 12px; border: 1px solid #E2E8F0;
  padding: 48px 40px; text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.npc-icon { font-size: 2.5rem; margin-bottom: 16px; color: #CBD5E1; }
.no-profile-card h2 { margin: 0 0 12px; font-size: 1.4rem; font-weight: 800; color: #0F172A; }
.no-profile-card p { color: #64748B; font-size: 0.93rem; max-width: 480px; margin: 0 auto 28px; line-height: 1.6; }
.npc-steps { display: flex; flex-direction: column; gap: 12px; max-width: 380px; margin: 0 auto 32px; text-align: left; }
.step { display: flex; align-items: center; gap: 14px; }
.step-num { width: 30px; height: 30px; background: #1E293B; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0; }
.step-text { color: #475569; font-size: 0.9rem; font-weight: 500; }
.btn-setup-now {
  background: #1E293B;
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s ease;
}
.btn-setup-now:hover { background: #0F172A; transform: translateY(-2px); }
.btn-icon { width: 20px; height: 20px; }

.btn-primary-action {
  margin-top: 16px;
  background: #1E293B;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}
.btn-primary-action:hover { background: #0F172A; transform: translateY(-1px); }

/* QUICK ACTIONS */
.quick-actions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 14px; margin-bottom: 20px; }
.qa-card {
  display: flex; align-items: center; gap: 16px;
  background: white; border: 1.5px solid #E2E8F0;
  border-radius: 10px; padding: 18px 20px;
  cursor: pointer; text-align: left; transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.qa-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.07); border-color: #CBD5E1; }
.qa-icon { font-size: 1.5rem; flex-shrink: 0; color: #475569; }
.qa-text { flex: 1; }
.qa-text strong { display: block; font-size: 0.98rem; font-weight: 700; color: #1E293B; margin-bottom: 3px; }
.qa-text span { font-size: 0.78rem; color: #94A3B8; }
.qa-arrow { width: 16px; height: 16px; color: #CBD5E1; flex-shrink: 0; }
.qa-card:hover .qa-arrow { color: #475569; }

/* INFO BANNER */
.info-banner { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px 18px; display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; }
.info-banner-icon { font-size: 1.2rem; flex-shrink: 0; color: #94A3B8; }
.info-banner-text strong { display: block; color: #334155; font-size: 0.9rem; margin-bottom: 3px; }
.info-banner-text p { margin: 0; color: #64748B; font-size: 0.82rem; line-height: 1.5; }

/* SECTION CARD */
.section-card { background: white; border-radius: 10px; border: 1px solid #E2E8F0; overflow: hidden; }
.sc-header { padding: 18px 22px; border-bottom: 1px solid #F1F5F9; }
.sc-header h3 { margin: 0 0 3px; font-size: 0.98rem; font-weight: 700; color: #1E293B; }
.sc-header p { margin: 0; font-size: 0.82rem; color: #94A3B8; }

.empty-jobs { display: flex; align-items: flex-start; gap: 20px; padding: 30px; }
.empty-jobs-icon { width: 56px; height: 56px; background: #F1F5F9; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.5rem; color: #CBD5E1; }
.empty-jobs-text { display: flex; flex-direction: column; align-items: flex-start; }
.empty-jobs-text h4 { margin: 0 0 6px; font-size: 1rem; color: #1E293B; font-weight: 700; }
.empty-jobs-text p { margin: 0; font-size: 0.88rem; line-height: 1.5; color: #64748B; }

.jobs-list { display: flex; flex-direction: column; padding: 20px; gap: 20px; }
.job-card { border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; transition: box-shadow 0.2s; }
.job-card:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
.job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.client-info { display: flex; align-items: center; gap: 12px; }
.client-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.client-avatar-initial { width: 44px; height: 44px; border-radius: 50%; background: #334155; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; }
.client-details h4 { margin: 0 0 2px; font-size: 1rem; color: #1E293B; font-weight: 700; }
.client-details span { font-size: 0.8rem; color: #94A3B8; }
.job-category { background: #F1F5F9; color: #475569; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
.job-title { margin: 0 0 8px; font-size: 1.15rem; color: #0F172A; font-weight: 800; }
.job-desc { margin: 0 0 16px; font-size: 0.92rem; line-height: 1.6; color: #475569; }
.job-image { margin-bottom: 16px; border-radius: 8px; overflow: hidden; max-height: 250px; background: #F8FAFC; border: 1px solid #E2E8F0; }
.job-image img { width: 100%; height: 100%; object-fit: contain; }
.job-footer { display: flex; justify-content: flex-end; }
.job-action-btn { width: auto; padding: 10px 20px; font-size: 0.9rem; }

@media (max-width: 768px) {
  .welcome-card { flex-direction: column; text-align: center; gap: 12px; }
  .welcome-btn-profile { width: 100%; justify-content: center; }
  
  .qa-card { padding: 16px; align-items: flex-start; }
  .qa-icon { font-size: 1.2rem; }
  .qa-text strong { font-size: 0.9rem; }
  .qa-text span { font-size: 0.72rem; }
  
  .job-header { flex-direction: column; gap: 10px; }
  .job-category { align-self: flex-start; }
  .job-footer { flex-direction: column; gap: 8px; }
  .job-action-btn { width: 100%; justify-content: center; margin-right: 0 !important; }
}

@media (max-width: 480px) {
  .no-profile-card { padding: 30px 16px; }
  .npc-steps { gap: 10px; }
  .step-text { font-size: 0.8rem; }
}

/* QUOTE MODAL FORM */
.qm-field { display: flex; flex-direction: column; gap: 6px; }
.qm-label {
  font-size: 0.75rem; font-weight: 700; color: #64748B;
  text-transform: uppercase; letter-spacing: 0.04em;
  display: flex; align-items: center; gap: 6px;
}
.qm-input {
  width: 100%; padding: 10px 14px;
  border: 1.5px solid #E2E8F0; border-radius: 10px;
  font-size: 0.95rem; color: #0F172A;
  background: #F8FAFC; outline: none;
  transition: border-color 0.2s, background 0.2s;
  font-family: inherit; box-sizing: border-box;
}
.qm-input:focus { border-color: #0B4C6F; background: white; }
.waiting-badge {
  background: #FEF3C7;
  color: #92400E;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #FDE68A;
}
</style>
