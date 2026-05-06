import { ref, onMounted } from 'vue';
import { accountApi } from '../../services/accountSettingsService';

export function useSessions() {
  const sessions = ref([]);
  const isUpdating = ref(false);

  const parseUA = (ua) => {
    if (!ua) return 'Dispositivo desconocido';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('Android')) return 'Dispositivo Android';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Macintosh')) return 'MacBook / iMac';
    if (ua.includes('Linux')) return 'Linux PC';
    return 'Navegador Web';
  };

  const fetchSessions = async () => {
    try {
      const data = await accountApi.getSessions();
      // Mapear los datos del backend a lo que espera la UI
      sessions.value = data.map(s => ({
        id: s.id,
        device: parseUA(s.dispositivo),
        location: s.ip_address || 'Ubicación desconocida',
        time: new Date(s.created_at).toLocaleString(),
        current: false 
      }));
      
      // Marcar la sesión actual (la primera por ser la más reciente creada al loguear)
      if (sessions.value.length > 0) {
        sessions.value[0].current = true;
      }
    } catch(err) {
      console.error("Error al obtener sesiones:", err);
    }
  };

  onMounted(() => {
    fetchSessions();
  });

  async function closeSession(id) {
    if(!confirm("¿Cerrar esta sesión?")) return;
    try {
      await accountApi.closeSession(id);
      sessions.value = sessions.value.filter(s => s.id !== id);
    } catch(err) {
      console.error("Error al cerrar sesión:", err);
      alert("No se pudo cerrar la sesión.");
    }
  }

  async function closeOtherSessions() {
    // Implementación simplificada: cerrar todas menos la actual
    alert("Función para cerrar todas las sesiones disponible en próxima actualización.");
  }

  return { sessions, isUpdating, closeSession, closeOtherSessions };
}
