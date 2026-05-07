<script setup>
import { API_URLS, SOCKET_URL } from '../config.js';

import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js';

const { state } = useUserSession();

const isLoading = ref(false);
const toast = ref({ show: false, message: '', type: 'success' });

const form = ref({
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  bankAccount: '',
  bankName: ''
});

// --- FORMATEO AUTOMÁTICO (MASKS) ---
const handleCardInput = (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length > 16) val = val.substring(0, 16);
  const groups = val.match(/.{1,4}/g);
  form.value.cardNumber = groups ? groups.join(' ') : val;
};

const handleExpiryInput = (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length > 4) val = val.substring(0, 4);
  if (val.length > 2) {
    form.value.cardExpiry = val.substring(0, 2) + '/' + val.substring(2);
  } else {
    form.value.cardExpiry = val;
  }
};

const handleCvcInput = (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length > 4) val = val.substring(0, 4);
  form.value.cardCvc = val;
};

const handleBankAccInput = (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length > 20) val = val.substring(0, 20);
  form.value.bankAccount = val;
};

const loadData = async () => {
  try {
    const res = await axios.get(`${API_URLS.PERFILES}/api/profesionales/${state.user.id}/financiero`);
    if (res.data) {
      form.value.bankAccount = res.data.cuenta_bancaria || '';
      form.value.bankName = res.data.banco || '';
      // Si ya hay un token, podríamos mostrar que la tarjeta está vinculada (ej: **** **** **** 4242)
      if (res.data.stripe_card_token) {
        form.value.cardNumber = '**** **** **** ' + res.data.stripe_card_token.slice(-4);
      }
    }
  } catch (error) {
    console.error("Error cargando datos financieros", error);
  }
};

onMounted(() => {
  loadData();
});

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type };
  setTimeout(() => toast.value.show = false, 4000);
};

const saveFinancialData = async () => {
  const rawCard = form.value.cardNumber.replace(/\s/g, '');
  const rawExpiry = form.value.cardExpiry.replace('/', '');
  
  if (!rawCard || rawCard.length < 15) {
    showToast('El número de tarjeta no es válido', 'error');
    return;
  }
  if (!rawExpiry || rawExpiry.length < 4) {
    showToast('La fecha de vencimiento debe ser MM/AA', 'error');
    return;
  }
  if (!form.value.cardCvc || form.value.cardCvc.length < 3) {
    showToast('El CVC debe tener al menos 3 dígitos', 'error');
    return;
  }
  if (!form.value.bankAccount || form.value.bankAccount.length < 8) {
    showToast('Ingresa un número de cuenta válido', 'error');
    return;
  }
  if (!form.value.bankName) {
    showToast('Selecciona tu banco', 'error');
    return;
  }

  isLoading.value = true;
  try {
    // Aquí simulamos la tokenización de Stripe en frontend
    const simulatedToken = 'tok_' + Math.random().toString(36).substr(2, 9) + form.value.cardNumber.slice(-4);

    // Enviar a tu backend para guardar
    await axios.put(`${API_URLS.PERFILES}/api/profesionales/${state.user.id}/financiero`, {
      stripe_card_token: simulatedToken,
      cuenta_bancaria: form.value.bankAccount,
      banco: form.value.bankName
    });
    
    showToast('Datos financieros guardados con éxito', 'success');
    
    // Recargar la página después de 1 segundo para que desaparezca el modal de bloqueo si existía
    setTimeout(() => {
        window.location.href = '/professional/dashboard';
    }, 1200);
    
  } catch (error) {
    console.error(error);
    showToast('Ocurrió un error al guardar los datos', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div>
    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="toast.show" :class="['form-msg', toast.type === 'success' ? 'success' : 'error']" style="position:fixed; top:20px; left:50%; transform:translateX(-50%); z-index:9999; min-width: 300px; text-align:center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>

    <div class="panel-title-row" style="margin-bottom: 2rem;">
      <div>
        <h2>Configuración de Pagos</h2>
        <p>Gestiona cómo cobras tus servicios y cómo pagas las comisiones de la plataforma.</p>
      </div>
    </div>

    <form @submit.prevent="saveFinancialData" class="cfg-form">
      
      <!-- SECCIÓN: Tarjeta para comisiones (Obligatoria) -->
      <div class="field-group" style="background:#f8fafc; padding:1.5rem; border-radius:12px; border:1px solid #e2e8f0; margin-bottom: 1.5rem;">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div style="width:40px; height:40px; border-radius:50%; background:#dbeafe; color:#2563eb; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
            <i class="fa-solid fa-credit-card"></i>
          </div>
          <div>
            <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:#1e293b;">Tarjeta de Comisiones <span style="color:#ef4444">*</span></h3>
            <p style="margin:0; font-size:0.85rem; color:#64748b;">Usada automáticamente para cobrar el 15% de comisión por trabajo.</p>
          </div>
        </div>

        <div class="field-group" style="margin-bottom:1rem;">
          <label>Número de Tarjeta</label>
          <input 
            v-model="form.cardNumber" 
            type="text" 
            placeholder="0000 0000 0000 0000" 
            @input="handleCardInput"
            maxlength="19"
            required
          >
        </div>
        <div class="two-col">
          <div class="field-group">
            <label>Vencimiento</label>
            <input 
              v-model="form.cardExpiry" 
              type="text" 
              placeholder="MM/AA" 
              @input="handleExpiryInput"
              maxlength="5"
              required
            >
          </div>
          <div class="field-group">
            <label>CVC</label>
            <input 
              v-model="form.cardCvc" 
              type="text" 
              placeholder="123" 
              @input="handleCvcInput"
              maxlength="4"
              required
            >
          </div>
        </div>
      </div>

      <!-- SECCIÓN: Cuenta Bancaria (Para recibir pagos) -->
      <div class="field-group" style="background:#ecfdf5; padding:1.5rem; border-radius:12px; border:1px solid #d1fae5; margin-bottom: 2rem;">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
          <div style="width:40px; height:40px; border-radius:50%; background:#d1fae5; color:#059669; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
            <i class="fa-solid fa-building-columns"></i>
          </div>
          <div>
            <h3 style="margin:0; font-size:1.05rem; font-weight:700; color:#1e293b;">Cuenta de Depósito <span style="color:#ef4444">*</span></h3>
            <p style="margin:0; font-size:0.85rem; color:#64748b;">A dónde enviaremos tu dinero en pagos por transferencia o Split.</p>
          </div>
        </div>

        <div class="two-col">
          <div class="field-group">
            <label>Banco</label>
            <select v-model="form.bankName" required>
              <option value="" disabled>Selecciona un banco</option>
              <option value="Banreservas">Banreservas</option>
              <option value="Banco Popular">Banco Popular Dominicano</option>
              <option value="BHD">Banco BHD</option>
            </select>
          </div>
          <div class="field-group">
            <label>Número de Cuenta</label>
            <input 
              v-model="form.bankAccount" 
              type="text" 
              placeholder="0000000000" 
              @input="handleBankAccInput"
              required
            >
          </div>
        </div>
      </div>

      <!-- ACCIONES -->
      <div style="display:flex; justify-content:flex-end;">
        <button type="submit" class="btn-primary" :disabled="isLoading" style="min-width:200px; display:flex; gap:8px; align-items:center; justify-content:center;">
          <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin"></i>
          <i v-else class="fa-solid fa-shield-halved"></i>
          {{ isLoading ? 'Guardando...' : 'Guardar Datos Financieros' }}
        </button>
      </div>

    </form>
  </div>
</template>

<style scoped>
/* ─── FORM ──── */
.cfg-form { display: flex; flex-direction: column; gap: 20px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-group label { font-size: 0.78rem; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.07em; }
.field-group input, .field-group select { padding: 11px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 0.93rem; font-family: inherit; color: #1E293B; background: white; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
.field-group input:focus, .field-group select:focus { border-color: #475569; background: white; outline: none; box-shadow: 0 0 0 3px rgba(71,85,105,0.1); }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* ─── BOTONES ──── */
.btn-primary { display: inline-flex; align-items: center; gap: 6px; background: #1E293B; color: white; border: none; padding: 11px 22px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: 0.18s; justify-content: center;}
.btn-primary:hover { background: #0F172A; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

/* ─── TÍTULOS ──── */
.panel-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #F1F5F9; flex-wrap: wrap; gap: 12px; }
.panel-title-row h2 { font-size: 1.1rem; font-weight: 800; color: #0F172A; margin: 0 0 4px; }
.panel-title-row p { font-size: 0.85rem; color: #94A3B8; margin: 0; }

/* ─── FEEDBACK ──── */
.form-msg { padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; }
.form-msg.success { background: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; }
.form-msg.error   { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }

/* Transición suave para el toast */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .two-col { grid-template-columns: 1fr; }
}
</style>
