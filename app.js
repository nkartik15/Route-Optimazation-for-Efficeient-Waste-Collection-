// State
let depot = null; // {lat, lng}
let points = [];  // [{lat,lng}]

const loadingEl = () => document.getElementById('loading');
const pointsListEl = () => document.getElementById('pointsList');

function setDepot() {
  const lat = parseFloat(document.getElementById('depotLat').value);
  const lng = parseFloat(document.getElementById('depotLng').value);
  if (!isFinite(lat) || !isFinite(lng)) {
    alert('Please enter a valid depot latitude and longitude.');
    return;
  }
  depot = { lat, lng };
  setDepotMarker(lat, lng);
}

function addCollectionPoint() {
  const lat = parseFloat(document.getElementById('pointLat').value);
  const lng = parseFloat(document.getElementById('pointLng').value);
  if (!isFinite(lat) || !isFinite(lng)) {
    alert('Please enter a valid point latitude and longitude.');
    return;
  }
  points.push({ lat, lng });
  addCollectionMarker(lat, lng, points.length);
  refreshPointsList();
  document.getElementById('pointLat').value = '';
  document.getElementById('pointLng').value = '';
}

function deletePoint(index) {
  points.splice(index, 1);
  clearCollectionMarkers();
  points.forEach((p, i) => addCollectionMarker(p.lat, p.lng, i + 1));
  refreshPointsList();
  clearRoute();
}

function clearAllPoints() {
  points = [];
  clearCollectionMarkers();
  clearRoute();
  refreshPointsList();
}

function refreshPointsList() {
  const el = pointsListEl();
  if (!points.length) {
    el.innerHTML = '<p class="muted">No points added yet</p>';
    return;
  }
  el.innerHTML = '';
  points.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'point-item';
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

async function fetchOSRMDistanceMatrix(coords) {
  // coords: [{lat,lng}, ...] in order [depot, ...points]
  const locs = coords.map(c => `${c.lng},${c.lat}`).join(';');
  const url = `https://router.project-osrm.org/table/v1/driving/${locs}?annotations=distance`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM table request failed');
  const data = await res.json();
  if (!data.distances) throw new Error('No distances returned from OSRM');
  return data.distances; // matrix in meters
}

async function fetchOSRMRoute(coords, coordsOrder) {
  // coords: [{lat,lng}, ...], coordsOrder: indices into coords array
  const path = coordsOrder.map(i => coords[i]);
  const locs = path.map(c => `${c.lng},${c.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${locs}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM route request failed');
  const data = await res.json();
  if (!data.routes || !data.routes.length) throw new Error('No route returned from OSRM');
  return data.routes[0].geometry; // GeoJSON LineString
}

async function calculateRoute() {
  if (!depot) {
    alert('Please set the depot location first.');
    return;
  }
  if (!points.length) {
    alert('Please add at least one collection point.');
    return;
  }
  loadingEl().style.display = 'flex';

  try {
    // Build coordinates array [depot, ...points]
    const coords = [depot, ...points];

    // 1) Get pairwise road distances from OSRM (OpenStreetMap-based)
    const matrix = await fetchOSRMDistanceMatrix(coords);

    // 2) Build a visitation order using Dijkstra-based greedy heuristic
    //    over the distance matrix (start at 0, the depot).
    let order = greedyOrder(matrix, 0, document.getElementById('returnToDepot').checked);

    // 3) If returning to depot, try a quick 2-opt improvement to shorten the tour
    if (document.getElementById('returnToDepot').checked) {
      order = twoOpt(matrix, order);
    }

    // 4) Request the actual road polyline from OSRM and draw on the map
    const geom = await fetchOSRMRoute(coords, order);
    drawRoute({ type: 'Feature', geometry: geom, properties: {} });

  } catch (err) {
    console.error(err);
    alert('Failed to calculate the route: ' + err.message);
  } finally {
    loadingEl().style.display = 'none';
  }
}

function examplePoints() {
  // Around central Bengaluru
  points = [
    { lat: 12.980708, lng: 77.605916 },
    { lat: 12.969216, lng: 77.584795 },
    { lat: 12.961116, lng: 77.604342 },
    { lat: 12.983550, lng: 77.581100 },
  ];
  clearCollectionMarkers();
  points.forEach((p, i) => addCollectionMarker(p.lat, p.lng, i + 1));
  refreshPointsList();
}

// Expose to window
window.setDepot = setDepot;
window.addCollectionPoint = addCollectionPoint;
window.clearAllPoints = clearAllPoints;
window.calculateRoute = calculateRoute;
window.deletePoint = deletePoint;
window.examplePoints = examplePoints;
