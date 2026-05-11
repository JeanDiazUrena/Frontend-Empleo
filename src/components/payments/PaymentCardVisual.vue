<script setup>
import { computed } from 'vue';
import { getBrandData, maskCardLast4, normalizeCardBrand } from '../../utils/paymentValidation.js';

const props = defineProps({
  brand: { type: String, default: 'card' },
  last4: { type: String, default: '' },
  number: { type: String, default: '' },
  holderName: { type: String, default: '' },
  exp: { type: String, default: '' },
  selected: { type: Boolean, default: false },
  compact: { type: Boolean, default: false }
});

const brandData = computed(() => getBrandData(props.brand || props.number));
const brandClass = computed(() => normalizeCardBrand(props.brand || props.number));
const displayLast4 = computed(() => props.last4 || String(props.number || '').replace(/\D/g, '').slice(-4));
const displayNumber = computed(() => displayLast4.value ? maskCardLast4(displayLast4.value) : '•••• •••• •••• ••••');
const displayHolder = computed(() => props.holderName || 'Nombre Apellido');
const displayExp = computed(() => props.exp || 'MM/AA');
</script>

<template>
  <div :class="['payment-card-visual', brandClass, { selected, compact }]">
    <div class="card-glow"></div>
    <div class="card-topline">
      <div class="card-chip">
        <span></span>
        <span></span>
      </div>
      <div class="brand-mark">
        <i :class="brandData.icon"></i>
        <span>{{ brandData.label }}</span>
      </div>
    </div>

    <div class="card-number">{{ displayNumber }}</div>

    <div class="card-bottomline">
      <div>
        <span class="card-meta-label">Titular</span>
        <strong>{{ displayHolder }}</strong>
      </div>
      <div>
        <span class="card-meta-label">Vence</span>
        <strong>{{ displayExp }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.payment-card-visual {
  position: relative;
  overflow: hidden;
  min-height: 178px;
  border-radius: 18px;
  padding: 20px;
  color: #fff;
  background:
    radial-gradient(circle at 88% 12%, rgba(255, 255, 255, 0.24), transparent 28%),
    linear-gradient(135deg, #0b4c6f 0%, #12364f 48%, #f76b1c 160%);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.14);
  isolation: isolate;
}

.payment-card-visual.compact {
  min-height: 148px;
  padding: 16px;
}

.payment-card-visual.selected {
  outline: 3px solid rgba(247, 107, 28, 0.34);
  box-shadow: 0 22px 48px rgba(247, 107, 28, 0.22);
}

.payment-card-visual.mastercard {
  background:
    radial-gradient(circle at 86% 18%, rgba(247, 107, 28, 0.35), transparent 30%),
    linear-gradient(135deg, #18223a 0%, #0f172a 58%, #f76b1c 150%);
}

.payment-card-visual.amex {
  background:
    radial-gradient(circle at 86% 18%, rgba(255, 255, 255, 0.28), transparent 30%),
    linear-gradient(135deg, #075985 0%, #0b4c6f 58%, #38bdf8 150%);
}

.payment-card-visual.card {
  background:
    radial-gradient(circle at 86% 18%, rgba(255, 255, 255, 0.18), transparent 30%),
    linear-gradient(135deg, #334155 0%, #0f172a 100%);
}

.card-glow {
  position: absolute;
  inset: auto -36px -52px auto;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  z-index: -1;
}

.card-topline,
.card-bottomline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-chip {
  width: 42px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f8d47a, #b78122);
  display: grid;
  grid-template-columns: 1fr 1fr;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.card-chip span {
  border: 1px solid rgba(90, 61, 12, 0.22);
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.9);
}

.brand-mark i {
  font-size: 1.45rem;
}

.card-number {
  margin: 32px 0 24px;
  font-family: "Courier New", monospace;
  font-size: 1.16rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  white-space: nowrap;
}

.compact .card-number {
  margin: 22px 0 18px;
  font-size: 1rem;
}

.card-bottomline strong {
  display: block;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.9rem;
  text-transform: uppercase;
}

.card-meta-label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.62);
}

@media (max-width: 430px) {
  .payment-card-visual {
    min-height: 158px;
    padding: 16px;
  }

  .card-number {
    font-size: 0.96rem;
    letter-spacing: 0.08em;
  }

  .brand-mark span {
    display: none;
  }
}
</style>
