let nazoid = 48;
let imageNum = 28;
let backgroundIndex = 26;
let images = [];
let showidx = [];
let grid = 5;
let cellWidth, cellHeight;
let startX, startY;
let startwidth;

let clicked = [];
let cleared = 0;
let revealed = 0;

let actionLog = [];

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = ["かぜい", "課税"];
let hintMessage = "ボールが風に流されているようです。ゴルフでは、追い風のことを「フォロー」、向かい風のことを「アゲンスト」と言います。";
let explanationMessage = "ゴルフでは、追い風のことを「フォロー」、向かい風のことを「アゲンスト」と言います。正しい答えは「課税」です。なぜなら、風の影響でボールが流される様子は、税金がかかることを象徴しているからです。";

let remainingAttempts = 3;

const WIND_SWITCH_MS = 6500;
const WIND_OFFSET_CELLS = 1;
const WIND_STATES = [
    {
        key: "rightToLeft",
        direction: -1,
        backgroundIndex: 27
    },
    {
        key: "leftToRight",
        direction: 1,
        backgroundIndex: 26
    }
];

let ballAnimation = {
    active: false,
    startX: 0,
    startY: 0,
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    progress: 0,
    targetIndex: -1,
    actualTargetIndex: -1,
    speed: 0.03,
    windKey: WIND_STATES[0].key
};

let ballRadius = 15;

let impactEffect = {
    active: false,
    x: 0,
    y: 0,
    radius: 0,
    maxRadius: 30,
    duration: 20,
    frame: 0
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
    pixelDensity(2);
    const canvas = createCanvas(startwidth, startwidth);
    canvas.parent('canvas');
    frameRate(60);

    cellWidth = width / grid;
    cellHeight = height / grid;

    backgroundIndex = getWindState().backgroundIndex;
    drawArea();
}

function getWindState(now = millis()) {
    const stateIndex = Math.floor(now / WIND_SWITCH_MS) % WIND_STATES.length;
    return WIND_STATES[stateIndex];
}

function syncWindBackground() {
    const wind = getWindState();
    if (backgroundIndex !== wind.backgroundIndex) {
        backgroundIndex = wind.backgroundIndex;
        return true;
    }
    return false;
}

function calcNewImage(index) {
    return 0;
}

function draw() {
    const backgroundChanged = syncWindBackground();
    if (backgroundChanged && ballAnimation.active) {
        const wind = getWindState();
        applyWindLanding(wind);
    }

    if (!ballAnimation.active && !impactEffect.active) {
        if (backgroundChanged) {
            drawArea();
        }
        return;
    }

    if (ballAnimation.active) {
        ballAnimation.progress += ballAnimation.speed;
        const cappedProgress = min(ballAnimation.progress, 1);
        const easeProgress = cappedProgress * cappedProgress;

        ballAnimation.currentX = ballAnimation.startX + (ballAnimation.targetX - ballAnimation.startX) * easeProgress;
        ballAnimation.currentY = ballAnimation.startY + (ballAnimation.targetY - ballAnimation.startY) * easeProgress;

        drawArea();
        drawBall(cappedProgress);

        if (ballAnimation.progress >= 1.0) {
            ballAnimation.active = false;

            impactEffect.active = true;
            impactEffect.x = ballAnimation.targetX;
            impactEffect.y = ballAnimation.targetY;
            impactEffect.radius = 0;
            impactEffect.frame = 0;

            if (ballAnimation.actualTargetIndex >= 0 && ballAnimation.actualTargetIndex < grid * grid) {
                actionLog.push(ballAnimation.actualTargetIndex);
                if (clicked[ballAnimation.actualTargetIndex] == 0) {
                    clicked[ballAnimation.actualTargetIndex] = true;
                    showidx[ballAnimation.actualTargetIndex] = calcNewImage(ballAnimation.actualTargetIndex);
                    revealed++;
                }
            } else {
                actionLog.push(-2);
            }
        }
    }

    if (impactEffect.active) {
        impactEffect.frame++;
        impactEffect.radius = (impactEffect.frame / impactEffect.duration) * impactEffect.maxRadius;

        drawArea();
        drawImpactEffect();

        if (impactEffect.frame >= impactEffect.duration) {
            impactEffect.active = false;
            drawArea();
        }
    }
}

function drawImpactEffect() {
    const alpha = 255 * (1 - impactEffect.frame / impactEffect.duration);

    stroke(255, 100, 100, alpha);
    strokeWeight(3);
    noFill();
    ellipse(impactEffect.x, impactEffect.y, impactEffect.radius * 2, impactEffect.radius * 2);

    if (impactEffect.radius > 10) {
        stroke(255, 200, 200, alpha * 0.7);
        strokeWeight(2);
        ellipse(impactEffect.x, impactEffect.y, (impactEffect.radius - 10) * 2, (impactEffect.radius - 10) * 2);
    }
}

function drawBall(progress = ballAnimation.progress) {
    const arcHeight = 100;
    const arcOffset = arcHeight * 4 * progress * (progress - 1);
    const currentY = ballAnimation.currentY + arcOffset;

    fill(0, 0, 0, 30);
    noStroke();
    ellipse(ballAnimation.currentX + 2, ballAnimation.currentY + 2, ballRadius * 1.5, ballRadius * 0.8);

    fill(255, 100, 100);
    stroke(200, 50, 50);
    strokeWeight(2);
    ellipse(ballAnimation.currentX, currentY, ballRadius * 2, ballRadius * 2);

    fill(255, 200, 200);
    noStroke();
    ellipse(ballAnimation.currentX - 5, currentY - 5, ballRadius, ballRadius);

    if (progress > 0.1) {
        for (let i = 1; i <= 3; i++) {
            const trailProgress = Math.max(0, progress - i * 0.05);
            const trailEase = trailProgress * trailProgress;
            const trailX = ballAnimation.startX + (ballAnimation.targetX - ballAnimation.startX) * trailEase;
            const trailY = ballAnimation.startY + (ballAnimation.targetY - ballAnimation.startY) * trailEase;
            const trailArcOffset = arcHeight * 4 * trailProgress * (trailProgress - 1);

            fill(255, 100, 100, 50 / i);
            noStroke();
            ellipse(trailX, trailY + trailArcOffset, ballRadius * 1.5 / i, ballRadius * 1.5 / i);
        }
    }
}

function getWindLanding(targetIndex, wind) {
    const targetCol = targetIndex % grid;
    const targetRow = floor(targetIndex / grid);
    const targetCenterX = targetCol * cellWidth + cellWidth / 2;
    const targetCenterY = targetRow * cellHeight + cellHeight / 2;
    const windOffsetX = wind.direction * WIND_OFFSET_CELLS * cellWidth;

    const actualLandingX = targetCenterX + windOffsetX;
    const actualLandingY = targetCenterY;
    let actualTargetIndex = -1;

    if (actualLandingX >= 0 && actualLandingX < width && actualLandingY >= 0 && actualLandingY < height) {
        let landingCol = Math.floor(actualLandingX / cellWidth);
        let landingRow = Math.floor(actualLandingY / cellHeight);

        landingCol = Math.max(0, Math.min(grid - 1, landingCol));
        landingRow = Math.max(0, Math.min(grid - 1, landingRow));

        actualTargetIndex = landingRow * grid + landingCol;
    }

    return {
        x: actualLandingX,
        y: actualLandingY,
        actualTargetIndex
    };
}

function applyWindLanding(wind) {
    const landing = getWindLanding(ballAnimation.targetIndex, wind);
    const currentProgress = min(ballAnimation.progress, 1);
    const currentVisualY = getBallVisualY(currentProgress);

    ballAnimation.startX = ballAnimation.currentX;
    ballAnimation.startY = currentVisualY;
    ballAnimation.targetX = landing.x;
    ballAnimation.targetY = landing.y;
    ballAnimation.currentY = currentVisualY;
    ballAnimation.progress = 0;
    ballAnimation.actualTargetIndex = landing.actualTargetIndex;
    ballAnimation.windKey = wind.key;
}

function getBallVisualY(progress) {
    const arcHeight = 100;
    const arcOffset = arcHeight * 4 * progress * (progress - 1);
    return ballAnimation.currentY + arcOffset;
}

function startBallAnimation(clickX, clickY, targetIndex) {
    const wind = getWindState();
    const landing = getWindLanding(targetIndex, wind);

    ballAnimation.active = true;
    ballAnimation.startX = clickX;
    ballAnimation.startY = clickY;
    ballAnimation.targetX = landing.x;
    ballAnimation.targetY = landing.y;
    ballAnimation.currentX = clickX;
    ballAnimation.currentY = clickY;
    ballAnimation.progress = 0;
    ballAnimation.targetIndex = targetIndex;
    ballAnimation.actualTargetIndex = landing.actualTargetIndex;
    ballAnimation.windKey = wind.key;
}

function make_tweet(res = 0) {
    let score = grid * grid;
    for (let i = 0; i < actionLog.length; i++) {
        if (actionLog[i] == -2 || actionLog[i] >= 0) {
            score--;
        }
    }

    const attempt = 3 - remainingAttempts + 1;
    let tweetText = "";

    if (res == 0) {
        tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid * grid} (${attempt}回目)\n`;
    }
    for (let i = 0; i < grid; i++) {
        let ret = "";
        for (let j = 0; j < grid; j++) {
            const index = i * grid + j;
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
        } else if (actionLog[i] == -2) {
            palam += "_";
        } else {
            palam += String.fromCharCode(actionLog[i] + 97);
        }
    }

    tweetText += `#NaguruzoMondo\n`;
    tweetText += location.origin + location.pathname + palam;

    console.log(tweetText);
    return tweetText;
}

function tweet(tweetText) {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank');
}

function drawArea() {
    background(255);

    image(images[backgroundIndex], 0, 0, width, height);

    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            const index = i * grid + j;
            if (1 <= showidx[index] && showidx[index] <= grid * grid) {
                blendMode(BLEND);
            } else {
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
            const index = i * grid + j;
            if (clicked[index] == 0) {
                clicked[index] = 1;
                showidx[index] = calcNewImage(index);
                revealed++;
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
        return false;
    }
    if (ballAnimation.active || impactEffect.active || cleared == 1) {
        return;
    }

    startX = mouseX;
    startY = mouseY;

    const col = floor(mouseX / cellWidth);
    const row = floor(mouseY / cellHeight);

    if (col >= 0 && col < grid && row >= 0 && row < grid) {
        fill(0, 0, 0, 100);
        noStroke();
        rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) {
        return false;
    }
    if (ballAnimation.active || impactEffect.active || cleared == 1) {
        return;
    }

    const startCol = floor(startX / cellWidth);
    const startRow = floor(startY / cellHeight);
    const col = floor(mouseX / cellWidth);
    const row = floor(mouseY / cellHeight);

    if (startCol === col && startRow === row && col >= 0 && col < grid && row >= 0 && row < grid) {
        const index = row * grid + col;
        startBallAnimation(mouseX, mouseY, index);
    } else {
        drawArea();
    }
}

const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value.trim();
        const normalizedAnswer = answerInput.toLowerCase();
        const isCorrect = answers.some(answer => answer.toLowerCase() === normalizedAnswer);

        if (isCorrect) {
            window.showCaseMessage('正解！');

            tweetMess = make_tweet();

            cleared = 1;

            showResultButtons(tweetMess);
        } else {
            remainingAttempts--;
            document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;

            if (revealed == 25) {
                window.showCaseMessage('ちがいます。' + hintMessage);
            } else {
                window.showCaseMessage('ちがいます');
            }

            actionLog.push(-1);
        }
    });
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
