let nazoid = 8;
let imageNum = 28; // 画像の枚数
let backgroundidx = 27; // 背景画像のインデックス
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

let answers = ["おせわ"];

let remainingAttempts = 3;

let animation = [];
let ANIM_CNT = 600;

let pressedCell = null; // 追加

    
function preload() {
    for (let i = 0; i < imageNum; i++) {
        images.push(loadImage(`images/pic(${i}).PNG`));
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
                image(images[showidx[index]], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }
    }

    // アニメーションの初期化
    for (let i = 0; i < grid*grid; i++){
        animation.push(0);
    }

}

function draw() {
    drawArea();
    for (let i = 0; i < grid*grid; i++){
        if (animation[i] > 0){
            if (i < 10){
                animation[i] -= 120;
            }else if (i < 15){
                animation[i] -= 40;
            }else{
                animation[i] -= 1;
            }
        }
    }
}

function calcNewImage(index) {
    return 0;
}

function make_tweet() {
    score = grid*grid;
    for (let i = 0; i < grid*grid; i++){
        if (clicked[i] == 1){
            score--;
        }
    }

    attempt = 3 - remainingAttempts + 1;
    
    tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid*grid} (${attempt}回目)\n`;
    for (let i = 0; i < grid; i++) {
        ret = "";
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (clicked[index] == 1){
                ret += "⬜";
            }else{
                ret += "🟨";
            }
        }

        tweetText += ret + "\n";
    }

    let palam = "?ac=";
    for (let i = 0; i < actionLog.length; i++){
        if (actionLog[i] == -1){
            palam += "z";
        }else{
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


function draw_sizechanged_panel(idx, level){
    if (level == 0){
        return; // 0番目のマスは何もしない
    }
    sx = idx % grid;
    sy = floor(idx / grid);

    let b = ANIM_CNT;
    let size = cellWidth * level / b;
    image(images[idx + 1], sx * cellWidth + (cellWidth - size) / 2, sy * cellHeight + (cellHeight - size) / 2, size, size);
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
            
            if (1<= showidx[index] && showidx[index] <= grid*grid){
                blendMode(BLEND);
            }else{
                blendMode(MULTIPLY);
            }
            if (index < images.length) {
                image(images[showidx[index]], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }

            blendMode(BLEND);
            draw_sizechanged_panel(index, animation[index]);
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
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            if (clicked[i*grid+j] == 0){
                clicked[i*grid+j] = 1;
                let index = i * grid + j;
                showidx[index] = calcNewImage(index);
                animation[index] = ANIM_CNT;
            }
        }
    }
    drawArea();
}

function mousePressed() {
    startX = mouseX;
    startY = mouseY;

    let col = floor(mouseX / cellWidth);
    let row = floor(mouseY / cellHeight);
    if(clicked[row * grid + col] === true){
        pressedCell = null;
        return;
    }

    if (col >= 0 && col < grid && row >= 0 && row < grid) {
        pressedCell = {col, row}; // ここで記録
    }
}

function mouseReleased() {
    // タッチ終了時に影を消す
    pressedCell = null;

    // タッチ終了位置が開始位置とほぼ同じ場合のみ動作
    if (cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);
        
        if (clicked[row*grid+col]==0 && col >= 0 && col < grid && row >= 0 && row < grid) {
            let index = row * grid + col;
            console.log(`マス (${col}, ${row}) がタッチされました。画像インデックス: ${index}`);
            actionLog.push(index);
            // ここにマスがタッチされたときの動作を追加
            
            clicked[index] = true;
        
            newpic = calcNewImage(index);
            console.log(newpic);
            showidx[index] = newpic; // 画像を変更
            animation[index] = ANIM_CNT;
        }
    }

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

            // クイズコンテナ全体を非表示にする
            const quizContainer = document.querySelector('.quiz-container');
            if (quizContainer) {
                quizContainer.style.display = 'none';
            }

            // 新しいボタンを生成
            const buttonContainer = document.createElement('div');
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
                // ここにカスタムボタンの処理を記述
                allOpen();
                // ボタンを無効化
                customButton.disabled = true;
                customButton.style.backgroundColor = '#6c757d'; // グレーに変更
                customButton.style.cursor = 'not-allowed'; // カーソルを変更
            });

            // ボタンをボタンコンテナに追加
            buttonContainer.appendChild(shareButton);
            buttonContainer.appendChild(customButton);

            // ボタンコンテナをクイズコンテナの位置に追加
            const container = document.getElementById('canvas-container');
            container.appendChild(buttonContainer);
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
