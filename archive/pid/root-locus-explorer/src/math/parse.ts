import { Complex, Poly, add, fromRoots, mul, scale, trim } from './poly';

/** Rational function num/den in s. */
export interface Rational { num: Poly; den: Poly }

const ONE: Poly = [1];
const rAdd = (a: Rational, b: Rational): Rational => ({ num: add(mul(a.num, b.den), mul(b.num, a.den)), den: mul(a.den, b.den) });
const rMul = (a: Rational, b: Rational): Rational => ({ num: mul(a.num, b.num), den: mul(a.den, b.den) });
const rNeg = (a: Rational): Rational => ({ num: scale(a.num, -1), den: a.den });
const rInv = (a: Rational): Rational => {
  if (a.num.length === 1 && a.num[0] === 0) throw new Error('Division by zero');
  return { num: a.den, den: a.num };
};

/**
 * Parse a MATLAB-style transfer-function string such as
 * "(1.151*s+0.1774)/(s^3+0.739*s^2+0.921*s)". Supports + - * / ^ (integer powers), parentheses,
 * implicit "2s", scientific notation, and "s" as the only variable.
 */
export function parseTransferFunction(text: string): Rational {
  const src = text.replace(/\s+/g, '').replace(/\.\*/g, '*').replace(/\.\//g, '/').replace(/\.\^/g, '^');
  let pos = 0;
  const peek = () => src[pos];
  const fail = (msg: string): never => { throw new Error(`${msg} at position ${pos + 1}`); };

  function number(): Rational {
    const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(src.slice(pos));
    if (!m) return fail('Expected a number');
    pos += m[0].length;
    return { num: [parseFloat(m[0])], den: ONE };
  }
  function primary(): Rational {
    const c = peek();
    if (c === '(') {
      pos++;
      const v = expr();
      if (peek() !== ')') fail('Missing )');
      pos++;
      return v;
    }
    if (c === 's' || c === 'S') { pos++; return { num: [1, 0], den: ONE }; }
    if (c !== undefined && /[\d.]/.test(c)) return number();
    return fail('Unexpected character');
  }
  function power(): Rational {
    let base = primary();
    if (peek() === '^') {
      pos++;
      let neg = false;
      if (peek() === '-') { neg = true; pos++; } else if (peek() === '+') pos++;
      const m = /^\d+/.exec(src.slice(pos));
      if (!m) fail('Exponent must be a non-negative integer');
      pos += m![0].length;
      let e = parseInt(m![0], 10);
      if (e > 30) fail('Exponent too large');
      let acc: Rational = { num: ONE, den: ONE };
      while (e-- > 0) acc = rMul(acc, base);
      base = neg ? rInv(acc) : acc;
    }
    return base;
  }
  function unary(): Rational {
    if (peek() === '-') { pos++; return rNeg(unary()); }
    if (peek() === '+') { pos++; return unary(); }
    return power();
  }
  function term(): Rational {
    let v = unary();
    for (;;) {
      const c = peek();
      if (c === '*') { pos++; v = rMul(v, unary()); }
      else if (c === '/') { pos++; v = rMul(v, rInv(unary())); }
      else if (c === 's' || c === 'S' || c === '(') v = rMul(v, power()); // implicit product: 2s, 3(s+1)
      else return v;
    }
  }
  function expr(): Rational {
    let v = term();
    for (;;) {
      const c = peek();
      if (c === '+') { pos++; v = rAdd(v, term()); }
      else if (c === '-') { pos++; v = rAdd(v, rNeg(term())); }
      else return v;
    }
  }
  if (!src) throw new Error('Empty expression');
  const out = expr();
  if (pos < src.length) fail('Unexpected character');
  const lead = trim(out.den)[0];
  const num = trim(out.num);
  const den = trim(out.den);
  return { num: scale(num, 1 / lead), den: scale(den, 1 / lead) };
}

/** Parse a comma/space separated list of numbers, e.g. "1.151, 0.1774". */
export function parseNumberList(text: string): number[] {
  const parts = text.replace(/[\[\]]/g, ' ').split(/[,;\s]+/).filter(Boolean);
  const vals = parts.map(Number);
  if (vals.some((v) => !isFinite(v))) throw new Error('Not a list of numbers');
  return vals;
}

/**
 * Parse a list of roots: reals ("-1, -2") or complex ("-1+2j"). A complex entry stands for its
 * conjugate pair, so list it once.
 */
export function parseRootList(text: string): Complex[] {
  const parts = text.replace(/[\[\]]/g, ' ').split(/[,;\s]+/).filter(Boolean);
  return parts.map((tok) => {
    const t = tok.replace(/i$/i, 'j');
    if (!/j$/i.test(t)) {
      const v = Number(t);
      if (!isFinite(v)) throw new Error(`Bad root "${tok}"`);
      return { re: v, im: 0 };
    }
    const m = /^([+-]?[\d.]+(?:e[+-]?\d+)?)?(?:([+-][\d.]*(?:e[+-]?\d+)?)j)?$/i.exec(t.replace(/j$/i, 'j'));
    const pure = /^([+-]?[\d.]*)j$/i.exec(t);
    if (pure) return { re: 0, im: Math.abs(pure[1] === '' || pure[1] === '+' || pure[1] === '-' ? Number(pure[1] + '1') : Number(pure[1])) };
    if (!m || m[2] === undefined) throw new Error(`Bad root "${tok}"`);
    const im = m[2] === '+' || m[2] === '-' ? Number(m[2] + '1') : Number(m[2]);
    return { re: m[1] ? Number(m[1]) : 0, im: Math.abs(im) };
  });
}

export function polyFromFactored(zerosText: string, polesText: string, gain: number): Rational {
  return { num: fromRoots(parseRootList(zerosText), gain), den: fromRoots(parseRootList(polesText), 1) };
}
