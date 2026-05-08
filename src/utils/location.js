export function getCurrentBrowserLocation() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Tu navegador no soporta geolocalizacion.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latitude = Number(coords.latitude).toFixed(6);
        const longitude = Number(coords.longitude).toFixed(6);
        const accuracy = Math.round(coords.accuracy || 0);
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        resolve({
          latitude,
          longitude,
          accuracy,
          mapsUrl,
          label: `Ubicacion actual: ${latitude}, ${longitude}`,
          message: `Mi ubicacion actual: ${mapsUrl}`
        });
      },
      () => reject(new Error('No se pudo obtener la ubicacion. Revisa los permisos del navegador.')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}
