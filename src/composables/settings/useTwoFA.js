import { ref, onMounted } from 'vue';
import { accountApi } from '../../services/accountSettingsService';

export function useTwoFA() {
  const twofa = ref({ enabled: false, method: 'sms', showQR: false });
  const isUpdating = ref(false);

  onMounted(async () => {
    try {
      const res = await accountApi.getTwofaStatus();
      if(res.success) {
        twofa.value.enabled = res.data.enabled;
        twofa.value.method = res.data.method;
      }
    } catch(err) {
      console.error(err);
    }
  });

  async function toggleTwoFA() {
    const newState = !twofa.value.enabled;
    isUpdating.value = true;
    try {
      await accountApi.toggleTwofa(newState, twofa.value.method);
      twofa.value.enabled = newState;
      if (twofa.value.enabled && twofa.value.method === 'app') {
        twofa.value.showQR = true;
      } else {
        twofa.value.showQR = false;
      }
    } catch (err) {
      console.error(err);
    } finally {
      isUpdating.value = false;
    }
  }

  return { twofa, isUpdating, toggleTwoFA };
}
