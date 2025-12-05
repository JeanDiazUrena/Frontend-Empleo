import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import ProfessionalSetup from '../views/ProfessionalSetup.vue';
import CreateFirstPost from '../views/CreateFirstPost.vue';
import ClientDashboard from '../views/ClientDashboard.vue';
import ProfessionalDashboard from '../views/ProfessionalDashboard.vue';
import ChatProfessional from '../views/ChatProfessional.vue';
import ClientProfile from '../views/ClientProfile.vue';
import ProfessionalProfile from '../views/ProfessionalProfile.vue';
import ChatClient from '../views/ChatClient.vue';

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
  {
    path: '/client-dashboard',
    name: 'ClientDashboard',
    component: ClientDashboard
  },
  {
    path: '/professional-dashboard',
    name: 'ProfessionalDashboard',
    component: ProfessionalDashboard
  },
  {
    path: '/chat',
    name: 'ChatProfessional',
    component: ChatProfessional
  },
  

  {
    path: '/profile',
    name: 'ProfessionalProfile',
    component: ProfessionalProfile
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;