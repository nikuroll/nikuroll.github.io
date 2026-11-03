'use strict';
const config = {
    caseId: 60,
    image: 'images/question.svg',
    speechImage: 'images/eliza-speech.svg',
    noimage: 'images/noimage.PNG',
    answers: ['こみ', 'コミ'],
    hint: '',
    explanation: '上から「かこ」「げんざい」「みらい」。矢印に沿って読むと、女性は「いらいざ」、入口は「げんかん」、？は「こみ」です。',
    regions: [
        { x: 40, y: 65, size: 220, offset: -5 },
        { x: 40, y: 330, size: 220, offset: 0 },
        { x: 40, y: 595, size: 220, offset: 5 },
    ],
};
const explanationMessage = config.explanation;
const clicked = Array(25).fill(false);
const actionLog = [];
let material, speechMaterial, noimage, panelImages = [];
let revealed = 0, remainingAttempts = 3, cleared = false;
let finalResult = null, showAll = false, press = null;
const history = [clicked.slice()];
let predictionInformation;
const predictionPlans = [];
let futureCorrection = null, correctionFrame = null;
const correctionDuration = 500;
let boardCanvas;
const imageLevels = new WeakMap();
const liveScore = LiveScore.create({ enabled: true,
    anchor: document.querySelector('.quiz-container'), getScore: () => 25 - revealed });

function preload() {
    material = loadImage(config.image);
    speechMaterial = loadImage(config.speechImage);
    noimage = loadImage(config.noimage);
    panelImages = clicked.map((_, i) => loadImage(`../images/pic(${i + 26}).PNG`));
}
function setup() {
    pixelDensity(pixelDensity() * 2);
    const renderer = createCanvas(Math.min(innerWidth, innerHeight, 800), Math.min(innerWidth, innerHeight, 800));
    renderer.parent('canvas');
    boardCanvas = renderer.elt;
    const source = material.canvas;
    predictionInformation = Case60Prediction.measure(source.getContext('2d').getImageData(0, 0, source.width, source.height));
    noLoop();
    drawArea();
    boardCanvas.addEventListener('pointerdown', event => {
        if (cleared || press || !event.isPrimary || event.button !== 0) return;
        const index = panelAt(event);
        if (index < 0 || clicked[index]) return;
        press = { id: event.pointerId, index, x: event.clientX, y: event.clientY };
        drawArea();
    });
    document.addEventListener('pointermove', event => {
        if (press?.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) {
            press = null; drawArea();
        }
    });
    document.addEventListener('pointerup', event => {
        if (press?.id !== event.pointerId) return;
        const index = press.index;
        press = null;
        if (!cleared && panelAt(event) === index) openPanel(index);
        else drawArea();
    });
    document.addEventListener('pointercancel', cancelPress);
    window.addEventListener('blur', () => { press = null; drawArea(); });
    boardCanvas.addEventListener('contextmenu', event => event.preventDefault());
}
function cancelPress(event) {
    if (press?.id !== event.pointerId) return;
    press = null; drawArea();
}
function panelAt(event) {
    const rect = boardCanvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
    return x >= 0 && x < 1 && y >= 0 && y < 1 ? Math.floor(y * 5) * 5 + Math.floor(x * 5) : -1;
}
function drawArea() {
    liveScore.update();
    background(255);
    const context = drawingContext;
    context.save();
    context.scale(width / 1000, height / 1000);
    drawTemporalBoard(context, revealed, width * pixelDensity(), showAll, revealed, true);
    context.restore();
    if (press) {
        noStroke(); fill(0, 0, 0, 100);
        rect(press.index % 5 * width / 5, Math.floor(press.index / 5) * height / 5, width / 5, height / 5);
    }
}
function stateAt(turn, anchor = revealed) {
    if (turn < 0) return null;
    if (turn <= anchor) return history[turn];
    const state = history[anchor].slice();
    const plan = predictionPlans[anchor] || (predictionPlans[anchor] = Case60Prediction.predict(state, 25, predictionInformation));
    for (const index of plan.slice(0, turn - anchor)) state[index] = true;
    return state;
}
function imageAtScale(image, pixels) {
    let levels = imageLevels.get(image);
    if (!levels) {
        levels = [image.canvas];
        let source = image.canvas;
        while (source.width > 1 || source.height > 1) {
            const next = document.createElement('canvas');
            next.width = Math.max(1, Math.ceil(source.width / 2));
            next.height = Math.max(1, Math.ceil(source.height / 2));
            next.getContext('2d').drawImage(source, 0, 0, next.width, next.height);
            levels.push(next);
            source = next;
        }
        imageLevels.set(image, levels);
    }
    let source = levels[0];
    for (const level of levels) {
        if (level.width < Math.max(1, pixels)) break;
        source = level;
    }
    return source;
}
function drawTemporalBoard(context, turn, pixels, uncover = false, anchor = revealed, root = false) {
    const state = stateAt(turn, anchor);
    if (!state) {
        context.drawImage(imageAtScale(noimage, pixels), 0, 0, 1000, 1000);
        return;
    }
    context.drawImage(imageAtScale(material, pixels), 0, 0, 1000, 1000);
    if (turn >= 15) context.drawImage(imageAtScale(speechMaterial, pixels), 0, 0, 1000, 1000);
    if (pixels > 1) {
        for (const region of config.regions) {
            context.save();
            context.translate(region.x, region.y);
            context.scale(region.size / 1000, region.size / 1000);
            const target = turn + region.offset;
            drawTemporalBoard(context, target, pixels * region.size / 1000, false,
                Math.max(0, Math.min(anchor, target)));
            if (root && region.offset === 5) drawFutureCorrection(context);
            context.restore();
        }
    }
    if (!uncover) {
        for (let i = 0; i < 25; i++) {
            if (!state[i]) context.drawImage(imageAtScale(panelImages[i], pixels / 5), i % 5 * 200, Math.floor(i / 5) * 200, 200, 200);
        }
    }
}
function drawFutureCorrection(context) {
    if (!futureCorrection) return;
    const progress = Math.min(1, Math.max(0, (performance.now() - futureCorrection.started) / correctionDuration));
    const edge = 1000 * (progress * progress * (3 - 2 * progress));
    context.save();
    context.beginPath();
    context.rect(0, 0, 1000, 1000);
    context.clip();
    context.save();
    context.beginPath();
    context.rect(edge, 0, 1000 - edge, 1000);
    context.clip();
    context.drawImage(futureCorrection.previous, 0, 0, 1000, 1000);
    context.restore();
    const intensity = Math.sin(progress * Math.PI);
    context.fillStyle = `rgba(120, 213, 245, ${0.18 * intensity})`;
    context.fillRect(0, 0, 1000, 1000);
    const band = context.createLinearGradient(edge - 65, 0, edge + 65, 0);
    band.addColorStop(0, 'rgba(190, 240, 255, 0)');
    band.addColorStop(0.5, `rgba(230, 252, 255, ${0.9 * intensity})`);
    band.addColorStop(1, 'rgba(190, 240, 255, 0)');
    context.fillStyle = band;
    context.fillRect(edge - 65, 0, 130, 1000);
    context.fillStyle = `rgba(30, 150, 205, ${0.8 * intensity})`;
    context.fillRect(edge - 3, 0, 6, 1000);
    for (let y = 30; y < 1000; y += 65) {
        context.fillStyle = `rgba(255, 255, 255, ${0.35 * intensity})`;
        context.fillRect(0, y, 1000, 3);
    }
    context.restore();
}
function captureFuture() {
    const region = config.regions.find(region => region.offset === 5);
    const pixels = Math.max(1, Math.ceil(width * pixelDensity() * region.size / 1000));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = pixels;
    const context = canvas.getContext('2d');
    context.scale(pixels / 1000, pixels / 1000);
    drawTemporalBoard(context, revealed + 5, pixels);
    drawFutureCorrection(context);
    return canvas;
}
function stopFutureCorrection() {
    if (correctionFrame !== null) cancelAnimationFrame(correctionFrame);
    correctionFrame = null;
    futureCorrection = null;
}
function animateFutureCorrection() {
    correctionFrame = requestAnimationFrame(() => {
        correctionFrame = null;
        if (!futureCorrection) return;
        if (performance.now() - futureCorrection.started >= correctionDuration) futureCorrection = null;
        drawArea();
        if (futureCorrection) animateFutureCorrection();
    });
}
function openPanel(index) {
    if (cleared || clicked[index]) return;
    const missed = !stateAt(revealed + 5)[index];
    const previous = missed ? captureFuture() : null;
    stopFutureCorrection();
    clicked[index] = true; revealed++;
    actionLog.push(index);
    history.push(clicked.slice());
    if (missed) {
        futureCorrection = { previous, started: performance.now() };
        animateFutureCorrection();
    }
    drawArea();
}
function allOpen() {
    showAll = true;
    drawArea();
}
function resultSnapshot() {
    return { score: 25 - revealed, grid: clicked.map(open => open ? '⬜' : '🟨'),
        attempt: 4 - remainingAttempts, actions: actionLog.slice() };
}
function make_tweet(result) {
    const rows = Array.from({ length: 5 }, (_, row) => result.grid.slice(row * 5, row * 5 + 5).join('')).join('\n');
    const actions = result.actions.map(index => index < 0 ? 'z' : String.fromCharCode(97 + index)).join('');
    return `CASE${config.caseId}\n\nScore: ${result.score}/25 (${result.attempt}回目)\n${rows}\n#NaguruzoMondo\n${location.origin}${location.pathname}?ac=${actions}`;
}
function submitAnswer() {
    if (cleared) return;
    const normalize = value => value.trim().normalize('NFKC').toLowerCase();
    const answer = normalize(document.getElementById('answerInput').value);
    if (config.answers.some(candidate => normalize(candidate) === answer)) {
        press = null;
        stopFutureCorrection();
        finalResult = resultSnapshot();
        cleared = true;
        liveScore.hide();
        drawArea();
        showResultButtons(make_tweet(finalResult));
        window.showCaseMessage('正解！');
    } else {
        remainingAttempts--;
        actionLog.push(-1);
        document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;
        window.showCaseMessage('ちがいます。' + (revealed === 25 ? config.hint : ''));
    }
}
document.getElementById('submitAnswer').addEventListener('click', submitAnswer);
document.getElementById('answerInput').addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229) {
        event.preventDefault();
        submitAnswer();
    }
});

function showExplanationMessageOnScreen(message, open = false) {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    let box = document.getElementById('explanation-message');
    if (!box) {
        box = document.createElement('div');
        box.id = 'explanation-message';
        box.style.marginTop = '16px';
        box.style.maxWidth = '800px';
        box.style.width = 'min(800px, 92vw)';
        box.style.padding = '12px 14px';
        box.style.borderRadius = '8px';
        box.style.border = '1px solid rgba(0,0,0,0.15)';
        box.style.background = 'rgba(255,255,255,0.95)';
        box.style.boxShadow = '0 6px 18px rgba(0,0,0,0.10)';
        box.style.color = '#222';
        box.style.fontSize = '14px';
        box.style.lineHeight = '1.6';
        box.style.whiteSpace = 'pre-wrap';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.gap = '12px';
        header.style.marginBottom = '8px';
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.tabIndex = 0;
        header.setAttribute('role', 'button');
        header.setAttribute('aria-label', '解説を開閉');
        header.setAttribute('aria-expanded', 'false');

        const title = document.createElement('div');
        title.textContent = '解説';
        title.style.fontWeight = '700';

        const toggleIcon = document.createElement('span');
        toggleIcon.id = 'explanation-toggle-icon';
        toggleIcon.textContent = '▶';
        toggleIcon.style.fontSize = '16px';
        toggleIcon.style.lineHeight = '1';
        toggleIcon.style.padding = '2px 6px';
        toggleIcon.style.opacity = '0.9';
        toggleIcon.style.pointerEvents = 'none';

        const toggle = () => {
            const body = document.getElementById('explanation-message-body');
            const icon = document.getElementById('explanation-toggle-icon');
            const isOpen = body && body.style.display !== 'none';
            if (body) {
                body.style.display = isOpen ? 'none' : 'block';
            }
            if (icon) {
                icon.textContent = isOpen ? '▶' : '▼';
            }
            header.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        };

        header.addEventListener('click', () => {
            toggle();
        });
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });

        header.appendChild(title);
        header.appendChild(toggleIcon);

        const body = document.createElement('div');
        body.id = 'explanation-message-body';
        body.style.display = 'none';

        box.appendChild(header);
        box.appendChild(body);

        container.appendChild(box);
    }

    const body = document.getElementById('explanation-message-body');
    if (body) body.textContent = message;

    const icon = document.getElementById('explanation-toggle-icon');
    if (body) body.style.display = open ? 'block' : 'none';
    if (icon) icon.textContent = open ? '▼' : '▶';
    if (box) box.setAttribute('aria-expanded', open ? 'true' : 'false');

    box.style.display = 'block';
 }


function showResultButtons(tweetMess) {
    const quizContainer = document.querySelector('.quiz-container');
    if (quizContainer) {
        quizContainer.style.display = 'none';
    }

    if (document.getElementById('result-buttons')) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'result-buttons';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '20px';
    buttonContainer.style.marginTop = '20px';

    const shareButton = document.createElement('button');
    shareButton.textContent = 'Xで共有';
    shareButton.style.padding = '10px 20px';
    shareButton.style.fontSize = '16px';
    shareButton.style.color = '#fff';
    shareButton.style.backgroundColor = '#007bff';
    shareButton.style.border = 'none';
    shareButton.style.borderRadius = '5px';
    shareButton.style.cursor = 'pointer';
    shareButton.addEventListener('click', () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetMess)}`, '_blank', 'noopener,noreferrer');
    });

    const customButton = document.createElement('button');
    customButton.textContent = '全部開ける';
    customButton.style.padding = '10px 20px';
    customButton.style.fontSize = '16px';
    customButton.style.color = '#fff';
    customButton.style.backgroundColor = '#28a745';
    customButton.style.border = 'none';
    customButton.style.borderRadius = '5px';
    customButton.style.cursor = 'pointer';
    customButton.addEventListener('click', () => {
        allOpen();
        showExplanationMessageOnScreen(explanationMessage, false);
        customButton.disabled = true;
        customButton.style.backgroundColor = '#6c757d';
        customButton.style.cursor = 'not-allowed';
    });

    buttonContainer.appendChild(shareButton);
    buttonContainer.appendChild(customButton);

    const container = document.getElementById('canvas-container');
    const score = document.createElement('p');
    score.id = 'score';
    score.textContent = `Score: ${finalResult.score}/25`;
    container.appendChild(score);
    container.appendChild(buttonContainer);
}


