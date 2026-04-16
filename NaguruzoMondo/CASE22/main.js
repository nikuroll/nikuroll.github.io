let nazoid = 22;
let imageNum = 39; // 画像の枚数
let backgroundIndex = 0; // 背景画像のインデックス
let images = [];
let showidx = [];
let grid = 5;
let cellWidth, cellHeight;
let startX, startY;

let clicked = [];
let cleared = 0;
let revealed = 0;

let actionLog = [];

let shadowPanel = null; // 影の対象パネル（nullは影がない状態）

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = ["ちどうせつ","地動説"];

let remainingAttempts = 3;

let revealedQuestions = 0;

// パネルオブジェクト配列
let panels = [];

// アニメーション関連
let animationSpeed = 0.003; // パネルの移動速度（小さい値ほど滑らかにゆっくり動く）
let time = 0; // アニメーションタイマー

function preload() {
    for (let i = 0; i < imageNum; i++) {
        images.push(loadImage(i <= 25 ? `../images/pic(${i}).PNG` : `images/pic(${i}).PNG`));
    }

    for (let i = 1; i <= grid * grid; i++) {
        clicked.push(0);
        showidx.push(i);
    }
}

// パネルクラスを定義
class Panel {
    constructor(gridIndex, imgIndex, isOuter) {
        this.gridIndex = gridIndex;  // 元のグリッドインデックス（0-24）
        this.imgIndex = imgIndex;    // 表示する画像のインデックス
        this.clicked = false;        // クリック状態
        
        // 元のグリッド位置（表示用の初期位置として保持）
        this.baseRow = Math.floor(gridIndex / grid);
        this.baseCol = gridIndex % grid;
        
        // 表示位置（アニメーションで変化）- 浮動小数点で連続的に保持
        this.row = this.baseRow;
        this.col = this.baseCol;
        
        // 散布アニメーション用のプロパティ
        this.scatterVelocityX = 0;
        this.scatterVelocityY = 0;
        this.scatterStartTime = 0;
        this.scatterDuration = 3000; // 3秒間の散布
        this.isScattering = false;
        this.hasBeenClicked = false;
        
        // 右折フラグ関連
        this.hasRightTurnFlag = false;
        this.rightTurnExecuted = false;
        this.rightTurnTime = 0;
        this.rightTurnDelay = 500; // 右折開始までの時間（ミリ秒）
        
        // パネル回転関連
        this.rotationAngle = 0; // パネルの回転角度（ラジアン）
        
        // アニメーション状態
        this.animationState = 'idle'; // 'idle', 'scattering', 'returning'
    }
    
    // パネルの位置を更新
    update() {
        if (this.animationState === 'scattering') {
            this.updateScatterAnimation();
        } else if (this.animationState === 'returning') {
            this.updateReturnAnimation();
        }
        // idle状態では元の位置に留まる
    }
    
    // 散布アニメーションの更新
    updateScatterAnimation() {
        const currentTime = millis();
        const elapsed = currentTime - this.scatterStartTime;
        
        if (elapsed < this.scatterDuration) {
            // 右折フラグがあり、まだ右折していない場合の処理
            if (this.hasRightTurnFlag && !this.rightTurnExecuted && elapsed > this.rightTurnDelay) {
                this.executeRightTurn();
            }
            
            // 散布中：速度を適用して位置を更新
            this.col += this.scatterVelocityX;
            this.row += this.scatterVelocityY;
            
            // 速度を徐々に減衰させる
            this.scatterVelocityX *= 0.985;
            this.scatterVelocityY *= 0.985;
            
            // 進行方向に基づいて向きを更新
            this.updateRotationFromVelocity();
        } else {
            // 散布終了：戻るアニメーションを開始
            this.animationState = 'returning';
            this.rightTurnExecuted = false; // 次回の散布に備えてリセット
        }
    }
    
    // 右折を実行する
    executeRightTurn() {
        // 現在の速度ベクトルを90度右回転
        const currentVelX = this.scatterVelocityX;
        const currentVelY = this.scatterVelocityY;
        
        // 90度右回転の行列変換: (x, y) -> (-y, x)
        this.scatterVelocityX = -currentVelY;
        this.scatterVelocityY = currentVelX;
        
        this.rightTurnExecuted = true;
    }
    
    // 進行方向に基づいてパネルの向きを更新
    updateRotationFromVelocity() {
        // 残り枚数が20枚以下の場合のみ回転を適用
        const remainingPanels = panels.filter(p => !clicked[p.gridIndex]).length;
        if (remainingPanels <= 20) {
            // 速度ベクトルから角度を計算
            this.rotationAngle = atan2(this.scatterVelocityY, this.scatterVelocityX);
        }
    }
    
    // 戻るアニメーションの更新
    updateReturnAnimation() {
        const returnSpeed = 0.1;
        const deltaX = this.baseCol - this.col;
        const deltaY = this.baseRow - this.row;
        
        // 元の位置に向かって移動
        this.col += deltaX * returnSpeed;
        this.row += deltaY * returnSpeed;
        
        // 十分に近づいたら元の位置に固定してアニメーション終了
        if (Math.abs(deltaX) < 0.01 && Math.abs(deltaY) < 0.01) {
            this.col = this.baseCol;
            this.row = this.baseRow;
            this.rotationAngle = 0; // 回転角度もリセット
            this.animationState = 'idle';
        }
    }
    
    // 散布アニメーションを開始
    startScatterAnimation() {
        this.animationState = 'scattering';
        this.scatterStartTime = millis();
        
        // パネルの現在位置に応じて移動方向を設定
        const centerX = (grid - 1) / 2;  // グリッドの中心X座標
        const centerY = (grid - 1) / 2;  // グリッドの中心Y座標
        
        // 現在位置から中心方向のベクトルを計算
        const toCenterX = centerX - this.col;
        const toCenterY = centerY - this.row;
        
        // 中心方向の角度を計算
        const toCenterAngle = atan2(toCenterY, toCenterX);
        
        // 中心方向を中心とする180度の範囲でランダムな角度を選択
        const randomOffset = random(-PI/6, PI/6); // -90度から+90度の範囲
        const scatterAngle = toCenterAngle + randomOffset;
        
        // 速度を設定
        const speed = random(0.05, 0.15);
        this.scatterVelocityX = cos(scatterAngle) * speed;
        this.scatterVelocityY = sin(scatterAngle) * speed;
        
        // 初期の進行方向に基づいて向きを設定
        this.updateRotationFromVelocity();
        
        // 右折フラグの状態をリセット
        this.rightTurnExecuted = false;
        this.rightTurnDelay = random(500, 1000); // 右折開始までの時間をランダムに設定
    }
    
    // 右折フラグを設定
    setRightTurnFlag(hasFlag) {
        this.hasRightTurnFlag = hasFlag;
    }
    
    // パネルの表示
    display() {
        if (this.imgIndex < images.length) {
            push(); // 変換マトリックスを保存
            
            // パネルの中心点に移動
            translate(this.col * cellWidth + cellWidth/2, this.row * cellHeight + cellHeight/2);
            
            // パネルを回転
            rotate(this.rotationAngle);
            
            // ハイライト表示のチェック
            const remainingPanels = panels.filter(p => !clicked[p.gridIndex]).length;
            const shouldHighlight = remainingPanels <= 5 && this.hasRightTurnFlag;
            
            if (shouldHighlight) {
                // ハイライト効果（光る枠）を描画
                strokeWeight(4);
                stroke(255, 255, 0, 150 + 100 * sin(millis() * 0.01)); // 黄色の点滅枠
                fill(255, 255, 0, 30 + 20 * sin(millis() * 0.01)); // 薄い黄色の背景
                rect(-cellWidth/2 - 2, -cellHeight/2 - 2, cellWidth + 4, cellHeight + 4);
                noStroke();
                noFill();
            }
            
            // パネルを描画（中心基準で描画するため座標をずらす）
            image(
                images[this.imgIndex], 
                -cellWidth/2, 
                -cellHeight/2, 
                cellWidth, 
                cellHeight
            );
            
            pop(); // 変換マトリックスを復元
        }
    }
    
    // クリック判定
    checkClick(x, y) {
        // マウス座標がこのパネルの領域内かチェック
        return (
            x >= this.col * cellWidth &&
            x < (this.col + 1) * cellWidth &&
            y >= this.row * cellHeight &&
            y < (this.row + 1) * cellHeight
        );
    }
}

function setup() {
    startwidth = min(window.innerWidth, window.innerHeight, 800);
    // 画質改善
    pixelDensity(2);
    const canvas = createCanvas(startwidth, startwidth);
    canvas.parent('canvas');
    background(255);

    cellWidth = width / grid;
    cellHeight = height / grid;

    // パネルオブジェクトを初期化
    initializePanels();
    
    // フレームレートを設定
    frameRate(60);

    drawArea();
}

// パネルの初期化
function initializePanels() {
    panels = [];
    
    // 右折フラグを付けるパネルのインデックス（例：角のパネルと中心のパネル）
    const rightTurnPanels = [1, 11, 16, 20];
    
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            const index = i * grid + j;
            
            // 外側のパネルかどうかの判定
            const isOuter = i === 0 || i === grid - 1 || j === 0 || j === grid - 1;
            
            // パネルオブジェクトを作成
            const panel = new Panel(index, showidx[index], isOuter);
            
            // 初期位置はグリッド配置
            panel.row = i;
            panel.col = j;
            
            // 特定のパネルに右折フラグを設定
            if (rightTurnPanels.includes(index)) {
                panel.setRightTurnFlag(true);
            }
            
            panels.push(panel);
        }
    }
}

function draw() {
    // グローバルタイマーを更新
    time += animationSpeed;
    
    // パネル位置の更新
    updatePanels();
    
    // 画面描画
    drawArea();
}

// パネル位置の更新
function updatePanels() {
    // 各パネルの位置を更新
    for (let panel of panels) {
        panel.update();
    }
}

function calcNewImage(index) {
    ret = [10,4,11,12,5,0,1,6,7,2,3,8,0,1,2,3,4,5,6,7,8,9,3,5,1];
    return ret[index] + 26;
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


function drawArea() {
    // 背景をクリアして影をリセット
    background(255);

    // アニメーション用のフレーム計算
    imageFrame = 0;
    image(images[backgroundIndex + imageFrame], 0, 0, width, height);

    // ソートされたパネルを描画（後ろから前に）
    for (let panel of panels) {
        // 適切なブレンドモードを設定
        blendMode(MULTIPLY);

        if (1 <= panel.imgIndex && panel.imgIndex <= grid * grid) {
            // 何もしない
        } else {
            panel.display();
        }        
    }

    for (let panel of panels) {
        // 適切なブレンドモードを設定
        blendMode(BLEND);

        if (1 <= panel.imgIndex && panel.imgIndex <= grid * grid) {
            panel.display();
        } else {
            // 何もしない
        }        
    }
    
    blendMode(BLEND);
    
    // 影の描画
    if (shadowPanel !== null) {
        fill(0, 0, 0, 100); // 半透明の黒
        noStroke();
        // パネルの現在位置に合わせて影を表示
        rect(
            shadowPanel.col * cellWidth, 
            shadowPanel.row * cellHeight, 
            cellWidth, 
            cellHeight
        );
    }
}

function allOpen() {
    for (let panel of panels) {
        if (clicked[panel.gridIndex] == 0) {
            clicked[panel.gridIndex] = 1;
            const newpic = calcNewImage(panel.gridIndex);
            panel.imgIndex = newpic;
            showidx[panel.gridIndex] = newpic;
        }
    }
    startScatterAnimation();
    drawArea();
}

function mousePressed() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    // タッチ開始位置を記録
    startX = mouseX;
    startY = mouseY;

    // クリック位置に重なっている未開封のパネルをすべて集める
    let clickedPanels = [];
    
    for (let panel of panels) {
        if (panel.checkClick(mouseX, mouseY) && !clicked[panel.gridIndex]) {
            clickedPanels.push(panel);
        }
    }
    
    if (clickedPanels.length > 0) {
        // 最後のパネル（配列の最後に追加されたパネル）を影の対象に
        shadowPanel = clickedPanels.pop();
    } else {
        // クリックできるパネルがない場合は影をなくす
        shadowPanel = null;
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    
    // 影の対象をクリア
    const clickedShadowPanel = shadowPanel;
    shadowPanel = null;
    
    if (cleared == 0) {
        // マウスが移動していない場合のみ処理（ドラッグ操作を除外）
        const mouseMovedTooMuch = dist(startX, startY, mouseX, mouseY) > cellWidth * 0.3;
        if (!mouseMovedTooMuch) {
            // 未開封のパネルを検索
            let clickedPanels = [];
            
            // クリックされた位置に重なっているパネルをすべて集める
            for (let panel of panels) {
                if (panel.checkClick(mouseX, mouseY) && !clicked[panel.gridIndex]) {
                    clickedPanels.push(panel);
                }
            }
            
            if (clickedPanels.length > 0) {
                
                // 最も手前のパネルを開く
                const topPanel = clickedPanels.pop();
                
                // パネルをクリック状態に
                actionLog.push(topPanel.gridIndex);
                clicked[topPanel.gridIndex] = true;
                
                // 画像を更新
                const newpic = calcNewImage(topPanel.gridIndex);
                topPanel.imgIndex = newpic;
                showidx[topPanel.gridIndex] = newpic;
                revealed++;
                
                // 全パネルの散布アニメーションを開始
                startScatterAnimation();
            }
        }
    }
    
    drawArea();
}

// 全パネルの散布アニメーションを開始する関数
function startScatterAnimation() {
    for (let panel of panels) {
        panel.startScatterAnimation();
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

            // 正解時にも散布アニメーションを実行
            startScatterAnimation();

            showResultButtons(tweetMess);
        } else {
            if (answers.includes(answerInput)) {
                answers = answers.filter(e => e !== answerInput);
            }

            remainingAttempts--;
            document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;

            if (revealed == 25){
                alert(`ちがいます。\nヒント1. 「ち」と「ど」だけ動きがおかしいぞ？\nヒント2.「右折」しているね。\nヒント3.答えは天文学に関係がある言葉になるよ。`);
            }else{
                alert(`ちがいます`);
            }

            actionLog.push(-1);
            
            // 不正解時にも散布アニメーションを実行
            startScatterAnimation();
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
