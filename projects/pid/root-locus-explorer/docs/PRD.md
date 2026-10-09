# PRD: PID Root Locus Explorer
Oct 9, 2026 · Karma Lirazan

**Goal:** one screen answering "what does this gain do to the poles, and what does that do to the response?" in under a second per change. Users: controls students (Sean first), then viewers of Sean Applies Engineering videos. Non-goals: z-plane, MIMO, nonlinear sim, replacing MATLAB.

Loop: L = K·C·P = K·N/D; closed-loop poles are roots of D(s) + K·N(s). C = (Kd s² + Kp s + Ki)/s when Ki ≠ 0, else Kd s + Kp.

## Requirements (P0 must ship in v1, P1 if time, P2 later)
| ID | P | Requirement |
|---|---|---|
| C1 | P0 | Kp/Ki/Kd sliders span negative to positive (±10/±5/±5), numeric box, zero-snap |
| C2 | P0 | Ki ≠ 0 adds integrator pole; Ki = 0 removes it |
| C3 | P0 | K slider −10..+10; K<0 locus distinct color, toggleable |
| C4 | P1 | Controller forms PID/PI/PD/lead-lag, derivative filter N |
| P1 | P0 | Plant as coefficients and factored form; 4 v0 presets |
| P2 | P1 | Paste MATLAB tf string |
| L1 | P0 | Connected branches (root matching) |
| L2 | P0 | Hover: s, ζ, ωₙ, K |
| L3 | P1 | Drag closed-loop pole along branch; K updates |
| L4 | P1 | Breakaway points and imaginary-axis crossings with K |
| L5 | P1 | Asymptotes from centroid with angle labels |
| S1 | P0 | Step response + control effort u(t) |
| S2 | P0 | Stats: stability, poles, dominant ζ/ωₙ, overshoot, rise, settling, final value, stable K range |
| S3 | P1 | Ghost trace |
| I1 | P0 | Characteristic polynomial panel, coefficients colored by feeding gain |
| I2 | P0 | Pole sum / product readout, live |
| I3 | P0 | Routh array, sign changes, RHP count; flag "all positive but unstable" |
| I4 | P1 | Coefficient sign check |
| X1 | P1 | MATLAB export, JSON save/load, URL hash |
| X2 | P2 | Embed mode |

## Math notes
Polynomials are coefficient arrays, highest power first. Durand–Kerner to degree 8, companion-matrix QR fallback. Locus: K = ±1e-4..1e4 log grid, Hungarian matching, adaptive refinement at >2% view-width jumps. Hover gain K = −D(s)/N(s). Breakaway: real roots of N·D′ − N′·D. Asymptotes: centroid (Σp − Σz)/(n−m), angles (2k+1)180°/(n−m) for K>0, 2k·180°/(n−m) for K<0. Step: controllable canonical form, RK4, 6000 steps, horizon 6/|slowest Re| clamped 4–400 s.

## Architecture
Vite + TypeScript, no UI framework, Canvas 2D, Vitest. Build also emits single-file `dist/explorer.html`. Modules: `src/math/{poly,roots,locus,routh,sim}.ts`, `src/model.ts`, `src/ui/{controls,locusPlot,stepPlot,panels}.ts`, `src/io/share.ts`. Recompute < 16 ms for degree ≤ 6, else Web Worker.

## Milestones (one per session; plan first, end with passing tests + commit)
1 Scaffold + math core (A1–A4) · 2 Parity with v0 · 3 Connected branches + annotations · 4 Insight panels (A5–A7) · 5 Interaction (drag, effort, ghost) · 6 Sharing (JSON, URL, MATLAB, tf parser, embed)

## Acceptance tests (±0.005 on poles)
A1 pitch (1.151s+0.1774)/(s³+0.739s²+0.921s), Kp=1, K=1 → −0.325±1.382j, −0.088 · A2 sum −0.739, product −0.1774 · A3 sum constant in K (P only) · A4 pitch×(s+0.5)/(s+5), K=15 → −2.426±3.408j, −0.791, −0.096 · A5 1/(s²+0.6s+2), Kp=2 Ki=1 Kd=1 → −0.662±1.788j, −0.275, final value 1 · A6 s³+s²+s+10 → 2 sign changes, RHP 0.683±1.94j · A7 1/(s²−2), Kp=2 Kd=2 → stable for K>1 only · A8 1/(s²+s) breakaway s=−0.5, K=0.25 · A9 pendulum Kd=0 never stable · A10 Kp=−2 ≡ Kp=2 with K=−1 · A11 recompute+redraw < 16 ms (degree ≤ 6)

## Stretch
Pole-to-response playground; Bode/Nyquist tabs; Padé time delay; z-plane mode; LQR mode; physical animation.
