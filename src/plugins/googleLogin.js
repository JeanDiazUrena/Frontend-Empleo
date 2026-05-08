import GoogleLogin from '../components/GoogleLogin.vue';
import { configureGoogleIdentity } from '../services/googleIdentity.js';

export default {
  install(app, options = {}) {
    configureGoogleIdentity({ clientId: options.clientId }).catch((error) => {
      console.error('Google Identity Services failed to initialize:', error);
    });

    app.component('GoogleLogin', GoogleLogin);
  }
};
