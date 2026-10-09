import './style.css';
import { Derived, State, defaultState, derive } from './model';
import { LocusPlot } from './ui/locusPlot';
import { StepPlot } from './ui/stepPlot';
import { charPolyHTML, routhHTML, statsHTML, sumProductHTML } from './ui/panels';
import { mountControls } from './ui/controls';
import { fromHash, fromJSON, toHash, toJSON, toMatlab } from './io/share';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

// One state object; every change flows state -> derive() -> redraw.
let state: State = fromHash(location.hash) ?? defaultState();
if (/[#&]embed\b/.test(location.hash)) document.body.classList.add('embed');

const locusCanvas = $<HTMLCanvasElement>('locus');
const stepCanvas = $<HTMLCanvasElement>('step');
const stepPlot = new StepPlot(stepCanvas);
let d: Derived;
let raf = 0;
let hashTimer = 0;

const controls = mountControls($('controls'), state, () => schedule());
const locusPlot = new LocusPlot(locusCanvas, $('readout'), (K) => {
  state.K = Math.max(-1e3, Math.min(1e3, K));
  controls.syncGains();
  schedule();
});

function render() {
  raf = 0;
  d = derive(state);
  locusPlot.update(state, d);
  stepPlot.draw(state, d);
  $('stats').innerHTML = statsHTML(state, d);
  $('charpoly').innerHTML = charPolyHTML(state, d);
  $('sumprod').innerHTML = sumProductHTML(state, d);
  $('routh').innerHTML = routhHTML(state, d);
  clearTimeout(hashTimer);
  hashTimer = window.setTimeout(() => {
    const embed = document.body.classList.contains('embed') ? '&embed' : '';
    try { history.replaceState(null, '', toHash(state) + embed); } catch { /* sandboxed iframe */ }
  }, 300);
}
function schedule() { if (!raf) raf = requestAnimationFrame(render); }
window.addEventListener('resize', schedule);

// ---- step plot tabs and ghost ----
document.querySelectorAll<HTMLButtonElement>('.tabs [data-tab]').forEach((b) =>
  b.addEventListener('click', () => {
    state.tab = b.dataset.tab as 'y' | 'u';
    document.querySelectorAll('.tabs [data-tab]').forEach((x) => x.classList.toggle('on', x === b));
    stepPlot.ghost = null;
    $('btn-clear').hidden = true;
    schedule();
  }));
$('btn-ghost').addEventListener('click', () => {
  const tr = stepPlot.trace(state, d);
  if (!tr) return;
  stepPlot.ghost = { t: tr.t.slice(), y: tr.y.slice(), label: `K=${state.K.toFixed(2)}` };
  $('btn-clear').hidden = false;
  schedule();
});
$('btn-clear').addEventListener('click', () => { stepPlot.ghost = null; $('btn-clear').hidden = true; schedule(); });

// ---- sharing ----
const dlg = $<HTMLDialogElement>('dlg');
const dlgText = $<HTMLTextAreaElement>('dlg-text');
function showDialog(title: string, text: string) {
  $('dlg-title').textContent = title;
  dlgText.value = text;
  dlg.showModal();
}
$('dlg-copy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(dlgText.value); } catch { dlgText.select(); document.execCommand('copy'); }
});
$('btn-matlab').addEventListener('click', () => showDialog('MATLAB code', toMatlab(state)));
$('btn-link').addEventListener('click', async () => {
  const url = location.href.split('#')[0] + toHash(state);
  try { await navigator.clipboard.writeText(url); $('btn-link').textContent = 'Copied!'; setTimeout(() => ($('btn-link').textContent = 'Copy link'), 1200); }
  catch { showDialog('Shareable link', url); }
});
$('btn-save').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([toJSON(state)], { type: 'application/json' }));
  a.download = 'pid-root-locus-state.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('btn-load').addEventListener('click', () => $<HTMLInputElement>('file').click());
$<HTMLInputElement>('file').addEventListener('change', async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  try {
    Object.assign(state, fromJSON(await f.text()));
    controls.sync();
    document.querySelectorAll('.tabs [data-tab]').forEach((x) => x.classList.toggle('on', (x as HTMLElement).dataset.tab === state.tab));
    schedule();
  } catch (err) { showDialog('Could not load file', (err as Error).message); }
  (e.target as HTMLInputElement).value = '';
});
$('btn-embed').addEventListener('click', () => { document.body.classList.toggle('embed'); schedule(); });

render();
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { document.body.classList.remove('embed'); schedule(); } });
