<script setup>
import { RouterView } from 'vue-router';
import AppFeedback from './components/AppFeedback.vue';
</script>

<template>
  <a class="skip-link" href="#main-content">Saltar al contenido principal</a>
  <RouterView />
  <AppFeedback />
</template>
