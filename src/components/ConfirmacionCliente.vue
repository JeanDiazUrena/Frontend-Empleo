<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const props = defineProps({
  trabajo_id: { type: [String, Number], required: true },
  monto_total: { type: [String, Number], required: true },
  metodo_pago: { type: String, required: true },
  profesional_id: { type: [String, Number], required: true }
});

const emit = defineEmits(['close', 'success']);

const isLoading = ref(false);
const toast = ref({ show: false, message: '', type: 'success' });
const bankData = ref(null);
const fileInput = ref(null);
const selectedFile = ref(null);

const normalizedMetodoPago = computed(() => String(props.metodo_pago || 'EFECTIVO').toUpperCase());
const manualMonto = ref('');
const montoAPagar = computed(() => {
  const propAmount = Number(props.monto_total);
  if (propAmount > 0) return propAmount;
  
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

// Si es transferencia, cargamos la cuenta del profesional
onMounted(async () => {
  if (normalizedMetodoPago.value === 'TRANSFERENCIA') {
    try {
      const res = await axios.get(`http://localhost:3001/api/profesionales/${props.profesional_id}/financiero`);
      bankData.value = res.data;
    } catch (error) {
      console.error("No se pudo obtener la cuenta del profesional", error);
    }
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

  if (montoAPagar.value <= 0) {
    showToast('No se puede liberar un pago de RD$ 0.00. Contacta al soporte o al profesional para acordar el precio.');
    return;
  }

  isLoading.value = true;
  try {
    // Si fuera real, subiríamos la foto a un endpoint de subida aquí y obtendríamos la URL del comprobante.
    
    // Ejecutamos el endpoint que construimos en el backend
    const res = await axios.post(`http://localhost:3003/api/trabajos/${props.trabajo_id}/finalizar`, {
      monto_final: montoAPagar.value
    });
    
    if (res.data.success) {
      showToast('Trabajo finalizado y pago procesado con éxito', 'success');
      setTimeout(() => emit('success'), 2000);
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
    
    <!-- Toast local (Mejorado para evitar confusión) -->
    <div v-if="toast.show" 
         :class="['fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl font-bold text-sm z-[100] flex items-center gap-3 transition-all animate-pop', 
                  toast.type === 'success' ? 'bg-slate-900 text-emerald-400 border border-slate-700' : 'bg-red-600 text-white shadow-red-200']">
      <i :class="toast.type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation'"></i>
      {{ toast.message }}
    </div>

    <div class="payment-card animate-pop">
      <!-- Header -->
      <div class="payment-header">
        <div>
          <h3>Liberar Pago</h3>
          <p>
            Método: <span class="text-blue-600 font-bold">{{ normalizedMetodoPago }}</span>
          </p>
        </div>
        <button @click="$emit('close')" class="payment-close">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="payment-body">
        
        <!-- Total Banner -->
        <div class="payment-total">
          <p>Monto a pagar al Profesional</p>
          <div v-if="Number(props.monto_total) > 0">RD$ {{ montoAPagarLabel }}</div>
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
          <p v-if="Number(props.monto_total) <= 0" class="input-hint">El trabajo no tenía un monto definido. Por favor ingresa el monto total acordado.</p>
        </div>

        <!-- CONDICIONAL: Si es transferencia -->
        <div v-if="normalizedMetodoPago === 'TRANSFERENCIA'" class="space-y-4">
          <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Datos Bancarios del Profesional</h4>
            <div v-if="bankData" class="space-y-2">
              <div class="flex justify-between items-center bg-white p-2 border border-slate-100 rounded-lg">
                <span class="text-sm text-slate-600">Cuenta:</span>
                <span class="font-bold text-slate-800 font-mono">{{ bankData.cuenta_bancaria }}</span>
              </div>
            </div>
            <div v-else class="text-sm text-slate-400 animate-pulse">Cargando datos bancarios...</div>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-2">Comprobante de Pago <span class="text-red-500">*</span></label>
            <div class="relative w-full">
              <input type="file" ref="fileInput" @change="handleFileChange" accept="image/*,.pdf" class="hidden" />
              <button type="button" @click="$refs.fileInput.click()" 
                      class="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center gap-2 group">
                <div class="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 flex items-center justify-center text-xl transition-colors">
                  <i class="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <span v-if="!selectedFile" class="text-sm font-medium text-slate-600">Haz clic para subir el comprobante</span>
                <span v-else class="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <i class="fa-solid fa-file-check"></i> {{ selectedFile.name }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- CONDICIONAL: Si es Tarjeta o Efectivo -->
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
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.64);
  backdrop-filter: blur(6px);
}
.payment-card {
  width: 100%;
  max-width: 460px;
  overflow: hidden;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.32);
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
.payment-total p { margin: 0 0 7px; color: #1D4ED8; font-size: 0.84rem; font-weight: 900; }
.payment-total div { color: #0F172A; font-size: 2rem; font-weight: 950; letter-spacing: 0; }
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
</style>
