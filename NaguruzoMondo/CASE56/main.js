'use strict';

// Replace these four fields and regenerate images/fossil-mask.js for new material.
const config = {
    caseId: 56,
    image: 'images/fossil.png',
    answers: ['かきね'],
    hint: '',
    explanation: 'たぬきなので『た』の文字を抜いて考えましょう。',
};
const canvas = document.getElementById('dig-board');
const boardSize = 640;
const renderScale = Math.max(3, Math.min(4, window.devicePixelRatio || 1));
canvas.width = canvas.height = boardSize * renderScale;
const ctx = canvas.getContext('2d');
ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
const size = FossilDig.SIZE, unit = boardSize / size;
const fossil = new Image();
const silhouette = document.createElement('canvas');
silhouette.width = silhouette.height = canvas.width;
const scars = document.createElement('canvas');
scars.width = scars.height = boardSize;
const rockTextures = makeRockTextures(boardSize);
const rockLayer = document.createElement('canvas');
rockLayer.width = rockLayer.height = boardSize;
const fractureLayer = document.createElement('canvas');
fractureLayer.width = fractureLayer.height = boardSize;
const openedPanels = new Set();
const panels = Array.from({ length: 25 }, (_, i) => {
    const image = new Image();
    image.onload = () => drawBoard();
    image.src = `../images/pic(${i + 26}).PNG`;
    return image;
});
let field, tool = 'hammer', cleared = false, remainingAttempts = 3;
let pointer = null, frame = 0, lastDrill = 0, scanUntil = 0;
let resultSnapshot = null, audio;
let scoreTimer = 0;
const particles = [];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
document.getElementById('submitAnswer').disabled = true;

function imageRect(image, side) {
    const scale = side / Math.max(image.naturalWidth, image.naturalHeight);
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
    return [(side - w) / 2, (side - h) / 2, w, h];
}
function drawFossil(context, side) {
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(fossil, ...imageRect(fossil, side));
}
fossil.onload = () => {
    try {
        const probe = document.createElement('canvas');
        probe.width = probe.height = size;
        const p = probe.getContext('2d', { willReadFrequently: true });
        drawFossil(p, size);
        let alpha;
        try {
            const pixels = p.getImageData(0, 0, size, size).data;
            alpha = Uint8Array.from({ length: size * size }, (_, i) => pixels[i * 4 + 3]);
        } catch (error) {
            // Direct file opening has opaque file origins in some browsers.
            // The generated sidecar keeps collision detection available without a server.
            const mask = window.FOSSIL_MASK;
            if (error.name !== 'SecurityError' || !mask || mask.size !== size
                || mask.image !== config.image || mask.width !== fossil.naturalWidth || mask.height !== fossil.naturalHeight) throw error;
            alpha = Uint8Array.from(atob(mask.alpha), c => c.charCodeAt(0));
        }
        field = new FossilDig.Excavation(alpha);
        field.openedPanels = openedPanels;
        silhouette.width = canvas.width;
        const s = silhouette.getContext('2d');
        drawFossil(s, canvas.width);
        s.globalCompositeOperation = 'source-in';
        s.fillStyle = '#ffffff';
        s.fillRect(0, 0, canvas.width, canvas.height);
        s.globalCompositeOperation = 'source-over';
        document.getElementById('submitAnswer').disabled = false;
        drawBoard();
        updateStatus();
    } catch (error) {
        console.error(error);
        window.showCaseMessage('透過素材を読み取れませんでした。画像とアルファマスクを確認してください。');
    }
};
fossil.onerror = () => window.showCaseMessage('問題画像を読み込めませんでした。');
fossil.src = config.image;

function updateStatus() {
    const stats = resultSnapshot || field.stats();
    document.getElementById('score').textContent = `Score: ${stats.score}/100`;
    for (const [id, value] of [['exposure-meter', stats.exposure], ['damage-meter', stats.damage]]) {
        const bar = document.getElementById(id);
        bar.style.width = `${value}%`;
        bar.parentElement.setAttribute('aria-valuenow', Math.round(value));
    }
}
function drawBoard(now = performance.now()) {
    if (!field) return;
    const scanning = scanUntil > now;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, boardSize, boardSize);
    ctx.save();
    if (!reducedMotion.matches && shakeUntil > now) {
        const strength = (shakeUntil - now) / 310 * 5;
        ctx.translate(Math.sin(now * .16) * strength, Math.cos(now * .21) * strength * .6);
    }
    drawFossil(ctx, boardSize);
    const rock = rockLayer.getContext('2d');
    rock.clearRect(0, 0, boardSize, boardSize);
    const scarContext = scars.getContext('2d');
    scarContext.clearRect(0, 0, scars.width, scars.height);
    for (let i = 0; i < field.cover.length; i++) {
        const x = i % size * unit, y = Math.floor(i / size) * unit, cover = field.cover[i];
        if (cover) rock.drawImage(rockTextures[cover], x, y, unit, unit, x, y, unit, unit);
        if (!cover && field.alpha[i] && field.damage[i]) {
            scarContext.fillStyle = '#000000';
            scarContext.fillRect(x, y, unit, unit);
        }
    }
    scarContext.globalCompositeOperation = 'destination-in';
    scarContext.drawImage(silhouette, 0, 0, boardSize, boardSize);
    scarContext.globalCompositeOperation = 'source-over';
    ctx.drawImage(scars, 0, 0);
    ctx.drawImage(rockLayer, 0, 0);
    const fracture = fractureLayer.getContext('2d');
    fracture.clearRect(0, 0, boardSize, boardSize);
    for (const points of rockCracks) {
        const trace = (dx, dy) => {
            fracture.beginPath(); fracture.moveTo(points[0][0] + dx, points[0][1] + dy);
            for (const p of points.slice(1)) fracture.lineTo(p[0] + dx, p[1] + dy);
            fracture.stroke();
        };
        fracture.strokeStyle = '#e4d3b766'; fracture.lineWidth = 1; trace(1, 1);
        fracture.strokeStyle = '#21190cc4'; fracture.lineWidth = 1.6; trace(0, 0);
    }
    fracture.globalCompositeOperation = 'destination-in'; fracture.drawImage(rockLayer, 0, 0);
    fracture.globalCompositeOperation = 'source-over'; ctx.drawImage(fractureLayer, 0, 0);
    if (scanning) {
        const elapsed = 1600 - (scanUntil - now);
        const intensity = Math.max(0, Math.min(1, elapsed / 160, (scanUntil - now) / 500));
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = intensity * .78;
        ctx.drawImage(silhouette, 0, 0, boardSize, boardSize); ctx.restore();
        ctx.fillStyle = `rgba(255,255,255,${intensity * (reducedMotion.matches ? .08 : .22)})`;
        ctx.fillRect(0, 0, boardSize, boardSize);
    }
    // Unopened panels stay solid during scans and continue to hide the fossil.
    for (let i = 0; i < 25; i++) {
        if (openedPanels.has(i)) continue;
        const x = i % 5 * boardSize / 5, y = Math.floor(i / 5) * boardSize / 5, cell = boardSize / 5;
        if (panels[i].complete && panels[i].naturalWidth) ctx.drawImage(panels[i], x, y, cell, cell);
        else { ctx.fillStyle = '#ffd257'; ctx.fillRect(x, y, cell, cell); }
    }
    if (scanning) {
        const elapsed = 1600 - (scanUntil - now);
        const intensity = Math.max(0, Math.min(1, elapsed / 160, (scanUntil - now) / 500));
        ctx.fillStyle = `rgba(255,255,255,${intensity * .12})`;
        ctx.fillRect(0, 0, boardSize, boardSize);
    }
    drawImpactEffects(now);
    if (pointer && !scanning) {
        ctx.strokeStyle = '#fff9'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pointer.x * unit, pointer.y * unit, (tool === 'hammer' ? 5.5 : 1.5) * unit, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
}
function animate(now) {
    frame = 0;
    if (pointer && tool === 'drill' && !cleared && now - lastDrill >= 85) {
        dig(pointer.x, pointer.y);
        lastDrill = now;
    }
    drawBoard(now);
    if (pointer && tool === 'drill' || particles.length || panelFragments.length || impactWaves.length || shakeUntil > now || scanUntil > now) requestFrame();
}
function requestFrame() { if (!frame) frame = requestAnimationFrame(animate); }
function sound(kind, damaged) {
    try {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        if (!audio) audio = new Audio();
        if (audio.state === 'suspended') void audio.resume();
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        oscillator.type = kind === 'drill' ? 'sawtooth' : 'triangle';
        const now = audio.currentTime;
        oscillator.frequency.setValueAtTime(damaged ? 490 : kind === 'hammer' ? 145 : 95, now);
        oscillator.frequency.exponentialRampToValueAtTime(kind === 'hammer' ? 45 : 70, now + .06);
        gain.gain.setValueAtTime(kind === 'hammer' ? .13 : .025, now);
        gain.gain.exponentialRampToValueAtTime(.001, now + .07);
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.start(now); oscillator.stop(now + .08);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch (_) { /* Muted/unavailable audio must not interrupt digging. */ }
}
function dig(x, y) {
    if (!field || cleared || tool === 'scan') return;
    const result = field.hit(x, y, tool);
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    uncoverPanels(x, y, tool === 'hammer' ? 5.5 : 1.5);
    if (tool === 'hammer') hammerImpact(x, y, result.changed > 0);
    sound(tool, result.damage > 0);
    if (result.changed || result.damage) emitDebris(x, y, tool, result.damage > 0);
    updateStatus(); requestFrame();
}
function uncoverPanels(x, y, radius) {
    for (let i = 0; i < 25; i++) {
        const left = i % 5 * size / 5, top = Math.floor(i / 5) * size / 5;
        const nearX = Math.max(left, Math.min(left + size / 5, x));
        const nearY = Math.max(top, Math.min(top + size / 5, y));
        if (!openedPanels.has(i) && Math.hypot(nearX - x, nearY - y) <= radius) {
            if (!openedPanels.size) {
                field.startTimer();
                scoreTimer = setInterval(() => { if (!cleared) updateStatus(); }, 100);
            }
            openedPanels.add(i);
            blowPanel(i, x, y);
        }
    }
}
function scan() {
    scanUntil = performance.now() + 1600;
    drawBoard(); requestFrame();
}
function position(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * size, y: (event.clientY - rect.top) / rect.height * size };
}
function stopPointer() {
    const old = pointer;
    pointer = null;
    if (old && canvas.hasPointerCapture(old.id)) canvas.releasePointerCapture(old.id);
    if (field) drawBoard();
}
canvas.addEventListener('pointerdown', event => {
    if (!field || cleared || !event.isPrimary || event.button !== 0 || pointer) return;
    if (tool === 'scan') { scan(); return; }
    event.preventDefault();
    pointer = { ...position(event), id: event.pointerId };
    canvas.setPointerCapture(event.pointerId);
    dig(pointer.x, pointer.y); lastDrill = performance.now(); requestFrame();
});
canvas.addEventListener('pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id || cleared) return;
    const p = position(event);
    if (tool === 'drill') {
        // Sweep the segment so a quick stylus stroke cannot skip narrow cells.
        const distance = Math.hypot(p.x - pointer.x, p.y - pointer.y);
        const steps = Math.min(160, Math.floor(distance / 1.2));
        let changed = 0, damaged = 0;
        for (let i = 1; i <= steps; i++) {
            // Audio/particles once per gesture update, collision once per sample.
            const x = pointer.x + (p.x - pointer.x) * i / steps, y = pointer.y + (p.y - pointer.y) * i / steps;
            if (x < 0 || y < 0 || x >= size || y >= size) continue;
            const result = field.hit(x, y, 'drill'); changed += result.changed; damaged += result.damage;
            uncoverPanels(x, y, 1.5);
        }
        if (changed || damaged) { emitDebris(p.x, p.y, 'drill', damaged > 0); sound('drill', damaged > 0); }
        if (steps) { lastDrill = performance.now(); updateStatus(); }
    }
    pointer.x = p.x; pointer.y = p.y; requestFrame();
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, event => {
    if (pointer && pointer.id === event.pointerId) stopPointer();
});
canvas.addEventListener('contextmenu', event => event.preventDefault());
window.addEventListener('blur', stopPointer);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopPointer(); });
for (const button of document.querySelectorAll('[data-tool]')) button.addEventListener('click', () => {
    stopPointer(); tool = button.dataset.tool;
    document.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    scanUntil = 0;
    if (tool === 'scan') scan();
    drawBoard(); requestFrame();
});

function make_tweet() {
    const stats = field.stats();
    return `CASE${config.caseId}\n\nScore: ${stats.score}/100 (${4 - remainingAttempts}回目)\n${field.shareGrid()}\n#NaguruzoMondo\n${location.href.split(/[?#]/)[0]}`;
}
function allOpen() {
    stopPointer(); tool = 'drill';
    document.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === tool)));
    for (let i = 0; i < 25; i++) openedPanels.add(i);
    scanUntil = 0; field.allOpen(); drawBoard();
    // The final result is frozen before revealing the answer material.
    updateStatus();
}
function showExplanationMessageOnScreen(message) {
    if (document.getElementById('explanation-message')) return;
    const box = document.createElement('details'); box.id = 'explanation-message';
    const title = document.createElement('summary'); title.textContent = '解説';
    const body = document.createElement('div'); body.id = 'explanation-message-body'; body.textContent = message;
    box.append(title, body); document.getElementById('canvas-container').append(box);
}
function showResultButtons(tweetMess) {
    document.querySelector('.quiz-container').style.display = 'none';
    const buttons = document.createElement('div'); buttons.id = 'result-buttons';
    const share = document.createElement('button'); share.textContent = 'Xで共有';
    share.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetMess)}`, '_blank', 'noopener,noreferrer'));
    const open = document.createElement('button'); open.textContent = '全部開ける';
    open.addEventListener('click', () => { allOpen(); open.disabled = true; });
    buttons.append(share, open); document.getElementById('canvas-container').append(buttons);
    showExplanationMessageOnScreen(config.explanation);
}
function submitAnswer() {
    if (!field || cleared) return;
    const answer = document.getElementById('answerInput').value.trim().normalize('NFKC').toLowerCase();
    if (config.answers.some(a => a.normalize('NFKC').toLowerCase() === answer)) {
        stopPointer();
        field.stopTimer();
        clearInterval(scoreTimer);
        const tweetMess = make_tweet();
        resultSnapshot = field.stats(); cleared = true;
        updateStatus();
        document.querySelectorAll('[data-tool]').forEach(b => { b.disabled = true; });
        showResultButtons(tweetMess); window.showCaseMessage('正解！');
    } else {
        remainingAttempts--;
        document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;
        window.showCaseMessage('ちがいます。' + (field.stats().exposure > 99.9 ? config.hint : ''));
    }
}
document.getElementById('submitAnswer').addEventListener('click', submitAnswer);
document.getElementById('answerInput').addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229) submitAnswer();
});
