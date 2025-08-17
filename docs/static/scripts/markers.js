// markers.js

import { map } from './map.js';
import { fetchLocations } from './data.js';
import { formatPrice } from './utils.js';

const fuelTypes = [
	{ key: 'regular_price', id: 'cheapest-regular', label: 'Regular' },
	{ key: 'mid_grade_price', id: 'cheapest-midgrade', label: 'Mid-Grade' },
	{ key: 'premium_price', id: 'cheapest-premium', label: 'Premium' },
	{ key: 'diesel_price', id: 'cheapest-diesel', label: 'Diesel' }
];

let allLocations = [];

fetchLocations()
	.then(data => {
		allLocations = data;

		const cheapestStations = {};

		fuelTypes.forEach(({ key, id, label }) => {
		const validStations = data.filter(loc => loc[key] !== null && loc[key] !== undefined);

		if (validStations.length > 0) {
			const cheapest = validStations.reduce((min, loc) => {
			const currentPrefix = String(loc[key]).slice(0, 4);
			const minPrefix = String(min[key]).slice(0, 4);

			if (currentPrefix < minPrefix) return loc;
			if (currentPrefix > minPrefix) return min;

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

    renderMarkers('regular_price', data, cheapestStations); // default on load
	})
  .catch(error => console.error('Error loading locations:', error));

function renderMarkers(selectedFuelKey, data, cheapestStations) {
	
	// Clear existing markers
	map.eachLayer(layer => {
		if (layer instanceof L.Marker) {
			map.removeLayer(layer);
    }
  });

	data.forEach(location => {
		if (!location[selectedFuelKey]) return;

    const isCheapest = (() => {
      const cheapest = cheapestStations[selectedFuelKey];
      return (
        cheapest &&
        location.latitude === cheapest.latitude &&
        location.longitude === cheapest.longitude
      );
    })();

    const strokeStyle = isCheapest ? 'stroke="green" stroke-width="3"' : '';

    const price = location[selectedFuelKey];

    const customIcon = L.divIcon({
      className: 'price-marker',
      html: `
        <div class="price-label">
          <img src="https://www.7-eleven.com/assets/img/store-locator/fuel.svg"
            alt="Fuel" width="10" height="10" />
          $${parseFloat(price).toFixed(3)}
        </div>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="white" ${strokeStyle} />
          <image href="https://www.7-eleven.com/assets/img/store/7E_Logo_App-Icon_RGB.svg" x="4" y="4" width="32" height="32" />
        </svg>`,
      iconSize: [40, 50],
      iconAnchor: [20, 50]
    });

    const popupContent = `
      <strong>${location.address}</strong><br>
      Coordinates: ${location.latitude}, ${location.longitude}<br>
      Regular: ${formatPrice(location.regular_price)}<br>
      Mid-Grade: ${formatPrice(location.mid_grade_price)}<br>
      Premium: ${formatPrice(location.premium_price)}<br>
      Diesel: ${formatPrice(location.diesel_price)}
    `;

    L.marker([location.latitude, location.longitude], { icon: customIcon })
      .addTo(map)
      .bindPopup(popupContent);
	});
}

function updateMarkersByFuelType(fuelKey) {
  console.log("Selected fuel type:", fuelKey);

  fetchLocations()
    .then(data => {
      const cheapestStations = {};

      fuelTypes.forEach(({ key }) => {
        const validStations = data.filter(loc => loc[key] !== null && loc[key] !== undefined);
        if (validStations.length > 0) {
          const cheapest = validStations.reduce((min, loc) => {
            const currentPrefix = String(loc[key]).slice(0, 4);
            const minPrefix = String(min[key]).slice(0, 4);
            if (currentPrefix < minPrefix) return loc;
            if (currentPrefix > minPrefix) return min;
            return parseFloat(loc[key]) < parseFloat(min[key]) ? loc : min;
          });
          cheapestStations[key] = cheapest;
        }
      });

      renderMarkers(fuelKey, data, cheapestStations);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  // Get both mobile and desktop button sets
  const mobileButtons = document.querySelectorAll('#fuel-selector button');
  const desktopButtons = document.querySelectorAll('#desktop-fuel-selector button');
  
  // Function to handle button clicks
  const handleButtonClick = (button, buttonSet) => {
    // Get the other set of buttons (mobile or desktop)
    const otherButtonSet = buttonSet === mobileButtons ? desktopButtons : mobileButtons;
    
    // Toggle selected button appearance in current set
    buttonSet.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    
    // Find and select the corresponding button in the other set
    const fuelKey = button.getAttribute('data-fuel');
    const correspondingButton = Array.from(otherButtonSet).find(
      btn => btn.getAttribute('data-fuel') === fuelKey
    );
    
    if (correspondingButton) {
      otherButtonSet.forEach(btn => btn.classList.remove('selected'));
      correspondingButton.classList.add('selected');
    }
    
    // Update the markers
    updateMarkersByFuelType(fuelKey);
  };
  
  // Add click event listeners to mobile buttons
  mobileButtons.forEach(button => {
    button.addEventListener('click', () => {
      handleButtonClick(button, mobileButtons);
    });
  });
  
  // Add click event listeners to desktop buttons
	desktopButtons.forEach(button => {
		button.addEventListener('click', () => {
			handleButtonClick(button, desktopButtons);
    });
  });
  
  // Set default selected button on both mobile and desktop
	if (mobileButtons.length > 0) {
		mobileButtons[0].classList.add('selected');
  }
  
	if (desktopButtons.length > 0) {
		desktopButtons[0].classList.add('selected');
  }
});
