<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { accountApi } from '../services/accountSettingsService';

const route = useRoute();
const router = useRouter();
const receipt = ref(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const data = await accountApi.getReceipt(route.params.id);
    receipt.value = data;
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});


const printReceipt = () => {
  window.print();
};

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(val || 0);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
</script>

<template>
  <div class="receipt-container">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Generando recibo...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="fa-solid fa-circle-exclamation"></i>
      <p>{{ error }}</p>
      <button @click="router.back()" class="btn-back">Volver</button>
    </div>

    <div v-else class="receipt-card animate-fade-in" id="printable-receipt">
      <div class="receipt-header">
        <div class="brand">
          <span class="logo-text">Servi<span>Hub</span></span>
          <span class="receipt-label">RECIBO DE SERVICIO</span>
        </div>
        <div class="receipt-meta">
          <p><strong>Nº de Recibo:</strong> #{{ receipt.id }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(receipt.fecha_creacion || receipt.created_at) }}</p>
        </div>
      </div>

      <div class="receipt-divider"></div>

      <div class="receipt-details">
        <div class="detail-section">
          <h3>CLIENTE</h3>
          <p><strong>Nombre:</strong> {{ receipt.cliente_nombre }}</p>
          <p><strong>Email:</strong> {{ receipt.cliente_email }}</p>
        </div>
        <div class="detail-section text-right">
          <h3>PROFESIONAL</h3>
          <p><strong>Nombre:</strong> {{ receipt.profesional_nombre }}</p>
          <p><strong>Email:</strong> {{ receipt.profesional_email }}</p>
        </div>
      </div>

      <div class="service-table">
        <div class="table-header">
          <span>Descripción</span>
          <span>Precio</span>
        </div>
        
        <!-- Datos de la Solicitud Original -->
        <div class="table-row">
          <div class="service-info">
            <span class="service-title">{{ receipt.titulo }} (Solicitud)</span>
            <span class="service-desc">{{ receipt.descripcion }}</span>
          </div>
          <span class="service-amount">{{ formatCurrency(receipt.presupuesto_max || receipt.presupuesto_min) }}</span>
        </div>

        <!-- Ajuste por Cotización (si existe) -->
        <div class="table-row" v-if="receipt.cotizacion_monto && receipt.cotizacion_monto != (receipt.presupuesto_max || receipt.presupuesto_min)">
          <div class="service-info">
            <span class="service-title">Ajuste de Cotización Profesional</span>
            <span class="service-desc">{{ receipt.cotizacion_desc || 'Presupuesto ajustado por el profesional' }}</span>
          </div>
          <span class="service-amount">{{ formatCurrency(receipt.cotizacion_monto) }}</span>
        </div>
      </div>

      <div class="receipt-total">
        <div class="total-row">
          <span>Total Acordado</span>
          <span>{{ formatCurrency(receipt.monto_acordado) }}</span>
        </div>
        <div class="total-row">
          <span>Comisión ServiHub (Incluida)</span>
          <span>{{ formatCurrency(receipt.monto_acordado * 0.1) }}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL FINAL</span>
          <span>{{ formatCurrency(receipt.monto_acordado) }}</span>
        </div>
      </div>

      <div class="receipt-footer">
        <div class="payment-method">
          <i class="fa-solid fa-credit-card"></i>
          <span>Método de Pago: {{ receipt.metodo_pago || 'TARJETA' }}</span>
        </div>
        <p class="thanks-msg">¡Gracias por confiar en ServiHub!</p>
        <p class="legal-note">Este es un comprobante digital de la transacción realizada entre el cliente y el profesional independiente.</p>
      </div>

      <div class="no-print actions">
        <button @click="printReceipt" class="btn-print">
          <i class="fa-solid fa-print"></i> Imprimir o Guardar PDF
        </button>
        <button @click="router.back()" class="btn-back-text">Volver al Dashboard</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.receipt-container {
  min-height: 100vh;
  padding: 40px 20px;
  background: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  font-family: 'Inter', sans-serif;
}

.loading-state, .error-state {
  text-align: center;
  margin-top: 100px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top-color: #0B4C6F;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.receipt-card {
  background: white;
  width: 100%;
  max-width: 800px;
  padding: 60px;
  border-radius: 1px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  position: relative;
  border-top: 8px solid #0B4C6F;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
}

.logo-text {
  font-size: 2rem;
  font-weight: 900;
  color: #0B4C6F;
  display: block;
}

.logo-text span {
  color: #F76B1C;
}

.receipt-label {
  font-size: 0.85rem;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 0.2em;
  margin-top: 4px;
  display: block;
}

.receipt-meta p {
  margin: 4px 0;
  font-size: 0.9rem;
  color: #64748b;
  text-align: right;
}

.receipt-meta strong {
  color: #1e293b;
}

.receipt-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 30px 0;
}

.receipt-details {
  display: flex;
  justify-content: space-between;
  margin-bottom: 50px;
}

.detail-section h3 {
  font-size: 0.75rem;
  font-weight: 800;
  color: #94a3b8;
  margin-bottom: 12px;
  letter-spacing: 0.1em;
}

.detail-section p {
  margin: 4px 0;
  font-size: 1rem;
  color: #334155;
}

.text-right {
  text-align: right;
}

.service-table {
  margin-bottom: 40px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 2px solid #1e293b;
  font-weight: 800;
  font-size: 0.9rem;
  text-transform: uppercase;
  color: #1e293b;
}

.table-row {
  display: flex;
  justify-content: space-between;
  padding: 24px 0;
  border-bottom: 1px solid #f1f5f9;
}

.service-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.service-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1e293b;
}

.service-desc {
  font-size: 0.9rem;
  color: #64748b;
  max-width: 500px;
}

.service-amount {
  font-weight: 700;
  font-size: 1.1rem;
  color: #1e293b;
}

.receipt-total {
  margin-left: auto;
  width: 100%;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: #64748b;
}

.grand-total {
  margin-top: 10px;
  padding-top: 15px;
  border-top: 2px solid #f1f5f9;
  font-size: 1.25rem;
  font-weight: 900;
  color: #0B4C6F;
}

.receipt-footer {
  margin-top: 80px;
  text-align: center;
  border-top: 1px dashed #e2e8f0;
  padding-top: 40px;
}

.payment-method {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 20px;
}

.thanks-msg {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.legal-note {
  font-size: 0.75rem;
  color: #94a3b8;
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.5;
}

.actions {
  margin-top: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.btn-print {
  background: #0B4C6F;
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(11, 76, 111, 0.2);
}

.btn-print:hover {
  background: #083a55;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(11, 76, 111, 0.3);
}

.btn-back-text {
  background: none;
  border: none;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-back-text:hover {
  color: #0B4C6F;
  text-decoration: underline;
}

@media print {
  .no-print { display: none !important; }
  .receipt-container { background: white; padding: 0; }
  .receipt-card { box-shadow: none; border: none; padding: 0; max-width: 100%; }
}

@media (max-width: 640px) {
  .receipt-card { padding: 30px; }
  .receipt-header { flex-direction: column; gap: 20px; }
  .receipt-meta p { text-align: left; }
  .receipt-details { flex-direction: column; gap: 30px; }
  .text-right { text-align: left; }
  .table-header { font-size: 0.75rem; }
  .service-amount { font-size: 1rem; }
}
</style>
