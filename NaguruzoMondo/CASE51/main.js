"use strict";

const nazoid = 51;
const ZOOM_IMAGE_FIRST = 27;
const ZOOM_IMAGE_COUNT = 8;
const LAST_LEVEL = ZOOM_IMAGE_COUNT - 1;
const FINAL_IMAGE_CUE_SECONDS = 11;
const ZOOM_TOTAL_MS = FINAL_IMAGE_CUE_SECONDS * 1000;
const TRANSITION_MS = ZOOM_TOTAL_MS / ZOOM_IMAGE_COUNT;
const MUSIC_PATH = "music/tenran.mp3";
const PANEL_SCALE = 5;
const PANEL_25_OFFSET = 4 / 5;
const GRID_SIZE = 5;

const START_ANSWERS = ["ようき"];
const FINAL_ANSWERS = ["ようきひ"];

let zoomImages = [];
let initialImage = null;
let panelImages = [];
let clicked = Array(GRID_SIZE * GRID_SIZE).fill(false);
let pressedCell = -1;
let canvasSize = 0;
let phase = "waiting"; // waiting | zooming | replay | finished | cleared
let currentLevel = -1;
let zoomStartedAt = 0;
let zoomElapsedMs = 0;
let pausedZoomElapsedMs = 0;
let displayLevel = 0;
let displayScale = PANEL_SCALE;
let remainingAttempts = 3;
let clearedScore = null;
let clearedClicked = null;
let bonusPoints = 0;

let zoomAudio = null;

const explanationMessage ="黒柳徹子";

function preload() {
    initialImage = loadImage("images/initial.PNG");
    for (let i = 0; i < ZOOM_IMAGE_COUNT; i++) {
        zoomImages.push(loadImage(`images/pic(${ZOOM_IMAGE_FIRST + i}).PNG`));
    }
    for (let i = 1; i <= GRID_SIZE * GRID_SIZE; i++) {
        panelImages.push(loadImage(`../images/pic(${i + 25}).PNG`));
    }
}

function setup() {
    canvasSize = min(window.innerWidth, window.innerHeight, 800);
    const puzzleCanvas = createCanvas(canvasSize, canvasSize);
    puzzleCanvas.parent("canvas");
    imageMode(CORNER);
    noLoop();
    redraw();

    zoomAudio = new Audio(MUSIC_PATH);
    zoomAudio.preload = "auto";
    zoomAudio.volume = 0.7;

    const submitButton = document.getElementById("submitAnswer");
    const answerInput = document.getElementById("answerInput");
    submitButton.addEventListener("click", submitAnswer);
    answerInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            submitAnswer();
        }
    });
}

function draw() {
    background(255);

    if (phase === "zooming" || phase === "replay") {
        updateZoom(performance.now());
    }

    drawZoomComposition(displayLevel, displayScale);
    drawPanels();
}

function drawZoomComposition(level, scale) {
    const size = width * scale;
    const position = width - size;
    drawNestedLevel(level, position, position, size);
}

function drawNestedLevel(level, x, y, size) {
    image(zoomImages[level], x, y, size, size);

    const childSize = size / PANEL_SCALE;
    const childX = x + size * PANEL_25_OFFSET;
    const childY = y + size * PANEL_25_OFFSET;

    if (level === 0) {
        image(initialImage, childX, childY, childSize, childSize);
        return;
    }

    drawNestedLevel(level - 1, childX, childY, childSize);
}

function drawPanels() {
    const cellSize = width / GRID_SIZE;
    for (let index = 0; index < clicked.length; index++) {
        if (clicked[index]) continue;

        const col = index % GRID_SIZE;
        const row = Math.floor(index / GRID_SIZE);
        image(panelImages[index], col * cellSize, row * cellSize, cellSize, cellSize);

        if (index === pressedCell) {
            noStroke();
            fill(0, 0, 0, 100);
            rect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }
}

function updateZoom(now) {
    const timerElapsedMs = now - zoomStartedAt;
    const audioElapsedMs = zoomAudio && !zoomAudio.paused
        ? zoomAudio.currentTime * 1000
        : timerElapsedMs;
    zoomElapsedMs = constrain(audioElapsedMs, 0, ZOOM_TOTAL_MS);
    const completedTransitions = Math.floor(zoomElapsedMs / TRANSITION_MS);

    if (completedTransitions >= ZOOM_IMAGE_COUNT) {
        currentLevel = LAST_LEVEL;
        displayLevel = LAST_LEVEL;
        displayScale = 1;
        phase = "finished";
        noLoop();
        return;
    }

    currentLevel = completedTransitions - 1;
    displayLevel = completedTransitions;
    const transitionElapsed = zoomElapsedMs - completedTransitions * TRANSITION_MS;
    const progress = constrain(transitionElapsed / TRANSITION_MS, 0, 1);
    displayScale = lerp(PANEL_SCALE, 1, easeInOutCubic(progress));
}

function easeInOutCubic(value) {
    return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function normalizeAnswer(value) {
    return value
        .normalize("NFKC")
        .trim()
        .replace(/[\s\u3000]+/g, "")
        .replace(/[ァ-ヶ]/g, (character) =>
            String.fromCharCode(character.charCodeAt(0) - 0x60)
        )
        .toLowerCase();
}

async function submitAnswer() {
    if (phase === "cleared") return;

    const answerElement = document.getElementById("answerInput");
    const answer = normalizeAnswer(answerElement.value);
    if (!answer) return;

    if (phase === "waiting" && START_ANSWERS.includes(answer)) {
        await window.showCaseMessage("正解！（音が出ます）");
        startZoom();
        return;
    }

    if (FINAL_ANSWERS.includes(answer)) {
        if (phase === "waiting") {
            bonusPoints = 10000;
        }
        if (phase === "zooming" || phase === "replay") {
            updateZoom(performance.now());
        }
        await completePuzzle();
        return;
    }

    registerWrongAnswer();
}

function startZoom() {
    phase = "zooming";
    currentLevel = -1;
    displayLevel = 0;
    displayScale = PANEL_SCALE;
    zoomElapsedMs = 0;
    zoomStartedAt = performance.now();
    playZoomMusic(0);
    loop();
}

function getPointerCell() {
    if (mouseX < 0 || mouseX >= width || mouseY < 0 || mouseY >= height) return -1;
    const col = Math.floor(mouseX / (width / GRID_SIZE));
    const row = Math.floor(mouseY / (height / GRID_SIZE));
    return row * GRID_SIZE + col;
}

function mousePressed() {
    if (mouseButton === RIGHT) return false;
    if (phase === "cleared") return;

    const index = getPointerCell();
    if (index >= 0 && !clicked[index]) {
        pressedCell = index;
        if (phase !== "zooming") redraw();
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) return false;
    if (phase === "cleared") return;

    const index = getPointerCell();
    if (index >= 0 && index === pressedCell && !clicked[index]) {
        clicked[index] = true;
    }
    pressedCell = -1;
    if (phase !== "zooming") redraw();
}

function registerWrongAnswer() {
    remainingAttempts--;
    document.getElementById("remainingAttempts").textContent =
        `残り解答回数: ${remainingAttempts}`;

    window.showCaseMessage("ちがいます");
}

async function completePuzzle() {
    clearedScore = calculateVisiblePercent();
    clearedClicked = clicked.slice();
    pausedZoomElapsedMs = zoomElapsedMs;
    phase = "cleared";
    pauseZoomMusic();
    noLoop();

    const scoreText = formatPercent(clearedScore);
    const bonusText = bonusPoints > 0 ? `\nボーナス: +${bonusPoints}点` : "";
    await window.showCaseMessage(`正解！\n見えていた面積: ${scoreText}%${bonusText}`);

    document.querySelector(".quiz-container").style.display = "none";
    showResultButtons();
}

function calculateVisiblePercent() {
    const remainingLevels = LAST_LEVEL - displayLevel;
    const divisor = Math.pow(PANEL_SCALE * PANEL_SCALE, remainingLevels)
        * displayScale * displayScale;
    return constrain(100 / divisor, 0, 100);
}

function formatPercent(value) {
    if (value >= 10) return value.toFixed(1);
    if (value >= 1) return value.toFixed(2);
    if (value >= 0.01) return value.toFixed(4);
    return value.toFixed(10).replace(/0+$/, "").replace(/\.$/, "");
}

function makeTweetText() {
    const scoreState = clearedClicked || clicked;
    const score = scoreState.filter((isClicked) => !isClicked).length + bonusPoints;
    const attempt = 3 - remainingAttempts + 1;
    const lines = [`CASE${nazoid}`, "", `Score: ${score}/${GRID_SIZE * GRID_SIZE} (${attempt}回目)`];

    for (let row = 0; row < GRID_SIZE; row++) {
        let gridLine = "";
        for (let col = 0; col < GRID_SIZE; col++) {
            gridLine += scoreState[row * GRID_SIZE + col] ? "⬜" : "🟨";
        }
        lines.push(gridLine);
    }

    lines.push("#NaguruzoMondo", location.origin + location.pathname);
    return lines.join("\n");
}

function showResultButtons() {
    if (document.getElementById("result-buttons")) return;

    const buttonContainer = document.createElement("div");
    buttonContainer.id = "result-buttons";
    buttonContainer.style.display = "flex";
    buttonContainer.style.flexWrap = "wrap";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "20px";
    buttonContainer.style.marginTop = "20px";

    const shareButton = createResultButton("Xで共有", "#007bff");
    shareButton.addEventListener("click", () => {
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(makeTweetText())}`;
        window.open(tweetUrl, "_blank", "noopener,noreferrer");
    });

    const revealButton = createResultButton("最後まで見る", "#28a745");
    revealButton.addEventListener("click", () => {
        resumeZoomFromScore();
        showExplanationMessageOnScreen(explanationMessage, false);
        revealButton.disabled = true;
        revealButton.style.backgroundColor = "#6c757d";
        revealButton.style.cursor = "not-allowed";
    });

    buttonContainer.appendChild(shareButton);
    buttonContainer.appendChild(revealButton);
    document.getElementById("canvas-container").appendChild(buttonContainer);
}

function resumeZoomFromScore() {
    clicked.fill(true);
    pressedCell = -1;
    phase = "replay";
    zoomStartedAt = performance.now() - pausedZoomElapsedMs;
    playZoomMusic(pausedZoomElapsedMs / 1000);
    loop();
}

function createResultButton(label, color) {
    const button = document.createElement("button");
    button.textContent = label;
    button.style.padding = "10px 20px";
    button.style.fontSize = "16px";
    button.style.color = "#fff";
    button.style.backgroundColor = color;
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    return button;
}

function showExplanationMessageOnScreen(message, open = false) {
    const container = document.getElementById("canvas-container");
    if (!container) return;

    let box = document.getElementById("explanation-message");
    if (!box) {
        box = document.createElement("div");
        box.id = "explanation-message";
        box.style.marginTop = "16px";
        box.style.maxWidth = "800px";
        box.style.width = "min(800px, 92vw)";
        box.style.padding = "12px 14px";
        box.style.borderRadius = "8px";
        box.style.border = "1px solid rgba(0,0,0,0.15)";
        box.style.background = "rgba(255,255,255,0.95)";
        box.style.boxShadow = "0 6px 18px rgba(0,0,0,0.10)";
        box.style.color = "#222";
        box.style.fontSize = "14px";
        box.style.lineHeight = "1.6";
        box.style.whiteSpace = "pre-wrap";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.alignItems = "center";
        header.style.justifyContent = "space-between";
        header.style.gap = "12px";
        header.style.cursor = "pointer";
        header.style.userSelect = "none";
        header.tabIndex = 0;
        header.setAttribute("role", "button");

        const title = document.createElement("div");
        title.textContent = "解説";
        title.style.fontWeight = "700";

        const icon = document.createElement("span");
        icon.textContent = open ? "▼" : "▶";
        icon.style.pointerEvents = "none";

        const body = document.createElement("div");
        body.textContent = message;
        body.style.display = open ? "block" : "none";

        const toggle = () => {
            const isOpen = body.style.display !== "none";
            body.style.display = isOpen ? "none" : "block";
            icon.textContent = isOpen ? "▶" : "▼";
            header.setAttribute("aria-expanded", isOpen ? "false" : "true");
        };
        header.addEventListener("click", toggle);
        header.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggle();
            }
        });

        header.appendChild(title);
        header.appendChild(icon);
        box.appendChild(header);
        box.appendChild(body);
        container.appendChild(box);
    }

    box.style.display = "block";
}

function playZoomMusic(offsetSeconds) {
    if (!zoomAudio) return;
    zoomAudio.pause();
    zoomAudio.currentTime = constrain(offsetSeconds, 0, FINAL_IMAGE_CUE_SECONDS);
    zoomAudio.play().catch(() => {});
}

function pauseZoomMusic() {
    if (zoomAudio) zoomAudio.pause();
}
