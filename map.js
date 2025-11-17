// ========================
// MAP STATE (ONLY HERE)
// ========================
let map;
let depotMarker = null;
let collectionMarkers = [];  // <-- Lives ONLY here
let routeLayer = null;

// ========================
// MAP INITIALIZATION
// ========================
function initMap() {
  map = L.map("map").setView([12.9716, 77.5946], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
}

// Depot icon
const depotIcon = L.icon({
  iconUrl:
    "https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// ========================
// DEPOT MARKER
// ========================
function setDepotMarker(lat, lng) {
  if (depotMarker) {
    depotMarker.setLatLng([lat, lng]);
  } else {
    depotMarker = L.marker([lat, lng], {
      icon: depotIcon,
      title: "Depot",
    })
      .bindPopup("Depot")
      .addTo(map);
  }

  map.setView([lat, lng], Math.max(map.getZoom(), 12));
}

// ========================
// COLLECTION MARKERS
// ========================
function addCollectionMarker(lat, lng, idx) {
  const marker = L.marker([lat, lng], { title: "Point " + idx })
    .bindPopup("Point " + idx)
    .addTo(map);

  collectionMarkers.push(marker);
  return marker;
}

function clearCollectionMarkers() {
  collectionMarkers.forEach((m) => map.removeLayer(m));
  collectionMarkers = [];
}

// ========================
// ROUTE DRAWING
// ========================
function clearRoute() {
  if (routeLayer) {
    map.removeLayer(routeLayer);
    routeLayer = null;
  }
}

function drawRoute(geojson) {
  clearRoute();

  routeLayer = L.geoJSON(geojson, {
    style: {
      color: "red",
      weight: 4,
      opacity: 0.8,
    },
  });

  routeLayer.addTo(map);
  map.fitBounds(routeLayer.getBounds(), { padding: [20, 20] });
}

// ========================
// EXPORT FUNCTIONS
// ========================
window.initMap = initMap;
window.setDepotMarker = setDepotMarker;
window.addCollectionMarker = addCollectionMarker;
window.clearCollectionMarkers = clearCollectionMarkers;
window.clearRoute = clearRoute;
window.drawRoute = drawRoute;

document.addEventListener("DOMContentLoaded", initMap);
