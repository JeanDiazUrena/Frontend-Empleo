<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js'; // 1. IMPORTAR CEREBRO

import ConfirmacionCliente from '../components/ConfirmacionCliente.vue';

const router = useRouter();
const { state, updateProfile } = useUserSession(); // 2. USAR ESTADO GLOBAL

const loading = ref(true);
const activeRequests = ref([]); 
const featuredProfessionals = ref([]); 
const clientJobs = ref([]); 
const pastJobs = ref([]);
const showPastJobs = ref(false);
// Map of trabajo_id -> cotizacion (null = loaded but none, undefined = not loaded)
const jobCotizaciones = ref({});
const isAcceptingQuote = ref(null);

// Control del Modal
const showIncompleteProfileModal = ref(false);

// --- TOAST SYSTEM ---
const toast = ref({ show: false, msg: '', type: 'success' });
let toastTimer = null;
const showToast = (msg, type = 'success') => {
  if (toastTimer) clearTimeout(toastTimer);
  toast.value = { show: true, msg, type };
  toastTimer = setTimeout(() => { toast.value.show = false; }, 4000);
};

// --- MODAL DETALLE TRABAJO ---
const selectedJob = ref(null);
const showJobModal = ref(false);
const openJobDetail = (job) => { selectedJob.value = job; showJobModal.value = true; };
const closeJobModal = () => { selectedJob.value = null; showJobModal.value = false; };

// --- NAVEGACIÓN ---
const goToExplore = () => router.push('/client/explore');
const goToProfile = () => router.push('/client/profile');
const closeWarning = () => showIncompleteProfileModal.value = false;

// --- ACCIONES SOLICITUDES ---
const cancelarSolicitud = async (id) => {
  if (!confirm('¿Seguro que deseas cancelar esta solicitud?')) return;
  try {
    await axios.delete(`http://localhost:3001/api/solicitudes/${id}`);
    activeRequests.value = activeRequests.value.filter(r => r.id !== id);
    showToast('Solicitud cancelada con éxito', 'success');
  } catch (err) {
    showToast('No se pudo cancelar la solicitud', 'error');
  }
};

const isConfirmingPro = ref(null);
const confirmarProfesional = async (req) => {
  isConfirmingPro.value = req.id;
  try {
    const res = await axios.post('http://localhost:3003/api/trabajos', {
      cliente_id: req.cliente_id,
      profesional_id: req.profesional_usuario_id, // Usar el usuario_id para que el profesional lo vea en su dashboard
      solicitud_id: req.id,
      titulo: req.titulo,
      descripcion: req.descripcion,
      horario: req.disponibilidad || 'No especificado',
      presupuesto: req.presupuesto_max || req.presupuesto_min || 'No especificado',
      monto_acordado: req.monto_acordado || req.presupuesto_max || req.presupuesto_min || 0,
      metodo_pago: req.metodo_pago || 'EFECTIVO',
      cliente_nombre: state.user.name,
      categoria: req.categoria
    });
    
    if (res.data.success) {
      showToast('¡Trabajo formalizado con éxito!', 'success');
      activeRequests.value = activeRequests.value.filter(r => r.id !== req.id);
      // Recargar trabajos
      const trabajosRes = await axios.get(`http://localhost:3003/api/trabajos/cliente/${state.user.id}`);
      clientJobs.value = trabajosRes.data;
    }
  } catch (error) {
    console.error(error);
    showToast('Error al formalizar el trabajo.', 'error');
  } finally {
    isConfirmingPro.value = null;
  }
};

// --- AL CARGAR ---
onMounted(async () => {
  // Usamos el ID del estado global (más seguro que localStorage directo)
  const userId = state.user.id;

  if (userId) {
    try {
      // 1. SINCRONIZAR PERFIL (Puerto 3001)
      // Pedimos los datos más recientes a la base de datos
      const { data } = await axios.get(`http://localhost:3001/api/clientes/${userId}`);
      
      if (data) {
        // Actualizamos el cerebro con la información fresca
        updateProfile({
          name: data.nombre,
          phone: data.telefono,
          location: data.direccion,
          avatar: data.avatar
        });

        // Verificamos si falta información CRÍTICA para mostrar el modal
        if (!data.telefono || !data.direccion) {
          console.log("Perfil incompleto detectado.");
          // El usuario solicitó no mostrar el modal:
          // setTimeout(() => {
          //   showIncompleteProfileModal.value = true;
          // }, 1000); 
        }
      }

      // 2. CARGAR SOLICITUDES (Puerto 3001)
      try {
        const requestsRes = await axios.get(`http://localhost:3001/api/solicitudes/cliente/${userId}`);
        activeRequests.value = requestsRes.data;
      } catch (reqError) {
        console.log("El usuario no tiene solicitudes o el servicio 3001 no responde.");
      }

      // 3. CARGAR PROFESIONALES DESTACADOS (Puerto 3001)
      try {
        const prosRes = await axios.get('http://localhost:3001/api/profesionales');
        if (prosRes.data && prosRes.data.length > 0) {
          // Filtramos profesionales que tengan los datos mínimos (el backend ya filtra, pero reforzamos)
          const validPros = prosRes.data.filter(p => p.nombre && p.profesion);
          featuredProfessionals.value = validPros.slice(0, 4);
        }
      } catch (err) {
        console.log("No se pudieron cargar los profesionales destacados.");
      }

      // 4. CARGAR TRABAJOS ACTIVOS (Puerto 3003)
      try {
          const trabajosRes = await axios.get(`http://localhost:3003/api/trabajos/cliente/${userId}`);
          clientJobs.value = trabajosRes.data;
      } catch (err) {
          console.log("El servicio de trabajos (3003) no está disponible o no hay trabajos.");
      }

      // 5. CARGAR HISTORIAL DE TRABAJOS COMPLETADOS (Puerto 3003)
      try {
          const histRes = await axios.get(`http://localhost:3003/api/trabajos/cliente/${userId}/historial`);
          pastJobs.value = histRes.data;
      } catch (err) {
          console.log("No se pudo cargar el historial de trabajos.");
      }

      // 6. CARGAR COTIZACIONES POR TRABAJO (Porto 3003)
      try {
          // Load cotizaciones for each active job individually
          const activeJobs = clientJobs.value.filter(j => j.estado === 'EN_PROGRESO' || j.estado === 'FINALIZADO_PROFESIONAL');
          for (const job of activeJobs) {
              try {
                  const cotRes = await axios.get(`http://localhost:3003/api/cotizaciones/trabajo/${job.id}`);
                  jobCotizaciones.value[String(job.id)] = cotRes.data || null;
              } catch(e) {
                  jobCotizaciones.value[String(job.id)] = null;
              }
          }
      } catch (err) {
          console.log("Error cargando cotizaciones por trabajo.");
      }

    } catch (error) {
      console.error("Error cargando dashboard:", error);
      // Si falla la conexión con BD, confiamos en lo que hay en memoria local
      if (!state.user.phone || !state.user.location) {
         console.log("Faltan datos en memoria local, pero no mostramos modal.");
      }
    } finally {
      loading.value = false;
    }
  } else {
    // Si no hay ID, mandamos al login
    router.push('/login');
  }
});

// --- PAGO Y CONFIRMACIÓN ---
const showPaymentModal = ref(false);
const jobToPay = ref(null);

const openPaymentModal = async (job) => {
    // Reload the job from backend to get the latest monto_acordado
    try {
        const res = await axios.get(`http://localhost:3003/api/trabajos/${job.id}`);
        if (res.data && Number(res.data.monto_acordado) > 0) {
            job.monto_acordado = res.data.monto_acordado;
        }
        // Also check if there's an accepted cotizacion for this job
        const cotRes = await axios.get(`http://localhost:3003/api/cotizaciones/trabajo/${job.id}`);
        if (cotRes.data && cotRes.data.estado === 'ACEPTADA' && Number(cotRes.data.monto_total) > 0) {
            job.monto_acordado = cotRes.data.monto_total;
        }
    } catch (e) { console.log('Could not refresh job data'); }
    jobToPay.value = job;
    showPaymentModal.value = true;
};

const getJobAmount = (job) => {
    if (!job) return 0;
    // Prioridad: monto_acordado del trabajo (actualizado al aceptar cotizacion) > presupuesto_max > presupuesto
    const value = job.monto_acordado || job.monto_total || job.presupuesto_max || job.presupuesto;
    if (typeof value === 'number' && value > 0) return value;
    if (!value) return 0;
    // Si es un string (ej: "RD$ 1,500 - RD$ 3,000"), extraemos el número más alto
    const matches = String(value).match(/\d+(?:[.,]\d+)*/g);
    if (!matches) return 0;
    const amounts = matches
      .map((part) => Number(part.replace(/,/g, '')))
      .filter((amount) => Number.isFinite(amount) && amount > 0);
    return amounts.length > 0 ? Math.max(...amounts) : 0;
};

const formatMoney = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0
      ? `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : 'A coordinar';
};

const formatPaymentMethod = (method) => {
    const labels = {
      EFECTIVO: 'Efectivo',
      TRANSFERENCIA: 'Transferencia',
      TARJETA_CREDITO: 'Tarjeta de credito',
      TARJETA: 'Tarjeta'
    };
    return labels[String(method || '').toUpperCase()] || 'No especificado';
};

const handlePaymentSuccess = () => {
    showPaymentModal.value = false;
    if (jobToPay.value) {
        router.push(`/client/review/${jobToPay.value.id}?ref=${jobToPay.value.profesional_id}`);
    }
};

// --- COTIZACION LOGIC ---
const getCotizacionForJob = (job) => {
    const key = String(job?.id);
    return jobCotizaciones.value[key] || null;
};

const formatMoneyQ = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0
        ? `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'A coordinar';
};

const aceptarCotizacion = async (cotizacion) => {
    if (!cotizacion?.id || isAcceptingQuote.value) return;
    isAcceptingQuote.value = cotizacion.id;
    try {
        const userId = state.user.id;
        const res = await axios.put(`http://localhost:3003/api/cotizaciones/${cotizacion.id}/aceptar`, {
            cliente_id: userId
        });
        if (res.data.success) {
            showToast('¡Cotización aceptada! El trabajo continúa con el precio acordado.', 'success');
            // Remove from map so banner disappears
            jobCotizaciones.value[String(cotizacion.trabajo_id)] = null;
            // Update job monto_acordado in local state
            const job = clientJobs.value.find(j => String(j.id) === String(cotizacion.trabajo_id));
            if (job) job.monto_acordado = cotizacion.monto_total;
        }
    } catch (error) {
        showToast(error.response?.data?.error || 'No se pudo aceptar la cotización.', 'error');
    } finally {
        isAcceptingQuote.value = null;
    }
};
</script>

<template>
  <div class="client-content-wrapper">
    
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
    
    <div v-if="showIncompleteProfileModal" class="modal-overlay">
      <div class="modal-card animate-pop">
        
        <div class="icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="user-icon">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
          </svg>
          <span class="notification-dot">!</span>
        </div>

        <h3>Completa tu Perfil</h3>
        <p>Para conectar con los mejores profesionales, necesitamos validar tu <strong>teléfono</strong> y <strong>dirección</strong>.</p>
        
        <div class="modal-actions">
          <button class="btn-complete" @click="goToProfile">
            Completar ahora
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="arrow-icon"><path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" /></svg>
          </button>
          
          <button class="btn-later" @click="closeWarning">
            Hacerlo más tarde
          </button>
        </div>
        
        <div class="modal-footer-note">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="lock-icon"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" /></svg>
          No podrás publicar solicitudes hasta completar estos datos.
        </div>
      </div>
    </div>

    <main class="feed-content">
      
      <div class="welcome-banner">
        <div class="banner-content">
          <h2>Hola, {{ state.user.name }}</h2>
          <p>¿Qué necesitas resolver hoy?</p>
        </div>
        <button @click="router.push('/client/request')" class="btn-primary-action">
          <i class="fa-solid fa-plus"></i> Publicar Solicitud
        </button>
      </div>

      <div class="ongoing-section">
        <h3 class="section-title" v-if="activeRequests.length > 0">Tus Solicitudes Activas</h3>

        <div v-if="activeRequests.length > 0" class="ongoing-list">
          <div v-for="req in activeRequests" :key="req.id" class="ongoing-card">
            <div class="card-left">
              <div class="status-indicator" :class="req.estado === 'completado' ? 'green' : 'orange'"></div>
              <div class="req-details">
                <h4>{{ req.title || req.titulo }}</h4>
                <span class="req-status">
                  {{ req.status || req.estado || 'Pendiente' }} • {{ new Date(req.created_at || req.fecha_creacion || Date.now()).toLocaleDateString() }}
                </span>
              </div>
            </div>
            
            <div class="card-actions-row">
              <button class="btn-action-outline" @click="router.push(`/client/request/edit/${req.id}`)">
                <i class="fa-solid fa-pen"></i> Editar
              </button>
              <button class="btn-action-outline text-red-600" @click="cancelarSolicitud(req.id)">
                <i class="fa-solid fa-trash"></i> Cancelar
              </button>
              
              <!-- Si un profesional aceptó y espera confirmación -->
              <div v-if="req.estado === 'POR_CONFIRMAR' || req.estado === 'por_confirmar'" class="pro-confirmation-box">
                <div class="pro-mini-profile">
                  <img :src="req.profesional_avatar || '/default-avatar.png'" class="pro-mini-avatar" />
                  <div class="pro-mini-info">
                    <span class="pro-name">{{ req.profesional_nombre || 'Profesional interesado' }}</span>
                    <span class="pro-label">Interesado en tu solicitud</span>
                  </div>
                </div>
                <button 
                  class="btn-confirm-pro" 
                  @click="confirmarProfesional(req)"
                  :disabled="isConfirmingPro === req.id"
                >
                  <i v-if="isConfirmingPro === req.id" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-handshake"></i>
                  Confirmar Profesional
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-requests-box">
          <p>No tienes solicitudes activas en este momento.</p>
        </div>
      </div>

      <div class="ongoing-section">
        <h3 class="section-title" v-if="clientJobs.length > 0">Tus Trabajos en Curso</h3>
        <div v-if="clientJobs.length > 0" class="ongoing-list">
          <div v-for="job in clientJobs" :key="job.id" class="ongoing-card" :class="{ 'card-finalizado': job.estado === 'FINALIZADO_PROFESIONAL' }" style="flex-direction: column; align-items: stretch; gap: 14px;">
            <div class="card-left">
              <div class="status-indicator" :class="job.estado === 'FINALIZADO_PROFESIONAL' ? 'orange animate-pulse' : 'green'"></div>
              <div class="req-details">
                <h4>{{ job.titulo || 'Contratación Directa' }}</h4>
                <p v-if="job.descripcion" class="job-desc-preview">{{ job.descripcion.slice(0, 80) }}{{ job.descripcion.length > 80 ? '...' : '' }}</p>
                <span class="req-status">
                  <span class="estado-badge" :class="{
                    'badge-progreso': job.estado === 'EN_PROGRESO',
                    'badge-finalizado': job.estado === 'FINALIZADO_PROFESIONAL',
                    'badge-pendiente-confirmacion': job.estado === 'ESPERANDO_CONFIRMACION_TRANSFERENCIA'
                  }">
                    {{ job.estado === 'EN_PROGRESO' ? 'En progreso' : job.estado === 'FINALIZADO_PROFESIONAL' ? 'Listo para confirmar' : job.estado === 'ESPERANDO_CONFIRMACION_TRANSFERENCIA' ? 'Pago en verificación' : job.estado }}
                  </span>
                  • {{ new Date(job.created_at || job.fecha_creacion).toLocaleDateString() }}
                </span>
              </div>
            </div>
            
            <!-- COTIZACIÓN PENDIENTE INLINE — solo cuando el trabajo está en progreso o listo para confirmar y tiene una cotización pendiente -->
            <div v-if="(job.estado === 'EN_PROGRESO' || job.estado === 'FINALIZADO_PROFESIONAL') && getCotizacionForJob(job) && getCotizacionForJob(job).estado === 'PENDIENTE'" class="cotizacion-inline-banner">
              <div class="cib-header">
                <i class="fa-solid fa-file-invoice-dollar"></i>
                <span>Cotización Pendiente</span>
                <span class="cib-badge">¡Revisa!</span>
              </div>
              <div class="cib-body">
                <div class="cib-row">
                  <span class="cib-label">Servicio</span>
                  <span class="cib-value">{{ getCotizacionForJob(job).titulo }}</span>
                </div>
                <div class="cib-row">
                  <span class="cib-label">Monto</span>
                  <span class="cib-amount">{{ formatMoneyQ(getCotizacionForJob(job).monto_total) }}</span>
                </div>
                <div class="cib-row" v-if="getCotizacionForJob(job).descripcion">
                  <span class="cib-label">Detalle</span>
                  <span class="cib-value">{{ getCotizacionForJob(job).descripcion }}</span>
                </div>
                <div class="cib-actions">
                  <button 
                    class="cib-btn-accept"
                    :disabled="isAcceptingQuote === getCotizacionForJob(job).id"
                    @click="aceptarCotizacion(getCotizacionForJob(job))"
                  >
                    <i v-if="isAcceptingQuote === getCotizacionForJob(job).id" class="fa-solid fa-spinner fa-spin"></i>
                    <i v-else class="fa-solid fa-check"></i>
                    {{ isAcceptingQuote === getCotizacionForJob(job).id ? 'Aceptando...' : 'Aceptar precio' }}
                  </button>
                </div>
              </div>
            </div>
            
            <div class="card-actions">
              <button class="btn-view-details" @click="openJobDetail(job)">
                <i class="fa-solid fa-circle-info"></i> Ver detalles
              </button>
              <button v-if="job.estado === 'FINALIZADO_PROFESIONAL'" class="btn-primary-action" style="padding:8px 16px; font-size:0.9rem" @click="openPaymentModal(job)">
                <i class="fa-solid fa-check"></i> Confirmar & Calificar
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== MODAL DETALLE TRABAJO ===== -->
      <Teleport to="body">
        <div v-if="showJobModal && selectedJob" class="modal-overlay" @click.self="closeJobModal">
          <div class="job-modal animate-pop">
            <div class="job-modal-header">
              <div>
                <span class="job-modal-tag" :class="{
                  'badge-progreso': selectedJob.estado === 'EN_PROGRESO',
                  'badge-finalizado': selectedJob.estado === 'FINALIZADO_PROFESIONAL',
                  'badge-pendiente-confirmacion': selectedJob.estado === 'ESPERANDO_CONFIRMACION_TRANSFERENCIA'
                }">
                  {{ selectedJob.estado === 'EN_PROGRESO' ? '🟢 En progreso' : selectedJob.estado === 'FINALIZADO_PROFESIONAL' ? '🟠 Listo para confirmar' : selectedJob.estado === 'ESPERANDO_CONFIRMACION_TRANSFERENCIA' ? '🔴 Pago en verificación' : selectedJob.estado }}
                </span>
                <h3>{{ selectedJob.titulo || 'Contratación Directa' }}</h3>
              </div>
              <button class="jm-close" @click="closeJobModal">×</button>
            </div>

            <div class="job-modal-body">
              <div class="jm-meta-row">
                <div class="jm-meta-item">
                  <span class="jm-label"><i class="fa-solid fa-clock"></i> Horario</span>
                  <span class="jm-value">{{ selectedJob.horario || 'A coordinar' }}</span>
                </div>
                <div class="jm-meta-item">
                  <span class="jm-label"><i class="fa-solid fa-money-bill-wave"></i> Presupuesto</span>
                  <span class="jm-value">{{ formatMoney(getJobAmount(selectedJob)) }}</span>
                </div>
                <div class="jm-meta-item">
                  <span class="jm-label"><i class="fa-solid fa-wallet"></i> Metodo de pago</span>
                  <span class="jm-value">{{ formatPaymentMethod(selectedJob.metodo_pago) }}</span>
                </div>
                <div class="jm-meta-item">
                  <span class="jm-label"><i class="fa-solid fa-calendar"></i> Fecha inicio</span>
                  <span class="jm-value">{{ new Date(selectedJob.created_at || selectedJob.fecha_creacion).toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' }) }}</span>
                </div>
                <div class="jm-meta-item">
                  <span class="jm-label"><i class="fa-solid fa-id-badge"></i> ID del trabajo</span>
                  <span class="jm-value jm-id">{{ selectedJob.id }}</span>
                </div>
              </div>

              <div class="jm-desc-section" v-if="selectedJob.descripcion">
                <span class="jm-label"><i class="fa-solid fa-align-left"></i> Descripción</span>
                <p class="jm-desc">{{ selectedJob.descripcion }}</p>
              </div>
            </div>

            <div class="job-modal-footer">
              <button class="jm-btn-chat" @click="router.push('/client/chat'); closeJobModal()">
                <i class="fa-solid fa-message"></i> Ir al Chat
              </button>
              <button
                v-if="selectedJob.estado === 'FINALIZADO_PROFESIONAL'"
                class="jm-btn-confirm"
                @click="openPaymentModal(selectedJob); closeJobModal()"
              >
                <i class="fa-solid fa-check"></i> Confirmar & Calificar
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- ===== MODAL CONFIRMACION Y PAGO ===== -->
      <ConfirmacionCliente 
         v-if="showPaymentModal"
         :trabajo_id="jobToPay.id" 
         :profesional_id="jobToPay.profesional_id"
         :monto_total="getJobAmount(jobToPay)" 
         :metodo_pago="jobToPay.metodo_pago || 'EFECTIVO'" 
         @close="showPaymentModal = false"
         @success="handlePaymentSuccess"
      />

      <!-- ===== TRABAJOS PASADO (COLAPSABLE) ===== -->
      <div class="past-jobs-section" v-if="pastJobs.length > 0">
        <button class="past-jobs-toggle" @click="showPastJobs = !showPastJobs">
          <div class="past-jobs-toggle-left">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>Trabajos Pasado</span>
            <span class="past-count">{{ pastJobs.length }}</span>
          </div>
          <i :class="showPastJobs ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" class="chevron-icon"></i>
        </button>

        <Transition name="slide-down">
          <div v-if="showPastJobs" class="past-jobs-list">
            <div v-for="job in pastJobs" :key="job.id" class="past-job-card">
              <div class="past-job-left">
                <div class="past-done-icon"><i class="fa-solid fa-circle-check"></i></div>
                <div class="past-job-info">
                  <h4>{{ job.titulo || 'Contratación Directa' }}</h4>
                  <p v-if="job.descripcion" class="past-job-desc">{{ job.descripcion.slice(0, 60) }}{{ job.descripcion.length > 60 ? '...' : '' }}</p>
                  <span class="past-job-date">Completado el {{ new Date(job.created_at || job.fecha_creacion).toLocaleDateString('es-DO', { day:'2-digit', month:'long', year:'numeric' }) }}</span>
                </div>
              </div>
              <div class="card-actions">
                <button class="btn-receipt" @click="router.push(`/client/receipt/${job.id}`)">
                  <i class="fa-solid fa-file-invoice"></i> Recibo
                </button>
                <button class="btn-past-detail" @click="openJobDetail(job)">
                  <i class="fa-solid fa-circle-info"></i> Detalles
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>


    </main>

    <aside class="sidebar-right">
      <div class="info-card stats-card">
        <h3>Tu Resumen</h3>
        <div class="stat-row">
          <div class="stat-icon"><i class="fa-solid fa-clipboard-list"></i></div>
          <div class="stat-text">
            <strong>{{ activeRequests.length }}</strong>
            <span>Solicitudes Activas</span>
          </div>
        </div>
      </div>

      <div class="info-card action-card">
        <div class="card-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
        <h3>¿No encuentras lo que buscas?</h3>
        <p class="text-muted">Explora nuestro directorio completo de expertos.</p>
        <button @click="goToExplore" class="btn-explore-full">
          Ir al Directorio <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </aside>

  </div>
</template>

<style scoped>
/* --- ESTILOS DEL MODAL --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(11, 76, 111, 0.45);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
}

.modal-card {
  background: white; 
  padding: 40px 30px; 
  border-radius: 24px; 
  width: 90%; max-width: 400px;
  text-align: center; 
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex; flex-direction: column; align-items: center;
}

.animate-pop { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.icon-container {
  position: relative;
  width: 72px; height: 72px;
  background: #E0F2FE;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
}
.user-icon { width: 36px; color: #0B4C6F; }

.notification-dot {
  position: absolute; top: 0; right: 0;
  width: 24px; height: 24px;
  background: #F76B1C;
  color: white; font-weight: 800; font-size: 14px;
  border-radius: 50%; border: 3px solid white;
  display: flex; align-items: center; justify-content: center;
}

.modal-card h3 { margin: 0 0 12px 0; color: #1e293b; font-size: 1.5rem; font-weight: 800; }
.modal-card p { color: #64748b; margin-bottom: 32px; line-height: 1.6; font-size: 0.95rem; }
.modal-card p strong { color: #0B4C6F; }

.modal-actions { width: 100%; display: flex; flex-direction: column; gap: 12px; }

.btn-complete {
  background: #0B4C6F; color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; box-shadow: 0 4px 6px -1px rgba(11, 76, 111, 0.2);
}
.btn-complete:hover { background: #093a55; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(11, 76, 111, 0.3); }
.arrow-icon { width: 18px; }

.btn-later {
  background: transparent; border: none; padding: 10px; font-weight: 600; font-size: 0.95rem; color: #94a3b8; cursor: pointer; transition: color 0.2s;
}
.btn-later:hover { color: #64748b; }

.modal-footer-note {
  margin-top: 24px; font-size: 0.75rem; color: #F76B1C; background: #FFF7ED; padding: 8px 16px; border-radius: 20px; display: flex; align-items: center; gap: 6px; font-weight: 600;
}
.lock-icon { width: 12px; }

/* --- ESTILOS GENERALES --- */
.client-content-wrapper { display: flex; gap: 24px; width: 100%; padding-bottom: 40px; }
.feed-content { flex: 1; }
.sidebar-right { width: 300px; display: none; } 
@media (min-width: 1024px) { .sidebar-right { display: block; } }

.welcome-banner { 
  background: linear-gradient(135deg, #0B4C6F 0%, #083a55 100%); 
  padding: 30px; 
  border-radius: 12px; 
  color: white; 
  margin-bottom: 30px; 
  box-shadow: 0 4px 15px rgba(11, 76, 111, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.welcome-banner h2 { margin: 0 0 5px 0; font-size: 1.8rem; font-weight: 700; }
.welcome-banner p { margin: 0; opacity: 0.9; font-size: 1.1rem; }
.btn-primary-action {
  background: #F76B1C;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  gap: 8px;
  align-items: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.btn-primary-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(247, 107, 28, 0.3);
}

.ongoing-section { margin-bottom: 40px; }
.section-title { font-size: 1.25rem; color: #333; margin-bottom: 15px; font-weight: 700; }
.ongoing-list { display: flex; flex-direction: column; gap: 15px; }
.ongoing-card { background: white; border: 1px solid #E0F2FE; border-left: 4px solid #22C55E; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: all 0.3s ease; }
.ongoing-card.card-finalizado { border-left-color: #F76B1C; background: #FFFAF5; }
.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
.ongoing-card:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
.card-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
.job-desc-preview { margin: 2px 0 4px; font-size: 0.82rem; color: #64748B; line-height: 1.4; }
.estado-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
.badge-progreso  { background: #ECFDF5; color: #059669; }
.badge-finalizado { background: #FFF7ED; color: #D97706; box-shadow: 0 0 0 1px #FED7AA; }

/* --- JOB DETAIL MODAL --- */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);
  z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.job-modal {
  background: white; border-radius: 16px;
  width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
}
.job-modal-header {
  padding: 22px 24px; border-bottom: 1px solid #F1F5F9;
  display: flex; justify-content: space-between; align-items: flex-start;
}
.job-modal-header h3 { margin: 6px 0 0; font-size: 1.2rem; font-weight: 800; color: #0F172A; }
.job-modal-tag { font-size: 0.8rem; font-weight: 700; }
.jm-close { background: none; border: none; font-size: 1.5rem; color: #94A3B8; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
.jm-close:hover { color: #0F172A; }
.job-modal-body { padding: 24px; }
.jm-meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
.jm-meta-item { display: flex; flex-direction: column; gap: 4px; }
.jm-label { font-size: 0.72rem; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 5px; }
.jm-value { font-size: 0.95rem; font-weight: 600; color: #0F172A; }
.jm-id { font-size: 0.72rem; color: #64748B; word-break: break-all; font-family: monospace; }
.jm-desc-section { display: flex; flex-direction: column; gap: 8px; }
.jm-desc { margin: 0; font-size: 0.95rem; line-height: 1.65; color: #334155; background: #F8FAFC; border-radius: 8px; padding: 14px; border: 1px solid #E2E8F0; white-space: pre-wrap; }
.job-modal-footer { padding: 20px 24px; border-top: 1px solid #F1F5F9; display: flex; gap: 12px; }
.jm-btn-chat, .jm-btn-confirm { flex: 1; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; }
.jm-btn-chat { background: white; color: #475569; border: 1.5px solid #E2E8F0; }
.jm-btn-chat:hover { border-color: #334155; color: #0F172A; }
.jm-btn-confirm { background: #F76B1C; color: white; }
.jm-btn-confirm:hover { background: #E05A10; transform: translateY(-2px); }


.card-left { display: flex; align-items: center; gap: 15px; }
.status-indicator { width: 12px; height: 12px; border-radius: 50%; }
.status-indicator.orange { background-color: #F76B1C; box-shadow: 0 0 0 3px rgba(247, 107, 28, 0.2); }
.status-indicator.green { background-color: #22C55E; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.2); }

.req-details h4 { margin: 0 0 4px 0; font-size: 1.1rem; color: #333; font-weight: 600; }
.req-status { font-size: 0.9rem; color: #666; text-transform: capitalize; }

.btn-view-details { 
  background: white; 
  border: 1px solid #cbd5e1; 
  padding: 10px 18px; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: 700; 
  font-size: 0.9rem; 
  transition: all 0.2s ease; 
  color: #334155; 
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.btn-view-details:hover { 
  border-color: #0B4C6F; 
  color: #0B4C6F; 
  background: #F0F9FF;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(11, 76, 111, 0.1);
}

.empty-requests-box { padding: 30px 20px; background: #F8FAFC; border-radius: 10px; border: 1.5px dashed #CBD5E1; color: #64748B; text-align: center; font-weight: 500;}

.empty-state-container { text-align: center; padding: 60px; background: white; border: 1.5px dashed #cbd5e1; border-radius: 12px; }
.empty-icon-svg { width: 64px; height: 64px; margin: 0 auto 15px; }
.btn-outline { 
  margin-top: 20px; 
  padding: 12px 28px; 
  border: 2px solid #0B4C6F; 
  color: #0B4C6F; 
  background: white; 
  border-radius: 8px; 
  cursor: pointer; 
  font-weight: 700; 
  font-size: 1rem;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn-outline:hover { 
  background: #0B4C6F;
  color: white; 
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(11, 76, 111, 0.2);
}

.info-card { background: white; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);}
.info-card h3 { font-size: 1.15rem; margin-top: 0; color: #1e293b; font-weight: 800; }
.text-muted { color: #64748b; font-size: 0.95rem; line-height: 1.4; }

.action-card {
  text-align: center;
}
.action-card .card-icon {
  font-size: 2.8rem;
  color: #0B4C6F;
  margin-bottom: 16px;
  background: #E0F2FE;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin: 0 auto 16px;
}
.action-card h3 { margin-bottom: 8px; font-size: 1.1rem; }
.action-card p { margin-bottom: 20px; }

.btn-explore-full {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #0B4C6F 0%, #083a55 100%);
  border: none;
  color: white;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 10px rgba(11, 76, 111, 0.2);
}
.btn-explore-full:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(11, 76, 111, 0.35);
  background: linear-gradient(135deg, #083a55 0%, #05263a 100%);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 8px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  background: #E0F2FE;
  color: #0B4C6F;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.stat-text {
  display: flex;
  flex-direction: column;
}
.stat-text strong {
  font-size: 1.5rem;
  color: #1e293b;
  line-height: 1.2;
}
.stat-text span {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
}

/* CARDS DE PROFESIONALES DESTACADOS */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 20px;
}
.pro-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.pro-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.06);
  border-color: #cbd5e1;
}
.pro-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  border-radius: 50%;
  overflow: hidden;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pro-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pro-avatar span { font-size: 2rem; font-weight: 800; color: #94a3b8; }
.pro-info h4 { margin: 0 0 4px 0; font-size: 1.05rem; color: #1e293b; font-weight: 700; }
.pro-info p { margin: 0 0 10px 0; font-size: 0.9rem; color: #64748b; text-transform: capitalize; }
.pro-rating { display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; color: #475569; font-size: 0.95rem; }

/* --- TRABAJOS PASADO --- */
.past-jobs-section { margin-bottom: 32px; }
.past-jobs-toggle {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; background: white;
  border: 1.5px solid #E2E8F0; border-radius: 10px;
  cursor: pointer; font-family: inherit; transition: 0.2s;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
}
.past-jobs-toggle:hover { border-color: #CBD5E1; background: #F8FAFC; }
.past-jobs-toggle-left { display: flex; align-items: center; gap: 10px; font-size: 1rem; font-weight: 700; color: #334155; }
.past-jobs-toggle-left i { color: #94A3B8; }
.past-count { background: #F1F5F9; color: #64748B; font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: 20px; }
.chevron-icon { color: #94A3B8; font-size: 0.85rem; transition: 0.2s; }
.past-jobs-list { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; overflow: hidden; }
.past-job-card {
  background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;
  padding: 16px 18px; display: flex; justify-content: space-between; align-items: center; gap: 12px;
}
.past-job-left { display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0; }
.past-done-icon { color: #22C55E; font-size: 1.4rem; flex-shrink: 0; }
.past-job-info h4 { margin: 0 0 2px; font-size: 0.95rem; font-weight: 700; color: #1E293B; }
.past-job-desc { margin: 0 0 2px; font-size: 0.8rem; color: #64748B; }
.past-job-date { font-size: 0.75rem; color: #94A3B8; font-weight: 500; }
.btn-receipt {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  background: #F0F9FF; border: 1.5px solid #0B4C6F; border-radius: 8px;
  font-weight: 700; font-size: 0.82rem; color: #0B4C6F; cursor: pointer; transition: 0.2s;
}
.btn-receipt:hover {
  background: #0B4C6F; color: white; transform: translateY(-2px);
}
.btn-past-detail { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: white; border: 1.5px solid #E2E8F0; border-radius: 8px; font-weight: 700; font-size: 0.82rem; color: #475569; cursor: pointer; transition: 0.2s; flex-shrink: 0; }
.btn-past-detail:hover { border-color: #0B4C6F; color: #0B4C6F; background: #F0F9FF; }

.card-actions-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}
.btn-action-outline {
  padding: 6px 12px;
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: .2s;
}
.btn-action-outline:hover { background: #F8FAFC; border-color: #CBD5E1; }
.btn-confirm-pro {
  padding: 6px 14px;
  background: #3B82F6;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: .2s;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.2);
}
.btn-confirm-pro:hover { background: #2563EB; transform: translateY(-1px); }
.btn-confirm-pro:disabled { opacity: 0.7; cursor: not-allowed; }
.text-red-600 { color: #EF4444 !important; border-color: #FEE2E2 !important; }
.text-red-600:hover { background: #FEF2F2 !important; }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s ease; max-height: 600px; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; max-height: 0; }

/* RESPONSIVE */
@media (max-width: 768px) {
  .welcome-banner { flex-direction: column; text-align: center; gap: 20px; padding: 24px 20px; }
  .welcome-banner h2 { font-size: 1.5rem; }
  .btn-primary-action { width: 100%; justify-content: center; }
  
  .ongoing-card { flex-direction: column; align-items: stretch; gap: 15px; }
  .card-left { align-items: flex-start; }
  .btn-view-details { width: 100%; justify-content: center; }
  
  .empty-state-container { padding: 40px 20px; }
  .services-grid { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .welcome-banner h2 { font-size: 1.3rem; }
  .stat-row { flex-direction: column; text-align: center; padding: 20px; }
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
.app-toast--success { background: #0F172A; color: white; border: 1px solid #1E293B; }
.app-toast--success i { color: #10B981; }
.app-toast--error { background: #DC2626; color: white; border: none; box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3); }
.app-toast--error i { color: white; }
.app-toast span { flex: 1; }
.toast-close { background: none; border: none; color: inherit; opacity: 0.6; cursor: pointer; font-size: 1.2rem; padding: 0; margin-left: 4px; }
.toast-close:hover { opacity: 1; }
.toast-slide-enter-active, .toast-slide-leave-active { transition: all 0.35s ease; }
.toast-slide-enter-from, .toast-slide-leave-to { opacity: 0; transform: translateX(-50%) translateY(16px); }

/* ===== COTIZACIÓN INLINE BANNER ===== */
.cotizacion-inline-banner {
  background: linear-gradient(135deg, #F0FDF4, #DCFCE7);
  border: 1.5px solid #86EFAC;
  border-radius: 12px;
  overflow: hidden;
  animation: slideIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.cib-header {
  background: linear-gradient(90deg, #16A34A, #15803D);
  color: white;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
}
.cib-badge {
  background: #FEF9C3;
  color: #92400E;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 2px 8px;
  border-radius: 20px;
  margin-left: auto;
  animation: pulse-badge 1.5s infinite;
}
@keyframes pulse-badge { 0%,100%{box-shadow:0 0 0 0 rgba(250,204,21,.4)}50%{box-shadow:0 0 0 5px rgba(250,204,21,0)} }
.cib-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
.cib-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.cib-label { font-size: 0.72rem; font-weight: 700; color: #15803D; text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0; }
.cib-value { font-size: 0.88rem; color: #166534; font-weight: 500; text-align: right; }
.cib-amount { font-size: 1.4rem; font-weight: 900; color: #14532D; letter-spacing: -0.5px; }
.cib-actions { margin-top: 8px; }
.cib-btn-accept {
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #16A34A, #15803D);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}
.cib-btn-accept:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(22, 163, 74, 0.4);
  background: linear-gradient(135deg, #15803D, #166534);
}
.cib-btn-accept:disabled { background: #D1D5DB; cursor: not-allowed; box-shadow: none; }
.pro-confirmation-box {
   background: #f8fafc;
   border: 1px solid #e2e8f0;
   border-radius: 12px;
   padding: 12px;
   display: flex;
   flex-direction: column;
   gap: 12px;
   margin-top: 10px;
 }
 .pro-mini-profile {
   display: flex;
   align-items: center;
   gap: 10px;
 }
 .pro-mini-avatar {
   width: 40px;
   height: 40px;
   border-radius: 50%;
   object-fit: cover;
   border: 2px solid #fff;
   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
 }
 .pro-mini-info {
   display: flex;
   flex-direction: column;
 }
 .pro-name {
   font-weight: 600;
   font-size: 14px;
   color: #1e293b;
 }
 .pro-label {
   font-size: 12px;
   color: #64748b;
 }
 .btn-confirm-pro {
   background: #2563eb;
   color: white;
   border: none;
   padding: 10px;
   border-radius: 8px;
   font-weight: 600;
   cursor: pointer;
   display: flex;
   align-items: center;
   justify-content: center;
   gap: 8px;
   transition: all 0.2s;
 }
 .btn-confirm-pro:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
 .btn-confirm-pro:disabled { opacity: 0.7; cursor: not-allowed; }
 </style>
