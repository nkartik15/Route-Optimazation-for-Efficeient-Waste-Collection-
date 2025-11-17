// =================================
// APP STATE (NO MAP MARKERS HERE)
// =================================
let depot = null; // {lat, lng}
let points = [];  // [{lat, lng}]

// DOM shortcuts
const loadingEl = () => document.getElementById("loading");
const pointsListEl = () => document.getElementById("pointsList");

// =================================
// SET DEPOT
// =================================
function setDepot() {
  const lat = parseFloat(document.getElementById("depotLat").value);
  const lng = parseFloat(document.getElementById("depotLng").value);

  if (!isFinite(lat) || !isFinite(lng)) {
    alert("Enter valid latitude/longitude.");
    return;
  }

  depot = { lat, lng };
  setDepotMarker(lat, lng); // from map.js
}

// =================================
// ADD COLLECTION POINT
// =================================
function addCollectionPoint() {
  const lat = parseFloat(document.getElementById("pointLat").value);
  const lng = parseFloat(document.getElementById("pointLng").value);

  if (!isFinite(lat) || !isFinite(lng)) {
    alert("Enter valid point coordinates.");
    return;
  }

  points.push({ lat, lng });
  addCollectionMarker(lat, lng, points.length); // from map.js
  refreshPointsList();

  document.getElementById("pointLat").value = "";
  document.getElementById("pointLng").value = "";
}

// =================================
// DELETE POINT
// =================================
function deletePoint(index) {
  points.splice(index, 1);

  clearCollectionMarkers(); // remove all markers

  // redraw
  points.forEach((p, i) => addCollectionMarker(p.lat, p.lng, i + 1));

  refreshPointsList();
  clearRoute();
}

// =================================
// CLEAR ALL
// =================================
function clearAllPoints() {
  points = [];
  clearCollectionMarkers();
  clearRoute();
  refreshPointsList();
}

// =================================
// POINT LIST UI
// =================================
function refreshPointsList() {
  const el = pointsListEl();

  if (!points.length) {
    el.innerHTML = '<p class="muted">No points added yet</p>';
    return;
  }

  el.innerHTML = "";
  points.forEach((p, i) => {
    const div = document.createElement("div");
    div.className = "point-item";
    div.innerHTML = `
      <div>
        <strong>Point ${i + 1}</strong><br/>
        <small>Lat ${p.lat.toFixed(6)}, Lng ${p.lng.toFixed(6)}</small>
      </div>
      <button class="btn btn-ghost" onclick="deletePoint(${i})">
        <i class="fas fa-times"></i>
      </button>
    `;
    el.appendChild(div);
  });
}

// =================================
// OSRM FETCH HELPERS
// =================================
async function fetchOSRMDistanceMatrix(coords) {
  const locs = coords.map((c) => `${c.lng},${c.lat}`).join(";");

  const url = `https://router.project-osrm.org/table/v1/driving/${locs}?annotations=distance`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("Distance matrix fetch failed");
  const data = await res.json();

  if (!data.distances) throw new Error("No OSRM distance data");

  return data.distances;
}

async function fetchOSRMRoute(coords, order) {
  const path = order.map((i) => coords[i]);
  const locs = path.map((c) => `${c.lng},${c.lat}`).join(";");

  const url = `https://router.project-osrm.org/route/v1/driving/${locs}?overview=full&geometries=geojson`;
  const res = await fetch(url);

  if (!res.ok) throw new Error("OSRM route fetch failed");
  const data = await res.json();

  if (!data.routes || !data.routes.length) {
    throw new Error("No OSRM route returned");
  }

  return data.routes[0].geometry;
}

// =================================
// CALCULATE ROUTE
// =================================
async function calculateRoute() {
  if (!depot) {
    alert("Set Depot first.");
    return;
  }
  if (!points.length) {
    alert("Add at least one point.");
    return;
  }

  loadingEl().style.display = "flex";

  try {
    const coords = [depot, ...points];
    const matrix = await fetchOSRMDistanceMatrix(coords);

    let order = greedyOrder(
      matrix,
      0,
      document.getElementById("returnToDepot").checked
    );

    if (document.getElementById("returnToDepot").checked) {
      order = twoOpt(matrix, order);
    }

    const geometry = await fetchOSRMRoute(coords, order);

    drawRoute({
      type: "Feature",
      geometry,
      properties: {},
    });

  } catch (err) {
    alert("Route error: " + err.message);
    console.error(err);

  } finally {
    loadingEl().style.display = "none";
  }
}

// =================================
// EXAMPLE POINTS
// =================================
function examplePoints() {
  points = [
    { lat: 12.980708, lng: 77.605916 },
    { lat: 12.969216, lng: 77.584795 },
    { lat: 12.961116, lng: 77.604342 },
    { lat: 12.98355, lng: 77.5811 },
  ];

  clearCollectionMarkers();

  points.forEach((p, i) => addCollectionMarker(p.lat, p.lng, i + 1));
  refreshPointsList();
}

// =================================
// FIREBASE FETCH
// =================================
async function fetchBinsFromFirebase() {
  try {
    const res = await fetch(
      "https://location-b2625-default-rtdb.asia-southeast1.firebasedatabase.app/smartbins.json"
    );
    const data = await res.json();

    clearCollectionMarkers();
    points = [];

    Object.keys(data).forEach((id, index) => {
      const bin = data[id];
      if (!bin.latitude || !bin.longitude) return;

      points.push({ lat: bin.latitude, lng: bin.longitude });

      const marker = addCollectionMarker(bin.latitude, bin.longitude, index + 1);
      marker.bindPopup(
        `<b>${id}</b><br>Status: ${bin.full ? "FULL" : "Empty"}`
      );
    });

    refreshPointsList();
  } catch (err) {
    alert("Firebase fetch failed.");
    console.error(err);
  }
}

// =================================
// EXPORT TO WINDOW
// =================================
window.setDepot = setDepot;
window.addCollectionPoint = addCollectionPoint;
window.clearAllPoints = clearAllPoints;
window.calculateRoute = calculateRoute;
window.deletePoint = deletePoint;
window.examplePoints = examplePoints;
window.fetchBinsFromFirebase = fetchBinsFromFirebase;
