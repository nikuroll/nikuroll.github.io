(function (root) {
    'use strict';
    const PANEL_SIZE = .2, SPEED_PER_NUMBER = .012;
    function reflect(position, velocity, seconds, limit = 1 - PANEL_SIZE) {
        const phase = ((position + velocity * seconds) % (2 * limit) + 2 * limit) % (2 * limit);
        if (phase === 0) return [0, Math.abs(velocity)];
        if (phase === limit) return [limit, -Math.abs(velocity)];
        return phase < limit ? [phase, velocity] : [2 * limit - phase, -velocity];
    }
    // Exact rectangle union: x sweep with merged y intervals, including overlaps.
    function unionArea(rectangles, bounds = { x: 0, y: 0, w: 1, h: 1 }) {
        const clipped = rectangles.map(r => ({ x0: Math.max(bounds.x, r.x), y0: Math.max(bounds.y, r.y),
            x1: Math.min(bounds.x + bounds.w, r.x + r.w), y1: Math.min(bounds.y + bounds.h, r.y + r.h) }))
            .filter(r => r.x1 > r.x0 && r.y1 > r.y0);
        const xs = [...new Set(clipped.flatMap(r => [r.x0, r.x1]))].sort((a, b) => a - b);
        let area = 0;
        for (let i = 0; i < xs.length - 1; i++) {
            const intervals = clipped.filter(r => r.x0 < xs[i + 1] && r.x1 > xs[i])
                .map(r => [r.y0, r.y1]).sort((a, b) => a[0] - b[0]);
            let length = 0, end = -Infinity;
            for (const [start, stop] of intervals) {
                if (stop <= end) continue;
                length += stop - Math.max(start, end); end = stop;
            }
            area += (xs[i + 1] - xs[i]) * length;
        }
        return area;
    }
    class MovingBoard {
        constructor() {
            this.panels = Array.from({ length: 25 }, (_, index) => {
                const number = index + 1, angle = number * 2.399963;
                return { number, x: index % 5 / 5, y: Math.floor(index / 5) / 5, active: false, dragging: false,
                    vx: Math.cos(angle) * number * SPEED_PER_NUMBER, vy: Math.sin(angle) * number * SPEED_PER_NUMBER };
            });
            this.order = this.panels.slice();
        }
        step(seconds) {
            if (!Number.isFinite(seconds) || seconds <= 0) return;
            for (const p of this.panels) {
                if (!p.active || p.dragging) continue;
                [p.x, p.vx] = reflect(p.x, p.vx, seconds);
                [p.y, p.vy] = reflect(p.y, p.vy, seconds);
            }
        }
        release(panel, vx, vy) {
            let speed = Math.hypot(vx, vy), min = panel.number * SPEED_PER_NUMBER;
            const targetSpeed = Math.max(min, speed);
            if (speed < 1e-7) { vx = panel.vx; vy = panel.vy; speed = Math.hypot(vx, vy); }
            if (speed < 1e-7) { vx = 1; vy = 0; speed = 1; }
            const factor = targetSpeed / speed;
            panel.vx = vx * factor; panel.vy = vy * factor; panel.dragging = false; panel.active = true;
        }
        rectangles() { return this.panels.map(p => ({ x: p.x, y: p.y, w: PANEL_SIZE, h: PANEL_SIZE })); }
        score() { return (Math.min(1, Math.max(0, unionArea(this.rectangles()))) * 25).toFixed(2); }
        snapshot() {
            const rectangles = this.rectangles();
            const coverage = Math.min(1, Math.max(0, unionArea(rectangles)));
            const grid = Array.from({ length: 25 }, (_, i) => unionArea(rectangles,
                { x: i % 5 / 5, y: Math.floor(i / 5) / 5, w: .2, h: .2 }) / .04);
            return { coverage, score: (coverage * 25).toFixed(2),
                grid: grid.map(ratio => ratio >= .5 - 1e-10 ? '🟨' : '⬜'),
                panels: this.panels.map(p => ({ ...p })) };
        }
    }
    const api = { MovingBoard, reflect, unionArea, PANEL_SIZE, SPEED_PER_NUMBER };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.MovingPanels = api;
})(globalThis);
