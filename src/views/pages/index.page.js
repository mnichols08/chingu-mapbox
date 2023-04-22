import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./index.styles.scss";
import geojson from "../../model/geo.json";

// function to create an element, set the innerHTML to content, and append it to a root element
const createEle = (ele, content, root, id, classList) => {
  let container = document.createElement(ele); // creates an element from the ele variable name
  container.innerHTML = content; // applies the innerHTML of the container to the content provided to function
  if (id) container.id = id;
  if (classList) container.classList = classList;
  if (ele == "header") root.prepend(container);
  // checks if we are rending a header element and prepends if so
  else root.append(container); // appends the container to the root container passed into function otherwise
  return container; // returns the value of the container that we created so functions can set the values later
};

const generateMap = (id, bounds, token) => {
  if (!id) console.error("Must input map id");
  if (!token) console.error("Must supply API Token!");
  let boundaries;
  if (bounds)
    boundaries = [
      [-79.48696767001076, 39.202068911240104], // Southwest coordinates
      [-79.08637004392415, 39.722221540464716], // Northeast coordinates
    ];
  mapboxgl.accessToken = token;
  const map = new mapboxgl.Map({
    container: id, // container ID
    style: "mapbox://styles/mnixdev/clgpq9kyh00ew01qtcuxzeypo", // style URL
    center: [-79.312, 39.505], // starting position [lng, lat]
    zoom: 1, // starting zoom
    maxBounds: boundaries,
    pitch: 0,
  });
  return map;
};

const addMapSource = (map, json, id) => {
  map.on("load", () => {
    map.addSource(`feature-${id}`, {
      type: "FeatureCollection",
      features: json,
    });
  });
  return `feature-${id}`;
};

const addMapLayer = (map, source, id, layout) => {
  map.on("load", () => {
    map.addLayer({
      id: `layer-${id}`,
      type: "symbol",
      source,
      layout,
    });
  });
  return `layer-${id}`;
};

const addMapMarker = (map, coords, id) => {
  const div = document.createElement("div");
  div.id = `marker-${id}`;
  div.onclick = () => flyToCoords(map, coords);
  return new mapboxgl.Marker(div).setLngLat(coords).addTo(map);
};

const flyToCoords = (map, coords) => map.flyTo({ center: coords, zoom: 15 });

function createPopUp(currentFeature, map) {
  const popUps = document.getElementsByClassName("mapboxgl-popup");
  if (popUps[0]) popUps[0].remove();
  const popup = new mapboxgl.Popup({ closeOnClick: false })
    .setLngLat(currentFeature.geometry.coordinates)
    .setHTML(
      `<h4>${currentFeature.properties["Park Name"]}</h4>
  <p><strong>Description: </strong>${currentFeature.properties.Description}</p>
  <p><strong>Activities: </strong>${currentFeature.properties.Activities}</p>
  `
    )
    .addTo(map);
}

const init = () => {
  const anchor = document.querySelector("main");
  createEle("div", "", anchor, "map");
  const map = generateMap("map", true, process.env.MAPBOX_API);
  return map;
};

const indexPage = () => {
 
};

export default indexPage;
