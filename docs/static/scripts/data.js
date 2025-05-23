// data.js

export async function fetchLocations() {
  const response = await fetch('locations.json');
  const data = await response.json();

  // Normalize fields
  data.forEach(loc => {
    loc.price = loc.regular_price;
    loc.address = `${loc.address}, ${loc.city}, ${loc.state} ${loc.postal_code}`;
    loc.latitude = loc.lat;
    loc.longitude = loc.lon;
  });

  return data;
}
