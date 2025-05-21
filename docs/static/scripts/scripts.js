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
    const locationsWithPrice = data.filter(loc => loc.price !== undefined && loc.price !== null);

    let cheapest = null;
    if (locationsWithPrice.length > 0) {
      cheapest = locationsWithPrice.reduce((min, loc) => {
        return parseFloat(loc.price) < parseFloat(min.price) ? loc : min;
      });

      const priceFormatted = String(cheapest.price).match(/^\d+\.\d{0,2}/)[0];
      console.log(`Cheapest Station: ${cheapest.address} - Price: $${priceFormatted}`);
	  if (cheapest) {
		const priceFormatted = String(cheapest.price).match(/^\d+\.\d{0,2}/)[0];
		const stationInfoDiv = document.getElementById('cheapest-station-info');

		stationInfoDiv.innerHTML = `
			<strong>Cheapest Station</strong><br>
			Address: ${cheapest.address}<br>
			Coordinates: ${cheapest.latitude.toFixed(6)}, ${cheapest.longitude.toFixed(6)}<br>
			Price: <strong>$${priceFormatted}</strong>`;
		}

    }

    data.forEach(location => {
      const hasPrice = location.price !== undefined && location.price !== null;
      const isCheapest = cheapest && location.address === cheapest.address;

      const strokeStyle = isCheapest ? 'stroke="green" stroke-width="3"' : '';

      const customIcon = L.divIcon({
        className: 'price-marker',
        html: `
		${hasPrice ? `
		<div style="
			display: flex; 
			align-items: center; 
			justify-content: center; 
			gap: 4px;
			background: white; 
			color: black; 
			padding: 1px 3px; 
			border-radius: 4px; 
			font-size: 10px; 
			width: fit-content;
			margin: 0 auto;">
			<img src="https://www.7-eleven.com/assets/img/store-locator/fuel.svg" 
				alt="Fuel" width="10" height="10" display: inline-block;" />
		$${String(location.price).match(/^\d+\.\d{0,2}/)[0]}
		</div>` : ''}
		<svg width="40" height="40" viewBox="0 0 40 40">
			<circle cx="20" cy="20" r="16" fill="white" ${strokeStyle} />
			<image href="https://www.7-eleven.com/assets/img/store/7E_Logo_App-Icon_RGB.svg" x="4" y="4" width="32" height="32" />
		</svg>`,
        iconSize: [40, 50],
        iconAnchor: [20, 50]
      });

      L.marker([location.latitude, location.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(location.address);
    });
  })
  .catch(error => console.error('Error loading locations:', error));
