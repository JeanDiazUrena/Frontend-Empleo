<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const jobRequests = ref([]); 

const fetchJobs = async () => {
  try {
    console.log("Buscando trabajos...");
  } catch (error) {
    console.error("Error", error);
  }
};

onMounted(() => {
  fetchJobs();
});
</script>

<template>
  <div class="dashboard-view">
    
    <header class="section-header">
      <h2>Oportunidades de Trabajo</h2>
      <p>Encuentra clientes que necesitan tus servicios hoy.</p>
    </header>

    <div v-if="jobRequests.length === 0" class="empty-jobs-state">
      
      <div class="empty-icon-svg">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 11.25h-3.75m3.75 0V1.5m0 0l-3 3m3-3l3 3M1.5 7.5h21" />
        </svg>
      </div>

      <h3>No hay trabajos disponibles por ahora</h3>
      <p>Actualmente no hay solicitudes de clientes en tu zona.</p>
      
      <button class="btn-refresh" @click="fetchJobs">
        <svg class="icon-refresh" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Actualizar lista
      </button>
    </div>

    <div v-else class="jobs-list">
       </div>

  </div>
</template>

<style scoped>
.section-header { margin-bottom: 2rem; }
.section-header h2 { margin: 0 0 5px 0; color: #111; font-size: 1.8rem; }
.section-header p { margin: 0; color: #666; }

/* ESTADO VACÍO MEJORADO */
.empty-jobs-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  border: 1px dashed #CBD5E1;
  color: #64748B;
}

/* Contenedor del ícono grande */
.empty-icon-svg {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
}
.empty-icon-svg svg {
  width: 100%;
  height: 100%;
  color: #CBD5E1; /* Gris suave */
}

/* Botón Refrescar */
.btn-refresh {
  margin-top: 20px;
  padding: 10px 20px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  color: #0B4C6F;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}
.btn-refresh:hover {
  background: #F1F5F9;
  border-color: #0B4C6F;
}

.icon-refresh {
  width: 18px;
  height: 18px;
}
</style>