import { createRng } from './rng';
import { GRID_SIZE, TileType } from './types';

const HOUSE_DENSITY = 0.02;

/**
 * Generate the tile map as a flat Uint8Array (row-major).
 * Only stores tile type per cell — lightweight for 1M cells (~1 MB).
 */
export function generateMap(seed: number): Uint8Array {
  const rng = createRng(seed);
  const map = new Uint8Array(GRID_SIZE * GRID_SIZE);

  for (let i = 0; i < map.length; i++) {
    map[i] = rng() < HOUSE_DENSITY ? TileType.House : TileType.Grass;
  }

  // Fixed POIs
  const spawnIdx = 50 * GRID_SIZE + 50; // (50,50)
  map[spawnIdx] = TileType.Spawn;

  const destIdx = 950 * GRID_SIZE + 950; // (950,950)
  map[destIdx] = TileType.Destination;

  return map;
}

/** Get tile at (x,y) */
export function getTile(map: Uint8Array, x: number, y: number): TileType {
  return map[y * GRID_SIZE + x] as TileType;
}
