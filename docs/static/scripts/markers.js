// markers.js

import { map } from './map.js';
import { fetchLocations } from './data.js';
import { formatPrice } from './utils.js';

fetchLocations()
  .then(data => {
    const locationsWithPrice = data.filter(
      loc => loc.price !== undefined && loc.price !== null
    );

    let cheapest = null;
    if (locationsWithPrice.length > 0) {
      cheapest = locationsWithPrice.reduce((min, loc) => {
        return parseFloat(loc.price) < parseFloat(min.price) ? loc : min;
      });

      const priceFormatted = parseFloat(cheapest.price).toFixed(3);
      const stationInfoDiv = document.getElementById('cheapest-station-info');
      if (stationInfoDiv) {
        stationInfoDiv.innerHTML = `
          <strong>Cheapest Station</strong><br>
          Address: ${cheapest.address}<br>
          Coordinates: ${cheapest.latitude.toFixed(6)}, ${cheapest.longitude.toFixed(6)}<br>
          Price: <strong>$${priceFormatted}</strong>`;
      }
    }

    data.forEach(location => {
      const hasPrice = location.price !== undefined && location.price !== null;
      const isCheapest =
        cheapest && parseFloat(location.price).toFixed(3) === parseFloat(cheapest.price).toFixed(3);

      const strokeStyle = isCheapest ? 'stroke="green" stroke-width="3"' : '';

      const customIcon = L.divIcon({
        className: 'price-marker',
        html: `
        ${hasPrice ? `
        <div class="price-label">
            <img src="https://www.7-eleven.com/assets/img/store-locator/fuel.svg"
            alt="Fuel" width="10" height="10" />
            $${parseFloat(location.price).toFixed(3)}
        </div>` : ''}
        <svg width="40" height="40" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="white" ${strokeStyle} />
            <image href="https://www.7-eleven.com/assets/img/store/7E_Logo_App-Icon_RGB.svg" x="4" y="4" width="32" height="32" />
        </svg>`,
        
        iconSize: [40, 50],
        iconAnchor: [20, 50]
      });

      const popupContent = `
        <strong>${location.address}</strong><br>
        Regular: ${formatPrice(location.regular_price)}<br>
        Mid-Grade: ${formatPrice(location.mid_grade_price)}<br>
        Premium: ${formatPrice(location.premium_price)}<br>
        Diesel: ${formatPrice(location.diesel_price)}
      `;

      L.marker([location.latitude, location.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });
  })
  .catch(error => console.error('Error loading locations:', error));
