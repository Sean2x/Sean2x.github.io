import { Complex, Poly, trim } from '../math/poly';

/** Compact number: up to `d` significant decimals, no trailing zeros, no "-0". */
export function fmt(x: number, d = 3): string {
  if (!isFinite(x)) return x > 0 ? '∞' : x < 0 ? '−∞' : 'NaN';
  if (Math.abs(x) < 0.5 * 10 ** -d) return '0';
  const a = Math.abs(x);
  let s: string;
  if (a >= 1e5 || a < 1e-3) s = x.toExponential(2);
  else s = x.toFixed(d).replace(/\.?0+$/, '');
  return s.replace('-', '−');
}

export function fmtC(z: Complex, d = 3): string {
  if (z.im === 0) return fmt(z.re, d);
  const im = fmt(Math.abs(z.im), d);
  return `${fmt(z.re, d)} ${z.im < 0 ? '−' : '+'} ${im}j`;
}

const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
export const sup = (n: number) => String(n).split('').map((c) => SUP[+c]).join('');

/** "s³ + 0.739s² + 0.921s" style string. */
export function polyString(p: Poly, d = 4): string {
  const q = trim(p);
  const n = q.length - 1;
  const parts: string[] = [];
  q.forEach((c, i) => {
    if (c === 0 && n > 0) return;
    const pw = n - i;
    const mag = Math.abs(c);
    const body = pw === 0 ? fmt(mag, d) : (mag === 1 ? '' : fmt(mag, d)) + 's' + (pw > 1 ? sup(pw) : '');
    parts.push((parts.length ? (c < 0 ? ' − ' : ' + ') : c < 0 ? '−' : '') + body);
  });
  return parts.join('') || '0';
}

/** MATLAB-style polynomial: 1.151*s + 0.1774 */
export function polyMatlab(p: Poly): string {
  const q = trim(p);
  const n = q.length - 1;
  const parts: string[] = [];
  q.forEach((c, i) => {
    if (c === 0 && n > 0) return;
    const pw = n - i;
    const mag = Number(Math.abs(c).toPrecision(10));
    const body = pw === 0 ? `${mag}` : (mag === 1 ? '' : `${mag}*`) + 's' + (pw > 1 ? `^${pw}` : '');
    parts.push((parts.length ? (c < 0 ? ' - ' : ' + ') : c < 0 ? '-' : '') + body);
  });
  return parts.join('') || '0';
}

export const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
