import * as THREE from "three";

/**
 * 2D collision grid – ONLY blocks actual buildings.
 *
 * Previous version was too aggressive: it marked everything above ground+0.3
 * as blocked (sidewalk curbs, benches, lampposts, fences…). This version:
 *
 *  1. Only considers meshes whose top is ≥ 1.5 units above ground (real buildings).
 *  2. Requires the mesh itself to have ≥ 0.5 vertical extent (no flat panels).
 *  3. Shrinks the XZ footprint by a margin so edges aren't over-blocked.
 *  4. Explicitly carves the known road corridors as a safety net.
 *  5. Keeps hard boundaries at city edges.
 */

const CELL_SIZE = 0.2;

// World-space bounds (slightly larger than city bbox)
const BOUNDS = {
  minX: -13.5,
  maxX: 4.5,
  minZ: -7.5,
  maxZ: 5.0,
};

// Only meshes reaching this far above ground are considered buildings
const MIN_TOP_ABOVE_GROUND = 1.5;
// Only meshes with this much vertical span count (filters flat roof panels etc.)
const MIN_VERTICAL_EXTENT = 0.5;
// Shrink each obstacle footprint by this amount per side
const XZ_SHRINK = 0.15;

// Known road corridors (world coords)
// Horizontal road: Z ≈ 0.71, width ~1.34 → roughly Z ∈ [-0.1, 1.5]
// Vertical road:   X ≈ -4.18, width ~1.34 → roughly X ∈ [-4.9, -3.4]
const ROAD_H_Z_MIN = -0.2;
const ROAD_H_Z_MAX = 1.6;
const ROAD_V_X_MIN = -5.0;
const ROAD_V_X_MAX = -3.3;

let gridW = 0;
let gridH = 0;
let grid: Uint8Array | null = null;

export function buildCollisionGrid(
  scene: THREE.Object3D,
  groundY: number
) {
  scene.updateMatrixWorld(true);

  gridW = Math.ceil((BOUNDS.maxX - BOUNDS.minX) / CELL_SIZE);
  gridH = Math.ceil((BOUNDS.maxZ - BOUNDS.minZ) / CELL_SIZE);
  grid = new Uint8Array(gridW * gridH);

  const box = new THREE.Box3();
  let meshCount = 0;

  scene.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.geometry) return;

    // Compute world-space bbox for just this mesh (not children)
    mesh.geometry.computeBoundingBox();
    const geoBB = mesh.geometry.boundingBox;
    if (!geoBB) return;

    // Transform the 8 corners to world space and recompute AABB
    box.makeEmpty();
    const corners = [
      new THREE.Vector3(geoBB.min.x, geoBB.min.y, geoBB.min.z),
      new THREE.Vector3(geoBB.max.x, geoBB.min.y, geoBB.min.z),
      new THREE.Vector3(geoBB.min.x, geoBB.max.y, geoBB.min.z),
      new THREE.Vector3(geoBB.max.x, geoBB.max.y, geoBB.min.z),
      new THREE.Vector3(geoBB.min.x, geoBB.min.y, geoBB.max.z),
      new THREE.Vector3(geoBB.max.x, geoBB.min.y, geoBB.max.z),
      new THREE.Vector3(geoBB.min.x, geoBB.max.y, geoBB.max.z),
      new THREE.Vector3(geoBB.max.x, geoBB.max.y, geoBB.max.z),
    ];
    for (const c of corners) {
      c.applyMatrix4(mesh.matrixWorld);
      box.expandByPoint(c);
    }

    // Only consider meshes that reach high enough above ground
    if (box.max.y < groundY + MIN_TOP_ABOVE_GROUND) return;

    // Only consider meshes with significant vertical extent
    const vExtent = box.max.y - box.min.y;
    if (vExtent < MIN_VERTICAL_EXTENT) return;

    // Skip meshes with tiny XZ footprint (poles, wires)
    const xSize = box.max.x - box.min.x;
    const zSize = box.max.z - box.min.z;
    if (xSize < 0.1 && zSize < 0.1) return;

    meshCount++;

    // Mark grid cells, with shrunk footprint
    const fMinX = box.min.x + XZ_SHRINK;
    const fMaxX = box.max.x - XZ_SHRINK;
    const fMinZ = box.min.z + XZ_SHRINK;
    const fMaxZ = box.max.z - XZ_SHRINK;
    if (fMinX >= fMaxX || fMinZ >= fMaxZ) return; // shrink ate the whole thing

    const minIx = Math.max(0, Math.floor((fMinX - BOUNDS.minX) / CELL_SIZE));
    const maxIx = Math.min(gridW - 1, Math.floor((fMaxX - BOUNDS.minX) / CELL_SIZE));
    const minIz = Math.max(0, Math.floor((fMinZ - BOUNDS.minZ) / CELL_SIZE));
    const maxIz = Math.min(gridH - 1, Math.floor((fMaxZ - BOUNDS.minZ) / CELL_SIZE));

    for (let ix = minIx; ix <= maxIx; ix++) {
      for (let iz = minIz; iz <= maxIz; iz++) {
        grid![ix * gridH + iz] = 1;
      }
    }
  });

  // ── Carve road corridors ───────────────────────────────────────────────
  // Ensure the two main roads are always drivable
  for (let ix = 0; ix < gridW; ix++) {
    for (let iz = 0; iz < gridH; iz++) {
      const wx = BOUNDS.minX + (ix + 0.5) * CELL_SIZE;
      const wz = BOUNDS.minZ + (iz + 0.5) * CELL_SIZE;

      // Horizontal road
      if (wz >= ROAD_H_Z_MIN && wz <= ROAD_H_Z_MAX) {
        grid![ix * gridH + iz] = 0;
      }
      // Vertical road
      if (wx >= ROAD_V_X_MIN && wx <= ROAD_V_X_MAX) {
        grid![ix * gridH + iz] = 0;
      }
    }
  }

  // ── Hard boundary at city edges ────────────────────────────────────────
  for (let ix = 0; ix < gridW; ix++) {
    for (let iz = 0; iz < gridH; iz++) {
      const wx = BOUNDS.minX + (ix + 0.5) * CELL_SIZE;
      const wz = BOUNDS.minZ + (iz + 0.5) * CELL_SIZE;
      if (wx < -12.8 || wx > 3.8 || wz < -6.9 || wz > 4.6) {
        grid![ix * gridH + iz] = 1;
      }
    }
  }

  let blockedCount = 0;
  for (let i = 0; i < grid.length; i++) if (grid[i]) blockedCount++;
  console.log(
    `Collision grid: ${gridW}x${gridH} (cell=${CELL_SIZE}), ` +
      `${meshCount} building meshes, ` +
      `${blockedCount} blocked cells (${((100 * blockedCount) / grid.length).toFixed(1)}%)`
  );
}

function cellBlocked(ix: number, iz: number): boolean {
  if (!grid) return false;
  if (ix < 0 || ix >= gridW || iz < 0 || iz >= gridH) return true;
  return grid[ix * gridH + iz] === 1;
}

export function isBlocked(x: number, z: number): boolean {
  const ix = Math.floor((x - BOUNDS.minX) / CELL_SIZE);
  const iz = Math.floor((z - BOUNDS.minZ) / CELL_SIZE);
  return cellBlocked(ix, iz);
}

export function isBlockedWithRadius(
  x: number,
  z: number,
  radius: number
): boolean {
  return (
    isBlocked(x, z) ||
    isBlocked(x - radius, z - radius) ||
    isBlocked(x + radius, z - radius) ||
    isBlocked(x - radius, z + radius) ||
    isBlocked(x + radius, z + radius)
  );
}

export function isGridReady(): boolean {
  return grid !== null;
}
