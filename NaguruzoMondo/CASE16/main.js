let nazoid = 16;
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

let answers = ["ほうじ","ほゔじ","法事","ばっど","バッド","ギャップ"];

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

// サーチライト用の変数
let searchlights = [];
let searchlightRadius = 0; // パネル幅の半分（setup内で設定）

// 赤色フェードエフェクト用
let redFlashEffect = {
    active: false,
    alpha: 0,
    maxAlpha: 150,
    fadeSpeed: 8
};

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
    pixelDensity(2);
    const canvas = createCanvas(startwidth, startwidth);
    canvas.parent('canvas');
    background(255);
    frameRate(60); // アニメーション用にフレームレートを設定

    cellWidth = width / grid;
    cellHeight = height / grid;
    
    // サーチライトの半径をパネル幅の半分に設定
    searchlightRadius = cellWidth / 2;

    // 正三角形の3D回転用のパラメータ
    let triangleRadius = width * 0.4; // 三角形の外接円の半径
    let centerX = width / 2;
    let centerY = height / 2;
    
    // 正三角形の3つの頂点（初期角度120度間隔）
    for (let i = 0; i < 3; i++) {
        let angle = (i * TWO_PI / 3); // 120度間隔
        searchlights.push({
            // 3D回転パラメータ
            triangleRadius: triangleRadius,
            centerX: centerX,
            centerY: centerY,
            initialAngle: angle,
            rotationSpeedXY: random(0.01, 0.02), // XY平面での回転速度
            rotationSpeedXZ: random(0.008, 0.015), // XZ平面での回転速度
            rotationSpeedYZ: random(0.005, 0.012), // YZ平面での回転速度
            timeXY: random(TWO_PI),
            timeXZ: random(TWO_PI),
            timeYZ: random(TWO_PI),
            
            // 実際の位置（計算される）
            x: 0,
            y: 0,
            
            // 脈動用
            pulseTime: random(TWO_PI),
            pulseSpeed: random(0.02, 0.05)
        });
    }

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
    // サーチライトを常に更新・描画
    updateSearchlights();
    
    // 赤色フェードエフェクトの更新
    updateRedFlashEffect();
    
    // アニメーションやエフェクトが動作中でなければサーチライトのみ描画
    if (!ballAnimation.active && !impactEffect.active) {
        drawArea();
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
            
            // サーチライトとの衝突判定
            let hitSearchlight = false;
            for (let searchlight of searchlights) {
                // 現在の半径を計算（描画と同じロジック）
                let pulseValue = sin(searchlight.pulseTime);
                let radiusMultiplier = 0.9 + 0.1 * pulseValue;
                let currentRadius = searchlightRadius * radiusMultiplier;
                
                let distance = dist(ballAnimation.targetX, ballAnimation.targetY, searchlight.x, searchlight.y);
                if (distance <= currentRadius) {
                    hitSearchlight = true;
                    break;
                }
            }
            
            // サーチライトに当たった場合、すべての開いたパネルを元に戻す
            if (hitSearchlight) {
                // 赤色フラッシュエフェクトを開始
                redFlashEffect.active = true;
                redFlashEffect.alpha = redFlashEffect.maxAlpha;
                
                for (let i = 0; i < grid * grid; i++) {
                    if (clicked[i] == 1) {
                        clicked[i] = 0;
                        showidx[i] = i + 1; // 元の画像に戻す
                    }
                }
                revealed = 0;
                actionLog.push(-3); // サーチライト当たりを記録
            } else {
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
        if (actionLog[i] == -2 || actionLog[i] == -3 || actionLog[i] >= 0) {
            score--; // 画面外着弾・サーチライト当たりはスコアを減らす
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
        } else if (actionLog[i] == -2) {
            palam += "y"; // 画面外着弾
        } else if (actionLog[i] == -3) {
            palam += "x"; // サーチライト当たり
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
    
    // サーチライトを描画
    drawSearchlights();
    
    // 赤色フラッシュエフェクトを描画
    drawRedFlashEffect();
}

// サーチライトの更新
function updateSearchlights() {
    for (let searchlight of searchlights) {
        // 3D回転の時間を更新
        searchlight.timeXY += searchlight.rotationSpeedXY;
        searchlight.timeXZ += searchlight.rotationSpeedXZ;
        searchlight.timeYZ += searchlight.rotationSpeedYZ;
        
        // 脈動の更新
        searchlight.pulseTime += searchlight.pulseSpeed;
        
        // 正三角形の頂点の初期位置（3D空間）
        let baseX = searchlight.triangleRadius * cos(searchlight.initialAngle);
        let baseY = searchlight.triangleRadius * sin(searchlight.initialAngle);
        let baseZ = 0;
        
        // 3D回転を適用
        // XY平面での回転
        let cosXY = cos(searchlight.timeXY);
        let sinXY = sin(searchlight.timeXY);
        let x1 = baseX * cosXY - baseY * sinXY;
        let y1 = baseX * sinXY + baseY * cosXY;
        let z1 = baseZ;
        
        // XZ平面での回転
        let cosXZ = cos(searchlight.timeXZ);
        let sinXZ = sin(searchlight.timeXZ);
        let x2 = x1 * cosXZ - z1 * sinXZ;
        let y2 = y1;
        let z2 = x1 * sinXZ + z1 * cosXZ;
        
        // YZ平面での回転
        let cosYZ = cos(searchlight.timeYZ);
        let sinYZ = sin(searchlight.timeYZ);
        let x3 = x2;
        let y3 = y2 * cosYZ - z2 * sinYZ;
        let z3 = y2 * sinYZ + z2 * cosYZ;
        
        // 最終的なXY座標を計算（中心に移動）
        searchlight.x = x3 + searchlight.centerX;
        searchlight.y = y3 + searchlight.centerY;
        
        // 画面内に収める（必要に応じて）
        searchlight.x = Math.max(searchlightRadius, Math.min(width - searchlightRadius, searchlight.x));
        searchlight.y = Math.max(searchlightRadius, Math.min(height - searchlightRadius, searchlight.y));
    }
}

// サーチライトの描画
function drawSearchlights() {
    for (let searchlight of searchlights) {
        // 周期的に変化する半径と透明度を計算
        let pulseValue = sin(searchlight.pulseTime); // -1 から 1 の値
        let radiusMultiplier = 0.9 + 0.1 * pulseValue;
        let currentRadius = searchlightRadius * radiusMultiplier;
        
        // 半径が大きいときは薄く、小さいときは濃く
        let alphaMultiplier = 1.2 - 0.4 * pulseValue; // 0.8 から 1.6 の範囲
        let currentAlpha = 80 * alphaMultiplier; // 基本透明度80から変化
        
        // 一重の半透明な赤丸
        fill(255, 0, 0, currentAlpha);
        noStroke();
        ellipse(searchlight.x, searchlight.y, currentRadius * 2, currentRadius * 2);
    }
}

// 赤色フラッシュエフェクトの更新
function updateRedFlashEffect() {
    if (redFlashEffect.active) {
        redFlashEffect.alpha -= redFlashEffect.fadeSpeed;
        if (redFlashEffect.alpha <= 0) {
            redFlashEffect.active = false;
            redFlashEffect.alpha = 0;
        }
    }
}

// 赤色フラッシュエフェクトの描画
function drawRedFlashEffect() {
    if (redFlashEffect.active && redFlashEffect.alpha > 0) {
        fill(255, 0, 0, redFlashEffect.alpha);
        noStroke();
        rect(0, 0, width, height);
    }
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

            alert(`ちがいます`);

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
