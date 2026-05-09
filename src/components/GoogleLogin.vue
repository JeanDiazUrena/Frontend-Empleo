<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  activateGoogleLogin,
  clearGoogleLogin,
  renderGoogleLoginButton
} from '../services/googleIdentity.js';

const props = defineProps({
  callback: {
    type: Function,
    required: true
  },
  error: {
    type: Function,
    default: null
  },
  buttonConfig: {
    type: Object,
    default: () => ({})
  }
});

const buttonRef = ref(null);
const loadError = ref(false);

function setActiveCallback() {
  activateGoogleLogin(props.callback, props.error);
}

async function renderButton() {
  try {
    setActiveCallback();
    await renderGoogleLoginButton(buttonRef.value, props.buttonConfig);
  } catch (error) {
    loadError.value = true;
    console.error('Google Login failed to load:', error);
    props.error?.(error);
  }
}

onMounted(renderButton);
watch(() => props.callback, setActiveCallback);

onBeforeUnmount(() => {
  clearGoogleLogin(props.callback);
});
</script>

<template>
  <div
    class="google-login-wrapper"
    :class="{ 'has-error': loadError }"
    @pointerdown.capture="setActiveCallback"
    @mouseenter="setActiveCallback"
    @focusin="setActiveCallback"
  >
    <div class="google-login-visual" aria-hidden="true">
      <svg class="google-g" viewBox="0 0 48 48" focusable="false" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59A14.43 14.43 0 0 1 9.75 24c0-1.59.28-3.14.78-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.85.92 7.48 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      <span>Continuar con Google</span>
    </div>

    <div v-show="!loadError" class="google-login-hitbox" aria-label="Continuar con Google">
      <div ref="buttonRef" class="google-login-button"></div>
    </div>
  </div>
</template>

<style scoped>
.google-login-wrapper {
  position: relative;
  display: flex;
  width: 100%;
  height: 48px;
  margin: 10px 0;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.google-login-wrapper:not(.has-error):hover {
  transform: translateY(-1px);
}

.google-login-wrapper.has-error {
  opacity: 0.7;
}

.google-login-visual {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 48px;
  border: 1px solid #D1D5DB;
  border-radius: 10px;
  background: #FFFFFF;
  color: #111827;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  pointer-events: none;
  user-select: none;
}

.google-g {
  width: 21px;
  height: 21px;
  flex: 0 0 auto;
}

.google-login-hitbox {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  width: 100%;
  height: 48px;
  overflow: hidden;
  opacity: 0.01;
}

.google-login-button {
  display: flex;
  width: 100%;
  height: 48px;
}

.google-login-button :deep(div),
.google-login-button :deep(iframe) {
  width: 100% !important;
  max-width: 100% !important;
  height: 48px !important;
  border-radius: 10px !important;
  overflow: hidden;
}
</style>
