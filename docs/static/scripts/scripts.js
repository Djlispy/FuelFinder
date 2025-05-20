
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

// Example price — this could be made dynamic per location if needed
var gasPrice = "$3.22";

// Load the JSON file
fetch('locations.json')
	.then(response => response.json())
	.then(data => {
	data.forEach(location => {
		// Create a custom DivIcon for each marker
		var customIcon = L.divIcon({
		className: 'price-marker',
		html: `
			<div class="price-text">${gasPrice}</div>
			<img class="gas-image" src="https://www.7-eleven.com/assets/img/store/7E_Logo_App-Icon_RGB.svg" />
		`,
		iconSize: [40, 50],
		iconAnchor: [20, 50]
		});

		// Use the custom icon in the marker
		L.marker([location.latitude, location.longitude], { icon: customIcon })
		.addTo(map)
		.bindPopup(location.address);
	});
	})
	.catch(error => console.error('Error loading locations:', error));