import { ref, onMounted } from 'vue';
import { accountApi } from '../../services/accountSettingsService';

export function useSessions() {
  const sessions = ref([]);
  const isUpdating = ref(false);

  const fetchSessions = async () => {
    try {
      const res = await accountApi.getSessions();
      if(res.success) sessions.value = res.data;
    } catch(err) {
      console.error(err);
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
      console.error(err);
    }
  }

  async function closeOtherSessions() {
    isUpdating.value = true;
    try {
      await accountApi.closeOtherSessions();
      sessions.value = sessions.value.filter(s => s.current);
    } catch(err) {
      console.error(err);
    } finally {
      isUpdating.value = false;
    }
  }

  return { sessions, isUpdating, closeSession, closeOtherSessions };
}
