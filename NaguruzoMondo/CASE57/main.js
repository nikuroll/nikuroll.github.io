'use strict';
const config = { caseId: 57, answers: ['す', 'ス', '酢'], hint: '',
    explanation: '文字列として考えます。「たばすこ」の４文字には「す」が入っているので、答えは酢です。クイズ的には本物のタバスコには塩と酢が入っていますが、答えが被ってしまっているので別の解答として認めません' };
const letters = Array.from(StrokeQuestion.text);
const paths = letters.map(char => StrokeQuestion.glyphs[char].map(d => new Path2D(d)));
const strokeLengths = letters.map(char => StrokeQuestion.glyphs[char].map(d => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d); return path.getTotalLength();
}));
const strokeDuration = 360;
const strokeStarts = letters.map(() => []);
let animationFrame = 0;
const counts = Array(25).fill(0);
const canvas = document.getElementById('board'), context = canvas.getContext('2d');
const boardSize = 640, cellSize = boardSize / 5;
const density = Math.max(3, Math.min(4, devicePixelRatio || 1));
canvas.width = canvas.height = boardSize * density;
context.setTransform(density, 0, 0, density, 0, 0);
context.imageSmoothingQuality = 'high';
let cleared = false, remainingAttempts = 3, showAll = false, finalResult = null;
let press = null;
const plainPanel = new Image();
plainPanel.onload = drawArea;
plainPanel.src = 'images/panel.PNG';
const panelImages = counts.map((_, index) => {
    const image = new Image(); image.onload = drawArea;
    image.src = `../images/pic(${index + 26}).PNG`; return image;
});

function snapshot() {
    return { score: 25 - counts.reduce((sum, n) => sum + n, 0),
        grid: counts.map(n => n ? '⬜' : '🟨'), counts: [...counts], attempt: 4 - remainingAttempts };
}
function drawArea() {
    const now = performance.now();
    context.fillStyle = 'white'; context.fillRect(0, 0, boardSize, boardSize);
    for (let i = 0; i < 25; i++) {
        const x = i % 5 * cellSize, y = Math.floor(i / 5) * cellSize;
        if (!showAll && counts[i] === 0) {
            const image = panelImages[i];
            if (image?.complete && image.naturalWidth) context.drawImage(image, x, y, cellSize, cellSize);
            else {
                context.fillStyle = '#90abd9'; context.fillRect(x, y, cellSize, cellSize);
                context.fillStyle = '#000'; context.font = '28px sans-serif';
                context.textAlign = 'center'; context.fillText(String(i + 1), x + cellSize / 2, y + cellSize / 2 + 10);
            }
            continue;
        }
        // Keep a faint panel behind incomplete letters; finished letters stand alone.
        if (!showAll && counts[i] < paths[i].length) {
            context.save(); context.globalAlpha = .18;
            if (plainPanel.complete && plainPanel.naturalWidth) context.drawImage(plainPanel, x, y, cellSize, cellSize);
            context.restore();
        }
        context.save();
        context.translate(x + cellSize * .06, y + cellSize * .06);
        context.scale(cellSize * .88 / 109, cellSize * .88 / 109);
        context.strokeStyle = '#000'; context.lineWidth = 3;
        context.lineCap = context.lineJoin = 'round';
        for (let stroke = 0; stroke < (showAll ? paths[i].length : counts[i]); stroke++) {
            const progress = showAll || cleared ? 1 : Math.max(0, Math.min(1, (now - strokeStarts[i][stroke]) / strokeDuration));
            if (progress === 0) continue;
            if (progress < 1) {
                const length = strokeLengths[i][stroke];
                context.setLineDash([length, length]);
                context.lineDashOffset = length * (1 - progress);
            }
            context.stroke(paths[i][stroke]);
            context.setLineDash([]); context.lineDashOffset = 0;
        }
        context.restore();
    }
    return now;
}
function animateStrokes() {
    if (animationFrame || cleared || showAll) return;
    animationFrame = requestAnimationFrame(() => {
        animationFrame = 0;
        const now = drawArea();
        if (strokeStarts.some(starts => starts.length && starts[starts.length - 1] + strokeDuration > now)) animateStrokes();
    });
}
function cellAt(event) {
    const box = canvas.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width, y = (event.clientY - box.top) / box.height;
    if (x < 0 || y < 0 || x >= 1 || y >= 1) return -1;
    return Math.floor(y * 5) * 5 + Math.floor(x * 5);
}
canvas.addEventListener('pointerdown', event => {
    if (cleared || press || !event.isPrimary || event.button !== 0) return;
    press = { id: event.pointerId, index: cellAt(event), x: event.clientX, y: event.clientY, moved: false };
    canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
    if (press?.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) press.moved = true;
});
canvas.addEventListener('pointerup', event => {
    if (press?.id !== event.pointerId) return;
    const current = press; press = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (cleared || current.moved || current.index < 0 || cellAt(event) !== current.index) return;
    if (counts[current.index] < paths[current.index].length) {
        const starts = strokeStarts[current.index];
        starts.push(performance.now());
        counts[current.index]++; drawArea();
        animateStrokes();
    }
});
for (const name of ['pointercancel', 'lostpointercapture']) canvas.addEventListener(name, () => { press = null; });
window.addEventListener('blur', () => { press = null; });

function make_tweet(result) {
    const rows = Array.from({ length: 5 }, (_, row) => result.grid.slice(row * 5, row * 5 + 5).join('')).join('\n');
    return `CASE${config.caseId}\n\nScore: ${result.score}/25 (${result.attempt}回目)\n${rows}\n#NaguruzoMondo #IkkakuKaito\n${location.href.split(/[?#]/)[0]}`;
}
function showExplanationMessageOnScreen() {
    if (document.getElementById('explanation-message')) return;
    const box = document.createElement('details'); box.id = 'explanation-message';
    const header = document.createElement('summary'); header.textContent = '解説';
    const body = document.createElement('div'); body.id = 'explanation-message-body'; body.textContent = config.explanation;
    box.append(header, body); document.getElementById('canvas-container').append(box);
}
function showResultButtons(result) {
    document.querySelector('.quiz-container').style.display = 'none';
    const container = document.getElementById('canvas-container');
    const score = document.createElement('p'); score.id = 'score'; score.textContent = `Score: ${result.score}/25`;
    const buttons = document.createElement('div'); buttons.id = 'result-buttons';
    const share = document.createElement('button'); share.textContent = 'Xで共有';
    const tweet = make_tweet(result);
    share.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank', 'noopener,noreferrer'));
    const all = document.createElement('button'); all.textContent = '全部開ける';
    all.addEventListener('click', () => { showAll = true; drawArea(); showExplanationMessageOnScreen(); all.disabled = true; });
    buttons.append(share, all); container.append(score, buttons);
}
function submitAnswer() {
    if (cleared) return;
    const answer = document.getElementById('answerInput').value.trim().normalize('NFKC');
    if (config.answers.includes(answer)) {
        finalResult = snapshot(); cleared = true; press = null;
        cancelAnimationFrame(animationFrame); animationFrame = 0;
        drawArea(); showResultButtons(finalResult); window.showCaseMessage('正解！');
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
