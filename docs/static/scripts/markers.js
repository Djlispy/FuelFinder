// markers.js

import { map } from './map.js';
import { fetchLocations } from './data.js';
import { formatPrice } from './utils.js';

fetchLocations()
  .then(data => {
  const fuelTypes = [
    { key: 'regular_price', id: 'cheapest-regular', label: 'Regular' },
    { key: 'mid_grade_price', id: 'cheapest-midgrade', label: 'Mid-Grade' },
    { key: 'premium_price', id: 'cheapest-premium', label: 'Premium' },
    { key: 'diesel_price', id: 'cheapest-diesel', label: 'Diesel' }
  ];
  
    const cheapestStations = {};

fuelTypes.forEach(({ key, id, label }) => {
  const validStations = data.filter(loc => loc[key] !== null && loc[key] !== undefined);

  if (validStations.length > 0) {
    const cheapest = validStations.reduce((min, loc) => {
    const currentPrefix = String(loc[key]).slice(0, 4);
    const minPrefix = String(min[key]).slice(0, 4);

    if (currentPrefix < minPrefix) return loc;
    if (currentPrefix > minPrefix) return min;

    // Tie-breaker: fallback to actual float comparison
    return parseFloat(loc[key]) < parseFloat(min[key]) ? loc : min;

    });


    cheapestStations[key] = cheapest;

    const priceFormatted = parseFloat(cheapest[key]).toFixed(3);
    const infoDiv = document.getElementById(id);
    if (infoDiv) {
      infoDiv.innerHTML = `
        <strong>Cheapest ${label}</strong><br>
        Address: ${cheapest.address}<br>
        Coordinates: ${cheapest.latitude.toFixed(6)}, ${cheapest.longitude.toFixed(6)}<br>
        Price: <strong>$${priceFormatted}</strong>`;
    }
  }
});


    // Add markers to map
    data.forEach(location => {
      const hasAnyPrice = fuelTypes.some(fuel => location[fuel] !== null && location[fuel] !== undefined);

    let displayedFuelKey = null;
    for (const fuel of fuelTypes) {
      if (location[fuel.key] !== null && location[fuel.key] !== undefined) {
        displayedFuelKey = fuel.key;
        break;
      }
    }

    const isCheapest = (() => {
      if (!displayedFuelKey) return false;

      const cheapest = cheapestStations[displayedFuelKey];
      return (
        cheapest &&
        location.latitude === cheapest.latitude &&
        location.longitude === cheapest.longitude
      );
    })();

      const strokeStyle = isCheapest ? 'stroke="green" stroke-width="3"' : '';

      const price = location.regular_price ?? location.mid_grade_price ?? location.premium_price ?? location.diesel_price;

      const customIcon = L.divIcon({
        className: 'price-marker',
        html: `
          ${price !== undefined && price !== null ? `
          <div class="price-label">
            <img src="https://www.7-eleven.com/assets/img/store-locator/fuel.svg"
              alt="Fuel" width="10" height="10" />
            $${parseFloat(price).toFixed(3)}
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
