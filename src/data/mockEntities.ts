import { createRng } from "../game/rng";
import type { Entity } from "../game/types";
import { GRID_SIZE, TileType } from "../game/types";

/**
 * Generate mock entities. Abstracted so this layer can be swapped
 * for Torii subscriptions later.
 */
export function generateMockEntities(seed: number, tileMap: Uint8Array): Entity[] {
  const rng = createRng(seed + 999);
  const entities: Entity[] = [];
  const occupied = new Set<number>();
  let id = 0;

  function key(x: number, y: number) { return y * GRID_SIZE + x; }

  // 50 humans clustered in bottom-right
  for (let i = 0; i < 50; ) {
    const x = 450 + Math.floor(rng() * 50);
    const y = 450 + Math.floor(rng() * 50);
    const k = key(x, y);
    if (occupied.has(k)) continue;
    occupied.add(k);
    entities.push({ id: id++, x, y, kind: "human" });
    i++;
  }

  // 2500 clawbies scattered randomly, excluding spawn zone and houses
  const SAFE_RADIUS = 50;
  for (let i = 0; i < 2500; ) {
    const x = Math.floor(rng() * GRID_SIZE);
    const y = Math.floor(rng() * GRID_SIZE);
    if (x >= GRID_SIZE - SAFE_RADIUS && y >= GRID_SIZE - SAFE_RADIUS) continue;
    if (tileMap[y * GRID_SIZE + x] === TileType.House) continue;
    const k = key(x, y);
    if (occupied.has(k)) continue;
    occupied.add(k);
    entities.push({ id: id++, x, y, kind: "clawbie" });
    i++;
  }

  return entities;
}
