import { ref, computed } from 'vue';
import { accountApi } from '../../services/accountSettingsService';

export function usePassword() {
  const pwd = ref({ current: '', next: '', confirm: '' });
  const showPwd = ref({ current: false, next: false, confirm: false });
  const pwdMsg = ref('');
  const pwdSuccess = ref(false);
  const isUpdating = ref(false);

  const strength = computed(() => {
    const v = pwd.value.next;
    if (!v) return 0;
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;
    return s;
  });

  const strengthLabel = computed(() => ['', 'Débil', 'Regular', 'Buena', 'Excelente'][strength.value]);
  const strengthColor = computed(() => ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][strength.value]);

  async function updatePassword() {
    pwdMsg.value = '';
    
    if (!pwd.value.current || !pwd.value.next || !pwd.value.confirm) {
      pwdMsg.value = 'Completa todos los campos.'; 
      pwdSuccess.value = false; 
      return;
    }
    if (pwd.value.next !== pwd.value.confirm) {
      pwdMsg.value = 'Las contraseñas no coinciden.'; 
      pwdSuccess.value = false; 
      return;
    }
    if (strength.value < 2) {
      pwdMsg.value = 'La contraseña es demasiado débil.'; 
      pwdSuccess.value = false; 
      return;
    }

    isUpdating.value = true;
    try {
      const res = await accountApi.updatePassword(pwd.value);
      pwdMsg.value = res.message;
      pwdSuccess.value = true;
      pwd.value = { current: '', next: '', confirm: '' };
    } catch (err) {
      pwdMsg.value = err.message || 'Ocurrió un error.';
      pwdSuccess.value = false;
    } finally {
      isUpdating.value = false;
    }
  }

  return { pwd, showPwd, pwdMsg, pwdSuccess, isUpdating, strength, strengthLabel, strengthColor, updatePassword };
}
