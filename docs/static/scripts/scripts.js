
var map = L.map('map');
map.setView([28.07571502097867, -82.60894808034853], 9);

var Stadia_AlidadeSmoothDark = L.tileLayer(
	'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}',
	{
	minZoom: 4,
	maxZoom: 16,
	ext: 'png'
	}
).addTo(map);


fetch('locations.json')
  .then(response => response.json())
  .then(data => {
    data.forEach(location => {
      // If there's a price, include it in the marker
      const hasPrice = location.price !== undefined && location.price !== null;

      const customIcon = L.divIcon({
        className: 'price-marker',
        html: `
		${hasPrice ? `<div class="price-text">$${String(location.price).match(/^\d+\.\d{0,2}/)[0]}</div>` : ''}

          <img class="gas-image" src="https://www.7-eleven.com/assets/img/store/7E_Logo_App-Icon_RGB.svg" />
        `,
        iconSize: [40, 50],
        iconAnchor: [20, 50]
      });

      L.marker([location.latitude, location.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(location.address);
    });
  })
  .catch(error => console.error('Error loading locations:', error));
