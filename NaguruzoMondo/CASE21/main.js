let nazoid = 21;
let imageNum = 51; // 画像の枚数
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

let shadowCell = { row: -1, col: -1, active: false }; // 影の状態管理

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = ["こうきゅうばなな", "高級バナナ", "コウキュウバナナ","こうきゅうバナナ"];
let checkCounter= [0,0,0];

let remainingAttempts = 3;

let revealedQuestions = 0;

// パネルオブジェクト配列
let panels = [];

// アニメーション関連
let animationSpeed = 0.1; // パネルの移動速度
let time = 0; // アニメーションタイマー

function preload() {
    for (let i = 0; i < imageNum; i++) {
        images.push(loadImage(`images/pic(${i}).PNG`));
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
        this.isOuter = isOuter;      // 外側パネルかどうか
        
        // 元のグリッド位置
        this.baseRow = Math.floor(gridIndex / grid);
        this.baseCol = gridIndex % grid;
        
        // 表示位置（アニメーションで変化）- 浮動小数点で連続的に保持
        this.row = this.baseRow;
        this.col = this.baseCol;
        
        // リサージュ曲線のパラメータ（各パネルで少しずつ異なる値に）
        this.freqX = 0.2 + (gridIndex % 5) * 0.01;  // X方向の周波数
        this.freqY = 0.3 + (Math.floor(gridIndex / 5)) * 0.01;  // Y方向の周波数
        this.phaseX = gridIndex * 0.2;  // X方向の位相
        this.phaseY = gridIndex * 0.3;  // Y方向の位相
        this.amplitude = isOuter ? 0.45 : 0.25;  // 振幅（外側と内側で異なる値）
        
        // グリッド中の位置に応じてリサージュパラメータを調整
        if (isOuter) {
            // 外側パネルはより大きく動く
            if (this.baseRow === 0 || this.baseRow === grid-1) {
                // 上下の辺は左右に大きく移動
                this.freqX *= 1.2;
                this.freqY *= 0.8;
            } else {
                // 左右の辺は上下に大きく移動
                this.freqX *= 0.8;
                this.freqY *= 1.2;
            }
        } else {
            // 内側パネルは中心を軸に回るような動き
            this.phaseX += Math.PI / 4;  // 45度ずらす
        }
    }
    
    // パネルの位置を更新
    update() {
        // リサージュ曲線に沿って位置を更新
        const offsetX = this.amplitude * Math.sin(time * this.freqX + this.phaseX);
        const offsetY = this.amplitude * Math.sin(time * this.freqY + this.phaseY);
        
        // 基本位置に連続的なオフセットを適用
        this.col = this.baseCol + offsetX;
        this.row = this.baseRow + offsetY;
        
        // 境界を超えないように制限（完全に画面外に出ないように）
        this.col = Math.max(-0.5, Math.min(grid - 0.5, this.col));
        this.row = Math.max(-0.5, Math.min(grid - 0.5, this.row));
    }
    
    // パネルの表示
    display() {
        if (this.imgIndex < images.length) {
            image(
                images[this.imgIndex], 
                this.col * cellWidth, 
                this.row * cellHeight, 
                cellWidth, 
                cellHeight
            );
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
    
    // リサージュパラメータのバリエーション用の配列
    const freqVariations = [0.2, 0.25, 0.3, 0.35, 0.4];
    const phaseVariations = [0, Math.PI/6, Math.PI/4, Math.PI/3, Math.PI/2];
    
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            const index = i * grid + j;
            
            // 外側のパネルかどうかを判定
            const isOuter = i === 0 || i === grid - 1 || j === 0 || j === grid - 1;
            
            // パネルオブジェクトを作成
            const panel = new Panel(index, showidx[index], isOuter);
            
            // より多様なリサージュパラメータを設定
            panel.freqX = freqVariations[(i + j) % 5] * (isOuter ? 1.2 : 0.8);
            panel.freqY = freqVariations[(i * 2 + j) % 5] * (isOuter ? 1.0 : 0.9);
            panel.phaseX = phaseVariations[j % 5] + index * 0.1;
            panel.phaseY = phaseVariations[i % 5] + index * 0.12;
            
            // 外側と内側でアニメーション特性を変更
            if (isOuter) {
                // 外側パネルは大きく動く
                panel.amplitude = 0.45 + (i * j % 3) * 0.05;
            } else {
                // 内側パネルはより小さく、複雑に動く
                panel.amplitude = 0.15 + (i + j % 4) * 0.05;
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
    return index + 26;
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
    if (shadowCell.active) {
        fill(0, 0, 0, 100); // 半透明の黒
        noStroke();
        // 実際のパネル位置に合わせて影を表示
        rect(shadowCell.col * cellWidth, shadowCell.row * cellHeight, cellWidth, cellHeight);
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
        const topPanel = clickedPanels.pop();
        shadowCell.row = topPanel.row;
        shadowCell.col = topPanel.col;
        shadowCell.active = true;
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    
    // 影を非表示にする
    shadowCell.active = false;
    
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
                
                // 最も手前（番号が小さい）のパネルを開く
                const topPanel = clickedPanels.pop();
                
                // パネルをクリック状態に
                actionLog.push(topPanel.gridIndex);
                clicked[topPanel.gridIndex] = true;
                
                // 画像を更新
                const newpic = calcNewImage(topPanel.gridIndex);
                topPanel.imgIndex = newpic;
                showidx[topPanel.gridIndex] = newpic;
                revealed++;
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
