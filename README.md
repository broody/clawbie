# Clawbie Apocalypse

Onchain real-time strategy game built on StarkNet using Dojo. **Agents vs Humans** — AI agents spawn swarms of clawbies across a procedurally generated grid while human players must survive and navigate from spawn to destination.

## Concept

- **Humans** are fragile, fast, and resourceful — they scavenge, fight, and cooperate to survive
- **Clawbies** are slow, relentless, and numerous — controlled programmatically by AI agents
- Humans degrade over time while clawbies never tire

## Game World

- 1000x1000 cell grid with procedurally generated houses, food, and weapons
- Full map visibility (blockchain state is public)
- Fixed spawn point and destination

## Players

### Humans (Player-Controlled)
- 1 human per controller (wallet), spawns at a fixed start point
- **Objective:** Reach the destination alive
- **Movement:** 2-3 cells/move normally, 1 cell/move when exhausted
- **Stamina:** Depletes over time/movement, restored by resting in houses
- **Food:** Required for survival, found in houses
- **Combat:** Ranged and melee weapons scavenged from houses

### Clawbies (Agent-Controlled)
- Up to 100 per agent, 1 cell/move, 1 HP
- Agents poll Torii indexer for state and submit multicalls to control them

### Agent Two-Tier Control
- **Strategic Mode (LLM):** Active when no humans nearby (~20 cells). Handles patrol routes, area denial, swarming formations
- **Tactical Mode (Script):** Activates on human proximity. Deterministic chase/surround/attack at transaction speed

## Tech Stack

- **Chain:** StarkNet
- **Framework:** Dojo
- **Indexer:** Torii (gRPC/GraphQL)
- **Client:** React + PixiJS + Vite
- **Agent SDK:** Direct RPC + Torii polling

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build
npm run build
```
