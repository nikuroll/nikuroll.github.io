let nazoid = 11;
let imageNum = 3; // 画像の枚数
let backgroundidx = 2; // 背景画像のインデックス
let images = [];
let showidx = [];
let grid = 5;
let cellWidth, cellHeight;
let startX, startY;

let clicked = [];
let cleared = 0;
let revealed = 0;
let before = 0; // タッチ前の画像の数字

let actionLog = [];

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = ["かれんだー"];

let remainingAttempts = 3;

let pressedCell = null; // タッチ中のセルを記録する変数

let forceDecrementMode = false;
let forceDecrementFrame = 0;

let lastClickFrame = -10; // 直近でクリックを受理したフレーム番号
let ichigekipos = [0,1,4,5,6,8,9,10,11,13,14,15,16,17,18,19,21,23];
    
function preload() {
    for (let i = 0; i < imageNum; i++) {
        images.push(loadImage(i <= 25 ? `../images/pic(${i}).PNG` : `images/pic(${i}).PNG`));
    }

    for (let i = 1; i <= grid*grid; i++) {
        clicked.push(0);
        showidx.push(i);
    }
}

function setup() {
    startwidth = min(window.innerWidth, window.innerHeight, 800);
    const canvas = createCanvas(startwidth, startwidth);
    canvas.parent('canvas');
    background(255);
    // noLoop();
    frameRate(30);

    cellWidth = width / grid;
    cellHeight = height / grid;

    // 初期画像描画
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (index < images.length) {
                image(images[1], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }
    }

}

function draw() {
    if (forceDecrementMode) {
        forceDecrementFrame++;
        if (forceDecrementFrame % 5 === 0) {
            let changed = false;
            for (let i = 0; i < grid * grid; i++) {
                if (showidx[i] > 0) {
                    showidx[i] = calcNewImage(i);
                    changed = true;
                }
            }
        }
    }
    drawArea();
}

function calcNewImage(index) {
    // ichigekiposに含まれる場合は一発で0、それ以外は従来通り
    let current = showidx[index];
    let next;
    if (ichigekipos.includes(index)) {
        next = 0;
    } else if (index === 3) {
        if (current > 0.1) {
            next = current - 0.1;
        } else {
            next = current - 0.01;
        }
    } else {
        next = current - 1;
    }
    if (next < 0) next = 0;
    // 小数点以下の誤差対策で丸める
    next = Math.max(0, Math.round(next * 100) / 100);
    return next;
}

function make_tweet(res = 0) {
    // スコアは25から全パネルの耐久値の合計減少分
    let totalDurability = 0;
    for (let i = 0; i < grid * grid; i++) {
        if (ichigekipos.includes(i)) {
            if(showidx[i] < 1e-6) {totalDurability += 1; }
        } else if (i != 3) {
            totalDurability += i + 1 - showidx[i];
        } else {
            clickcount = 0;
            if (showidx[i] < 0.1 + 1e-6){
                clickcount = 30 + (0.1 - showidx[i]) * 100; 
            }else{
                clickcount = (4.0 - showidx[i]) * 10; // パネル4は10倍
            }
            totalDurability += clickcount;
        }
        
    }
    let score = grid * grid - totalDurability;
    let attempt = 3 - remainingAttempts + 1;

    if (res == 0) {
        tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid * grid} (${attempt}回目)\n`;
    } else {
        tweetText = `CASE${nazoid}\n\nScore: 降参\n`;
    }
    for (let i = 0; i < grid; i++) {
        let ret = "";
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (Math.abs(showidx[index]) < 1e-6) {
                ret += "⬜"; // 耐久値0は白
            } else {
                ret += "🟨"; // それ以外は黄色
            }
        }
        tweetText += ret + "\n";
    }
    let palam = "?ac=";
    for (let i = 0; i < actionLog.length; i++) {
        if (actionLog[i] == -1) {
            palam += "z";
        } else {
            palam += String.fromCharCode(actionLog[i] + 97);
        }
    }
    palam = ""; // 今回はパラメータなしでいい
    tweetText += `#NaguruzoMondo\n`;
    tweetText += location.origin + location.pathname + palam;
    console.log(tweetText);
    return tweetText;
}


function tweet(tweetText) {
    // XでツイートするためのURLを生成
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    // 新しいウィンドウで開く
    window.open(tweetUrl, '_blank');
}

function drawArea(){
    // 背景と画像を再描画して影を消す
    background(255);
    image(images[backgroundidx], 0, 0, width, height);
    blendMode(ADD);
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;

            blendMode(BLEND);
            // draw_noise(index, animation[index]);
            // continue;
            
            // パネルの耐久値が0より大きいときだけ通常描画、0以下なら消す（描画しない）
            if (showidx[index] > 0) {
                blendMode(BLEND);
                drawPanelImage(index, showidx[index], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            } else {
                // 耐久値0以下なら何も描画しない（背景のみ）
            }

            blendMode(BLEND);
            // draw_sizechanged_panel(index, animation[index]);
        }
    }
    blendMode(BLEND);

    // ここでタッチ中のマスに影を描画
    if (pressedCell !== null) {
        let {col, row} = pressedCell;
        fill(0, 0, 0, 100); // 半透明の黒
        noStroke();
        rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
}

function allOpen(){
    forceDecrementMode = true;
    forceDecrementFrame = 0;
}

function mousePressed() {
    startX = mouseX;
    startY = mouseY;
    let col = floor(mouseX / cellWidth);
    let row = floor(mouseY / cellHeight);
    let index = row * grid + col;
    if (col >= 0 && col < grid && row >= 0 && row < grid) {
        pressedCell = {col, row}; // ここで記録
    }
}

function mouseReleased() {
    let doAction = false;
    if (frameCount - lastClickFrame >= 1) {
        lastClickFrame = frameCount;
        doAction = true;
    }
    if (pressedCell !== null && cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);
        if (col >= 0 && col < grid && row >= 0 && row < grid && doAction) {
            let index = row * grid + col;
            // パネル3（index==2）が耐久値0のとき失格処理
            if (index === 2 && Math.abs(showidx[index]) < 1e-6) {
                tweetMess = make_tweet(res = 1);
                showResultButtons(tweetMess);
                setTimeout(() => {
                    alert('あなたは降参しました。');
                }, 100);
                cleared = 1;
                pressedCell = null;
                drawArea();
                return;
            }
            let after = calcNewImage(index);
            actionLog.push(index);
            showidx[index] = after;
        }
    }
    pressedCell = null; // ここで必ず解除
    drawArea();
}




// Add event listener for the quiz answer submission
const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value;
        if (answers.includes(answerInput)){
            alert('正解！');

            tweetMess = make_tweet();

            cleared = 1;

            showResultButtons(tweetMess);
        }else{
            // if (answers.includes(answerInput)){
            //     answers = answers.filter(e => e !== answerInput);
            // }
            
            remainingAttempts--;
            document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;

            alert(`ちがいます`);

            actionLog.push(-1);
        }
    });
}

function drawPanelImage(panelIndex, durability, x, y, w, h) {
    // 耐久値0なら画像0、1以上なら画像1を使う
    let imgIdx = (durability === 0) ? 0 : 1;
    if (imgIdx < images.length) {
        image(images[imgIdx], x, y, w, h);
    }
    // パネル番号1~25のときだけ白文字で耐久値を描画
    if (panelIndex >= 0 && panelIndex < 25) {
        push();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(w * 0.2);
        text(durability.toString(), x + w / 2, y + h / 2);
        pop();
    }
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
    // 全部開けるボタン
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
    // ボタンコンテナをクイズコンテナの位置に追加
    const container = document.getElementById('canvas-container');
    container.appendChild(buttonContainer);
}
