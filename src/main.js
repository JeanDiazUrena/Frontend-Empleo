import { createApp } from 'vue'
import './style.css' // Tu CSS global
import App from './App.vue'
import vue3GoogleLogin from 'vue3-google-login'

// 1. Importa el router que creaste
import router from './router' // (Apunta a router/index.js)

const app = createApp(App)

// 2. Dile a la app que use el router
app.use(router)

// 3. Usa vue3-google-login
app.use(vue3GoogleLogin, {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'TU_CLIENT_ID_SUPER_SECRETO_AQUI.apps.googleusercontent.com'
})

// 4. Monta la app
app.mount('#app')