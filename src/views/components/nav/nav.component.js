import { fetchJson } from "../../../controller";
import createEle from "../../../utils/createEle.util";
import renderSearch from './search/search.component';
import renderLocations from './locations/renderLocations.component';
import './nav.style.scss';

const renderNav = (map) => {
  const features = fetchJson();
  const nav = createEle(
    "nav",
    `
    `,
    document.body
  );
  createEle("h2", "Nearby Parks", nav);
  renderSearch(nav);
  const ul = createEle("ul", "", nav);
  renderLocations(map, ul)
  return nav;
};

export default renderNav;
