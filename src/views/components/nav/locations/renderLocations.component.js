import { flyToStore, openPopup } from "../../../../utils/mapbox.util";
import { fetchJson } from "../../../../controller";
import createEle from "../../../../utils/createEle.util";

const renderLocations = (map, anchor) => {
  const data = fetchJson();
  data.features.forEach((park, i) => (park.properties.id = i));
  const parks = data.features;
  for (const park of parks) {
    const location = createEle(
      "div",
      "",
      anchor,
      `listing-${park.properties.id}`,
      "item"
    );
    const link = createEle(
      "a",
      `${park.properties["Park Name"]}`,
      location,
      `link-${park.properties.id}`,
      "title"
    );
    link.href = "#";
    link.onclick = function () {
      for (const feature of parks) {
        if (this.id === `link-${feature.properties.id}`) {
          flyToStore(feature, map);
          openPopup(feature, map)
        }
      }
    };
  }
};

export default renderLocations;
