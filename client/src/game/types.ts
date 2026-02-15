export const GRID_SIZE = 1000;
export const TILE_PX = 16; // pixels per tile at zoom=1

export enum TileType {
  Grass = 0,
  House = 1,
  Spawn = 2,
  Destination = 3,
}

export const TILE_COLORS: Record<TileType, number> = {
  [TileType.Grass]: 0x4caf50,
  [TileType.House]: 0x795548,
  [TileType.Spawn]: 0x2196f3,
  [TileType.Destination]: 0xffc107,
};

export interface Entity {
  id: number;
  x: number;
  y: number;
  kind: 'human' | 'clawbie';
}
