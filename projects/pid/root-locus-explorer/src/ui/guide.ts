// "How to read this" cards: a static glossary plus live numbers pulled from the current loop.
import { Poly, trim } from '../math/poly';
import { Derived, State } from '../model';
import { fmt, fmtC } from './format';

const X = '<b class="sym pole">×</b>';
const O = '<b class="sym zero">○</b>';
const SQ = '<b class="sym closed">■</b>';

/** Rendered once; the data-live slots are refreshed by updateGuide(). */
export function guideStatic(): string {
  return `
  <article class="card guide-card">
    <h2>Reading the plot</h2>
    <dl class="gloss">
      <dt>${X} pole</dt><dd>A root of the <b>open-loop</b> denominator D(s). Every branch <em>starts</em> on one (K = 0). An integrator (Ki ≠ 0) adds one at the origin.</dd>
      <dt>${O} zero</dt><dd>A root of the numerator N(s). Branches <em>end</em> on zeros as K → ∞. Branches with no zero left to land on run off to infinity along the dashed asymptotes.</dd>
      <dt>${SQ} closed-loop pole</dt><dd>Where the poles <em>actually are</em> at your current K. These are the roots of D(s) + K·N(s) = 0. Drag one along its branch to change K.</dd>
      <dt><b class="sym" style="color:var(--blue)">━</b> / <b class="sym" style="color:var(--amber)">━</b></dt><dd>Blue = locus for K &gt; 0, amber = K &lt; 0 (negative feedback gain).</dd>
      <dt><b class="sym mk">◇</b> breakaway</dt><dd>Two poles meet on the real axis and leave it as a complex pair: the first place the response starts to ring.</dd>
      <dt><b class="sym mk">◯</b> crossing</dt><dd>A branch touches the imaginary axis at the labelled K: the edge of stability. Past it, poles are in the shaded right half-plane.</dd>
      <dt>Dotted rays / arcs</dt><dd>Rays are constant ζ (damping); arcs are constant ωₙ (natural frequency).</dd>
    </dl>
  </article>

  <article class="card guide-card">
    <h2>Damping ζ and the angle</h2>
    <p>For a pole pair at s = −σ ± jω<sub>d</sub>:</p>
    <p class="eq">ωₙ = |s| = √(σ² + ω<sub>d</sub>²) &nbsp;·&nbsp; ζ = σ/ωₙ = <b>cos θ</b></p>
    <p>θ is the angle between the pole's line to the origin and the <em>negative real axis</em>. That is why the ζ lines on the plot are straight rays: the angle fixes the damping, no matter how far out the pole is.</p>
    <table class="zeta">
      <tr><th>ζ</th><th>θ</th><th>Poles</th><th>Step response</th></tr>
      <tr><td>0</td><td>90°</td><td>on the imaginary axis, ±jωₙ</td><td>oscillates forever, never decays</td></tr>
      <tr><td>0 &lt; ζ &lt; 1</td><td>0°–90°</td><td>complex pair, real part −ζωₙ</td><td>overshoots and rings; smaller ζ = more ringing</td></tr>
      <tr><td><b>1</b> (critical)</td><td>0°</td><td>two equal real poles at −ωₙ</td><td>fastest approach with no overshoot</td></tr>
      <tr><td>&gt; 1</td><td>—</td><td>two separate real poles</td><td>no overshoot, but slower (the slow pole dominates)</td></tr>
    </table>
    <p class="decay">σ = ζωₙ sets how fast the ringing dies (envelope e<sup>−σt</sup>); ω<sub>d</sub> = ωₙ√(1−ζ²) sets how fast it rings.</p>
    <div class="live" data-live="damping"></div>
  </article>

  <article class="card guide-card">
    <h2>Spring-mass-damper + PD</h2>
    <p>A mass-spring-damper (unit mass) is <span class="eq">1/(s² + c·s + k)</span>: <b>c</b> is damping, <b>k</b> is stiffness. On its own, ωₙ = √k and ζ = c / (2√k).</p>
    <p>Close the loop with <b>Kp</b> and <b>Kd</b> and the characteristic equation becomes</p>
    <p class="eq big">s² + (c + K<sub>d</sub>)·s + (k + K<sub>p</sub>) = 0</p>
    <ul class="bullets">
      <li><b>Kp adds to k</b>: a stiffer virtual spring. ωₙ = √(k + Kp) goes up.</li>
      <li><b>Kd adds to c</b>: extra virtual damping. ζ = (c + Kd) / (2·√(k + Kp)) goes up.</li>
      <li><b>Critical damping</b> is when (c + Kd)² = 4(k + Kp). Below that the poles are a complex pair (oscillation); above it they split onto the real axis.</li>
    </ul>
    <p class="decay">(With overall gain K and plant gain g, replace Kp and Kd by K·g·Kp and K·g·Kd.)</p>
    <div class="live" data-live="msd"></div>
  </article>

  <article class="card guide-card">
    <h2>What Ki does: one more pole</h2>
    <p>The integral term is Ki/s, so C(s) gains a pole at the origin and the characteristic equation goes from degree 2 to degree 3:</p>
    <p class="eq big">s³ + (c + K<sub>d</sub>)s² + (k + K<sub>p</sub>)s + K<sub>i</sub> = 0</p>
    <p>Group it as <span class="eq">s·[ s² + (c + Kd)s + (k + Kp) ] + Ki = 0</span>. For small Ki the cubic splits almost cleanly into the old quadratic and one real pole:</p>
    <p class="eq big">≈ [ s² + (c + K<sub>d</sub>)s + (k + K<sub>p</sub>) ] · ( s + K<sub>i</sub>/(k + K<sub>p</sub>) )</p>
    <ul class="bullets">
      <li>The new pole is on the <b>real axis</b> at s ≈ −Ki/(k + Kp), close to the origin. It is the slow tail that creeps up and kills steady-state error.</li>
      <li>More Ki pushes that pole left, but it also drags the oscillating pair toward the imaginary axis: <b>less damping, more ringing</b>.</li>
      <li>Too much Ki goes unstable. The Routh test for the cubic says it stays stable only while <b>0 &lt; Ki &lt; (c + Kd)(k + Kp)</b>.</li>
    </ul>
    <div class="live" data-live="ki"></div>
  </article>`;
}

const sq = (x: number) => Math.sqrt(x);

function classify(zeta: number): string {
  if (zeta < 1e-3) return 'undamped (ζ ≈ 0): pure oscillation';
  if (zeta < 0.999) return 'underdamped: overshoots and rings';
  if (zeta <= 1.001) return 'critically damped: fastest with no overshoot';
  return 'overdamped: no overshoot, slower';
}

/** Divide p by (s − r); returns the quotient (remainder is ~0 for a root). */
function deflate(p: Poly, r: number): Poly {
  const q: number[] = [p[0]];
  for (let i = 1; i < p.length - 1; i++) q.push(p[i] + r * q[i - 1]);
  return q;
}

/** Plant of the form g/(s² + c s + k) -> {g, c, k}, else null. */
function secondOrder(plant: State['plant']) {
  const num = trim(plant.num), den = trim(plant.den);
  if (num.length !== 1 || den.length !== 3 || den[0] === 0) return null;
  return { g: num[0] / den[0], c: den[1] / den[0], k: den[2] / den[0] };
}

const LOAD_HINT = `<p class="hint">Load the <b>Stable 2nd order</b> preset (1/(s² + 0.6s + 2)) to see these formulas filled in with your numbers.</p>`;

export function updateGuide(root: HTMLElement, s: State, d: Derived) {
  const slot = (name: string) => root.querySelector<HTMLElement>(`[data-live="${name}"]`)!;

  // --- damping of the pair closest to the imaginary axis ---
  const pairs = d.poles.filter((p) => p.im > 1e-9).sort((a, b) => b.re - a.re);
  const p = pairs[0];
  let damping: string;
  if (p) {
    const wn = Math.hypot(p.re, p.im);
    const zeta = -p.re / wn;
    const theta = (Math.acos(Math.max(-1, Math.min(1, zeta))) * 180) / Math.PI;
    damping = `<b>Right now:</b> pair at s = ${fmtC(p)} → ωₙ = ${fmt(wn, 3)}, σ = ${fmt(-p.re, 3)}, ω<sub>d</sub> = ${fmt(p.im, 3)}<br>
      ζ = cos(${fmt(theta, 1)}°) = <b>${fmt(zeta, 3)}</b> — ${classify(zeta)}${zeta < 0 ? ' (negative ζ: growing oscillation, unstable)' : ''}`;
  } else {
    const reals = d.poles.filter((q) => q.im === 0).sort((a, b) => b.re - a.re);
    const twin = reals.some((q, i) => i > 0 && Math.abs(q.re - reals[i - 1].re) < 1e-3);
    damping = `<b>Right now:</b> no complex pair, poles are real (${reals.map((q) => fmt(q.re, 3)).join(', ') || '—'}) → ${twin ? 'critically damped (a repeated pole)' : 'overdamped, ζ > 1'}.`;
  }
  slot('damping').innerHTML = damping;

  // --- spring-mass-damper + PD, with the real numbers if the plant matches ---
  const so = secondOrder(s.plant);
  const c = s.ctrl;
  const usesPD = c.form === 'pid' || c.form === 'pd' || c.form === 'pi';
  if (so && usesPD && c.N === 0) {
    const kd = c.form === 'pi' ? 0 : c.Kd;
    const gK = so.g * s.K;
    const a = so.c + gK * kd;
    const b = so.k + gK * c.Kp;
    if (b > 0) {
      const wn = sq(b);
      const zeta = a / (2 * wn);
      const need = gK !== 0 ? (2 * wn - so.c) / gK : NaN;
      slot('msd').innerHTML = `<b>Your numbers</b> (c = ${fmt(so.c)}, k = ${fmt(so.k)}):<br>
        s² + (${fmt(so.c)} + ${fmt(gK * kd)})s + (${fmt(so.k)} + ${fmt(gK * c.Kp)}) = <b>s² + ${fmt(a)}s + ${fmt(b)}</b><br>
        ωₙ = √${fmt(b)} = ${fmt(wn, 3)} &nbsp; ζ = ${fmt(a)}/(2·${fmt(wn, 3)}) = <b>${fmt(zeta, 3)}</b> — ${classify(zeta)}<br>
        ${isFinite(need) ? `Critical damping needs K·g·Kd = ${fmt(2 * wn - so.c)}, i.e. <b>Kd = ${fmt(need, 3)}</b> at this K and Kp.` : ''}`;
    } else {
      slot('msd').innerHTML = `k + K·g·Kp = ${fmt(b)} ≤ 0: the net spring is negative, so one pole is in the right half-plane (the plant falls over, like an inverted pendulum).`;
    }
  } else {
    slot('msd').innerHTML = LOAD_HINT;
  }

  // --- Ki: exact factorisation of the cubic ---
  const ch = trim(d.ch);
  const hasI = d.ctrl.hasIntegrator;
  if (!hasI) {
    slot('ki').innerHTML = `<b>Right now Ki = 0</b> (or the form has no integrator), so there is no pole at the origin. Move Ki away from 0 and watch a new × appear at s = 0 and a new real ■ appear beside it.`;
  } else if (ch.length === 4) {
    const reals = d.poles.filter((q) => q.im === 0).sort((x, y) => Math.abs(x.re) - Math.abs(y.re));
    if (reals.length) {
      const r = reals[0].re;
      const [, al, be] = deflate(ch, r);
      const so2 = secondOrder(s.plant);
      const approx = so2 ? `<br>Small-Ki estimate: pole ≈ −Ki/(k + Kp) = ${fmt(-(so2.g * s.K * c.Ki) / (so2.k + so2.g * s.K * c.Kp), 3)} (exact: ${fmt(r, 3)})` : '';
      slot('ki').innerHTML = `<b>Exact split at your gains:</b><br>
        ${fmt(ch[0])}s³ + ${fmt(ch[1])}s² + ${fmt(ch[2])}s + ${fmt(ch[3])} = <b>(s² + ${fmt(al)}s + ${fmt(be)})(s ${r < 0 ? '+' : '−'} ${fmt(Math.abs(r), 3)})</b>${approx}<br>
        The real pole is at s = ${fmt(r, 3)}; the pair has ωₙ = ${fmt(be > 0 ? sq(be) : NaN, 3)}.`;
    } else {
      slot('ki').innerHTML = 'The cubic has no real root here, which cannot happen for a real cubic; try a different gain.';
    }
  } else {
    slot('ki').innerHTML = `With Ki ≠ 0 the characteristic polynomial has degree ${ch.length - 1}. One pole belongs to the integrator and starts at the origin when K = 0; the rest come from the plant and the other gains.`;
  }
}
