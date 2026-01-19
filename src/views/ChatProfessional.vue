<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; 

const router = useRouter();

// Datos del Profesional (Iguales al Dashboard)
const currentUser = { 
  name: "Wilson Montero", 
  role: "Técnico Especialista",
  avatar: "" // Vacío para usar placeholder
};

// --- LÓGICA DEL CHAT ---
const conversations = ref([]); // Lista vacía (simulando sin mensajes)
const selectedChatId = ref(null);
const searchQuery = ref('');

const filteredChats = computed(() => {
  return conversations.value.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const activeChat = computed(() => conversations.value.find(c => c.id === selectedChatId.value));
const selectChat = (id) => selectedChatId.value = id;

// --- NAVEGACIÓN (LAS MISMAS RUTAS QUE EL DASHBOARD) ---
const goToDashboard = () => router.push('/professional-dashboard');
const goToChat = () => router.push('/professional-chat');
const goToProfile = () => router.push('/professional-profile');

</script>

<template>
  <div class="dashboard-layout">
    
    <nav class="navbar">
      <div class="nav-brand" @click="goToDashboard" style="cursor: pointer;">
        SERVIHUB <span class="pro-badge">PRO</span>
      </div>
      <div class="nav-profile clickable" @click="goToProfile">
        <span class="nav-user-name">{{ currentUser.name }}</span>
        <div class="avatar-placeholder-sm"></div>
      </div>
    </nav>

    <div class="chat-layout-container">
      
      <aside class="sidebar-fixed">
        
        <div class="mini-profile-card" @click="goToProfile">
          <div class="avatar-placeholder-md"></div>
          <div class="mini-profile-info">
            <h4>{{ currentUser.name }}</h4>
            <p>{{ currentUser.role }}</p>
          </div>
        </div>

        <ul class="menu-list">
          <li @click="goToDashboard">
            <span class="icon">📋</span> Solicitudes
          </li>
          <li class="active" @click="goToChat">
            <span class="icon">💬</span> Mensajes
          </li>
          <li @click="goToProfile">
            <span class="icon">👤</span> Mi Perfil
          </li>
        </ul>
        
        <div class="action-area">
          <button class="btn-create-post" @click="goToProfile">Ver mi Portafolio</button>
        </div>
      </aside>

      <main class="chat-area">
        
        <div class="chat-list-panel">
          <div class="panel-header">
            <h3>Bandeja de Entrada</h3>
          </div>
          
          <div v-if="conversations.length === 0" class="empty-list-state">
            <p>No tienes mensajes activos.</p>
          </div>

          <div v-else class="conversations-list">
            </div>
        </div>

        <div class="chat-window-panel">
          <div class="empty-chat-state">
            <div class="icon-msg">💬</div>
            <h3>Mensajería</h3>
            <p>Selecciona un cliente para comenzar a negociar.</p>
          </div>
        </div>

      </main>

    </div>
  </div>
</template>

<style scoped>
/* --- LAYOUT DEL CHAT --- */
/* Esto asegura que ocupe toda la pantalla sin márgenes extraños */
.chat-layout-container {
  display: flex;
  height: calc(100vh - 60px); /* Resta la altura del navbar */
  margin-top: 60px; /* Empuja hacia abajo por el navbar fijo */
  background-color: #F8F9FA;
  overflow: hidden; /* Evita scroll doble */
}

/* --- SIDEBAR FIJO (Estilos idénticos al Dashboard) --- */
.sidebar-fixed {
  width: 260px;
  background: white;
  border-right: 1px solid #E5E7EB;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  flex-shrink: 0; /* No se encoge */
}

/* Replicamos estilos del Dashboard para consistencia */
.mini-profile-card { display: flex; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; margin-bottom: 1rem; cursor: pointer; }
.mini-profile-info h4 { margin: 0; font-size: 0.9rem; color: #333; }
.mini-profile-info p { margin: 0; font-size: 0.8rem; color: #666; }
.avatar-placeholder-sm { width: 32px; height: 32px; background: #ddd; border-radius: 50%; }
.avatar-placeholder-md { width: 48px; height: 48px; background: #ddd; border-radius: 50%; margin-right: 10px; }

.menu-list { list-style: none; padding: 0; margin: 0; flex: 1; }
.menu-list li { padding: 12px 16px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; font-weight: 500; color: #4B5563; display: flex; align-items: center; gap: 12px; transition: all 0.2s; }
.menu-list li:hover { background-color: #F3F4F6; color: #111; }
.menu-list li.active { background-color: #E0F2FE; color: #0B4C6F; font-weight: 700; }

.action-area { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #F3F4F6; }
.btn-create-post { width: 100%; padding: 12px; background-color: #F76B1C; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: transform 0.2s; }
.btn-create-post:hover { background-color: #e05a10; transform: translateY(-2px); }

/* --- ÁREA DEL CHAT --- */
.chat-area {
  flex: 1; /* Ocupa el resto del ancho */
  display: flex; /* Divide lista y ventana */
  background: white;
}

.chat-list-panel {
  width: 320px;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
}
.panel-header { padding: 1.5rem; border-bottom: 1px solid #f0f0f0; }
.panel-header h3 { margin: 0; font-size: 1.1rem; color: #333; }
.empty-list-state { padding: 2rem; text-align: center; color: #888; font-size: 0.9rem; margin-top: 2rem; }

.chat-window-panel {
  flex: 1;
  background-color: #F9FAFB;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-chat-state { text-align: center; color: #666; }
.icon-msg { font-size: 3rem; opacity: 0.3; margin-bottom: 10px; }

/* Badge Pro del Navbar */
.pro-badge { background: #0B4C6F; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; vertical-align: middle; margin-left: 5px; }
</style>