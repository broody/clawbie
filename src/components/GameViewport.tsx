import { useEffect, useRef, useCallback } from "react";
import { Application, Graphics, Container, Sprite, Texture } from "pixi.js";
import { Viewport } from "pixi-viewport";
import { tileMap, entities } from "../data/gameStore";
import { GRID_SIZE, TILE_PX, TILE_COLORS, TileType } from "../game/types";
import { getTile } from "../game/mapgen";
import { findPath } from "../game/pathfinding";

const WORLD_SIZE = GRID_SIZE * TILE_PX;
const CHUNK_SIZE = 64; // tiles per chunk side
const CHUNK_PX = CHUNK_SIZE * TILE_PX;
const MAX_PATH_STEPS = 20;

// Directions: up, down, left, right
const DIRS = [
  [0, -1], [0, 1], [-1, 0], [1, 0],
] as const;

interface GameViewportProps {
  running: boolean;
  stamina: number;
  onStaminaChange: (s: number | ((prev: number) => number)) => void;
  onDeath?: () => void;
}

export default function GameViewport({ running, stamina, onStaminaChange, onDeath }: GameViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const tickRef = useRef<(() => void) | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const onDeathRef = useRef(onDeath);
  onDeathRef.current = onDeath;
  const staminaRef = useRef(stamina);
  staminaRef.current = stamina;
  const onStaminaChangeRef = useRef(onStaminaChange);
  onStaminaChangeRef.current = onStaminaChange;

  const init = useCallback(async () => {
    if (!containerRef.current || appRef.current) return;

    const app = new Application();
    await app.init({
      resizeTo: containerRef.current,
      backgroundColor: 0x1b1b1b,
      antialias: false,
    });

    // Guard against strict mode double-mount race
    if (!containerRef.current || appRef.current) {
      app.destroy();
      return;
    }

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

    vp.drag({ mouseButtons: "left" })
      .pinch()
      .wheel()
      .decelerate()
      .clampZoom({
        minScale: 0.1,
        maxScale: 3,
      });

    // Start centered on spawn (bottom-right)
    vp.moveCenter(450 * TILE_PX, 450 * TILE_PX);
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
          g.rect(
            (tx - startX) * TILE_PX,
            (ty - startY) * TILE_PX,
            TILE_PX,
            TILE_PX,
          ).fill(color);
        }
      }
    }

    // --- Sprite-based entity rendering ---
    const clawbieContainer = new Container();
    const humanContainer = new Container();
    vp.addChild(clawbieContainer);
    vp.addChild(humanContainer);

    const pixelTexture = Texture.WHITE;
    const clawbieSprites: Sprite[] = [];
    const clawbieEntities = entities.filter((e) => e.kind === "clawbie");
    const occupied = new Set<number>();
    for (const e of entities) occupied.add(e.y * GRID_SIZE + e.x);

    for (const e of entities) {
      const sprite = new Sprite(pixelTexture);
      sprite.width = TILE_PX;
      sprite.height = TILE_PX;
      sprite.x = e.x * TILE_PX;
      sprite.y = e.y * TILE_PX;
      if (e.kind === "clawbie") {
        sprite.tint = 0xef5350;
        clawbieContainer.addChild(sprite);
        clawbieSprites.push(sprite);
      } else {
        sprite.tint = 0x42a5f5;
        humanContainer.addChild(sprite);
      }
    }

    // --- Danger zone for pathfinding (occupied + 1-cell radius around clawbies) ---
    const dangerZone = new Set<number>();

    function rebuildDangerZone() {
      dangerZone.clear();
      // Copy all occupied cells
      for (const k of occupied) dangerZone.add(k);
      // Add 1-cell radius around every clawbie
      for (const e of clawbieEntities) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = e.x + dx;
            const ny = e.y + dy;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              dangerZone.add(ny * GRID_SIZE + nx);
            }
          }
        }
      }
    }
    rebuildDangerZone();

    // --- Player ---
    const player = { x: 450, y: 450, alive: true };
    occupied.add(player.y * GRID_SIZE + player.x);
    const playerSprite = new Sprite(pixelTexture);
    playerSprite.width = TILE_PX;
    playerSprite.height = TILE_PX;
    playerSprite.x = player.x * TILE_PX;
    playerSprite.y = player.y * TILE_PX;
    playerSprite.tint = 0xfdd835; // yellow
    humanContainer.addChild(playerSprite);

    function checkDeath(): boolean {
      if (getTile(tileMap, player.x, player.y) === TileType.House) return false;
      for (const e of clawbieEntities) {
        const dx = Math.abs(e.x - player.x);
        const dy = Math.abs(e.y - player.y);
        if (dx <= 1 && dy <= 1 && (dx + dy) > 0) return true;
      }
      return false;
    }

    // --- Spawn zone border ---
    const SAFE_RADIUS = 50;
    const spawnGfx = new Graphics();
    const spawnX = (GRID_SIZE - SAFE_RADIUS) * TILE_PX;
    const spawnY = (GRID_SIZE - SAFE_RADIUS) * TILE_PX;
    const spawnSize = SAFE_RADIUS * TILE_PX;
    spawnGfx
      .rect(spawnX, spawnY, spawnSize, spawnSize)
      .stroke({ color: 0x2196f3, width: 2, alpha: 0.6 });
    vp.addChild(spawnGfx);

    // --- Path preview graphics ---
    const pathGfx = new Graphics();
    vp.addChild(pathGfx);
    const destGfx = new Graphics();
    vp.addChild(destGfx);

    let currentPath: { x: number; y: number }[] = [];
    let pendingTx: { path: { x: number; y: number }[]; dest: { x: number; y: number }; cost: number } | null = null;
    let lastGridX = -1,
      lastGridY = -1;

    function updatePathFromCursor() {
      if (!player.alive || pendingTx !== null) return;
      if (lastGridX < 0 || lastGridX >= GRID_SIZE || lastGridY < 0 || lastGridY >= GRID_SIZE) return;
      const maxSteps = MAX_PATH_STEPS;
      const path = findPath(
        player.x, player.y,
        lastGridX, lastGridY,
        tileMap, dangerZone,
        maxSteps,
      );
      currentPath = path;
      drawPathPreview(path);
    }

    function drawPathPreview(path: { x: number; y: number }[]) {
      pathGfx.clear();
      for (const step of path) {
        pathGfx
          .rect(step.x * TILE_PX, step.y * TILE_PX, TILE_PX, TILE_PX)
          .fill({ color: 0xffffff, alpha: 0.35 });
      }
      if (path.length > 0) {
        const end = path[path.length - 1];
        pathGfx
          .rect(end.x * TILE_PX, end.y * TILE_PX, TILE_PX, TILE_PX)
          .fill({ color: 0xfdd835, alpha: 0.45 });
      }
    }

    function clearPathPreview() {
      pathGfx.clear();
      currentPath = [];
    }

    function cancelPendingTx() {
      pendingTx = null;
      destGfx.clear();
    }

    // --- Mouse handlers ---
    const canvas = app.canvas as HTMLCanvasElement;

    function onPointerMove(ev: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const screenX = ev.clientX - rect.left;
      const screenY = ev.clientY - rect.top;
      const worldPos = vp.toWorld(screenX, screenY);
      lastGridX = Math.floor(worldPos.x / TILE_PX);
      lastGridY = Math.floor(worldPos.y / TILE_PX);
      if (!player.alive || pendingTx !== null) return;
      updatePathFromCursor();
    }

    function onPointerDown(ev: PointerEvent) {
      if (ev.button !== 2) return; // right-click only
      if (!player.alive) return;

      // Cancel any existing pending tx
      if (pendingTx !== null) {
        cancelPendingTx();
        clearPathPreview();
        return;
      }

      if (currentPath.length === 0) return;

      const cost = currentPath.length;
      const committedPath = [...currentPath];
      const dest = committedPath[committedPath.length - 1];

      // Store pending transaction — executes on next tick
      pendingTx = { path: committedPath, dest, cost };

      // Show yellow destination marker
      destGfx.clear();
      destGfx
        .rect(dest.x * TILE_PX, dest.y * TILE_PX, TILE_PX, TILE_PX)
        .fill({ color: 0xfdd835, alpha: 0.45 });

      // Freeze path preview during wait
      clearPathPreview();
      drawPathPreview(committedPath);
    }

    function onPointerLeave() {
      if (pendingTx === null) clearPathPreview();
    }

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);

    function onContextMenu(ev: MouseEvent) { ev.preventDefault(); }
    window.addEventListener("contextmenu", onContextMenu);

    // --- Clawbie heatmap (shown when zoomed out) ---
    const HEATMAP_RES = 100;
    const CELL_SIZE = GRID_SIZE / HEATMAP_RES;
    const heatmapCanvas = document.createElement("canvas");
    heatmapCanvas.width = HEATMAP_RES;
    heatmapCanvas.height = HEATMAP_RES;
    const heatmapCtx = heatmapCanvas.getContext("2d")!;

    const density = new Uint16Array(HEATMAP_RES * HEATMAP_RES);
    let maxDensity = 0;

    function rebuildHeatmap() {
      density.fill(0);
      maxDensity = 0;
      for (const e of clawbieEntities) {
        const hcx = Math.min(Math.floor(e.x / CELL_SIZE), HEATMAP_RES - 1);
        const hcy = Math.min(Math.floor(e.y / CELL_SIZE), HEATMAP_RES - 1);
        const val = ++density[hcy * HEATMAP_RES + hcx];
        if (val > maxDensity) maxDensity = val;
      }
      const img = heatmapCtx.createImageData(HEATMAP_RES, HEATMAP_RES);
      for (let i = 0; i < density.length; i++) {
        if (density[i] === 0) continue;
        const t = density[i] / maxDensity;
        const px = i * 4;
        img.data[px] = 239;
        img.data[px + 1] = 83;
        img.data[px + 2] = 80;
        img.data[px + 3] = Math.floor(80 + 175 * t);
      }
      heatmapCtx.putImageData(img, 0, 0);
    }

    // Initial heatmap draw (before texture creation)
    rebuildHeatmap();

    const heatmapTexture = Texture.from({ resource: heatmapCanvas, scaleMode: "nearest" });
    const heatmapSprite = new Sprite(heatmapTexture);
    heatmapSprite.width = WORLD_SIZE;
    heatmapSprite.height = WORLD_SIZE;
    heatmapSprite.visible = false;
    vp.addChild(heatmapSprite);
    vp.addChild(humanContainer);

    // --- LOD switching ---
    const HEATMAP_THRESHOLD = 0.3;
    let showingHeatmap = false;

    function updateLOD() {
      const scale = vp.scale.x;
      const shouldShowHeatmap = scale < HEATMAP_THRESHOLD;
      if (shouldShowHeatmap !== showingHeatmap) {
        showingHeatmap = shouldShowHeatmap;
        clawbieContainer.visible = !showingHeatmap;
        heatmapSprite.visible = showingHeatmap;
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
      updateLOD();
    }

    // Pre-draw all tile chunks
    for (let cy = 0; cy < chunksY; cy++) {
      for (let cx = 0; cx < chunksX; cx++) {
        drawChunk(cx, cy);
      }
    }

    // --- Simulation tick ---
    const DETECT_RADIUS = 50;

    function isInSpawnZone(x: number, y: number) {
      return x >= GRID_SIZE - SAFE_RADIUS && y >= GRID_SIZE - SAFE_RADIUS;
    }

    tickRef.current = () => {
      // Execute pending player transaction (submitted via right-click)
      if (pendingTx !== null && player.alive) {
        const { dest, cost } = pendingTx;
        pendingTx = null;
        destGfx.clear();

        occupied.delete(player.y * GRID_SIZE + player.x);
        player.x = dest.x;
        player.y = dest.y;
        occupied.add(player.y * GRID_SIZE + player.x);
        playerSprite.x = dest.x * TILE_PX;
        playerSprite.y = dest.y * TILE_PX;

        staminaRef.current -= cost;
        onStaminaChangeRef.current((prev: number) => prev - cost);
      }

      const playerOutside = player.alive && !isInSpawnZone(player.x, player.y);

      for (let i = 0; i < clawbieEntities.length; i++) {
        const e = clawbieEntities[i];
        let dx: number, dy: number;

        // Check if this clawbie should chase the player
        if (playerOutside) {
          const distX = Math.abs(e.x - player.x);
          const distY = Math.abs(e.y - player.y);
          if (distX <= DETECT_RADIUS && distY <= DETECT_RADIUS) {
            // Move toward player (pick the axis with greater distance)
            const sdx = Math.sign(player.x - e.x);
            const sdy = Math.sign(player.y - e.y);
            if (distX >= distY) {
              dx = sdx; dy = 0;
            } else {
              dx = 0; dy = sdy;
            }
          } else {
            if (Math.random() > 0.3) continue;
            [dx, dy] = DIRS[Math.floor(Math.random() * 4)];
          }
        } else {
          if (Math.random() > 0.3) continue;
          [dx, dy] = DIRS[Math.floor(Math.random() * 4)];
        }

        const nx = e.x + dx;
        const ny = e.y + dy;
        if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
        if (getTile(tileMap, nx, ny) === TileType.House) continue;
        const nk = ny * GRID_SIZE + nx;
        if (occupied.has(nk)) continue;
        occupied.delete(e.y * GRID_SIZE + e.x);
        occupied.add(nk);
        e.x = nx;
        e.y = ny;
        clawbieSprites[i].x = nx * TILE_PX;
        clawbieSprites[i].y = ny * TILE_PX;
      }
      if (player.alive && checkDeath()) {
        player.alive = false;
        playerSprite.tint = 0x666666;
        onDeathRef.current?.();
      }
      // Rebuild danger zone after clawbies moved, then refresh path preview
      rebuildDangerZone();
      updatePathFromCursor();
      if (showingHeatmap) {
        rebuildHeatmap();
        heatmapTexture.source.update();
      }
    };

    vp.on("moved", updateVisibility);
    vp.on("zoomed", updateVisibility);
    updateVisibility();

    const ro = new ResizeObserver(() => {
      app.resize();
      vp.resize(app.screen.width, app.screen.height);
      updateVisibility();
    });
    ro.observe(containerRef.current);

    cleanupRef.current = () => {
      pendingTx = null;
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("contextmenu", onContextMenu);
      ro.disconnect();
    };
  }, []);

  // Pixi init/cleanup
  useEffect(() => {
    init();
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      tickRef.current = null;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [init]);

  // Simulation interval driven by `running` prop
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => tickRef.current?.(), 5000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    />
  );
}
