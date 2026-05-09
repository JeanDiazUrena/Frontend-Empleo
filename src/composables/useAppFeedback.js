import { reactive } from 'vue';

const feedbackState = reactive({
  toast: {
    show: false,
    message: '',
    type: 'success'
  },
  confirm: {
    show: false,
    title: 'Confirmar acción',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    tone: 'warning'
  }
});

let toastTimer = null;
let confirmResolver = null;

const toneDefaults = {
  warning: {
    title: 'Confirmar acción',
    confirmText: 'Confirmar'
  },
  danger: {
    title: 'Confirmar eliminación',
    confirmText: 'Eliminar'
  },
  info: {
    title: 'Revisar acción',
    confirmText: 'Entendido'
  }
};

export function useAppFeedback() {
  const showToast = (message, type = 'success', duration = 3800) => {
    if (toastTimer) clearTimeout(toastTimer);

    feedbackState.toast = {
      show: true,
      message,
      type
    };

    toastTimer = setTimeout(() => {
      feedbackState.toast.show = false;
    }, duration);
  };

  const confirmAction = (options) => new Promise((resolve) => {
    const config = typeof options === 'string' ? { message: options } : options;
    const tone = config.tone || 'warning';
    const defaults = toneDefaults[tone] || toneDefaults.warning;

    if (confirmResolver) confirmResolver(false);
    confirmResolver = resolve;

    feedbackState.confirm = {
      show: true,
      title: config.title || defaults.title,
      message: config.message || '',
      confirmText: config.confirmText || defaults.confirmText,
      cancelText: config.cancelText || 'Cancelar',
      tone
    };
  });

  const answerConfirm = (accepted) => {
    feedbackState.confirm.show = false;
    if (confirmResolver) {
      confirmResolver(Boolean(accepted));
      confirmResolver = null;
    }
  };

  return {
    feedbackState,
    showToast,
    confirmAction,
    answerConfirm
  };
}
