import { generateMap } from "../../controller";
import { anchor } from "../../utils/clear.util";
import createEle from "../../utils/createEle.util";
import './map.style.scss';

const renderMap = (id) => {
  createEle("div", "", anchor, id);
  return generateMap(id, true);
};

export default renderMap;
