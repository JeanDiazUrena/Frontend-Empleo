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
    @pointerdown.capture="setActiveCallback"
    @mouseenter="setActiveCallback"
    @focusin="setActiveCallback"
  >
    <div v-show="!loadError" ref="buttonRef" class="google-login-button"></div>
    <button v-if="loadError" type="button" class="google-login-fallback" disabled>
      Continuar con Google
    </button>
  </div>
</template>

<style scoped>
.google-login-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 10px 0;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.google-login-wrapper:hover {
  transform: translateY(-1px);
}

.google-login-button {
  display: flex;
  width: 100%;
  justify-content: center;
  min-height: 44px;
}

.google-login-button :deep(div),
.google-login-button :deep(iframe) {
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 10px !important;
  overflow: hidden;
}

.google-login-fallback {
  width: 100%;
  padding: 14px;
  background: #4285F4;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 700;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>
