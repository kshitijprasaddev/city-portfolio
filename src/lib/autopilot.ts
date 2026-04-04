import { BUILDINGS, BuildingZone, ROAD_H_Z, ROAD_V_X } from "@/data/cityLayout";

/**
 * MPC-inspired waypoint pathfinding along the two roads.
 *
 * City roads:
 *  - Horizontal road: Z ≈ 0.71, X from -12 to +3.7
 *  - Vertical road:   X ≈ -4.18, Z from -7.1 to +3.8
 *  - Intersection:    (-4.18, 0.71)
 *
 * Strategy: generates dense sub-waypoints along roads for smooth path following.
 * The car controller applies a pursuit-style algorithm for realistic turning.
 */

const INTERSECTION: [number, number] = [ROAD_V_X, ROAD_H_Z];
const WAYPOINT_SPACING = 0.5; // dense waypoints for smooth curves

/** Get the on-road point closest to a building sign (clamped to road) */
function roadPointForBuilding(b: BuildingZone): [number, number] {
  // Since signs are now offset from road center, we use building id + road type
  if (b.road === "horizontal") {
    return [b.signPosition[0], ROAD_H_Z];
  } else {
    return [ROAD_V_X, b.signPosition[2]];
  }
}

/** Generate dense sub-waypoints between two points along a road axis */
function interpolateWaypoints(
  from: [number, number],
  to: [number, number]
): [number, number][] {
  const dx = to[0] - from[0];
  const dz = to[1] - from[1];
  const dist = Math.sqrt(dx * dx + dz * dz);
  const steps = Math.max(2, Math.ceil(dist / WAYPOINT_SPACING));
  const waypoints: [number, number][] = [];

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    waypoints.push([from[0] + dx * t, from[1] + dz * t]);
  }
  return waypoints;
}

/**
 * Generate a smooth route from current position to a building target.
 * Returns dense [x, z] waypoints for pursuit-style following.
 */
export function planRoute(
  fromX: number,
  fromZ: number,
  targetBuildingId: string
): [number, number][] {
  const building = BUILDINGS.find((b) => b.id === targetBuildingId);
  if (!building) return [];

  const dest = roadPointForBuilding(building);
  const from: [number, number] = [fromX, fromZ];

  // Which road is the car currently closest to?
  const distToH = Math.abs(fromZ - ROAD_H_Z);
  const distToV = Math.abs(fromX - ROAD_V_X);
  const destOnH = building.road === "horizontal";
  const destOnV = building.road === "vertical";

  const carOnH = distToH < 2.0;
  const carOnV = distToV < 2.0;

  const allWaypoints: [number, number][] = [];

  // First snap to nearest road point
  let roadStart: [number, number];
  if (carOnH && !carOnV) {
    roadStart = [fromX, ROAD_H_Z];
  } else if (carOnV && !carOnH) {
    roadStart = [ROAD_V_X, fromZ];
  } else {
    // Near intersection
    roadStart = [fromX, fromZ];
  }

  // Add approach to road center
  if (dist2d(from[0], from[1], roadStart[0], roadStart[1]) > 0.2) {
    allWaypoints.push(roadStart);
  }

  if (carOnH && destOnH) {
    // Same road — drive straight
    allWaypoints.push(...interpolateWaypoints(roadStart, dest));
  } else if (carOnV && destOnV) {
    // Same road — drive straight
    allWaypoints.push(...interpolateWaypoints(roadStart, dest));
  } else {
    // Need to go through intersection
    const toIntersection = interpolateWaypoints(roadStart, INTERSECTION);
    const fromIntersection = interpolateWaypoints(INTERSECTION, dest);
    allWaypoints.push(...toIntersection, ...fromIntersection);
  }

  return allWaypoints;
}

/** Distance in XZ plane */
export function dist2d(
  ax: number,
  az: number,
  bx: number,
  bz: number
): number {
  return Math.sqrt((ax - bx) ** 2 + (az - bz) ** 2);
}

/** Angle from (ax, az) to (bx, bz) — used for steering */
export function angleTo(
  ax: number,
  az: number,
  bx: number,
  bz: number
): number {
  return Math.atan2(bx - ax, bz - az);
}
