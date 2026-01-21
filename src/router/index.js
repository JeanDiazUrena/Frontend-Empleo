import { createRouter, createWebHistory } from 'vue-router';

// Vistas Generales
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ProfessionalSetup from '../views/ProfessionalSetup.vue';
import CreateFirstPost from '../views/CreateFirstPost.vue';

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

// IMPORTANTE: Importamos AMBOS Layouts
import ProfessionalLayout from '../layouts/ProfessionalLayout.vue'; 
import ClientLayout from '../layouts/ClientLayout.vue'; 

const routes = [
  // --- RUTAS PÚBLICAS ---
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
  {
    path: '/register',
    name: 'Register',
    component: Register
  },

  // --- RUTAS DE CONFIGURACIÓN INICIAL ---
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

  // --- RUTAS DEL CLIENTE (CON LAYOUT UNIFICADO) ---
  {
    path: '/client',
    component: ClientLayout, // Carga el Marco (Menú + Sidebar Cliente)
    children: [
      {
        path: 'dashboard', // URL: /client/dashboard
        name: 'ClientDashboard',
        component: ClientDashboard
      },
      {
        path: 'explore', // URL: /client/explore
        name: 'ClientExplore',
        component: ClientExplore
      },
      {
        path: 'chat', // URL: /client/chat
        name: 'ClientChat',
        component: ChatClient
      },
      {
        path: 'profile', // URL: /client/profile
        name: 'ClientProfile',
        component: ClientProfile
      },
      {
        path: 'request', // URL: /client/request
        name: 'ServiceRequest',
        component: ServiceRequest
      }
    ]
  },

  // --- RUTAS DEL PROFESIONAL (CON LAYOUT UNIFICADO) ---
  {
    path: '/professional', 
    component: ProfessionalLayout, // Carga el Marco (Menú + Sidebar Profesional)
    children: [
      { 
        path: 'dashboard', // URL: /professional/dashboard
        name: 'ProfessionalDashboard', 
        component: ProfessionalDashboard 
      },
      { 
        path: 'chat', // URL: /professional/chat
        name: 'ProfessionalChat', 
        component: ChatProfessional 
      },
      { 
        path: 'profile', // URL: /professional/profile
        name: 'ProfessionalProfile', 
        component: ProfessionalProfile 
      },
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;