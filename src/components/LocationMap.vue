<template>
  <div v-if="coordinates" class="location-map-container mt-2">
    <div class="map-card">
      <div class="map-header">
        <i class="fas fa-map-marker-alt text-red-500"></i>
        <span>Ubicación Compartida</span>
      </div>
      
      <!-- Google Maps Embed Iframe -->
      <div class="map-preview">
        <iframe
          width="100%"
          height="150"
          frameborder="0"
          style="border:0; border-radius: 8px;"
          :src="`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=15&output=embed`"
          allowfullscreen
        ></iframe>
      </div>
      
      <div class="map-footer">
        <a 
          :href="`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`" 
          target="_blank"
          class="btn-open-maps"
        >
          <i class="fas fa-external-link-alt mr-2"></i>
          Abrir en Google Maps
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
    required: true
  }
});

const coordinates = computed(() => {
  // Regex para extraer latitud y longitud de formatos como:
  // "19.426294, -70.675551" o el formato con el link incluido
  const regex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
  const match = props.locationText.match(regex);
  
  if (match) {
    return {
      lat: match[1],
      lng: match[2]
    };
  }
  return null;
});
</script>

<style scoped>
.location-map-container {
  max-width: 300px;
  width: 100%;
}

.map-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s ease;
}

.map-card:hover {
  transform: translateY(-2px);
}

.map-header {
  padding: 8px 12px;
  background: #f9fafb;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #f3f4f6;
}

.map-preview {
  padding: 8px;
  background: #fff;
}

.map-footer {
  padding: 8px;
  background: #f9fafb;
  text-align: center;
}

.btn-open-maps {
  font-size: 0.75rem;
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
}

.btn-open-maps:hover {
  text-decoration: underline;
}
</style>
