import mapboxgl from "mapbox-gl";

export const parks = [];

export const addMarker = (map, feature) => {
  const props = feature.properties;
  if (!map.getSource(`feature-${props.id}`)) {
    map.addSource(`feature-${props.id}`, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [feature],
      },
    });
  }

  // Add a symbol layer
  if (!map.getLayer(`park-${props.id}`)) {
    map.addLayer({
      id: `park-${props.id}`,
      type: "symbol",
      source: `feature-${props.id}`,
      layout: {
        "text-field": ["get", "Park Name"],
        "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
        "text-offset": [0, 1.25],
        "text-anchor": "top",
      },
    });
    const div = document.createElement("div");
    div.className = "marker";
    div.id = `marker-${props.id}`;
    div.onclick = () => {
      flyToStore(feature, map);
      const popup = document.querySelectorAll(".mapboxgl-popup");
      if (popup.length) popup[0].remove();
      new mapboxgl.Popup().setLngLat(coordinates).setHTML(`string`).addTo(map);
    };
    parks.push(`park-${props.id}`);
    return new mapboxgl.Marker(div)
      .setLngLat(feature.geometry.coordinates)
      .addTo(map);
  }
};

export const flyToStore = (currentFeature, map) =>
  map.flyTo({
    center: currentFeature.geometry.coordinates,
    zoom: 15,
  });
export const openPopup = (currentFeature, map, e) => {
  const title = currentFeature.properties["Park Name"];
  const coordinates = currentFeature.geometry.coordinates.slice();
  const description = currentFeature.properties.Description;
  const activities = currentFeature.properties.Activities;
  const string = `
    <h3>
      <center>${title}</center>
    </h3>
    </div>
    <div>
      <strong>Description: </strong>${description}
    </div>
    <div>
      <strong>Popular activites include:</strong> ${activities}
    </div>
    `;
  // Ensure that if the map is zoomed out such that multiple
  // copies of the feature are visible, the popup appears
  // over the copy being pointed to.
  if (e)
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
  const popup = document.querySelectorAll(".mapboxgl-popup");
  if (popup.length) popup[0].remove();
  const ele = document.createElement("div");

  new mapboxgl.Popup().setLngLat(coordinates).setHTML(string).addTo(map);

  // Change the cursor to a pointer when the mouse is over the places layer.
  map.on("mouseenter", "parks", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  // Change it back to a pointer when it leaves.
  map.on("mouseleave", "parks", () => {
    map.getCanvas().style.cursor = "";
  });
  return map;
};
