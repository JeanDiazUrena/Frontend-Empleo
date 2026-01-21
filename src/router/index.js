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

// IMPORTANTE: Importamos el Layout
import ProfessionalLayout from '../layouts/ProfessionalLayout.vue'; 

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

  // --- RUTAS DEL CLIENTE (Aún sin Layout, planas) ---
  {
    path: '/client-dashboard',
    name: 'ClientDashboard',
    component: ClientDashboard
  },
  {
    path: '/client-profile',
    name: 'ClientProfile',
    component: ClientProfile
  },
  {
    path: '/client-chat',
    name: 'ChatClient',
    component: ChatClient
  },
  {
    path: '/client-explore',
    name: 'ClientExplore',
    component: ClientExplore
  },
  {
    path: '/request-service',
    name: 'ServiceRequest',
    component: ServiceRequest
  },

  // --- AQUÍ ESTÁ LA MAGIA: RUTAS DEL PROFESIONAL CON LAYOUT ---
  {
    path: '/professional', 
    component: ProfessionalLayout, // 1. Carga el Marco (Menú + Sidebar)
    children: [
      { 
        // Se accede como: /professional/dashboard
        path: 'dashboard', 
        name: 'ProfessionalDashboard', 
        component: ProfessionalDashboard 
      },
      { 
        // Se accede como: /professional/chat
        path: 'chat', 
        name: 'ProfessionalChat', 
        component: ChatProfessional 
      },
      { 
        // Se accede como: /professional/profile
        path: 'profile', 
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