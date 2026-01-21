<script setup>
import { ref, onMounted, nextTick } from 'vue';

// --- ESTADO INICIAL (VACÍO, LISTO PARA DB) ---
const contacts = ref([]);           // Aquí caerán las conversaciones de la BD
const activeChatMessages = ref([]); // Aquí caerán los mensajes al hacer clic
const currentContact = ref(null);   // El cliente seleccionado
const newMessage = ref("");

// NOTA: Este ID debería venir de tu sistema de Login real (Pinia, Vuex o localStorage)
const currentUser_id = 1; 

// --- 1. FUNCIÓN PARA CARGAR CONTACTOS ---
const fetchContacts = async () => {
  try {
    // CUANDO TENGAS LA BASE DE DATOS, DESCOMENTA ESTO:
    /*
    const response = await fetch(`http://tu-api.com/conversations?userId=${currentUser_id}`);
    const data = await response.json();
    contacts.value = data;
    */
    
    console.log("Esperando conexión a Base de Datos para cargar contactos...");
  } catch (error) {
    console.error("Error cargando contactos:", error);
  }
};

// --- 2. FUNCIÓN PARA SELECCIONAR UN CLIENTE ---
const selectContact = async (contact) => {
  currentContact.value = contact;
  activeChatMessages.value = []; // Limpiamos mensajes anteriores

  // Visualmente marcamos activo
  contacts.value.forEach(c => c.active = false);
  contact.active = true;

  try {
    // CUANDO TENGAS LA BASE DE DATOS, DESCOMENTA ESTO:
    /*
    const response = await fetch(`http://tu-api.com/messages/${contact.conversation_id}`);
    const data = await response.json();
    activeChatMessages.value = data;
    scrollToBottom();
    */

    console.log(`Cargando mensajes del chat ID: ${contact.conversation_id}...`);
  } catch (error) {
    console.error("Error cargando mensajes:", error);
  }
};

// --- 3. FUNCIÓN PARA ENVIAR MENSAJE ---
const sendMessage = async () => {
  if (newMessage.value.trim() === "" || !currentContact.value) return;

  const msgText = newMessage.value;
  newMessage.value = ""; // Limpiar input inmediatamente

  try {
    // A) LOGICA DE BASE DE DATOS (PENDIENTE):
    /*
    const response = await fetch('http://tu-api.com/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: currentContact.value.conversation_id,
        sender_id: currentUser_id,
        content: msgText
      })
    });
    */

    // B) SIMULACIÓN LOCAL (Para que veas que funciona la UI mientras tanto):
    // Esto agrega el mensaje a la pantalla inmediatamente
    activeChatMessages.value.push({
      id: Date.now(),
      content: msgText,
      sender_id: currentUser_id,
      created_at: new Date()
    });
    
    scrollToBottom();

  } catch (error) {
    console.error("Error enviando mensaje:", error);
  }
};

// Utilidad para bajar el scroll automáticamente
const scrollToBottom = () => {
  nextTick(() => {
    const chatBody = document.querySelector('.chat-body');
    if(chatBody) chatBody.scrollTop = chatBody.scrollHeight;
  });
};

onMounted(() => {
  fetchContacts();
});
</script>

<template>
  <div class="chat-wrapper">
    
    <div class="chat-list-col">
      <div class="chat-search">
        <input type="text" placeholder="Buscar conversación...">
      </div>
      
      <div v-if="contacts.length === 0" class="empty-list-state">
        <p>No tienes mensajes activos.</p>
        <small>Tus conversaciones aparecerán aquí cuando los clientes te contacten.</small>
      </div>

      <div class="contacts-list" v-else>
        <div 
          v-for="contact in contacts" 
          :key="contact.conversation_id" 
          class="contact-item" 
          :class="{ active: contact.active }"
          @click="selectContact(contact)"
        >
          <div class="avatar-sm">{{ contact.client_name ? contact.client_name.charAt(0) : '?' }}</div>
          <div class="contact-info">
            <div class="top-row">
              <h4>{{ contact.client_name }}</h4>
              <span class="time">{{ contact.last_msg_time }}</span>
            </div>
            <p>{{ contact.last_message }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-window-col">
      
      <div v-if="!currentContact" class="no-chat-selected">
        <div class="placeholder-content">
          <div class="icon-msg">💬</div>
          <h3>Mensajería ServiHub</h3>
          <p>Selecciona un cliente para comenzar a negociar.</p>
        </div>
      </div>

      <template v-else>
        <div class="chat-header">
          <div class="header-user">
            <div class="avatar-sm">{{ currentContact.client_name.charAt(0) }}</div>
            <h3>{{ currentContact.client_name }}</h3>
          </div>
          <div class="header-actions">
             <button class="btn-icon">⋮</button>
          </div>
        </div>

        <div class="chat-body">
          <div 
            v-for="msg in activeChatMessages" 
            :key="msg.id" 
            class="message-bubble" 
            :class="msg.sender_id === currentUser_id ? 'msg-me' : 'msg-client'"
          >
            <p>{{ msg.content }}</p>
            <span class="msg-time">
              {{ new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}
            </span>
          </div>
        </div>

        <div class="chat-footer">
          <button class="btn-attach" title="Adjuntar archivo">📎</button>
          <input 
            type="text" 
            v-model="newMessage" 
            placeholder="Escribe un mensaje..." 
            @keyup.enter="sendMessage"
          >
          <button class="btn-send" @click="sendMessage">➤</button>
        </div>
      </template>

    </div>

  </div>
</template>

<style scoped>
/* ESTRUCTURA PRINCIPAL */
.chat-wrapper {
  display: flex;
  height: calc(100vh - 140px); /* Ajuste para el Layout */
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
}

/* IZQUIERDA */
.chat-list-col { width: 320px; border-right: 1px solid #E5E7EB; display: flex; flex-direction: column; }
.chat-search { padding: 16px; border-bottom: 1px solid #eee; }
.chat-search input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; background: #F9FAFB; }

.empty-list-state { 
  padding: 40px 20px; text-align: center; color: #666; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;
}
.empty-list-state p { font-weight: 600; margin-bottom: 5px; }
.empty-list-state small { color: #999; font-size: 0.85rem; }

.contacts-list { flex: 1; overflow-y: auto; }
.contact-item { display: flex; gap: 12px; padding: 16px; cursor: pointer; border-bottom: 1px solid #f5f5f5; transition: 0.2s; }
.contact-item:hover { background: #F3F4F6; }
.contact-item.active { background: #E0F2FE; border-left: 4px solid #0B4C6F; }

/* DERECHA */
.chat-window-col { flex: 1; display: flex; flex-direction: column; }
.no-chat-selected { flex: 1; display: flex; align-items: center; justify-content: center; background: #F9FAFB; }
.placeholder-content { text-align: center; color: #888; }
.icon-msg { font-size: 3rem; margin-bottom: 10px; opacity: 0.3; }

.chat-header { padding: 12px 24px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #fff; }
.header-user { display: flex; align-items: center; gap: 12px; }
.header-user h3 { margin: 0; font-size: 1rem; }
.avatar-sm { width: 40px; height: 40px; background: #0B4C6F; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; }
.btn-icon { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666; }

.chat-body { flex: 1; background: #F9FAFB; padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }

/* MENSAJES */
.message-bubble { max-width: 70%; padding: 12px 16px; border-radius: 12px; position: relative; font-size: 0.95rem; line-height: 1.5; }
.msg-client { align-self: flex-start; background: white; border: 1px solid #E5E7EB; color: #333; border-bottom-left-radius: 2px; }
.msg-me { align-self: flex-end; background: #0B4C6F; color: white; border-bottom-right-radius: 2px; }
.msg-time { font-size: 0.7rem; display: block; text-align: right; margin-top: 4px; opacity: 0.7; }

/* INPUT */
.chat-footer { padding: 16px; border-top: 1px solid #eee; display: flex; gap: 10px; align-items: center; background: white; }
.chat-footer input { flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 24px; outline: none; }
.chat-footer input:focus { border-color: #0B4C6F; }
.btn-attach { background: none; border: none; font-size: 1.5rem; color: #666; cursor: pointer; }
.btn-send { background: #0B4C6F; color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
.btn-send:hover { background: #093a55; transform: scale(1.05); }

/* AUXILIARES */
.contact-info { flex: 1; min-width: 0; }
.top-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
.top-row h4 { margin: 0; font-size: 0.95rem; color: #333; }
.time { font-size: 0.75rem; color: #999; }
.contact-info p { margin: 0; font-size: 0.85rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>