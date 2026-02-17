import { GRID_SIZE, TileType } from "./types";

function isPassable(
  x: number,
  y: number,
  tileMap: Uint8Array,
  occupied: Set<number>,
  tx: number,
  ty: number,
): boolean {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
  const k = y * GRID_SIZE + x;
  if (occupied.has(k) && !(x === tx && y === ty)) return false;
  const tile = tileMap[k] as TileType;
  return (
    tile === TileType.Grass ||
    tile === TileType.House ||
    tile === TileType.Spawn ||
    tile === TileType.Destination
  );
}

/**
 * Build a staircase (Bresenham-style) path from (sx,sy) toward (tx,ty).
 * Evenly interleaves x and y steps for a clean diagonal look.
 * Returns null if any cell along the way is blocked.
 */
function staircasePath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  tileMap: Uint8Array,
  occupied: Set<number>,
  maxSteps: number,
): { x: number; y: number }[] | null {
  const adx = Math.abs(tx - sx);
  const ady = Math.abs(ty - sy);
  const total = adx + ady;
  if (total === 0) return [];

  const signX = Math.sign(tx - sx);
  const signY = Math.sign(ty - sy);
  const steps = Math.min(total, maxSteps);
  const path: { x: number; y: number }[] = [];
  let cx = sx,
    cy = sy;
  let stepsX = 0;

  for (let i = 0; i < steps; i++) {
    const targetX = Math.round((adx * (i + 1)) / total);
    if (stepsX < targetX) {
      cx += signX;
      stepsX++;
    } else {
      cy += signY;
    }
    if (!isPassable(cx, cy, tileMap, occupied, tx, ty)) return null;
    path.push({ x: cx, y: cy });
  }
  return path;
}

/**
 * BFS pathfinding fallback when direct staircase is blocked.
 */
function bfsPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  tileMap: Uint8Array,
  occupied: Set<number>,
  maxSteps: number,
): { x: number; y: number }[] {
  const key = (x: number, y: number) => y * GRID_SIZE + x;
  const startKey = key(sx, sy);
  const frontier: { x: number; y: number; depth: number }[] = [
    { x: sx, y: sy, depth: 0 },
  ];
  const cameFrom = new Map<number, number>();
  cameFrom.set(startKey, -1);

  const DIRS = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  let found = false;
  let head = 0;

  while (head < frontier.length) {
    const cur = frontier[head++];
    if (cur.x === tx && cur.y === ty) {
      found = true;
      break;
    }
    if (cur.depth >= maxSteps) continue;

    for (const [dx, dy] of DIRS) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
      const nk = key(nx, ny);
      if (cameFrom.has(nk)) continue;
      if (occupied.has(nk) && !(nx === tx && ny === ty)) continue;
      const tile = tileMap[nk] as TileType;
      if (
        tile !== TileType.Grass &&
        tile !== TileType.House &&
        tile !== TileType.Spawn &&
        tile !== TileType.Destination
      )
        continue;
      cameFrom.set(nk, key(cur.x, cur.y));
      frontier.push({ x: nx, y: ny, depth: cur.depth + 1 });
    }
  }

  let endKey: number;
  if (found) {
    endKey = key(tx, ty);
  } else {
    let bestKey = -1,
      bestDist = Infinity;
    for (const [k] of cameFrom) {
      if (k === startKey) continue;
      const kx = k % GRID_SIZE;
      const ky = Math.floor(k / GRID_SIZE);
      const dist = Math.abs(kx - tx) + Math.abs(ky - ty);
      if (dist < bestDist) {
        bestDist = dist;
        bestKey = k;
      }
    }
    if (bestKey === -1) return [];
    endKey = bestKey;
  }

  const path: { x: number; y: number }[] = [];
  let cur = endKey;
  while (cur !== startKey && cur !== -1) {
    path.push({ x: cur % GRID_SIZE, y: Math.floor(cur / GRID_SIZE) });
    cur = cameFrom.get(cur)!;
  }
  path.reverse();
  return path;
}

/**
 * Find path from (sx,sy) to (tx,ty).
 * Prefers a Bresenham-style staircase for diagonal paths.
 * Falls back to BFS when the direct path is blocked.
 */
export function findPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  tileMap: Uint8Array,
  occupied: Set<number>,
  maxSteps: number,
): { x: number; y: number }[] {
  if (sx === tx && sy === ty) return [];
  if (maxSteps <= 0) return [];

  const direct = staircasePath(sx, sy, tx, ty, tileMap, occupied, maxSteps);
  if (direct !== null) return direct;

  return bfsPath(sx, sy, tx, ty, tileMap, occupied, maxSteps);
}
