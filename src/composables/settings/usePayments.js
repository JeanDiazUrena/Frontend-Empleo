import { ref, onMounted } from 'vue';
import { accountApi } from '../../services/accountSettingsService';

export function usePayments() {
  const cards = ref([]);
  const showAddCard = ref(false);
  const newCard = ref({ number: '', name: '', exp: '', cvv: '' });
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
    if(!confirm("¿Seguro que deseas eliminar esta tarjeta?")) return;
    try {
      await accountApi.removeCard(id);
      cards.value = cards.value.filter(c => c.id !== id);
    } catch (err) {
      console.error(err);
    }
  }

  // Basic validation rules for production
  const isValidCard = (card) => {
    return card.number.replace(/\s+/g, '').length >= 13 && 
           card.name.length >= 3 &&
           /^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(card.exp) &&
           /^[0-9]{3,4}$/.test(card.cvv);
  };

  async function addCard() {
    cardMsg.value = '';
    
    if (!isValidCard(newCard.value)) {
      cardMsg.value = 'Por favor, verifica los datos de tu tarjeta.'; 
      return;
    }

    isUpdating.value = true;
    try {
      const payload = {
        number: newCard.value.number.replace(/\s+/g, ''),
        name: newCard.value.name,
        exp: newCard.value.exp,
        // En una app real NO enviamos el CVV al estado/backend, 
        // se usa un token de Stripe/MercadoPago directamente.
      };
      
      const res = await accountApi.addCard(payload);
      if (res.success) {
        cards.value.push(res.data);
        newCard.value = { number: '', name: '', exp: '', cvv: '' };
        showAddCard.value = false;
      }
    } catch (err) {
      cardMsg.value = err.message || 'Error al agregar tarjeta.';
    } finally {
      isUpdating.value = false;
    }
  }

  return { cards, showAddCard, newCard, cardMsg, isUpdating, removeCard, addCard };
}
