import { generateMap } from "../../controller";
import { anchor } from "../../utils/clear.util";
import createEle from "../../utils/createEle.util";

const renderMap = (id) => {
  createEle("div", "", anchor, id);
  return generateMap(id);
};

export default renderMap;
