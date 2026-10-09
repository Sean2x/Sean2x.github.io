# PID Root Locus Explorer

- Math lives in `src/math` and must stay pure (no DOM, no state) and tested.
- Check numbers against the acceptance tests (`tests/math.test.ts`, A1–A11) before committing: `npm test`.
- State flows one way: control change → `State` → `derive()` (src/model.ts) → redraw.
- `npm run build` produces the offline single file `dist/explorer.html` (committed so GitHub Pages serves it).
- Spec: `docs/PRD.md`. Reference implementation: `prototype/`.
