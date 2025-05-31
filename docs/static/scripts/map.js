async function fetchCoordinatesFromLog() {
  const response = await fetch('FuelFinder.log');
  const text = await response.text();

  // Go through lines in reverse order to find the latest coordinates
  const lines = text.trim().split('\n').reverse();

  for (const line of lines) {
    const match = line.match(/ZIP code:\s*(\d+), Latitude:\s*(-?\d+\.\d+), Longitude:\s*(-?\d+\.\d+)/);
    if (match) {
      const lat = parseFloat(match[2]);
      const lon = parseFloat(match[3]);
      return { lat, lon };
    }
  }

}

export const map = L.map('map');

fetchCoordinatesFromLog().then(({ lat, lon }) => {
  console.log(`Using coordinates from log: Latitude = ${lat}, Longitude = ${lon}`);
  map.setView([lat, lon], 9);
});

L.tileLayer(
  'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}',
  {
    minZoom: 4,
    maxZoom: 16,
    ext: 'png'
  }
).addTo(map);
