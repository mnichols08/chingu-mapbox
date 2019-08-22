import * as mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoibW5pY2hvbHMwOCIsImEiOiJjanptM2Z4YWkwNWZzM2JtdGxzemxmOG1wIn0.NpyABUQBYrXLFQE5_0VLuQ';

const bounds = [
    [-79.48696767001076, 39.202068911240104], // Southwest coordinates
    [-79.08637004392415, 39.722221540464716]  // Northeast coordinates
    ];

const map = new mapboxgl.Map({
container: 'map', // container id
style: 'mapbox://styles/mapbox/outdoors-v11', // stylesheet location
center: [-79.312, 39.505], // starting position [lng, lat]
zoom: 12, // starting zoom
maxBounds: bounds
});
 
const geojson = require('./geofeatures/geo.json')


  // add markers to map
geojson.features.forEach(function(marker) {

    // create a HTML element for each feature
    const el = document.createElement('div');
    el.className = 'marker';
  
    // make a marker for each feature and add to the map
    new mapboxgl.Marker(el)
      .setLngLat(marker.geometry.coordinates)
      .addTo(map);

      new mapboxgl.Marker(el)
      .setLngLat(marker.geometry.coordinates)
      .setPopup(new mapboxgl.Popup({ offset: 25 }) // add popups
        .setHTML('<h3>' + marker.properties['Park Name'] + '</h3><p>' + marker.properties.Description + '</p> <p> <strong> Activities: </strong>' + marker.properties.Activities + '</p>' ))
      .addTo(map);
  });



