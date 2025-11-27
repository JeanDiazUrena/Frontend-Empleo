<script setup>
// Importa los estilos para ESTA vista
import './Home.css';
</script>

<template>
  <main>
    <!-- ===== SECCIÓN HERO ===== -->
    <section class="hero" style="background-image: url('https://placehold.co/1600x800/222/FFF?text=Imagen+Profesional+de+Fondo');">
      <div class="hero__overlay"></div>
      <div class="hero__content container">
        <h1 class="hero__title">
          Encuentra el profesional perfecto para tu proyecto
        </h1>
        <p class="hero__subtitle">
          Calidad, Confianza y Comunidad a tu alcance.
        </p>

        <!-- Barra de Búsqueda -->
        <div class="search-bar">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="search-bar__icon">
            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input 
            type="text" 
            placeholder="Busca por servicio, categoría o profesional..." 
            class="search-bar__input"
          >
          <button class="button button--primary search-bar__button">
            Buscar
          </button>
        </div>
      </div>
    </section>

    <!-- ===== SECCIÓN EXPLORAR MURO ===== -->
    <section class="work-gallery container">
      <h2 class="work-gallery__title">
        Explora Trabajos Recientes
      </h2>
      <p class="work-gallery__subtitle">
        Inspírate con el portafolio de nuestros expertos.
      </p>

      <!-- Grid de Tarjetas de Trabajos -->
      <div class="card-grid">
        <!-- ... (Las 4 tarjetas de ejemplo van aquí) ... -->
        
        <!-- Tarjeta 1 (Ejemplo) -->
        <div class="card">
          <img src="https://placehold.co/400x300/EFEFEF/333?text=Trabajo+Reciente+1" alt="Trabajo de Carpintería" class="card__image">
          <div class="card__content">
            <p class="card__title">Marta Gómez</p>
            <p class="card__subtitle">Carpintería</p>
          </div>
        </div>

        <!-- Tarjeta 2 (Ejemplo) -->
        <div class="card">
          <img src="https://placehold.co/400x300/333/FFF?text=Logo+Vibrant" alt="Trabajo de Diseño Gráfico" class="card__image">
          <div class="card__content">
            <p class="card__title">Carlos Rivas</p>
            <p class="card__subtitle">Diseño Gráfico</p>
          </div>
        </div>

        <!-- Tarjeta 3 (Ejemplo) -->
        <div class="card">
          <img src="https://placehold.co/400x300/8BC34A/FFF?text=Sala+Moderna" alt="Trabajo de Pintura" class="card__image">
          <div class="card__content">
            <p class="card__title">Ana Torres</p>
            <p class="card__subtitle">Pintura</p>
          </div>
        </div>

        <!-- Tarjeta 4 (Ejemplo) -->
        <div class="card">
          <img src="https://placehold.co/400x300/4CAF50/FFF?text=Jardín+Sereno" alt="Trabajo de Jardinería" class="card__image">
          <div class="card__content">
            <p class="card__title">Javier Solís</p>
            <p class="card__subtitle">Jardinería</p>
          </div>
        </div>
        
      </div>
    </section>
  </main>
</template>