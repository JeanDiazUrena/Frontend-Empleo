<template>
  <div v-if="hasLocation" class="location-map-container" :class="{ compact }">
    <div class="map-card">
      <div class="map-header">
        <i class="fa-solid fa-location-dot"></i>
        <span>{{ title }}</span>
      </div>

      <div class="map-preview" :style="{ height: iframeHeight }">
        <iframe
          :src="embedUrl"
          title="Mapa de ubicacion"
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      <div class="map-footer">
        <span class="map-summary">{{ displaySummary }}</span>
        <a :href="mapsUrl" target="_blank" rel="noopener noreferrer" class="btn-open-maps">
          <i class="fa-solid fa-up-right-from-square"></i>
          Abrir mapa
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  locationText: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'Ubicacion compartida'
  },
  height: {
    type: [Number, String],
    default: 180
  },
  compact: {
    type: Boolean,
    default: false
  }
});

const rawLocation = computed(() => String(props.locationText || '').trim());
const hasLocation = computed(() => rawLocation.value.length > 0);

const coordinates = computed(() => {
  const match = rawLocation.value.match(/(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;

  return {
    lat: match[1],
    lng: match[2]
  };
});

const mapQuery = computed(() => {
  if (coordinates.value) return `${coordinates.value.lat},${coordinates.value.lng}`;
  return rawLocation.value;
});

const displaySummary = computed(() => {
  if (coordinates.value) return 'Punto compartido por el cliente';

  return rawLocation.value
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
});

const encodedQuery = computed(() => encodeURIComponent(mapQuery.value));
const embedUrl = computed(() => `https://maps.google.com/maps?q=${encodedQuery.value}&z=15&output=embed`);
const mapsUrl = computed(() => `https://www.google.com/maps/search/?api=1&query=${encodedQuery.value}`);
const iframeHeight = computed(() => (typeof props.height === 'number' ? `${props.height}px` : props.height));
</script>

<style scoped>
.location-map-container {
  width: 100%;
}

.map-card {
  background: #fff;
  border: 1px solid #dbe4ef;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
}

.map-header {
  padding: 10px 12px;
  background: #f8fafc;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.map-header i {
  color: #f97316;
}

.map-preview {
  min-height: 140px;
  background: #e2e8f0;
}

.map-preview iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.map-footer {
  padding: 10px 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.map-summary {
  min-width: 0;
  color: #475569;
  font-size: 0.82rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-open-maps {
  flex-shrink: 0;
  color: #0b4c6f;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-open-maps:hover {
  text-decoration: underline;
}

.compact .map-card {
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.compact .map-header,
.compact .map-footer {
  padding: 8px 10px;
}

@media (max-width: 520px) {
  .map-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .map-summary {
    white-space: normal;
  }
}
</style>
