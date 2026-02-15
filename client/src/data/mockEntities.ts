import { createRng } from '../game/rng';
import { Entity, GRID_SIZE } from '../game/types';

/**
 * Generate mock entities. Abstracted so this layer can be swapped
 * for Torii subscriptions later.
 */
export function generateMockEntities(seed: number): Entity[] {
  const rng = createRng(seed + 999);
  const entities: Entity[] = [];
  let id = 0;

  // 5 humans
  for (let i = 0; i < 5; i++) {
    entities.push({
      id: id++,
      x: Math.floor(rng() * GRID_SIZE),
      y: Math.floor(rng() * GRID_SIZE),
      kind: 'human',
    });
  }

  // 200 clawbies
  for (let i = 0; i < 200; i++) {
    entities.push({
      id: id++,
      x: Math.floor(rng() * GRID_SIZE),
      y: Math.floor(rng() * GRID_SIZE),
      kind: 'clawbie',
    });
  }

  return entities;
}
