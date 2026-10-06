'use strict';
// Procedural stone textures: continuous shading rather than one random colour per cell.
function makeRockTextures(side) {
    const maps = [null];
    const palettes = [null, [179, 157, 115], [139, 119, 88], [93, 81, 64], [78, 68, 54]];
    const hash = (x, y) => {
        let n = Math.imul(x + 173, 374761393) ^ Math.imul(y + 97, 668265263);
        n = Math.imul(n ^ n >>> 13, 1274126177);
        return ((n ^ n >>> 16) >>> 0) / 4294967295;
    };
    const noise = (x, y, scale) => {
        x /= scale; y /= scale;
        const ix = Math.floor(x), iy = Math.floor(y);
        const fx = x - ix, fy = y - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
        return (hash(ix, iy) * (1 - u) + hash(ix + 1, iy) * u) * (1 - v)
            + (hash(ix, iy + 1) * (1 - u) + hash(ix + 1, iy + 1) * u) * v;
    };
    for (let layer = 1; layer <= 4; layer++) {
        const surface = document.createElement('canvas'); surface.width = surface.height = side;
        const context = surface.getContext('2d'), pixels = context.createImageData(side, side);
        const base = palettes[layer];
        for (let y = 0; y < side; y++) for (let x = 0; x < side; x++) {
            const broad = noise(x + layer * 181, y, 90), medium = noise(x, y + layer * 53, 24);
            const grain = hash(x, y + layer * 113);
            const light = (broad - .5) * 46 + (medium - .5) * 26 + (grain - .5) * 20
                + (1 - Math.hypot(x - side * .35, y - side * .25) / side) * 10;
            const i = (y * side + x) * 4;
            for (let c = 0; c < 3; c++) pixels.data[i + c] = base[c] + light;
            pixels.data[i + 3] = 255;
        }
        context.putImageData(pixels, 0, 0); maps.push(surface);
    }
    return maps;
}
const impactWaves = [], rockCracks = [], panelFragments = [];
let shakeUntil = 0;
function blowPanel(index, impactX, impactY) {
    if (reducedMotion.matches || !panels[index].naturalWidth) return;
    const image = panels[index], cell = boardSize / 5, half = cell / 2;
    const left = index % 5 * cell, top = Math.floor(index / 5) * cell;
    for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) {
        const x = left + (col + .5) * half, y = top + (row + .5) * half;
        const angle = Math.atan2(y - impactY * unit, x - impactX * unit);
        const speed = (tool === 'hammer' ? 150 : 95) + Math.random() * 80;
        panelFragments.push({ image, sx: col * image.naturalWidth / 2, sy: row * image.naturalHeight / 2,
            sw: image.naturalWidth / 2, sh: image.naturalHeight / 2, x, y, side: half,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 100,
            spin: (Math.random() - .5) * 7, start: performance.now() });
    }
}
function emitDebris(x, y, kind, damaged = false) {
    if (reducedMotion.matches) return;
    const count = kind === 'hammer' ? 24 : 9, now = performance.now();
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2, speed = kind === 'hammer' ? 35 + Math.random() * 105 : 16 + Math.random() * 58;
        particles.push({ x: x * unit, y: y * unit, start: now,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 35,
            radius: (kind === 'hammer' ? 3 : 1.5) + Math.random() * (kind === 'hammer' ? 5 : 3),
            rotation: Math.random() * Math.PI, spin: (Math.random() - .5) * 8,
            color: damaged ? '#b57560' : ['#d7c49e', '#ae9570', '#6f5b42'][i % 3],
        });
    }
    if (particles.length > 250) particles.splice(0, particles.length - 250);
}
function hammerImpact(x, y, fractured) {
    const now = performance.now();
    if (!reducedMotion.matches) {
        impactWaves.push({ x: x * unit, y: y * unit, start: now });
        shakeUntil = now + 310;
        if (navigator.vibrate) { try { navigator.vibrate([22, 15, 12]); } catch (_) {} }
    }
    if (fractured) {
        for (let ray = 0; ray < 7; ray++) {
            const angle = ray * Math.PI * 2 / 7 + Math.random() * .35;
            const points = [[x * unit, y * unit]], length = 22 + Math.random() * 38;
            for (let step = 1; step <= 4; step++) {
                const bend = (Math.random() - .5) * 12;
                points.push([x * unit + Math.cos(angle) * length * step / 4 + Math.sin(angle) * bend,
                    y * unit + Math.sin(angle) * length * step / 4 - Math.cos(angle) * bend]);
            }
            rockCracks.push(points);
            const branch = points[2];
            rockCracks.push([branch, [branch[0] + Math.cos(angle + .8) * 14, branch[1] + Math.sin(angle + .8) * 14]]);
        }
        if (rockCracks.length > 560) rockCracks.splice(0, rockCracks.length - 560);
    }
}
function drawImpactEffects(now) {
    if (reducedMotion.matches) { particles.length = impactWaves.length = panelFragments.length = 0; return; }
    for (let i = panelFragments.length - 1; i >= 0; i--) {
        const p = panelFragments[i], age = Math.max(0, (now - p.start) / 850);
        if (age >= 1) { panelFragments.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = Math.min(1, (1 - age) * 3);
        ctx.translate(p.x + p.vx * age, p.y + p.vy * age + 290 * age * age);
        ctx.rotate(p.spin * age); ctx.scale(Math.cos(age * 5), 1 - age * .25);
        ctx.shadowColor = '#0005'; ctx.shadowBlur = 8;
        ctx.drawImage(p.image, p.sx, p.sy, p.sw, p.sh, -p.side / 2, -p.side / 2, p.side, p.side);
        ctx.restore();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i], age = Math.max(0, (now - p.start) / 650);
        if (age >= 1) { particles.splice(i, 1); continue; }
        ctx.save(); ctx.globalAlpha = (1 - age) ** 1.5;
        ctx.translate(p.x + p.vx * age, p.y + p.vy * age + 105 * age * age);
        ctx.rotate(p.rotation + p.spin * age);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.moveTo(-p.radius, -p.radius * .4); ctx.lineTo(p.radius * .5, -p.radius);
        ctx.lineTo(p.radius, p.radius * .5); ctx.lineTo(-p.radius * .4, p.radius); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#f6e5c566'; ctx.lineWidth = .7; ctx.stroke(); ctx.restore();
    }
    for (let i = impactWaves.length - 1; i >= 0; i--) {
        const wave = impactWaves[i], age = Math.max(0, (now - wave.start) / 580);
        if (age >= 1) { impactWaves.splice(i, 1); continue; }
        const radius = 12 + (1 - (1 - age) ** 3) * 145;
        ctx.save(); ctx.strokeStyle = `rgba(255,255,255,${(1 - age) ** 1.5 * .9})`;
        ctx.lineWidth = 2 + (1 - age) * 5; ctx.shadowColor = '#fff'; ctx.shadowBlur = 12 * (1 - age);
        ctx.beginPath(); ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1; ctx.globalAlpha = .45;
        ctx.beginPath(); ctx.arc(wave.x, wave.y, radius * .83, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
}
