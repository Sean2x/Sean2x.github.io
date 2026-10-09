// Single state object plus everything derived from it. One-way flow:
// control change -> mutate State -> derive() -> redraw.
import { Complex, Poly, add, cabs, degree, mul, scale, trim } from './math/poly';
import { roots } from './math/roots';
import {
  Asymptotes, Breakaway, LocusData, asymptotes, breakawayPoints, sweepLocus,
} from './math/locus';
import {
  Crossing, KInterval, RouthResult, coefficientsPositive, imaginaryCrossings, routhArray, stableKRanges,
} from './math/routh';
import { StepMetrics, StepResult, dcGain, horizonFor, stepMetrics, stepResponse } from './math/sim';

export type ControllerForm = 'pid' | 'pi' | 'pd' | 'lead';
export type GainName = 'Kp' | 'Ki' | 'Kd';

export interface State {
  plant: { num: Poly; den: Poly };
  ctrl: { form: ControllerForm; Kp: number; Ki: number; Kd: number; N: number; z: number; p: number };
  K: number;
  showNeg: boolean;
  showAsym: boolean;
  /** Which signal the step plot shows: output y(t) or control effort u(t). */
  tab: 'y' | 'u';
}

export const SLIDER_RANGE = { Kp: 10, Ki: 5, Kd: 5, K: 10 } as const;

export interface Preset { name: string; num: Poly; den: Poly }
export const PRESETS: Preset[] = [
  { name: 'Aircraft pitch', num: [1.151, 0.1774], den: [1, 0.739, 0.921, 0] },
  { name: 'Stable 2nd order', num: [1], den: [1, 0.6, 2] },
  { name: 'Unstable pendulum', num: [1], den: [1, 0, -2] },
  { name: 'RHP zero', num: [-1, 1], den: [1, 3, 2] },
];

export function defaultState(): State {
  return {
    plant: { num: PRESETS[0].num.slice(), den: PRESETS[0].den.slice() },
    ctrl: { form: 'pid', Kp: 1, Ki: 0, Kd: 0, N: 0, z: 0.5, p: 5 },
    K: 1,
    showNeg: true,
    showAsym: true,
    tab: 'y',
  };
}

export interface Controller {
  /** Numerator pieces: Cn = sum(gain[name] * terms[name]). */
  terms: { name: GainName; gain: number; poly: Poly }[];
  Cn: Poly;
  Cd: Poly;
  hasIntegrator: boolean;
}

/** Build C = Cn/Cd from the controller settings. Ki != 0 adds the pole at the origin; Ki = 0 removes it. */
export function buildController(c: State['ctrl']): Controller {
  if (c.form === 'lead') {
    const terms = [{ name: 'Kp' as GainName, gain: c.Kp, poly: [1, c.z] }];
    return { terms, Cn: scale([1, c.z], c.Kp), Cd: [1, c.p], hasIntegrator: false };
  }
  const Ki = c.form === 'pd' ? 0 : c.Ki;
  const Kd = c.form === 'pi' ? 0 : c.Kd;
  const hasI = Ki !== 0;
  const filt = c.N > 0 && Kd !== 0;
  const integ: Poly = hasI ? [1, 0] : [1];
  const Cd = filt ? mul(integ, [1, c.N]) : integ;
  const terms: Controller['terms'] = [];
  if (c.Kp !== 0 || (!hasI && Kd === 0)) terms.push({ name: 'Kp', gain: c.Kp, poly: Cd });
  if (hasI) terms.push({ name: 'Ki', gain: Ki, poly: filt ? [1, c.N] : [1] });
  if (Kd !== 0) terms.push({ name: 'Kd', gain: Kd, poly: filt ? scale(mul(hasI ? [1, 0] : [1], [1, 0]), c.N) : mul(integ, [1, 0]) });
  const Cn = terms.reduce<Poly>((acc, t) => add(acc, scale(t.poly, t.gain)), [0]);
  return { terms, Cn, Cd, hasIntegrator: hasI };
}

export interface Derived {
  ctrl: Controller;
  /** Loop numerator/denominator: L = K * N / D. */
  N: Poly;
  D: Poly;
  /** Closed-loop characteristic polynomial D + K N and its roots. */
  ch: Poly;
  poles: Complex[];
  openPoles: Complex[];
  openZeros: Complex[];
  locusPos: LocusData;
  locusNeg: LocusData;
  breakaway: Breakaway[];
  crossings: Crossing[];
  asym: Asymptotes | null;
  stableRanges: KInterval[];
  routh: RouthResult;
  signCheckFails: boolean;
  step: StepResult | null;
  effort: StepResult | null;
  metrics: StepMetrics | null;
  stable: boolean;
  dominant: { zeta: number; wn: number } | null;
  error: string | null;
  /** Half-width of the root-locus view that frames the interesting features. */
  span: number;
  computeMs: number;
}

interface Cache { key: string; locusPos: LocusData; locusNeg: LocusData; breakaway: Breakaway[]; crossings: Crossing[]; asym: Asymptotes | null; ranges: KInterval[]; span: number; openPoles: Complex[]; openZeros: Complex[] }
let cache: Cache | null = null;

const EMPTY: LocusData = { K: [], roots: [], branches: 0 };

function frameSpan(pts: Complex[]): number {
  let m = 0;
  for (const p of pts) m = Math.max(m, Math.abs(p.re), Math.abs(p.im) * 1.0);
  return Math.max(m * 1.25, 1);
}

export function derive(s: State): Derived {
  const t0 = performance.now();
  const ctrl = buildController(s.ctrl);
  const N = trim(mul(ctrl.Cn, s.plant.num));
  const D = trim(mul(ctrl.Cd, s.plant.den));
  const K = s.K;
  const ch = trim(add(D, scale(N, K)));
  const improper = degree(N) > degree(D);
  const nIsZero = N.length === 1 && N[0] === 0;

  const key = JSON.stringify([N, D]);
  if (!cache || cache.key !== key) {
    const openPoles = roots(D);
    const openZeros = nIsZero ? [] : roots(N);
    const span = frameSpan([...openPoles, ...openZeros]);
    let breakaway: Breakaway[] = [];
    let crossings: Crossing[] = [];
    let ranges: KInterval[] = [];
    let asym: Asymptotes | null = null;
    let locusPos = EMPTY, locusNeg = EMPTY;
    if (!improper && !nIsZero) {
      breakaway = breakawayPoints(D, N);
      crossings = imaginaryCrossings(D, N);
      ranges = stableKRanges(D, N);
      asym = asymptotes(D, N);
      const extra = [...breakaway.map((b) => ({ re: b.s, im: 0 })), ...crossings.map((c) => ({ re: 0, im: c.omega }))];
      const sp = frameSpan([...openPoles, ...openZeros, ...extra]);
      const opts = { tol: 0.02 * 2 * sp, region: 3 * sp };
      locusPos = sweepLocus(D, N, 1, opts);
      locusNeg = sweepLocus(D, N, -1, opts);
      cache = { key, locusPos, locusNeg, breakaway, crossings, asym, ranges, span: sp, openPoles, openZeros };
    } else {
      cache = { key, locusPos, locusNeg, breakaway, crossings, asym, ranges, span, openPoles, openZeros };
    }
  }
  const c = cache;

  const poles = roots(ch);
  const stable = poles.length > 0 && poles.every((p) => p.re < -1e-9);
  const routh = routhArray(ch);
  const signCheckFails = !coefficientsPositive(ch);

  let step: StepResult | null = null;
  let effort: StepResult | null = null;
  let metrics: StepMetrics | null = null;
  let error: string | null = null;
  if (improper) error = 'Improper loop (controller + plant have more zeros than poles); only the algebra panels apply.';
  else if (nIsZero || K === 0) error = null;
  if (!improper && !nIsZero && K !== 0 && degree(ch) >= 1) {
    const T = horizonFor(poles);
    const numT = scale(N, K);
    step = stepResponse(numT, ch, T);
    if (s.tab === 'u') effort = stepResponse(scale(mul(ctrl.Cn, s.plant.den), K), ch, T);
    if (step.error && step.y.length === 0) error = step.error;
    if (stable) {
      const dc = dcGain(numT, ch);
      metrics = stepMetrics(step.t, step.y, dc);
    }
  }

  const complexPoles = poles.filter((p) => p.im > 1e-9 && p.re < 0).sort((a, b) => b.re - a.re);
  const slowestReal = poles.filter((p) => p.im === 0 && p.re < 0).sort((a, b) => b.re - a.re)[0];
  let dominant: Derived['dominant'] = null;
  const dp = complexPoles[0];
  if (stable && dp && (!slowestReal || dp.re >= slowestReal.re)) {
    const wn = cabs(dp);
    dominant = { zeta: -dp.re / wn, wn };
  } else if (stable && slowestReal) {
    dominant = { zeta: 1, wn: -slowestReal.re };
  }

  return {
    ctrl, N, D, ch, poles,
    openPoles: c.openPoles, openZeros: c.openZeros,
    locusPos: c.locusPos, locusNeg: c.locusNeg,
    breakaway: c.breakaway, crossings: c.crossings, asym: c.asym,
    stableRanges: c.ranges, routh, signCheckFails,
    step, effort, metrics, stable, dominant, error, span: c.span,
    computeMs: performance.now() - t0,
  };
}
