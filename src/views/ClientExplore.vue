<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();

const searchQuery = ref('');
const selectedCategory = ref('');
const selectedCity = ref('');
const professionals = ref([]);
const isLoading = ref(true);
const hasSearched = ref(false);
const sortedProfessionals = computed(() => {
  return [...professionals.value].sort((a, b) => (b.promedio_estrellas || 0) - (a.promedio_estrellas || 0));
});

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

const locationsDB = {
  "Santiago de los Caballeros": ["Villa Olga", "Los Jardines", "Gurabo", "El Embrujo", "Pekin", "Cienfuegos", "Centro Histórico"],
  "Santo Domingo": ["Piantini", "Naco", "Gazcue", "Bella Vista", "Zona Colonial", "Arroyo Hondo", "Los Prados"],
  "La Vega": ["Villa Palmarito", "Las Carolinas", "El Hatico", "Centro Ciudad"],
  "Puerto Plata": ["Torre Alta", "Bayardo", "Playa Dorada", "San Felipe"]
};

const allLocations = computed(() => {
  const list = [{ label: 'Toda la República', value: '', type: 'Nacional' }];
  Object.keys(locationsDB).forEach(prov => {
     list.push({ label: prov, value: prov, type: 'Provincia' });
     locationsDB[prov].forEach(sec => {
        list.push({ label: `${sec}, ${prov}`, value: sec, type: 'Sector' });
     });
  });
  return list;
});

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

// Advanced Search State
const catSearch = ref('');
const locSearch = ref('');
const showCatPopover = ref(false);
const showLocPopover = ref(false);
const searchBarRef = ref(null);
const catInputRef = ref(null);
const locInputRef = ref(null);

const filteredCats = computed(() => {
  if (!catSearch.value) return CATEGORIES.slice(1); // Exclude "Todas"
  const q = catSearch.value.toLowerCase();
  return CATEGORIES.slice(1).filter(c => c.label.toLowerCase().includes(q));
});

const filteredLocs = computed(() => {
  if (!locSearch.value) return allLocations.value.slice(1); // Exclude "Toda la República"
  const q = locSearch.value.toLowerCase();
  return allLocations.value.slice(1).filter(l => l.label.toLowerCase().includes(q));
});

const selectCat = (c) => {
  selectedCategory.value = c.value;
  catSearch.value = c.label === 'Todas las Categorías' ? '' : c.label;
  showCatPopover.value = false;
};

const selectLoc = (l) => {
  selectedCity.value = l.value;
  locSearch.value = l.label === 'Toda la República' ? '' : l.label;
  showLocPopover.value = false;
};

// Sync empty inputs with selected values
watch(catSearch, (val) => { if (!val) selectedCategory.value = ''; });
watch(locSearch, (val) => { if (!val) selectedCity.value = ''; });

const focusInput = (refName) => {
  const el = refName === 'catInput' ? catInputRef.value : locInputRef.value;
  if (el) el.focus();
};

const handleClickOutside = (e) => {
  if (searchBarRef.value && !searchBarRef.value.contains(e.target)) {
    showCatPopover.value = false;
    showLocPopover.value = false;
  }
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
    showCatPopover.value = false;
    showLocPopover.value = false;
  }
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = '';
  selectedCity.value = '';
  catSearch.value = '';
  locSearch.value = '';
  loadProfessionals();
};

const openDetail = (pro) => { 
  if (pro && pro.usuario_id) {
    router.push(`/client/professional-profile/${pro.usuario_id}`);
  }
};

const requestService = () => {
  router.push('/client/request');
};

const requestProfessionalService = (pro) => {
  router.push(`/client/request?pro=${pro.usuario_id}`);
};

const skillsOf = (pro) =>
  pro.habilidades ? pro.habilidades.split(',').map(s => s.trim()).filter(Boolean) : [];

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  loadProfessionals();
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <div class="explore-wrapper">

    <!-- ===== HERO SEARCH ===== -->
    <div class="explore-hero">
      <div class="hero-bg-wrapper">
        <div class="hero-bg-circle c1"></div>
        <div class="hero-bg-circle c2"></div>
        <div class="hero-bg-circle c3"></div>
      </div>
      <div class="hero-inner">
        <div class="hero-badge">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" /></svg>
          Directorio de Profesionales
        </div>
        <h1>Encuentra al experto ideal<br class="hide-on-mobile"> para tu proyecto</h1>
        <p class="hero-sub">Conecta con <strong>{{ professionals.length }}+ profesionales</strong> verificados listos para ayudarte</p>

        <!-- Search Card -->
        <div class="search-card" ref="searchBarRef">
          <div class="search-fields">

            <div class="sf-group">
              <div class="sf-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
              <div class="sf-input">
                <label>¿Qué buscas?</label>
                <input type="text" v-model="searchQuery" placeholder="Plomero, Electricista..." @keyup.enter="loadProfessionals" />
              </div>
            </div>

            <div class="sf-sep"></div>

            <div class="sf-group sf-clickable" :class="{ focused: showCatPopover }" @click="showCatPopover = true; showLocPopover = false; focusInput('catInput')">
              <div class="sf-icon"><i class="fa-solid fa-layer-group"></i></div>
              <div class="sf-input">
                <label>Categoría</label>
                <input ref="catInputRef" type="text" v-model="catSearch" placeholder="Cualquier categoría" />
              </div>
              <transition name="pop">
                <div v-if="showCatPopover" class="sf-popover">
                  <div class="sfp-header">Categorías</div>
                  <div class="sfp-item" @click.stop="selectCat({label: 'Todas las Categorías', value: ''})">
                    <span class="sfp-dot all"></span>Todas las Categorías
                  </div>
                  <div v-for="c in filteredCats" :key="c.value" class="sfp-item" @click.stop="selectCat(c)">
                    <span class="sfp-dot"></span>{{ c.label }}
                  </div>
                  <div v-if="filteredCats.length === 0" class="sfp-empty">Sin resultados</div>
                </div>
              </transition>
            </div>

            <div class="sf-sep"></div>

            <div class="sf-group sf-clickable" :class="{ focused: showLocPopover }" @click="showLocPopover = true; showCatPopover = false; focusInput('locInput')">
              <div class="sf-icon"><i class="fa-solid fa-location-dot"></i></div>
              <div class="sf-input">
                <label>Ubicación</label>
                <input ref="locInputRef" type="text" v-model="locSearch" placeholder="Toda la República" />
              </div>
              <transition name="pop">
                <div v-if="showLocPopover" class="sf-popover sf-popover-right">
                  <div class="sfp-header">Provincias y Sectores</div>
                  <div class="sfp-item" @click.stop="selectLoc({label: 'Toda la República', value: ''})">
                    <span class="sfp-dot all"></span>Toda la República
                    <span class="sfp-badge">Nacional</span>
                  </div>
                  <div v-for="loc in filteredLocs" :key="loc.label" class="sfp-item" @click.stop="selectLoc(loc)">
                    <span class="sfp-dot" :class="loc.type === 'Provincia' ? 'prov' : 'sec'"></span>{{ loc.label }}
                    <span class="sfp-badge" :class="loc.type === 'Provincia' ? 'badge-prov' : 'badge-sec'">{{ loc.type }}</span>
                  </div>
                  <div v-if="filteredLocs.length === 0" class="sfp-empty">Sin resultados</div>
                </div>
              </transition>
            </div>
          </div>

          <button class="sc-btn" @click.stop="loadProfessionals">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clip-rule="evenodd" /></svg>
            Buscar
          </button>
        </div>

        <div class="hero-tags" v-if="searchQuery || selectedCategory || selectedCity">
          <span class="hero-tag" v-if="selectedCategory">{{ catSearch }} <button @click="selectedCategory='';catSearch='';loadProfessionals()">×</button></span>
          <span class="hero-tag" v-if="selectedCity">{{ locSearch }} <button @click="selectedCity='';locSearch='';loadProfessionals()">×</button></span>
          <button class="hero-clear" @click="clearFilters">Limpiar todo</button>
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
          v-for="pro in sortedProfessionals"
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
<div class="pro-card-rating" v-if="pro.promedio_estrellas">
  <span class="rating-stars">
    <i v-for="i in 5" :key="i" class="fa-solid" :class="i <= Math.round(pro.promedio_estrellas) ? 'fa-star' : 'fa-star-half-alt'"></i>
  </span>
  <span class="rating-count">({{ pro.cantidad_resenas || 0 }})</span>
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
            <button class="btn-request-service" @click.stop="requestProfessionalService(pro)">
              Solicitar servicio
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
  background: linear-gradient(140deg, #071E38 0%, #0B4C6F 45%, #0d6ea0 100%);
  border-radius: 20px;
  padding: 64px 32px 56px;
  margin-bottom: 32px;
  position: relative;
  z-index: 50; /* Ensure search popovers are above cards */
  overflow: visible; /* Fix clipping of popovers */
}
.hero-bg-wrapper {
  position: absolute;
  inset: 0;
  border-radius: 20px;
  overflow: hidden;
  pointer-events: none;
}
.hero-bg-circle {
  position: absolute; border-radius: 50%; pointer-events: none;
}
.hero-bg-circle.c1 { width: 400px; height: 400px; background: rgba(255,255,255,0.04); top: -150px; right: -100px; }
.hero-bg-circle.c2 { width: 200px; height: 200px; background: rgba(255,255,255,0.03); bottom: -80px; left: 10%; }
.hero-bg-circle.c3 { width: 120px; height: 120px; background: rgba(247,107,28,0.15); top: 30px; left: -40px; }

.hero-inner { position: relative; z-index: 1; text-align: center; }

.hero-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.12); backdrop-filter: blur(8px);
  color: rgba(255,255,255,0.9); font-size: 0.82rem; font-weight: 700;
  padding: 6px 16px; border-radius: 30px; margin-bottom: 20px;
  border: 1px solid rgba(255,255,255,0.18); letter-spacing: 0.03em;
}
.explore-hero h1 {
  font-size: 2.6rem; font-weight: 900; color: white;
  margin: 0 0 14px; line-height: 1.15;
  text-shadow: 0 2px 20px rgba(0,0,0,0.2);
}
.hero-sub {
  color: rgba(255,255,255,0.7); font-size: 1.05rem;
  margin: 0 0 36px; font-weight: 400;
}
.hero-sub strong { color: #FFD580; font-weight: 700; }

/* === SEARCH CARD === */
.search-card {
  display: flex; align-items: center;
  background: white; border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  max-width: 860px; margin: 0 auto 20px;
  padding: 6px 6px 6px 0;
  overflow: visible;
}
.search-fields {
  display: flex; flex: 1; align-items: center;
}

/* Each field group */
.sf-group {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 20px; flex: 1; position: relative;
}
.sf-group.sf-clickable { cursor: pointer; border-radius: 14px; transition: background 0.2s; }
.sf-group.sf-clickable:hover { background: #F8FAFC; }
.sf-group.sf-clickable.focused { background: #F0F9FF; }
.sf-sep { width: 1px; height: 36px; background: #E2E8F0; flex-shrink: 0; }

.sf-icon { font-size: 1.15rem; flex-shrink: 0; opacity: 0.75; }
.sf-input { display: flex; flex-direction: column; min-width: 0; }
.sf-input label {
  font-size: 0.68rem; font-weight: 800; color: #94A3B8;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 3px; cursor: pointer;
}
.sf-input input {
  border: none; background: transparent; outline: none;
  font-size: 1.1rem; color: #0F172A; font-weight: 700;
  width: 100%; padding: 2px 0; cursor: text;
  letter-spacing: -0.01em;
}
.sf-input input::placeholder { color: #94A3B8; font-weight: 400; font-size: 0.95rem; }

/* Search button */
.sc-btn {
  background: linear-gradient(135deg, #F76B1C, #e05510);
  color: white; border: none; border-radius: 14px;
  padding: 18px 28px; font-weight: 800; font-size: 0.95rem;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(247,107,28,0.4);
}
.sc-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(247,107,28,0.5); }
.sc-btn svg { width: 18px; height: 18px; }

/* === FILTER POPOVERS === */
.sf-popover {
  position: absolute; top: calc(100% + 14px); left: 0;
  width: 320px; background: white; border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.2), 0 0 1px rgba(0,0,0,0.1);
  border: 1px solid #E2E8F0;
  max-height: 380px; overflow-y: auto; z-index: 300;
  padding: 10px 0;
  backdrop-filter: blur(10px);
}
.sf-popover-right { left: auto; right: 0; }
.sfp-header {
  padding: 12px 20px 6px;
  font-size: 0.68rem; font-weight: 800;
  color: #94A3B8; text-transform: uppercase; letter-spacing: 0.08em;
}
.sfp-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px; cursor: pointer;
  font-size: 0.9rem; font-weight: 600; color: #1E293B;
  transition: background 0.15s;
}
.sfp-item:hover { background: #F8FAFC; }
.sfp-dot { width: 8px; height: 8px; border-radius: 50%; background: #CBD5E1; flex-shrink: 0; }
.sfp-dot.all { background: #F76B1C; }
.sfp-dot.prov { background: #3B82F6; }
.sfp-dot.sec  { background: #10B981; }
.sfp-badge {
  margin-left: auto; font-size: 0.68rem; font-weight: 700;
  padding: 2px 8px; border-radius: 20px;
  background: #F1F5F9; color: #64748B;
}
.badge-prov { background: #DBEAFE; color: #1D4ED8; }
.badge-sec  { background: #D1FAE5; color: #065F46; }
.sfp-empty { padding: 16px 20px; color: #94A3B8; font-size: 0.88rem; }

/* Active filter tags */
.hero-tags { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
.hero-tag {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.15); color: white;
  font-size: 0.82rem; font-weight: 600; padding: 5px 14px;
  border-radius: 30px; border: 1px solid rgba(255,255,255,0.25);
}
.hero-tag button { background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 1rem; line-height: 1; padding: 0; }
.hero-tag button:hover { color: white; }
.hero-clear {
  background: transparent; border: 1px solid rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.6); font-size: 0.8rem; font-weight: 600;
  padding: 5px 14px; border-radius: 30px; cursor: pointer; transition: 0.2s;
}
.hero-clear:hover { background: rgba(255,255,255,0.1); color: white; }

/* ANIMATIONS */
.pop-enter-active, .pop-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-8px) scale(0.97); }

@media (max-width: 768px) {
  .explore-hero { padding: 48px 20px 40px; }
  .explore-hero h1 { font-size: 1.9rem; }
  .search-card { flex-direction: column; padding: 12px; border-radius: 20px; gap: 4px; }
  .search-fields { flex-direction: column; width: 100%; }
  .sf-group { width: 100%; padding: 12px 16px; }
  .sf-sep { width: 100%; height: 1px; }
  .sc-btn { width: 100%; justify-content: center; padding: 16px; border-radius: 12px; }
  .sf-popover { position: fixed; top: auto; bottom: 0; left: 0; right: 0; width: 100%; border-radius: 24px 24px 0 0; }
}

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

.btn-request-service { width: 100%; background: none; border: 1.5px solid #0B4C6F; color: #0B4C6F; padding: 8px; border-radius: 8px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: 0.2s; margin-top: 8px; }
.btn-request-service:hover { background: #0B4C6F; color: white; }

.rating-stars i { color: #FBBF24; margin-right: 2px; }
.rating-count { font-size: 0.75rem; color: #6B7280; margin-left: 4px; }

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