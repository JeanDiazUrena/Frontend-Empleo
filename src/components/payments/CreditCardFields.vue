<script setup>
import { computed, ref } from 'vue';
import PaymentCardVisual from './PaymentCardVisual.vue';
import {
  detectCardBrand,
  formatCardNumber,
  formatCvcInput,
  formatExpiryInput,
  getCardValidation,
  onlyDigits
} from '../../utils/paymentValidation.js';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ holderName: '', number: '', exp: '', cvc: '' })
  },
  busy: { type: Boolean, default: false },
  submitText: { type: String, default: 'Guardar tarjeta' },
  showActions: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);
const touched = ref({});

const card = computed(() => ({
  holderName: props.modelValue.holderName ?? props.modelValue.holder_name ?? props.modelValue.name ?? '',
  number: props.modelValue.number ?? props.modelValue.card_number ?? '',
  exp: props.modelValue.exp ?? props.modelValue.expiry ?? '',
  cvc: props.modelValue.cvc ?? props.modelValue.cvv ?? ''
}));

const validation = computed(() => getCardValidation(card.value));
const brand = computed(() => validation.value.brand);
const digits = computed(() => onlyDigits(card.value.number));
const previewLast4 = computed(() => digits.value.slice(-4));
const canSubmit = computed(() => validation.value.isValid && !props.busy);

const updateField = (field, value) => {
  let nextValue = value;
  if (field === 'number') nextValue = formatCardNumber(value);
  if (field === 'exp') nextValue = formatExpiryInput(value);
  if (field === 'cvc') nextValue = formatCvcInput(value, detectCardBrand(card.value.number).key);

  emit('update:modelValue', {
    ...card.value,
    [field]: nextValue
  });
};

const markTouched = (field) => {
  touched.value = { ...touched.value, [field]: true };
};

const fieldError = (field) => {
  if (!touched.value[field] && !card.value[field]) return '';
  return validation.value.errors[field] || '';
};

const submit = () => {
  touched.value = { holderName: true, number: true, exp: true, cvc: true };
  if (!validation.value.isValid) return;
  emit('submit', validation.value);
};
</script>

<template>
  <div class="smart-card-form" :class="{ compact }">
    <PaymentCardVisual
      :brand="brand.key"
      :last4="previewLast4"
      :holder-name="card.holderName"
      :exp="card.exp"
      :compact="compact"
    />

    <div class="card-fields">
      <div class="field-group full">
        <label>Nombre del titular</label>
        <input
          :value="card.holderName"
          type="text"
          autocomplete="cc-name"
          placeholder="Nombre Apellido"
          @input="updateField('holderName', $event.target.value)"
          @blur="markTouched('holderName')"
        />
        <small v-if="fieldError('holderName')" class="field-error">{{ fieldError('holderName') }}</small>
      </div>

      <div class="field-group full">
        <label>Número de tarjeta</label>
        <div class="brand-input">
          <input
            :value="card.number"
            type="text"
            inputmode="numeric"
            autocomplete="cc-number"
            maxlength="23"
            placeholder="4242 4242 4242 4242"
            @input="updateField('number', $event.target.value)"
            @blur="markTouched('number')"
          />
          <span class="brand-pill">
            <i :class="brand.icon"></i>
            {{ brand.label }}
          </span>
        </div>
        <small v-if="fieldError('number')" class="field-error">{{ fieldError('number') }}</small>
      </div>

      <div class="field-group">
        <label>Vencimiento</label>
        <input
          :value="card.exp"
          type="text"
          inputmode="numeric"
          autocomplete="cc-exp"
          maxlength="5"
          placeholder="MM/AA"
          @input="updateField('exp', $event.target.value)"
          @blur="markTouched('exp')"
        />
        <small v-if="fieldError('exp')" class="field-error">{{ fieldError('exp') }}</small>
      </div>

      <div class="field-group">
        <label>CVV</label>
        <input
          :value="card.cvc"
          type="password"
          inputmode="numeric"
          autocomplete="cc-csc"
          :maxlength="brand.cvcLength"
          :placeholder="brand.key === 'amex' ? '1234' : '123'"
          @input="updateField('cvc', $event.target.value)"
          @blur="markTouched('cvc')"
        />
        <small v-if="fieldError('cvc')" class="field-error">{{ fieldError('cvc') }}</small>
      </div>
    </div>

    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

    <div v-if="showActions" class="card-actions">
      <button type="button" class="btn-card-secondary" @click="$emit('cancel')" :disabled="busy">
        Cancelar
      </button>
      <button type="button" class="btn-card-primary" @click="submit" :disabled="!canSubmit">
        <i v-if="busy" class="fa-solid fa-spinner fa-spin"></i>
        <i v-else class="fa-solid fa-shield-check"></i>
        {{ busy ? 'Guardando...' : submitText }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.smart-card-form {
  display: grid;
  gap: 18px;
}

.card-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-group.full {
  grid-column: 1 / -1;
}

.field-group label {
  font-size: 0.72rem;
  font-weight: 900;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.field-group input {
  width: 100%;
  min-height: 46px;
  border: 1.5px solid #dbe4ef;
  border-radius: 10px;
  padding: 0 13px;
  font: inherit;
  font-size: 0.92rem;
  color: #0f172a;
  background: #fff;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.18s, box-shadow 0.18s;
}

.field-group input:focus {
  border-color: #f76b1c;
  box-shadow: 0 0 0 3px rgba(247, 107, 28, 0.13);
}

.brand-input {
  position: relative;
}

.brand-input input {
  padding-right: 138px;
}

.brand-pill {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 124px;
  border-radius: 999px;
  padding: 6px 9px;
  background: #f8fafc;
  color: #0b4c6f;
  font-size: 0.72rem;
  font-weight: 900;
  white-space: nowrap;
}

.brand-pill i {
  font-size: 1rem;
}

.field-error,
.form-error {
  color: #dc2626;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.35;
}

.form-error {
  margin: -4px 0 0;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-card-primary,
.btn-card-secondary {
  min-height: 42px;
  border-radius: 10px;
  padding: 0 16px;
  font-weight: 900;
  font-size: 0.86rem;
  cursor: pointer;
  transition: transform 0.16s, opacity 0.16s, background 0.16s;
}

.btn-card-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: none;
  color: #fff;
  background: linear-gradient(135deg, #f76b1c, #0b4c6f);
}

.btn-card-secondary {
  border: 1.5px solid #dbe4ef;
  color: #475569;
  background: #fff;
}

.btn-card-primary:hover,
.btn-card-secondary:hover {
  transform: translateY(-1px);
}

.btn-card-primary:disabled,
.btn-card-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 520px) {
  .card-fields {
    grid-template-columns: 1fr;
  }

  .brand-input input {
    padding-right: 112px;
  }

  .brand-pill {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
