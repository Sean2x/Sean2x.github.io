import { Complex, Poly, add, cabs, cdiv, deriv, evalC, evalReal, degree, mul, scale, sub, trim } from './poly';
import { roots } from './roots';

/** Cost-minimising assignment (Hungarian algorithm). Returns col index for each row. */
export function assign(cost: number[][]): number[] {
  const n = cost.length;
  const INF = 1e300;
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(n + 1).fill(0);
  const p = new Array<number>(n + 1).fill(0);
  const way = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(n + 1).fill(INF);
    const used = new Array<boolean>(n + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF;
      let j1 = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const cur = cost[i0 - 1][j - 1] - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const res = new Array<number>(n).fill(0);
  for (let j = 1; j <= n; j++) res[p[j] - 1] = j - 1;
  return res;
}

/** Reorder `next` so that next[i] is the root continuing prev[i]. */
export function matchRoots(prev: Complex[], next: Complex[]): Complex[] {
  const cost = prev.map((a) => next.map((b) => Math.hypot(a.re - b.re, a.im - b.im)));
  const a = assign(cost);
  return a.map((j) => next[j]);
}

export interface LocusData {
  /** Gain at each sample (signed; first sample is K = 0). */
  K: number[];
  /** roots[k][b]: position of branch b at sample k. */
  roots: Complex[][];
  branches: number;
}

export interface SweepOptions {
  steps?: number;
  kmin?: number;
  kmax?: number;
  /** Largest allowed jump (in s-plane units) before a step is subdivided; 2% of the view width. */
  tol?: number;
  /** Half-width of the region where refinement is worth the cost. */
  region?: number;
}

/** Characteristic polynomial D + K N. */
export const charPoly = (D: Poly, N: Poly, K: number): Poly => add(D, scale(N, K));

/**
 * Sweep K from 0 out to +/-kmax on a log grid, matching roots step to step so each
 * branch is a connected curve. Steps that jump more than `tol` are subdivided.
 */
export function sweepLocus(D: Poly, N: Poly, sign: 1 | -1, opts: SweepOptions = {}): LocusData {
  const { steps = 320, kmin = 1e-4, kmax = 1e4, tol = 0.2, region = 20 } = opts;
  const dT = trim(D);
  const n = dT.length - 1;
  if (n < 1 || degree(N) > n) return { K: [], roots: [], branches: 0 };
  const maxPts = 4000;
  const K: number[] = [0];
  const R: Complex[][] = [roots(dT)];
  if (R[0].length !== n) return { K: [], roots: [], branches: 0 };

  type Pt = { K: number; r: Complex[] };
  const solve = (k: number, guess?: Complex[]): Complex[] | null => {
    const p = trim(charPoly(dT, N, k), 1e-12 * Math.max(1, Math.abs(k)));
    if (p.length - 1 !== n) return null;
    const r = roots(p, guess);
    return r.length === n ? r : null;
  };
  const advance = (a: Pt, kb: number, depth: number): Pt | null => {
    const raw = solve(kb, a.r);
    if (!raw) return null;
    const rb = matchRoots(a.r, raw);
    // Only branches that stay inside the view count: a branch racing off to infinity would otherwise
    // force endless subdivision.
    let jump = 0;
    for (let i = 0; i < n; i++) {
      if (cabs(rb[i]) < region && cabs(a.r[i]) < region) {
        jump = Math.max(jump, Math.hypot(rb[i].re - a.r[i].re, rb[i].im - a.r[i].im));
      }
    }
    if (jump > tol && depth < 6 && K.length < maxPts) {
      const km = a.K === 0 ? kb / 4 : Math.sign(kb) * Math.sqrt(Math.abs(a.K * kb));
      const m = advance(a, km, depth + 1);
      return m ? advance(m, kb, depth + 1) ?? m : null;
    }
    K.push(kb);
    R.push(rb);
    return { K: kb, r: rb };
  };

  let cur: Pt = { K: 0, r: R[0] };
  const ratio = Math.pow(kmax / kmin, 1 / (steps - 1));
  for (let i = 0; i < steps; i++) {
    const k = sign * kmin * Math.pow(ratio, i);
    const nxt = advance(cur, k, 0);
    if (nxt) cur = nxt;
  }
  return { K, roots: R, branches: n };
}

/** Gain that would place a closed-loop pole at s: K = -D(s)/N(s). */
export function gainAt(D: Poly, N: Poly, s: Complex): Complex {
  const nv = evalC(N, s);
  const dv = evalC(D, s);
  const k = cdiv(dv, nv);
  return { re: -k.re, im: -k.im };
}

export interface Breakaway { s: number; K: number }

/** Real roots of N D' - N' D = 0 (repeated closed-loop roots), with the K that puts them there. */
export function breakawayPoints(D: Poly, N: Poly): Breakaway[] {
  const g = sub(mul(N, deriv(D)), mul(deriv(N), D));
  if (degree(g) < 1) return [];
  const out: Breakaway[] = [];
  for (const r of roots(g)) {
    if (r.im !== 0) continue;
    const nv = evalReal(N, r.re);
    if (Math.abs(nv) < 1e-12) continue;
    const K = -evalReal(D, r.re) / nv;
    if (Math.abs(K) < 1e-9) continue; // that is just an open-loop pole
    out.push({ s: r.re, K });
  }
  return out.sort((a, b) => a.s - b.s);
}

export interface Asymptotes { centroid: number; anglesPos: number[]; anglesNeg: number[]; count: number }

/** n - m asymptotes from the centroid; angles in degrees. Null when n == m. */
export function asymptotes(D: Poly, N: Poly): Asymptotes | null {
  const d = trim(D);
  const nn = trim(N);
  const n = d.length - 1;
  const m = nn.length - 1;
  const count = n - m;
  if (count < 1 || (nn.length === 1 && nn[0] === 0)) return null;
  const sumP = -d[1] / d[0];
  const sumZ = m >= 1 ? -nn[1] / nn[0] : 0;
  const anglesPos: number[] = [];
  const anglesNeg: number[] = [];
  for (let k = 0; k < count; k++) {
    anglesPos.push((((2 * k + 1) * 180) / count) % 360);
    anglesNeg.push(((2 * k * 180) / count) % 360);
  }
  return { centroid: (sumP - sumZ) / count, anglesPos, anglesNeg, count };
}

/**
 * Closest point of the locus to s, with the interpolated gain there.
 * Used for hover snapping and for dragging a pole along its branch.
 */
export function nearestOnLocus(
  data: LocusData[],
  s: Complex,
): { K: number; point: Complex; dist: number } | null {
  let best: { K: number; point: Complex; dist: number } | null = null;
  for (const L of data) {
    for (let b = 0; b < L.branches; b++) {
      for (let k = 0; k + 1 < L.K.length; k++) {
        const p = L.roots[k][b];
        const q = L.roots[k + 1][b];
        const dx = q.re - p.re;
        const dy = q.im - p.im;
        const len2 = dx * dx + dy * dy;
        let t = len2 > 0 ? ((s.re - p.re) * dx + (s.im - p.im) * dy) / len2 : 0;
        t = Math.max(0, Math.min(1, t));
        const px = p.re + t * dx;
        const py = p.im + t * dy;
        const dist = Math.hypot(s.re - px, s.im - py);
        if (!best || dist < best.dist) {
          best = { K: L.K[k] + t * (L.K[k + 1] - L.K[k]), point: { re: px, im: py }, dist };
        }
      }
    }
  }
  return best;
}
