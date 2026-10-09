export const COLORS = {
  bg: '#0e1116',
  panel: '#141922',
  grid: '#232b38',
  axis: '#475264',
  text: '#c3ccd9',
  dim: '#7b8799',
  pos: '#4aa3ff',
  neg: '#ffb454',
  pole: '#ff5d73',
  zero: '#5ee6a8',
  closed: '#ffffff',
  unstable: 'rgba(255, 93, 115, 0.08)',
  ghost: '#8b95a7',
  marker: '#c792ea',
};

/** Size a canvas to its CSS box at device resolution; returns the 2D context in CSS pixels. */
export function fitCanvas(canvas: HTMLCanvasElement): { ctx: CanvasRenderingContext2D; w: number; h: number } {
  const dpr = window.devicePixelRatio || 1;
  const r = canvas.getBoundingClientRect();
  const w = Math.max(10, Math.round(r.width));
  const h = Math.max(10, Math.round(r.height));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/** 1-2-5 tick spacing for roughly `target` ticks across `range`. */
export function niceStep(range: number, target = 6): number {
  const raw = range / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * mag;
}
