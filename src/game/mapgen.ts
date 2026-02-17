import { createRng } from "./rng";
import { GRID_SIZE, TileType } from "./types";

const NUM_HOUSES = 25;
const SPAWN_SAFE = 50; // no houses in spawn zone

/**
 * Generate the tile map as a flat Uint8Array (row-major).
 * Only stores tile type per cell — lightweight for 1M cells (~1 MB).
 */
export function generateMap(seed: number): Uint8Array {
  const rng = createRng(seed);
  const map = new Uint8Array(GRID_SIZE * GRID_SIZE);

  for (let i = 0; i < map.length; i++) {
    map[i] = TileType.Grass;
  }

  // Fixed POIs
  const destIdx = 10 * GRID_SIZE + 10; // (10,10) top-left
  map[destIdx] = TileType.Destination;

  const spawnIdx = 490 * GRID_SIZE + 490; // (490,490) bottom-right
  map[spawnIdx] = TileType.Spawn;

  // Scatter 10x10 houses, avoiding spawn zone, POIs, and min spacing
  const HOUSE_SIZE = 5;
  const HOUSE_MIN_DIST = 30;
  const houseCenters: [number, number][] = [];

  for (let i = 0; i < NUM_HOUSES; ) {
    const x = Math.floor(rng() * (GRID_SIZE - HOUSE_SIZE));
    const y = Math.floor(rng() * (GRID_SIZE - HOUSE_SIZE));
    // Skip if overlaps spawn zone
    if (x + HOUSE_SIZE > GRID_SIZE - SPAWN_SAFE && y + HOUSE_SIZE > GRID_SIZE - SPAWN_SAFE) continue;
    // Skip if overlaps destination area
    if (x <= 20 && y <= 20) continue;
    // Check minimum distance from other houses
    const cx = x + HOUSE_SIZE / 2;
    const cy = y + HOUSE_SIZE / 2;
    let tooClose = false;
    for (const [hx, hy] of houseCenters) {
      if (Math.abs(cx - hx) < HOUSE_MIN_DIST && Math.abs(cy - hy) < HOUSE_MIN_DIST) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;
    // Fill house
    for (let dy = 0; dy < HOUSE_SIZE; dy++) {
      for (let dx = 0; dx < HOUSE_SIZE; dx++) {
        map[(y + dy) * GRID_SIZE + (x + dx)] = TileType.House;
      }
    }
    houseCenters.push([cx, cy]);
    i++;
  }

  return map;
}

/** Get tile at (x,y) */
export function getTile(map: Uint8Array, x: number, y: number): TileType {
  return map[y * GRID_SIZE + x] as TileType;
}
