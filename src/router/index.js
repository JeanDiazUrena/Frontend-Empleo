import { createRouter, createWebHistory } from 'vue-router';

// LAYOUTS
import PublicLayout from '../layouts/PublicLayout.vue';
import ClientLayout from '../layouts/ClientLayout.vue';
import ProfessionalLayout from '../layouts/ProfessionalLayout.vue';

// VISTAS
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ProfessionalSetup from '../views/ProfessionalSetup.vue';
import CreateFirstPost from '../views/CreateFirstPost.vue';

// VISTAS CLIENTE
import ClientDashboard from '../views/ClientDashboard.vue';
import ClientProfile from '../views/ClientProfile.vue';
import ChatClient from '../views/ChatClient.vue';
import ClientExplore from '../views/ClientExplore.vue';
import ServiceRequest from '../views/ServiceRequest.vue';

// VISTAS PROFESIONAL
import ProfessionalDashboard from '../views/ProfessionalDashboard.vue';
import ChatProfessional from '../views/ChatProfessional.vue';
import ProfessionalProfile from '../views/ProfessionalProfile.vue';

const routes = [
  // 1. RUTA PUBLICA NORMAL
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'Home', component: Home },
    ]
  },

  // 2. RUTAS DE AUTENTICACION
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },

  // 3. RUTAS CLIENTE
  {
    path: '/client',
    component: ClientLayout,
    children: [
      { path: 'dashboard', name: 'ClientDashboard', component: ClientDashboard },
      { path: 'profile', name: 'ClientProfile', component: ClientProfile },
      { path: 'chat', name: 'ClientChat', component: ChatClient },
      { path: 'explore', name: 'ClientExplore', component: ClientExplore },
      { path: 'request', name: 'ServiceRequest', component: ServiceRequest },
      { path: 'request/edit/:id', name: 'EditRequest', component: ServiceRequest },
    ]
  },

  // 4. RUTAS PROFESIONAL
  {
    path: '/professional',
    component: ProfessionalLayout,
    children: [
      { path: 'dashboard', name: 'ProfessionalDashboard', component: ProfessionalDashboard },
      { path: 'chat', name: 'ProfessionalChat', component: ChatProfessional },
      { path: 'profile', name: 'ProfessionalProfile', component: ProfessionalProfile },
    ]
  },

  // 5. CONFIGURACION Y PUBLICACIONES
  { path: '/professional-setup', name: 'ProfessionalSetup', component: ProfessionalSetup },
  { path: '/create-first-post', name: 'CreateFirstPost', component: CreateFirstPost },
  
  // --- ESTA ES LA RUTA QUE FALTABA PARA QUE FUNCIONE EL BOTON DE EDITAR ---
  { 
    path: '/edit-post/:id', 
    name: 'EditPost', 
    component: CreateFirstPost, 
    props: true 
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return { top: 0 };
  }
});

export default router;