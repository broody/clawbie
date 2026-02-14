# Clawbie Apocalypse — Product Requirements Document

## Overview

Clawbie Apocalypse is an onchain real-time strategy game built on StarkNet using the Dojo engine. The premise: **Agents vs Humans**. AI agents spawn swarms of creatures called "clawbies" across a procedurally generated grid, while human players must survive the onslaught and navigate from a spawn point to a destination.

## Core Concept

- **Humans** are fragile, fast (initially), and resourceful — they scavenge, fight, and cooperate to survive.
- **Clawbies** are slow, relentless, and numerous — controlled programmatically by AI agents via indexer polling and multicalls.
- The asymmetry creates tension: humans degrade over time while clawbies never tire.

## Game World

### Grid
- **Size:** 1000×1000 cells (fixed for v1, scaling with player count planned)
- **Generation:** Procedural — houses, food, and weapons are scattered across the map
- **Visibility:** Full map visibility for all players (blockchain state is public)

### Points of Interest
- **Spawn Point:** Fixed location where all humans enter the game
- **Destination:** Fixed location humans must reach to win
- **Abandoned Houses:** Scattered across the map; humans can rest, find food, and discover weapons

## Players

### Humans (Player-Controlled)
- **Entry:** 1 human per controller (wallet)
- **Spawn:** Fixed start point on the map
- **Objective:** Reach the destination alive
- **Cooperation:** Multiple humans can work together

#### Movement
- **Base speed:** 2–3 cells per move (TBD exact value)
- **Exhausted speed:** 1 cell per move (when stamina is depleted)

#### Stamina
- Finite resource that depletes over time/movement
- When depleted, movement slows to 1 cell per move (same as clawbies)
- Can be restored by resting in abandoned houses

#### Food
- Required for survival — humans die without food after a certain duration (TBD)
- Found in abandoned houses
- Creates urgency to explore and take risks

#### Combat
- **Ranged attacks:** Radius-based (exact range TBD)
- **Melee weapons:** Swords and similar (found in houses)
- **Guns:** Ranged weapons (found in houses)
- Weapons are finite/scavengeable

### Clawbies (Agent-Controlled)
- **Spawn:** Up to 100 per agent, placed randomly across the map
- **Movement:** 1 cell per move
- **HP:** 1 hit — dies in a single attack
- **Control:** AI agents poll an indexer for game state, then submit multicalls to move all clawbies

### Agents
- Interact with the game via indexer (Torii) for state reads and multicall transactions for writes
- Can implement any strategy: swarming, flanking, area denial, hunting
- Each agent manages up to 100 clawbies independently
- Multiple agents can participate simultaneously

## Turn System

- **Real-time** — no tick-based resolution. Moves are processed as transactions are submitted.

## Economy (v2)

- Entry fee for humans (token/ETH TBD)
- Prize pool / reward mechanics TBD

## Future Additions

- **Boss clawbies** — higher HP, special abilities
- **Dynamic map scaling** — grid grows with player count
- **Entry fees & token economy**
- **Leaderboards & match history**

## Tech Stack

- **Chain:** StarkNet
- **Framework:** Dojo
- **Indexer:** Torii (gRPC/GraphQL)
- **Client:** TBD
- **Agent SDK:** Direct RPC + Torii polling

## Open Questions

1. Exact human movement speed (2 or 3 cells?)
2. Stamina depletion rate and recovery mechanics
3. Food starvation timer duration
4. Ranged attack radius
5. House density and loot tables
6. Map procedural generation algorithm/seed
7. Human spawn and destination placement logic
8. Max agents per game / max humans per game
9. Game session lifecycle (when does a round start/end?)
10. What happens when a human dies? Respawn? Spectate? Re-enter with fee?
