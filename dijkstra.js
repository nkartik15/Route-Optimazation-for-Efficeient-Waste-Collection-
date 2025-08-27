
// Basic Dijkstra over a dense graph represented by a distance matrix.
// Returns distances and previous-node arrays from 'source'.
function dijkstra(distanceMatrix, source) {
  const n = distanceMatrix.length;
  const dist = Array(n).fill(Infinity);
  const visited = Array(n).fill(false);
  const prev = Array(n).fill(null);
  dist[source] = 0;

  for (let i = 0; i < n; i++) {
    // Pick the unvisited node with smallest dist
    let u = -1, best = Infinity;
    for (let v = 0; v < n; v++) {
      if (!visited[v] && dist[v] < best) { best = dist[v]; u = v; }
    }
    if (u === -1) break;
    visited[u] = true;

    for (let v = 0; v < n; v++) {
      if (visited[v]) continue;
      const w = distanceMatrix[u][v];
      if (!isFinite(w)) continue;
      const alt = dist[u] + w;
      if (alt < dist[v]) { dist[v] = alt; prev[v] = u; }
    }
  }
  return { dist, prev };
}

// Build a greedy visitation order using Dijkstra distances from the current node.
// This is a heuristic for visiting all points; we then optionally run a simple 2-opt improvement.
function greedyOrder(distanceMatrix, startIndex, mustReturn) {
  const n = distanceMatrix.length;
  const order = [startIndex];
  const unvisited = new Set([...Array(n).keys()].filter(i => i !== startIndex));

  let current = startIndex;
  while (unvisited.size) {
    // Compute shortest-path distances from 'current'
    const { dist } = dijkstra(distanceMatrix, current);
    // Pick nearest unvisited by road distance
    let bestNode = null, bestDist = Infinity;
    for (const v of unvisited) {
      if (dist[v] < bestDist) { bestDist = dist[v]; bestNode = v; }
    }
    order.push(bestNode);
    unvisited.delete(bestNode);
    current = bestNode;
  }
  if (mustReturn) order.push(startIndex);
  return order;
}

// Simple 2-opt to improve tour length (works when returning to depot).
function twoOpt(distanceMatrix, tour) {
  if (tour.length < 4) return tour;
  const n = tour.length;
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < n - 2; i++) {
      for (let k = i + 1; k < n - 1; k++) {
        const a = tour[i - 1], b = tour[i], c = tour[k], d = tour[k + 1];
        const current = distanceMatrix[a][b] + distanceMatrix[c][d];
        const swapped = distanceMatrix[a][c] + distanceMatrix[b][d];
        if (swapped + 1e-6 < current) {
          const newTour = tour.slice(0, i).concat(tour.slice(i, k + 1).reverse(), tour.slice(k + 1));
          tour = newTour;
          improved = true;
        }
      }
    }
  }
  return tour;
}

if (typeof window !== 'undefined') {
  window.dijkstra = dijkstra;
  window.greedyOrder = greedyOrder;
  window.twoOpt = twoOpt;
}
