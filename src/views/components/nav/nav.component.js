import { fetchJson } from "../../../controller";
import createEle from "../../../utils/createEle.util";
import renderSearch from './search/search.component';
import './nav.style.scss';

const renderNav = () => {
  const navItems = fetchJson();
  const nav = createEle(
    "nav",
    `
    `,
    document.body
  );
  createEle("h2", "Nearby Parks", nav);
  renderSearch(nav);
  const ul = createEle("ul", "", nav);
  navItems.features.map((item) => createEle("li", item.properties["Park Name"], ul));
  return nav;
};

export default renderNav;
