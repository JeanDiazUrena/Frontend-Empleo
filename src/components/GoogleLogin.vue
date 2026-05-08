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
  display: block;
  width: 100%;
}

.google-login-button {
  display: flex;
  width: 100%;
}

.google-login-button :deep(div),
.google-login-button :deep(iframe) {
  max-width: 100%;
}

.google-login-fallback {
  width: 100%;
  padding: 14px;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 10px;
  color: #6B7280;
  font-weight: 600;
  cursor: not-allowed;
}
</style>
