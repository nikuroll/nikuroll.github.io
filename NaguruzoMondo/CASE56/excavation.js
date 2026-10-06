/* CASE11's durability idea, split into fine cells inside the standard 5x5 board. */
(function (root) {
    'use strict';
    const SIZE = 80;
    class Excavation {
        constructor(alpha, size = SIZE) {
            if (alpha.length !== size * size) throw new Error('Invalid fossil alpha mask');
            this.size = size;
            this.alpha = Float32Array.from(alpha, a => a / 255);
            this.cover = Uint8Array.from(alpha, (_, i) => 3 + (this.noise(i) > .77 ? 1 : 0));
            this.initialRock = this.cover.reduce((sum, layers) => sum + layers, 0);
            this.openedPanels = new Set();
            this.startedAt = null;
            this.stoppedAt = null;
            this.damage = new Float32Array(alpha.length);
            this.total = this.alpha.reduce((a, b) => a + b, 0);
            if (this.total === 0) throw new Error('The fossil image is fully transparent');
            this.exposed = 0;
            this.damaged = 0;
        }
        noise(i) { return ((Math.imul(i + 1, 1664525) + 1013904223) >>> 0) / 4294967296; }
        hit(x, y, tool) {
            if (!['hammer', 'drill'].includes(tool) || !Number.isFinite(x) || !Number.isFinite(y)
                || x < 0 || y < 0 || x >= this.size || y >= this.size) return { changed: 0, damage: 0 };
            const radius = tool === 'hammer' ? 5.5 : 1.5;
            let changed = 0, damage = 0;
            for (let row = Math.max(0, Math.floor(y - radius)); row <= Math.min(this.size - 1, Math.ceil(y + radius)); row++) {
                for (let col = Math.max(0, Math.floor(x - radius)); col <= Math.min(this.size - 1, Math.ceil(x + radius)); col++) {
                    const distance = Math.hypot(col + .5 - x, row + .5 - y);
                    if (distance > radius) continue;
                    const i = row * this.size + col, before = this.cover[i];
                    // The drill can work through every layer, one small chip at a time.
                    const power = tool === 'hammer' ? (distance < radius * .65 ? 2 : 1) : 1;
                    this.cover[i] = Math.max(0, before - power);
                    if (before !== this.cover[i]) changed++;
                    if (before > 0 && this.cover[i] === 0) this.exposed += this.alpha[i];
                    if (this.alpha[i] && (before === 0 || (tool === 'hammer' && power > before))) {
                        const added = Math.min(1 - this.damage[i], tool === 'hammer' ? .75 : .12);
                        this.damage[i] += added;
                        const weighted = added * this.alpha[i];
                        this.damaged += weighted;
                        damage += weighted;
                    }
                }
            }
            return { changed, damage };
        }
        startTimer(now = performance.now()) {
            if (this.startedAt === null) this.startedAt = now;
        }
        stopTimer(now = performance.now()) {
            if (this.startedAt !== null && this.stoppedAt === null) this.stoppedAt = now;
        }
        stats(now = performance.now()) {
            const exposure = Math.min(100, 100 * this.exposed / this.total);
            const damage = Math.min(100, 100 * this.damaged / this.total);
            const panelPoints = 50 * (25 - Math.min(25, this.openedPanels.size)) / 25;
            const rockPoints = 50 * this.cover.reduce((sum, layers) => sum + layers, 0) / this.initialRock;
            const damagePenalty = damage * 1.5;
            const timePenalty = this.startedAt === null ? 0
                : Math.floor(Math.max(0, (this.stoppedAt ?? now) - this.startedAt) / 1000);
            return { exposure, damage, panelPoints, rockPoints, damagePenalty, timePenalty,
                score: Math.floor(panelPoints + rockPoints - damagePenalty - timePenalty + 1e-8) };
        }
        allOpen() {
            this.cover.fill(0); this.exposed = this.total;
            for (let i = 0; i < 25; i++) this.openedPanels.add(i);
        }
        // Compact 5x5 share view, independent of the much finer digging cells.
        shareGrid() {
            const result = [];
            for (let row = 0; row < 5; row++) {
                let line = '';
                for (let col = 0; col < 5; col++) {
                    line += this.openedPanels.has(row * 5 + col) ? '⬜' : '🟨';
                }
                result.push(line);
            }
            return result.join('\n');
        }
    }
    const api = { Excavation, SIZE };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.FossilDig = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
