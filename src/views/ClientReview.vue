<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js';

const route = useRoute();
const router = useRouter();
const { state } = useUserSession();

const isLoading = ref(false);
const showSuccess = ref(false);
const errorMessage = ref('');
const trabajoInfo = ref({ titulo: '', profesional_nombre: '' });

const fetchWorkDetails = async () => {
  const trabajoId = route.params.id;
  const profesionalId = route.query.ref;
  if (!trabajoId || !profesionalId) return;

  try {
    // 1. Obtener info del trabajo (para el título)
    const resTrabajo = await axios.get(`http://localhost:3003/api/trabajos/${trabajoId}`);
    if (resTrabajo.data) {
      trabajoInfo.value.titulo = resTrabajo.data.titulo;
    }

    // 2. Obtener info del profesional (para el nombre)
    const resProf = await axios.get(`http://localhost:3001/api/profesionales/${profesionalId}`);
    if (resProf.data) {
      trabajoInfo.value.profesional_nombre = resProf.data.nombre;
    }
  } catch (err) {
    console.error("Error cargando detalles para reseña:", err);
  }
};

onMounted(() => {
  fetchWorkDetails();
});

const form = ref({
  calificacion: 5,
  comentario: ''
});

const hoverRating = ref(0);
const setHoverRating = (rating) => hoverRating.value = rating;
const leaveHoverRating = () => hoverRating.value = 0;
const setRating = (rating) => form.value.calificacion = rating;

const submitReview = async () => {
  if (!form.value.calificacion) {
    errorMessage.value = "Por favor selecciona una calificación.";
    return;
  }
  
  if (form.value.comentario.trim() === '') {
    errorMessage.value = "Por favor deja un comentario.";
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';

  const trabajoId = route.params.id;
  const profesionalId = route.query.ref; // Pasado por la URL

  try {
    const res = await axios.post(`http://localhost:3003/api/trabajos/${trabajoId}/resena`, {
      cliente_id: state.user.id,
      profesional_id: profesionalId,
      calificacion: form.value.calificacion,
      comentario: form.value.comentario
    });

    if (res.data.success) {
      showSuccess.value = true;
      setTimeout(() => {
        router.push('/client/dashboard');
      }, 3000);
    }
  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
       errorMessage.value = err.response.data.error;
    } else {
       errorMessage.value = "Ocurrió un error al enviar la reseña. Por favor intenta de nuevo.";
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="review-wrapper">
    <div class="review-container" v-if="!showSuccess">
      <div class="review-header">
        <div class="header-icon">
          <i class="fa-solid fa-star"></i>
        </div>
        <h2>Califica el Servicio</h2>
        
        <!-- Contexto del Trabajo -->
        <div class="review-context-box" v-if="trabajoInfo.profesional_nombre || trabajoInfo.titulo">
          <div class="context-item">
            <span class="context-label">Profesional</span>
            <span class="context-value">{{ trabajoInfo.profesional_nombre || 'Cargando...' }}</span>
          </div>
          <div class="context-divider"></div>
          <div class="context-item">
            <span class="context-label">Servicio</span>
            <span class="context-value">{{ trabajoInfo.titulo || 'Cargando...' }}</span>
          </div>
        </div>

        <p v-else>Tu opinión ayuda a otros a encontrar a los mejores profesionales en ServiHub.</p>
      </div>

      <div class="error-banner" v-if="errorMessage">
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>{{ errorMessage }}</span>
      </div>

      <div class="rating-section">
        <label>¿Qué te pareció el trabajo realizado?</label>
        <div class="stars-container" @mouseleave="leaveHoverRating">
          <button 
            v-for="star in 5" 
            :key="star"
            class="star-btn"
            :class="{ active: star <= (hoverRating || form.calificacion) }"
            @mouseover="setHoverRating(star)"
            @click="setRating(star)"
          >
            <i class="fa-solid fa-star"></i>
          </button>
        </div>
        <div class="rating-text">
          <span v-if="(hoverRating || form.calificacion) === 1">Muy Malo</span>
          <span v-if="(hoverRating || form.calificacion) === 2">Malo</span>
          <span v-if="(hoverRating || form.calificacion) === 3">Regular</span>
          <span v-if="(hoverRating || form.calificacion) === 4">Muy Bueno</span>
          <span v-if="(hoverRating || form.calificacion) === 5">¡Excelente!</span>
        </div>
      </div>

      <div class="input-group">
        <label>Cuéntanos un poco más sobre la experiencia</label>
        <textarea 
          v-model="form.comentario" 
          placeholder="Escribe tu opinión sobre el Profesional (ej. Llegó a tiempo, resolvió el problema rápido, etc.)"
          rows="5"
        ></textarea>
      </div>

      <div class="actions">
        <button class="btn-cancel" @click="router.push('/client/dashboard')">Omitir</button>
        <button class="btn-submit" @click="submitReview" :disabled="isLoading">
          <span v-if="isLoading" class="spinner"></span>
          <span v-else>Enviar Reseña</span>
        </button>
      </div>
    </div>

    <!-- PANTALLA DE ÉXITO -->
    <div class="success-card animate-pop" v-else>
      <div class="success-icon">
        <i class="fa-solid fa-check"></i>
      </div>
      <h2>¡Gracias por tu reseña!</h2>
      <p>Has ayudado a construir una comunidad más confiable. El pago ha sido completado y liberado al profesional.</p>
      <div class="redirect-hint">Redirigiendo a tu panel...</div>
    </div>
  </div>
</template>

<style scoped>
.review-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 80px);
  padding: 40px 20px;
}

.review-container {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  padding: 40px;
  border: 1px solid #E2E8F0;
}

.review-header {
  text-align: center;
  margin-bottom: 30px;
}

.header-icon {
  width: 64px;
  height: 64px;
  background: #FFF7ED;
  color: #F76B1C;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin: 0 auto 16px;
  box-shadow: 0 4px 12px rgba(247,107,28,0.2);
}

.review-header h2 {
  color: #0F172A;
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.review-header p {
  color: #64748B;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Caja de Contexto Premium */
.review-context-box {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  display: flex;
  margin: 15px 0;
  padding: 12px;
  text-align: left;
}
.context-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 10px;
}
.context-divider {
  width: 1px;
  background: #E2E8F0;
  margin: 5px 0;
}
.context-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94A3B8;
  font-weight: 700;
  margin-bottom: 2px;
}
.context-value {
  font-size: 0.9rem;
  color: #1E293B;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.error-banner {
  background: #FEF2F2;
  color: #EF4444;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 20px;
}

.rating-section {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 30px;
  border-bottom: 1px solid #F1F5F9;
}

.rating-section label {
  display: block;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 16px;
}

.stars-container {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.star-btn {
  background: transparent;
  border: none;
  font-size: 2.2rem;
  color: #E2E8F0;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.star-btn:hover {
  transform: scale(1.15);
}

.star-btn.active {
  color: #FBBF24;
  filter: drop-shadow(0 2px 8px rgba(251,191,36,0.4));
}

.rating-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: #F76B1C;
  height: 20px;
}

.input-group label {
  display: block;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.input-group textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #CBD5E1;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.95rem;
  color: #1E293B;
  resize: vertical;
  transition: all 0.2s;
  background: #F8FAFC;
}

.input-group textarea:focus {
  outline: none;
  border-color: #F76B1C;
  background: white;
  box-shadow: 0 0 0 3px rgba(247,107,28,0.1);
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 30px;
}

.btn-cancel {
  flex: 1;
  background: white;
  border: 1px solid #CBD5E1;
  color: #475569;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #F1F5F9;
  color: #1E293B;
}

.btn-submit {
  flex: 2;
  background: linear-gradient(135deg, #F76B1C, #c95210);
  border: none;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 10px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(247,107,28,0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(247,107,28,0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* SUCCESS CARD */
.success-card {
  background: white;
  width: 100%;
  max-width: 440px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  padding: 50px 40px;
  text-align: center;
  border: 1px solid #E2E8F0;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: #DCFCE7;
  color: #16A34A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.2rem;
  margin: 0 auto 24px;
  box-shadow: 0 0 0 10px #F0FDF4;
}

.success-card h2 {
  color: #0F172A;
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 12px;
}

.success-card p {
  color: #64748B;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 24px;
}

.redirect-hint {
  font-size: 0.85rem;
  color: #94A3B8;
  font-weight: 600;
  animation: pulse-txt 1.5s infinite;
}

@keyframes pulse-txt {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.animate-pop { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
