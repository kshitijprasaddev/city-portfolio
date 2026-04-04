// City layout: building trigger zones
// ── Real city world-space bounds (computed from all node transforms) ─────────
// X: -13.05 to 4.05, Y: -0.50 to 6.24, Z: -7.07 to 4.79
// City size: 17.10 × 6.74 × 11.86 units
// Ground Y ≈ -0.49
//
// Roads (flat surfaces):
//  Horizontal road: Z ≈ 0.71, X from -12 to +3.7, width ~1.34
//  Vertical road:   X ≈ -4.18, Z from -7.1 to +3.8, width ~1.34
//  Intersection:    (-4.18, 0.71)
//
// Tour order (driving west on main street):
//   About Me → Skills → Experience
// Then south on vertical road:
//   Education → Projects → Achievements → Thesis → Contact
// ─────────────────────────────────────────────────────────────────────────────

export type RoadDirection = "horizontal" | "vertical";

export interface BuildingZone {
  id: string;
  label: string;
  /** Building marker position [x, 0, z] - on building facade, Y overridden at runtime */
  position: [number, number, number];
  /** Road sign position [x, 0, z] - on ROADSIDE (offset from road center), Y overridden at runtime */
  signPosition: [number, number, number];
  /** Which road the sign sits on - controls billboard orientation */
  road: RoadDirection;
  color: string;
  content: string;
}

/** Car spawn at the EAST edge of the horizontal road, facing WEST */
export const CAR_SPAWN_XZ: [number, number] = [3.5, 0.71];
export const CAR_SPAWN_ROT = -Math.PI / 2; // face west (-X direction)

// Road center constants (useful for positioning)
export const ROAD_H_Z = 0.71;
export const ROAD_V_X = -4.18;
// Sign offset from road center (placed on the sidewalk/shoulder)
const SIGN_OFFSET = 0.95;

/**
 * 8 zones spread along the roads.
 *
 * Horizontal road (west from spawn): About Me → Skills → Experience → (intersection) → Education → Projects → Achievements
 * Vertical road (south from intersection): Thesis → Contact
 *
 * Signs are placed on the ROADSIDE (offset from road center), like highway exit signs.
 */
export const BUILDINGS: BuildingZone[] = [
  // ── Horizontal road (Z ≈ 0.71) - driving west from east edge ────────
  {
    id: "about",
    label: "About Me",
    position: [2.8, 0, 2.2],
    signPosition: [2.8, 0, ROAD_H_Z - SIGN_OFFSET],   // south roadside
    road: "horizontal",
    color: "#ec4899",
    content: "Who I Am",
  },
  {
    id: "skills",
    label: "Skills",
    position: [0.5, 0, 2.2],
    signPosition: [0.5, 0, ROAD_H_Z + SIGN_OFFSET],    // north roadside
    road: "horizontal",
    color: "#22c55e",
    content: "Technical Toolkit",
  },
  {
    id: "experience",
    label: "Experience",
    position: [-1.8, 0, -0.6],
    signPosition: [-1.8, 0, ROAD_H_Z - SIGN_OFFSET],   // south roadside
    road: "horizontal",
    color: "#00ffff",
    content: "Work Experience - AKKODIS",
  },

  // ── Horizontal road continued (west of intersection) ─────────────────
  {
    id: "education",
    label: "Education",
    position: [-6.5, 0, 2.2],
    signPosition: [-6.5, 0, ROAD_H_Z + SIGN_OFFSET],   // north roadside
    road: "horizontal",
    color: "#f59e0b",
    content: "THI Ingolstadt",
  },
  {
    id: "projects",
    label: "Projects",
    position: [-8.5, 0, -0.6],
    signPosition: [-8.5, 0, ROAD_H_Z - SIGN_OFFSET],   // south roadside
    road: "horizontal",
    color: "#a855f7",
    content: "Projects & Builds",
  },
  {
    id: "achievements",
    label: "Achievements",
    position: [-10.5, 0, 2.2],
    signPosition: [-10.5, 0, ROAD_H_Z + SIGN_OFFSET],  // north roadside
    road: "horizontal",
    color: "#eab308",
    content: "PAVE Europe 2025 Winner",
  },

  // ── Vertical road (X ≈ -4.18) - south from intersection ─────────────
  {
    id: "thesis",
    label: "Thesis",
    position: [-5.9, 0, -2.5],
    signPosition: [ROAD_V_X - SIGN_OFFSET, 0, -2.5],   // west roadside
    road: "vertical",
    color: "#06b6d4",
    content: "Deep RL Drone Landing",
  },
  {
    id: "contact",
    label: "Contact",
    position: [-2.4, 0, -5.0],
    signPosition: [ROAD_V_X + SIGN_OFFSET, 0, -5.0],   // east roadside
    road: "vertical",
    color: "#f43f5e",
    content: "Get In Touch",
  },
];
