import * as mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoibW5pY2hvbHMwOCIsImEiOiJjanptM2Z4YWkwNWZzM2JtdGxzemxmOG1wIn0.NpyABUQBYrXLFQE5_0VLuQ';

const bounds = [
    [-79.48696767001076, 39.202068911240104], // Southwest coordinates
    [-79.08637004392415, 39.722221540464716]  // Northeast coordinates
    ];

const map = new mapboxgl.Map({
container: 'map', // container id
style: 'mapbox://styles/mapbox/streets-v11', // stylesheet location
center: [-79.312, 39.505], // starting position [lng, lat]
zoom: 12, // starting zoom
maxBounds: bounds
});

const layerList = document.getElementById('menu');
const inputs = layerList.getElementsByTagName('input');
 
function switchLayer(layer) {
var layerId = layer.target.id;
map.setStyle('mapbox://styles/mapbox/' + layerId);
}
 
for (var i = 0; i < inputs.length; i++) {
inputs[i].onclick = switchLayer;
}