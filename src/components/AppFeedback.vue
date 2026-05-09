<script setup>
import { computed } from 'vue';
import { useAppFeedback } from '../composables/useAppFeedback.js';

const { feedbackState, answerConfirm } = useAppFeedback();

const toastIcon = computed(() => {
  if (feedbackState.toast.type === 'error') return 'fa-solid fa-circle-exclamation';
  if (feedbackState.toast.type === 'info') return 'fa-solid fa-circle-info';
  return 'fa-solid fa-circle-check';
});

const confirmIcon = computed(() => {
  if (feedbackState.confirm.tone === 'danger') return 'fa-solid fa-triangle-exclamation';
  if (feedbackState.confirm.tone === 'info') return 'fa-solid fa-circle-info';
  return 'fa-solid fa-circle-question';
});
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-slide">
      <div
        v-if="feedbackState.toast.show"
        :class="['app-toast', `toast-${feedbackState.toast.type}`]"
        role="status"
        aria-live="polite"
      >
        <i :class="toastIcon"></i>
        <span>{{ feedbackState.toast.message }}</span>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <div
        v-if="feedbackState.confirm.show"
        class="app-confirm-backdrop"
        @click.self="answerConfirm(false)"
      >
        <div :class="['app-confirm-card', `tone-${feedbackState.confirm.tone}`]" role="dialog" aria-modal="true">
          <div class="app-confirm-icon">
            <i :class="confirmIcon"></i>
          </div>
          <div class="app-confirm-copy">
            <h3>{{ feedbackState.confirm.title }}</h3>
            <p>{{ feedbackState.confirm.message }}</p>
          </div>
          <div class="app-confirm-actions">
            <button type="button" class="btn-cancel" @click="answerConfirm(false)">
              {{ feedbackState.confirm.cancelText }}
            </button>
            <button type="button" class="btn-confirm" @click="answerConfirm(true)">
              {{ feedbackState.confirm.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-toast {
  position: fixed;
  top: 22px;
  right: 22px;
  z-index: 20000;
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(390px, calc(100vw - 32px));
  padding: 14px 16px;
  border-radius: 10px;
  background: #FFFFFF;
  color: #0F172A;
  border: 1px solid #E2E8F0;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
  font-weight: 800;
  font-size: 0.92rem;
}

.app-toast i {
  font-size: 1.05rem;
}

.toast-success {
  border-color: #BBF7D0;
  background: #F0FDF4;
}

.toast-success i {
  color: #16A34A;
}

.toast-error {
  border-color: #FECACA;
  background: #FEF2F2;
}

.toast-error i {
  color: #DC2626;
}

.toast-info {
  border-color: #BAE6FD;
  background: #F0F9FF;
}

.toast-info i {
  color: #0B4C6F;
}

.app-confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 19999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(6px);
}

.app-confirm-card {
  width: min(430px, 100%);
  padding: 26px;
  border-radius: 14px;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.28);
  text-align: center;
}

.app-confirm-icon {
  width: 54px;
  height: 54px;
  margin: 0 auto 16px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #FFF7ED;
  color: #F97316;
  font-size: 1.35rem;
}

.tone-danger .app-confirm-icon {
  background: #FEF2F2;
  color: #DC2626;
}

.tone-info .app-confirm-icon {
  background: #E0F2FE;
  color: #0B4C6F;
}

.app-confirm-copy h3 {
  margin: 0 0 8px;
  color: #0F172A;
  font-size: 1.25rem;
  font-weight: 900;
}

.app-confirm-copy p {
  margin: 0;
  color: #64748B;
  line-height: 1.55;
  font-size: 0.95rem;
}

.app-confirm-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.app-confirm-actions button {
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 850;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.btn-cancel {
  background: #F8FAFC;
  color: #475569;
  border: 1px solid #E2E8F0 !important;
}

.btn-cancel:hover {
  background: #F1F5F9;
}

.btn-confirm {
  background: #0B4C6F;
  color: #FFFFFF;
  box-shadow: 0 8px 18px rgba(11, 76, 111, 0.22);
}

.tone-danger .btn-confirm {
  background: #DC2626;
  box-shadow: 0 8px 18px rgba(220, 38, 38, 0.2);
}

.btn-confirm:hover {
  transform: translateY(-1px);
}

.toast-slide-enter-active,
.toast-slide-leave-active,
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .app-confirm-card,
.modal-fade-leave-to .app-confirm-card {
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 520px) {
  .app-toast {
    top: 14px;
    right: 16px;
    left: 16px;
    width: auto;
  }

  .app-confirm-actions {
    flex-direction: column-reverse;
  }
}
</style>
