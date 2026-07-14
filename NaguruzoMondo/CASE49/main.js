let nazoid = 49;
let grid = 5;
let images = [];
let clicked = Array(grid * grid).fill(false);
let cellWidth = 0;
let cellHeight = 0;
let pressedCell = -1;
let cleared = 0;
let analysis = null;

function preload() {
    for (let index = 0; index <= grid * grid; index++) {
        const imageNumber = index === 0 ? 0 : index + 25;
        images[index] = loadImage(`../images/pic(${imageNumber}).PNG`);
    }
}

function setup() {
    const canvasSize = min(window.innerWidth, window.innerHeight, 800);
    const canvas = createCanvas(canvasSize, canvasSize);
    canvas.parent("canvas");
    cellWidth = width / grid;
    cellHeight = height / grid;
    noLoop();
    recompute();
}

function windowResized() {
    const canvasSize = min(window.innerWidth, window.innerHeight, 800);
    resizeCanvas(canvasSize, canvasSize);
    cellWidth = width / grid;
    cellHeight = height / grid;
    redraw();
}

function recompute() {
    analysis = Case49Solver.analyzeBoard(clicked);
    redraw();

    const success = analysis.singleLoop.count === 1 && !analysis.singleLoop.capped
        && analysis.shakashaka.count === 1 && !analysis.shakashaka.capped;
    if (success && cleared === 0) {
        cleared = 1;
        const tweetText = makeTweetText();
        window.setTimeout(() => {
            alert("正解！");
            showResultButtons(tweetText);
        }, 0);
    }
}

function draw() {
    drawArea();
}

function solutionRgb(result) {
    const isUnique = result.count === 1 && !result.capped;
    return isUnique ? [15, 157, 104] : [217, 67, 67];
}

function drawArea() {
    background(255);
    drawShakashakaSolutions();
    drawSingleLoopSolutions();
    drawGridLines();
    drawClosedPanels();
    drawPressedCell();
}

function drawShakashakaSolutions() {
    if (!analysis || analysis.shakashaka.solutions.length === 0) return;
    const [red, green, blue] = solutionRgb(analysis.shakashaka);
    const alpha = analysis.shakashaka.count > 1 ? 128 : 255;

    for (const solution of analysis.shakashaka.solutions) {
        noStroke();
        fill(red, green, blue, alpha);
        for (let index = 0; index < solution.triangles.length; index++) {
            const corner = solution.triangles[index];
            if (corner <= 0) continue;

            const row = floor(index / grid);
            const col = index % grid;
            const left = col * cellWidth;
            const top = row * cellHeight;
            const right = left + cellWidth;
            const bottom = top + cellHeight;

            if (corner === 1) triangle(left, top, right, top, left, bottom);
            if (corner === 2) triangle(left, top, right, top, right, bottom);
            if (corner === 3) triangle(right, top, right, bottom, left, bottom);
            if (corner === 4) triangle(left, top, right, bottom, left, bottom);
        }
    }
}

function cellCenter(index) {
    return {
        x: (index % grid + 0.5) * cellWidth,
        y: (floor(index / grid) + 0.5) * cellHeight
    };
}

function drawSingleLoopSolutions() {
    if (!analysis || analysis.singleLoop.solutions.length === 0) return;
    const [red, green, blue] = solutionRgb(analysis.singleLoop);
    const alpha = analysis.singleLoop.count > 1 ? 128 : 255;
    const outlineAlpha = analysis.singleLoop.count > 1 ? 96 : 220;

    for (const solution of analysis.singleLoop.solutions) {
        stroke(255, 255, 255, outlineAlpha);
        strokeWeight(max(7, cellWidth * 0.105));
        strokeCap(ROUND);
        for (const [from, to] of solution.edges) {
            const start = cellCenter(from);
            const end = cellCenter(to);
            line(start.x, start.y, end.x, end.y);
        }

        stroke(red, green, blue, alpha);
        strokeWeight(max(4, cellWidth * 0.065));
        for (const [from, to] of solution.edges) {
            const start = cellCenter(from);
            const end = cellCenter(to);
            line(start.x, start.y, end.x, end.y);
        }

        noStroke();
        fill(red, green, blue, alpha);
        for (let index = 0; index < clicked.length; index++) {
            if (!clicked[index]) continue;
            const center = cellCenter(index);
            const diameter = max(6, cellWidth * 0.085);
            ellipse(center.x, center.y, diameter, diameter);
        }
    }
}

function drawGridLines() {
    stroke(112);
    strokeWeight(max(1, width / 650));
    for (let index = 1; index < grid; index++) {
        line(index * cellWidth, 0, index * cellWidth, height);
        line(0, index * cellHeight, width, index * cellHeight);
    }
    noFill();
    stroke(20);
    strokeWeight(max(3, width / 180));
    rect(0, 0, width, height);
}

function drawClosedPanels() {
    for (let row = 0; row < grid; row++) {
        for (let col = 0; col < grid; col++) {
            const index = row * grid + col;
            if (clicked[index]) continue;
            image(images[index + 1], col * cellWidth, row * cellHeight, cellWidth, cellHeight);
        }
    }
}

function drawPressedCell() {
    if (pressedCell < 0) return;
    const row = floor(pressedCell / grid);
    const col = pressedCell % grid;
    noStroke();
    fill(0, 0, 0, 100);
    rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
}

function cellAt(x, y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return -1;
    return floor(y / cellHeight) * grid + floor(x / cellWidth);
}

function mousePressed() {
    if (mouseButton === RIGHT || cleared !== 0) return false;
    pressedCell = cellAt(mouseX, mouseY);
    if (pressedCell >= 0) redraw();
    return false;
}

function mouseReleased() {
    if (mouseButton === RIGHT || cleared !== 0) return false;
    const releasedCell = cellAt(mouseX, mouseY);
    if (pressedCell >= 0 && releasedCell === pressedCell) {
        clicked[pressedCell] = !clicked[pressedCell];
        pressedCell = -1;
        recompute();
    } else {
        pressedCell = -1;
        redraw();
    }
    return false;
}

function makeTweetText() {
    const score = grid * grid - analysis.openCount;
    let tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid * grid}\n`;

    for (let row = 0; row < grid; row++) {
        let line = "";
        for (let col = 0; col < grid; col++) {
            line += clicked[row * grid + col] ? "⬜" : "🟨";
        }
        tweetText += `${line}\n`;
    }

    tweetText += "#NaguruzoMondo\n";
    tweetText += `${location.origin}${location.pathname}`;
    return tweetText;
}

function tweet(tweetText) {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, "_blank");
}

function showResultButtons(tweetText) {
    if (document.getElementById("result-buttons")) return;

    const buttonContainer = document.createElement("div");
    buttonContainer.id = "result-buttons";
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.marginTop = "20px";

    const shareButton = document.createElement("button");
    shareButton.textContent = "Xで共有";
    shareButton.addEventListener("click", () => tweet(tweetText));

    buttonContainer.appendChild(shareButton);
    document.getElementById("canvas-container").appendChild(buttonContainer);
}
