import mapboxgl from "mapbox-gl";
import "./popup.style.scss";

const renderPopups = (map) => {
  map.on("click", "parks", (e) => {
    // Copy coordinates array.
    const title = e.features[0].properties["Park Name"];
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.Description;
    const activities = e.features[0].properties.Activities;
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
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup().setLngLat(coordinates).setHTML(string).addTo(map);
  });

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

export default renderPopups;
