import mapboxgl from "mapbox-gl";
export const generateMap = (id) => {
  mapboxgl.accessToken =
    "pk.eyJ1IjoibW5pY2hvbHMwOCIsImEiOiJjanptM2Z4YWkwNWZzM2JtdGxzemxmOG1wIn0.NpyABUQBYrXLFQE5_0VLuQ";
  const map = new mapboxgl.Map({
    container: id, // container ID
    style: "mapbox://styles/mapbox/streets-v12", // style URL
    center: [-74.5, 40], // starting position [lng, lat]
    zoom: 9, // starting zoom
  });
  return map;
};
const controller = () => {
  return {
    generateMap,
  };
};

export default controller;
