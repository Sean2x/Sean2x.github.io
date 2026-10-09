import { Complex, Poly, add, degree, evalReal, scale, trim } from './poly';
import { roots } from './roots';

export interface RouthResult {
  rows: number[][];
  firstColumn: number[];
  signChanges: number;
  /** Number of right-half-plane roots implied by the first column. */
  rhp: number;
  /** Which special case (if any) was hit while building the array. */
  special: 'none' | 'zeroInFirstColumn' | 'zeroRow';
  allCoefficientsPositive: boolean;
}

/** Necessary condition (I4): every coefficient must be strictly positive (after normalising the sign). */
export function coefficientsPositive(p: Poly): boolean {
  const q = trim(p);
  if (q.length < 2) return true;
  const s = Math.sign(q[0]) || 1;
  return q.every((c) => c * s > 0);
}

export function routhArray(p: Poly): RouthResult {
  const q = trim(p);
  const n = q.length - 1;
  const mag = q.reduce((m, c) => Math.max(m, Math.abs(c)), 0) || 1;
  const eps = mag * 1e-12;
  const rows: number[][] = [[], []];
  for (let i = 0; i < q.length; i += 2) rows[0].push(q[i]);
  for (let i = 1; i < q.length; i += 2) rows[1].push(q[i]);
  while (rows[1].length < rows[0].length) rows[1].push(0);
  let special: RouthResult['special'] = 'none';

  for (let i = 2; i <= n; i++) {
    const a = rows[i - 2];
    let b = rows[i - 1];
    if (b.every((v) => Math.abs(v) <= eps)) {
      // Zero row: replace with the derivative of the auxiliary polynomial from the row above.
      special = 'zeroRow';
      const order = n - (i - 2);
      b = a.map((v, k) => v * (order - 2 * k));
      rows[i - 1] = b;
    } else if (Math.abs(b[0]) <= eps) {
      if (special === 'none') special = 'zeroInFirstColumn';
      b = b.slice();
      b[0] = eps * 1e3;
      rows[i - 1] = b;
    }
    const next: number[] = [];
    for (let j = 0; j < a.length - 1 || j === 0; j++) {
      const a1 = a[j + 1] ?? 0;
      const b1 = b[j + 1] ?? 0;
      next.push((b[0] * a1 - a[0] * b1) / b[0]);
    }
    while (next.length < rows[0].length) next.push(0);
    rows.push(next);
  }
  const first = rows.map((r) => r[0]);
  let changes = 0;
  for (let i = 1; i < first.length; i++) {
    if (Math.abs(first[i]) <= eps) continue;
    let j = i - 1;
    while (j > 0 && Math.abs(first[j]) <= eps) j--;
    if (first[i] * first[j] < 0) changes++;
  }
  return {
    rows,
    firstColumn: first,
    signChanges: changes,
    rhp: changes,
    special,
    allCoefficientsPositive: coefficientsPositive(q),
  };
}

/** Even/odd parts of P(jw) as polynomials in w = omega^2: P(jw) = re(w) + j*omega*im(w). */
function evenOdd(p: Poly): { re: Poly; im: Poly } {
  const n = p.length - 1;
  const re: number[] = [];
  const im: number[] = [];
  for (let k = 0; k <= n; k++) {
    const c = p[n - k];
    if (k % 2 === 0) re[k / 2] = c * (k / 2 % 2 === 0 ? 1 : -1);
    else im[(k - 1) / 2] = c * (((k - 1) / 2) % 2 === 0 ? 1 : -1);
  }
  const toPoly = (a: number[]) => (a.length ? trim(a.map((v) => v ?? 0).reverse()) : [0]);
  return { re: toPoly(re), im: toPoly(im) };
}

export interface Crossing { K: number; omega: number }

/**
 * Gains K at which D + K*N has a root on the imaginary axis. Those are the gains that zero a Routh
 * first-column row; solving D(jw) + K N(jw) = 0 directly gives them (and the crossing frequency) in closed form.
 * omega = 0 entries are real-axis crossings through the origin.
 */
export function imaginaryCrossings(D: Poly, N: Poly): Crossing[] {
  const d = evenOdd(D);
  const nn = evenOdd(N);
  const mulP = (a: Poly, b: Poly) => {
    const out = new Array<number>(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
    return trim(out);
  };
  const out: Crossing[] = [];
  const n0 = N[N.length - 1];
  const d0 = D[D.length - 1];
  if (Math.abs(n0) > 1e-12 && Math.abs(d0) > 1e-12) out.push({ K: -d0 / n0, omega: 0 });
  // Im[D conj(N)] = omega * (Di*Nr - Dr*Ni)
  const g = add(mulP(d.im, nn.re), scale(mulP(d.re, nn.im), -1));
  if (degree(g) >= 1 || Math.abs(g[0]) > 1e-12) {
    for (const r of roots(g)) {
      if (r.im !== 0 || r.re <= 1e-9) continue;
      const w = r.re;
      const nr = evalReal(nn.re, w);
      const ni = evalReal(nn.im, w);
      const den = nr * nr + w * ni * ni;
      if (den < 1e-18) continue;
      const K = -(evalReal(d.re, w) * nr + w * evalReal(d.im, w) * ni) / den;
      if (Math.abs(K) > 1e-9) out.push({ K, omega: Math.sqrt(w) });
    }
  }
  out.sort((a, b) => a.K - b.K);
  return out;
}

export interface KInterval { lo: number; hi: number }

/** True when every root of p lies strictly in the open left half-plane. */
export function isStable(p: Poly): boolean {
  const q = trim(p);
  if (q.length < 2) return false;
  return roots(q).every((z) => z.re < -1e-9);
}

/** Open intervals of K (possibly infinite) for which D + K N is Hurwitz. */
export function stableKRanges(D: Poly, N: Poly): KInterval[] {
  const bounds = new Set<number>(imaginaryCrossings(D, N).map((c) => c.K));
  // Leading-coefficient cancellation (biproper loops) also changes the root count.
  const dl = D[0];
  const nl = N.length === D.length ? N[0] : 0;
  if (Math.abs(nl) > 1e-12) bounds.add(-dl / nl);
  bounds.add(0);
  const ks = [...bounds].sort((a, b) => a - b);
  const pts = [-Infinity, ...ks, Infinity];
  const out: KInterval[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const lo = pts[i];
    const hi = pts[i + 1];
    let mid: number;
    if (lo === -Infinity) mid = hi - Math.max(1, Math.abs(hi));
    else if (hi === Infinity) mid = lo + Math.max(1, Math.abs(lo));
    else mid = (lo + hi) / 2;
    if (isStable(add(D, scale(N, mid)))) {
      const last = out[out.length - 1];
      if (last && last.hi === lo) last.hi = hi;
      else out.push({ lo, hi });
    }
  }
  return out;
}

export const rootsOfCharacteristic = (D: Poly, N: Poly, K: number): Complex[] => roots(add(D, scale(N, K)));
