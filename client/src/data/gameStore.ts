/**
 * Minimal game data store — abstraction layer for future Torii integration.
 * Currently backed by static mock data.
 */
import { generateMap } from "../game/mapgen";
import type { Entity } from "../game/types";
import { generateMockEntities } from "./mockEntities";

const SEED = 42;

export const tileMap = generateMap(SEED);
export const entities: Entity[] = generateMockEntities(SEED);
