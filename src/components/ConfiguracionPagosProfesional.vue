<script setup>
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import { API_URLS } from '../config.js';
import { useUserSession } from '../composables/useUserSession.js';
import CreditCardFields from './payments/CreditCardFields.vue';
import PaymentCardVisual from './payments/PaymentCardVisual.vue';
import {
  formatBankAccount,
  getCardValidation,
  validateBankAccount
} from '../utils/paymentValidation.js';

const { state } = useUserSession();

const isLoading = ref(false);
const toast = ref({ show: false, message: '', type: 'success' });
const savedCommissionCard = ref(null);
const commissionCard = ref({ holderName: '', number: '', exp: '', cvc: '' });
const bankAccounts = ref([]);
const bankDraft = ref({
  holderName: '',
  bankName: '',
  accountNumber: '',
  accountType: 'Ahorros'
});
const bankError = ref('');

const banks = [
  'Banreservas',
  'Banco Popular Dominicano',
  'Banco BHD',
  'Banco Santa Cruz',
  'Scotiabank',
  'Banco Caribe',
  'Banco Promerica',
  'Asociacion Cibao',
  'Asociacion Popular'
];

const hasNewCommissionCard = computed(() => commissionCard.value.number.replace(/\D/g, '').length > 0);

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type };
  setTimeout(() => { toast.value.show = false; }, 4000);
};

const normalizeIncomingAccount = (account = {}, index = 0) => ({
  id: account.id || `local-${Date.now()}-${index}`,
  holderName: account.titular || account.holderName || '',
  bankName: account.banco || account.bankName || '',
  accountNumber: formatBankAccount(account.numero_cuenta || account.accountNumber || ''),
  accountType: account.tipo_cuenta || account.accountType || 'Ahorros',
  maskedAccount: account.masked_account || '',
  isDefault: Boolean(account.is_default || account.isDefault || index === 0)
});

const loadData = async () => {
  try {
    const res = await axios.get(`${API_URLS.PERFILES}/api/profesionales/${state.user.id}/financiero`);
    savedCommissionCard.value = res.data?.commission_card || null;
    bankAccounts.value = Array.isArray(res.data?.bank_accounts)
      ? res.data.bank_accounts.map(normalizeIncomingAccount)
      : [];

    if (bankAccounts.value.length === 0 && res.data?.cuenta_bancaria) {
      bankAccounts.value = [normalizeIncomingAccount({
        titular: res.data.nombre || state.user.name,
        banco: res.data.banco,
        numero_cuenta: res.data.cuenta_bancaria,
        is_default: true
      })];
    }
  } catch (error) {
    console.error('Error cargando datos financieros', error);
  }
};

onMounted(loadData);

const addBankAccount = () => {
  bankError.value = '';
  const validation = validateBankAccount(bankDraft.value);

  if (!validation.isValid) {
    bankError.value = Object.values(validation.errors)[0] || 'Verifica los datos bancarios.';
    return;
  }

  const { sanitized } = validation;
  bankAccounts.value.push({
    id: `local-${Date.now()}`,
    holderName: sanitized.holderName,
    bankName: sanitized.bankName,
    accountNumber: formatBankAccount(sanitized.accountNumber),
    accountType: bankDraft.value.accountType || 'Ahorros',
    maskedAccount: `****${sanitized.accountNumber.slice(-4)}`,
    isDefault: bankAccounts.value.length === 0
  });

  bankDraft.value = {
    holderName: '',
    bankName: '',
    accountNumber: '',
    accountType: 'Ahorros'
  };
};

const removeBankAccount = (index) => {
  bankAccounts.value.splice(index, 1);
  if (bankAccounts.value.length > 0 && !bankAccounts.value.some((account) => account.isDefault)) {
    bankAccounts.value[0].isDefault = true;
  }
};

const makeDefaultBank = (index) => {
  bankAccounts.value = bankAccounts.value.map((account, accountIndex) => ({
    ...account,
    isDefault: accountIndex === index
  }));
};

const saveFinancialData = async () => {
  if (!savedCommissionCard.value && !hasNewCommissionCard.value) {
    showToast('Agrega una tarjeta valida para comisiones.', 'error');
    return;
  }

  let cardPayload = {};
  if (hasNewCommissionCard.value) {
    const cardValidation = getCardValidation(commissionCard.value);
    if (!cardValidation.isValid) {
      showToast(Object.values(cardValidation.errors)[0] || 'Verifica la tarjeta de comisiones.', 'error');
      return;
    }
    cardPayload = {
      card_number: cardValidation.sanitized.number,
      card_exp: cardValidation.sanitized.exp,
      card_holder: cardValidation.sanitized.holderName
    };
  }

  if (bankAccounts.value.length === 0) {
    showToast('Agrega al menos una cuenta bancaria.', 'error');
    return;
  }

  const payloadAccounts = [];
  for (const account of bankAccounts.value) {
    const validation = validateBankAccount(account);
    if (!validation.isValid) {
      showToast(Object.values(validation.errors)[0] || 'Verifica las cuentas bancarias.', 'error');
      return;
    }
    payloadAccounts.push({
      titular: validation.sanitized.holderName,
      banco: validation.sanitized.bankName,
      numero_cuenta: validation.sanitized.accountNumber,
      tipo_cuenta: account.accountType || 'Ahorros',
      is_default: Boolean(account.isDefault)
    });
  }

  isLoading.value = true;
  try {
    await axios.put(`${API_URLS.PERFILES}/api/profesionales/${state.user.id}/financiero/v2`, {
      ...cardPayload,
      bank_accounts: payloadAccounts
    });

    commissionCard.value = { holderName: '', number: '', exp: '', cvc: '' };
    showToast('Datos financieros guardados correctamente.', 'success');
    await loadData();
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.error || 'Ocurrio un error al guardar los datos.';
    showToast(message, 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="payments-settings">
    <Transition name="fade">
      <div v-if="toast.show" :class="['form-msg floating-msg', toast.type]">
        {{ toast.message }}
      </div>
    </Transition>

    <div class="panel-title-row">
      <div>
        <h2>Configuracion de Pagos</h2>
        <p>Gestiona como cobras tus servicios y como pagas las comisiones de ServiHub.</p>
      </div>
    </div>

    <section class="settings-section card-section">
      <div class="section-heading">
        <div class="section-icon orange"><i class="fa-solid fa-credit-card"></i></div>
        <div>
          <h3>Tarjeta de comisiones</h3>
          <p>Solo guardamos un token interno, la marca y los ultimos 4 digitos.</p>
        </div>
      </div>

      <div v-if="savedCommissionCard && !hasNewCommissionCard" class="saved-commission">
        <PaymentCardVisual
          :brand="savedCommissionCard.brand"
          :last4="savedCommissionCard.last4"
          :holder-name="savedCommissionCard.holder_name"
          :exp="savedCommissionCard.exp"
        />
      </div>

      <CreditCardFields
        v-model="commissionCard"
        :show-actions="false"
        :compact="Boolean(savedCommissionCard)"
      />
    </section>

    <section class="settings-section bank-section">
      <div class="section-heading">
        <div class="section-icon blue"><i class="fa-solid fa-building-columns"></i></div>
        <div>
          <h3>Cuentas bancarias</h3>
          <p>Puedes agregar varias cuentas y elegir cual sera la principal para recibir pagos.</p>
        </div>
      </div>

      <div v-if="bankAccounts.length > 0" class="bank-list">
        <article v-for="(account, index) in bankAccounts" :key="account.id" class="bank-card" :class="{ primary: account.isDefault }">
          <div>
            <span class="bank-label">{{ account.isDefault ? 'Principal' : account.accountType }}</span>
            <h4>{{ account.bankName }}</h4>
            <p>{{ account.holderName }}</p>
            <strong>{{ account.maskedAccount || ('****' + account.accountNumber.replace(/\D/g, '').slice(-4)) }}</strong>
          </div>
          <div class="bank-actions">
            <button type="button" @click="makeDefaultBank(index)" :disabled="account.isDefault">Principal</button>
            <button type="button" class="danger" @click="removeBankAccount(index)">Quitar</button>
          </div>
        </article>
      </div>

      <div class="bank-draft">
        <div class="field-group">
          <label>Titular de la cuenta</label>
          <input v-model="bankDraft.holderName" type="text" placeholder="Nombre Apellido" />
        </div>
        <div class="field-group">
          <label>Banco</label>
          <select v-model="bankDraft.bankName">
            <option value="" disabled>Selecciona un banco</option>
            <option v-for="bank in banks" :key="bank" :value="bank">{{ bank }}</option>
          </select>
        </div>
        <div class="field-group">
          <label>Tipo</label>
          <select v-model="bankDraft.accountType">
            <option value="Ahorros">Ahorros</option>
            <option value="Corriente">Corriente</option>
          </select>
        </div>
        <div class="field-group">
          <label>Numero de cuenta</label>
          <input
            :value="bankDraft.accountNumber"
            inputmode="numeric"
            placeholder="0000 0000 0000"
            @input="bankDraft.accountNumber = formatBankAccount($event.target.value)"
          />
        </div>
      </div>

      <div v-if="bankError" class="form-msg error">{{ bankError }}</div>
      <button type="button" class="btn-secondary" @click="addBankAccount">
        <i class="fa-solid fa-plus"></i>
        Agregar cuenta
      </button>
    </section>

    <div class="actions-row">
      <button type="button" class="btn-primary" :disabled="isLoading" @click="saveFinancialData">
        <i v-if="isLoading" class="fa-solid fa-circle-notch fa-spin"></i>
        <i v-else class="fa-solid fa-shield-halved"></i>
        {{ isLoading ? 'Guardando...' : 'Guardar datos financieros' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.payments-settings {
  display: grid;
  gap: 20px;
}

.panel-title-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e2e8f0;
}

.panel-title-row h2 {
  margin: 0 0 4px;
  color: #0f172a;
  font-size: 1.2rem;
  font-weight: 900;
}

.panel-title-row p,
.section-heading p {
  margin: 0;
  color: #64748b;
  font-size: 0.88rem;
  line-height: 1.5;
}

.settings-section {
  display: grid;
  gap: 18px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.05);
}

.section-heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-heading h3 {
  margin: 0 0 3px;
  color: #0f172a;
  font-size: 1rem;
  font-weight: 900;
}

.section-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.section-icon.orange {
  color: #c2410c;
  background: #ffedd5;
}

.section-icon.blue {
  color: #0b4c6f;
  background: #dff4ff;
}

.saved-commission {
  max-width: 360px;
}

.bank-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}

.bank-card {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
  border: 1px solid #dbe4ef;
  border-radius: 14px;
  background: linear-gradient(135deg, #f8fafc, #fff);
}

.bank-card.primary {
  border-color: rgba(247, 107, 28, 0.5);
  box-shadow: 0 14px 28px rgba(247, 107, 28, 0.1);
}

.bank-label {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 3px 9px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0b4c6f;
  font-size: 0.68rem;
  font-weight: 900;
  text-transform: uppercase;
}

.bank-card.primary .bank-label {
  background: #ffedd5;
  color: #c2410c;
}

.bank-card h4,
.bank-card p {
  margin: 0;
}

.bank-card h4 {
  color: #0f172a;
  font-size: 0.96rem;
  font-weight: 900;
}

.bank-card p {
  margin-top: 4px;
  color: #64748b;
  font-size: 0.84rem;
}

.bank-card strong {
  display: block;
  margin-top: 10px;
  color: #0b4c6f;
  font-family: "Courier New", monospace;
  font-size: 1.05rem;
}

.bank-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bank-actions button,
.btn-secondary,
.btn-primary {
  border: none;
  border-radius: 10px;
  font-weight: 900;
  cursor: pointer;
  transition: opacity 0.18s, transform 0.18s;
}

.bank-actions button {
  min-width: 84px;
  padding: 8px 10px;
  color: #0b4c6f;
  background: #e0f2fe;
}

.bank-actions button.danger {
  color: #dc2626;
  background: #fee2e2;
}

.bank-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.bank-draft {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding-top: 4px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-group label {
  color: #475569;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field-group input,
.field-group select {
  min-height: 44px;
  border: 1.5px solid #dbe4ef;
  border-radius: 10px;
  padding: 0 12px;
  color: #0f172a;
  background: #fff;
  font: inherit;
  outline: none;
}

.field-group input:focus,
.field-group select:focus {
  border-color: #f76b1c;
  box-shadow: 0 0 0 3px rgba(247, 107, 28, 0.13);
}

.btn-secondary {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  color: #0b4c6f;
  background: #e0f2fe;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 20px;
  color: #fff;
  background: linear-gradient(135deg, #f76b1c, #0b4c6f);
}

.btn-primary:disabled {
  opacity: 0.62;
  cursor: not-allowed;
}

.form-msg {
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 800;
}

.form-msg.success {
  color: #15803d;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
}

.form-msg.error {
  color: #dc2626;
  border: 1px solid #fecaca;
  background: #fef2f2;
}

.floating-msg {
  position: fixed;
  z-index: 9999;
  top: 20px;
  left: 50%;
  min-width: 300px;
  transform: translateX(-50%);
  text-align: center;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.16);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -8px);
}

@media (max-width: 700px) {
  .bank-draft {
    grid-template-columns: 1fr;
  }

  .bank-card {
    flex-direction: column;
  }

  .bank-actions {
    flex-direction: row;
  }

  .actions-row,
  .btn-primary {
    width: 100%;
  }
}
</style>
