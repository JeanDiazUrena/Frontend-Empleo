import { createRouter, createWebHistory } from 'vue-router';

// Vistas Generales
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ProfessionalSetup from '../views/ProfessionalSetup.vue';
import CreateFirstPost from '../views/CreateFirstPost.vue';

// Layouts
import ProfessionalLayout from '../layouts/ProfessionalLayout.vue';
import ClientLayout from '../layouts/ClientLayout.vue';

// Vistas Cliente
import ClientDashboard from '../views/ClientDashboard.vue';
import ClientProfile from '../views/ClientProfile.vue';
import ChatClient from '../views/ChatClient.vue';
import ClientExplore from '../views/ClientExplore.vue';
import ServiceRequest from '../views/ServiceRequest.vue';

// Vistas Profesional
import ProfessionalDashboard from '../views/ProfessionalDashboard.vue';
import ChatProfessional from '../views/ChatProfessional.vue';
import ProfessionalProfile from '../views/ProfessionalProfile.vue';

const routes = [
  // --- RUTAS PÚBLICAS ---
  { path: '/', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/professional-setup', name: 'ProfessionalSetup', component: ProfessionalSetup },
  { path: '/create-first-post', name: 'CreateFirstPost', component: CreateFirstPost },

  // --- RUTAS CLIENTE (Usando ClientLayout) ---
  {
    path: '/client',
    component: ClientLayout,
    meta: { hideNavbar: true }, // Oculta el navbar público de App.vue
    children: [
      { path: 'dashboard', name: 'ClientDashboard', component: ClientDashboard },
      { path: 'profile', name: 'ClientProfile', component: ClientProfile },
      { path: 'chat', name: 'ClientChat', component: ChatClient },
      { path: 'explore', name: 'ClientExplore', component: ClientExplore },
      
      // 1. Crear Solicitud (Nueva)
      { path: 'request', name: 'ServiceRequest', component: ServiceRequest },
      
      // 2. Editar/Ver Solicitud (Existente) - NUEVA RUTA AGREGADA
      { path: 'request/edit/:id', name: 'EditRequest', component: ServiceRequest },
    ]
  },

  // --- RUTAS PROFESIONAL (Usando ProfessionalLayout) ---
  {
    path: '/professional',
    component: ProfessionalLayout,
    meta: { hideNavbar: true }, // Oculta el navbar público de App.vue
    children: [
      { path: 'dashboard', name: 'ProfessionalDashboard', component: ProfessionalDashboard },
      { path: 'chat', name: 'ProfessionalChat', component: ChatProfessional },
      { path: 'profile', name: 'ProfessionalProfile', component: ProfessionalProfile },
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;