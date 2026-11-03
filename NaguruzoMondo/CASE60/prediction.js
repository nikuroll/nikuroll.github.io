(function (root) {
    'use strict';
    function measure(image) {
        const { data, width, height } = image;
        const ink = Array(25).fill(0), edges = Array(25).fill(0), samples = Array(25).fill(0);
        const step = Math.max(1, Math.round(width / 250));
        const darkness = (x, y) => {
            const i = (y * width + x) * 4;
            return (1 - (data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722) / 255) * data[i + 3] / 255;
        };
        for (let y = 0; y < height; y += step) {
            for (let x = 0; x < width; x += step) {
                const i = Math.floor(y / height * 5) * 5 + Math.floor(x / width * 5);
                const value = darkness(x, y);
                ink[i] += value;
                edges[i] += (Math.abs(value - darkness(Math.max(0, x - step), y)) +
                    Math.abs(value - darkness(x, Math.max(0, y - step)))) / 2;
                samples[i]++;
            }
        }
        const values = ink.map((value, i) => 0.65 * Math.sqrt(value / samples[i]) + 0.35 * Math.sqrt(edges[i] / samples[i]));
        const max = Math.max(...values, 0.001);
        return values.map(value => Math.round(value / max * 20) / 20);
    }
    function predict(state, count, information) {
        const opened = state.map((open, i) => open ? i : -1).filter(i => i >= 0);
        const selected = [];
        const distance = (a, b) => Math.hypot(a % 5 - b % 5, Math.floor(a / 5) - Math.floor(b / 5));
        for (let move = 0; move < count; move++) {
            let best = -1, bestScore = -Infinity;
            for (let i = 0; i < 25; i++) {
                if (state[i] || selected.includes(i)) continue;
                const centrality = 1 - distance(i, 12) / Math.sqrt(8);
                const unexplored = opened.length ? Math.min(2.5, ...opened.map(index => distance(i, index))) / 2.5 : 1;
                const crowding = selected.length ? Math.max(0, 1 - Math.min(...selected.map(index => distance(i, index))) / 2) : 0;
                const score = centrality * 0.4 + information[i] * 0.35 + unexplored * 0.25 - crowding * 0.22;
                if (score > bestScore) { bestScore = score; best = i; }
            }
            if (best < 0) break;
            selected.push(best);
        }
        return selected;
    }
    const api = { measure, predict };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.Case60Prediction = api;
})(typeof globalThis === 'object' ? globalThis : this);
