# AGENTS.md — Clawbie Apocalypse

## Pre-commit Checklist

Always run before every check-in:

```bash
cd client && pnpm format && pnpm build
```

If either fails, fix before committing. No exceptions.

## Stack

- **Client:** Vite + React + TypeScript + PixiJS v8 + pixi-viewport
- **Contracts:** Dojo/Cairo (TBD)
- **Indexer:** Torii (TBD)

## Conventions

- Use `type` imports for type-only symbols (`import type { Foo }`)
- No TypeScript `enum` — use `as const` objects instead (erasableSyntaxOnly)
- Seeded RNG for all procedural generation (reproducible maps)
- Data layer abstracted in `src/data/` for future Torii swap
