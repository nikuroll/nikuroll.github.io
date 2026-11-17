'use strict';
const config = {
    caseId: 62,
    image: 'images/pic(26).PNG',
    bombPanels: [5, 10, 15, 20],
    answers: ['しっくす','シックス','6','six','Six','SIX','６'],
    hint: '左側の例示は「〇ぼむ」の形で表されるある動詞を表しているようです（例えば、しぼむなど）。ところでそのような動詞は「つぼむ」「くぼむ」「すぼむ」などがあり、その違いはあんまし分からない気もします。',
    explanation: '左側の例示は「〇ぼむ」の形で表されるある動詞を表しているようです（例えば、しぼむなど）。ところでそのような動詞は「つぼむ」「くぼむ」「すぼむ」などがあり、その違いはあんまし分からない気もしますが答えは「しっくす」です。',
};
const explanationMessage = config.explanation;
const clicked = Array(25).fill(false);
const actionLog = [];
let material, panelImages = [];
let revealed = 0, remainingAttempts = 3, status = 'playing';
let finalResult = null, showAll = false, press = null;
let warningShown = false, warningPending = false;
let boardCanvas;

function isBomb(index) {
    return config.bombPanels.includes(index + 1);
}

function preload() {
    material = loadImage(config.image);
    panelImages = clicked.map((_, i) => loadImage(`../images/pic(${i + 26}).PNG`));
}
function setup() {
    pixelDensity(pixelDensity() * 2);
    const renderer = createCanvas(Math.min(innerWidth, innerHeight, 800), Math.min(innerWidth, innerHeight, 800));
    renderer.parent('canvas');
    boardCanvas = renderer.elt;
    noLoop();
    drawArea();
    boardCanvas.addEventListener('pointerdown', event => {
        if (status !== 'playing' || warningPending || press || !event.isPrimary || event.button !== 0) return;
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
        drawArea();
        if (status === 'playing' && panelAt(event) === index) openPanel(index);
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
    background(255);
    image(material, 0, 0, width, height);
    if (showAll) return;
    for (let i = 0; i < 25; i++) {
        if (!clicked[i]) image(panelImages[i], i % 5 * width / 5, Math.floor(i / 5) * height / 5, width / 5, height / 5);
    }
    if (press) {
        noStroke(); fill(0, 0, 0, 100);
        rect(press.index % 5 * width / 5, Math.floor(press.index / 5) * height / 5, width / 5, height / 5);
    }
}
async function openPanel(index) {
    if (status !== 'playing' || warningPending || index < 0 || index >= 25 || clicked[index]) return;
    if (isBomb(index) && !warningShown) {
        warningShown = true;
        warningPending = true;
        const confirmed = await confirmBombOpening();
        warningPending = false;
        if (!confirmed || status !== 'playing') return;
    }
    clicked[index] = true; revealed++;
    actionLog.push(index);
    if (isBomb(index)) {
        finish('failed');
        return;
    }
    drawArea();
}

function confirmBombOpening() {
    const overlay = document.getElementById('bomb-warning');
    const openButton = document.getElementById('bomb-open');
    const cancelButton = document.getElementById('bomb-cancel');
    const previousFocus = document.activeElement;
    overlay.hidden = false;
    cancelButton.focus({ preventScroll: true });
    setTimeout(() => {
        if (!overlay.hidden) cancelButton.focus({ preventScroll: true });
    }, 0);
    return new Promise(resolve => {
        function close(confirmed) {
            overlay.hidden = true;
            openButton.removeEventListener('click', confirm);
            cancelButton.removeEventListener('click', cancel);
            document.removeEventListener('keydown', onKeyDown, true);
            if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
            resolve(confirmed);
        }
        function confirm() { close(true); }
        function cancel() { close(false); }
        function onKeyDown(event) {
            if (event.key === 'Escape') {
                event.preventDefault();
                cancel();
            } else if (event.key === 'Tab') {
                event.preventDefault();
                (document.activeElement === openButton ? cancelButton : openButton).focus({ preventScroll: true });
            }
            event.stopPropagation();
        }
        openButton.addEventListener('click', confirm);
        cancelButton.addEventListener('click', cancel);
        document.addEventListener('keydown', onKeyDown, true);
    });
}

function finish(nextStatus) {
    if (status !== 'playing') return;
    status = nextStatus;
    press = null;
    finalResult = resultSnapshot();
    drawArea();
    showResultButtons(make_tweet(finalResult));
    window.showCaseMessage(status === 'failed' ? '爆弾だ！失格！！！！' : '正解！');
}

function allOpen() {
    if (status === 'playing') return;
    showAll = true;
    drawArea();
}
function resultSnapshot() {
    return { status, score: 25 - revealed, grid: clicked.map(open => open ? '⬜' : '🟨'),
        attempt: 4 - remainingAttempts, actions: actionLog.slice() };
}
function make_tweet(result) {
    const rows = Array.from({ length: 5 }, (_, row) => result.grid.slice(row * 5, row * 5 + 5).join('')).join('\n');
    const actions = result.actions.map(index => index < 0 ? 'z' : String.fromCharCode(97 + index)).join('');
    const scoreLine = result.status === 'failed' ? 'Score: 失格' : `Score: ${result.score}/25 (${result.attempt}回目)`;
    return `CASE${config.caseId}\n\n${scoreLine}\n${rows}\n#NaguruzoMondo\n${location.origin}${location.pathname}?ac=${actions}`;
}
function submitAnswer() {
    if (status !== 'playing' || warningPending) return;
    const normalize = value => value.trim().normalize('NFKC').replace(/[ァ-ヶ]/g,
        letter => String.fromCharCode(letter.charCodeAt(0) - 0x60));
    const answer = normalize(document.getElementById('answerInput').value);
    if (config.answers.some(candidate => normalize(candidate) === answer)) {
        finish('solved');
    } else {
        remainingAttempts--;
        actionLog.push(-1);
        document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;
        window.showCaseMessage('ちがいます。' + (revealed === 21 ? config.hint : ''));
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
    container.appendChild(buttonContainer);
}
