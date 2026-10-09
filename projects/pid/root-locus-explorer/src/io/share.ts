import { Poly } from '../math/poly';
import { ControllerForm, State, buildController, defaultState } from '../model';
import { fmt, polyMatlab } from '../ui/format';

const FORMS: ControllerForm[] = ['pid', 'pi', 'pd', 'lead'];

export function toJSON(s: State): string {
  return JSON.stringify({ app: 'pid-root-locus-explorer', version: 1, ...s }, null, 2);
}

const isPoly = (v: unknown): v is Poly => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'number' && isFinite(x));
const num = (v: unknown, fallback: number) => (typeof v === 'number' && isFinite(v) ? v : fallback);

/** Validate and merge untrusted JSON into a full State. Throws on a malformed plant. */
export function fromJSON(text: string): State {
  const raw = JSON.parse(text) as Record<string, any>;
  const base = defaultState();
  if (!raw || typeof raw !== 'object') throw new Error('Not a state object');
  if (!isPoly(raw.plant?.num) || !isPoly(raw.plant?.den)) throw new Error('Missing plant coefficients');
  const c = raw.ctrl ?? {};
  return {
    plant: { num: raw.plant.num.slice(), den: raw.plant.den.slice() },
    ctrl: {
      form: FORMS.includes(c.form) ? c.form : base.ctrl.form,
      Kp: num(c.Kp, base.ctrl.Kp), Ki: num(c.Ki, base.ctrl.Ki), Kd: num(c.Kd, base.ctrl.Kd),
      N: Math.max(0, num(c.N, 0)), z: num(c.z, base.ctrl.z), p: num(c.p, base.ctrl.p),
    },
    K: num(raw.K, base.K),
    showNeg: raw.showNeg !== false,
    showAsym: raw.showAsym !== false,
    tab: raw.tab === 'u' ? 'u' : 'y',
  };
}

const b64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s: string) => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(t + '='.repeat((4 - (t.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function toHash(s: State): string {
  return '#s=' + b64(JSON.stringify(s));
}
export function fromHash(hash: string): State | null {
  const m = /[#&]s=([A-Za-z0-9_-]+)/.exec(hash);
  if (!m) return null;
  try { return fromJSON(unb64(m[1])); } catch { return null; }
}

/** MATLAB script that rebuilds the current plant and controller and reproduces the plots. */
export function toMatlab(s: State): string {
  const c = s.ctrl;
  const ctrl = buildController(c);
  const Ki = c.form === 'pd' ? 0 : c.Ki;
  const Kd = c.form === 'pi' ? 0 : c.Kd;
  const lines: string[] = [
    '% PID Root Locus Explorer export',
    "s = tf('s');",
    `P = (${polyMatlab(s.plant.num)}) / (${polyMatlab(s.plant.den)});`,
  ];
  if (c.form === 'lead') {
    lines.push(`C = ${fmt(c.Kp, 6)} * (s + ${fmt(c.z, 6)}) / (s + ${fmt(c.p, 6)});`);
  } else {
    const parts = [`${fmt(c.Kp, 6)}`];
    if (Ki !== 0) parts.push(`${fmt(Ki, 6)}/s`);
    if (Kd !== 0) parts.push(c.N > 0 ? `${fmt(Kd, 6)}*${fmt(c.N, 6)}*s/(s + ${fmt(c.N, 6)})` : `${fmt(Kd, 6)}*s`);
    lines.push(`C = ${parts.join(' + ')};`);
  }
  void ctrl;
  lines.push(
    `K = ${fmt(s.K, 6)};`,
    '',
    'L = K*C*P;                 % open loop',
    'T = feedback(L, 1);        % closed loop, r -> y',
    'U = feedback(K*C, P);      % control effort, r -> u',
    '',
    'figure; rlocus(C*P); sgrid; hold on;',
    "p = pole(T); plot(real(p), imag(p), 'ks', 'MarkerFaceColor', 'k');",
    'title(sprintf(\'Root locus, closed-loop poles at K = %g\', K));',
    '',
    'figure; step(T); hold on; step(U); legend(\'y(t)\', \'u(t)\'); grid on;',
    'disp(pole(T)); stepinfo(T)',
  );
  return lines.join('\n');
}
