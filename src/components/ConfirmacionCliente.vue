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

const showToast = (message, type = 'error') => {
  toast.value = { show: true, message, type };
  setTimeout(() => toast.value.show = false, 4000);
};

// Si es transferencia, cargamos la cuenta del profesional
onMounted(async () => {
  if (props.metodo_pago === 'TRANSFERENCIA') {
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
  if (props.metodo_pago === 'TRANSFERENCIA' && !selectedFile.value) {
    showToast('Debes subir el comprobante de transferencia');
    return;
  }

  isLoading.value = true;
  try {
    // Si fuera real, subiríamos la foto a un endpoint de subida aquí y obtendríamos la URL del comprobante.
    
    // Ejecutamos el endpoint que construimos en el backend
    const res = await axios.post(`http://localhost:3003/api/trabajos/${props.trabajo_id}/finalizar`);
    
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
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    
    <!-- Toast local -->
    <div v-if="toast.show" 
         :class="['fixed top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-sm z-[60] flex items-center gap-2 transition-all', toast.type === 'success' ? 'bg-slate-800 text-emerald-400' : 'bg-red-50 text-red-600 border border-red-200']">
      <i :class="toast.type === 'success' ? 'fa-solid fa-check-circle' : 'fa-solid fa-triangle-exclamation'"></i>
      {{ toast.message }}
    </div>

    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-pop">
      <!-- Header -->
      <div class="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center">
        <div>
          <h3 class="font-bold text-lg text-slate-800">Liberar Pago</h3>
          <p class="text-xs text-slate-500 font-medium tracking-wide uppercase mt-1">
            Método: <span class="text-blue-600 font-bold">{{ metodo_pago }}</span>
          </p>
        </div>
        <button @click="$emit('close')" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 transition">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="p-6 space-y-6">
        
        <!-- Total Banner -->
        <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-center">
          <p class="text-sm text-blue-600 font-semibold mb-1">Monto a pagar al Profesional</p>
          <div class="text-3xl font-extrabold text-slate-800">${{ Number(monto_total).toLocaleString('es-DO') }}</div>
        </div>

        <!-- CONDICIONAL: Si es transferencia -->
        <div v-if="metodo_pago === 'TRANSFERENCIA'" class="space-y-4">
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
        <div v-else class="text-center text-slate-600 text-sm">
          <p v-if="metodo_pago === 'TARJETA_CREDITO'">El cobro se realizará de forma automática a tu tarjeta registrada y el pago se transferirá al profesional.</p>
          <p v-if="metodo_pago === 'EFECTIVO'">Asegúrate de haberle entregado el efectivo al profesional. Al confirmar, el sistema deducirá la comisión correspondiente de la cuenta del profesional.</p>
        </div>

      </div>

      <!-- Footer / Action -->
      <div class="p-5 border-t border-slate-100 bg-slate-50">
        <button @click="confirmarFinalizacion" :disabled="isLoading || (metodo_pago === 'TRANSFERENCIA' && !selectedFile)" 
                class="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20">
          <i v-if="isLoading" class="fa-solid fa-spinner fa-spin"></i>
          <i v-else class="fa-solid fa-check-double"></i>
          {{ isLoading ? 'Procesando Pago y Comisiones...' : 'Confirmar Trabajo y Liberar Pago' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.animate-pop {
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes popIn {
  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
