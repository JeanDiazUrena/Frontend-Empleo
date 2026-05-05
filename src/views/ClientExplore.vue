<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const searchQuery = ref('');
const selectedCategory = ref('');
const selectedCity = ref('');
const professionals = ref([]);
const isLoading = ref(true);
const hasSearched = ref(false);

const CATEGORIES = [
  { label: 'Todas las Categorías', value: '' },
  { label: 'Hogar', value: 'hogar' },
  { label: 'Tecnología', value: 'tecnologia' },
  { label: 'Educación', value: 'educacion' },
  { label: 'Belleza', value: 'belleza' },
  { label: 'Eventos', value: 'eventos' },
  { label: 'Salud', value: 'salud' },
  { label: 'Legal', value: 'legal' },
  { label: 'Construcción', value: 'construccion' },
  { label: 'Otros', value: 'otros' },
];

const CITIES = ['', 'Santiago de los Caballeros', 'Santo Domingo', 'La Vega', 'Puerto Plata'];

const categoryColors = {
  hogar:        { bg: '#FEF3C7', text: '#92400E' },
  tecnologia:   { bg: '#DBEAFE', text: '#1E40AF' },
  tecnología:   { bg: '#DBEAFE', text: '#1E40AF' },
  educacion:    { bg: '#D1FAE5', text: '#065F46' },
  educación:    { bg: '#D1FAE5', text: '#065F46' },
  belleza:      { bg: '#FCE7F3', text: '#9D174D' },
  eventos:      { bg: '#EDE9FE', text: '#5B21B6' },
  salud:        { bg: '#ECFDF5', text: '#065F46' },
  legal:        { bg: '#FEE2E2', text: '#991B1B' },
  construccion: { bg: '#FEF9C3', text: '#854D0E' },
  construcción: { bg: '#FEF9C3', text: '#854D0E' },
};

const getCatStyle = (cat) => {
  const key = (cat || '').toLowerCase();
  return categoryColors[key] || { bg: '#F1F5F9', text: '#475569' };
};

const loadProfessionals = async () => {
  isLoading.value = true;
  hasSearched.value = true;
  try {
    const params = {};
    if (searchQuery.value.trim()) params.busqueda = searchQuery.value.trim();
    if (selectedCategory.value) params.categoria = selectedCategory.value;
    if (selectedCity.value) params.ciudad = selectedCity.value;

    const { data } = await axios.get('http://localhost:3001/api/profesionales', { params });
    professionals.value = data || [];
  } catch (error) {
    console.error('Error cargando profesionales:', error);
    professionals.value = [];
  } finally {
    isLoading.value = false;
  }
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = '';
  selectedCity.value = '';
  loadProfessionals();
};

const openDetail = (pro) => { 
  if (pro && pro.usuario_id) {
    router.push(`/client/professional-profile/${pro.usuario_id}`);
  }
};

const contactPro = (pro) => {
  router.push({ path: '/client/chat', query: { profesional_id: pro.usuario_id } });
};

const requestService = () => {
  if (selectedPro.value && selectedPro.value.usuario_id) {
    router.push({ path: '/client/request', query: { profesional_id: selectedPro.value.usuario_id } });
  } else {
    router.push('/client/request');
  }
};

const skillsOf = (pro) =>
  pro.habilidades ? pro.habilidades.split(',').map(s => s.trim()).filter(Boolean) : [];

onMounted(loadProfessionals);
</script>

<template>
  <div class="explore-wrapper">

    <!-- ===== HERO SEARCH ===== -->
    <div class="explore-hero">
      <div class="hero-inner">
        <div class="hero-label"><i class="fa-solid fa-magnifying-glass"></i> Directorio de Profesionales</div>
        <h1>Encuentra al experto ideal <br class="hide-on-mobile"> para tu proyecto</h1>
        <p>Más de {{ professionals.length }} profesionales listos para ayudarte</p>

        <div class="search-bar-big">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="search-icon"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" /></svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Ej: Plomero, Electricista, Diseñador Web..."
            @keyup.enter="loadProfessionals"
          />
          <button class="btn-search" @click="loadProfessionals">Buscar</button>
        </div>

        <div class="filters-row">
          <select v-model="selectedCategory" @change="loadProfessionals" class="filter-pill">
            <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
          <select v-model="selectedCity" @change="loadProfessionals" class="filter-pill">
            <option value="">Toda la República</option>
            <option v-for="city in CITIES.slice(1)" :key="city" :value="city">{{ city }}</option>
          </select>
          <button v-if="searchQuery || selectedCategory || selectedCity" class="filter-clear" @click="clearFilters">
            × Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <!-- ===== RESULTADOS ===== -->
    <div class="results-section">

      <div class="results-header">
        <h2 class="results-title">
          <span v-if="isLoading">Buscando profesionales...</span>
          <span v-else-if="professionals.length === 0">Sin resultados</span>
          <span v-else>{{ professionals.length }} profesional{{ professionals.length !== 1 ? 'es' : '' }} encontrado{{ professionals.length !== 1 ? 's' : '' }}</span>
        </h2>
      </div>

      <!-- LOADING -->
      <div v-if="isLoading" class="loading-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skel-banner"></div>
          <div class="skel-body">
            <div class="skel-avatar"></div>
            <div class="skel-line w70 mt12"></div>
            <div class="skel-line w50"></div>
            <div class="skel-line w80"></div>
          </div>
        </div>
      </div>

      <!-- VACÍO -->
      <div v-else-if="professionals.length === 0" class="empty-explore">
        <div class="empty-icon"><i class="fa-solid fa-user-tie"></i></div>
        <h3>No encontramos profesionales</h3>
        <p v-if="searchQuery || selectedCategory || selectedCity">
          Intenta con otros términos o quita los filtros aplicados.
        </p>
        <p v-else>
          Aún no hay profesionales registrados. ¡Pronto habrá más!
        </p>
        <button v-if="searchQuery || selectedCategory || selectedCity" class="btn-cta" @click="clearFilters">
          Ver todos los profesionales
        </button>
      </div>

      <!-- GRID DE TARJETAS -->
      <div v-else class="pros-grid">
        <div
          v-for="pro in professionals"
          :key="pro.id"
          class="pro-card"
          @click="openDetail(pro)"
        >
          <!-- Banner -->
          <div
            class="pro-card-banner"
            :style="pro.cover_url ? { backgroundImage: `url(${pro.cover_url})` } : {}"
          >
            <div class="pro-card-banner-overlay"></div>
            <span
              v-if="pro.categoria_nombre"
              class="pro-card-category"
              :style="{ background: getCatStyle(pro.categoria_nombre).bg, color: getCatStyle(pro.categoria_nombre).text }"
            >
              {{ pro.categoria_nombre }}
            </span>
          </div>

          <!-- Avatar -->
          <div class="pro-card-avatar-wrap">
            <div class="pro-card-avatar">
              <img v-if="pro.avatar_url" :src="pro.avatar_url" :alt="pro.nombre" />
              <div v-else class="pro-card-initials">
                {{ pro.nombre?.charAt(0).toUpperCase() || 'P' }}
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="pro-card-body">
            <h3 class="pro-card-name">{{ pro.nombre }}</h3>
            <p class="pro-card-profession">{{ pro.profesion || 'Profesional' }}</p>

            <p v-if="pro.biografia" class="pro-card-bio">
              {{ pro.biografia.length > 80 ? pro.biografia.substring(0, 80) + '...' : pro.biografia }}
            </p>

            <div class="pro-card-meta">
              <span v-if="pro.ciudad" class="meta-tag">
                <i class="fa-solid fa-location-dot e-icon"></i> {{ pro.ciudad }}
              </span>
              <span v-if="pro.anios_experiencia" class="meta-tag">
                <i class="fa-regular fa-clock e-icon"></i> {{ pro.anios_experiencia }} años exp.
              </span>
            </div>

            <!-- Skills preview -->
            <div v-if="pro.habilidades" class="skills-preview">
              <span
                v-for="skill in skillsOf(pro).slice(0, 3)"
                :key="skill"
                class="skill-mini"
              >{{ skill }}</span>
              <span v-if="skillsOf(pro).length > 3" class="skill-mini more">
                +{{ skillsOf(pro).length - 3 }}
              </span>
            </div>
          </div>

          <div class="pro-card-footer">
            <button class="btn-ver-perfil" @click.stop="openDetail(pro)">
              Ver perfil completo →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== HERO ===== */
.explore-wrapper { width: 100%; font-family: 'Inter', sans-serif; }

.explore-hero {
  background: linear-gradient(135deg, #0B4C6F 0%, #083a55 60%, #0f5280 100%);
  border-radius: 16px;
  padding: 48px 32px;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
}
.explore-hero::before {
  content: '';
  position: absolute;
  top: -80px; right: -80px;
  width: 300px; height: 300px;
  background: rgba(255,255,255,0.04);
  border-radius: 50%;
}
.hero-inner { position: relative; z-index: 1; text-align: center; }
.hero-label { display: inline-block; background: rgba(255,255,255,0.15); color: white; font-size: 0.85rem; font-weight: 700; padding: 4px 14px; border-radius: 20px; margin-bottom: 16px; }
.explore-hero h1 { font-size: 2.2rem; font-weight: 800; color: white; margin: 0 0 10px; line-height: 1.2; }
.explore-hero p { color: rgba(255,255,255,0.75); font-size: 1rem; margin: 0 0 28px; }

.search-bar-big {
  display: flex; align-items: center;
  background: white; border-radius: 50px;
  padding: 6px 6px 6px 20px;
  max-width: 680px; margin: 0 auto 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.search-icon { width: 18px; height: 18px; color: #6B7280; flex-shrink: 0; margin-right: 10px; }
.search-bar-big input { border: none; flex: 1; font-size: 0.95rem; outline: none; background: transparent; color: #111; }
.btn-search { background: #F76B1C; color: white; border: none; padding: 10px 26px; border-radius: 50px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }
.btn-search:hover { background: #e05a10; }

.filters-row { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }
.filter-pill { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 8px 16px; border-radius: 30px; font-size: 0.88rem; cursor: pointer; font-family: inherit; }
.filter-pill option { color: #333; background: white; }
.filter-clear { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.4); color: white; padding: 8px 16px; border-radius: 30px; font-size: 0.88rem; cursor: pointer; transition: 0.2s; font-weight: 600; }
.filter-clear:hover { background: rgba(255,255,255,0.3); }

/* ===== RESULTS ===== */
.results-section { padding-bottom: 20px; }
.results-header { margin-bottom: 20px; }
.results-title { font-size: 1.1rem; font-weight: 700; color: #111; margin: 0; }

/* LOADING SKELETON */
.loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.skeleton-card { background: white; border-radius: 16px; border: 1px solid #E5E7EB; overflow: hidden; }
.skel-banner { height: 100px; background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 400%; animation: shimmer 1.4s ease infinite; }
.skel-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.skel-avatar { width: 60px; height: 60px; border-radius: 50%; background: #f0f0f0; margin-top: -30px; border: 3px solid white; }
.skel-line { height: 12px; border-radius: 6px; background: #f0f0f0; }
.w70 { width: 70%; } .w50 { width: 50%; } .w80 { width: 80%; } .mt12 { margin-top: 4px; }
@keyframes shimmer { 0%{ background-position: 200% 0; } 100%{ background-position: -200% 0; } }

/* EMPTY */
.empty-explore { text-align: center; padding: 60px 20px; background: white; border-radius: 16px; border: 1px solid #E5E7EB; }
.empty-icon { font-size: 3.5rem; margin-bottom: 16px; }
.empty-explore h3 { margin: 0 0 8px; font-size: 1.2rem; color: #111; font-weight: 700; }
.empty-explore p { color: #6B7280; font-size: 0.9rem; margin: 0 0 20px; }
.btn-cta { background: #0B4C6F; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-cta:hover { background: #093a55; }

/* ===== PRO CARDS GRID ===== */
.pros-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(285px, 1fr)); gap: 20px; }

.pro-card {
  background: white; border-radius: 16px; border: 1px solid #E5E7EB;
  overflow: hidden; cursor: pointer; transition: box-shadow 0.25s, transform 0.25s;
  display: flex; flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.pro-card:hover { box-shadow: 0 12px 30px rgba(0,0,0,0.12); transform: translateY(-3px); }

/* Banner de la tarjeta */
.pro-card-banner { height: 100px; background: linear-gradient(135deg, #0B4C6F, #1a8fcc); background-size: cover; background-position: center; position: relative; }
.pro-card-banner-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.15); }
.pro-card-category { position: absolute; top: 10px; right: 10px; font-size: 0.72rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: capitalize; }

/* Avatar de la tarjeta */
.pro-card-avatar-wrap { padding: 0 16px; }
.pro-card-avatar { 
  width: 64px; 
  height: 64px; 
  border-radius: 50%; 
  border: 3px solid white; 
  overflow: hidden; 
  margin-top: -32px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
  background: white;
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pro-card-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pro-card-initials { width: 100%; height: 100%; background: #E0F2FE; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; color: #0B4C6F; }

/* Body */
.pro-card-body { padding: 16px 16px 12px; flex: 1; }
.pro-card-name { margin: 0 0 2px; font-size: 1.05rem; font-weight: 800; color: #111; }
.pro-card-profession { margin: 0 0 8px; font-size: 0.85rem; color: #4F46E5; font-weight: 600; }
.pro-card-bio { margin: 0 0 10px; font-size: 0.83rem; color: #6B7280; line-height: 1.5; }

.pro-card-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.meta-tag { font-size: 0.78rem; color: #6B7280; font-weight: 500; }

.skills-preview { display: flex; flex-wrap: wrap; gap: 5px; }
.skill-mini { font-size: 0.72rem; background: #EEF2FF; color: #4F46E5; padding: 2px 8px; border-radius: 20px; font-weight: 600; border: 1px solid #C7D2FE; }
.skill-mini.more { background: #F1F5F9; color: #64748B; border-color: #E2E8F0; }

/* Footer de tarjeta */
.pro-card-footer { padding: 12px 16px; border-top: 1px solid #F3F4F6; }
.btn-ver-perfil { width: 100%; background: none; border: 1.5px solid #0B4C6F; color: #0B4C6F; padding: 8px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.2s; }
.btn-ver-perfil:hover { background: #0B4C6F; color: white; }

/* ===== MODAL DETALLE ===== */
.modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 16px; }
.pro-detail-modal { background: white; border-radius: 20px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 30px 80px rgba(0,0,0,0.3); position: relative; }
.modal-x { position: absolute; top: 14px; right: 16px; background: white; border: none; font-size: 1.4rem; cursor: pointer; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 2; color: #6B7280; line-height: 1; }
.modal-x:hover { color: #111; }

.detail-banner { height: 140px; background: linear-gradient(135deg, #0B4C6F, #1a8fcc); background-size: cover; background-position: center; }
.detail-header-content { display: flex; gap: 16px; padding: 0 24px 16px; align-items: flex-end; border-bottom: 1px solid #F3F4F6; }
.detail-avatar { 
  width: 80px; 
  height: 80px; 
  border-radius: 50%; 
  border: 4px solid white; 
  overflow: hidden; 
  margin-top: -40px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
  flex-shrink: 0; 
  background: white; 
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-avatar img { width: 100%; height: 100%; object-fit: cover; }
.detail-initials { width: 100%; height: 100%; background: #E0F2FE; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; color: #0B4C6F; }
.detail-name-block { flex: 1; padding-top: 8px; }
.detail-name-block h2 { margin: 0 0 2px; font-size: 1.3rem; font-weight: 800; color: #111; }
.detail-profession { margin: 0 0 8px; color: #4F46E5; font-weight: 600; font-size: 0.9rem; }
.detail-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.dchip { font-size: 0.75rem; font-weight: 700; padding: 3px 10px; border-radius: 20px; background: #F1F5F9; color: #475569; }
.dchip.loc { background: #FEF3C7; color: #92400E; }
.dchip.exp { background: #FEF9C3; color: #854D0E; }

.detail-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
.detail-section {}
.dsection-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #6B7280; margin-bottom: 10px; }
.detail-bio { margin: 0; color: #374151; font-size: 0.9rem; line-height: 1.7; }

.skills-cloud { display: flex; flex-wrap: wrap; gap: 7px; }
.skill-bubble { background: #EEF2FF; color: #4F46E5; border: 1px solid #C7D2FE; font-size: 0.8rem; font-weight: 600; padding: 4px 12px; border-radius: 20px; }

.contact-grid-modal { display: flex; flex-direction: column; gap: 10px; }
.citem { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: #374151; }
.citem-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; }
.phone { background: #D1FAE5; } .email { background: #FCE7F3; } .web { background: #DBEAFE; }
.clink { color: #0B4C6F; font-weight: 600; text-decoration: none; }
.clink:hover { text-decoration: underline; }

.portfolio-preview-img { width: 100%; border-radius: 10px; object-fit: cover; max-height: 220px; }

.detail-footer { display: flex; gap: 12px; padding: 16px 24px; border-top: 1px solid #F3F4F6; }
.btn-request { flex: 1; background: #0B4C6F; color: white; border: none; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
.btn-request:hover { background: #093a55; }
.btn-chat { flex: 1; background: white; border: 1.5px solid #E5E7EB; color: #374151; padding: 12px 20px; border-radius: 10px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: 0.2s; }
.btn-chat:hover { border-color: #0B4C6F; color: #0B4C6F; }

/* RESEÑAS MODAL */
.d-flex-between { display: flex; justify-content: space-between; align-items: center; }
.review-count { color: #F59E0B; font-weight: 800; font-size: 0.85rem; }
.reviews-loading { padding: 20px; text-align: center; color: #9CA3AF; }
.reviews-empty { padding: 20px; text-align: center; color: #9CA3AF; background: #F8FAFC; border-radius: 10px; border: 1px dashed #E5E7EB; }
.empty-star-icon { display: block; font-size: 1.5rem; margin-bottom: 8px; }
.modal-reviews-list { display: flex; flex-direction: column; gap: 12px; }
.modal-review-card { background: #F8FAFC; padding: 16px; border-radius: 12px; border: 1px solid #F1F5F9; }
.review-card-header { display: flex; justify-content: space-between; margin-bottom: 8px; align-items: flex-start; }
.review-client { display: flex; align-items: center; gap: 10px; }
.review-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.review-client-name { font-weight: 700; font-size: 0.88rem; color: #111; }
.review-stars { color: #F59E0B; font-size: 0.82rem; display: flex; gap: 2px; }
.review-text { margin: 0; font-size: 0.88rem; color: #4B5563; line-height: 1.6; }
.review-date-wrap { text-align: right; margin-top: 6px; }
.review-date { font-size: 0.72rem; color: #9CA3AF; }

@media (max-width: 480px) {
  .review-card-header { flex-direction: column; gap: 8px; }
  .review-stars { order: -1; } /* Estrellas arriba del nombre en pantallas muy pequeñas */
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .results-header { margin-bottom: 15px; text-align: center; }
  .results-title { font-size: 1rem; }
  .hide-on-mobile { display: none; }
  .explore-hero { padding: 40px 20px; text-align: center; }
  .explore-hero h1 { font-size: 1.8rem; }
  .search-bar-big { flex-direction: column; height: auto; padding: 16px; gap: 12px; border-radius: 20px; max-width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
  .search-icon { display: none; }
  .search-bar-big input { width: 100%; text-align: center; font-size: 1rem; padding: 10px 0; }
  .btn-search { width: 100%; padding: 14px; border-radius: 12px; font-size: 1rem; }
  
  .filters-row { flex-direction: column; align-items: stretch; margin-top: 15px; gap: 12px; }
  .filter-pill { width: 100%; border-radius: 12px; padding: 12px; font-size: 0.95rem; }
  .filter-clear { width: 100%; border-radius: 12px; padding: 12px; }
  
  .pros-grid { grid-template-columns: 1fr; }
  
  .pro-detail-modal { border-radius: 0; max-height: 100vh; height: 100%; margin: 0; }
  .detail-header-content { flex-direction: column; align-items: center; text-align: center; padding: 0 20px 20px; }
  .detail-avatar { width: 100px; height: 100px; margin-top: -50px; }
  .detail-name-block { width: 100%; }
  .detail-chips { justify-content: center; }
  .detail-footer { flex-direction: column; padding: 20px; position: sticky; bottom: 0; background: white; box-shadow: 0 -4px 12px rgba(0,0,0,0.05); }
  .btn-request, .btn-chat { width: 100%; }
}

@media (max-width: 480px) {
  .explore-hero h1 { font-size: 1.5rem; }
}

.e-icon { width: 16px; height: 16px; display: inline-block; vertical-align: middle; }
.e-icon-chip { width: 14px; height: 14px; display: inline-block; vertical-align: text-bottom; margin-right: 2px; }
.btn-icon-wrap { display: inline-flex; align-items: center; justify-content: center; margin-right: 6px; }
.meta-tag, .dchip { display: flex; align-items: center; gap: 4px; }
</style>