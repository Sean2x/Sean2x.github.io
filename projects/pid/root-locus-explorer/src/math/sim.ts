import { Poly, trim } from './poly';
import { roots } from './roots';

export interface StepResult {
  t: number[];
  y: number[];
  /** Why no response was produced (improper, unstable blow-up...). */
  error?: string;
}

export interface StepMetrics {
  finalValue: number;
  overshootPct: number;
  riseTime: number | null;
  settlingTime: number | null;
  peak: number;
}

export const SIM_STEPS = 6000;

/** Time horizon: 6 / |slowest real part|, clamped to 4..400 s. */
export function horizonFor(poles: { re: number }[]): number {
  const stable = poles.filter((p) => p.re < -1e-6).map((p) => -p.re);
  const unstable = poles.filter((p) => p.re > 1e-6).map((p) => p.re);
  let h = 20;
  if (unstable.length) h = 8 / Math.max(...unstable);
  else if (stable.length) h = 6 / Math.min(...stable);
  return Math.min(400, Math.max(4, h));
}

/**
 * Unit-step response of num/den. Controllable canonical form, RK4, direct feedthrough
 * stripped for biproper systems. Improper systems are refused.
 */
export function stepResponse(numIn: Poly, denIn: Poly, horizon?: number): StepResult {
  const den0 = trim(denIn);
  const num0 = trim(numIn);
  const n = den0.length - 1;
  if (n < 1) return { t: [], y: [], error: 'Need at least a first-order closed loop.' };
  if (num0.length - 1 > n) return { t: [], y: [], error: 'Improper transfer function (more zeros than poles); cannot simulate.' };
  const lead = den0[0];
  const den = den0.map((c) => c / lead);
  const numFull = new Array<number>(n + 1).fill(0);
  for (let i = 0; i < num0.length; i++) numFull[n + 1 - num0.length + i] = num0[i] / lead;
  const d = numFull[0];
  // Strip feedthrough: num - d*den has degree < n.
  const b = new Array<number>(n);
  for (let i = 0; i < n; i++) b[i] = numFull[i + 1] - d * den[i + 1];

  const poles = roots(den);
  const T = horizon ?? horizonFor(poles);
  const fastest = poles.reduce((m, p) => Math.max(m, Math.hypot(p.re, p.im)), 0);
  const dt = T / SIM_STEPS;
  const sub = Math.max(1, Math.ceil((fastest * dt) / 1.2));
  const h = dt / sub;

  // x' = A x + B u with chain-of-integrators structure; y = b_n x1 + ... + b_1 xn (+ d u).
  const x = new Array<number>(n).fill(0);
  const deriv = (xs: number[], out: number[]) => {
    for (let i = 0; i < n - 1; i++) out[i] = xs[i + 1];
    let last = 1; // unit step input
    for (let i = 0; i < n; i++) last -= den[n - i] * xs[i];
    out[n - 1] = last;
  };
  const k1 = new Array<number>(n), k2 = new Array<number>(n), k3 = new Array<number>(n), k4 = new Array<number>(n);
  const tmp = new Array<number>(n);
  const out = (xs: number[]) => {
    let y = d;
    for (let i = 0; i < n; i++) y += b[n - 1 - i] * xs[i];
    return y;
  };
  const t: number[] = [0];
  const y: number[] = [out(x)];
  for (let s = 1; s <= SIM_STEPS; s++) {
    for (let q = 0; q < sub; q++) {
      deriv(x, k1);
      for (let i = 0; i < n; i++) tmp[i] = x[i] + 0.5 * h * k1[i];
      deriv(tmp, k2);
      for (let i = 0; i < n; i++) tmp[i] = x[i] + 0.5 * h * k2[i];
      deriv(tmp, k3);
      for (let i = 0; i < n; i++) tmp[i] = x[i] + h * k3[i];
      deriv(tmp, k4);
      for (let i = 0; i < n; i++) x[i] += (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    }
    const v = out(x);
    t.push(s * dt);
    y.push(v);
    if (!isFinite(v) || Math.abs(v) > 1e9) {
      return { t, y, error: 'Response diverges (unstable).' };
    }
  }
  return { t, y };
}

/** DC gain num(0)/den(0); null when den(0) = 0 (integrator in the loop or a pole at the origin). */
export function dcGain(num: Poly, den: Poly): number | null {
  const d0 = den[den.length - 1];
  return Math.abs(d0) < 1e-12 ? null : num[num.length - 1] / d0;
}

export function stepMetrics(t: number[], y: number[], finalHint: number | null): StepMetrics | null {
  if (y.length < 2) return null;
  const fv = finalHint ?? y[y.length - 1];
  const peak = Math.max(...y.map((v) => (fv >= 0 ? v : -v))) * (fv >= 0 ? 1 : -1);
  const overshootPct = Math.abs(fv) > 1e-9 ? Math.max(0, ((peak - fv) / Math.abs(fv)) * 100) : 0;
  let riseTime: number | null = null;
  if (Math.abs(fv) > 1e-9) {
    const lo = 0.1 * fv, hi = 0.9 * fv;
    let tLo: number | null = null;
    for (let i = 0; i < y.length; i++) {
      if (tLo === null && (fv > 0 ? y[i] >= lo : y[i] <= lo)) tLo = t[i];
      if (tLo !== null && (fv > 0 ? y[i] >= hi : y[i] <= hi)) { riseTime = t[i] - tLo; break; }
    }
  }
  let settlingTime: number | null = null;
  if (Math.abs(fv) > 1e-9) {
    const band = 0.02 * Math.abs(fv);
    let last = -1;
    for (let i = 0; i < y.length; i++) if (Math.abs(y[i] - fv) > band) last = i;
    if (last < y.length - 1) settlingTime = last < 0 ? 0 : t[last + 1];
  }
  return { finalValue: fv, overshootPct, riseTime, settlingTime, peak };
}

