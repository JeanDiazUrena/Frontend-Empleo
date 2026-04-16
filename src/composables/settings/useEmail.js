import { ref } from 'vue';
import { accountApi } from '../../services/accountSettingsService';

export function useEmail() {
  const currentEmail = ref('usuario@example.com');
  const newEmail = ref('');
  const emailCode = ref('');
  const codeSent = ref(false);
  const emailMsg = ref('');
  const emailSuccess = ref(false);
  const isSending = ref(false);
  const isConfirming = ref(false);

  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  async function sendCode() {
    emailMsg.value = '';
    if (!newEmail.value || !isValidEmail(newEmail.value)) {
      emailMsg.value = 'Ingresa un correo electrónico válido.'; 
      emailSuccess.value = false; 
      return;
    }
    
    isSending.value = true;
    try {
      const res = await accountApi.requestEmailChangeCode(newEmail.value);
      codeSent.value = true;
      emailMsg.value = res.message;
      emailSuccess.value = true;
    } catch (err) {
      emailMsg.value = err.message || 'Error al enviar código.';
      emailSuccess.value = false;
    } finally {
      isSending.value = false;
    }
  }

  async function confirmEmail() {
    if (emailCode.value.length < 6) {
      emailMsg.value = 'Ingresa el código completo de 6 dígitos.'; 
      emailSuccess.value = false; 
      return;
    }

    isConfirming.value = true;
    try {
      const res = await accountApi.verifyEmailCode(emailCode.value, newEmail.value);
      currentEmail.value = res.email;
      newEmail.value = ''; 
      emailCode.value = ''; 
      codeSent.value = false;
      emailMsg.value = res.message; 
      emailSuccess.value = true;
    } catch (err) {
      emailMsg.value = err.message || 'Código incorrecto.';
      emailSuccess.value = false;
    } finally {
      isConfirming.value = false;
    }
  }

  return { currentEmail, newEmail, emailCode, codeSent, emailMsg, emailSuccess, isSending, isConfirming, sendCode, confirmEmail };
}
