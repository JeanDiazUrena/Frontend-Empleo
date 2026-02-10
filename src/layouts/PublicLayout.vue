<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';

const router = useRouter();

// --- ESTADO DE SESIÓN ---
const isLoggedIn = ref(false);
const user = ref({ name: '', initials: '', role: '' });

// --- AL CARGAR EL LAYOUT ---
onMounted(() => {
  const token = localStorage.getItem('token');
  const storedName = localStorage.getItem('user_name') || localStorage.getItem('usuario_nombre'); // Soporte para ambas llaves por si acaso
  const storedRole = localStorage.getItem('user_role');

  if (token && storedName) {
    isLoggedIn.value = true;
    user.value.name = storedName;
    user.value.role = storedRole;

    // Generar iniciales (Ej: Jean Luis -> JL)
    const parts = storedName.split(' ');
    user.value.initials = parts.length > 1 
      ? (parts[0][0] + parts[1][0]).toUpperCase() 
      : parts[0].substring(0, 2).toUpperCase();
  }
});

// --- IR AL DASHBOARD CORRECTO ---
const goToDashboard = () => {
  if (user.value.role === 'profesional') {
    router.push('/professional/dashboard');
  } else {
    router.push('/client/dashboard');
  }
};
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

          <template v-if="!isLoggedIn">
            <RouterLink to="/login" class="link">Iniciar Sesión</RouterLink>
            <RouterLink to="/register" class="btn-join">Unirse</RouterLink>
          </template>

          <template v-else>
            <button @click="goToDashboard" class="btn-dashboard">
              Ir a mi Dashboard
            </button>
            
            <div class="user-display">
              <span class="user-name">{{ user.name }}</span>
              <div class="avatar-circle">
                {{ user.initials }}
              </div>
            </div>
          </template>

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

/* NAVBAR */
.navbar { border-bottom: 1px solid #e5e7eb; background: white; padding: 15px 0; position: sticky; top: 0; z-index: 50; }
.nav-content { display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto; padding: 0 20px; }

.brand { display: flex; align-items: center; gap: 8px; font-weight: 800; font-size: 1.5rem; color: #111; text-decoration: none; }
.logo-icon { height: 32px; }
.dot { color: #F76B1C; }

/* LINKS */
.nav-links { display: flex; gap: 25px; align-items: center; }
.link { font-weight: 600; color: #666; transition: 0.2s; text-decoration: none; cursor: pointer; }
.link:hover { color: #0B4C6F; }

/* BOTÓN UNIRSE (Gris/Naranja) */
.btn-join { background: transparent; border: 1px solid #F76B1C; color: #F76B1C; padding: 8px 20px; border-radius: 6px; font-weight: 700; transition: 0.2s; text-decoration: none; }
.btn-join:hover { background: #F76B1C; color: white; }

/* BOTÓN DASHBOARD (SOLO LOGUEADO) */
.btn-dashboard { 
  background: #0B4C6F; color: white; border: none; 
  padding: 10px 20px; border-radius: 6px; 
  font-weight: 700; cursor: pointer; transition: 0.2s; 
  font-size: 0.9rem;
}
.btn-dashboard:hover { background: #093a55; transform: translateY(-1px); }

/* USUARIO (SOLO LOGUEADO) */
.user-display { display: flex; align-items: center; gap: 10px; border-left: 1px solid #eee; padding-left: 20px; }
.user-name { font-weight: 600; color: #333; font-size: 0.95rem; }
.avatar-circle { 
  width: 38px; height: 38px; 
  background: #F76B1C; color: white; 
  border-radius: 50%; 
  display: flex; align-items: center; justify-content: center; 
  font-weight: 800; font-size: 0.9rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.page-content { flex: 1; }

.footer { border-top: 1px solid #e5e7eb; padding: 30px 0; text-align: center; color: #888; font-size: 0.9rem; margin-top: auto; }

@media (max-width: 768px) {
  .nav-links { display: none; } /* En móvil se suele usar un menú hamburguesa */
}
</style>