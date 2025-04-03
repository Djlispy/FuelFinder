document.getElementById('search-button').addEventListener('click', function () {
    const zipCode = document.getElementById('zip-code').value;
    if (zipCode) {
        // Simulate a gas station search (since scraping via JS isn't feasible on the client-side)
        fetchGasPrices(zipCode);
    }
});

function fetchGasPrices(zipCode) {
    // Sample mock data (simulate gas stations with prices)
    const gasStations = [
        { location: 'Store A', price: '$3.45' },
        { location: 'Store B', price: '$3.39' },
        { location: 'Store C', price: '$3.50' },
        { location: 'Store D', price: '$3.25' },
        { location: 'Store E', price: '$3.40' }
    ];

    // Display the gas stations
    const resultsList = document.getElementById('gas-stations-list');
    resultsList.innerHTML = '';  // Clear previous results

    gasStations.forEach(station => {
        const li = document.createElement('li');
        li.textContent = `${station.location} - Price: ${station.price}`;
        resultsList.appendChild(li);
    });

    // Sort the gas stations by price (assuming the price is in the format "$X.XX")
    const sortedGasStations = sortByPrice(gasStations);

    // Display the cheapest station
    const cheapestStation = sortedGasStations[0];
    document.getElementById('cheapest-station').textContent = `${cheapestStation.location} - Price: ${cheapestStation.price}`;
}

function sortByPrice(stations) {
    return stations.sort((a, b) => {
        const priceA = parseFloat(a.price.replace('$', ''));
        const priceB = parseFloat(b.price.replace('$', ''));
        return priceA - priceB;  // Sort ascending by price
    });
}
