import mapboxgl from "mapbox-gl";
import "./styles/index.scss";
import "mapbox-gl/dist/mapbox-gl.css";
const main = document.querySelector("main");
const mapBox = document.createElement("div");
mapBox.id = "map";
main.append(mapBox);

mapboxgl.accessToken =
  "pk.eyJ1IjoibW5pY2hvbHMwOCIsImEiOiJjanptM2Z4YWkwNWZzM2JtdGxzemxmOG1wIn0.NpyABUQBYrXLFQE5_0VLuQ";

const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/mapbox/streets-v12", // style URL
  center: [-74.5, 40], // starting position [lng, lat]
  zoom: 9, // starting zoom
});
