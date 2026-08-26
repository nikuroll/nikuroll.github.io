let nazoid = 21;
let imageNum = 32; // 画像の枚数
let backgroundIndex = 30; // 背景画像のインデックス
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

let answers = ["いかんて"];

let remainingAttempts = 3;

let revealedQuestions = 0;

// パネルオブジェクト配列
let panels = [];

// アニメーション関連
let animationSpeed = 0.0003; // パネルの移動速度（小さい値ほど滑らかにゆっくり動く）
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
        
        // 軌道上の位置パラメータ（0～1の範囲、各パネルは等間隔に配置）
        this.pathPosition = gridIndex / (grid * grid); // 0～1の間で等間隔に配置
    }
    
    // パネルの位置を更新
    update() {
        // 軌道上の位置を更新（0～1の範囲を循環）
        this.pathPosition = (this.pathPosition + animationSpeed) % 1;
        
        // 盤面全体にまたがるリサージュ曲線を計算
        // パネルの位置に応じた値を計算
        this.updatePositionOnPath();
    }
    
    // リサージュ曲線上の位置を計算
    updatePositionOnPath() {
        // リサージュ曲線のパラメータ
        const a = 2.0;       // X方向の振幅
        const b = 1.5;       // Y方向の振幅
        const freqX = 1;     // X方向の周波数
        const freqY = 1;     // Y方向の周波数
        
        // パネルの位置に基づいて位相を計算（2πの範囲で）
        const angle = this.pathPosition * Math.PI * 2;
        
        // リサージュ曲線の計算
        const centerX = (grid - 1) / 2;  // 中心X座標
        const centerY = (grid - 1) / 2;  // 中心Y座標
        
        // 中心を基準にリサージュ曲線の座標を計算
        const offsetX = a * Math.sin(freqX * angle);
        const offsetY = b * Math.sin(freqY * angle + Math.PI/2); // 90度ずらして楕円に近い形に
        
        // 盤面の中心を基準に座標を設定
        this.col = centerX + offsetX;
        this.row = centerY + offsetY;
        
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
    
    // パネルの総数
    const totalPanels = grid * grid;
    
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            const index = i * grid + j;
            
            // 外側のパネルかどうかの判定（今回の実装では使用しないが、拡張のために残す）
            const isOuter = i === 0 || i === grid - 1 || j === 0 || j === grid - 1;
            
            // パネルオブジェクトを作成
            const panel = new Panel(index, showidx[index], isOuter);
            
            // 環状の軌道上に等間隔で配置するための位相設定
            panel.pathPosition = index / totalPanels;
            
            // 初期位置を軌道上の位置に合わせる
            panel.updatePositionOnPath();
            
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
    ret = [0,1,2,3,2,0,1,0,1,0,1,3,2,1,3,1,3,1,3,2,0,2,0,1,3]
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

    if (revealed == grid * grid) {
        backgroundIndex = 31; // 全部開けたら背景を変える
    }
    
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
