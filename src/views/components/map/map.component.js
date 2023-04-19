import { generateMap } from "../../../controller";
import { anchor } from "../../../utils/clear.util";
import createEle from "../../../utils/createEle.util";
import renderParks from './parks/park.component';
import renderPopups from './popup/popup.component';
import "mapbox-gl/dist/mapbox-gl.css";
import "./map.style.scss";

const renderMap = (id) => {
  createEle("div", "", anchor, id);
  const map = generateMap(id, true);
  renderParks(map);
  renderPopups(map);
  return map;
};

export default renderMap;
