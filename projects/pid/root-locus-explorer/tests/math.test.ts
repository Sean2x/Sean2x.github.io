import { describe, expect, it } from 'vitest';
import { Complex, mul, scale } from '../src/math/poly';
import { roots } from '../src/math/roots';
import { breakawayPoints, charPoly, sweepLocus, asymptotes } from '../src/math/locus';
import { routhArray, stableKRanges, imaginaryCrossings } from '../src/math/routh';
import { stepResponse, dcGain, stepMetrics } from '../src/math/sim';
import { parseTransferFunction, parseRootList } from '../src/math/parse';
import { PRESETS, buildController, defaultState, derive } from '../src/model';

const pitchN = [1.151, 0.1774];
const pitchD = [1, 0.739, 0.921, 0];

function expectPoles(actual: Complex[], expected: [number, number][], tol = 0.005) {
  expect(actual.length).toBe(expected.length);
  const left = actual.slice();
  for (const [re, im] of expected) {
    const i = left.findIndex((z) => Math.abs(z.re - re) < tol && Math.abs(z.im - im) < tol);
    expect(i, `pole ${re}${im >= 0 ? '+' : ''}${im}j in ${JSON.stringify(left)}`).toBeGreaterThanOrEqual(0);
    left.splice(i, 1);
  }
}

describe('roots', () => {
  it('handles repeated and origin roots', () => {
    expectPoles(roots([1, 0, 0]), [[0, 0], [0, 0]]);
    expectPoles(roots([1, 2, 1]), [[-1, 0], [-1, 0]], 1e-4);
  });
  it('companion fallback agrees with Durand-Kerner on a degree-10 polynomial', () => {
    let p = [1];
    for (let k = 1; k <= 10; k++) p = mul(p, [1, k]);
    const r = roots(p).map((z) => z.re).sort((a, b) => a - b);
    r.forEach((v, i) => expect(v).toBeCloseTo(-(10 - i), 3));
  });
});

describe('acceptance A1-A10', () => {
  it('A1: pitch plant, Kp=1, K=1', () => {
    expectPoles(roots(charPoly(pitchD, pitchN, 1)), [[-0.325, 1.382], [-0.325, -1.382], [-0.088, 0]]);
  });
  it('A2: sum and product of poles', () => {
    const ch = charPoly(pitchD, pitchN, 1);
    const r = roots(ch);
    expect(r.reduce((s, z) => s + z.re, 0)).toBeCloseTo(-0.739, 3);
    expect(-ch[3] / ch[0] * -1).toBeCloseTo(0.1774, 4); // (-1)^3 * a0 product = -0.1774
    const prod = r.reduce((acc, z) => ({ re: acc.re * z.re - acc.im * z.im, im: acc.re * z.im + acc.im * z.re }), { re: 1, im: 0 });
    expect(prod.re).toBeCloseTo(-0.1774, 3);
  });
  it('A3: sum of poles is independent of K (relative degree 2)', () => {
    for (const K of [0.1, 1, 7, 40, 300]) {
      const sum = roots(charPoly(pitchD, pitchN, K)).reduce((s, z) => s + z.re, 0);
      expect(sum).toBeCloseTo(-0.739, 3);
    }
  });
  it('A4: pitch with lead (s+0.5)/(s+5), K=15', () => {
    const N = mul(pitchN, [1, 0.5]);
    const D = mul(pitchD, [1, 5]);
    expectPoles(roots(charPoly(D, N, 15)), [[-2.426, 3.408], [-2.426, -3.408], [-0.791, 0], [-0.096, 0]]);
  });
  it('A5: PID on 1/(s^2+0.6s+2) with integrator, final value 1', () => {
    const s = defaultState();
    s.plant = { num: [1], den: [1, 0.6, 2] };
    s.ctrl = { ...s.ctrl, form: 'pid', Kp: 2, Ki: 1, Kd: 1 };
    s.K = 1;
    const d = derive(s);
    expectPoles(d.poles, [[-0.662, 1.788], [-0.662, -1.788], [-0.275, 0]]);
    expect(d.metrics!.finalValue).toBeCloseTo(1, 3);
    expect(d.step!.y[d.step!.y.length - 1]).toBeCloseTo(1, 2);
  });
  it('A6: s^3+s^2+s+10 has 2 sign changes despite positive coefficients', () => {
    const p = [1, 1, 1, 10];
    const r = routhArray(p);
    expect(r.signChanges).toBe(2);
    expect(r.rhp).toBe(2);
    expect(r.allCoefficientsPositive).toBe(true);
    expectPoles(roots(p).filter((z) => z.re > 0), [[0.683, 1.94], [0.683, -1.94]], 0.01);
  });
  it('A7: pendulum with Kp=2, Kd=2 is stable for K>1 only', () => {
    const s = defaultState();
    s.plant = { num: [1], den: [1, 0, -2] };
    s.ctrl = { ...s.ctrl, Kp: 2, Ki: 0, Kd: 2 };
    const d = derive(s);
    expect(d.stableRanges.length).toBe(1);
    expect(d.stableRanges[0].lo).toBeCloseTo(1, 6);
    expect(d.stableRanges[0].hi).toBe(Infinity);
    s.K = 1;
    expect(derive(s).poles.some((z) => Math.abs(z.re) < 1e-6)).toBe(true);
  });
  it('A8: 1/(s^2+s) breaks away at s=-0.5, K=0.25', () => {
    const b = breakawayPoints([1, 1, 0], [1]);
    expect(b).toHaveLength(1);
    expect(b[0].s).toBeCloseTo(-0.5, 6);
    expect(b[0].K).toBeCloseTo(0.25, 6);
  });
  it('A9: pendulum with Kd=0 is never stable', () => {
    for (const Kp of [0.5, 2, -3, 50]) {
      expect(stableKRanges([1, 0, -2], [Kp])).toEqual([]);
    }
  });
  it('A10: Kp=-2 equals Kp=+2 with K=-1', () => {
    const a = roots(charPoly([1, 0.6, 2], scale([1], -2), 1));
    const b = roots(charPoly([1, 0.6, 2], scale([1], 2), -1));
    expectPoles(a, b.map((z) => [z.re, z.im]), 1e-9);
  });
});

describe('locus', () => {
  it('branches are connected: no step is longer than the refinement tolerance in view', () => {
    const L = sweepLocus([1, 0.739, 0.921, 0], pitchN, 1, { tol: 0.2, region: 5 });
    expect(L.branches).toBe(3);
    for (let k = 1; k < L.K.length; k++) {
      for (let b = 0; b < 3; b++) {
        const a = L.roots[k - 1][b], c = L.roots[k][b];
        if (Math.hypot(a.re, a.im) < 5) expect(Math.hypot(c.re - a.re, c.im - a.im)).toBeLessThan(1.5);
      }
    }
  });
  it('asymptotes: 3 poles, 1 zero -> 2 asymptotes at +/-90 deg', () => {
    const a = asymptotes(pitchD, pitchN)!;
    expect(a.count).toBe(2);
    expect(a.anglesPos).toEqual([90, 270]);
    expect(a.centroid).toBeCloseTo((-0.739 + 0.1774 / 1.151) / 2, 6);
  });
  it('imaginary-axis crossing of s(s+1)(s+2) at K=6, w=sqrt2', () => {
    const c = imaginaryCrossings(mul([1, 0], mul([1, 1], [1, 2])), [1]);
    const pos = c.find((x) => x.omega > 0)!;
    expect(pos.K).toBeCloseTo(6, 6);
    expect(pos.omega).toBeCloseTo(Math.SQRT2, 6);
  });
});

describe('sim and parse', () => {
  it('first-order step response', () => {
    const r = stepResponse([1], [1, 1], 5);
    expect(r.y[r.y.length - 1]).toBeCloseTo(1 - Math.exp(-5), 4);
    const m = stepMetrics(r.t, r.y, dcGain([1], [1, 1]))!;
    expect(m.settlingTime!).toBeCloseTo(Math.log(50), 1);
  });
  it('biproper feedthrough is stripped correctly', () => {
    const r = stepResponse([1, 0], [1, 1], 5); // s/(s+1): jumps to 1 then decays
    expect(r.y[0]).toBeCloseTo(1, 6);
    expect(r.y[r.y.length - 1]).toBeCloseTo(Math.exp(-5), 3);
  });
  it('refuses improper systems', () => {
    expect(stepResponse([1, 0, 0], [1, 1]).error).toMatch(/Improper/);
  });
  it('parses a MATLAB tf string', () => {
    const t = parseTransferFunction('(1.151*s+0.1774)/(s^3+0.739*s^2+0.921*s)');
    expect(t.num).toEqual([1.151, 0.1774]);
    expect(t.den).toEqual([1, 0.739, 0.921, 0]);
    expect(parseTransferFunction('2s/(s+1)^2').den).toEqual([1, 2, 1]);
    expect(() => parseTransferFunction('1/(s+')).toThrow();
  });
  it('parses factored roots', () => {
    expect(parseRootList('-1, -2+3j')).toEqual([{ re: -1, im: 0 }, { re: -2, im: 3 }]);
  });
});

describe('model', () => {
  it('Ki != 0 adds the integrator pole; Ki = 0 removes it (C2)', () => {
    const s = defaultState();
    s.plant = { num: [1], den: [1, 3, 2] };
    s.ctrl.Ki = 1; expect(buildController(s.ctrl).hasIntegrator).toBe(true);
    s.ctrl.Ki = -1; expect(buildController(s.ctrl).hasIntegrator).toBe(true);
    s.ctrl.Ki = 0; expect(buildController(s.ctrl).hasIntegrator).toBe(false);
  });
  it('derivative filter keeps C proper', () => {
    const c = buildController({ form: 'pid', Kp: 1, Ki: 1, Kd: 1, N: 20, z: 0, p: 0 });
    expect(c.Cn.length).toBeLessThanOrEqual(c.Cd.length);
  });
  it('A11: recompute stays under 16 ms (degree <= 6) after the locus is cached', () => {
    const s = defaultState();
    s.ctrl = { ...s.ctrl, Kp: 2, Ki: 0.5, Kd: 1 };
    derive(s);
    const t = performance.now();
    for (let i = 0; i < 20; i++) { s.K = 1 + i * 0.1; derive(s); }
    expect((performance.now() - t) / 20).toBeLessThan(16);
  });
  it('A11b: full recompute including the locus sweep, per preset', () => {
    for (const p of PRESETS) {
      const s = defaultState();
      s.plant = { num: p.num, den: p.den };
      s.ctrl.Kp = 1 + Math.random(); // new key -> cold cache
      const d = derive(s);
      console.log(`${p.name}: ${d.computeMs.toFixed(1)} ms`);
    }
  });
});
