import createEle from "../../../../utils/createEle.util";
import { fetchJson } from "../../../../controller";
import { openPopup } from "../../../../utils/mapbox.util";
import renderLocations from "../locations/renderLocations.component";
import "./search.style.scss";
import renderParks from "../../map/parks/park.component";

const renderSearch = (anchor, map) => {
  const geojson = fetchJson();
  const input = createEle("input", ``, anchor);
  const ul = createEle("ul", "", anchor);
  input.placeholder = "search";
  input.onkeyup = (e) => {
    const search = e.target.value.trim().toLowerCase();
    const parks = geojson.filter((featProps) => {
      const keys = Object.keys(featProps.properties);
      const props = keys.map((key) => featProps.properties[key]);
      return props.toString().toLowerCase().includes(search);
    });
    renderLocations(ul,map,search)
    renderParks(map).filter(parks)
    ;
  };
  renderLocations(ul, map);
  return input;
};

export default renderSearch;
