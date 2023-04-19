import { fetchJson } from "../../../controller";
import createEle from "../../../utils/createEle.util";
const renderNav = () => {
  const navItems = fetchJson();
  console.log(navItems);
  const nav = createEle(
    "nav",
    `
    `,
    document.body,
    "",
    "side-bar"
  );
  createEle("h2", "Nearby Parks", nav);
  const ul = createEle("ul", "", nav);
  navItems.features.map((item) => createEle("li", item.properties["Park Name"], ul));
  return nav;
};

export default renderNav;
