import { useEffect, useRef, useCallback } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { tileMap, entities } from '../data/gameStore';
import { GRID_SIZE, TILE_PX, TILE_COLORS, TileType } from '../game/types';

const WORLD_SIZE = GRID_SIZE * TILE_PX;
const CHUNK_SIZE = 64; // tiles per chunk side
const CHUNK_PX = CHUNK_SIZE * TILE_PX;

export default function GameViewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  const init = useCallback(async () => {
    if (!containerRef.current || appRef.current) return;

    const app = new Application();
    await app.init({
      resizeTo: containerRef.current,
      backgroundColor: 0x1b1b1b,
      antialias: false,
    });
    appRef.current = app;
    containerRef.current.appendChild(app.canvas as HTMLCanvasElement);

    const vp = new Viewport({
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      worldWidth: WORLD_SIZE,
      worldHeight: WORLD_SIZE,
      events: app.renderer.events,
    });
    app.stage.addChild(vp as any);

    vp.drag().pinch().wheel().decelerate().clampZoom({
      minScale: 0.02,
      maxScale: 3,
    }).clamp({ direction: 'all' });

    // Start centered on spawn
    vp.moveCenter(50 * TILE_PX, 50 * TILE_PX);
    vp.setZoom(1);

    // --- Chunked tile rendering ---
    const chunksX = Math.ceil(GRID_SIZE / CHUNK_SIZE);
    const chunksY = Math.ceil(GRID_SIZE / CHUNK_SIZE);
    const chunkContainer = new Container();
    vp.addChild(chunkContainer);

    interface ChunkData {
      gfx: Graphics;
      drawn: boolean;
    }
    const chunks: ChunkData[][] = [];
    for (let cy = 0; cy < chunksY; cy++) {
      chunks[cy] = [];
      for (let cx = 0; cx < chunksX; cx++) {
        const gfx = new Graphics();
        gfx.x = cx * CHUNK_PX;
        gfx.y = cy * CHUNK_PX;
        gfx.visible = false;
        chunkContainer.addChild(gfx);
        chunks[cy][cx] = { gfx, drawn: false };
      }
    }

    function drawChunk(cx: number, cy: number) {
      const chunk = chunks[cy][cx];
      if (chunk.drawn) return;
      chunk.drawn = true;
      const g = chunk.gfx;
      const startX = cx * CHUNK_SIZE;
      const startY = cy * CHUNK_SIZE;
      const endX = Math.min(startX + CHUNK_SIZE, GRID_SIZE);
      const endY = Math.min(startY + CHUNK_SIZE, GRID_SIZE);

      for (let ty = startY; ty < endY; ty++) {
        for (let tx = startX; tx < endX; tx++) {
          const tile = tileMap[ty * GRID_SIZE + tx] as TileType;
          const color = TILE_COLORS[tile];
          g.rect((tx - startX) * TILE_PX, (ty - startY) * TILE_PX, TILE_PX, TILE_PX).fill(color);
        }
      }
    }

    // --- Entities layer ---
    const entityGfx = new Graphics();
    vp.addChild(entityGfx);

    function drawEntities() {
      entityGfx.clear();
      const scale = vp.scale.x;
      const baseR = Math.max(2, TILE_PX * 0.4);
      for (const e of entities) {
        const color = e.kind === 'human' ? 0x42a5f5 : 0xef5350;
        const r = baseR / Math.max(scale, 0.1);
        entityGfx
          .circle(e.x * TILE_PX + TILE_PX / 2, e.y * TILE_PX + TILE_PX / 2, r)
          .fill(color);
      }
    }

    // --- Visibility culling ---
    function updateVisibility() {
      const bounds = vp.getVisibleBounds();
      const minCX = Math.max(0, Math.floor(bounds.x / CHUNK_PX));
      const minCY = Math.max(0, Math.floor(bounds.y / CHUNK_PX));
      const maxCX = Math.min(chunksX - 1, Math.floor((bounds.x + bounds.width) / CHUNK_PX));
      const maxCY = Math.min(chunksY - 1, Math.floor((bounds.y + bounds.height) / CHUNK_PX));

      for (let cy = 0; cy < chunksY; cy++) {
        for (let cx = 0; cx < chunksX; cx++) {
          const vis = cx >= minCX && cx <= maxCX && cy >= minCY && cy <= maxCY;
          chunks[cy][cx].gfx.visible = vis;
          if (vis) drawChunk(cx, cy);
        }
      }
      drawEntities();
    }

    vp.on('moved', updateVisibility);
    vp.on('zoomed', updateVisibility);
    updateVisibility();

    // Handle resize
    const ro = new ResizeObserver(() => {
      app.resize();
      vp.resize(app.screen.width, app.screen.height);
      updateVisibility();
    });
    ro.observe(containerRef.current);
  }, []);

  useEffect(() => {
    init();
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [init]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />;
}
