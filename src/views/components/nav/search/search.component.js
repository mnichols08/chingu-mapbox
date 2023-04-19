import createEle from "../../../../utils/createEle.util";
import "./search.style.scss";

const renderSearch = (anchor) => {
  const input = createEle("input", ``, anchor);
  input.placeholder = "search";
  return input;
};

export default renderSearch;
