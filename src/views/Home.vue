<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserSession } from '../composables/useUserSession.js';

const router = useRouter();
const { isLoggedIn, state } = useUserSession(); 
const searchQuery = ref('');

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

const handleAction = () => {
  if (isLoggedIn.value) {
    if (state.user.role === 'profesional') {
      router.push('/professional/dashboard');
    } else {
      router.push('/client/dashboard');
    }
  } else {
    router.push('/register');
  }
};

const searchService = () => {
  if (searchQuery.value.trim()) {
    if (isLoggedIn.value && state.user.role === 'cliente') {
      router.push({ path: '/client/explore', query: { q: searchQuery.value } });
    } else {
      router.push('/register');
    }
  }
};

const categories = [
  { id: 1, title: 'Gráfica y Diseño', img: '/generated/design.png', color: '#F76B1C' },
  { id: 2, title: 'Programación y Tech', img: '/generated/programming.png', color: '#0B4C6F' },
  { id: 3, title: 'Marketing Digital', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800', color: '#F76B1C' },
  { id: 4, title: 'Video y Animación', img: '/generated/video.png', color: '#0B4C6F' },
  { id: 5, title: 'Servicios de Hogar', img: '/generated/home_services.png', color: '#F76B1C' }
];

const stats = [
  { value: '50k+', label: 'Profesionales' },
  { value: '120k+', label: 'Proyectos Listos' },
  { value: '4.9/5', label: 'Calificación Media' },
  { value: '24/7', label: 'Soporte Activo' }
];
</script>

<template>
  <div class="home-v2">
    <!-- HERO SECTION CON VIDEO RESTAURADO -->
    <section class="hero-premium">
      <div class="hero-bg">
        <video autoplay muted loop playsinline class="video-bg">
          <source src="/videos/videohero.mp4" type="video/mp4">
        </video>
        <div class="hero-overlay"></div>
      </div>
      
      <div class="container hero-content-v2 reveal">
        <div class="hero-text-area">
          <span class="badge-premium"> El futuro del trabajo está aquí</span>
          <h1>Encuentra el <span class="text-gradient">talento ideal</span> para cualquier proyecto</h1>
          <p class="hero-subtitle">Conectamos a profesionales de élite con clientes visionarios. Calidad, rapidez y seguridad garantizada en cada servicio.</p>
          
          <div class="search-glass-container">
            <div class="search-input-wrapper">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="¿Qué servicio buscas hoy?"
                @keyup.enter="searchService"
              />
            </div>
            <button @click="searchService" class="btn-primary-v2">Buscar Talento</button>
          </div>

          <div class="hero-labels">
            <span>Populares:</span>
            <span class="label-chip" @click="searchQuery = 'Diseño'; searchService()">Diseño Web</span>
            <span class="label-chip" @click="searchQuery = 'Plomeria'; searchService()">Plomería</span>
            <span class="label-chip" @click="searchQuery = 'Limpieza'; searchService()">Limpieza</span>
          </div>
        </div>
      </div>
    </section>

    <!-- STATS SECTION -->
    <section class="stats-bar">
      <div class="container stats-grid">
        <div v-for="stat in stats" :key="stat.label" class="stat-item reveal">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <!-- CATEGORIES SECTION -->
    <section class="categories-v2 container" id="explorar-seccion">
      <div class="section-header reveal">
        <h2>Explora el <span class="text-blue">Mercado</span></h2>
        <p>Encuentra exactamente lo que necesitas entre nuestras especialidades más demandadas.</p>
      </div>
      
      <div class="cat-grid-v2">
        <div 
          v-for="cat in categories" 
          :key="cat.id" 
          class="cat-card-v2 reveal"
          :style="{ '--accent': cat.color }"
          @click="handleAction"
        >
          <div class="cat-img-wrapper">
            <img :src="cat.img" :alt="cat.title" />
          </div>
          <div class="cat-info-v2">
            <h4>{{ cat.title }}</h4>
            <i class="fa-solid fa-arrow-right"></i>
          </div>
        </div>
      </div>
    </section>

    <!-- WHY CHOOSE US SECTION -->
    <section class="features-premium">
      <div class="container features-grid-v2">
        <div class="features-image-side reveal">
          <div class="image-stack">
            <img src="/generated/features.png" class="img-main" />
            <div class="floating-card reveal delay-1">
              <i class="fa-solid fa-shield-halved"></i>
              <span>Pagos 100% Protegidos</span>
            </div>
          </div>
        </div>
        
        <div class="features-content-side reveal">
          <h2 class="section-title-v2">¿Por qué elegir <span class="text-orange">ServiHub</span>?</h2>
          
          <div class="feature-item-v2 reveal">
            <div class="feature-icon"><i class="fa-solid fa-bolt"></i></div>
            <div class="feature-text">
              <h3>1. Explora</h3>
              <p>Navega entre miles de servicios o usa el buscador para encontrar exactamente lo que necesitas.</p>
            </div>
          </div>

          <div class="feature-item-v2 reveal">
            <div class="feature-icon"><i class="fa-solid fa-message"></i></div>
            <div class="feature-text">
              <h3>2. Conecta</h3>
              <p>Habla directamente con el profesional, revisa su portafolio y acuerda los detalles.</p>
            </div>
          </div>

          <div class="feature-item-v2 reveal">
            <div class="feature-icon"><i class="fa-solid fa-check-double"></i></div>
            <div class="feature-text">
              <h3>3. Resuelve</h3>
              <p>Recibe el trabajo terminado. Tu pago solo se libera cuando estés 100% satisfecho.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA SECTION -->
    <section class="cta-premium reveal">
      <div class="container cta-box-v2">
        <div class="cta-inner">
          <h2>¿Listo para <span class="text-orange">empezar</span> hoy mismo?</h2>
          <p>Únete a la plataforma más segura y eficiente para contratar servicios profesionales.</p>
          <div class="cta-btns">
            <button class="btn-orange" @click="handleAction">Comenzar Ahora</button>
            <button class="btn-outline-white" @click="router.push('/register')">Soy Profesional</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');

.home-v2 {
  font-family: 'Outfit', sans-serif;
  color: #1e293b;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

.delay-1 { transition-delay: 0.2s; }

.text-gradient {
  color: #ff8a3d;
  background: linear-gradient(135deg, #ff8a3d 0%, #ffd166 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.28);
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.24));
}

.text-orange { color: #F76B1C; }
.text-blue { color: #0B4C6F; }

/* HERO SECTION CON VIDEO */
.hero-premium {
  position: relative;
  min-height: 90vh;
  display: flex;
  align-items: center;
  background: #0B4C6F;
  overflow: hidden;
  padding: 80px 0;
}

.video-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(11, 76, 111, 0.7), rgba(11, 76, 111, 0.9));
  z-index: 1;
}

.hero-content-v2 {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero-text-area {
  max-width: 700px;
}

.badge-premium {
  display: inline-block;
  background: rgba(247, 107, 28, 0.2);
  color: #F76B1C;
  padding: 8px 16px;
  border-radius: 99px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 24px;
  border: 1px solid rgba(247, 107, 28, 0.4);
}

.hero-text-area h1 {
  font-size: 4.5rem;
  line-height: 1.1;
  font-weight: 800;
  color: white;
  margin-bottom: 24px;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #e2e8f0;
  margin-bottom: 40px;
  line-height: 1.6;
}

/* SEARCH GLASS */
.search-glass-container {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px;
  border-radius: 16px;
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
}

.search-input-wrapper i {
  color: #cbd5e1;
  font-size: 1.2rem;
}

.search-input-wrapper input {
  background: transparent;
  border: none;
  width: 100%;
  height: 50px;
  color: white;
  font-size: 1.1rem;
  outline: none;
}

.search-input-wrapper input::placeholder {
  color: rgba(255,255,255,0.7);
}

.btn-primary-v2 {
  background: #F76B1C;
  color: white;
  border: none;
  padding: 0 32px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary-v2:hover {
  transform: translateY(-2px);
  background: #e05a10;
  box-shadow: 0 10px 20px rgba(247, 107, 28, 0.4);
}

.hero-labels {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #e2e8f0;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.label-chip {
  background: rgba(255,255,255,0.1);
  padding: 4px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  color: white;
}

.label-chip:hover {
  background: rgba(255,255,255,0.2);
}

/* STATS BAR */
.stats-bar {
  background: white;
  padding: 60px 0;
  border-bottom: 1px solid #f1f5f9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 2.5rem;
  font-weight: 800;
  color: #0B4C6F;
}

.stat-label {
  color: #64748b;
  font-weight: 500;
}

/* CATEGORIES */
.categories-v2 {
  padding: 100px 0;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  color: #1e293b;
}

.section-header p {
  color: #64748b;
  font-size: 1.1rem;
}

.cat-grid-v2 {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}

.cat-card-v2 {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.cat-card-v2:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
  border-color: var(--accent);
}

.cat-img-wrapper {
  height: 250px;
  overflow: hidden;
}

.cat-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s;
}

.cat-card-v2:hover .cat-img-wrapper img {
  transform: scale(1.1);
}

.cat-info-v2 {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cat-info-v2 h4 {
  font-weight: 700;
  font-size: 1.1rem;
  margin: 0;
}

.cat-info-v2 i {
  color: var(--accent);
  transition: transform 0.3s;
}

/* FEATURES */
.features-premium {
  padding: 120px 0;
  background: #f0f9ff;
}

.features-grid-v2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

.image-stack {
  position: relative;
  padding-bottom: 40px;
}

.img-main {
  width: 100%;
  border-radius: 30px;
  box-shadow: 0 30px 60px rgba(0,0,0,0.1);
}

.floating-card {
  position: absolute;
  bottom: 0;
  right: -20px;
  background: white;
  padding: 20px 30px;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  font-weight: 700;
}

.floating-card i {
  color: #F76B1C;
  font-size: 1.5rem;
}

.section-title-v2 {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 40px;
  color: #0B4C6F;
}

.feature-item-v2 {
  display: flex;
  gap: 20px;
  margin-bottom: 32px;
}

.feature-icon {
  width: 56px;
  height: 56px;
  background: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #F76B1C;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
  flex-shrink: 0;
}

.feature-text h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1e293b;
}

.feature-text p {
  color: #64748b;
  line-height: 1.6;
}

/* CTA */
.cta-premium {
  padding: 100px 0;
}

.cta-box-v2 {
  background: #0B4C6F;
  border-radius: 40px;
  padding: 80px 40px;
  text-align: center;
  color: white;
}

.cta-inner {
  max-width: 800px;
  margin: 0 auto;
}

.cta-inner h2 {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 24px;
}

.cta-inner p {
  font-size: 1.25rem;
  opacity: 0.9;
  margin-bottom: 40px;
}

.cta-btns {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.btn-orange {
  background: #F76B1C;
  color: white;
  border: none;
  padding: 16px 40px;
  border-radius: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.3s;
}

.btn-orange:hover {
  transform: translateY(-3px);
  background: #e05a10;
  box-shadow: 0 15px 30px rgba(247, 107, 28, 0.3);
}

.btn-outline-white {
  background: transparent;
  color: white;
  border: 2px solid rgba(255,255,255,0.4);
  padding: 16px 40px;
  border-radius: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.3s;
}

.btn-outline-white:hover {
  background: rgba(255,255,255,0.1);
  border-color: white;
}

@media (max-width: 1024px) {
  .hero-text-area h1 { font-size: 3.5rem; }
  .features-grid-v2 { grid-template-columns: 1fr; gap: 60px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 40px; }
}

@media (max-width: 768px) {
  .hero-premium { min-height: 100vh; padding: 100px 0 60px; }
  .hero-text-area h1 { font-size: 2.8rem; }
  .hero-subtitle { font-size: 1.1rem; }
  .cta-inner h2 { font-size: 2.2rem; }
  .cta-box-v2 { padding: 40px 20px; border-radius: 20px; }
  .search-glass-container { 
    flex-direction: column; 
    padding: 12px;
    background: rgba(255, 255, 255, 0.2);
  }
  .search-input-wrapper { padding: 0 10px; }
  .btn-primary-v2 { width: 100%; height: 50px; }
  .cta-btns { flex-direction: column; width: 100%; }
  .cta-btns button { width: 100%; }
  .categories-v2 { padding: 60px 0; }
  .features-premium { padding: 60px 0; }
  .stats-bar { padding: 40px 0; }
}

@media (max-width: 480px) {
  .hero-text-area h1 { font-size: 2.2rem; }
  .stats-grid { grid-template-columns: 1fr; gap: 30px; }
  .section-header h2 { font-size: 1.8rem; }
  .cat-img-wrapper { height: 200px; }
  .hero-labels { display: none; }
}
</style>
