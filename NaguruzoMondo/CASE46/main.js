let nazoid = 46;
let imageNum = 28; // 画像の枚数
let backgroundIndex = 26; // 背景画像のインデックス
let images = [];
let showidx = [];
let grid = 5;
let cellWidth, cellHeight;
let startX, startY;

let clicked = [];
let cleared = 0;
let revealed = 0;
let worldlineTriggered = false;
let worldlineAnimationFrame = null;
let worldlineDarkFadeFrame = null;
let worldlineDarkOverlayAlpha = 0;

let actionLog = [];

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = ["なす", "茄子", "ナス"];
let hintMessage = "";
let explanationMessage = "リアルタイム版ではCASE40は一人一マスしか開けない制約のもとで、共有した盤面上で全員で協力して答えを導き出す形式でした。";

let remainingAttempts = 3;

let revealedQuestions = 0;

const WORLDLINE_PANEL_INDEX = 12;
const WORLDLINE_SPLIT_MS = 1850;
const WORLDLINE_OVERLAY_OPACITY = 0.5;
const WORLDLINE_DARK_OVERLAY_ALPHA = 135;
const WORLDLINE_DARK_FADE_MS = 900;
const WORLDLINE_BACKGROUND_INDICES = {
    left: backgroundIndex,
    right: backgroundIndex+1
};

const worldlineRightState = {
    clicked: [],
    showidx: [],
    actionLog: [],
    revealed: 0,
    remainingAttempts: 3,
    canvas: null,
    remainingAttemptsElement: null,
    answerInput: null,
    submitButton: null,
    resultContainer: null,
    explanationBox: null,
    pressCell: null,
    pressedPointerId: null,
    cleared: 0,
    backgroundIndex: WORLDLINE_BACKGROUND_INDICES.right
};

function preload() {
    for (let i = 0; i < imageNum; i++) {
        const imagePath = i <= 25 ? `../images/pic(${i === 0 ? 0 : i + 25}).PNG` : `images/pic(${i}).PNG`;
        images.push(loadImage(imagePath));
    }

    for (let i = 1; i <= grid * grid; i++) {
        clicked.push(0);
        showidx.push(i);
    }
}

function setup() {
    startwidth = min(window.innerWidth, window.innerHeight, 800);
    const canvas = createCanvas(startwidth, startwidth);
    canvas.parent('canvas');
    background(255);
    noLoop();

    cellWidth = width / grid;
    cellHeight = height / grid;

    // 初期画像描画
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (index < images.length) {
                image(images[showidx[index]], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }
    }

}

function calcNewImage(index) {
    return 0;
}

function make_tweet(res = 0) {
    score = grid * grid;
    for (let i = 0; i < grid * grid; i++) {
        if (clicked[i] == 1) {
            score--;
        }
    }

    attempt = 3 - remainingAttempts + 1;

    if (res == 0) {
        tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid * grid} (${attempt}回目)\n`;
    }
    for (let i = 0; i < grid; i++) {
        ret = "";
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (clicked[index] == 1) {
                ret += "⬜";
            } else {
                ret += "🟨";
            }
        }

        tweetText += ret + "\n";
    }

    let palam = "?ac=";
    for (let i = 0; i < actionLog.length; i++) {
        if (actionLog[i] == -1) {
            palam += "z";
        } else {
            // # x番目のアルファベット
            palam += String.fromCharCode(actionLog[i] + 97);
        }
    }

    tweetText += `#NaguruzoMondo\n`;
    tweetText += location.origin + location.pathname + palam;

    console.log(tweetText);
    return tweetText;
}


function tweet(tweet) {
    // XでツイートするためのURLを生成
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    // 新しいウィンドウで開く
    window.open(tweetUrl, '_blank');
}

function drawSpecial() {
}

function easeWorldlineSplit(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function getWorldlineSplitDistance() {
    const canvasDistance = width ? width * 0.58 : window.innerWidth * 0.45;
    return Math.min(Math.max(canvasDistance, 280), window.innerWidth * 0.52);
}

function isPortraitWorldlineSplit() {
    return window.innerWidth <= 700 && window.innerHeight > window.innerWidth;
}

function getWorldlineVerticalSplitDistance() {
    const sourceRoot = document.getElementById('worldlineRoot');
    const sourceHeight = sourceRoot ? sourceRoot.getBoundingClientRect().height : window.innerHeight;
    return Math.max(sourceHeight + 24, window.innerHeight * 0.78);
}

function stripCloneIdentity(node) {
    if (node.removeAttribute) {
        node.removeAttribute('id');
        node.removeAttribute('for');
        node.removeAttribute('name');
    }

    if (node.querySelectorAll) {
        node.querySelectorAll('[id], [for], [name]').forEach((child) => {
            child.removeAttribute('id');
            child.removeAttribute('for');
            child.removeAttribute('name');
        });
    }
}

function syncFormControlsToClone(sourceRoot, cloneRoot) {
    const sourceControls = sourceRoot.querySelectorAll('input, textarea, select');
    const cloneControls = cloneRoot.querySelectorAll('input, textarea, select');

    sourceControls.forEach((source, index) => {
        const target = cloneControls[index];
        if (!target) return;

        target.value = source.value;
        target.checked = source.checked;
    });
}

function syncCanvasToClone(sourceRoot, cloneRoot) {
    const sourceCanvases = sourceRoot.querySelectorAll('canvas');
    const cloneCanvases = cloneRoot.querySelectorAll('canvas');

    sourceCanvases.forEach((source, index) => {
        const target = cloneCanvases[index];
        if (!target) return;

        target.width = source.width;
        target.height = source.height;
        target.style.width = source.style.width;
        target.style.height = source.style.height;

        const context = target.getContext('2d');
        if (context) {
            context.drawImage(source, 0, 0);
        }
    });
}

function resetRightWorldlineState() {
    worldlineRightState.clicked = clicked.slice();
    worldlineRightState.showidx = showidx.slice();
    worldlineRightState.actionLog = actionLog.slice();
    worldlineRightState.revealed = revealed;
    worldlineRightState.remainingAttempts = remainingAttempts;
    worldlineRightState.cleared = 0;
    worldlineRightState.backgroundIndex = WORLDLINE_BACKGROUND_INDICES.right;
}

function drawImageToContext(context, imageObject, x, y, w, h) {
    const source = imageObject && imageObject.canvas;
    if (source) {
        context.drawImage(source, x, y, w, h);
    }
}

function drawRightWorldlineCanvas(shadowIndex = null) {
    const canvas = worldlineRightState.canvas;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const branchCellWidth = canvasWidth / grid;
    const branchCellHeight = canvasHeight / grid;

    context.save();
    context.globalCompositeOperation = 'source-over';
    context.fillStyle = worldlineDarkOverlayAlpha > 0 ? '#000' : '#fff';
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    drawImageToContext(context, images[worldlineRightState.backgroundIndex], 0, 0, canvasWidth, canvasHeight);
    if (worldlineDarkOverlayAlpha > 0) {
        context.fillStyle = `rgba(0, 0, 0, ${worldlineDarkOverlayAlpha / 255})`;
        context.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            const index = i * grid + j;
            const imageIndex = worldlineRightState.showidx[index];
            if (!(imageIndex < images.length && imageIndex > 0)) continue;

            context.globalCompositeOperation =
                1 <= imageIndex && imageIndex <= grid * grid ? 'source-over' : 'multiply';
            drawImageToContext(
                context,
                images[imageIndex],
                j * branchCellWidth,
                i * branchCellHeight,
                branchCellWidth,
                branchCellHeight
            );

            if (shadowIndex === index) {
                context.globalCompositeOperation = 'source-over';
                context.fillStyle = 'rgba(0, 0, 0, 0.39)';
                context.fillRect(
                    j * branchCellWidth,
                    i * branchCellHeight,
                    branchCellWidth,
                    branchCellHeight
                );
            }
        }
    }

    context.restore();
}

function getRightWorldlineCellFromEvent(event) {
    const canvas = worldlineRightState.canvas;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;

    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    const col = Math.floor(x / (canvas.width / grid));
    const row = Math.floor(y / (canvas.height / grid));

    if (col < 0 || col >= grid || row < 0 || row >= grid) return null;

    return {
        col,
        row,
        index: row * grid + col
    };
}

function handleRightWorldlinePointerDown(event) {
    if (event.button === 2 || worldlineRightState.cleared != 0) {
        event.preventDefault();
        return;
    }

    const cell = getRightWorldlineCellFromEvent(event);
    if (!cell || worldlineRightState.clicked[cell.index] == 1) return;

    worldlineRightState.pressCell = cell;
    worldlineRightState.pressedPointerId = event.pointerId;

    const canvas = worldlineRightState.canvas;
    if (canvas && canvas.setPointerCapture) {
        canvas.setPointerCapture(event.pointerId);
    }

    drawRightWorldlineCanvas(cell.index);
}

function openRightWorldlinePanel(index) {
    if (worldlineRightState.clicked[index] == 1) return;

    worldlineRightState.actionLog.push(index);
    worldlineRightState.clicked[index] = 1;
    worldlineRightState.showidx[index] = calcNewImage(index);
    worldlineRightState.revealed++;
    drawRightWorldlineCanvas();
}

function handleRightWorldlinePointerUp(event) {
    if (event.button === 2) {
        event.preventDefault();
        return;
    }

    const pressCell = worldlineRightState.pressCell;
    const releaseCell = getRightWorldlineCellFromEvent(event);
    worldlineRightState.pressCell = null;
    worldlineRightState.pressedPointerId = null;

    if (!pressCell || !releaseCell || worldlineRightState.cleared != 0) {
        drawRightWorldlineCanvas();
        return;
    }

    if (pressCell.index === releaseCell.index) {
        openRightWorldlinePanel(releaseCell.index);
        return;
    }

    drawRightWorldlineCanvas();
}

function handleRightWorldlinePointerCancel() {
    worldlineRightState.pressCell = null;
    worldlineRightState.pressedPointerId = null;
    drawRightWorldlineCanvas();
}

function makeTweetFromWorldlineState(state) {
    let score = grid * grid;
    for (let i = 0; i < grid * grid; i++) {
        if (state.clicked[i] == 1) {
            score--;
        }
    }

    const attempt = 3 - state.remainingAttempts + 1;
    let text = `CASE${nazoid}\n\nScore: ${score}/${grid * grid} (${attempt}回目)\n`;

    for (let i = 0; i < grid; i++) {
        let ret = "";
        for (let j = 0; j < grid; j++) {
            const index = i * grid + j;
            ret += state.clicked[index] == 1 ? "⬜" : "🟨";
        }
        text += ret + "\n";
    }

    let palam = "?ac=";
    for (let i = 0; i < state.actionLog.length; i++) {
        palam += state.actionLog[i] == -1 ? "z" : String.fromCharCode(state.actionLog[i] + 97);
    }

    text += `#NaguruzoMondo\n`;
    text += location.origin + location.pathname + palam;
    return text;
}

function allOpenRightWorldline() {
    for (let i = 0; i < grid * grid; i++) {
        if (worldlineRightState.clicked[i] == 0) {
            worldlineRightState.clicked[i] = 1;
            worldlineRightState.showidx[i] = calcNewImage(i);
        }
    }

    worldlineRightState.revealed = grid * grid;
    drawRightWorldlineCanvas();
}

function showRightWorldlineResultButtons(tweetMessage) {
    const cloneContainer = document.getElementById('worldlineClone');
    if (!cloneContainer || worldlineRightState.resultContainer) return;

    const quizContainer = cloneContainer.querySelector('.quiz-container');
    if (quizContainer) {
        quizContainer.style.display = 'none';
    }

    const buttonContainer = document.createElement('div');
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
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetMessage)}`;
        window.open(tweetUrl, '_blank');
    });

    const openButton = document.createElement('button');
    openButton.textContent = '全部開ける';
    openButton.style.padding = '10px 20px';
    openButton.style.fontSize = '16px';
    openButton.style.color = '#fff';
    openButton.style.backgroundColor = '#28a745';
    openButton.style.border = 'none';
    openButton.style.borderRadius = '5px';
    openButton.style.cursor = 'pointer';
    openButton.addEventListener('click', () => {
        allOpenRightWorldline();
        showRightWorldlineExplanation(explanationMessage, false);
        openButton.disabled = true;
        openButton.style.backgroundColor = '#6c757d';
        openButton.style.cursor = 'not-allowed';
    });

    buttonContainer.appendChild(shareButton);
    buttonContainer.appendChild(openButton);

    const targetContainer = cloneContainer.querySelector('[data-worldline-canvas-container]');
    if (targetContainer) {
        targetContainer.appendChild(buttonContainer);
    }

    worldlineRightState.resultContainer = buttonContainer;
}

function showRightWorldlineExplanation(message, open = false) {
    const targetContainer = document.querySelector('#worldlineClone [data-worldline-canvas-container]');
    if (!targetContainer) return;

    let box = worldlineRightState.explanationBox;
    if (!box) {
        box = document.createElement('div');
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
        toggleIcon.textContent = '▶';
        toggleIcon.style.fontSize = '16px';
        toggleIcon.style.lineHeight = '1';
        toggleIcon.style.padding = '2px 6px';
        toggleIcon.style.opacity = '0.9';
        toggleIcon.style.pointerEvents = 'none';

        const body = document.createElement('div');
        body.style.display = 'none';

        const toggle = () => {
            const isOpen = body.style.display !== 'none';
            body.style.display = isOpen ? 'none' : 'block';
            toggleIcon.textContent = isOpen ? '▶' : '▼';
            header.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        };

        header.addEventListener('click', toggle);
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });

        header.appendChild(title);
        header.appendChild(toggleIcon);
        box.appendChild(header);
        box.appendChild(body);
        targetContainer.appendChild(box);

        worldlineRightState.explanationBox = box;
    }

    const body = box.lastChild;
    const icon = box.firstChild && box.firstChild.lastChild;
    if (body) {
        body.textContent = message;
        body.style.display = open ? 'block' : 'none';
    }
    if (icon) {
        icon.textContent = open ? '▼' : '▶';
    }
    if (box.firstChild) {
        box.firstChild.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    box.style.display = 'block';
}

function submitRightWorldlineAnswer() {
    const input = worldlineRightState.answerInput;
    if (!input) return;

    const answer = input.value;
    if (answers.includes(answer.toLowerCase()) || answers.includes(answer)) {
        alert('正解！');
        worldlineRightState.cleared = 1;
        showRightWorldlineResultButtons(makeTweetFromWorldlineState(worldlineRightState));
        return;
    }

    if (answers.includes(answer)) {
        answers = answers.filter(e => e !== answer);
    }

    worldlineRightState.remainingAttempts--;
    if (worldlineRightState.remainingAttemptsElement) {
        worldlineRightState.remainingAttemptsElement.textContent = `残り解答回数: ${worldlineRightState.remainingAttempts}`;
    }

    if (worldlineRightState.revealed == 25) {
        alert('ちがいます。' + hintMessage);
    } else {
        alert(`ちがいます`);
    }

    worldlineRightState.actionLog.push(-1);
}

function initializeRightWorldlineInteractions() {
    const cloneContainer = document.getElementById('worldlineClone');
    if (!cloneContainer) return;

    const canvas = cloneContainer.querySelector('canvas');
    const quizContainer = cloneContainer.querySelector('.quiz-container');
    const canvasContainer = quizContainer
        ? Array.from(quizContainer.parentElement.children).find((child) => child !== quizContainer)
        : null;
    const quizInfo = cloneContainer.querySelector('.quiz-info');
    const answerInput = cloneContainer.querySelector('.quiz-input');
    const submitButton = cloneContainer.querySelector('.quiz-button');

    if (canvasContainer) {
        canvasContainer.setAttribute('data-worldline-canvas-container', 'right');
    }

    worldlineRightState.canvas = canvas;
    worldlineRightState.remainingAttemptsElement = quizInfo;
    worldlineRightState.answerInput = answerInput;
    worldlineRightState.submitButton = submitButton;
    worldlineRightState.resultContainer = null;
    worldlineRightState.explanationBox = null;
    worldlineRightState.pressCell = null;
    worldlineRightState.pressedPointerId = null;

    if (quizInfo) {
        quizInfo.textContent = `残り解答回数: ${worldlineRightState.remainingAttempts}`;
    }

    if (canvas) {
        canvas.addEventListener('pointerdown', handleRightWorldlinePointerDown);
        canvas.addEventListener('pointerup', handleRightWorldlinePointerUp);
        canvas.addEventListener('pointercancel', handleRightWorldlinePointerCancel);
        canvas.addEventListener('pointerleave', handleRightWorldlinePointerCancel);
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    if (submitButton) {
        submitButton.addEventListener('click', submitRightWorldlineAnswer);
    }

    drawRightWorldlineCanvas();
}

function buildWorldlineClone() {
    const sourceRoot = document.getElementById('worldlineRoot');
    const cloneContainer = document.getElementById('worldlineClone');
    if (!sourceRoot || !cloneContainer) return false;

    cloneContainer.innerHTML = '';

    resetRightWorldlineState();

    const clone = sourceRoot.cloneNode(true);
    stripCloneIdentity(clone);
    syncFormControlsToClone(sourceRoot, clone);
    cloneContainer.appendChild(clone);
    syncCanvasToClone(sourceRoot, cloneContainer);
    initializeRightWorldlineInteractions();

    return true;
}

function setWorldlinePosition(progress) {
    const sourceRoot = document.getElementById('worldlineRoot');
    const cloneContainer = document.getElementById('worldlineClone');
    const stage = document.getElementById('worldlineStage');
    if (!sourceRoot || !cloneContainer) return;

    const eased = easeWorldlineSplit(progress);
    const isVertical = isPortraitWorldlineSplit();
    const distance = isVertical ? getWorldlineVerticalSplitDistance() : getWorldlineSplitDistance();
    const sourceX = isVertical ? 0 : -distance * eased;
    const sourceY = 0;
    const cloneX = isVertical ? 0 : distance * eased;
    const cloneY = isVertical ? distance * eased : 0;

    if (stage) {
        if (isVertical) {
            stage.style.minWidth = '';
            stage.style.minHeight = `${Math.ceil(distance + window.innerHeight)}px`;
        } else {
            stage.style.minWidth = `${Math.ceil(window.innerWidth + distance)}px`;
            stage.style.minHeight = '';
        }
    }

    sourceRoot.style.transform = `translate3d(${sourceX}px, ${sourceY}px, 0)`;
    cloneContainer.style.transform = `translate3d(${cloneX}px, ${cloneY}px, 0)`;

    const isSplitting = progress < 1;
    sourceRoot.style.opacity = isSplitting ? WORLDLINE_OVERLAY_OPACITY : '1';
    cloneContainer.style.opacity = isSplitting ? WORLDLINE_OVERLAY_OPACITY : '1';
}

function animateWorldlineSplit() {
    const sourceRoot = document.getElementById('worldlineRoot');
    const cloneContainer = document.getElementById('worldlineClone');
    if (!sourceRoot || !cloneContainer) return;

    document.body.classList.add('worldline-splitting');
    setWorldlinePosition(0);

    const startTime = performance.now();
    const step = (now) => {
        const progress = Math.min((now - startTime) / WORLDLINE_SPLIT_MS, 1);
        setWorldlinePosition(progress);

        if (progress < 1) {
            worldlineAnimationFrame = requestAnimationFrame(step);
            return;
        }

        document.body.classList.remove('worldline-splitting');
        document.body.classList.add('worldline-settled');
        sourceRoot.style.transition = 'opacity 260ms ease-out, filter 260ms ease-out';
        cloneContainer.style.transition = 'opacity 260ms ease-out, filter 260ms ease-out';
        sourceRoot.style.opacity = '1';
        cloneContainer.style.opacity = '1';
        worldlineAnimationFrame = null;
        fadeOutWorldlineDarkness();
    };

    worldlineAnimationFrame = requestAnimationFrame(step);
}

function triggerWorldlineSplit() {
    if (worldlineTriggered || cleared != 0) return;

    worldlineTriggered = true;
    worldlineDarkOverlayAlpha = WORLDLINE_DARK_OVERLAY_ALPHA;
    document.body.classList.add('worldline-active');
    document.body.classList.add('worldline-dim');
    document.body.style.setProperty('--worldline-page-darkness', '1');
    drawArea();

    requestAnimationFrame(() => {
        if (!buildWorldlineClone()) return;
        animateWorldlineSplit();
    });
}

function fadeOutWorldlineDarkness() {
    if (worldlineDarkFadeFrame) {
        cancelAnimationFrame(worldlineDarkFadeFrame);
    }

    const startTime = performance.now();
    const startAlpha = worldlineDarkOverlayAlpha;

    const step = (now) => {
        const progress = Math.min((now - startTime) / WORLDLINE_DARK_FADE_MS, 1);
        const eased = easeWorldlineSplit(progress);
        const remaining = 1 - eased;

        worldlineDarkOverlayAlpha = startAlpha * remaining;
        document.body.style.setProperty('--worldline-page-darkness', String(remaining));
        drawArea();
        drawRightWorldlineCanvas();

        if (progress < 1) {
            worldlineDarkFadeFrame = requestAnimationFrame(step);
            return;
        }

        worldlineDarkOverlayAlpha = 0;
        document.body.classList.remove('worldline-dim');
        document.body.style.removeProperty('--worldline-page-darkness');
        drawArea();
        drawRightWorldlineCanvas();
        worldlineDarkFadeFrame = null;
    };

    worldlineDarkFadeFrame = requestAnimationFrame(step);
}

function drawArea() {
    // 背景と画像を再描画して影を消す
    background(worldlineDarkOverlayAlpha > 0 ? 0 : 255);

    const activeBackgroundIndex = worldlineTriggered
        ? WORLDLINE_BACKGROUND_INDICES.left
        : backgroundIndex;
    image(images[activeBackgroundIndex], 0, 0, width, height);

    if (worldlineDarkOverlayAlpha > 0) {
        push();
        blendMode(BLEND);
        noStroke();
        fill(0, worldlineDarkOverlayAlpha);
        rect(0, 0, width, height);
        pop();
    }

    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (1<= showidx[index] && showidx[index] <= grid*grid){
                blendMode(BLEND);
            }else{
                blendMode(MULTIPLY);
            }

            if (showidx[index] < images.length && showidx[index] > 0) {
                image(images[showidx[index]], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }

        }
    }
    blendMode(BLEND);
}

function allOpen() {
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            if (clicked[i * grid + j] == 0) {
                clicked[i * grid + j] = 1;
                let index = i * grid + j;
                showidx[index] = calcNewImage(index);
            }
        }
    }
    drawArea();
}

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

function mousePressed() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    // タッチ開始位置を記録
    startX = mouseX;
    startY = mouseY;

    // タッチ中のマスを影で強調
    let col = floor(mouseX / cellWidth);
    let row = floor(mouseY / cellHeight);
    if (clicked[row * grid + col] === true) {
        return;
    }

    if (col >= 0 && col < grid && row >= 0 && row < grid) {
        fill(0, 0, 0, 100); // 半透明の黒
        noStroke();
        rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    if (cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);

        if (clicked[row * grid + col] == 0 && col >= 0 && col < grid && row >= 0 && row < grid) {
            let index = row * grid + col;
            actionLog.push(index);
            clicked[index] = true;
            newpic = calcNewImage(index);
            showidx[index] = newpic;
            drawArea();
            revealed++;

            if (index === WORLDLINE_PANEL_INDEX) {
                triggerWorldlineSplit();
            }
        }
    }

    drawArea();
}

// Add event listener for the quiz answer submission
const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value;
        if (answers.includes(answerInput.toLowerCase())) {
            alert('正解！');

            tweetMess = make_tweet();

            cleared = 1;

            showResultButtons(tweetMess);
        } else {
            if (answers.includes(answerInput)) {
                answers = answers.filter(e => e !== answerInput);
            }

            remainingAttempts--;
            document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;

            if (revealed == 25){
                alert('ちがいます。' + hintMessage);
            }else{
                alert(`ちがいます`);
            }

            actionLog.push(-1);
        }
    });
}


function showResultButtons(tweetMess) {
    // クイズコンテナ全体を非表示にする
    const quizContainer = document.querySelector('.quiz-container');
    if (quizContainer) {
        quizContainer.style.display = 'none';
    }

    // すでにボタンが表示されていれば何もしない
    if (document.getElementById('result-buttons')) return;

    // 新しいボタンを生成
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
        tweet(tweetMess);
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
