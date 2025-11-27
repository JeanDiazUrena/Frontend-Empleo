import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ProfessionalSetup from '../views/ProfessionalSetup.vue';
import CreateFirstPost from '../views/CreateFirstPost.vue';
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  // AÑADE ESTO:
  {
    path: '/register',
    name: 'Register',
    component: Register
  },

  {
    path: '/professional-setup',
    name: 'ProfessionalSetup',
    component: ProfessionalSetup
  },

  {
  path: '/create-first-post',
  name: 'CreateFirstPost',
  component: CreateFirstPost
},

];

// 2. Crea la instancia del router
const router = createRouter({
  history: createWebHistory(), // Usa el historial web (URLs limpias)
  routes, // (routes: routes)
});

// 3. Exporta el router
export default router;