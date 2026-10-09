import { StepResult } from '../math/sim';
import { Derived, State } from '../model';
import { COLORS, fitCanvas, niceStep } from './canvas';
import { fmt } from './format';

export interface Ghost { t: number[]; y: number[]; label: string }

/** Step response (or control effort) plot with an optional frozen ghost trace. */
export class StepPlot {
  ghost: Ghost | null = null;
  constructor(private canvas: HTMLCanvasElement) {}

  /** Current trace for the selected tab, or null when there is nothing to show. */
  trace(s: State, d: Derived): StepResult | null {
    return s.tab === 'y' ? d.step : d.effort;
  }

  draw(s: State, d: Derived) {
    const { ctx, w, h } = fitCanvas(this.canvas);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    const tr = this.trace(s, d);
    const L = 46, R = 12, T = 12, B = 26;
    const pw = w - L - R, ph = h - T - B;
    if (!tr || tr.y.length < 2) {
      ctx.fillStyle = COLORS.dim;
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(d.error ?? 'No response to show (K = 0 or no controller output).', L, h / 2);
      return;
    }
    const tMax = tr.t[tr.t.length - 1];
    const series = [tr.y, ...(this.ghost && this.ghost.t.length === tr.t.length ? [this.ghost.y] : [])];
    let lo = 0, hi = s.tab === 'y' ? 1 : 0;
    for (const ys of series) for (const v of ys) { if (isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    // Clamp the view for divergent traces so the shape near t = 0 stays readable.
    const cap = 50 * Math.max(1, Math.abs(tr.y[Math.floor(tr.y.length / 20)] || 1));
    hi = Math.min(hi, cap); lo = Math.max(lo, -cap);
    const pad = (hi - lo) * 0.08 || 1;
    lo -= pad; hi += pad;
    const X = (t: number) => L + (t / tMax) * pw;
    const Y = (v: number) => T + ph - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * ph;

    ctx.font = '10px system-ui, sans-serif';
    ctx.lineWidth = 1;
    const ys = niceStep(hi - lo, 5);
    for (let v = Math.ceil(lo / ys) * ys; v <= hi; v += ys) {
      ctx.strokeStyle = Math.abs(v) < ys / 1e3 ? COLORS.axis : COLORS.grid;
      ctx.beginPath(); ctx.moveTo(L, Y(v)); ctx.lineTo(L + pw, Y(v)); ctx.stroke();
      ctx.fillStyle = COLORS.dim; ctx.fillText(fmt(v, 2), 6, Y(v) + 3);
    }
    const xs = niceStep(tMax, 6);
    for (let t = 0; t <= tMax; t += xs) {
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath(); ctx.moveTo(X(t), T); ctx.lineTo(X(t), T + ph); ctx.stroke();
      ctx.fillStyle = COLORS.dim; ctx.fillText(fmt(t, 2) + ' s', X(t) - 8, h - 8);
    }

    if (s.tab === 'y') {
      // Reference and +/-2% band around the final value.
      const fv = d.metrics?.finalValue;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = COLORS.dim;
      ctx.beginPath(); ctx.moveTo(L, Y(1)); ctx.lineTo(L + pw, Y(1)); ctx.stroke();
      if (fv !== undefined) {
        ctx.fillStyle = 'rgba(94,230,168,0.07)';
        ctx.fillRect(L, Y(fv * 1.02), pw, Y(fv * 0.98) - Y(fv * 1.02));
        if (d.metrics?.settlingTime != null) {
          ctx.strokeStyle = COLORS.zero;
          ctx.beginPath(); ctx.moveTo(X(d.metrics.settlingTime), T); ctx.lineTo(X(d.metrics.settlingTime), T + ph); ctx.stroke();
        }
      }
      ctx.setLineDash([]);
    }

    const line = (xsArr: number[], ysArr: number[], color: string, width: number, dash: number[] = []) => {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
      ctx.beginPath();
      ysArr.forEach((v, i) => { const px = X(xsArr[i]), py = Y(v); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); });
      ctx.stroke(); ctx.setLineDash([]);
    };
    if (this.ghost && this.ghost.t.length === tr.t.length) line(this.ghost.t, this.ghost.y, COLORS.ghost, 1.8, [6, 4]);
    line(tr.t, tr.y, s.tab === 'y' ? COLORS.pos : COLORS.neg, 2.2);

    ctx.fillStyle = COLORS.text;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(s.tab === 'y' ? 'y(t)' : 'u(t)', L + 6, T + 12);
    if (tr.error) { ctx.fillStyle = COLORS.pole; ctx.fillText(tr.error, L + 40, T + 12); }
    if (this.ghost && this.ghost.t.length === tr.t.length) { ctx.fillStyle = COLORS.ghost; ctx.fillText(`- - ${this.ghost.label}`, L + pw - 150, T + 12); }
  }
}
