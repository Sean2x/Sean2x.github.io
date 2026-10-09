import { Complex, Poly, trim } from '../math/poly';
import { roots } from '../math/roots';
import { parseNumberList, parseTransferFunction, polyFromFactored } from '../math/parse';
import { ControllerForm, PRESETS, SLIDER_RANGE, State } from '../model';
import { polyMatlab, polyString } from './format';

type El = HTMLElement;
function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...kids: (string | El)[]): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const k of kids) e.append(k);
  return e;
}

export interface Controls { sync(): void; syncGains(): void }

/** Slider + numeric box pair with a zero-snap. Returns setter/enabler for syncing. */
function gainRow(label: string, range: number, get: () => number, set: (v: number) => void, accent: string) {
  const row = h('div', { class: 'row' });
  const name = h('label', {}, label);
  name.style.color = accent;
  const slider = h('input', { type: 'range', min: String(-range), max: String(range), step: String(range / 400) });
  const box = h('input', { type: 'number', step: 'any', class: 'num' });
  const apply = (v: number) => { set(v); box.value = String(Number(v.toFixed(6))); slider.value = String(v); };
  slider.addEventListener('input', () => {
    let v = parseFloat(slider.value);
    if (Math.abs(v) < range * 0.02) v = 0; // zero-snap
    apply(v);
  });
  box.addEventListener('input', () => { const v = parseFloat(box.value); if (isFinite(v)) { set(v); slider.value = String(v); } });
  row.append(name, slider, box);
  return {
    row,
    sync() { const v = get(); slider.value = String(v); if (document.activeElement !== box) box.value = String(Number(v.toFixed(6))); },
    enable(on: boolean) { row.classList.toggle('off', !on); slider.disabled = !on; box.disabled = !on; },
  };
}

function formatRoots(p: Poly): string {
  const rs: Complex[] = roots(p);
  const out: string[] = [];
  const used = new Set<number>();
  rs.forEach((z, i) => {
    if (used.has(i)) return;
    if (Math.abs(z.im) > 0) {
      const j = rs.findIndex((w, k) => k !== i && !used.has(k) && Math.abs(w.re - z.re) < 1e-6 && Math.abs(w.im + z.im) < 1e-6);
      if (j >= 0) used.add(j);
      out.push(`${Number(z.re.toFixed(6))}+${Number(Math.abs(z.im).toFixed(6))}j`); // one entry stands for the conjugate pair
    } else out.push(String(Number(z.re.toFixed(6))));
    used.add(i);
  });
  return out.join(', ');
}

export function mountControls(root: El, s: State, onChange: () => void): Controls {
  // ---- plant ----
  const preset = h('select', {});
  preset.append(h('option', { value: '' }, 'Preset…'));
  PRESETS.forEach((p, i) => preset.append(h('option', { value: String(i) }, p.name)));
  const mode = h('select', {});
  [['coef', 'Coefficients'], ['fact', 'Poles / zeros'], ['tf', 'MATLAB tf string']].forEach(([v, t]) => mode.append(h('option', { value: v }, t)));
  const numIn = h('input', { type: 'text', spellcheck: 'false' });
  const denIn = h('input', { type: 'text', spellcheck: 'false' });
  const zIn = h('input', { type: 'text', spellcheck: 'false', placeholder: 'e.g. -1, -2+3j' });
  const pIn = h('input', { type: 'text', spellcheck: 'false', placeholder: 'e.g. 0, -2' });
  const gIn = h('input', { type: 'number', step: 'any' });
  const tfIn = h('input', { type: 'text', spellcheck: 'false', placeholder: '(s+1)/(s^2+3*s+2)' });
  const err = h('div', { class: 'err' });
  const shown = h('div', { class: 'mono small plantshown' });

  const gCoef = h('div', { class: 'grp' }, h('label', {}, 'Numerator (highest power first)'), numIn, h('label', {}, 'Denominator'), denIn);
  const gFact = h('div', { class: 'grp' }, h('label', {}, 'Zeros'), zIn, h('label', {}, 'Poles'), pIn, h('label', {}, 'Gain'), gIn);
  const gTf = h('div', { class: 'grp' }, h('label', {}, 'P(s) ='), tfIn);

  const setPlant = (num: Poly, den: Poly) => {
    s.plant = { num: trim(num), den: trim(den) };
    err.textContent = '';
    onChange();
  };
  const fromMode = () => {
    try {
      const m = mode.value;
      if (m === 'coef') { setPlant(parseNumberList(numIn.value), parseNumberList(denIn.value)); }
      else if (m === 'fact') { const r = polyFromFactored(zIn.value, pIn.value, parseFloat(gIn.value || '1')); setPlant(r.num, r.den); }
      else { const r = parseTransferFunction(tfIn.value); setPlant(r.num, r.den); }
    } catch (e) { err.textContent = (e as Error).message; }
  };
  [numIn, denIn, zIn, pIn, gIn, tfIn].forEach((i) => i.addEventListener('input', fromMode));
  const showMode = () => {
    gCoef.hidden = mode.value !== 'coef'; gFact.hidden = mode.value !== 'fact'; gTf.hidden = mode.value !== 'tf';
  };
  const fillPlantInputs = () => {
    const { num, den } = s.plant;
    numIn.value = num.join(', '); denIn.value = den.join(', ');
    zIn.value = num.length > 1 ? formatRoots(num) : ''; pIn.value = den.length > 1 ? formatRoots(den) : '';
    gIn.value = String(Number((num[0] / den[0]).toPrecision(8)));
    tfIn.value = `(${polyMatlab(num)})/(${polyMatlab(den)})`;
    shown.textContent = `P(s) = (${polyString(num)}) / (${polyString(den)})`;
  };
  mode.addEventListener('change', () => { showMode(); fillPlantInputs(); });
  preset.addEventListener('change', () => {
    if (preset.value === '') return;
    const p = PRESETS[+preset.value];
    s.plant = { num: p.num.slice(), den: p.den.slice() };
    fillPlantInputs(); err.textContent = ''; onChange();
    preset.value = '';
  });

  // ---- controller ----
  const form = h('select', {});
  [['pid', 'PID'], ['pi', 'PI'], ['pd', 'PD'], ['lead', 'Lead / lag']].forEach(([v, t]) => form.append(h('option', { value: v }, t)));
  form.addEventListener('change', () => { s.ctrl.form = form.value as ControllerForm; syncAll(); onChange(); });
  const kp = gainRow('Kp', SLIDER_RANGE.Kp, () => s.ctrl.Kp, (v) => { s.ctrl.Kp = v; onChange(); }, '#4aa3ff');
  const ki = gainRow('Ki', SLIDER_RANGE.Ki, () => s.ctrl.Ki, (v) => { s.ctrl.Ki = v; onChange(); }, '#5ee6a8');
  const kd = gainRow('Kd', SLIDER_RANGE.Kd, () => s.ctrl.Kd, (v) => { s.ctrl.Kd = v; onChange(); }, '#ffb454');
  const nIn = h('input', { type: 'number', step: 'any', min: '0', class: 'num' });
  nIn.addEventListener('input', () => { const v = parseFloat(nIn.value); s.ctrl.N = isFinite(v) && v > 0 ? v : 0; onChange(); });
  const filt = h('div', { class: 'row' }, h('label', {}, 'Filter N'), h('span', { class: 'hint' }, '0 = pure derivative'), nIn);
  const zIn2 = h('input', { type: 'number', step: 'any', class: 'num' });
  const pIn2 = h('input', { type: 'number', step: 'any', class: 'num' });
  zIn2.addEventListener('input', () => { const v = parseFloat(zIn2.value); if (isFinite(v)) { s.ctrl.z = v; onChange(); } });
  pIn2.addEventListener('input', () => { const v = parseFloat(pIn2.value); if (isFinite(v)) { s.ctrl.p = v; onChange(); } });
  const leadRow = h('div', { class: 'row' }, h('label', {}, 'zero −z'), zIn2, h('label', {}, 'pole −p'), pIn2);

  // ---- loop gain + view ----
  const kk = gainRow('K', SLIDER_RANGE.K, () => s.K, (v) => { s.K = v; onChange(); }, '#ffffff');
  const neg = h('input', { type: 'checkbox' });
  neg.addEventListener('change', () => { s.showNeg = neg.checked; onChange(); });
  const asy = h('input', { type: 'checkbox' });
  asy.addEventListener('change', () => { s.showAsym = asy.checked; onChange(); });

  function syncAll() {
    kp.sync(); ki.sync(); kd.sync(); kk.sync();
    const f = s.ctrl.form;
    const pidLike = f !== 'lead';
    kp.row.hidden = false;
    ki.row.hidden = !pidLike; kd.row.hidden = !pidLike; filt.hidden = !pidLike; leadRow.hidden = pidLike;
    ki.enable(f === 'pid' || f === 'pi'); kd.enable(f === 'pid' || f === 'pd');
    form.value = f;
    if (document.activeElement !== nIn) nIn.value = String(s.ctrl.N);
    if (document.activeElement !== zIn2) zIn2.value = String(s.ctrl.z);
    if (document.activeElement !== pIn2) pIn2.value = String(s.ctrl.p);
    neg.checked = s.showNeg; asy.checked = s.showAsym;
  }

  const sec = (title: string, ...kids: El[]) => h('section', { class: 'card' }, h('h2', {}, title), ...kids);
  root.append(
    sec('Plant P(s)', h('div', { class: 'row2' }, preset, mode), gCoef, gFact, gTf, err, shown),
    sec('Controller C(s)', h('div', { class: 'row2' }, form), kp.row, ki.row, kd.row, filt, leadRow),
    sec('Loop gain', kk.row,
      h('label', { class: 'check' }, neg, ' Show K < 0 locus (amber)'),
      h('label', { class: 'check' }, asy, ' Show asymptotes')),
  );
  showMode(); fillPlantInputs(); syncAll();
  return { sync() { fillPlantInputs(); syncAll(); }, syncGains: syncAll };
}
