import mapboxgl from "mapbox-gl";
import { loadMapboxToken } from "./map-config";
import type { FeatureCollection } from "geojson";
import {
  places, activityOptions, filterPlaces, estimateMinutes, formatDistance, formatDuration,
  type Place, type Analysis, type SavedOuting, type TrailPoint,
} from "./domain";
import { readOutings, writeOuting, removeOuting } from "./storage";
import type { AnalysisResponse } from "./analysis.worker";
import "mapbox-gl/dist/mapbox-gl.css";
import "./app.css";

function get<T extends HTMLElement>(id: string, type: { new(): T }): T {
  const element = document.getElementById(id);
  if (!(element instanceof type)) throw new Error(`Missing interface element: ${id}`);
  return element;
}

function node<K extends keyof HTMLElementTagNameMap>(
  tag: K, text = "", className = "",
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.textContent = text;
  element.className = className;
  return element;
}

function button(text: string, action: () => void, className = "button"): HTMLButtonElement {
  const element = node("button", text, className);
  element.type = "button";
  element.onclick = action;
  return element;
}

get("app", HTMLElement).innerHTML = `
  <a class="skip-link" href="#workspace">Skip to explorer</a>
  <header class="topbar">
    <a class="brand" href="./"><span class="brand-icon" aria-hidden="true">G</span>
      <span>Garrett County<span class="brand-subtitle">ADVENTURES / MARYLAND</span></span>
    </a>
    <span class="header-caption">Less scrolling. More exploring.</span>
    <span id="connection" class="connection"></span>
  </header>
  <div class="workspace" id="workspace" tabindex="-1">
    <section class="map-region" aria-label="Adventure map">
      <div id="map" aria-busy="true"></div>
      <div class="map-caption"><strong>Your next adventure starts here.</strong><span>16 local places. One remarkable landscape.</span></div>
      <button id="reset-map" type="button" class="map-reset">Show all places</button>
      <p id="map-notice" class="map-notice" hidden></p>
    </section>
    <aside class="sidebar" aria-label="Adventure explorer">
      <nav class="tabs" aria-label="Explorer views">
        <button type="button" data-tab="explore" aria-pressed="true">Discover</button>
        <button type="button" data-tab="analyze" aria-pressed="false">Trail lab</button>
        <button type="button" data-tab="saved" aria-pressed="false">Saved <span id="saved-count">0</span></button>
      </nav>
      <div class="panel-scroll">
        <section id="explore-panel">
          <p class="eyebrow">THE GREAT OUTDOORS, CLOSE TO HOME</p>
          <h1>Find your kind<br>of adventure.</h1>
          <p class="intro">Waterfalls, quiet lakes, and mountain views. Pick a place and make a day of it.</p>
          <label class="field-label" for="search">Search places and activities</label>
          <input id="search" type="search" placeholder="Try waterfalls or camping" autocomplete="off">
          <label class="field-label" for="activity">What do you feel like doing?</label>
          <select id="activity"><option value="">All activities</option></select>
          <div class="results-heading"><p id="result-count" role="status"></p><button id="clear-filters" class="text-button" type="button">Reset filters</button></div>
          <section id="place-details" aria-label="Selected place" hidden></section>
          <ul id="place-list" class="place-list"></ul>
          <p id="empty-results" class="empty" hidden>No places match. Try a different activity or clear your search.</p>
          <p class="data-note">Curated project data, not live conditions. Verify access, opening hours, and trail suitability before heading out. Accessibility has not been verified.</p>
        </section>
        <section id="analyze-panel" hidden>
          <p class="eyebrow">POWERED BY RUST + WEBASSEMBLY</p>
          <h1>Know your trail.</h1>
          <p class="intro">Bring a GPX track. See the distance, climbs, and elevation profile before you go. Your file stays on this device.</p>
          <label class="upload" for="gpx-file"><strong>Import a GPX file</strong><span>Tracks or routes / up to 8 MiB and 100,000 points</span></label>
          <input id="gpx-file" type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml">
          <div class="analysis-controls"><p id="analysis-state" role="status">Ready when you are.</p><button id="cancel-analysis" class="text-button" type="button" hidden>Cancel</button></div>
          <div id="trail-results" hidden>
            <h2 id="trail-name"></h2>
            <div id="trail-stats" class="stats"></div>
            <p id="elevation-note" class="data-note"></p>
            <div id="profile-container">
              <h3>Elevation profile</h3>
              <svg id="profile" viewBox="0 0 600 180" role="img" aria-label="Elevation in meters over route distance"></svg>
              <label class="field-label" for="profile-position">Explore a point on the trail</label>
              <input id="profile-position" type="range" min="0" max="1" value="0">
              <p id="profile-reading" class="profile-reading"></p>
            </div>
            <label class="field-label" for="pace">Walking pace on flat ground</label>
            <select id="pace"><option value="3">Relaxed / 3 km/h</option><option value="4" selected>Steady / 4 km/h</option><option value="5">Brisk / 5 km/h</option></select>
            <p id="duration" class="duration"></p>
            <p class="data-note">Planning estimate, not navigation or a safety assessment. Excludes breaks, driving, surface conditions, and weather. Climb uses raw GPX elevations; GPS noise can inflate totals. Segment gaps are never connected.</p>
            <button id="save-trail" type="button" class="button primary">Save trail offline</button>
            <p id="engine-timing" class="engine-timing"></p>
          </div>
        </section>
        <section id="saved-panel" hidden>
          <p class="eyebrow">YOUR NEXT DAYS OUT</p>
          <h1>Ready for<br>the road.</h1>
          <p class="intro">Place details and analyzed trails are saved on this device. No account needed.</p>
          <ul id="saved-list" class="place-list"></ul>
          <p id="saved-empty" class="empty">No saved outings yet. Save a place or import a trail to get started.</p>
          <p class="data-note">Offline includes saved details and trail analysis, not the Mapbox basemap. Downloads finish after the first successful app load. Browser data clearing removes saved outings.</p>
          <p id="offline-readiness" class="data-note" role="status">Checking offline app availability...</p>
        </section>
      </div>
      <footer class="panel-footer">Built for the mountains. Computed on your device.</footer>
    </aside>
  </div>
  <div id="notification" class="notification" role="status" hidden></div>
`;

const search = get("search", HTMLInputElement);
const activity = get("activity", HTMLSelectElement);
const fileInput = get("gpx-file", HTMLInputElement);
const pace = get("pace", HTMLSelectElement);
const position = get("profile-position", HTMLInputElement);
let selectedPlace: Place | undefined;
let filtered = places;
let saved: SavedOuting[] = [];
let analysis: Analysis | undefined;
let trailPoints: TrailPoint[] = [];
let savedTrailId: string | undefined;
let map: mapboxgl.Map | undefined;
let mapReady = false;
let popup: mapboxgl.Popup | undefined;
let pointMarker: mapboxgl.Marker | undefined;
let worker: Worker | undefined;
let requestId = 0;
let importing = false;
let savingTrail = false;
let activeTab = "explore";
let notificationTimer: ReturnType<typeof setTimeout> | undefined;

function notify(message: string, error = false): void {
  const element = get("notification", HTMLDivElement);
  clearTimeout(notificationTimer);
  element.textContent = message;
  element.classList.toggle("error", error);
  element.setAttribute("role", error ? "alert" : "status");
  element.hidden = false;
  if (!error) notificationTimer = setTimeout(() => { element.hidden = true; }, 6000);
}

function report(error: unknown): void {
  console.error(error);
  notify(error instanceof Error ? error.message : String(error), true);
}

function perform(action: () => Promise<void>): void {
  void action().catch(report);
}

function switchTab(tab: string): void {
  activeTab = tab;
  for (const name of ["explore", "analyze", "saved"]) {
    get(`${name}-panel`, HTMLElement).hidden = name !== tab;
  }
  document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((element) => {
    element.setAttribute("aria-pressed", String(element.dataset.tab === tab));
  });
  if (tab !== "analyze") pointMarker?.remove();
  else if (analysis) updateProfilePoint();
}

document.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((element) => {
  element.onclick = () => switchTab(element.dataset.tab || "explore");
});

activityOptions.forEach((label) => activity.append(new Option(label, label)));

function placeData(): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: filtered.map((place) => ({
      type: "Feature", id: place.id, properties: { placeId: place.id, selected: selectedPlace?.id === place.id },
      geometry: { type: "Point", coordinates: place.coordinates },
    })),
  };
}

function routeData(): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: (analysis?.segments || []).filter((segment) => segment.length > 1).map((segment) => ({
      type: "Feature", properties: {},
      geometry: { type: "LineString", coordinates: segment.map((p) => [p.longitude, p.latitude]) },
    })),
  };
}

function updateMap(): void {
  if (!mapReady || !map) return;
  const parks = map.getSource("parks");
  const trail = map.getSource("trail");
  if (parks?.type === "geojson") parks.setData(placeData());
  if (trail?.type === "geojson") trail.setData(routeData());
}

function focusTrail(): void {
  if (!mapReady || !map || !analysis) return;
  const bounds = new mapboxgl.LngLatBounds();
  for (const segment of analysis.segments) {
    for (const point of segment) bounds.extend([point.longitude, point.latitude]);
  }
  map.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: reducedMotion() ? 0 : 900 });
}

function reducedMotion(): boolean {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function selectPlace(place: Place, move = true): void {
  selectedPlace = place;
  switchTab("explore");
  renderPlaces();
  renderDetails();
  const heading = get("place-details", HTMLElement).querySelector("h2");
  if (move && heading) {
    heading.tabIndex = -1;
    heading.focus();
  }
  updateMap();
  const url = new URL(location.href);
  url.searchParams.set("place", place.id);
  history.replaceState(null, "", url);
  if (mapReady && map) {
    popup?.remove();
    popup = new mapboxgl.Popup({ offset: 14 })
      .setLngLat(place.coordinates)
      .setDOMContent(node("strong", place.name))
      .addTo(map);
    if (move) map.flyTo({ center: place.coordinates, zoom: 13, duration: reducedMotion() ? 0 : 800 });
  }
}

function renderDetails(): void {
  const detail = get("place-details", HTMLElement);
  detail.replaceChildren();
  detail.hidden = !selectedPlace;
  if (!selectedPlace) return;
  const place = selectedPlace;
  detail.className = "selected-detail";
  detail.append(node("p", "YOUR SELECTED PLACE", "eyebrow"), node("h2", place.name), node("p", place.description));
  detail.append(node("p", place.activities.join(" / ") || "Activities not documented", "activity-text"));
  const controls = node("div", "", "card-actions");
  const isSaved = saved.some((outing) => outing.id === `place:${place.id}`);
  controls.append(button(isSaved ? "Saved on this device" : "Save outing offline", () => {
    perform(async () => {
      await writeOuting({
        id: `place:${place.id}`, kind: "place", name: place.name,
        savedAt: new Date().toISOString(), place,
      });
      await refreshSaved();
      notify("Place details saved on this device. The basemap still needs a connection.");
    });
  }, "button primary"));
  controls.append(button("Close", () => {
    selectedPlace = undefined;
    popup?.remove();
    const url = new URL(location.href);
    url.searchParams.delete("place");
    history.replaceState(null, "", url);
    renderDetails(); renderPlaces(); updateMap();
  }, "text-button"));
  detail.append(controls);
}

function renderPlaces(): void {
  const list = get("place-list", HTMLUListElement);
  list.replaceChildren();
  get("result-count", HTMLParagraphElement).textContent = `${filtered.length} ${filtered.length === 1 ? "place" : "places"} to explore`;
  get("empty-results", HTMLParagraphElement).hidden = filtered.length !== 0;
  filtered.forEach((place) => {
    const item = node("li", "", "place-card");
    const select = button("", () => selectPlace(place), "place-select");
    select.setAttribute("aria-pressed", String(selectedPlace?.id === place.id));
    select.append(node("span", place.name, "place-name"));
    select.append(node("span", place.description, "place-description"));
    select.append(node("span", place.activities.slice(0, 3).join(" / ") || "Discover this place", "activity-text"));
    item.append(select);
    list.append(item);
  });
}

function applyFilters(): void {
  filtered = filterPlaces(places, search.value, activity.value);
  if (selectedPlace && !filtered.some((place) => place.id === selectedPlace?.id)) {
    selectedPlace = undefined;
    popup?.remove();
    renderDetails();
  }
  const url = new URL(location.href);
  for (const [key, value] of [["q", search.value], ["activity", activity.value], ["place", selectedPlace?.id || ""]]) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  history.replaceState(null, "", url);
  renderPlaces();
  updateMap();
}

search.oninput = applyFilters;
activity.onchange = applyFilters;
get("clear-filters", HTMLButtonElement).onclick = () => {
  search.value = ""; activity.value = ""; applyFilters();
};

async function refreshSaved(): Promise<void> {
  saved = (await readOutings()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  get("saved-count", HTMLSpanElement).textContent = String(saved.length);
  const list = get("saved-list", HTMLUListElement);
  list.replaceChildren();
  get("saved-empty", HTMLParagraphElement).hidden = saved.length > 0;
  saved.forEach((outing) => {
    const card = node("li", "", "saved-card");
    card.append(node("p", outing.kind === "place" ? "SAVED PLACE" : "SAVED TRAIL", "eyebrow"), node("h2", outing.name));
    card.append(node("p", outing.kind === "place" ? outing.place.description : `${formatDistance(outing.analysis.distanceM)} / ${outing.analysis.pointCount.toLocaleString()} points`));
    card.append(node("p", `Saved ${new Date(outing.savedAt).toLocaleDateString()}`, "data-note"));
    const actions = node("div", "", "card-actions");
    actions.append(button("Open outing", () => {
      if (outing.kind === "place") {
        search.value = ""; activity.value = ""; applyFilters();
        selectPlace(outing.place);
      } else {
        cancelAnalysis();
        savedTrailId = outing.id;
        showAnalysis(outing.analysis);
        switchTab("analyze");
        get("analysis-state", HTMLParagraphElement).textContent = "Loaded from this device. No network needed.";
        get("engine-timing", HTMLParagraphElement).textContent = "Saved Rust analysis";
      }
    }));
    actions.append(button("Remove", () => {
      perform(async () => {
        await removeOuting(outing.id);
        if (savedTrailId === outing.id) savedTrailId = undefined;
        await refreshSaved();
        notify("Saved outing removed.");
      });
    }, "text-button"));
    card.append(actions);
    list.append(card);
  });
  renderDetails();
  updateSaveTrailButton();
}

function setBusy(busy: boolean): void {
  importing = busy;
  get("cancel-analysis", HTMLButtonElement).hidden = !busy;
  get("save-trail", HTMLButtonElement).disabled = busy || savingTrail;
}

function cancelAnalysis(): void {
  requestId++;
  worker?.terminate();
  worker = undefined;
  setBusy(false);
}

get("cancel-analysis", HTMLButtonElement).onclick = () => {
  cancelAnalysis();
  get("analysis-state", HTMLParagraphElement).textContent = "Import cancelled. Your previous trail is unchanged.";
};

fileInput.onchange = () => {
  const file = fileInput.files?.[0];
  fileInput.value = "";
  if (!file) return;
  cancelAnalysis();
  const id = requestId;
  void (async () => {
    if (file.size > 8 * 1024 * 1024) throw new Error("Choose a GPX file no larger than 8 MiB.");
    setBusy(true);
    get("analysis-state", HTMLParagraphElement).textContent = "Loading local Rust engine and analyzing...";
    const xml = await file.text();
    if (id !== requestId) return;
    worker = new Worker(new URL("./analysis.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = ({ data }: MessageEvent<AnalysisResponse>) => {
      if (data.id !== requestId) return;
      worker?.terminate();
      worker = undefined;
      setBusy(false);
      if ("error" in data) {
        get("analysis-state", HTMLParagraphElement).textContent = "Import failed. Your previous trail is unchanged.";
        report(new Error(data.error));
        return;
      }
      savedTrailId = undefined;
      showAnalysis(data.analysis);
      get("analysis-state", HTMLParagraphElement).textContent = "Analyzed locally. Nothing was uploaded.";
      get("engine-timing", HTMLParagraphElement).textContent =
        `Rust/WASM analysis: ${data.elapsedMs.toFixed(1)} ms (excludes engine loading and transfer)`;
      notify("Trail imported and analyzed.");
    };
    worker.onerror = () => {
      if (id !== requestId) return;
      cancelAnalysis();
      get("analysis-state", HTMLParagraphElement).textContent = "Engine failed to load or run.";
      report(new Error("The local analysis engine failed. Reload the app while online and retry."));
    };
    worker.postMessage({ id, xml });
  })().catch((error: unknown) => {
    if (id !== requestId) return;
    cancelAnalysis();
    get("analysis-state", HTMLParagraphElement).textContent = "Import failed. Your previous trail is unchanged.";
    report(error);
  });
};

function showAnalysis(result: Analysis): void {
  analysis = result;
  trailPoints = result.segments.flat();
  get("trail-results", HTMLDivElement).hidden = false;
  get("trail-name", HTMLHeadingElement).textContent = result.name;
  const stats = get("trail-stats", HTMLDivElement);
  stats.replaceChildren();
  const complete = result.elevationPairs === result.totalPairs;
  for (const [label, value] of [
    ["DISTANCE", formatDistance(result.distanceM)],
    [complete ? "ASCENT" : "KNOWN ASCENT", result.elevationPairs ? `${Math.round(result.ascentM)} m` : "Unknown"],
    [complete ? "DESCENT" : "KNOWN DESCENT", result.elevationPairs ? `${Math.round(result.descentM)} m` : "Unknown"],
    ["SEGMENTS", String(result.segments.length)],
  ]) {
    const stat = node("div", "", "stat");
    stat.append(node("span", label), node("strong", value));
    stats.append(stat);
  }
  get("elevation-note", HTMLParagraphElement).textContent = complete
    ? "Elevation is present for every point. Gain and loss are raw GPX sums, not smoothed terrain measurements."
    : `Incomplete elevation: ${result.elevationPoints} of ${result.pointCount} points have heights. Climb totals cover only ${result.elevationPairs} of ${result.totalPairs} connected point pairs; no heights are inferred.`;
  get("profile-container", HTMLDivElement).hidden = result.elevationPoints === 0;
  position.max = String(trailPoints.length - 1);
  position.value = "0";
  renderProfile();
  updateDuration();
  updateSaveTrailButton();
  updateMap();
  focusTrail();
  updateProfilePoint();
}

function updateSaveTrailButton(): void {
  get("save-trail", HTMLButtonElement).textContent =
    savedTrailId && saved.some((item) => item.id === savedTrailId) ? "Trail saved on this device" : "Save trail offline";
}

get("save-trail", HTMLButtonElement).onclick = () => {
  if (!analysis || savingTrail) return;
  const snapshot = analysis;
  const id = savedTrailId || `trail:${crypto.randomUUID()}`;
  savingTrail = true;
  get("save-trail", HTMLButtonElement).disabled = true;
  perform(async () => {
    try {
      await writeOuting({ id, kind: "trail", name: snapshot.name, savedAt: new Date().toISOString(), analysis: snapshot });
      if (analysis === snapshot) savedTrailId = id;
      await refreshSaved();
      notify("Trail geometry and analysis saved for offline use.");
    } finally {
      savingTrail = false;
      get("save-trail", HTMLButtonElement).disabled = importing;
    }
  });
};

function updateDuration(): void {
  if (!analysis) return;
  const complete = analysis.elevationPairs === analysis.totalPairs;
  get("duration", HTMLParagraphElement).textContent =
    `Estimated walking time: ${formatDuration(estimateMinutes(analysis, Number(pace.value)))}. ` +
    (complete ? "Flat-ground pace + 1 hour per 600 m of ascent." : "Distance-only estimate: missing elevations prevent a complete climbing estimate.");
}

pace.onchange = updateDuration;

function profileXY(point: TrailPoint): [number, number] {
  if (!analysis) return [0, 0];
  const min = analysis.minElevation ?? 0;
  const span = Math.max(1, (analysis.maxElevation ?? min) - min);
  return [20 + point.distanceM / Math.max(analysis.distanceM, 1) * 560, 150 - ((point.elevation ?? min) - min) / span * 125];
}

function svgNode(tag: string): SVGElement {
  return document.createElementNS("http://www.w3.org/2000/svg", tag);
}

function renderProfile(): void {
  const svg = document.getElementById("profile");
  if (!(svg instanceof SVGSVGElement) || !analysis) return;
  svg.replaceChildren();
  const step = Math.max(1, Math.ceil(analysis.pointCount / 1000));
  for (const segment of analysis.segments) {
    let path = "";
    let connected = false;
    segment.forEach((point, i) => {
      if (point.elevation === null) { connected = false; return; }
      if (connected && i % step && i !== segment.length - 1) return;
      const [x, y] = profileXY(point);
      path += `${connected ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `;
      connected = true;
    });
    const line = svgNode("path");
    line.setAttribute("d", path);
    line.setAttribute("class", "profile-line");
    svg.append(line);
  }
  const label = svgNode("text");
  label.setAttribute("x", "20"); label.setAttribute("y", "175");
  label.textContent = `${Math.round(analysis.minElevation ?? 0)} - ${Math.round(analysis.maxElevation ?? 0)} m / ${formatDistance(analysis.distanceM)}`;
  svg.append(label);
  const dot = svgNode("circle");
  dot.id = "profile-dot";
  dot.setAttribute("r", "5");
  svg.append(dot);
}

function updateProfilePoint(): void {
  const point = trailPoints[Number(position.value)];
  if (!point) return;
  const description = `${formatDistance(point.distanceM)} along trail / ${point.elevation === null ? "elevation unknown" : `${Math.round(point.elevation)} m elevation`}`;
  get("profile-reading", HTMLParagraphElement).textContent = description;
  position.setAttribute("aria-valuetext", description);
  const dot = document.getElementById("profile-dot");
  if (dot) {
    dot.setAttribute("visibility", point.elevation === null ? "hidden" : "visible");
    const [x, y] = profileXY(point);
    dot.setAttribute("cx", String(x)); dot.setAttribute("cy", String(y));
  }
  if (mapReady && map && activeTab === "analyze") {
    pointMarker ||= new mapboxgl.Marker({ color: "#e9a23b" });
    pointMarker.setLngLat([point.longitude, point.latitude]).addTo(map);
  }
}

position.oninput = updateProfilePoint;
document.getElementById("profile")?.addEventListener("click", (event) => {
  if (!analysis) return;
  const target = event.currentTarget;
  if (!(target instanceof SVGSVGElement)) return;
  const bounds = target.getBoundingClientRect();
  const distance = Math.max(0, Math.min(1, ((event.clientX - bounds.left) / bounds.width * 600 - 20) / 560)) * analysis.distanceM;
  let closest = 0;
  for (let i = 1; i < trailPoints.length; i++) {
    if (Math.abs(trailPoints[i].distanceM - distance) < Math.abs(trailPoints[closest].distanceM - distance)) closest = i;
  }
  position.value = String(closest);
  updateProfilePoint();
});

function mapNotice(message: string): void {
  const element = get("map-notice", HTMLParagraphElement);
  element.textContent = message;
  element.hidden = !message;
}

function updateConnection(): void {
  get("connection", HTMLSpanElement).textContent = navigator.onLine ? "LOCAL-FIRST EXPLORER" : "OFFLINE MODE";
  if (!navigator.onLine) mapNotice("Offline: saved details and trail analysis work. Basemap tiles need a connection.");
  else mapNotice("");
}

window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);
updateConnection();

async function initializeMap(): Promise<void> {
try {
  mapboxgl.accessToken = await loadMapboxToken();
  map = new mapboxgl.Map({
    container: "map", style: "mapbox://styles/mapbox/outdoors-v12",
    center: [-79.312, 39.505], zoom: 10.2,
  });
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
  map.on("error", (event) => {
    console.error("Map resource error:", event.error);
    mapNotice("Some map resources are unavailable. You can still browse places and analyze or open saved trails.");
  });
  map.on("style.load", () => {
    if (!map) return;
    map.addSource("parks", { type: "geojson", promoteId: "placeId", data: placeData() });
    map.addLayer({
      id: "parks", type: "circle", source: "parks",
      paint: {
        "circle-radius": ["case", ["get", "selected"], 11, 7],
        "circle-color": ["case", ["get", "selected"], "#e9a23b", "#216653"],
        "circle-stroke-color": "#fff", "circle-stroke-width": 3,
      },
    });
    map.addSource("trail", { type: "geojson", data: routeData() });
    map.addLayer({ id: "trail", type: "line", source: "trail", paint: { "line-color": "#d47522", "line-width": 5 } });
    map.on("click", "parks", (event) => {
      const place = places.find((item) => item.id === event.features?.[0]?.properties?.placeId);
      if (place) selectPlace(place);
    });
    map.on("mouseenter", "parks", () => { if (map) map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", "parks", () => { if (map) map.getCanvas().style.cursor = ""; });
    mapReady = true;
    get("map", HTMLDivElement).setAttribute("aria-busy", "false");
    if (selectedPlace && activeTab === "explore") selectPlace(selectedPlace, false);
    if (analysis) { focusTrail(); updateProfilePoint(); }
  });
} catch (error) {
  get("map", HTMLDivElement).setAttribute("aria-busy", "false");
  console.error("Map initialization failed:", error);
  mapNotice(`${error instanceof Error ? error.message : "The map could not start."} Place discovery, saved details, and trail analysis remain available.`);
}
}
void initializeMap();

get("reset-map", HTMLButtonElement).onclick = () => {
  if (!mapReady || !map) return;
  const bounds = new mapboxgl.LngLatBounds();
  places.forEach((place) => bounds.extend(place.coordinates));
  map.fitBounds(bounds, { padding: 50, duration: reducedMotion() ? 0 : 800 });
};

const params = new URL(location.href).searchParams;
search.value = params.get("q") || "";
activity.value = activityOptions.includes(params.get("activity") || "") ? params.get("activity") || "" : "";
filtered = filterPlaces(places, search.value, activity.value);
selectedPlace = filtered.find((place) => place.id === params.get("place"));
renderPlaces();
renderDetails();
perform(refreshSaved);

if ("serviceWorker" in navigator) {
  perform(async () => {
    const registration = await navigator.serviceWorker.register("./service-worker.js");
    const readiness = get("offline-readiness", HTMLParagraphElement);
    const ready = () => { readiness.textContent = "App shell and Rust engine are cached for offline use. Basemap tiles are not included."; };
    if (registration.waiting) {
      readiness.textContent = "An app update is downloaded. Close app tabs and reopen to activate its offline assets.";
    } else if (registration.active) ready();
    else {
      readiness.textContent = "Downloading the app shell and Rust engine for offline use...";
      const installing = registration.installing;
      installing?.addEventListener("statechange", () => {
        if (installing.state === "activated") ready();
        if (installing.state === "redundant") {
          readiness.textContent = "Offline setup failed. Reload while online to retry.";
          report(new Error("Offline app installation failed."));
        }
      });
    }
    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      installing?.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          notify("An app update is ready. Close app tabs and reopen to use it.");
        }
      });
    });
  });
} else {
  get("offline-readiness", HTMLParagraphElement).textContent = "This browser cannot cache the app shell. Saved data still remains on this device.";
}
