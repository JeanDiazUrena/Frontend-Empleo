import { ref, computed } from 'vue';
import { accountApi } from '../../services/accountSettingsService';
import { getPasswordStatus, passwordRequirements } from '../../utils/passwordRules';

export function usePassword() {
  const pwd = ref({ current: '', next: '', confirm: '' });
  const showPwd = ref({ current: false, next: false, confirm: false });
  const pwdMsg = ref('');
  const pwdSuccess = ref(false);
  const isUpdating = ref(false);

  const passwordStatus = computed(() => getPasswordStatus(pwd.value.next));
  const passwordChecks = computed(() => passwordStatus.value.checks);
  const passwordHint = computed(() => (
    pwd.value.next && !passwordStatus.value.isValid ? passwordStatus.value.missingMessage : ''
  ));
  const strength = computed(() => passwordStatus.value.score);

  const strengthLabel = computed(() => ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente'][strength.value]);
  const strengthColor = computed(() => ['', '#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#22c55e'][strength.value]);

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
    if (!passwordStatus.value.isValid) {
      pwdMsg.value = passwordStatus.value.missingMessage || 'La contraseña no cumple los requisitos.';
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

  return {
    pwd,
    showPwd,
    pwdMsg,
    pwdSuccess,
    isUpdating,
    strength,
    strengthLabel,
    strengthColor,
    passwordChecks,
    passwordHint,
    passwordRequirements,
    updatePassword
  };
}
