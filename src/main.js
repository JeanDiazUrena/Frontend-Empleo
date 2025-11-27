import { createApp } from 'vue'
import './style.css' // Tu CSS global
import App from './App.vue'

// 1. Importa el router que creaste
import router from './router' // (Apunta a router/index.js)

const app = createApp(App)

// 2. Dile a la app que use el router
app.use(router)

// 3. Monta la app
app.mount('#app')