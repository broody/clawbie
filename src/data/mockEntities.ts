import { createRng } from "../game/rng";
import type { Entity } from "../game/types";
import { GRID_SIZE } from "../game/types";

/**
 * Generate mock entities. Abstracted so this layer can be swapped
 * for Torii subscriptions later.
 */
export function generateMockEntities(seed: number): Entity[] {
  const rng = createRng(seed + 999);
  const entities: Entity[] = [];
  const occupied = new Set<number>();
  let id = 0;

  function key(x: number, y: number) { return y * GRID_SIZE + x; }

  // 100 humans clustered in bottom-right
  for (let i = 0; i < 100; ) {
    const x = 900 + Math.floor(rng() * 100);
    const y = 900 + Math.floor(rng() * 100);
    const k = key(x, y);
    if (occupied.has(k)) continue;
    occupied.add(k);
    entities.push({ id: id++, x, y, kind: "human" });
    i++;
  }

  // 5000 clawbies scattered randomly, excluding near human spawn
  const SAFE_RADIUS = 100;
  for (let i = 0; i < 5000; ) {
    const x = Math.floor(rng() * GRID_SIZE);
    const y = Math.floor(rng() * GRID_SIZE);
    if (x >= GRID_SIZE - SAFE_RADIUS && y >= GRID_SIZE - SAFE_RADIUS) continue;
    const k = key(x, y);
    if (occupied.has(k)) continue;
    occupied.add(k);
    entities.push({ id: id++, x, y, kind: "clawbie" });
    i++;
  }

  return entities;
}
