<script setup>
import { ref } from 'vue';

const searchQuery = ref('');
const selectedCategory = ref('');
const selectedLocation = ref('');
const professionals = ref([]); // VACÍO
</script>

<template>
  <div class="explore-wrapper">
    
    <div class="explore-hero-full">
      <div class="hero-content">
        <h1>Encuentra al profesional ideal</h1>
        <p>Busca por nombre, servicio o especialidad.</p>
        
        <div class="big-search-bar">
          <span class="search-icon-lg">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:20px;">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg>
          </span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Ej: Plomero, Reparación de Aire, Limpieza..."
          >
          <button class="btn-search-main">Buscar</button>
        </div>

        <div class="filters-bar">
          <select v-model="selectedCategory" class="filter-select">
            <option value="">Todas las Categorías</option>
            <option value="hogar">Hogar</option>
            <option value="tecnologia">Tecnología</option>
          </select>

          <select v-model="selectedLocation" class="filter-select">
            <option value="">Toda República Dominicana</option>
            <option value="santiago">Santiago</option>
            <option value="santodomingo">Santo Domingo</option>
          </select>
        </div>
      </div>
    </div>

    <div class="results-area-full">
      <h3 class="results-title">Resultados de búsqueda</h3>

      <div v-if="professionals.length === 0" class="empty-search-state-wide">
        <div class="empty-img-svg">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#ccc" stroke-width="1">
             <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75l-2.489-2.489m0 0a3.375 3.375 0 10-4.773-4.773 3.375 3.375 0 004.774 4.774zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
        </div>
        <h2>No hemos encontrado resultados</h2>
        <p>
          Todavía no hay profesionales registrados que coincidan con tu búsqueda.
        </p>
      </div>
      <div v-else class="pros-mosaic-grid"></div>
    </div>

  </div>
</template>

<style scoped>
.explore-wrapper { width: 100%; }
.explore-hero-full { background: linear-gradient(135deg, #0B4C6F 0%, #083a55 100%); padding: 4rem 2rem; text-align: center; color: white; border-radius: 12px; margin-bottom: 2rem; }
.explore-hero-full h1 { font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 800; }
.big-search-bar { display: flex; align-items: center; background: white; border-radius: 60px; padding: 8px 8px 8px 20px; max-width: 800px; margin: 2rem auto; }
.big-search-bar input { border: none; flex: 1; padding: 10px; outline: none; font-size: 1rem; }
.btn-search-main { background: #F76B1C; color: white; border: none; padding: 12px 30px; border-radius: 50px; font-weight: 700; cursor: pointer; }
.filters-bar { display: flex; justify-content: center; gap: 15px; }
.filter-select { padding: 10px 20px; border-radius: 30px; border: 1px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.2); color: white; cursor: pointer; }
.filter-select option { color: #333; }
.empty-search-state-wide { text-align: center; padding: 4rem; background: white; border: 1px dashed #ccc; border-radius: 12px; }
.empty-img-svg { width: 80px; height: 80px; margin: 0 auto 15px; }
.empty-img-svg svg { width: 100%; height: 100%; }
</style>