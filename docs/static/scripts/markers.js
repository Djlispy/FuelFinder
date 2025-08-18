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


// Convert price to a number rounded to 3 decimals
function priceNumber(value) {
  return Number(parseFloat(value).toFixed(3));
}


// Build cheapestStations object for all fuel types.
function buildCheapestStations(data) {
  const cheapestStations = {};

  fuelTypes.forEach(({ key, id, label }) => {
    const validStations = data.filter(loc => loc[key] !== null && loc[key] !== undefined);

    if (validStations.length > 0) {
      // Sort by numeric price (lowest first)
      const sorted = [...validStations].sort((a, b) => priceNumber(a[key]) - priceNumber(b[key]));

      // First cheapest group
      const lowestPrice = priceNumber(sorted[0][key]);
      const firstCheapest = sorted.filter(loc => priceNumber(loc[key]) === lowestPrice);

      // Second cheapest group (if exists)
      let secondCheapest = [];
      const nextIndex = sorted.findIndex(loc => priceNumber(loc[key]) > lowestPrice);
      if (nextIndex !== -1) {
        const secondPrice = priceNumber(sorted[nextIndex][key]);
        secondCheapest = sorted.filter(loc => priceNumber(loc[key]) === secondPrice);
      }

      cheapestStations[key] = {
        first: firstCheapest,
        second: secondCheapest
      };

      // Optionally update info panel (shows the first cheapest only)
      const infoDiv = document.getElementById(id);
      if (infoDiv && firstCheapest.length > 0) {
        infoDiv.innerHTML = `
          <strong>Cheapest ${label}</strong><br>
          Address: ${firstCheapest[0].address}<br>
          Coordinates: ${firstCheapest[0].latitude.toFixed(6)}, ${firstCheapest[0].longitude.toFixed(6)}<br>
          Price: <strong>$${lowestPrice.toFixed(3)}</strong>`;
      }
    }
  });

  return cheapestStations;
}

fetchLocations()
  .then(data => {
    allLocations = data;

    // Build cheapestStations (with first and second groups)
    const cheapestStations = buildCheapestStations(data);

    // Render markers for default fuel type (regular) on initial load
    renderMarkers('regular_price', data, cheapestStations);
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
    if (location[selectedFuelKey] === null || location[selectedFuelKey] === undefined) return;

    const groups = cheapestStations[selectedFuelKey] || { first: [], second: [] };
    const { first = [], second = [] } = groups;

    const isFirst = first.some(s => s.latitude === location.latitude && s.longitude === location.longitude);
    const isSecond = !isFirst && second.some(s => s.latitude === location.latitude && s.longitude === location.longitude);

    // Green for first, amber/orange for second, otherwise no stroke
    let strokeStyle = '';
    if (isFirst) strokeStyle = 'stroke="#27AE60" stroke-width="3"';      // nice green
    else if (isSecond) strokeStyle = 'stroke="#FFC107" stroke-width="3"'; // amber/orange

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
          <image href="https://www.7-eleven.com/assets/img/store/7E_Logo_App-Icon_RGB.svg"
                 x="4" y="4" width="32" height="32" />
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

  // Use the already-fetched allLocations if present to avoid extra network call
  const dataPromise = allLocations && allLocations.length ? Promise.resolve(allLocations) : fetchLocations();

  dataPromise
    .then(data => {
      // Rebuild cheapestStations using same logic (first + second groups)
      const cheapestStations = buildCheapestStations(data);

      renderMarkers(fuelKey, data, cheapestStations);
    })
    .catch(err => console.error("Error updating markers:", err));
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
