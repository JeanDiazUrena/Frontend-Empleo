<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';

const router = useRouter();
const isMobileMenuOpen = ref(false);
const globalSearch = ref('');

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function handleGlobalSearch() {
  if(globalSearch.value.trim()){
    router.push({ name: 'ClientExplore', query: { q: globalSearch.value } });
  }
}
</script>

<template>
  <header class="servihub-navbar">
    <div class="container nav-container">
      
      <div class="nav-left">
        <RouterLink to="/" class="brand-logo">
          <img src="/fotos/logo-servihub.png" alt="Logo Icon" class="logo-icon">
          
          <span class="logo-text">ServiHub<span class="dot">.</span></span>
        </RouterLink>
        
        <div class="nav-search-wrapper">
          <input 
            type="text" 
            placeholder="¿Qué servicio buscas hoy?" 
            v-model="globalSearch"
            @keyup.enter="handleGlobalSearch"
          >
          <button class="nav-search-btn" @click="handleGlobalSearch">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="icon-search">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        </div>
      </div>

      <div class="nav-right desktop-only">
        <RouterLink to="/client-explore" class="nav-link">Explorar</RouterLink>
        <RouterLink to="/login" class="nav-link">Iniciar Sesión</RouterLink>
        <RouterLink to="/register" class="btn-join">Unirse</RouterLink>
      </div>

      <button class="mobile-toggle" @click="toggleMobileMenu">☰</button>
    </div>

    <div v-if="isMobileMenuOpen" class="mobile-menu">
      <RouterLink to="/client-explore" @click="toggleMobileMenu">Explorar</RouterLink>
      <RouterLink to="/login" @click="toggleMobileMenu">Iniciar Sesión</RouterLink>
      <RouterLink to="/register" @click="toggleMobileMenu" class="mobile-join">Unirse</RouterLink>
    </div>
  </header>

  <RouterView />

  <footer class="fiverr-footer">
    <div class="container">
      <div class="footer-top">
        <div class="footer-col">
          <h4>Categorías</h4>
          <ul>
            <li><a href="#">Gráfica y Diseño</a></li>
            <li><a href="#">Marketing Digital</a></li>
            <li><a href="#">Redacción y Traducción</a></li>
            <li><a href="#">Video y Animación</a></li>
            <li><a href="#">Música y Audio</a></li>
            <li><a href="#">Programación</a></li>
            <li><a href="#">Datos</a></li>
            <li><a href="#">Negocios</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Sobre nosotros</h4>
          <ul>
            <li><a href="#">Carreras</a></li>
            <li><a href="#">Prensa y Noticias</a></li>
            <li><a href="#">Política de Privacidad</a></li>
            <li><a href="#">Términos de Servicio</a></li>
            <li><a href="#">Propiedad Intelectual</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Soporte</h4>
          <ul>
            <li><a href="#">Ayuda y Soporte</a></li>
            <li><a href="#">Confianza y Seguridad</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Comunidad</h4>
          <ul>
            <li><a href="#">Eventos</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Foro</a></li>
            <li><a href="#">Invita a un amigo</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-left">
          <RouterLink to="/" class="brand-logo footer-brand">
             <img src="/fotos/logo-servihub.png" alt="Logo Icon" class="logo-icon-footer">
             <span class="logo-text-footer">ServiHub</span>
          </RouterLink>
          <span class="copyright">© ServiHub International Ltd. 2026</span>
        </div>
        <div class="footer-socials">
          <a href="#" class="social-link">Instagram</a>
          <a href="#" class="social-link">LinkedIn</a>
          <a href="#" class="social-link">Facebook</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style>
/* === ESTILOS GLOBALES === */
:root {
  --brand-orange: #F76B1C;
  --brand-blue: #0B4C6F;
  --text-dark: #404145;
  --text-medium: #62646a;
  --text-light: #74767e;
  --bg-gray: #f7f7f7;
}

body {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  color: var(--text-dark);
  background-color: white;
  -webkit-font-smoothing: antialiased;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px;
}

/* === NAVBAR === */
.servihub-navbar {
  background: white;
  border-bottom: 1px solid #e4e5e7;
  padding: 12px 0; /* Padding compacto */
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 24px;
  flex: 1;
}

/* --- ESTILOS DEL LOGO (Texto + Imagen) --- */
.brand-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  gap: 8px; /* Espacio entre el icono y el texto */
  margin-right: 15px;
}

.logo-icon {
  height: 35px; /* Tamaño del icono */
  width: auto;
  display: block;
}

.logo-text {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 800; /* Letra bien gruesa como logo */
  font-size: 24px;
  color: var(--text-dark);
  letter-spacing: -0.5px; /* Las letras un poco pegadas se ven más pro */
  line-height: 1;
}

.dot {
  color: var(--brand-orange); /* El punto naranja al final */
}

/* Buscador */
.nav-search-wrapper {
  display: flex;
  width: 100%;
  max-width: 450px;
}

.nav-search-wrapper input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid #c5c6c9;
  border-right: none;
  border-radius: 4px 0 0 4px;
  font-size: 15px;
  outline: none;
}

.nav-search-btn {
  background: #222325;
  border: 1px solid #222325;
  color: white;
  padding: 0 14px;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}
.icon-search { width: 18px; height: 18px; }

/* Enlaces */
.nav-right {
  display: flex;
  align-items: center;
  gap: 24px;
  font-weight: 600;
  font-size: 16px;
  color: #62646a;
}

.nav-link {
  text-decoration: none;
  color: #62646a;
  transition: 0.2s;
}
.nav-link:hover { color: var(--brand-orange); }

.btn-join {
  border: 1px solid var(--brand-orange);
  color: var(--brand-orange);
  padding: 6px 20px;
  border-radius: 4px;
  text-decoration: none;
  transition: 0.2s;
  font-weight: 700;
}
.btn-join:hover {
  background: var(--brand-orange);
  color: white;
}

/* === FOOTER === */
.fiverr-footer {
  border-top: 1px solid #e4e5e7;
  padding-top: 64px;
  padding-bottom: 24px;
  background: white;
  margin-top: 0;
}

.footer-top {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 32px;
  padding-bottom: 48px;
  border-bottom: 1px solid #e4e5e7;
}

.footer-col h4 {
  font-size: 16px;
  font-weight: 700;
  color: #404145;
  margin-bottom: 20px;
}

.footer-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-col li {
  margin-bottom: 14px;
}

.footer-col a {
  text-decoration: none;
  color: #74767e;
  font-size: 14px;
  transition: 0.2s;
}
.footer-col a:hover {
  text-decoration: underline;
  color: var(--text-dark);
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 32px;
  flex-wrap: wrap;
  gap: 20px;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

/* Logo en Footer */
.footer-brand {
  margin-right: 0;
  opacity: 0.8; /* Un poco más suave en el footer */
}
.logo-icon-footer {
  height: 28px;
  width: auto;
}
.logo-text-footer {
  font-size: 20px;
  font-weight: 800;
  color: #74767e;
  letter-spacing: -0.5px;
}

.copyright {
  color: #b5b6ba;
  font-size: 13px;
}

.footer-socials {
  display: flex;
  gap: 24px;
}

.social-link {
  color: #74767e;
  font-size: 14px;
  text-decoration: none;
  font-weight: 700;
}
.social-link:hover { color: var(--text-dark); }

/* === RESPONSIVE === */
.mobile-toggle { display: none; background: none; border: none; font-size: 24px; cursor: pointer; }
.desktop-only { display: flex; }
.mobile-menu { display: none; }

@media (max-width: 900px) {
  .nav-search-wrapper { display: none; }
  .desktop-only { display: none; }
  .mobile-toggle { display: block; }
  
  .mobile-menu {
    display: flex;
    flex-direction: column;
    padding: 20px;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border-bottom: 1px solid #ddd;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  }
  
  .mobile-menu a {
    padding: 14px 0;
    text-decoration: none;
    color: #333;
    font-weight: 700;
    border-bottom: 1px solid #eee;
  }
  
  .mobile-join { color: var(--brand-orange) !important; }
}
</style>