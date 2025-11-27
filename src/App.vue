<script setup>
import { ref } from 'vue';
// Importa el RouterLink para que funcionen los enlaces
import { RouterLink, RouterView } from 'vue-router';
import './App.css'; // Estilos del cascarón (header/footer)

const isMobileMenuOpen = ref(false);

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}
</script>

<template>
  <!-- ===== HEADER / NAVEGACIÓN ===== -->
  <header class="header">
    <nav class="header__nav container">

      <!-- Logo ahora usa RouterLink para ir al inicio -->
      <RouterLink to="/" class="header__logo">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="header__logo-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.87-5.87m0 0L5.87 5.87m5.55 5.55v.007m0 .007L5.87 5.87M11.42 15.17l2.497-2.497M11.42 15.17 7.755 11.5a2.652 2.652 0 0 1 0-3.75m.007 3.75 3.663-3.663m-3.663 3.663 3.663-3.663" />
        </svg>
        <span>ServiHub</span>
      </RouterLink>

      <!-- Links (Desktop) usa RouterLink -->
      <div class="header__links--desktop">
        <RouterLink to="/">Buscar Servicios</RouterLink>
        <RouterLink to="/">Explorar Muro</RouterLink>
        <RouterLink to="/">Comunidad</RouterLink>
        <RouterLink to="/login" aria-label="Perfil">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-profile">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A1.76 1.76 0 0 1 18.002 22h-12a1.76 1.76 0 0 1-1.499-1.882Z" />
          </svg>
        </RouterLink>
        <!-- Botón de Iniciar Sesión ahora usa RouterLink -->
        <RouterLink to="/login" class="button button--primary">
          Iniciar Sesión
        </RouterLink>
      </div>

      <!-- Botón de Menú (Móvil) -->
      <button @click="toggleMobileMenu" class="header__menu-toggle" aria-label="Abrir menú">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="icon-menu">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
    </nav>

    <!-- Menú Desplegable (Móvil) -->
    <div v-show="isMobileMenuOpen" class="header__menu--mobile">
      <RouterLink to="/" @click="toggleMobileMenu">Buscar Servicios</RouterLink>
      <RouterLink to="/" @click="toggleMobileMenu">Explorar Muro</RouterLink>
      <RouterLink to="/" @click="toggleMobileMenu">Comunidad</RouterLink>
      <RouterLink to="/login" class="button button--primary" @click="toggleMobileMenu">
        Iniciar Sesión
      </RouterLink>
    </div>
  </header>

  <!-- AQUÍ ES DONDE VUE MOSTRARÁ LA PÁGINA ACTIVA (Home o Login) -->
  <RouterView />

  <!-- ===== FOOTER (Sigue igual) ===== -->
  <footer class="footer">
    <div class="footer__content container">
      <!-- ... (El contenido del footer es el mismo) ... -->
      <div class="footer__column">
        <a href="#" class="footer__logo">ServiHub</a>
        <p class="footer__tagline">Conectando profesionales, creando oportunidades.</p>
      </div>
      <div class="footer__column">
        <h4 class="footer__column-title">Navegación</h4>
        <ul class="footer__links">
          <li><a href="#">Buscar Servicios</a></li>
          <li><a href="#">Explorar Muro</a></li>
          <li><a href="#">Cómo Funciona</a></li>
        </ul>
      </div>
      <div class="footer__column">
        <h4 class="footer__column-title">Legal</h4>
        <ul class="footer__links">
          <li><a href="#">Términos de Servicio</a></li>
          <li><a href="#">Política de Privacidad</a></li>
        </ul>
      </div>
    </div>
    <div class="footer__copyright">
      &copy; 2024 ServiHub. Todos los derechos reservados.
    </div>
  </footer>

</template>