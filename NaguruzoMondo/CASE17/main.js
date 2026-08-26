let nazoid = 17;
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

let answers = ["かりーうどん","カリーうどん"];

let remainingAttempts = 3;

let originalGridData = null;  // 元のグリッドデータ
let targetGridData = null;    // 目標パターン（2回変換後）

let lastClickFrame = -10; // 直近でクリックを受理したフレーム番号
let pressedCell = null; // タッチ中のセルを記録する変数

// グリッドの現在の状況を01データとして取得する関数
function getCurrentGridData() {
    let gridData = "";
    for (let i = 0; i < grid * grid; i++) {
        gridData += (clicked[i] == 1) ? "1" : "0";
    }
    return gridData;
}

// リスト変換関数：先頭に0を追加し末尾を1つ削除
function transformList(binaryArray) {
    if (binaryArray.length !== 25) {
        console.error('配列は25要素である必要があります');
        return null;
    }
    
    // 先頭に0を追加し、末尾を削除
    let transformedArray = [0, ...binaryArray.slice(0, 24)];
    return transformedArray;
}

// デバッグ用：現在のグリッド状況をコンソールに出力
function debugGridState() {
    console.log('現在のグリッド状況:', getCurrentGridData());
    console.log('クリック状況:', clicked);
    console.log('表示画像:', showidx);
}

// 現在のパネル状況をチェックして正誤判定
function checkCompletion() {
    if (!targetGridData) return false;
    
    // 目標パターンと比較し、全て同じか全て違うならtrue
    all_true = true;
    all_false = true;
    for (let i = 0; i < targetGridData.length; i++) {
        if (clicked[i] == targetGridData[i]) {
            all_false = false; // 目標パターンと同じならfalse
        }else{
            all_true = false; // 目標パターンと違うならtrue
        }
    }
    
    return all_true || all_false; // 全て同じか全て違うならtrue
}
function loadGridFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const gridData = urlParams.get('ac');
    
    // すべて0 すべて1の場合をはじきたい
    valid = true;
    if (gridData === '0'.repeat(25) || gridData === '1'.repeat(25)) {
        valid = false;
    }

    if (gridData && gridData.length === 25 & valid) {
        // 01データからグリッド画像を生成
        let binaryArray = [];
        for (let i = 0; i < 25; i++) {
            binaryArray.push(parseInt(gridData[i]));
        }
        
        // 元のパターンを保存
        originalGridData = binaryArray.slice(); // コピーを作成
        
        // 目標パターン（2回変換後）を設定
        let once = transformList(originalGridData);
        targetGridData = transformList(once);
        
        // 元の画像を生成
        addGridImageToArray(binaryArray);
        
        // 変換後の画像を生成
        let transformedArray = transformList(binaryArray);
        if (transformedArray) {
            addGridImageToArray(transformedArray);
        }
        
        return true;
    }
    return false;
}

// グリッド画像生成用の変数
let gridImages = []; // 生成されたグリッド画像を格納

// 1次元配列（25要素）からグリッド画像を生成する関数
function generateGridImage(binaryArray) {
    if (binaryArray.length !== 25) {
        console.error('配列は25要素である必要があります');
        return null;
    }
    
    // グリッドのサイズ設定
    let gridSize = 200; // 生成する画像のサイズ
    let cellSize = gridSize / grid; // 1セルのサイズ
    let outerStroke = 4; // 外枠の太さ
    let innerStroke = 1; // 内側格子の太さ
    
    // グラフィックスバッファを作成
    let pg = createGraphics(gridSize, gridSize);
    
    // 背景を白に設定
    pg.background(255);
    
    // セルを描画
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            let value = binaryArray[index];
            
            // セルの色を設定（1なら黒、0なら白）
            if (value === 1) {
                pg.fill(0); // 黒
            } else {
                pg.fill(255); // 白
            }
            
            pg.noStroke();
            pg.rect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
    
    // 格子線を描画
    pg.stroke(0); // 黒い線
    
    // 内側の格子線（細い線）
    pg.strokeWeight(innerStroke);
    for (let i = 1; i < grid; i++) {
        // 縦線
        pg.line(i * cellSize, 0, i * cellSize, gridSize);
        // 横線
        pg.line(0, i * cellSize, gridSize, i * cellSize);
    }
    
    // 外枠（太い線）
    pg.strokeWeight(outerStroke);
    pg.noFill();
    pg.rect(outerStroke/2, outerStroke/2, gridSize - outerStroke, gridSize - outerStroke);
    
    return pg;
}

// グリッド画像をimages配列に追加する関数
function addGridImageToArray(binaryArray) {
    let gridImage = generateGridImage(binaryArray);
    if (gridImage) {
        images.push(gridImage);
        return images.length - 1; // 追加された画像のインデックスを返す
    }
    return -1;
}

// グリッド画像を描画する共通関数
function drawGridImages() {
    if (images.length > imageNum) {
        let displaySize = cellWidth * 1.35;
        let spacing = 10;
        
        // URLから読み込んだ場合（元の画像 + 変換後の画像）
        if (images.length >= imageNum + 2) {
            let originalImg, transformedImg;
            
            // 最新の2つの画像を使用
            let numGridImages = images.length - imageNum;
            if (numGridImages >= 2) {
                originalImg = images[images.length - 2]; // 最後から2番目（元の画像）
                transformedImg = images[images.length - 1]; // 最後（変換後の画像）
                
                // 元の画像を左下側に配置
                let originalX = spacing;
                let originalY = height - displaySize - spacing;
                image(originalImg, originalX, originalY, displaySize, displaySize);
                
                // 変換後の画像を下側（中央）に配置
                let transformedX = (width - displaySize) / 2;
                let transformedY = height - displaySize - spacing;
                image(transformedImg, transformedX, transformedY, displaySize, displaySize);

            }
        }
    }
}

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
    const canvas = createCanvas(startwidth, startwidth);
    canvas.parent('canvas');
    background(255);
    frameRate(30);

    cellWidth = width / grid;
    cellHeight = height / grid;

    // // クイズコンテナ全体を非表示にする
    // const quizContainer = document.querySelector('.quiz-container');
    // if (quizContainer) {
    //     quizContainer.style.display = 'none';
    // }

    // URLパラメータからグリッドデータを読み込み
    let loadedFromURL = loadGridFromURL();
    
    if (!loadedFromURL) {
        // URLにデータがない場合はテスト用のグリッドパターンを生成
        let testPattern1 = [
            0, 0, 0,
            0, 1, 0, 1, 0,
            0, 0, 0, 0, 0,
            1, 0, 0, 0, 1,
            0, 1, 1, 1, 0,
            1, 1
        ];
        
        // 元のパターンを保存
        originalGridData = testPattern1.slice(); // コピーを作成
        
        // 目標パターン（2回変換後）を設定
        let once = transformList(originalGridData);
        targetGridData = transformList(once);
        
        // 元の画像と変換後の画像を生成
        addGridImageToArray(testPattern1);
        let transformedPattern1 = transformList(testPattern1);
        if (transformedPattern1) addGridImageToArray(transformedPattern1);
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
    
    // // グリッド画像を描画
    // drawGridImages();
  
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
        tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid * grid}\n`;
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
    
    // グリッドの状況を01データとして追加
    let gridData = "";
    for (let i = 0; i < grid * grid; i++) {
        gridData += (clicked[i] == 1) ? "1" : "0";
    }
    palam += gridData;

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
    // タッチ開始位置を記録
    startX = mouseX;
    startY = mouseY;

    // タッチ中のマスを影で強調とpressedCellを記録
    let col = floor(mouseX / cellWidth);
    let row = floor(mouseY / cellHeight);
    
    if (col >= 0 && col < grid && row >= 0 && row < grid) {
        pressedCell = {col, row}; // セルを記録
        fill(0, 0, 0, 100); // 半透明の黒
        noStroke();
        rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    
    if (cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);

        if (col >= 0 && col < grid && row >= 0 && row < grid) {
            let index = row * grid + col;
            
            if (clicked[index] == 0) {
                // パネルを開く処理
                actionLog.push(index);
                clicked[index] = true;
                newpic = calcNewImage(index);
                showidx[index] = newpic;
                revealed++;
            } else {
                // パネルを復活させる処理
                actionLog.push(-index - 1); // 負の値でパネル復活を記録
                clicked[index] = false;
                showidx[index] = index + 1; // 1-indexに修正
                revealed--;
            }
        }else{
            return;
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

            window.showCaseMessage(`意味ないよ`);

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

function drawArea() {
    // 背景と画像を再描画して影を消す
    background(255);

    image(images[backgroundIndex], 0, 0, width, height);

    // グリッド画像を描画
    drawGridImages();

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

    if (cleared == 0 & checkCompletion()) {
        window.showCaseMessage('正解！');
        cleared = 1;
        tweetMess = make_tweet(0);
        showResultButtons(tweetMess);
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
