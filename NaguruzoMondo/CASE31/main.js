let nazoid = 30;
let imageNum = 30; // 画像の枚数
let backgroundIndex = 26; // 背景画像のインデックス
let images = [];
let showidx = [];
let grid = 5;
let cellWidth, cellHeight;
let startX, startY;

// 風船っぽく見せるためのパラメータ
let balloonParams = [];
let pressedIndex = -1;
let burstStates = [];

// ---- Burst Sound (Tone.js) ----
let burstCount = 0;
let happyBirthdayNotes = [
    // Happy Birthday (C major, 25 notes)
    "G4", "G4", "A4", "G4", "C5", "B4",
    "G4", "G4", "A4", "G4", "D5", "C5",
    "G4", "G4", "G5", "E5", "C5", "B4", "A4",
    "F5", "F5", "E5", "C5", "D5", "C5",
];
let burstSynth = null;
let nextNoteAt = 0;
let burstNoteQueue = [];

function ensureBurstSynth() {
    if (typeof Tone === "undefined") return Promise.resolve(false);
    if (!burstSynth) {
        burstSynth = new Tone.Synth({
            oscillator: { type: "triangle" },
            envelope: { attack: 0.005, decay: 0.12, sustain: 0.2, release: 0.25 },
        }).toDestination();
        burstSynth.volume.value = -6;
    }
    if (Tone.context && Tone.context.state !== "running") {
        return Tone.start().then(() => true).catch(() => false);
    }
    return Promise.resolve(true);
}

function processBurstNoteQueue() {
    if (typeof Tone === "undefined" || !burstSynth) return;
    const now = Tone.now();
    if (nextNoteAt < now) nextNoteAt = now;

    while (burstNoteQueue.length > 0) {
        const note = burstNoteQueue.shift();
        burstSynth.triggerAttackRelease(note, 0.22, nextNoteAt, 0.9);
        nextNoteAt += 0.18;
    }
}

function playNextHappyBirthdayNote() {
    burstCount++;
    const note = happyBirthdayNotes[(burstCount - 1) % happyBirthdayNotes.length];
    burstNoteQueue.push(note);
    ensureBurstSynth().then((ok) => {
        if (!ok) return;
        processBurstNoteQueue();
    });
}

let clicked = [];
let cleared = 0;
let revealed = 0;

let actionLog = [];

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = ["Hybrid","hybrid","HYBRID","ハイブリッド","はいぶりっど"];
let hintMessage = "ちがいます。ヒント：「Happybirthday」は13文字です。";

let remainingAttempts = 3;

let revealedQuestions = 0;


function preload() {
    for (let i = 0; i < imageNum; i++) {
        images.push(loadImage(`images/pic(${i}).PNG`));
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
    frameRate(30);
    loop();

    cellWidth = width / grid;
    cellHeight = height / grid;

    // マスごとに揺れ方を変える
    balloonParams = [];
    for (let i = 0; i < grid * grid; i++) {
        balloonParams.push({
            phase: random(0, TWO_PI),
            amp: random(cellHeight * 0.01, cellHeight * 0.05),
            sway: random(cellWidth * 0.01, cellWidth * 0.04),
        });
    }

    burstStates = [];
    for (let i = 0; i < grid * grid; i++) {
        burstStates.push({ t: 0, rays: [] });
    }
}

function draw() {
    drawArea();
}

function calcBalloonGeom(x, y, w, h, index) {
    const p = balloonParams[index] || { phase: 0, amp: 0, sway: 0 };
    const t = frameCount * 0.06;
    const dx = sin(t + p.phase) * p.sway;
    const dy = sin(t * 0.9 + p.phase * 1.3) * p.amp;

    const cx = x + w / 2 + dx;
    const cy = y + h / 2 + dy - h * 0.03;
    const bw = w * 0.86;
    const bh = h * 0.82;
    const ex = cx;
    const ey = cy - h * 0.02;
    const knotY = ey + bh * 0.50;
    return { ex, ey, bw, bh, knotY };
}

function triggerBurst(index) {
    if (index < 0 || index >= grid * grid) return;
    const s = burstStates[index] || { t: 0, rays: [] };
    s.t = 1;
    s.rays = [];
    const rayCount = 10;
    for (let i = 0; i < rayCount; i++) {
        s.rays.push({ a: random(0, TWO_PI), w: random(0.8, 1.8) });
    }
    burstStates[index] = s;

    // 破裂音（回数に応じてハッピーバースデーを1音ずつ）
    playNextHappyBirthdayNote();
}

function drawBalloonTile(img, x, y, w, h, index) {
    const { ex, ey, bw, bh, knotY } = calcBalloonGeom(x, y, w, h, index);

    // 画像を楕円でクリップして「風船」っぽく
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.ellipse(ex, ey, bw / 2, bh / 2, 0, 0, Math.PI * 2);
    drawingContext.clip();
    image(img, x, y, w, h);
    drawingContext.restore();

    // 輪郭（背景が白でも見えるように赤系の縁取り）
    noFill();
    stroke(220, 40, 60, 190);
    strokeWeight(max(1, min(w, h) * 0.035));
    ellipse(ex, ey, bw, bh);

    // ほんのり外側シャドウ縁（主張しすぎない）
    stroke(0, 0, 0, 35);
    strokeWeight(max(1, min(w, h) * 0.02));
    ellipse(ex, ey, bw * 1.01, bh * 1.01);

    // ハイライト
    noStroke();
    fill(255, 255, 255, 55);
    ellipse(ex - bw * 0.18, ey - bh * 0.18, bw * 0.22, bh * 0.35);

    // 結び目
    noStroke();
    fill(255, 255, 255, 120);
    triangle(
        ex - bw * 0.04, knotY,
        ex + bw * 0.04, knotY,
        ex, knotY + bh * 0.08
    );

    // ひも（軽いウェーブ）
    noFill();
    stroke(51, 51, 51, 120);
    strokeWeight(max(1, min(w, h) * 0.015));
    beginShape();
    const stringLen = h * 0.22;
    for (let s = 0; s <= 1.0001; s += 0.25) {
        const p = balloonParams[index] || { phase: 0 };
        const sx = ex + sin(frameCount * 0.05 + p.phase + s * 4.0) * bw * 0.05;
        const sy = knotY + bh * 0.08 + s * stringLen;
        vertex(sx, sy);
    }
    endShape();
}

function drawBurstEffects() {
    for (let index = 0; index < burstStates.length; index++) {
        const s = burstStates[index];
        if (!s || s.t <= 0) continue;

        const row = floor(index / grid);
        const col = index % grid;
        const x = col * cellWidth;
        const y = row * cellHeight;
        const w = cellWidth;
        const h = cellHeight;
        const { ex, ey } = calcBalloonGeom(x, y, w, h, index);

        const progress = 1 - s.t;
        const base = min(w, h);
        const radius = base * (0.10 + progress * 0.55);
        const alpha = 255 * s.t;

        // 破裂リング（赤）
        noFill();
        stroke(255, 60, 60, min(230, alpha));
        strokeWeight(max(1, base * 0.02));
        ellipse(ex, ey, radius * 2, radius * 2);

        // 放射線
        stroke(255, 40, 40, min(210, alpha));
        for (const r of s.rays) {
            const len = base * (0.18 + progress * 0.55);
            const x1 = ex + cos(r.a) * (radius * 0.35);
            const y1 = ey + sin(r.a) * (radius * 0.35);
            const x2 = ex + cos(r.a) * len;
            const y2 = ey + sin(r.a) * len;
            strokeWeight(max(1, base * 0.01 * r.w));
            line(x1, y1, x2, y2);
        }

        // 減衰
        s.t = max(0, s.t - 0.09);
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

function drawArea() {
    // 背景と画像を再描画して影を消す
    background(255);

    image(images[backgroundIndex], 0, 0, width, height);
    
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (1<= showidx[index] && showidx[index] <= grid*grid){
                blendMode(BLEND);
            }else{
                blendMode(MULTIPLY);
            }

            if (showidx[index] < images.length && showidx[index] > 0) {
                drawBalloonTile(images[showidx[index]], j * cellWidth, i * cellHeight, cellWidth, cellHeight, index);
            }
 
        }
    }
    blendMode(BLEND);

    // 押している最中のマスを影で強調（常時描画になるので状態で持つ）
    if (pressedIndex >= 0 && pressedIndex < grid * grid) {
        const row = floor(pressedIndex / grid);
        const col = pressedIndex % grid;
        fill(0, 0, 0, 80);
        noStroke();
        rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }

    // 破裂エフェクトは最前面
    drawBurstEffects();
}

function allOpen() {
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            if (clicked[i * grid + j] == 0) {
                clicked[i * grid + j] = 1;
                let index = i * grid + j;
                showidx[index] = calcNewImage(index);
                triggerBurst(index);
            }
        }
    }
    drawArea();
}

function mousePressed() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    // タッチ開始位置を記録
    startX = mouseX;
    startY = mouseY;

    // タッチ中のマスを影で強調（drawArea側で描く）
    let col = floor(mouseX / cellWidth);
    let row = floor(mouseY / cellHeight);
    if (col < 0 || col >= grid || row < 0 || row >= grid) {
        pressedIndex = -1;
        return;
    }
    const index = row * grid + col;
    if (clicked[index] === true || clicked[index] === 1) {
        pressedIndex = -1;
        return;
    }
    pressedIndex = index;
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
            triggerBurst(index);
            drawArea();
            revealed++;
        }
    }
    
    drawArea();
    pressedIndex = -1;
}

// Add event listener for the quiz answer submission
const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value;
        if (answers.includes(answerInput)) {
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
                alert(hintMessage);
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
        customButton.disabled = true;
        customButton.style.backgroundColor = '#6c757d';
        customButton.style.cursor = 'not-allowed';
    });

    buttonContainer.appendChild(shareButton);
    buttonContainer.appendChild(customButton);

    const container = document.getElementById('canvas-container');
    container.appendChild(buttonContainer);
}
