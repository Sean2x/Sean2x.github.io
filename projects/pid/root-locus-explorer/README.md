# PID Root Locus Explorer

Move a PID gain; see the root locus, closed-loop poles, step response, characteristic polynomial, pole sum/product and Routh array change together.

```
npm install
npm run dev      # dev server
npm test         # math + acceptance tests A1–A11
npm run build    # dist/explorer.html — single file, opens offline
```

Status vs `docs/PRD.md`: milestones 1–4 done, plus drag-pole (L3), control effort (S1), ghost trace (S3), JSON / URL-hash / MATLAB export (X1), tf-string parser (P2), embed mode (X2, `#embed` or Esc to exit).
Not yet: v0 prototype file in `prototype/`; locus sweep is on the main thread (≈18 ms cold for a degree-4 loop, <2 ms when only K changes) — move to a Web Worker if it feels laggy.
