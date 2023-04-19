import mapboxgl from "mapbox-gl";
import init from "./views/init";
import geojson from "./model/geo.json" assert { type: "json" };

export const generateMap = (id, bounds) => {
  let boundaries;
  if (bounds)
    boundaries = [
      [-79.48696767001076, 39.202068911240104], // Southwest coordinates
      [-79.08637004392415, 39.722221540464716], // Northeast coordinates
    ];
  mapboxgl.accessToken =
    "pk.eyJ1IjoibW5pY2hvbHMwOCIsImEiOiJjanptM2Z4YWkwNWZzM2JtdGxzemxmOG1wIn0.NpyABUQBYrXLFQE5_0VLuQ";
  const map = new mapboxgl.Map({
    container: id, // container ID
    style: "mapbox://styles/mapbox/outdoors-v12", // style URL
    center: [-79.312, 39.505], // starting position [lng, lat]
    zoom: 12, // starting zoom
    maxBounds: boundaries,
  });
  map.on("load", () => {
    // Add an image to use as a custom marker
    map.loadImage(
      "https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png",
      (error, image) => {
        if (error) throw error;
        map.addImage("custom-marker", image);
        // Add a GeoJSON source with all points from the geojson file
        map.addSource("points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: geojson.features,
          },
        });

        // Add a symbol layer
        map.addLayer({
          id: "points",
          type: "symbol",
          source: "points",
          layout: {
            "icon-image": "custom-marker",
            // get the title name from the source's "Park Name" property
            "text-field": ["get", "Park Name"],
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 1.25],
            "text-anchor": "top",
          },
        });
      }
    );
  });
  map.on("click", "points", (e) => {
    // Copy coordinates array.
    const title = e.features[0].properties["Park Name"];
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.Description;
    const activities = e.features[0].properties.Activities;
    const string = `<div class="mapbox__feature--popup"><div><h3><center>${title}</center></h3></div><div><strong>Description: </strong>${description}</div><div><strong>Popular activites include:</strong> ${activities}</div></div>`;
    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup().setLngLat(coordinates).setHTML(string).addTo(map);
  });

  // Change the cursor to a pointer when the mouse is over the places layer.
  map.on("mouseenter", "points", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  // Change it back to a pointer when it leaves.
  map.on("mouseleave", "points", () => {
    map.getCanvas().style.cursor = "";
  });

  return map;
};
const controller = () => {
  return {
    generateMap,
  };
};

export default controller;

document.body.onload = init;
