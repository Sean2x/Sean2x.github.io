import { Complex, Poly, cabs, cadd, cdiv, cmul, csub, evalC, trim } from './poly';

const SNAP = 1e-7;

/** Residual of p at z relative to the size of its terms. */
function relResidual(p: Poly, z: Complex): number {
  const v = evalC(p, z);
  const az = cabs(z);
  let mag = 0;
  for (let i = 0; i < p.length; i++) mag += Math.abs(p[i]) * az ** (p.length - 1 - i);
  return mag === 0 ? 0 : cabs(v) / mag;
}

/** Durand–Kerner (Weierstrass) iteration on a monic copy. Returns null if it fails to converge. */
export function durandKerner(p: Poly, maxIter = 500, guess?: Complex[]): Complex[] | null {
  const n = p.length - 1;
  if (n < 1) return [];
  const a = p.map((c) => c / p[0]);
  let radius = 0;
  for (let k = 1; k <= n; k++) radius = Math.max(radius, Math.abs(a[k]) ** (1 / k));
  radius = Math.max(radius, 1e-3);
  const z: Complex[] = [];
  if (guess && guess.length === n) {
    // Warm start (locus sweep): nudge coincident guesses apart so the iteration can separate them.
    for (let k = 0; k < n; k++) z.push({ re: guess[k].re + 1e-6 * (k + 1), im: guess[k].im + 1e-6 * (n - k) });
  } else {
    for (let k = 0; k < n; k++) {
      const ang = (2 * Math.PI * k) / n + 0.4;
      z.push({ re: radius * Math.cos(ang), im: radius * Math.sin(ang) });
    }
  }
  for (let it = 0; it < maxIter; it++) {
    let delta = 0;
    for (let i = 0; i < n; i++) {
      let den: Complex = { re: 1, im: 0 };
      for (let j = 0; j < n; j++) if (j !== i) den = cmul(den, csub(z[i], z[j]));
      if (cabs(den) < 1e-300) den = { re: 1e-300, im: 0 };
      const step = cdiv(evalC(a, z[i]), den);
      z[i] = csub(z[i], step);
      delta = Math.max(delta, cabs(step) / (1 + cabs(z[i])));
    }
    if (!isFinite(delta)) return null;
    if (delta < 1e-14) return z;
  }
  return null;
}

/** Eigenvalues of the companion matrix via shifted Hessenberg QR (EISPACK hqr). Null on failure. */
export function companionRoots(p: Poly): Complex[] | null {
  const n = p.length - 1;
  if (n < 1) return [];
  const a: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let j = 0; j < n; j++) a[0][j] = -p[j + 1] / p[0];
  for (let i = 1; i < n; i++) a[i][i - 1] = 1;

  const wr = new Array<number>(n).fill(0);
  const wi = new Array<number>(n).fill(0);
  const sign = (x: number, y: number) => (y >= 0 ? Math.abs(x) : -Math.abs(x));
  let nn = n - 1;
  let t = 0;
  let anorm = 0;
  for (let i = 0; i < n; i++) for (let j = Math.max(i - 1, 0); j < n; j++) anorm += Math.abs(a[i][j]);
  let pp = 0, q = 0, r = 0, s = 0, w = 0, x = 0, y = 0, z = 0;

  while (nn >= 0) {
    let its = 0;
    let l: number;
    do {
      for (l = nn; l >= 1; l--) {
        s = Math.abs(a[l - 1][l - 1]) + Math.abs(a[l][l]);
        if (s === 0) s = anorm;
        if (Math.abs(a[l][l - 1]) + s === s) { a[l][l - 1] = 0; break; }
      }
      x = a[nn][nn];
      if (l === nn) {
        wr[nn] = x + t; wi[nn] = 0; nn--;
      } else {
        y = a[nn - 1][nn - 1];
        w = a[nn][nn - 1] * a[nn - 1][nn];
        if (l === nn - 1) {
          pp = 0.5 * (y - x);
          q = pp * pp + w;
          z = Math.sqrt(Math.abs(q));
          x += t;
          if (q >= 0) {
            z = pp + sign(z, pp);
            wr[nn - 1] = wr[nn] = x + z;
            if (z) wr[nn] = x - w / z;
            wi[nn - 1] = wi[nn] = 0;
          } else {
            wr[nn - 1] = wr[nn] = x + pp;
            wi[nn - 1] = z; wi[nn] = -z;
          }
          nn -= 2;
        } else {
          if (its === 60) return null;
          if (its === 10 || its === 20) {
            t += x;
            for (let i = 0; i <= nn; i++) a[i][i] -= x;
            s = Math.abs(a[nn][nn - 1]) + Math.abs(a[nn - 1][nn - 2]);
            y = x = 0.75 * s;
            w = -0.4375 * s * s;
          }
          ++its;
          let m: number;
          for (m = nn - 2; m >= l; m--) {
            z = a[m][m];
            r = x - z; s = y - z;
            pp = (r * s - w) / a[m + 1][m] + a[m][m + 1];
            q = a[m + 1][m + 1] - z - r - s;
            r = a[m + 2][m + 1];
            s = Math.abs(pp) + Math.abs(q) + Math.abs(r);
            pp /= s; q /= s; r /= s;
            if (m === l) break;
            const u = Math.abs(a[m][m - 1]) * (Math.abs(q) + Math.abs(r));
            const v = Math.abs(pp) * (Math.abs(a[m - 1][m - 1]) + Math.abs(z) + Math.abs(a[m + 1][m + 1]));
            if (u + v === v) break;
          }
          for (let i = m + 2; i <= nn; i++) {
            a[i][i - 2] = 0;
            if (i !== m + 2) a[i][i - 3] = 0;
          }
          for (let k = m; k <= nn - 1; k++) {
            if (k !== m) {
              pp = a[k][k - 1];
              q = a[k + 1][k - 1];
              r = 0;
              if (k !== nn - 1) r = a[k + 2][k - 1];
              x = Math.abs(pp) + Math.abs(q) + Math.abs(r);
              if (x !== 0) { pp /= x; q /= x; r /= x; }
            }
            s = sign(Math.sqrt(pp * pp + q * q + r * r), pp);
            if (s !== 0) {
              if (k === m) {
                if (l !== m) a[k][k - 1] = -a[k][k - 1];
              } else {
                a[k][k - 1] = -s * x;
              }
              pp += s; x = pp / s; y = q / s; z = r / s; q /= pp; r /= pp;
              for (let j = k; j <= nn; j++) {
                pp = a[k][j] + q * a[k + 1][j];
                if (k !== nn - 1) { pp += r * a[k + 2][j]; a[k + 2][j] -= pp * z; }
                a[k + 1][j] -= pp * y;
                a[k][j] -= pp * x;
              }
              const mmin = nn < k + 3 ? nn : k + 3;
              for (let i = l; i <= mmin; i++) {
                pp = x * a[i][k] + y * a[i][k + 1];
                if (k !== nn - 1) { pp += z * a[i][k + 2]; a[i][k + 2] -= pp * r; }
                a[i][k + 1] -= pp * q;
                a[i][k] -= pp;
              }
            }
          }
        }
      }
    } while (l < nn - 1);
  }
  const out: Complex[] = [];
  for (let i = 0; i < n; i++) out.push({ re: wr[i], im: wi[i] });
  return out.every((c) => isFinite(c.re) && isFinite(c.im)) ? out : null;
}

const maxResidual = (p: Poly, rs: Complex[]) => rs.reduce((m, z) => Math.max(m, relResidual(p, z)), 0);

/** Canonical order (by real part, then imaginary) so results are deterministic. */
export function sortRoots(rs: Complex[]): Complex[] {
  return rs.slice().sort((u, v) => u.re - v.re || u.im - v.im);
}

/**
 * All roots of p (any real or complex-coefficient-free polynomial, highest power first).
 * Trailing zero coefficients are returned as exact roots at the origin; |imag| < 1e-7 snaps to 0.
 * Durand–Kerner handles degree <= 8; the companion-matrix QR is the fallback and the choice above that.
 */
export function roots(p: Poly, guess?: Complex[]): Complex[] {
  const scaleMax = p.reduce((m, c) => Math.max(m, Math.abs(c)), 0);
  if (scaleMax === 0) return [];
  let q = trim(p, scaleMax * 1e-14);
  let zeros = 0;
  while (q.length > 1 && Math.abs(q[q.length - 1]) <= scaleMax * 1e-14) { q = q.slice(0, -1); zeros++; }
  const out: Complex[] = Array.from({ length: zeros }, () => ({ re: 0, im: 0 }));

  const n = q.length - 1;
  let found: Complex[] = [];
  if (n === 1) found = [{ re: -q[1] / q[0], im: 0 }];
  else if (n === 2) {
    const [a, b, c] = q;
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      const qq = -0.5 * (b + (b >= 0 ? sq : -sq));
      const r1 = qq / a;
      const r2 = qq !== 0 ? c / qq : r1;
      found = [{ re: r1, im: 0 }, { re: r2, im: 0 }];
    } else {
      found = [{ re: -b / (2 * a), im: Math.sqrt(-disc) / (2 * a) }, { re: -b / (2 * a), im: -Math.sqrt(-disc) / (2 * a) }];
    }
  } else if (n > 2) {
    const warm = guess && zeros === 0 && guess.length === n ? guess : undefined;
    const tryDK = () => {
      if (warm) {
        const w = durandKerner(q, 60, warm);
        if (w && maxResidual(q, w) < 1e-9) return w;
      }
      return durandKerner(q);
    };
    const tryQR = () => companionRoots(q);
    const [first, second] = n <= 8 ? [tryDK, tryQR] : [tryQR, tryDK];
    let best = first();
    if (!best || maxResidual(q, best) > 1e-9) {
      const alt = second();
      if (alt && (!best || maxResidual(q, alt) < maxResidual(q, best))) best = alt;
    }
    found = best ?? [];
  }
  for (const z of found) {
    const im = Math.abs(z.im) < SNAP ? 0 : z.im;
    out.push(cadd({ re: z.re, im }, { re: 0, im: 0 }));
  }
  return sortRoots(out);
}
