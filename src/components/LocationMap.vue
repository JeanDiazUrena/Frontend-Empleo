<template>
  <div v-if="coordinates" class="location-map-card">
    <div class="map-header">
      <span class="map-icon"><i class="fa-solid fa-location-dot"></i></span>
      <div>
        <strong>{{ title }}</strong>
        <small>{{ coordinateLabel }}</small>
      </div>
    </div>

    <div
      ref="mapEl"
      class="leaflet-map"
      :style="{ height: normalizedHeight }"
      aria-label="Mapa de ubicacion"
    ></div>

    <a :href="osmLink" target="_blank" rel="noopener noreferrer" class="map-link">
      <i class="fa-solid fa-arrow-up-right-from-square"></i>
      Abrir mapa
    </a>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  latitude: { type: [String, Number], default: null },
  longitude: { type: [String, Number], default: null },
  locationText: { type: String, default: '' },
  title: { type: String, default: 'Ubicación compartida' },
  height: { type: [String, Number], default: 260 },
  zoom: { type: Number, default: 15 }
});

const mapEl = ref(null);
let leafletMap = null;
let marker = null;

const normalizedHeight = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : props.height
);

const parseNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const parseCoordinatesFromText = (value = '') => {
  const text = String(value);
  const match = text.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;

  const lat = parseNumber(match[1]);
  const lng = parseNumber(match[2]);
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
};

const coordinates = computed(() => {
  const lat = parseNumber(props.latitude);
  const lng = parseNumber(props.longitude);

  if (lat !== null && lng !== null) return { lat, lng };
  return parseCoordinatesFromText(props.locationText);
});

const coordinateLabel = computed(() =>
  coordinates.value ? `${coordinates.value.lat.toFixed(6)}, ${coordinates.value.lng.toFixed(6)}` : ''
);

const osmLink = computed(() => {
  if (!coordinates.value) return '#';
  const { lat, lng } = coordinates.value;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${props.zoom}/${lat}/${lng}`;
});

const ensureLeaflet = async () => {
  if (window.L) return window.L;

  if (!document.querySelector('link[data-leaflet-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    link.dataset.leafletCss = 'true';
    document.head.appendChild(link);
  }

  if (!window.__leafletLoading) {
    window.__leafletLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.crossOrigin = '';
      script.onload = () => resolve(window.L);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return window.__leafletLoading;
};

const renderMap = async () => {
  if (!coordinates.value || !mapEl.value) return;

  await nextTick();
  const L = await ensureLeaflet();
  const { lat, lng } = coordinates.value;

  if (!leafletMap) {
    leafletMap = L.map(mapEl.value, {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([lat, lng], props.zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);

    marker = L.marker([lat, lng]).addTo(leafletMap);
  } else {
    leafletMap.setView([lat, lng], props.zoom);
    marker.setLatLng([lat, lng]);
  }

  setTimeout(() => leafletMap?.invalidateSize(), 80);
};

watch(coordinates, renderMap);
onMounted(renderMap);

onBeforeUnmount(() => {
  if (leafletMap) {
    leafletMap.remove();
    leafletMap = null;
    marker = null;
  }
});
</script>

<style scoped>
.location-map-card {
  width: 100%;
  overflow: hidden;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  background: #fff;
}

.map-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #F1F5F9;
}

.map-icon {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #EFF6FF;
  color: #0B4C6F;
  flex-shrink: 0;
}

.map-header strong {
  display: block;
  color: #0F172A;
  font-size: 0.92rem;
  line-height: 1.2;
}

.map-header small {
  display: block;
  color: #64748B;
  font-size: 0.76rem;
  margin-top: 2px;
}

.leaflet-map {
  width: 100%;
  min-height: 180px;
  background: #E2E8F0;
}

.map-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  color: #0B4C6F;
  font-size: 0.84rem;
  font-weight: 800;
  text-decoration: none;
}

.map-link:hover {
  text-decoration: underline;
}
</style>
