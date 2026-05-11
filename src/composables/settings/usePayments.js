import { ref, onMounted } from 'vue';
import { accountApi } from '../../services/accountSettingsService';
import { useAppFeedback } from '../useAppFeedback';
import { getCardValidation } from '../../utils/paymentValidation';

export function usePayments() {
  const { confirmAction, showToast } = useAppFeedback();
  const cards = ref([]);
  const showAddCard = ref(false);
  const newCard = ref({ holderName: '', number: '', exp: '', cvc: '' });
  const cardMsg = ref('');
  const isUpdating = ref(false);

  const fetchCards = async () => {
    try {
      const res = await accountApi.getCards();
      if (res.success) cards.value = res.data;
    } catch (err) {
      console.error('Error fetching cards:', err);
    }
  };

  onMounted(() => {
    fetchCards();
  });

  async function removeCard(id) {
    const confirmed = await confirmAction({
      title: 'Eliminar tarjeta',
      message: '¿Seguro que deseas eliminar esta tarjeta?',
      confirmText: 'Eliminar',
      cancelText: 'Conservar',
      tone: 'danger'
    });
    if (!confirmed) return;

    try {
      await accountApi.removeCard(id);
      cards.value = cards.value.filter(c => c.id !== id);
      showToast('Tarjeta eliminada correctamente.', 'success');
    } catch (err) {
      console.error(err);
      showToast('No se pudo eliminar la tarjeta.', 'error');
    }
  }

  async function addCard() {
    cardMsg.value = '';
    const validation = getCardValidation(newCard.value);
    
    if (!validation.isValid) {
      cardMsg.value = Object.values(validation.errors)[0] || 'Por favor, verifica los datos de tu tarjeta.';
      return;
    }

    isUpdating.value = true;
    try {
      const { sanitized, brand } = validation;
      const payload = {
        brand: brand.label,
        card_number: sanitized.number,
        holder_name: sanitized.holderName,
        exp: sanitized.exp,
      };
      
      const res = await accountApi.addCard(payload);
      if (res.success) {
        cards.value.push(res.data);
        newCard.value = { holderName: '', number: '', exp: '', cvc: '' };
        showAddCard.value = false;
        showToast('Tarjeta guardada correctamente.', 'success');
      }
    } catch (err) {
      cardMsg.value = err.message || 'Error al agregar tarjeta.';
    } finally {
      isUpdating.value = false;
    }
  }

  return { cards, showAddCard, newCard, cardMsg, isUpdating, removeCard, addCard };
}
