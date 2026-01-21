<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // Importamos el router

const router = useRouter(); // Inicializamos el router
const searchQuery = ref('');

// --- LÓGICA DE ANIMACIÓN (DINÁMICO) ---
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
});

// La barra de búsqueda principal sigue funcionando normal
const searchService = () => {
  if (searchQuery.value.trim()) {
    router.push({ name: 'ClientExplore', query: { q: searchQuery.value } });
  }
};
</script>

<template>
  <div class="home-wrapper">
    
    <section class="hero">
      <video autoplay muted loop playsinline class="video-bg">
        <source src="/videos/videohero.mp4" type="video/mp4">
      </video>
      <div class="video-overlay"></div>

      <div class="container hero-container animate-on-scroll">
        <div class="hero-content">
          <h1>Encuentra los <span class="highlight">servicios</span><br>adecuados para tu negocio.</h1>
          
          <div class="search-bar-hero big-search">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder='Prueba "diseño web", "plomería", "limpieza"'
              @keyup.enter="searchService"
            >
            <button @click="searchService">Buscar</button>
          </div>

          <div class="hero-tags big-tags">
            <button class="pill" @click="router.push('/register')">Diseño Web</button>
            <button class="pill" @click="router.push('/register')">Electricidad</button>
            <button class="pill" @click="router.push('/register')">Construccion</button>
            <button class="pill" @click="router.push('/register')">Limpieza</button>
          </div>
        </div>
      </div>
    </section>

    <section class="how-it-works container">
      <h2 class="section-title animate-on-scroll">¿Cómo funciona ServiHub?</h2>
      <div class="steps-grid">
        <div class="step-card animate-on-scroll delay-1">
          <div class="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="step-svg"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          </div>
          <h3>1. Explora</h3>
          <p>Navega entre miles de servicios o usa el buscador para encontrar exactamente lo que necesitas.</p>
        </div>
        <div class="step-card animate-on-scroll delay-2">
          <div class="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="step-svg"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
          </div>
          <h3>2. Conecta</h3>
          <p>Habla directamente con el profesional, revisa su portafolio y acuerda los detalles.</p>
        </div>
        <div class="step-card animate-on-scroll delay-3">
          <div class="icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="step-svg"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" /></svg>
          </div>
          <h3>3. Resuelve</h3>
          <p>Recibe el trabajo terminado. Tu pago solo se libera cuando estés 100% satisfecho.</p>
        </div>
      </div>
    </section>

    <section class="quality-section animate-on-scroll">
      <div class="container quality-grid">
        <div class="quality-text">
          <h2>La mejor parte? Todo.</h2>
          <div class="quality-item">
            <div class="check-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>
            </div>
            <div>
              <h3>Presupuesto claro</h3>
              <p>Encuentra servicios de alta calidad a cualquier precio. Sin tarifas por hora sorpresa.</p>
            </div>
          </div>
          <div class="quality-item">
            <div class="check-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>
            </div>
            <div>
              <h3>Calidad garantizada</h3>
              <p>Encuentra al freelancer adecuado para comenzar tu proyecto en minutos.</p>
            </div>
          </div>
          <div class="quality-item">
            <div class="check-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" /></svg>
            </div>
            <div>
              <h3>Pagos protegidos</h3>
              <p>Siempre sabrás lo que pagarás por adelantado. Tu pago no se libera hasta que apruebes el trabajo.</p>
            </div>
          </div>
        </div>
        
        <div class="quality-image">
          <img 
            src="/fotos/marketinga.jpg" 
            alt="Trabajo de calidad" 
            style="width: 100%; border-radius: 8px; object-fit: cover;"
          >
        </div>
      </div>
    </section>

    <section class="categories container animate-on-scroll">
      <h2 class="section-title">Explora el mercado</h2>
      <div class="cat-grid">
        
        <div class="cat-item">
          <img 
            src="/fotos/cat-graphicsde.jpg" 
            alt="Gráfica y Diseño" 
            class="cat-img-real"
          >
          <div class="cat-content">
            <h4>Gráfica y Diseño</h4>
          </div>
        </div>

        <div class="cat-item">
          <img 
            src="/fotos/cat-programming.jpg" 
            alt="Programación" 
            class="cat-img-real"
          >
          <div class="cat-content">
            <h4>Programación</h4>
          </div>
        </div>

        <div class="cat-item">
          <img 
            src="/fotos/cat-marketing.jpg" 
            alt="Marketing Digital" 
            class="cat-img-real"
          >
          <div class="cat-content">
            <h4>Marketing Digital</h4>
          </div>
        </div>

        <div class="cat-item">
          <img 
            src="/fotos/cat-video.jpg" 
            alt="Video y Animación" 
            class="cat-img-real"
          >
          <div class="cat-content">
            <h4>Video y Animación</h4>
          </div>
        </div>

        <div class="cat-item">
          <img 
            src="/fotos/cat-negocios.jpg" 
            alt="Negocios" 
            class="cat-img-real"
          >
          <div class="cat-content">
            <h4>Negocios</h4>
          </div>
        </div>

      </div>
    </section>

    <section class="mission-section">
      <div class="container mission-grid">
        <div class="mission-card animate-on-scroll">
          <div class="card-header">
            <svg class="card-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8l-6-3-6 3zM3 10V3l6 3 6-3v7" /></svg>
            <h3>Misión</h3>
          </div>
          <p>Conectar talento local con oportunidades globales, empoderando a profesionales y negocios.</p>
        </div>
        <div class="mission-card animate-on-scroll delay-1">
          <div class="card-header">
            <svg class="card-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <h3>Visión</h3>
          </div>
          <p>Ser la plataforma líder en Latinoamérica donde cualquier servicio sea accesible en un solo clic.</p>
        </div>
        <div class="mission-card animate-on-scroll delay-2">
          <div class="card-header">
            <svg class="card-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
            <h3>Valores</h3>
          </div>
          <p>Transparencia total, seguridad en pagos, calidad garantizada y soporte humano.</p>
        </div>
      </div>
    </section>

    <section class="cta-banner">
      <div class="container cta-content animate-on-scroll">
        <div class="cta-text">
          <h2>¿Listo para empezar?</h2>
          <p>Únete a miles de profesionales y clientes hoy mismo.</p>
          <button class="btn-start" @click="router.push('/register')">Comenzar Ahora</button>
        </div>
        <div class="cta-img-placeholder">
          <img 
            src="/fotos/persona felix.jpg" 
            alt="Comenzar" 
            style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;"
          >
        </div>
      </div>
    </section>

  </div>
</template>

<style scoped>
/* ANIMACIÓN */
.animate-on-scroll { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
.animate-on-scroll.visible { opacity: 1; transform: translateY(0); }
.delay-1 { transition-delay: 0.1s; }
.delay-2 { transition-delay: 0.2s; }
.delay-3 { transition-delay: 0.3s; }

/* HERO */
.hero { position: relative; height: 750px; display: flex; align-items: center; overflow: hidden; }
.video-bg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
.video-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1; }
.hero-container { position: relative; z-index: 2; width: 100%; }
.hero-content { max-width: 850px; color: white; }
.hero-content h1 { font-size: 4rem; margin-bottom: 30px; font-weight: 800; line-height: 1.1; }
.highlight { font-family: serif; font-style: italic; color: #F76B1C; }

/* BUSCADOR */
.big-search { display: flex; height: 70px; margin-bottom: 30px; background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: 4px; overflow: hidden; backdrop-filter: blur(8px); }
.big-search input { flex: 1; border: none; background: transparent; padding: 0 30px; font-size: 20px; outline: none; color: white; }
.big-search input::placeholder { color: rgba(255, 255, 255, 0.8); }
.big-search button { background: #0B4C6F; color: white; border: none; padding: 0 50px; font-weight: 700; cursor: pointer; font-size: 20px; transition: background 0.2s; }
.big-search button:hover { background: #093a55; }

/* TAGS */
.big-tags { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
.big-tags .pill { background: rgba(255,255,255,0.25); border: 2px solid rgba(255,255,255,0.5); color: white; padding: 10px 24px; border-radius: 30px; cursor: pointer; transition: 0.2s; font-size: 16px; font-weight: 600; }
.big-tags .pill:hover { background: white; color: #333; border-color: white; }

/* CÓMO FUNCIONA */
.how-it-works { padding: 100px 24px; background: white; text-align: center; }
.section-title { font-size: 36px; color: #404145; margin-bottom: 60px; font-weight: 800; }
.steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
.step-card { text-align: center; padding: 20px; }
.icon-box { width: 90px; height: 90px; margin: 0 auto 24px; background: #FFF4EC; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.step-svg { width: 45px; height: 45px; color: #F76B1C; }
.step-card h3 { font-size: 22px; margin-bottom: 12px; color: #404145; font-weight: 700; }
.step-card p { color: #62646a; line-height: 1.6; font-size: 16px; }

/* NUEVA SECCIÓN DE MARKETING (Quality Work) */
.quality-section { background: #f1fdf7; padding: 100px 24px; }
.quality-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
.quality-text h2 { font-size: 36px; font-weight: 800; color: #404145; margin-bottom: 40px; }
.quality-item { display: flex; gap: 15px; margin-bottom: 24px; }
.check-icon { color: #0B4C6F; width: 30px; flex-shrink: 0; }
.quality-item h3 { font-size: 18px; font-weight: 700; color: #404145; margin: 0 0 5px 0; }
.quality-item p { margin: 0; color: #62646a; line-height: 1.5; }
.placeholder-box { width: 100%; height: 400px; background: rgba(11, 76, 111, 0.1); border: 2px dashed #0B4C6F; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: #0B4C6F; font-weight: bold; }

/* CATEGORÍAS CON IMÁGENES */
.categories { padding: 100px 24px; background: white; }
.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 30px; }
.cat-item { 
  border: 1px solid #e4e5e7; border-radius: 8px; overflow: hidden;
  cursor: pointer; transition: all 0.2s; background: white; 
}
.cat-item:hover { box-shadow: 0 10px 20px rgba(0,0,0,0.08); transform: translateY(-5px); }
.cat-img-placeholder { width: 100%; height: 150px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
.cat-content { padding: 20px; }
.cat-content h4 { margin: 0; color: #404145; font-size: 18px; font-weight: 700; }

/* MISIÓN VISIÓN VALORES */
.mission-section { padding: 80px 24px; background: #fafafa; }
.mission-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
.mission-card { background: white; padding: 30px; border-radius: 8px; border: 1px solid #e4e5e7; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
.card-icon { width: 30px; height: 30px; color: #0B4C6F; }
.mission-card h3 { font-size: 20px; font-weight: 800; color: #0B4C6F; margin: 0; }
.mission-card p { color: #62646a; line-height: 1.6; }

/* CTA BANNER */
.cta-banner { background: #0B4C6F; padding: 100px 0; color: white; }
.cta-content { display: flex; align-items: center; justify-content: space-between; gap: 50px; }
.cta-text h2 { font-size: 42px; font-weight: 800; margin-bottom: 16px; }
.cta-text p { font-size: 18px; margin-bottom: 30px; opacity: 0.9; }
.btn-start { background: #F76B1C; color: white; border: none; padding: 16px 36px; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 18px; transition: 0.2s; }
.btn-start:hover { background: #e05a10; }
.cta-img-placeholder { width: 450px; height: 350px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px dashed rgba(255,255,255,0.5); }

@media (max-width: 900px) {
  .hero-content h1 { font-size: 2.5rem; }
  .steps-grid, .quality-grid, .mission-grid, .cta-content { grid-template-columns: 1fr; gap: 40px; text-align: center; }
  .quality-grid { text-align: left; }
  .cta-img-placeholder, .placeholder-box { width: 100%; height: 250px; }
}

.cat-img-real {
  width: 100%;
  height: 180px; 
  object-fit: cover; 
  border-radius: 8px 8px 0 0; 
}
</style>