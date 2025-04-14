
var map = L.map('map');
map.setView([28.07571502097867, -82.60894808034853], 9);

L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
    minZoom: 2,
    maxZoom: 20,
    ext: 'png',
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// var Stadia_AlidadeSmoothDark = L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}', {
//     minZoom: 2,
//     maxZoom: 20,
//     ext: 'png'
// }).addTo(map)