const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';
const STATE_KEY = '__SERVIHUB_GOOGLE_IDENTITY__';

const fallbackState = {
  clientId: '',
  sdkPromise: null,
  initialized: false,
  activeCallback: null,
  activeError: null
};

function getState() {
  if (typeof window === 'undefined') return fallbackState;

  if (!window[STATE_KEY]) {
    window[STATE_KEY] = { ...fallbackState };
  }

  return window[STATE_KEY];
}

function resolveButtonWidth(container) {
  const parentWidth = container.parentElement?.clientWidth || container.clientWidth || 400;
  return Math.max(240, Math.floor(parentWidth));
}

function initializeGoogleIdentity(google) {
  const state = getState();
  if (state.initialized) return;
  if (!state.clientId) throw new Error('Google Client ID is required.');

  google.accounts.id.initialize({
    client_id: state.clientId,
    auto_select: false, // Evita que aparezca automáticamente la cuenta
    callback: (response) => {
      const currentState = getState();

      if (response?.credential && currentState.activeCallback) {
        currentState.activeCallback(response);
        return;
      }

      if (!response?.credential && currentState.activeError) {
        currentState.activeError(response);
      }
    },
    use_fedcm_for_prompt: true
  });

  state.initialized = true;
}

function ensureGoogleIdentity() {
  const state = getState();

  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Identity Services requires a browser.'));
  }

  if (window.google?.accounts?.id) {
    initializeGoogleIdentity(window.google);
    return Promise.resolve(window.google);
  }

  if (!state.sdkPromise) {
    state.sdkPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);

      const handleLoad = () => {
        if (!window.google?.accounts?.id) {
          reject(new Error('Google Identity Services did not load correctly.'));
          return;
        }

        initializeGoogleIdentity(window.google);
        resolve(window.google);
      };

      const handleError = () => {
        reject(new Error('Failed to load Google Identity Services.'));
      };

      if (existingScript) {
        existingScript.addEventListener('load', handleLoad, { once: true });
        existingScript.addEventListener('error', handleError, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', handleLoad, { once: true });
      script.addEventListener('error', handleError, { once: true });
      document.head.appendChild(script);
    });
  }

  return state.sdkPromise;
}

export function configureGoogleIdentity({ clientId }) {
  if (!clientId) throw new Error('Google Client ID is required.');

  const state = getState();
  if (!state.clientId) {
    state.clientId = clientId;
  } else if (state.clientId !== clientId && !state.initialized) {
    state.clientId = clientId;
  } else if (state.clientId !== clientId) {
    console.warn('Google Identity Services was already initialized with another Client ID.');
  }

  return ensureGoogleIdentity();
}

export function activateGoogleLogin(callback, error) {
  const state = getState();
  state.activeCallback = typeof callback === 'function' ? callback : null;
  state.activeError = typeof error === 'function' ? error : null;
}

export function clearGoogleLogin(callback) {
  const state = getState();

  if (state.activeCallback === callback) {
    state.activeCallback = null;
    state.activeError = null;
  }
}

export async function renderGoogleLoginButton(container, buttonConfig = {}) {
  if (!container) return;

  const google = await ensureGoogleIdentity();
  container.innerHTML = '';

  google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    locale: 'es',
    width: String(resolveButtonWidth(container)),
    ...buttonConfig
  });
}
