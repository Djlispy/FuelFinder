
var map = L.map('map');
map.setView([28.07571502097867, -82.60894808034853], 9);

var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 8,
	maxZoom: 10,
	ext: 'png'
}).addTo(map)

// Load the JSON file
fetch('locations.json')
	.then(response => response.json())
	.then(data => {
		data.forEach(location => {
			L.marker([location.latitude, location.longitude])
				.addTo(map)
				.bindPopup(location.address);
		});
	})
	.catch(error => console.error('Error loading locations:', error));