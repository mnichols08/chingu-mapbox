import { fetchJson } from "../../../../controller";
import { addMarker } from "../../../../utils/mapbox.util";
import './park.style.scss';

const renderParks = (map) => {
  const geojson = fetchJson();
  return {
    filter: (search) => search.forEach(feat => {
      document.querySelectorAll('.marker').forEach(marker => marker.remove())
      addMarker(map, feat)
    }),
    parks: () => {
      map.on("load", () => {
        geojson.forEach(feat => addMarker(map,feat))
      }) 
    }
  };
};

export default renderParks;
