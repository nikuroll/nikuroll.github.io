'use strict';
// CASE47-derived standard answer/result flow; replace material here.
const config = { caseId: 58, image: 'images/pic(26).PNG',
    showLiveScore: true, // falseにするとリアルタイム表示を完全に外せる。
    answers: ['だいどうしょうい', '大同小異'], hint: '', explanation: '特にありません' };
const { MovingBoard, PANEL_SIZE } = MovingPanels;
const model = new MovingBoard();
const liveScore = LiveScore.create({ enabled: config.showLiveScore,
    anchor: document.querySelector('.quiz-container'), getScore: () => model.score() });
const canvas = document.getElementById('board'), context = canvas.getContext('2d');
const boardSize = 640;
const density = Math.max(3, Math.min(4, devicePixelRatio || 1));
canvas.width = canvas.height = boardSize * density;
context.setTransform(density, 0, 0, density, 0, 0);
context.imageSmoothingQuality = 'high';
let cleared = false, remainingAttempts = 3, frame = 0, lastTime = performance.now();
let drag = null, showAll = false, lastSubmission = null, finalResult = null;
const material = new Image(); material.onload = drawArea; material.src = config.image;
const panelImages = model.panels.map(panel => {
    const image = new Image(); image.onload = drawArea; image.src = `../images/pic(${panel.number + 25}).PNG`;
    return image;
});

function advanceTo(now = performance.now()) {
    const target = Math.max(lastTime, now);
    if (!cleared) model.step((target - lastTime) / 1000);
    lastTime = target;
}
function schedule() {
    if (!frame && !cleared) frame = requestAnimationFrame(now => {
        frame = 0; advanceTo(now); drawArea();
        if (drag?.started || model.panels.some(p => p.active)) schedule();
    });
}
function drawArea() {
    liveScore.update();
    context.fillStyle = 'white'; context.fillRect(0, 0, boardSize, boardSize);
    if (material.complete && material.naturalWidth) context.drawImage(material, 0, 0, boardSize, boardSize);
    if (showAll) return;
    for (const p of model.order) {
        const x = p.x * boardSize, y = p.y * boardSize, side = PANEL_SIZE * boardSize;
        const image = panelImages[p.number - 1];
        if (image?.complete && image.naturalWidth) context.drawImage(image, x, y, side, side);
        else { context.fillStyle = '#90abd9'; context.fillRect(x, y, side, side); }
        if (p.dragging) { context.fillStyle = '#0003'; context.fillRect(x, y, side, side); }
    }
}
function locationOnBoard(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
}
function inside(p) { return p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1; }
function clamp(value) { return Math.max(0, Math.min(1 - PANEL_SIZE, value)); }
function beginDrag(event, panel, element) {
    if (cleared || drag || !event.isPrimary || event.button !== 0) return;
    advanceTo();
    const cursor = locationOnBoard(event);
    drag = { panel, element, id: event.pointerId, started: false,
        original: { ...panel }, startX: event.clientX, startY: event.clientY,
        offsetX: cursor.x - panel.x,
        offsetY: cursor.y - panel.y,
        samples: [{ ...cursor, time: performance.now() }], lastCursor: cursor };
    model.order = model.order.filter(p => p !== panel); model.order.push(panel);
    event.preventDefault(); panel.dragging = true; element.setPointerCapture(event.pointerId); drawArea();
}
function startDragging() {
    drag.panel.dragging = true;
    canvas.classList.add('dragging');
}
function moveDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.startX, dy = event.clientY - drag.startY;
    if (!drag.started) {
        if (Math.hypot(dx, dy) < 7) return;
        drag.started = true; startDragging(); drag.element.setPointerCapture(event.pointerId);
    }
    event.preventDefault(); advanceTo();
    const cursor = locationOnBoard(event), now = performance.now();
    drag.lastCursor = cursor;
    drag.samples.push({ ...cursor, time: now });
    drag.samples = drag.samples.filter(sample => now - sample.time <= 120);
    drag.panel.x = clamp(cursor.x - drag.offsetX); drag.panel.y = clamp(cursor.y - drag.offsetY);
    drawArea(); schedule();
}
function finishDrag(event, cancel = false) {
    if (!drag || event && drag.id !== event.pointerId) return;
    const current = drag; drag = null;
    if (current.started) {
        advanceTo();
        const cursor = event ? locationOnBoard(event) : current.lastCursor, now = performance.now();
        if (!cancel && inside(cursor)) {
            current.panel.x = clamp(cursor.x - current.offsetX); current.panel.y = clamp(cursor.y - current.offsetY);
            const oldest = current.samples.find(sample => now - sample.time <= 120);
            const seconds = oldest ? (now - oldest.time) / 1000 : 0;
            model.release(current.panel, seconds > .005 ? (cursor.x - oldest.x) / seconds : 0,
                seconds > .005 ? (cursor.y - oldest.y) / seconds : 0);
        } else Object.assign(current.panel, current.original);
    } else if (!cancel && event && inside(locationOnBoard(event))) {
        model.release(current.panel, 0, 0);
    } else Object.assign(current.panel, current.original);
    if (current.element.hasPointerCapture(current.id)) current.element.releasePointerCapture(current.id);
    canvas.classList.remove('dragging'); drawArea(); schedule();
}
canvas.addEventListener('pointerdown', event => {
    if (cleared) return;
    advanceTo(); const at = locationOnBoard(event);
    const panel = [...model.order].reverse().find(p => at.x >= p.x && at.x <= p.x + PANEL_SIZE
        && at.y >= p.y && at.y <= p.y + PANEL_SIZE);
    if (panel) beginDrag(event, panel, canvas);
});
document.addEventListener('pointermove', moveDrag);
document.addEventListener('pointerup', event => finishDrag(event));
for (const element of [canvas]) {
    element.addEventListener('pointercancel', event => finishDrag(event, true));
    element.addEventListener('lostpointercapture', event => finishDrag(event, true));
    element.addEventListener('dragstart', event => event.preventDefault());
}
window.addEventListener('blur', () => finishDrag(null, true));
document.addEventListener('visibilitychange', () => { if (document.hidden) finishDrag(null, true); });
canvas.addEventListener('contextmenu', event => event.preventDefault());

function make_tweet(snapshot) {
    const rows = Array.from({ length: 5 }, (_, row) => snapshot.grid.slice(row * 5, row * 5 + 5).join('')).join('\n');
    return `CASE${config.caseId}\n\nScore: ${snapshot.score}/25 (${4 - remainingAttempts}回目)\n${rows}\n#NaguruzoMondo\n${location.href.split(/[?#]/)[0]}`;
}
function showExplanationMessageOnScreen() {
    if (document.getElementById('explanation-message')) return;
    const box = document.createElement('details'); box.id = 'explanation-message';
    const header = document.createElement('summary'); header.textContent = '解説';
    const body = document.createElement('div'); body.id = 'explanation-message-body'; body.textContent = config.explanation;
    box.append(header, body); document.getElementById('canvas-container').append(box);
}
function showResultButtons(snapshot) {
    document.querySelector('.quiz-container').style.display = 'none';
    const container = document.getElementById('canvas-container');
    const score = document.createElement('p'); score.id = 'score'; score.textContent = `Score: ${snapshot.score}/25`;
    const buttons = document.createElement('div'); buttons.id = 'result-buttons';
    const share = document.createElement('button'); share.textContent = 'Xで共有';
    const tweet = make_tweet(snapshot);
    share.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank', 'noopener,noreferrer'));
    const all = document.createElement('button'); all.textContent = '全部開ける';
    all.addEventListener('click', () => { showAll = true; drawArea(); showExplanationMessageOnScreen(); all.disabled = true; });
    buttons.append(share, all); container.append(score, buttons);
}
function submitAnswer() {
    if (cleared) return;
    // Advance exactly to the submission instant, before answer judging or opening a dialog.
    advanceTo(); lastSubmission = model.snapshot();
    const answer = document.getElementById('answerInput').value.trim().normalize('NFKC').toLowerCase();
    if (config.answers.some(a => a.normalize('NFKC').toLowerCase() === answer)) {
        finalResult = lastSubmission; cleared = true;
        liveScore.hide();
        if (frame) cancelAnimationFrame(frame); frame = 0;
        if (drag) {
            const current = drag; drag = null; current.panel.dragging = false;
            if (current.element.hasPointerCapture(current.id)) current.element.releasePointerCapture(current.id);
        }
        canvas.classList.remove('dragging'); drawArea();
        showResultButtons(finalResult); window.showCaseMessage('正解！');
    } else {
        remainingAttempts--;
        document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;
        window.showCaseMessage('ちがいます。' + config.hint);
    }
}
document.getElementById('submitAnswer').addEventListener('click', submitAnswer);
document.getElementById('answerInput').addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229) submitAnswer();
});
drawArea();
