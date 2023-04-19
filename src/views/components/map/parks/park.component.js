import { fetchJson } from "../../../../controller";

const renderParks = (map) => {
  const geojson = fetchJson();
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
          id: "parks",
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
  return map;
};

export default renderParks;
