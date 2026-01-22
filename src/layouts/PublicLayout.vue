<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <div class="public-layout">
    
    <header class="navbar">
      <div class="container nav-content">
        <RouterLink to="/" class="brand">
          <img src="/fotos/logo-servihub.png" alt="Logo" class="logo-icon">
          <span class="logo-text">ServiHub<span class="dot">.</span></span>
        </RouterLink>
        
        <nav class="nav-links">
          <RouterLink to="/client/explore" class="link">Explorar</RouterLink>
          <RouterLink to="/login" class="link">Iniciar Sesión</RouterLink>
          <RouterLink to="/register" class="btn-join">Unirse</RouterLink>
        </nav>
      </div>
    </header>

    <main class="page-content">
      <RouterView />
    </main>

    <footer class="footer">
      <div class="container">
        <p>© ServiHub 2026. Todos los derechos reservados.</p>
      </div>
    </footer>

  </div>
</template>

<style scoped>
.public-layout { display: flex; flex-direction: column; min-height: 100vh; }

.navbar { border-bottom: 1px solid #e5e7eb; background: white; padding: 15px 0; position: sticky; top: 0; z-index: 50; }
.nav-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }

.brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.5rem; color: #111; }
.logo-icon { height: 32px; }
.dot { color: #F76B1C; }

.nav-links { display: flex; gap: 20px; align-items: center; }
.link { font-weight: 600; color: #666; transition: 0.2s; }
.link:hover { color: #0B4C6F; }

.btn-join { background: transparent; border: 1px solid #F76B1C; color: #F76B1C; padding: 8px 20px; border-radius: 6px; font-weight: 700; transition: 0.2s; }
.btn-join:hover { background: #F76B1C; color: white; }

.page-content { flex: 1; }

.footer { border-top: 1px solid #e5e7eb; padding: 30px 0; text-align: center; color: #888; font-size: 0.9rem; margin-top: auto; }

@media (max-width: 768px) {
  .nav-links { display: none; } /* Menú móvil pendiente */
}
</style>