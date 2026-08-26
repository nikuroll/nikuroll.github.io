let nazoid = 15;
let imageNum = 27; // 画像の枚数
let backgroundIndex = 26; // 背景画像のインデックス
let images = [];
let showidx = [];
let grid = 5;
let cellWidth, cellHeight;
let startX, startY;

let clicked = [];
let cleared = 0;
let revealed = 0;

let actionLog = [];

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = ["かもももにく"];

let remainingAttempts = 3;

let revealedQuestions = 0;

// ストラックアウト用の変数
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
    actualTargetIndex: -1, // 実際に着弾するマス
    speed: 0.05
};

let ballRadius = 15;

// 着弾エフェクト用
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
        images.push(loadImage(i <= 25 ? `../images/pic(${i}).PNG` : `images/pic(${i}).PNG`));
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
    background(255);
    frameRate(60); // アニメーション用にフレームレートを設定

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

// draw関数を追加してアニメーションを処理
function draw() {
    // アニメーションやエフェクトが動作中でなければ描画をスキップ
    if (!ballAnimation.active && !impactEffect.active) {
        return;
    }
    
    // ボールアニメーションの進行
    if (ballAnimation.active) {
        ballAnimation.progress += ballAnimation.speed;
        
        // イージング関数（二次関数）
        let easeProgress = ballAnimation.progress * ballAnimation.progress;
        
        // ボールの現在位置を計算（lerp関数を手動実装）
        ballAnimation.currentX = ballAnimation.startX + (ballAnimation.targetX - ballAnimation.startX) * easeProgress;
        ballAnimation.currentY = ballAnimation.startY + (ballAnimation.targetY - ballAnimation.startY) * easeProgress;
        
        // 画面を再描画
        drawArea();
        
        // ボールを描画
        drawBall();
        
        // アニメーション終了判定
        if (ballAnimation.progress >= 1.0) {
            // アニメーション終了時の処理
            ballAnimation.active = false;
            
            // 着弾エフェクトを常に開始（画面内外問わず）
            impactEffect.active = true;
            impactEffect.x = ballAnimation.targetX;
            impactEffect.y = ballAnimation.targetY;
            impactEffect.radius = 0;
            impactEffect.frame = 0;
            
            // 実際に着弾したマスのパネルを開く（画面内着弾の場合のみ）
            if (ballAnimation.actualTargetIndex >= 0 && ballAnimation.actualTargetIndex < grid * grid) {
                actionLog.push(ballAnimation.actualTargetIndex);
                if (clicked[ballAnimation.actualTargetIndex] == 0) {
                    clicked[ballAnimation.actualTargetIndex] = true;
                    showidx[ballAnimation.actualTargetIndex] = calcNewImage(ballAnimation.actualTargetIndex);
                    revealed++;
                }
            } else {
                // 画面外着弾の場合はactionLogに-2を記録（外れを示す）
                actionLog.push(-2);
            }
        }
    }
    
    // 着弾エフェクトの処理
    if (impactEffect.active) {
        impactEffect.frame++;
        impactEffect.radius = (impactEffect.frame / impactEffect.duration) * impactEffect.maxRadius;
        
        // 画面を再描画
        drawArea();
        
        // エフェクトを描画
        drawImpactEffect();
        
        // エフェクト終了判定
        if (impactEffect.frame >= impactEffect.duration) {
            impactEffect.active = false;
            // 最終的な画面描画
            drawArea();
        }
    }
}

function drawImpactEffect() {
    // 着弾エフェクト（波紋のような円）
    let alpha = 255 * (1 - impactEffect.frame / impactEffect.duration);
    
    // 外側の円
    stroke(255, 100, 100, alpha);
    strokeWeight(3);
    noFill();
    ellipse(impactEffect.x, impactEffect.y, impactEffect.radius * 2, impactEffect.radius * 2);
    
    // 内側の円
    if (impactEffect.radius > 10) {
        stroke(255, 200, 200, alpha * 0.7);
        strokeWeight(2);
        ellipse(impactEffect.x, impactEffect.y, (impactEffect.radius - 10) * 2, (impactEffect.radius - 10) * 2);
    }
}

function drawBall() {
    // 放物線の軌道を計算（高さのある軌道）
    let progress = ballAnimation.progress;
    let arcHeight = 100; // 弧の高さ
    let arcOffset = arcHeight * 4 * progress * (progress - 1); // 放物線の計算（上向きに修正）
    
    let currentY = ballAnimation.currentY + arcOffset;
    
    // ボールの影（地面に投影）
    fill(0, 0, 0, 30);
    noStroke();
    ellipse(ballAnimation.currentX + 2, ballAnimation.currentY + 2, ballRadius * 1.5, ballRadius * 0.8);
    
    // ボール本体
    fill(255, 100, 100);
    stroke(200, 50, 50);
    strokeWeight(2);
    ellipse(ballAnimation.currentX, currentY, ballRadius * 2, ballRadius * 2);
    
    // ボールのハイライト
    fill(255, 200, 200);
    noStroke();
    ellipse(ballAnimation.currentX - 5, currentY - 5, ballRadius, ballRadius);
    
    // 速度に応じた残像効果
    if (progress > 0.1) {
        for (let i = 1; i <= 3; i++) {
            let trailProgress = Math.max(0, progress - i * 0.05);
            let trailX = ballAnimation.startX + (ballAnimation.targetX - ballAnimation.startX) * (trailProgress * trailProgress);
            let trailY = ballAnimation.startY + (ballAnimation.targetY - ballAnimation.startY) * (trailProgress * trailProgress);
            let trailArcOffset = arcHeight * 4 * trailProgress * (trailProgress - 1);
            
            fill(255, 100, 100, 50 / i);
            noStroke();
            ellipse(trailX, trailY + trailArcOffset, ballRadius * 1.5 / i, ballRadius * 1.5 / i);
        }
    }
}

function startBallAnimation(clickX, clickY, targetIndex) {
    // クリックされたマスの中心座標を計算
    let targetCol = targetIndex % grid;
    let targetRow = floor(targetIndex / grid);
    let targetCenterX = targetCol * cellWidth + cellWidth / 2;
    let targetCenterY = targetRow * cellHeight + cellHeight / 2;
    
    // クリック位置に物理的な誤差を追加（より自然な散らばり）
    let maxError = cellWidth * 1.5; // セル幅の150%までの誤差
    let errorX = (Math.random() - 0.5) * 2 * maxError; // -maxError から +maxError
    let errorY = (Math.random() - 0.5) * 2 * maxError;
    
    // 実際の着弾位置を計算（画面外も許可）
    let actualLandingX = targetCenterX + errorX;
    let actualLandingY = targetCenterY + errorY;
    
    // 着弾位置からパネルを逆算（画面内の場合のみ）
    if (actualLandingX >= 0 && actualLandingX < width && actualLandingY >= 0 && actualLandingY < height) {
        let landingCol = Math.floor(actualLandingX / cellWidth);
        let landingRow = Math.floor(actualLandingY / cellHeight);
        
        // グリッド範囲内に収める
        landingCol = Math.max(0, Math.min(grid - 1, landingCol));
        landingRow = Math.max(0, Math.min(grid - 1, landingRow));
        
        ballAnimation.actualTargetIndex = landingRow * grid + landingCol;
    } else {
        // 画面外着弾の場合は-1を設定（パネルを開かない）
        ballAnimation.actualTargetIndex = -1;
    }
    
    // アニメーション設定
    ballAnimation.active = true;
    ballAnimation.startX = clickX;
    ballAnimation.startY = clickY;
    ballAnimation.targetX = actualLandingX;
    ballAnimation.targetY = actualLandingY;
    ballAnimation.currentX = clickX;
    ballAnimation.currentY = clickY;
    ballAnimation.progress = 0;
    ballAnimation.targetIndex = targetIndex;
    ballAnimation.speed = 0.03; // アニメーション速度
}

function make_tweet(res = 0) {
    score = grid * grid;
    for (let i = 0; i < actionLog.length; i++) {
        if (actionLog[i] == -2 || actionLog[i] >= 0) {
            score--; // 画面外着弾はスコアを減らす
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


function drawArea() {
    // 背景と画像を再描画して影を消す
    background(255);

    image(images[backgroundIndex], 0, 0, width, height);

    blendMode(ADD);
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (1 <= showidx[index] && showidx[index] <= grid * grid) {
                blendMode(BLEND);
            } else {
                blendMode(MULTIPLY);
            }
            if (showidx[index] < images.length) {
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

function mousePressed() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    
    // アニメーション中はクリックを無効化
    if (ballAnimation.active) {
        return;
    }
    
    // タッチ開始位置を記録
    startX = mouseX;
    startY = mouseY;

    // タッチ中のマスを影で強調（開済みパネルでも可能）
    let col = floor(mouseX / cellWidth);
    let row = floor(mouseY / cellHeight);

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
    
    // アニメーション中はクリックを無効化
    if (ballAnimation.active) {
        return;
    }
    
    if (cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);

        // グリッド範囲内であれば、開済み・未開済みを問わずボールを投げる
        if (col >= 0 && col < grid && row >= 0 && row < grid) {
            let index = row * grid + col;
            
            // ボールアニメーションを開始（どのパネルからでも投げられる）
            startBallAnimation(mouseX, mouseY, index);
        }
    }
    
    // アニメーション中でなければ即座に再描画
    if (!ballAnimation.active) {
        drawArea();
    }
}

// Add event listener for the quiz answer submission
const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value;
        if (answers.includes(answerInput)) {
            window.showCaseMessage('正解！');

            tweetMess = make_tweet();

            cleared = 1;

            showResultButtons(tweetMess);
        } else {
            if (answers.includes(answerInput)) {
                answers = answers.filter(e => e !== answerInput);
            }

            remainingAttempts--;
            document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;

            window.showCaseMessage(`ちがいます`);

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
