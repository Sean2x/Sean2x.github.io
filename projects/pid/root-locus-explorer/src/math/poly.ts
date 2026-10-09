// Polynomials are number[] with the highest power first: [1, 2, 3] = s^2 + 2s + 3.
// Everything here is pure: no DOM, no state.

export type Poly = number[];
export interface Complex { re: number; im: number }

export const cx = (re: number, im = 0): Complex => ({ re, im });
export const cadd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
export const csub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
export const cmul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
export const cdiv = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
export const cabs = (a: Complex): number => Math.hypot(a.re, a.im);

/** Strip leading (highest-power) zeros; always returns at least [0]. */
export function trim(p: Poly, eps = 0): Poly {
  let i = 0;
  while (i < p.length - 1 && Math.abs(p[i]) <= eps) i++;
  return i === 0 ? p.slice() : p.slice(i);
}

/** Degree of the polynomial after trimming ([0] has degree 0). */
export const degree = (p: Poly): number => trim(p).length - 1;

export function add(a: Poly, b: Poly): Poly {
  const n = Math.max(a.length, b.length);
  const out = new Array<number>(n).fill(0);
  for (let i = 0; i < a.length; i++) out[n - a.length + i] += a[i];
  for (let i = 0; i < b.length; i++) out[n - b.length + i] += b[i];
  return trim(out);
}

export const scale = (p: Poly, k: number): Poly => p.map((c) => c * k);
export const sub = (a: Poly, b: Poly): Poly => add(a, scale(b, -1));

export function mul(a: Poly, b: Poly): Poly {
  const out = new Array<number>(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  return trim(out);
}

export function deriv(p: Poly): Poly {
  const n = p.length - 1;
  if (n < 1) return [0];
  return trim(p.slice(0, n).map((c, i) => c * (n - i)));
}

export function evalReal(p: Poly, x: number): number {
  let r = 0;
  for (const c of p) r = r * x + c;
  return r;
}

/** Horner evaluation at a complex point. */
export function evalC(p: Poly, s: Complex): Complex {
  let re = 0;
  let im = 0;
  for (const c of p) {
    const nre = re * s.re - im * s.im + c;
    im = re * s.im + im * s.re;
    re = nre;
  }
  return { re, im };
}

/** Real polynomial with the given roots. A complex root contributes its conjugate pair. */
export function fromRoots(rs: Complex[], lead = 1): Poly {
  let p: Poly = [lead];
  for (const r of rs) {
    if (Math.abs(r.im) < 1e-12) p = mul(p, [1, -r.re]);
    else p = mul(p, [1, -2 * r.re, r.re * r.re + r.im * r.im]);
  }
  return p;
}

/** Multiply by s^k (append k zero coefficients). */
export const shift = (p: Poly, k: number): Poly => p.concat(new Array<number>(k).fill(0));
