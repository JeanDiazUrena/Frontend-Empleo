<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const recentActivity = ref([]); // VACÍO: Esperando BD

const fetchActivity = async () => {
  // Aquí llamarás a tu API
  console.log("Cargando actividad del cliente...");
};

onMounted(() => {
  fetchActivity();
});
</script>

<template>
  <div class="client-view">
    
    <div class="welcome-section">
      <h1>Bienvenido de nuevo.</h1>
      <p>¿Qué necesitas resolver hoy?</p>
    </div>

    <div v-if="recentActivity.length === 0" class="empty-state">
      <div class="empty-icon-svg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
      <h3>No tienes actividad reciente</h3>
      <p>Explora servicios o publica tu primera solicitud.</p>
      <button class="btn-action" @click="router.push('/client/explore')">Explorar Servicios</button>
    </div>

    <div v-else class="activity-list">
       </div>

  </div>
</template>

<style scoped>
.welcome-section { margin-bottom: 30px; }
.welcome-section h1 { font-size: 2rem; margin: 0 0 5px 0; color: #111; }
.welcome-section p { color: #666; }

.empty-state { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; border: 1px dashed #ccc; }
.empty-icon-svg { width: 60px; height: 60px; margin: 0 auto 15px; }
.empty-icon-svg svg { width: 100%; height: 100%; }

.btn-action { margin-top: 15px; padding: 10px 20px; background: white; border: 1px solid #0B4C6F; color: #0B4C6F; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-action:hover { background: #F0F9FF; }
</style>