<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { useUserSession } from '../composables/useUserSession.js';
import { API_URLS } from '../config.js';

const props = defineProps({
  trabajo_id: { type: [String, Number], required: true },
  monto_total: { type: [String, Number], default: 0 },
  metodo_pago: { type: String, default: 'EFECTIVO' },
  profesional_id: { type: [String, Number], required: true }
});

const emit = defineEmits(['close', 'success']);
const { state } = useUserSession();

const isLoading = ref(false);
const isLoadingAmount = ref(true);
const toast = ref({ show: false, message: '', type: 'success' });
const bankData = ref(null);
const fileInput = ref(null);
const selectedFile = ref(null);

// ─── MONTO AUTORIZADO DESDE BACKEND ──────────────────────────────
const resolvedMonto = ref(0);

const getMethodIcon = (m) => {
  if (m === 'TRANSFERENCIA') return 'fa-solid fa-building-columns';
  if (m === 'TARJETA_CREDITO' || m === 'TARJETA') return 'fa-solid fa-credit-card';
  return 'fa-solid fa-money-bill-wave';
};

const formatPaymentMethod = (m) => {
  if (m === 'TRANSFERENCIA') return 'Transferencia Bancaria';
  if (m === 'TARJETA_CREDITO' || m === 'TARJETA') return 'Tarjeta de Crédito';
  return 'Efectivo';
};

// Tarjetas
const cards = ref([]);
const selectedCardId = ref(null);
const newCardBrand = ref('Visa');
const newCardHolder = ref('');
const newCardNumber = ref('');
const newCardExpiry = ref('');
const newCardCVV = ref('');
const isAddingCard = ref(false);

const localMetodoPago = ref(String(props.metodo_pago || 'EFECTIVO').toUpperCase());
const normalizedMetodoPago = computed(() => {
  const m = localMetodoPago.value;
  if (m === 'TARJETA') return 'TARJETA_CREDITO';
  return m;
});

// Watch for method changes to load necessary data
watch(normalizedMetodoPago, (newVal) => {
  if (newVal === 'TARJETA_CREDITO' && cards.value.length === 0) {
    loadCards();
  }
  if (newVal === 'TRANSFERENCIA' && !bankData.value) {
    loadBankData();
  }
});

// ─── FORMATEO DE TARJETA ──────────────────────────────────────
const formatCardNumber = (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length > 16) val = val.substring(0, 16);
  newCardNumber.value = val.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const formatExpiry = (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length > 4) val = val.substring(0, 4);
  if (val.length >= 3) {
    newCardExpiry.value = val.substring(0, 2) + '/' + val.substring(2);
  } else {
    newCardExpiry.value = val;
  }
};

const formatCVV = (e) => {
  let val = e.target.value.replace(/\D/g, '');
  if (val.length > 3) val = val.substring(0, 3);
  newCardCVV.value = val;
};

const loadBankData = async () => {
  try {
    const res = await axios.get(`${API_URLS.PERFILES}/api/profesionales/${props.profesional_id}/financiero`);
    bankData.value = res.data;
  } catch (error) {
    console.error("No se pudo obtener la cuenta del profesional", error);
  }
};

const manualMonto = ref('');
const montoAPagar = computed(() => {
  // Priority 1: resolved from backend
  if (resolvedMonto.value > 0) return resolvedMonto.value;
  // Priority 2: prop from parent
  const propAmount = Number(props.monto_total);
  if (propAmount > 0) return propAmount;
  // Priority 3: manual input
  const manual = Number(manualMonto.value);
  return Number.isFinite(manual) ? manual : 0;
});

const montoAPagarLabel = computed(() =>
  montoAPagar.value.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
);

const showToast = (message, type = 'error') => {
  toast.value = { show: true, message, type };
  setTimeout(() => toast.value.show = false, 4000);
};

const loadCards = async () => {
  if (!state.user?.id) return;
  try {
    const res = await axios.get(`${API_URLS.PAGOS}/api/settings/payments/${state.user.id}`);
    if (res.data.success) {
      cards.value = res.data.data;
      if (cards.value.length > 0) {
        selectedCardId.value = cards.value[0].id;
      }
    }
  } catch (error) {
    console.error("Error cargando tarjetas", error);
  }
};

const agregarTarjeta = async () => {
  if (!newCardHolder.value || !newCardNumber.value || !newCardExpiry.value || !newCardCVV.value) {
    showToast("Por favor completa todos los datos de la tarjeta");
    return;
  }
  
  isAddingCard.value = true;
  try {
    const cleanNumber = newCardNumber.value.replace(/\s/g, '');
    const res = await axios.post(`${API_URLS.PAGOS}/api/settings/payments`, {
      usuario_id: state.user.id,
      brand: newCardBrand.value,
      holder_name: newCardHolder.value,
      card_number: cleanNumber,
      last4: cleanNumber.slice(-4),
      token: `local-card-${Date.now()}`,
      exp: newCardExpiry.value,
      cvv: newCardCVV.value
    });
    
    if (res.data.success) {
      showToast("Tarjeta agregada con éxito", "success");
      newCardHolder.value = '';
      newCardNumber.value = '';
      newCardExpiry.value = '';
      newCardCVV.value = '';
      await loadCards();
    }
  } catch (error) {
    const msg = error.response?.data?.error || "Error al agregar tarjeta";
    showToast(msg);
  } finally {
    isAddingCard.value = false;
  }
};

// ─── CARGA INICIAL ────────────────────────────────────────────────
onMounted(async () => {
  isLoadingAmount.value = true;

  // 1. Fetch the job directly to get monto_acordado
  try {
    const jobRes = await axios.get(`${API_URLS.TRABAJOS}/api/trabajos/${props.trabajo_id}`);
    if (jobRes.data && Number(jobRes.data.monto_acordado) > 0) {
      resolvedMonto.value = Number(jobRes.data.monto_acordado);
      // Also sync the payment method if not set
      if (jobRes.data.metodo_pago && localMetodoPago.value === 'EFECTIVO') {
        localMetodoPago.value = String(jobRes.data.metodo_pago).toUpperCase();
      }
    }
  } catch (e) { console.error('Error fetching job', e); }

  // 2. Check for accepted cotizacion (takes priority over job amount)
  try {
    const cotRes = await axios.get(`${API_URLS.TRABAJOS}/api/cotizaciones/trabajo/${props.trabajo_id}`);
    if (cotRes.data && Number(cotRes.data.monto_total) > 0) {
      resolvedMonto.value = Number(cotRes.data.monto_total);
      // Also sync payment method from cotizacion
      if (cotRes.data.metodo_pago) {
        localMetodoPago.value = String(cotRes.data.metodo_pago).toUpperCase();
      }
    }
  } catch (e) { console.error('Error fetching cotizacion', e); }

  isLoadingAmount.value = false;

  // 3. Load bank data if transfer method
  if (normalizedMetodoPago.value === 'TRANSFERENCIA') {
    await loadBankData();
  }
  
  if (normalizedMetodoPago.value === 'TARJETA_CREDITO') {
    await loadCards();
  }
});


const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      showToast('El archivo debe pesar menos de 5MB');
      return;
    }
    selectedFile.value = file;
  }
};

const confirmarFinalizacion = async () => {
  if (normalizedMetodoPago.value === 'TRANSFERENCIA' && !selectedFile.value) {
    showToast('Debes subir el comprobante de transferencia');
    return;
  }

  if (normalizedMetodoPago.value === 'TARJETA_CREDITO' && !selectedCardId.value) {
    showToast('Debes seleccionar o agregar una tarjeta de crédito');
    return;
  }

  if (montoAPagar.value <= 0) {
    showToast('No se puede liberar un pago de RD$ 0.00. Contacta al soporte o al profesional para acordar el precio.');
    return;
  }

  isLoading.value = true;
  try {
    let comprobanteUrl = null;

    // 1. SUBIR COMPROBANTE SI ES TRANSFERENCIA
    if (normalizedMetodoPago.value === 'TRANSFERENCIA' && selectedFile.value) {
      const formData = new FormData();
      formData.append('comprobante', selectedFile.value);
      const uploadRes = await axios.post(`${API_URLS.TRABAJOS}/api/trabajos/upload-comprobante`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      comprobanteUrl = uploadRes.data.url;
    }
    
    // 2. FINALIZAR TRABAJO
    const res = await axios.post(`${API_URLS.TRABAJOS}/api/trabajos/${props.trabajo_id}/finalizar`, {
      monto_final: montoAPagar.value,
      metodo_pago_real: normalizedMetodoPago.value,
      tarjeta_id: selectedCardId.value,
      comprobante_url: comprobanteUrl
    });
    
    if (res.data.success) {
      if (res.data.estado === 'ESPERANDO_CONFIRMACION_TRANSFERENCIA') {
        showToast('Comprobante enviado correctamente. El profesional debe verificarlo para completar el trabajo.', 'success');
      } else {
        showToast('¡Trabajo finalizado con éxito!', 'success');
      }
      
      // Cerramos y recargamos el dashboard tras un breve delay
      setTimeout(() => {
        emit('success');
        // Redirección forzada para asegurar que sale de cualquier sub-modal o estado
        const role = localStorage.getItem('usuario_rol');
        if (role === 'cliente') window.location.href = '/client/dashboard';
        else if (role === 'profesional') window.location.href = '/professional/dashboard';
      }, 2500);
    }
  } catch (error) {
    console.error(error);
    const msg = error.response?.data?.error || 'Ocurrió un error al procesar el pago o la finalización.';
    showToast(msg);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="payment-overlay">
    
    <!-- Toast local -->
    <div v-if="toast.show" 
         :class="['local-toast-card animate-pop', toast.type === 'success' ? 'toast-success' : 'toast-error']">
      <i :class="toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'"></i>
      {{ toast.message }}
    </div>

    <div class="payment-card animate-pop">
      <!-- Header -->
      <div class="payment-header">
        <div>
          <h3>Confirmar y Liberar Pago</h3>
          <p class="header-subtitle">Completa los detalles para finalizar el trabajo</p>
        </div>
        <button @click="$emit('close')" class="payment-close">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="payment-body">
        
        <!-- Payment Method Selector (Only if not fixed, i.e. EFECTIVO or empty) -->
        <div class="method-selector-section" v-if="normalizedMetodoPago === 'EFECTIVO'">
          <label class="section-label">Método de pago
</label>
          <div class="method-options">
            <button type="button" class="method-btn" :class="{ 'active': localMetodoPago === 'EFECTIVO' }" @click="localMetodoPago = 'EFECTIVO'">
              <i class="fa-solid fa-money-bill-wave"></i><span>Efectivo</span>
            </button>
            <button type="button" class="method-btn" :class="{ 'active': localMetodoPago === 'TRANSFERENCIA' }" @click="localMetodoPago = 'TRANSFERENCIA'">
              <i class="fa-solid fa-building-columns"></i><span>Transferencia</span>
            </button>
            <button type="button" class="method-btn" :class="{ 'active': localMetodoPago === 'TARJETA_CREDITO' || localMetodoPago === 'TARJETA' }" @click="localMetodoPago = 'TARJETA_CREDITO'">
              <i class="fa-solid fa-credit-card"></i><span>Tarjeta</span>
            </button>
          </div>
        </div>
        <div v-else class="fixed-method-banner">
          <div class="method-badge">
            <i :class="getMethodIcon(normalizedMetodoPago)"></i>
            <span>Pago por {{ formatPaymentMethod(normalizedMetodoPago) }}</span>
          </div>
        </div>
        
        <!-- Total Banner -->
        <div class="payment-total">
          <p>Monto a pagar al Profesional</p>
          
          <!-- Loading state -->
          <div v-if="isLoadingAmount" class="amount-loading">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Cargando monto...</span>
          </div>

          <!-- Monto resuelto -->
          <div v-else-if="montoAPagar > 0" class="amount-display">
            RD$ {{ montoAPagarLabel }}
          </div>

          <!-- Sin monto: entrada manual -->
          <div v-else class="manual-amount-box">
            <span class="currency-prefix">RD$</span>
            <input 
              v-model="manualMonto" 
              type="number" 
              placeholder="0.00" 
              class="manual-input"
              min="1"
            />
          </div>
          <p v-if="!isLoadingAmount && montoAPagar <= 0" class="input-hint">El trabajo no tenía un monto definido. Por favor ingresa el monto total acordado.</p>
        </div>

        <!-- CONDICIONAL: Si es transferencia -->
        <div v-if="normalizedMetodoPago === 'TRANSFERENCIA'" class="transfer-section">
          <div class="bank-data-card">
            <h4 class="bank-data-title">Datos Bancarios del Profesional</h4>
            <div v-if="bankData" class="bank-data-list">
              <div class="bank-data-item">
                <span class="bank-data-label">Banco:</span>
                <span class="bank-data-value">{{ bankData.banco || 'No especificado' }}</span>
              </div>
              <div class="bank-data-item">
                <span class="bank-data-label">Titular:</span>
                <span class="bank-data-value">{{ bankData.nombre || 'Profesional' }}</span>
              </div>
              <div class="bank-data-item">
                <span class="bank-data-label">Cuenta:</span>
                <span class="bank-data-value">{{ bankData.cuenta_bancaria }}</span>
              </div>
            </div>
            <div v-else class="loading-bank-data">Cargando datos bancarios...</div>
          </div>

          <div class="upload-section">
            <label class="upload-label">Comprobante de Pago <span class="required-asterisk">*</span></label>
            <div class="upload-container">
              <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*,.pdf" class="file-input-hidden" />
              <button type="button" @click="$refs.fileInput.click()" class="upload-button">
                <div class="upload-icon-circle">
                  <i class="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <span v-if="!selectedFile" class="upload-text">Haz clic para subir el comprobante</span>
                <span v-else class="upload-success-text">
                  <i class="fa-solid fa-file-check"></i> {{ selectedFile.name }}
                </span>
              </button>
            </div>
          </div>
        </div>

                <!-- CONDICIONAL: Si es Tarjeta -->
        <div v-else-if="normalizedMetodoPago === 'TARJETA_CREDITO'" class="credit-card-module">
          <div v-if="cards.length > 0" class="cards-grid">
            <p class="section-subtitle">Tus tarjetas guardadas</p>
            <div 
              v-for="c in cards" 
              :key="c.id" 
              class="card-option"
              :class="{ 'selected': selectedCardId === c.id }"
              @click="selectedCardId = c.id"
            >
              <div class="card-option-header">
                <i :class="['fa-brands', `fa-cc-${c.brand.toLowerCase()}`]"></i>
                <div class="card-radio">
                  <div class="radio-inner" v-if="selectedCardId === c.id"></div>
                </div>
              </div>
              <div class="card-option-number">**** **** **** {{ c.last4 }}</div>
              <div class="card-option-footer">
                <span>Vence: {{ c.exp }}</span>
                <span class="card-brand-name">{{ c.brand }}</span>
              </div>
            </div>
          </div>
          
          <div v-else class="no-cards-empty">
            <i class="fa-solid fa-credit-card"></i>
            <p>No tienes tarjetas guardadas</p>
          </div>

          <div class="add-card-section">
            <button 
              type="button" 
              class="btn-toggle-add" 
              @click="isAddingCard = !isAddingCard"
              :class="{ 'active': isAddingCard }"
            >
              <i :class="isAddingCard ? 'fa-solid fa-minus' : 'fa-solid fa-plus'"></i>
              {{ isAddingCard ? 'Cancelar' : 'Agregar nueva tarjeta' }}
            </button>

            <Transition name="expand">
              <div v-if="isAddingCard" class="add-card-form animate-pop">
                <div class="form-group" style="margin-bottom: 12px;">
                  <label>Nombre del Titular</label>
                  <input v-model="newCardHolder" placeholder="Nombre completo como en la tarjeta" class="form-input" />
                </div>
                <div class="form-group" style="margin-bottom: 12px;">
                  <label>Número de Tarjeta</label>
                  <input 
                    :value="newCardNumber" 
                    @input="formatCardNumber"
                    maxlength="19" 
                    placeholder="0000 0000 0000 0000" 
                    class="form-input" 
                  />
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Marca</label>
                    <select v-model="newCardBrand" class="form-input">
                      <option value="Visa">Visa</option>
                      <option value="MasterCard">MasterCard</option>
                      <option value="American Express">American Express</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Vence</label>
                    <input 
                      :value="newCardExpiry" 
                      @input="formatExpiry"
                      maxlength="5" 
                      placeholder="MM/YY" 
                      class="form-input" 
                    />
                  </div>
                  <div class="form-group">
                    <label>CVV</label>
                    <input 
                      :value="newCardCVV" 
                      @input="formatCVV"
                      maxlength="3" 
                      type="password" 
                      placeholder="123" 
                      class="form-input" 
                    />
                  </div>
                </div>
                <button @click="agregarTarjeta" class="btn-save-card" :disabled="isLoading">
                  <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
                  <i v-else class="fa-solid fa-plus-circle"></i>
                  Guardar y Usar
                </button>
              </div>
            </Transition>
          </div>
        </div>
<!-- CONDICIONAL: Si es Efectivo -->
<div v-else-if="normalizedMetodoPago === 'EFECTIVO'" class="payment-note">
  <p>Asegúrate de haberle entregado el efectivo al profesional. Al confirmar, el sistema deducirá la comisión correspondiente de la cuenta del profesional.</p>
</div>
        <div v-else class="payment-note">
          <p v-if="normalizedMetodoPago === 'TARJETA_CREDITO'">El cobro se realizará de forma automática a tu tarjeta registrada y el pago se transferirá al profesional.</p>
          <p v-if="normalizedMetodoPago === 'EFECTIVO'">Asegúrate de haberle entregado el efectivo al profesional. Al confirmar, el sistema deducirá la comisión correspondiente de la cuenta del profesional.</p>
        </div>

      </div>

      <!-- Footer / Action -->
      <div class="payment-footer">
        <button 
          @click="confirmarFinalizacion" 
          :disabled="isLoading || (normalizedMetodoPago === 'TRANSFERENCIA' && !selectedFile)" 
          class="btn-confirm-payment"
        >
          <div v-if="isLoading" class="loading-container">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span>Procesando...</span>
          </div>
          <div v-else class="btn-content">
            <i class="fa-solid fa-shield-check"></i>
            <span>Confirmar Trabajo y Liberar Pago</span>
          </div>
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.payment-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px 16px;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(6px);
  overflow-y: auto;
}
.payment-card {
  width: 100%;
  max-width: 460px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.32);
  display: flex;
  flex-direction: column;
  margin: auto 0;
}
.payment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 22px;
  background: linear-gradient(135deg, #0B4C6F, #1D6FA8);
  color: #fff;
}
.payment-header h3 { margin: 0; font-size: 1.15rem; font-weight: 900; }
.payment-header p { margin: 4px 0 0; font-size: 0.76rem; font-weight: 800; text-transform: uppercase; opacity: 0.9; }
.payment-header span { color: #FED7AA; }
.payment-close {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.14);
  color: white;
  cursor: pointer;
}
.payment-body { padding: 22px; display: flex; flex-direction: column; gap: 20px; }
.payment-total {
  text-align: center;
  padding: 20px;
  border: 1.5px solid #BFDBFE;
  border-radius: 14px;
  background: #EFF6FF;
}
.manual-amount-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 5px 0;
}
.currency-prefix {
  font-size: 1.5rem;
  font-weight: 900;
  color: #0F172A;
}
.manual-input {
  background: white;
  border: 2px solid #BFDBFE;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 1.8rem;
  font-weight: 950;
  color: #0F172A;
  width: 180px;
  text-align: center;
  outline: none;
  transition: border-color 0.2s;
}
.manual-input:focus {
  border-color: #1D4ED8;
}
.input-hint {
  font-size: 0.75rem;
  color: #64748B;
  margin-top: 8px !important;
  font-weight: 600;
}
.payment-total p { margin: 0 0 6px; color: #1D4ED8; font-size: 0.82rem; font-weight: 800; }
.payment-total div { color: #0F172A; font-size: 1.6rem; font-weight: 800; letter-spacing: 0; }
.amount-display { color: #0F172A; font-size: 1.6rem; font-weight: 800; }

.amount-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #64748b;
  padding: 10px 0;
}

.amount-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 6px;
}
.locked-value .currency {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
}
.locked-value .amount {
  font-size: 2.4rem;
  font-weight: 950;
  color: #0f172a;
  line-height: 1;
}

/* Locked Amount Styles */
.locked-amount {
  border-color: #F76B1C !important;
  background: #FFF7ED !important;
}
.locked-amount p {
  color: #C2410C !important;
}
.locked-value {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.locked-value .currency {
  font-size: 1.2rem;
  vertical-align: super;
  margin-right: 4px;
}
.lock-indicator {
  font-size: 0.7rem;
  color: #EA580C;
  background: #FFEDD5;
  padding: 4px 10px;
  border-radius: 20px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #FED7AA;
}
.payment-note {
  padding: 14px 16px;
  border-radius: 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.55;
  text-align: center;
}
.payment-footer { 
  padding: 24px; 
  background: #ffffff; 
  border-top: 1px solid #f1f5f9;
}

.btn-confirm-payment {
  width: 100%;
  position: relative;
  padding: 16px 24px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.4);
  overflow: hidden;
}

.btn-confirm-payment:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 25px -5px rgba(16, 185, 129, 0.5);
  background: linear-gradient(135deg, #10b981, #047857);
}

.btn-confirm-payment:active:not(:disabled) {
  transform: translateY(0);
}

.btn-confirm-payment:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-content, .loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-content i {
  font-size: 1.1rem;
}
.animate-pop {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popIn {
  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* Custom CSS for Transfer Section */
.transfer-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.bank-data-card {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 16px;
  border-radius: 12px;
}
.bank-data-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0 0 12px 0;
}
.bank-data-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bank-data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ffffff;
  padding: 8px;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
}
.bank-data-label {
  font-size: 0.875rem;
  color: #475569;
}
.bank-data-value {
  font-weight: 700;
  color: #1e293b;
  font-family: monospace;
}
.loading-bank-data {
  font-size: 0.875rem;
  color: #94a3b8;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
.upload-section {
  display: flex;
  flex-direction: column;
}
.upload-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 8px;
}
.required-asterisk {
  color: #ef4444;
}
.upload-container {
  position: relative;
  width: 100%;
}
.file-input-hidden {
  display: none;
}
.upload-button {
  width: 100%;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.upload-button:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}
.upload-icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #f1f5f9;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all 0.2s ease;
}
.upload-button:hover .upload-icon-circle {
  background-color: #dbeafe;
  color: #2563eb;
}
.upload-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
}
.upload-success-text {
  font-size: 0.875rem;
  font-weight: 700;
  color: #059669;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Custom CSS for Toast */
.local-toast-card {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  font-weight: 700;
  font-size: 0.875rem;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}
.toast-success {
  background-color: #0f172a;
  color: #34d399;
  border: 1px solid #334155;
}
.toast-error {
  background-color: #dc2626;
  color: #ffffff;
  box-shadow: 0 10px 15px -3px rgba(254, 202, 202, 0.5);
}
/* Method Selector Styles */
.method-selector-section {
  margin-bottom: 8px;
}
.section-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 800;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}
.method-options {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}
.method-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 8px;
  background: #F1F5F9;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748B;
}
.method-btn i {
  font-size: 1.25rem;
}
.method-btn span {
  font-size: 0.75rem;
  font-weight: 700;
}
.method-btn:hover {
  background: #E2E8F0;
  color: #1E293B;
}
.method-btn.active {
  background: #EFF6FF;
  border-color: #3B82F6;
  color: #3B82F6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.header-subtitle {
  margin: 4px 0 0;
  font-size: 0.75rem;
  opacity: 0.8;
  font-weight: 600;
}

/* Rest of the styles... */
.credit-card-module {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-subtitle {
  font-size: 0.85rem;
  font-weight: 700;
  color: #64748B;
  margin-bottom: 12px;
}
.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.card-option {
  background: #F8FAFC;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.card-option:hover {
  border-color: #CBD5E1;
  background: #F1F5F9;
}
.card-option.selected {
  border-color: #3B82F6;
  background: #EFF6FF;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}
.card-option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.card-option-header i {
  font-size: 1.5rem;
  color: #1E293B;
}
.card-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #CBD5E1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.selected .card-radio {
  border-color: #3B82F6;
}
.radio-inner {
  width: 10px;
  height: 10px;
  background: #3B82F6;
  border-radius: 50%;
}
.card-option-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.card-option-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748B;
  font-weight: 600;
}
.card-brand-name {
  text-transform: uppercase;
}

.no-cards-empty {
  text-align: center;
  padding: 24px;
  background: #F8FAFC;
  border: 2px dashed #E2E8F0;
  border-radius: 12px;
  color: #94A3B8;
}
.no-cards-empty i {
  font-size: 2rem;
  margin-bottom: 8px;
}

.add-card-section {
  margin-top: 8px;
}
.btn-toggle-add {
  width: 100%;
  padding: 10px;
  background: white;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  color: #475569;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}
.btn-toggle-add:hover {
  background: #F8FAFC;
  border-color: #CBD5E1;
}
.btn-toggle-add.active {
  color: #EF4444;
  border-color: #FECACA;
}

.add-card-form {
  margin-top: 12px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}
.form-group {
  margin-bottom: 12px;
}
.form-group label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748B;
  margin-bottom: 4px;
}
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1E293B;
  outline: none;
}
.form-input:focus {
  border-color: #3B82F6;
}
.btn-save-card {
  width: 100%;
  padding: 10px;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}
.btn-save-card:hover {
  background: #2563EB;
}

.expand-enter-active, .expand-leave-active {
  transition: all 0.3s ease-out;
  max-height: 300px;
  overflow: hidden;
}
.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

.fixed-method-banner {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  width: 100%;
}
.method-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 24px;
  background: #f8fafc;
  border-radius: 14px;
  color: #0b4c6f;
  font-weight: 800;
  font-size: 0.95rem;
  border: 2px solid #e2e8f0;
  width: 100%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.method-badge i {
  color: #f76b1c;
  font-size: 1.2rem;
}
.locked-amount .locked-value .amount {
  font-size: 2.2rem;
  font-weight: 950;
  color: #0f172a;
  line-height: 1;
}
</style>
