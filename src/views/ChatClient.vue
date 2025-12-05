<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
// Reusamos los estilos para mantener consistencia
import './Dashboard.css'; 
import './ChatProfessional.css'; 

const router = useRouter();

// Datos del Cliente (Tú)
const currentUser = {
  name: "Jean Luis",
  avatar: "https://i.pravatar.cc/150?u=jean",
};

// --- SIN DATOS FALSOS (Array vacío) ---
const conversations = ref([]); 
const selectedChatId = ref(null);
const searchQuery = ref('');

// Filtros (funcionarán igual cuando haya datos reales)
const filteredChats = computed(() => {
  return conversations.value.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const activeChat = computed(() => {
  return conversations.value.find(c => c.id === selectedChatId.value);
});

const selectChat = (id) => {
  selectedChatId.value = id;
};

// --- NAVEGACIÓN CLIENTE ---
const goToDashboard = () => router.push('/client-dashboard');
const goToProfile = () => router.push('/client-profile');

</script>

<template>
  <div class="dashboard-layout chat-layout-fix">
    
    <nav class="navbar">
      <div class="nav-brand" style="color: #F76B1C;">SERVIHUB</div>
      
      <div class="nav-search">
        <input type="text" placeholder="Buscar en mensajes...">
        <button class="search-btn">🔍</button>
      </div>

      <div class="nav-profile">
        <span class="nav-user-name">{{ currentUser.name }}</span>
        <img :src="currentUser.avatar" class="nav-avatar">
      </div>
    </nav>

    <div class="main-container chat-grid-override">
      
      <aside class="sidebar-left">
        <ul class="menu-list">
          <li @click="goToDashboard">
            <span class="icon">🏠</span> Inicio
          </li>
          <li>
            <span class="icon">🔍</span> Explorar
          </li>
          <li class="active">
            <span class="icon">💬</span> Mensajes
          </li>
          <li @click="goToProfile">
            <span class="icon">👤</span> Mi Perfil
          </li>
        </ul>
        
        <div class="action-area">
           <button class="btn-create-post" style="background-color: #0B4C6F;">
            + Pedir Servicio
          </button>
        </div>
      </aside>

      <main class="chat-interface-container">
        
        <div class="chat-list-panel">
          <div class="panel-header">
            <h3>Tus Conversaciones</h3>
          </div>
          
          <div v-if="conversations.length === 0" class="empty-list-state" style="border:none; box-shadow:none;">
            <p>No has contactado a ningún profesional aún.</p>
          </div>

          <div v-else class="conversations-list">
            <div 
              v-for="chat in filteredChats" 
              :key="chat.id"
              class="chat-item"
              :class="{ 'active': selectedChatId === chat.id }"
              @click="selectChat(chat.id)"
            >
              <div class="avatar-wrapper">
                <img :src="chat.avatar" :alt="chat.name">
                <span v-if="chat.unread" class="online-dot" style="background-color: #F76B1C;"></span>
              </div>
              <div class="chat-info">
                <div class="chat-top">
                  <span class="chat-name">{{ chat.name }}</span>
                  <span class="chat-time">{{ chat.time }}</span>
                </div>
                <p class="chat-preview">{{ chat.lastMsg }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-window-panel">
          
          <div v-if="!selectedChatId" class="empty-state">
            <div class="empty-icon">💬</div>
            <h3>Bandeja de Entrada</h3>
            <p v-if="conversations.length === 0">
              Cuando contactes a un profesional desde su perfil, el chat aparecerá aquí.
            </p>
            <p v-else>
              Selecciona una conversación para leer los mensajes.
            </p>
          </div>

          <div v-else class="active-chat-view">
            <header class="chat-header">
              <img :src="activeChat.avatar" class="header-avatar">
              <div class="header-info">
                <h4>{{ activeChat.name }}</h4>
                <span class="status">En línea</span>
              </div>
            </header>

            <div class="messages-area">
              <div class="msg received">
                <p>{{ activeChat.lastMsg }}</p>
                <span class="msg-time">{{ activeChat.time }}</span>
              </div>
            </div>

            <div class="input-area">
              <input type="text" placeholder="Escribe un mensaje...">
              <button class="btn-send" style="color: #F76B1C;">➤</button>
            </div>
          </div>
        </div>

      </main>

    </div>
  </div>
</template>