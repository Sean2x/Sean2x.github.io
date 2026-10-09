import { Complex, cabs } from '../math/poly';
import { LocusData, gainAt, nearestOnLocus } from '../math/locus';
import { Derived, State } from '../model';
import { COLORS, fitCanvas, niceStep } from './canvas';
import { fmt, fmtC } from './format';

interface View { cx: number; cy: number; ppu: number; w: number; h: number }

/**
 * Canvas root-locus plot with hover readout and pole dragging.
 * The view never moves on its own: it is fitted once (first draw, new plant, Fit button, double-click)
 * and after that only the user pans (drag the background) and zooms (wheel / pinch / +/- buttons).
 */
export class LocusPlot {
  private ctx: CanvasRenderingContext2D;
  private view: View = { cx: 0, cy: 0, ppu: 40, w: 600, h: 400 };
  private needFit = true;
  private plantKey = '';
  private panning = false;
  private panLast: [number, number] = [0, 0];
  private pointers = new Map<number, [number, number]>();
  private pinch = 0;
  private s!: State;
  private d!: Derived;
  private hover: { x: number; y: number } | null = null;
  private dragging = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private readout: HTMLElement,
    private onGain: (K: number) => void,
  ) {
    this.ctx = canvas.getContext('2d')!;
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerleave', () => { if (!this.dragging && !this.panning) { this.hover = null; this.draw(); } });
    canvas.addEventListener('pointerdown', (e) => this.down(e));
    const up = (e: PointerEvent) => {
      this.dragging = false; this.panning = false;
      this.pointers.delete(e.pointerId); this.pinch = 0;
      canvas.releasePointerCapture?.(e.pointerId);
      canvas.style.cursor = 'crosshair';
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const [x, y] = this.pt(e);
      this.zoomAt(x, y, Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015)));
    }, { passive: false });
    canvas.addEventListener('dblclick', () => this.fit());
    canvas.style.touchAction = 'none'; // we handle pan/pinch ourselves
  }

  /** Re-frame the plot on the plant's poles/zeros (the only time the view moves by itself). */
  fit() { this.needFit = true; this.draw(); }
  zoomBy(factor: number) { this.zoomAt(this.view.w / 2, this.view.h / 2, factor); }

  private zoomAt(x: number, y: number, factor: number) {
    const v = this.view;
    const at = this.toS(x, y);
    v.ppu = Math.min(20000, Math.max(1.5, v.ppu * factor));
    v.cx = at.re - (x - v.w / 2) / v.ppu;
    v.cy = at.im - (v.h / 2 - y) / v.ppu;
    this.draw();
  }

  update(s: State, d: Derived) { this.s = s; this.d = d; this.draw(); }

  // ----- coordinates -----
  private toPx(z: Complex): [number, number] {
    const v = this.view;
    return [v.w / 2 + (z.re - v.cx) * v.ppu, v.h / 2 - (z.im - v.cy) * v.ppu];
  }
  private toS(x: number, y: number): Complex {
    const v = this.view;
    return { re: v.cx + (x - v.w / 2) / v.ppu, im: v.cy + (v.h / 2 - y) / v.ppu };
  }
  private fitView(w: number, h: number) {
    const d = this.d;
    let reMin = 0, reMax = 0, imMax = 0;
    const feats: Complex[] = [
      ...d.openPoles, ...d.openZeros,
      ...d.breakaway.map((b) => ({ re: b.s, im: 0 })),
      ...d.crossings.map((c) => ({ re: 0, im: c.omega })),
    ];
    for (const z of feats) { reMin = Math.min(reMin, z.re); reMax = Math.max(reMax, z.re); imMax = Math.max(imMax, Math.abs(z.im)); }
    // Keep the current closed-loop poles in frame unless they have run far off (large K).
    const reach = 4 * Math.max(reMax - reMin, imMax, 1);
    for (const z of d.poles) {
      if (cabs(z) > reach) continue;
      reMin = Math.min(reMin, z.re); reMax = Math.max(reMax, z.re); imMax = Math.max(imMax, Math.abs(z.im));
    }
    const reSpan = Math.max(reMax - reMin, 1);
    let halfH = Math.max(imMax * 1.3, (reSpan * 0.5 * h) / w * 1.7, 1);
    const mag = 10 ** Math.floor(Math.log10(halfH));
    halfH = ([1, 1.5, 2, 3, 5, 7.5, 10].find((m) => m * mag >= halfH) ?? 10) * mag;
    this.view = { cx: (reMin + reMax) / 2 - reSpan * 0.08, cy: 0, ppu: h / (2 * halfH), w, h };
  }

  // ----- interaction -----
  private pt(e: MouseEvent): [number, number] {
    const r = this.canvas.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  }
  private locusSets(): LocusData[] {
    return this.s.showNeg ? [this.d.locusPos, this.d.locusNeg] : [this.d.locusPos];
  }
  private down(e: PointerEvent) {
    const [x, y] = this.pt(e);
    this.pointers.set(e.pointerId, [x, y]);
    this.canvas.setPointerCapture(e.pointerId);
    if (this.pointers.size === 2) { // second finger: switch to pinch
      this.dragging = false; this.panning = false;
      this.pinch = this.pinchDist();
      return;
    }
    const near = this.d.poles.some((p) => {
      const [px, py] = this.toPx(p);
      return Math.hypot(px - x, py - y) < 14;
    });
    if (near) {
      this.dragging = true;
      this.drag(x, y);
    } else {
      this.panning = true;
      this.panLast = [x, y];
      this.canvas.style.cursor = 'grabbing';
    }
  }
  private pinchDist() {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  }
  private drag(x: number, y: number) {
    const hit = nearestOnLocus(this.locusSets(), this.toS(x, y));
    if (hit) this.onGain(hit.K);
  }
  private move(e: PointerEvent) {
    const [x, y] = this.pt(e);
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, [x, y]);
    if (this.pointers.size === 2 && this.pinch > 0) {
      const d = this.pinchDist();
      const [a, b] = [...this.pointers.values()];
      this.zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, d / this.pinch);
      this.pinch = d;
      return;
    }
    if (this.dragging) { this.drag(x, y); return; }
    if (this.panning) {
      this.view.cx -= (x - this.panLast[0]) / this.view.ppu;
      this.view.cy += (y - this.panLast[1]) / this.view.ppu;
      this.panLast = [x, y];
      this.draw();
      return;
    }
    this.hover = { x, y };
    const nearPole = this.d.poles.some((p) => { const [px, py] = this.toPx(p); return Math.hypot(px - x, py - y) < 14; });
    this.canvas.style.cursor = nearPole ? 'grab' : 'crosshair';
    this.draw();
  }

  // ----- drawing -----
  draw() {
    if (!this.s) return;
    const { ctx, w, h } = fitCanvas(this.canvas);
    this.ctx = ctx;
    const key = JSON.stringify(this.s.plant);
    if (this.needFit || key !== this.plantKey) { this.fitView(w, h); this.needFit = false; this.plantKey = key; }
    else { this.view.w = w; this.view.h = h; }
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();

    // Unstable half-plane.
    const [x0] = this.toPx({ re: 0, im: 0 });
    ctx.fillStyle = COLORS.unstable;
    ctx.fillRect(x0, 0, w - x0, h);

    this.drawGrid(w, h);
    this.drawDamping(w, h);
    if (this.s.showAsym) this.drawAsymptotes();

    this.strokeLocus(this.d.locusPos, COLORS.pos);
    if (this.s.showNeg) this.strokeLocus(this.d.locusNeg, COLORS.neg);
    this.drawMarkers();
    this.drawOpenLoop();
    this.drawClosedLoop();
    this.drawHover();
    ctx.restore();
    ctx.fillStyle = COLORS.dim;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('Re', w - 18, h / 2 - 6);
    ctx.fillText('Im', w / 2 + 6, 12);
  }

  private drawGrid(w: number, h: number) {
    const { ctx } = this;
    const v = this.view;
    const step = niceStep((w / v.ppu), 8);
    ctx.lineWidth = 1;
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = COLORS.dim;
    const reLo = v.cx - w / 2 / v.ppu, reHi = v.cx + w / 2 / v.ppu;
    for (let r = Math.ceil(reLo / step) * step; r <= reHi; r += step) {
      const [x] = this.toPx({ re: r, im: 0 });
      ctx.strokeStyle = Math.abs(r) < step / 1e3 ? COLORS.axis : COLORS.grid;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      if (Math.abs(r) > step / 1e3) ctx.fillText(fmt(r, 2), x + 2, Math.min(h - 4, Math.max(12, this.toPx({ re: 0, im: 0 })[1] + 11)));
    }
    const imLo = v.cy - h / 2 / v.ppu, imHi = v.cy + h / 2 / v.ppu;
    for (let r = Math.ceil(imLo / step) * step; r <= imHi; r += step) {
      const [, y] = this.toPx({ re: 0, im: r });
      ctx.strokeStyle = Math.abs(r) < step / 1e3 ? COLORS.axis : COLORS.grid;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      if (Math.abs(r) > step / 1e3) ctx.fillText(fmt(r, 2) + 'j', Math.min(w - 34, Math.max(4, this.toPx({ re: 0, im: 0 })[0] + 4)), y - 2);
    }
  }

  /** Constant-zeta rays and constant-omega_n arcs in the left half-plane. */
  private drawDamping(w: number, h: number) {
    const { ctx } = this;
    const [ox, oy] = this.toPx({ re: 0, im: 0 });
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(160,175,200,0.28)';
    ctx.fillStyle = 'rgba(160,175,200,0.55)';
    ctx.font = '10px system-ui, sans-serif';
    const reach = Math.hypot(w, h);
    for (const z of [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
      const a = Math.acos(z);
      for (const sg of [1, -1]) {
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox - Math.cos(a) * reach, oy - sg * Math.sin(a) * reach); ctx.stroke();
      }
      const lr = Math.min(w, h) * 0.46;
      ctx.fillText(`ζ${z}`, ox - Math.cos(a) * lr - 8, oy - Math.sin(a) * lr - 3);
    }
    const step = niceStep(Math.min(w, h) / this.view.ppu / 1.5, 4);
    for (let r = step; r * this.view.ppu < reach; r += step) {
      ctx.beginPath(); ctx.arc(ox, oy, r * this.view.ppu, Math.PI / 2, (3 * Math.PI) / 2); ctx.stroke();
      ctx.fillText(`ωₙ=${fmt(r, 2)}`, ox + 4, oy + r * this.view.ppu - 3);
    }
    ctx.restore();
  }

  private drawAsymptotes() {
    const a = this.d.asym;
    if (!a) return;
    const { ctx } = this;
    const reach = Math.hypot(this.view.w, this.view.h) / this.view.ppu;
    const [cx0, cy0] = this.toPx({ re: a.centroid, im: 0 });
    ctx.save();
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1.2;
    ctx.font = '11px system-ui, sans-serif';
    const draw = (angles: number[], color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      for (const deg of angles) {
        const r = (deg * Math.PI) / 180;
        const [ex, ey] = this.toPx({ re: a.centroid + Math.cos(r) * reach, im: Math.sin(r) * reach });
        ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(ex, ey); ctx.stroke();
        const lx = cx0 + Math.cos(r) * 90, ly = cy0 - Math.sin(r) * 90;
        ctx.fillText(`${fmt(deg, 0)}°`, lx + 4, ly - 4);
      }
    };
    draw(a.anglesPos, 'rgba(74,163,255,0.55)');
    if (this.s.showNeg) draw(a.anglesNeg, 'rgba(255,180,84,0.55)');
    ctx.setLineDash([]);
    ctx.fillStyle = COLORS.dim;
    ctx.beginPath(); ctx.arc(cx0, cy0, 3, 0, 7); ctx.fill();
    ctx.restore();
  }

  private strokeLocus(L: LocusData, color: string) {
    if (!L.K.length) return;
    const { ctx } = this;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (let b = 0; b < L.branches; b++) {
      ctx.beginPath();
      // Smooth through midpoints so a zoomed-in locus doesn't show the sample spacing as kinks.
      let px = 0, py = 0;
      for (let k = 0; k < L.K.length; k++) {
        const [x, y] = this.toPx(L.roots[k][b]);
        // Cap runaway coordinates so far-off segments stay finite for the rasteriser.
        const cxp = Math.max(-1e5, Math.min(1e5, x)), cyp = Math.max(-1e5, Math.min(1e5, y));
        if (k === 0) ctx.moveTo(cxp, cyp);
        else ctx.quadraticCurveTo(px, py, (px + cxp) / 2, (py + cyp) / 2);
        px = cxp; py = cyp;
      }
      ctx.lineTo(px, py);
      ctx.stroke();
      this.drawArrows(L, b, color);
    }
  }

  /** Small arrowheads along a branch pointing the way |K| increases (from the pole toward its zero or infinity). */
  private drawArrows(L: LocusData, b: number, color: string) {
    const { ctx } = this;
    const { w, h } = this.view;
    const every = 190;
    let acc = every / 2;
    ctx.fillStyle = color;
    for (let k = 1; k < L.K.length; k++) {
      const [x0, y0] = this.toPx(L.roots[k - 1][b]);
      const [x1, y1] = this.toPx(L.roots[k][b]);
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (!isFinite(len) || len > 1e4) continue;
      acc += len;
      if (acc < every || len < 1e-6) continue;
      acc = 0;
      if (x1 < 8 || x1 > w - 8 || y1 < 8 || y1 > h - 8) continue;
      const a = Math.atan2(y1 - y0, x1 - x0);
      ctx.save();
      ctx.translate(x1, y1);
      ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-5, -4.5); ctx.lineTo(-5, 4.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  private drawMarkers() {
    const { ctx } = this;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = COLORS.marker;
    ctx.strokeStyle = COLORS.marker;
    ctx.lineWidth = 1.5;
    for (const b of this.d.breakaway) {
      const [x, y] = this.toPx({ re: b.s, im: 0 });
      ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 6, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 6, y); ctx.closePath(); ctx.stroke();
      ctx.fillText(`K=${fmt(b.K, 3)}`, x + 8, y - 8);
    }
    for (const c of this.d.crossings) {
      for (const sg of c.omega === 0 ? [1] : [1, -1]) {
        const [x, y] = this.toPx({ re: 0, im: sg * c.omega });
        ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.stroke();
        if (sg === 1) ctx.fillText(`K=${fmt(c.K, 3)}${c.omega ? ` ω=${fmt(c.omega, 2)}` : ''}`, x + 8, y - 6);
      }
    }
  }

  private drawOpenLoop() {
    const { ctx } = this;
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.zero;
    for (const z of this.d.openZeros) {
      const [x, y] = this.toPx(z);
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.stroke();
    }
    ctx.strokeStyle = COLORS.pole;
    for (const p of this.d.openPoles) {
      const [x, y] = this.toPx(p);
      ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke();
    }
  }

  private drawClosedLoop() {
    const { ctx } = this;
    ctx.fillStyle = COLORS.closed;
    ctx.strokeStyle = COLORS.bg;
    ctx.lineWidth = 1.5;
    for (const p of this.d.poles) {
      const [x, y] = this.toPx(p);
      ctx.beginPath(); ctx.rect(x - 5, y - 5, 10, 10); ctx.fill(); ctx.stroke();
    }
  }

  private drawHover() {
    const { ctx } = this;
    if (!this.hover) { this.readout.textContent = 'Scroll to zoom · drag the background to pan · double-click to fit · drag a ■ pole along its branch to set K'; return; }
    let s = this.toS(this.hover.x, this.hover.y);
    const hit = nearestOnLocus(this.locusSets(), s);
    let K: Complex;
    let onLocus = false;
    if (hit) {
      const [px, py] = this.toPx(hit.point);
      if (Math.hypot(px - this.hover.x, py - this.hover.y) < 14) {
        s = hit.point;
        K = { re: hit.K, im: 0 };
        onLocus = true;
        ctx.strokeStyle = COLORS.closed;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(px, py, 7, 0, 7); ctx.stroke();
      } else K = gainAt(this.d.D, this.d.N, s);
    } else K = gainAt(this.d.D, this.d.N, s);
    const wn = cabs(s);
    const zeta = wn > 0 ? -s.re / wn : 0;
    const kTxt = onLocus ? `K = ${fmt(K.re, 4)}` : `K = ${fmtC(K, 3)} (off locus)`;
    this.readout.textContent = `s = ${fmtC(s, 3)}   ωₙ = ${fmt(wn, 3)}   ζ = ${fmt(zeta, 3)}   ${kTxt}`;
  }
}
