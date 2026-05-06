import { ref, onMounted } from 'vue';
import { accountApi } from '../../services/accountSettingsService';

export function useEmail() {
  const currentEmail = ref('Cargando...');
  const newEmail = ref('');
  const emailMsg = ref('');
  const emailSuccess = ref(false);
  const isUpdating = ref(false);

  const fetchEmail = async () => {
    try {
      const data = await accountApi.getMe();
      currentEmail.value = data.email;
    } catch (err) {
      console.error(err);
      currentEmail.value = 'Error al cargar';
    }
  };

  onMounted(() => {
    fetchEmail();
  });

  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  async function updateEmail() {
    emailMsg.value = '';
    if (!newEmail.value || !isValidEmail(newEmail.value)) {
      emailMsg.value = 'Ingresa un correo electrónico válido.'; 
      emailSuccess.value = false; 
      return;
    }

    if (newEmail.value === currentEmail.value) {
      emailMsg.value = 'El nuevo correo debe ser diferente al actual.';
      emailSuccess.value = false;
      return;
    }
    
    isUpdating.value = true;
    try {
      const res = await accountApi.changeEmail(newEmail.value);
      emailMsg.value = res.message;
      emailSuccess.value = true;
      currentEmail.value = newEmail.value;
      newEmail.value = '';
    } catch (err) {
      emailMsg.value = err.message || 'Error al actualizar email.';
      emailSuccess.value = false;
    } finally {
      isUpdating.value = false;
    }
  }

  // Mantenemos estas funciones por compatibilidad con la UI si es necesario, 
  // pero las redirigimos a updateEmail o las dejamos vacías.
  async function sendCode() {
    await updateEmail();
  }

  return { currentEmail, newEmail, emailMsg, emailSuccess, isUpdating, sendCode, updateEmail };
}
