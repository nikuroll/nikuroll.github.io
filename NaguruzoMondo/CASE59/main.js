'use strict';
const config = {
    caseId: 59,
    image: 'images/pic(26).PNG',
    noimage: 'images/noimage.PNG',
    answers: ["こきゅうてん","呼吸点","コキュウテン"],
    hint: '謎に表示されているタイミングで正解できていれば「９点」が獲得できました。',
    explanation: '謎に表示されているタイミングで正解できていれば「９点」が獲得できました。\n\n正解は「呼吸点」です。',
    snapshotScore: 9,
    snapshotRegion: { x: 210 / 945, y: 600 / 945, width: 200 / 945, height: 200 / 945 },
};
const explanationMessage = config.explanation;
const clicked = Array(25).fill(false);
const actionLog = [];
let material, noimage, panelImages = [];
let revealed = 0, remainingAttempts = 3, cleared = false;
let savedSnapshot = null, finalResult = null, showAll = false, press = null;
let boardCanvas;
const liveScore = LiveScore.create({ enabled: true,
    anchor: document.querySelector('.quiz-container'), getScore: () => 25 - revealed });

function preload() {
    material = loadImage(config.image);
    noimage = loadImage(config.noimage);
    panelImages = clicked.map((_, i) => loadImage(`../images/pic(${i + 26}).PNG`));
}
function setup() {
    const renderer = createCanvas(Math.min(innerWidth, innerHeight, 800), Math.min(innerWidth, innerHeight, 800));
    renderer.parent('canvas');
    boardCanvas = renderer.elt;
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
    image(material, 0, 0, width, height);
    const region = config.snapshotRegion;
    image(savedSnapshot || noimage, region.x * width, region.y * height, region.width * width, region.height * height);
    if (showAll) return;
    for (let i = 0; i < 25; i++) {
        if (!clicked[i]) image(panelImages[i], i % 5 * width / 5, Math.floor(i / 5) * height / 5, width / 5, height / 5);
    }
    if (press) {
        noStroke(); fill(0, 0, 0, 100);
        rect(press.index % 5 * width / 5, Math.floor(press.index / 5) * height / 5, width / 5, height / 5);
    }
}
function openPanel(index) {
    if (cleared || clicked[index]) return;
    clicked[index] = true; revealed++;
    actionLog.push(index);
    drawArea();
    if (!savedSnapshot && 25 - revealed === config.snapshotScore) {
        const scale = Math.max(config.snapshotRegion.width, config.snapshotRegion.height);
        const passes = Math.ceil(Math.log(Math.max(width, height) * pixelDensity()) / -Math.log(scale)) + 1;
        for (let pass = 0; pass < passes; pass++) {
            savedSnapshot = get(0, 0, width, height);
            drawArea();
        }
    }
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


