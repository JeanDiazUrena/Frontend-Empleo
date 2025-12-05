<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import './Dashboard.css'; 
import './ChatProfessional.css';

const router = useRouter();
const currentUser = { name: "Wilson Montero", avatar: "https://i.pravatar.cc/150?u=wilson" };

// --- DATOS REALES (VACÍOS POR AHORA) ---
const conversations = ref([]); // Array vacío: No hay bots
const selectedChatId = ref(null);
const searchQuery = ref('');

// Filtros (funcionarán igual cuando haya datos)
const filteredChats = computed(() => {
  return conversations.value.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const activeChat = computed(() => conversations.value.find(c => c.id === selectedChatId.value));
const selectChat = (id) => selectedChatId.value = id;

// Navegación
const goToDashboard = () => router.push('/professional-dashboard');
const goToChat = () => router.push('/chat');
const goToProfile = () => router.push('/profile');

</script>

<template>
  <div class="dashboard-layout chat-layout-fix">
    
    <nav class="navbar">
      <div class="nav-brand">SERVIHUB <span class="pro-badge">PRO</span></div>
      <div class="nav-profile"><img :src="currentUser.avatar" class="nav-avatar"></div>
    </nav>

    <div class="main-container chat-grid-override">
      
      <aside class="sidebar-left">
        <ul class="menu-list">
          <li @click="goToDashboard"><span class="icon">🏠</span> Inicio</li>
          <li class="active" @click="goToChat"><span class="icon">💬</span> Mensajes</li>
          <li @click="goToProfile"><span class="icon">👤</span> Mi Perfil</li>
        </ul>
      </aside>

      <main class="chat-interface-container">
        
        <div class="chat-list-panel">
          <div class="panel-header"><h3>Bandeja de Entrada</h3></div>
          
          <div class="search-container" v-if="conversations.length > 0">
             </div>

          <div v-if="conversations.length === 0" class="empty-list-state">
            <p>No tienes conversaciones activas.</p>
          </div>

          <div v-else class="conversations-list">
            </div>
        </div>

        <div class="chat-window-panel">
          <div class="empty-state">
            <div class="empty-icon">💬</div>
            <h3>Mensajería</h3>
            <p v-if="conversations.length === 0">Aquí aparecerán los mensajes cuando un cliente te contacte.</p>
            <p v-else>Selecciona un chat para leerlo.</p>
          </div>
        </div>

      </main>

    </div>
  </div>
</template>