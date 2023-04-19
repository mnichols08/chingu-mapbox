import createEle from "../../../../utils/createEle.util";
import renderLocations from "../locations/renderLocations.component";
import "./search.style.scss";

const renderSearch = (anchor, map) => {
  const input = createEle("input", ``, anchor);
  const ul = createEle("ul", "", anchor);
  input.placeholder = "search";
  input.onkeyup = (e) => renderLocations(ul, map, e.target.value);
  renderLocations(ul, map)
  
  return input;
};

export default renderSearch;
