import { Poly, cabs, mul, trim } from '../math/poly';
import { degree } from '../math/poly';
import { Derived, State } from '../model';
import { esc, fmt, fmtC, polyString, sup } from './format';

const GAIN_COLOR: Record<string, string> = { plant: '#8b95a7', Kp: '#4aa3ff', Ki: '#5ee6a8', Kd: '#ffb454' };

const coefAt = (p: Poly, power: number) => {
  const i = p.length - 1 - power;
  return i >= 0 && i < p.length ? p[i] : 0;
};

function badge(ok: boolean, yes: string, no: string) {
  return `<span class="badge ${ok ? 'ok' : 'bad'}">${ok ? yes : no}</span>`;
}

function rangeText(d: Derived, K: number): string {
  if (!d.stableRanges.length) return 'none — no K stabilises this loop';
  return d.stableRanges
    .map((r) => {
      const lo = r.lo === -Infinity ? '−∞' : fmt(r.lo, 4);
      const hi = r.hi === Infinity ? '∞' : fmt(r.hi, 4);
      const inside = K > r.lo && K < r.hi;
      return `<span class="${inside ? 'in-range' : ''}">(${lo}, ${hi})</span>`;
    })
    .join(' ∪ ');
}

export function statsHTML(s: State, d: Derived): string {
  const m = d.metrics;
  const poleRows = d.poles
    .map((p) => {
      const w = cabs(p);
      const z = w > 0 ? -p.re / w : 0;
      const tag = p.re > 1e-9 ? 'bad' : '';
      return `<li class="${tag}">${fmtC(p)}${p.im > 0 ? `<small> ωₙ ${fmt(w, 3)} ζ ${fmt(z, 3)}</small>` : ''}</li>`;
    })
    .join('');
  return `
    <h3>Response</h3>
    <p>${badge(d.stable, 'Stable', 'Unstable')} ${d.error ? `<span class="warn">${esc(d.error)}</span>` : ''}</p>
    <dl>
      <dt>Dominant ζ</dt><dd>${d.dominant ? fmt(d.dominant.zeta, 3) : '—'}</dd>
      <dt>Dominant ωₙ</dt><dd>${d.dominant ? fmt(d.dominant.wn, 3) + ' rad/s' : '—'}</dd>
      <dt>Overshoot</dt><dd>${m ? fmt(m.overshootPct, 2) + ' %' : '—'}</dd>
      <dt>Rise (10–90 %)</dt><dd>${m?.riseTime != null ? fmt(m.riseTime, 3) + ' s' : '—'}</dd>
      <dt>Settling (2 %)</dt><dd>${m?.settlingTime != null ? fmt(m.settlingTime, 3) + ' s' : '—'}</dd>
      <dt>Final value</dt><dd>${m ? fmt(m.finalValue, 4) : '—'}</dd>
      <dt>Stable K range</dt><dd>${rangeText(d, s.K)}</dd>
    </dl>
    <h4>Closed-loop poles</h4>
    <ul class="poles">${poleRows || '<li>—</li>'}</ul>`;
}

/** I1: closed-loop characteristic polynomial with each coefficient tagged by the gains that feed it. */
export function charPolyHTML(s: State, d: Derived): string {
  const n = degree(d.ch);
  const terms = d.ctrl.terms.map((t) => ({ name: t.name, poly: mul(t.poly, s.plant.num), gain: t.gain }));
  const chips: string[] = [];
  for (let pw = n; pw >= 0; pw--) {
    const val = coefAt(d.ch, pw);
    const parts: { who: string; v: number }[] = [];
    const dv = coefAt(d.D, pw);
    if (dv !== 0) parts.push({ who: 'plant', v: dv });
    for (const t of terms) {
      const v = s.K * t.gain * coefAt(t.poly, pw);
      if (v !== 0) parts.push({ who: t.name, v });
    }
    const dots = parts.map((p) => `<i style="background:${GAIN_COLOR[p.who]}"></i>`).join('');
    const tip = parts.map((p) => `${p.who === 'plant' ? 'open-loop' : 'K·' + p.who}: ${fmt(p.v, 4)}`).join('  +  ');
    const label = pw === 0 ? '' : pw === 1 ? 's' : `s${sup(pw)}`;
    chips.push(`<span class="chip" title="${esc(tip)}"><b>${fmt(val, 4)}</b>${label}<span class="dots">${dots}</span></span>`);
  }
  const used = ['plant', ...new Set(d.ctrl.terms.map((t) => t.name))];
  const legend = used.map((u) => `<span><i style="background:${GAIN_COLOR[u]}"></i>${u === 'plant' ? 'open loop' : 'K·' + u}</span>`).join('');
  return `
    <h3>Characteristic polynomial</h3>
    <p class="sub">D(s) + K·N(s) = 0 — every pole is a root of this one polynomial.</p>
    <div class="chips">${chips.join('<em>+</em>')}</div>
    <div class="legend">${legend}</div>
    <p class="mono small">${esc(polyString(d.ch))}</p>`;
}

/** I2: pole sum / product from the coefficients, next to the numeric sum of the roots. */
export function sumProductHTML(s: State, d: Derived): string {
  const ch = trim(d.ch);
  const n = ch.length - 1;
  if (n < 1) return '<h3>Pole sum &amp; product</h3><p class="sub">Nothing to show.</p>';
  const sumFormula = -ch[1] / ch[0];
  const prodFormula = (n % 2 === 0 ? 1 : -1) * (ch[n] / ch[0]);
  const sum = d.poles.reduce((a, p) => a + p.re, 0);
  const prod = d.poles.reduce((a, p) => ({ re: a.re * p.re - a.im * p.im, im: a.re * p.im + a.im * p.re }), { re: 1, im: 0 });
  const relDeg = degree(d.D) - degree(d.N);
  const note =
    d.N.length === 1 && d.N[0] === 0
      ? ''
      : relDeg >= 2
        ? `<p class="sub lock">Relative degree ${relDeg} ≥ 2, so the sum is locked at ${fmt(sumFormula, 4)} for every K. Poles can only trade real part: if one moves right, another must move left.</p>`
        : `<p class="sub">Relative degree ${relDeg}: K feeds the s${sup(Math.max(n - 1, 1))} coefficient, so the sum moves with K.</p>`;
  void s;
  return `
    <h3>Pole sum &amp; product</h3>
    <dl>
      <dt>Σ poles = −a<sub>n−1</sub></dt><dd>${fmt(sumFormula, 4)} <small>(roots add to ${fmt(sum, 4)})</small></dd>
      <dt>Π poles = (−1)<sup>n</sup>·a<sub>0</sub></dt><dd>${fmt(prodFormula, 4)} <small>(roots multiply to ${fmt(prod.re, 4)})</small></dd>
    </dl>
    ${note}`;
}

/** I3 + I4: Routh array, sign changes, RHP count and the "positive but still unstable" flag. */
export function routhHTML(_s: State, d: Derived): string {
  const r = d.routh;
  const rowsHtml = r.rows
    .map((row, i) => {
      const n = r.rows.length - 1;
      const first = row[0];
      const cls = first < 0 ? 'neg' : '';
      const cells = row.map((v, j) => `<td class="${j === 0 ? 'first ' + cls : ''}">${fmt(v, 4)}</td>`).join('');
      return `<tr><th>s${sup(n - i)}</th>${cells}</tr>`;
    })
    .join('');
  const rhpActual = d.poles.filter((p) => p.re > 1e-9).length;
  let flag = '';
  if (d.signCheckFails)
    flag += `<p class="warn">A coefficient is zero or negative → not Hurwitz. Unstable before solving anything.</p>`;
  else if (!d.stable && r.allCoefficientsPositive)
    flag += `<p class="warn">⚠ Every coefficient is positive, yet ${rhpActual} pole${rhpActual === 1 ? ' is' : 's are'} in the right half-plane. Positive coefficients are only <em>necessary</em>; above 2nd order the Routh test decides.</p>`;
  if (r.special === 'zeroRow') flag += `<p class="sub">A row of zeros appeared: poles sit on the imaginary axis (marginal).</p>`;
  return `
    <h3>Routh–Hurwitz</h3>
    <table class="routh">${rowsHtml}</table>
    <p>First-column sign changes: <b>${r.signChanges}</b> → <b>${r.rhp}</b> RHP pole${r.rhp === 1 ? '' : 's'}
       ${r.special === 'none' ? '' : '<small>(special case handled)</small>'}</p>
    ${flag}`;
}

