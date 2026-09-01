const nazoid = 52;
const grid = 5;
const imageNum = 27;
const backgroundIndex = 26;
const DRAG_THRESHOLD = 8;
const PIECE_COLORS = {
    A: [246, 170, 170],
    B: [169, 218, 184],
    C: [174, 198, 244],
    D: [220, 181, 235]
};
const PIECE_EMOJI = { A: "🟥", B: "🟩", C: "🟦", D: "🟪", ".": "⬜" };

let images = [];
let placementData;
let placement;
let selectedAnswer = "";
let pieceAt = [];
let clicked = Array(25).fill(false);
let cellWidth;
let cellHeight;
let cleared = false;
let revealed = 0;
let remainingAttempts = 3;
let actionLog = [];
let tweetMess = "NaguruzoMondoに挑戦中！";
let canvasElement;

let boardOffsetX = 0;
let boardOffsetY = 0;
let pointerActive = false;
let pointerStartX = 0;
let pointerStartY = 0;
let offsetStartX = 0;
let offsetStartY = 0;
let pressedIndex = -1;
let dragging = false;

const hintMessage = "盤面はドラッグ可能です。4つの展開図を立方体に折り、「こたえ」の裏側を順に読んでみましょう";
const explanationMessage =
    "盤面は上下・左右がつながっており、ドラッグ可能です。24マスは互いに異なる4種類の立方体の展開図、残る1マスは独立したピースになっています。\n" +
    "「こ」「た」「え」を含む展開図をそれぞれ立方体に折り、その文字の反対側に来る面を「こ・た・え」の順に読むと答えになります。";

function preload() {
    for (let i = 0; i < imageNum; i++) {
        const imagePath = i <= 25
            ? `../images/pic(${i === 0 ? 0 : i + 25}).PNG`
            : `images/pic(${i}).PNG`;
        images.push(loadImage(imagePath));
    }
    placementData = loadJSON("src/selected_word_placements.json");
}

function setup() {
    const startWidth = min(window.innerWidth, window.innerHeight, 800);
    const canvas = createCanvas(startWidth, startWidth);
    canvas.parent("canvas");
    canvasElement = canvas.elt;
    canvas.elt.style.touchAction = "none";
    canvas.elt.style.cursor = "grab";
    canvas.elt.setAttribute("aria-label", "上下左右につながった5かける5のパズル盤面");
    noLoop();

    cellWidth = width / grid;
    cellHeight = height / grid;
    choosePuzzle();
    drawArea();
}

function choosePuzzle() {
    const answerList = Object.keys(placementData.answers).filter(
        answer => placementData.answers[answer].length > 0
    );
    selectedAnswer = answerList[Math.floor(Math.random() * answerList.length)];
    const candidates = placementData.answers[selectedAnswer];
    placement = candidates[Math.floor(Math.random() * candidates.length)];
    pieceAt = placement.grid.join("").split("");
}

function positiveModulo(value, modulus) {
    return ((value % modulus) + modulus) % modulus;
}

function screenToIndex(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return -1;
    const boardX = positiveModulo(x - boardOffsetX, width);
    const boardY = positiveModulo(y - boardOffsetY, height);
    const col = Math.floor(boardX / cellWidth);
    const row = Math.floor(boardY / cellHeight);
    return row * grid + col;
}

function wrappedPositions(index) {
    const row = Math.floor(index / grid);
    const col = index % grid;
    const x = positiveModulo(col * cellWidth + boardOffsetX, width);
    const y = positiveModulo(row * cellHeight + boardOffsetY, height);
    const xs = x + cellWidth > width ? [x, x - width] : [x];
    const ys = y + cellHeight > height ? [y, y - height] : [y];
    const positions = [];
    for (const px of xs) {
        for (const py of ys) positions.push([px, py]);
    }
    return positions;
}

function drawWrappedBackground() {
    const x = positiveModulo(boardOffsetX, width);
    const y = positiveModulo(boardOffsetY, height);
    for (const px of [x - width, x]) {
        for (const py of [y - height, y]) {
            image(images[backgroundIndex], px, py, width, height);
        }
    }
}

function drawArea() {
    background(255);
    drawWrappedBackground();

    for (let index = 0; index < grid * grid; index++) {
        for (const [x, y] of wrappedPositions(index)) {
            if (!clicked[index]) {
                image(images[index + 1], x, y, cellWidth, cellHeight);
            } else if (pieceAt[index] !== ".") {
                const [r, g, b] = PIECE_COLORS[pieceAt[index]];
                noStroke();
                fill(r, g, b, 105);
                rect(x, y, cellWidth, cellHeight);
                stroke(r, g, b, 205);
                strokeWeight(max(1, width / 400));
                noFill();
                rect(x, y, cellWidth, cellHeight);
            }
        }
    }

    if (pressedIndex >= 0 && !dragging && !clicked[pressedIndex]) {
        noStroke();
        fill(0, 0, 0, 95);
        for (const [x, y] of wrappedPositions(pressedIndex)) {
            rect(x, y, cellWidth, cellHeight);
        }
    }
}

function openPiece(index) {
    if (index < 0 || clicked[index]) return;
    const label = pieceAt[index];
    actionLog.push(index);
    for (let i = 0; i < pieceAt.length; i++) {
        if (pieceAt[i] === label && !clicked[i]) {
            clicked[i] = true;
            revealed++;
        }
    }
}

function allOpen() {
    clicked.fill(true);
    revealed = grid * grid;
    drawArea();
}

function mousePressed() {
    if (mouseButton === RIGHT) return false;
    if (mouseX < 0 || mouseX >= width || mouseY < 0 || mouseY >= height) return;

    pointerActive = true;
    pointerStartX = mouseX;
    pointerStartY = mouseY;
    offsetStartX = boardOffsetX;
    offsetStartY = boardOffsetY;
    pressedIndex = screenToIndex(mouseX, mouseY);
    dragging = false;
    canvasElement.style.cursor = "grabbing";
    drawArea();
}

function mouseDragged() {
    if (!pointerActive) return;
    const dx = mouseX - pointerStartX;
    const dy = mouseY - pointerStartY;
    if (!dragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
        dragging = true;
        pressedIndex = -1;
    }
    if (dragging) {
        boardOffsetX = positiveModulo(offsetStartX + dx, width);
        boardOffsetY = positiveModulo(offsetStartY + dy, height);
        drawArea();
        return false;
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) return false;
    if (!pointerActive) return;

    const releasedIndex = screenToIndex(mouseX, mouseY);
    if (!dragging && !cleared && releasedIndex === pressedIndex) {
        openPiece(releasedIndex);
    }
    pointerActive = false;
    pressedIndex = -1;
    dragging = false;
    canvasElement.style.cursor = "grab";
    drawArea();
}

function normalizeAnswer(value) {
    return value.trim().toLowerCase().replace(/[ァ-ヶ]/g, char =>
        String.fromCharCode(char.charCodeAt(0) - 0x60)
    );
}

function makeTweetText() {
    const score = clicked.filter(value => !value).length;
    const attempt = 3 - remainingAttempts + 1;
    let tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid * grid} (${attempt}回目)\n`;

    for (let row = 0; row < grid; row++) {
        let line = "";
        for (let col = 0; col < grid; col++) {
            const index = row * grid + col;
            line += clicked[index] ? "⬜": "🟨";
        }
        tweetText += line + "\n";
    }

    tweetText += `#NaguruzoMondo\n${location.origin}${location.pathname}`;
    return tweetText;
}

function tweet(tweetText) {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, "_blank");
}

const submitButton = document.getElementById("submitAnswer");
if (submitButton) {
    submitButton.addEventListener("click", () => {
        const input = document.getElementById("answerInput");
        if (normalizeAnswer(input.value) === selectedAnswer) {
            window.showCaseMessage("正解！");
            tweetMess = makeTweetText();
            cleared = true;
            showResultButtons(tweetMess);
            return;
        }

        remainingAttempts--;
        document.getElementById("remainingAttempts").textContent =
            `残り解答回数: ${remainingAttempts}`;
        window.showCaseMessage(revealed === 25 ? `ちがいます。${hintMessage}` : "ちがいます");
        actionLog.push(-1);
    });
}

const answerInput = document.getElementById("answerInput");
if (answerInput) {
    answerInput.addEventListener("keydown", event => {
        if (event.key === "Enter") submitButton.click();
    });
}

function showExplanationMessageOnScreen(message, open = false) {
    const container = document.getElementById("canvas-container");
    if (!container) return;

    let box = document.getElementById("explanation-message");
    if (!box) {
        box = document.createElement("div");
        box.id = "explanation-message";
        Object.assign(box.style, {
            marginTop: "16px",
            maxWidth: "800px",
            width: "min(800px, 92vw)",
            padding: "12px 14px",
            borderRadius: "8px",
            border: "1px solid rgba(0,0,0,0.15)",
            background: "rgba(255,255,255,0.95)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
            color: "#222",
            fontSize: "14px",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap"
        });

        const header = document.createElement("div");
        Object.assign(header.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            cursor: "pointer",
            userSelect: "none"
        });
        header.tabIndex = 0;
        header.setAttribute("role", "button");
        header.setAttribute("aria-label", "解説を開閉");

        const title = document.createElement("strong");
        title.textContent = "解説";
        const icon = document.createElement("span");
        icon.id = "explanation-toggle-icon";
        icon.textContent = "▶";
        const body = document.createElement("div");
        body.id = "explanation-message-body";
        body.style.marginTop = "8px";

        const toggle = () => {
            const isOpen = body.style.display !== "none";
            body.style.display = isOpen ? "none" : "block";
            icon.textContent = isOpen ? "▶" : "▼";
            header.setAttribute("aria-expanded", isOpen ? "false" : "true");
        };
        header.addEventListener("click", toggle);
        header.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggle();
            }
        });
        header.append(title, icon);
        box.append(header, body);
        container.appendChild(box);
    }

    const body = document.getElementById("explanation-message-body");
    const icon = document.getElementById("explanation-toggle-icon");
    body.textContent = message;
    body.style.display = open ? "block" : "none";
    icon.textContent = open ? "▼" : "▶";
}

function showResultButtons(tweetText) {
    const quizContainer = document.querySelector(".quiz-container");
    if (quizContainer) quizContainer.style.display = "none";
    if (document.getElementById("result-buttons")) return;

    const buttonContainer = document.createElement("div");
    buttonContainer.id = "result-buttons";
    Object.assign(buttonContainer.style, {
        display: "flex",
        justifyContent: "center",
        gap: "20px",
        marginTop: "20px"
    });

    const shareButton = document.createElement("button");
    shareButton.textContent = "Xで共有";
    styleResultButton(shareButton, "#007bff");
    shareButton.addEventListener("click", () => tweet(tweetText));

    const openButton = document.createElement("button");
    openButton.textContent = "全部開ける";
    styleResultButton(openButton, "#28a745");
    openButton.addEventListener("click", () => {
        allOpen();
        showExplanationMessageOnScreen(explanationMessage);
        openButton.disabled = true;
        openButton.style.backgroundColor = "#6c757d";
        openButton.style.cursor = "not-allowed";
    });

    buttonContainer.append(shareButton, openButton);
    document.getElementById("canvas-container").appendChild(buttonContainer);
}

function styleResultButton(button, backgroundColor) {
    Object.assign(button.style, {
        padding: "10px 20px",
        fontSize: "16px",
        color: "#fff",
        backgroundColor,
        border: "none",
        borderRadius: "5px",
        cursor: "pointer"
    });
}
