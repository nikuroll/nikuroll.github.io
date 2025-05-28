let nazoid = 6;
let imageNum = 33; // 画像の枚数
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

let answers = ["bee", "Bee", "BEE"];

let remainingAttempts = 3;

let mines = [];



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
    noLoop();

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

function isNeibour(idx1, idx2) {
    let row1 = floor(idx1 / grid);
    let col1 = idx1 % grid;
    let row2 = floor(idx2 / grid);
    let col2 = idx2 % grid;

    // 8方向の隣接チェック
    return (abs(row1 - row2) <= 1 && abs(col1 - col2) <= 1);
}

function getMineCount(index) {
    let count = 0;
    let row = floor(index / grid);
    let col = index % grid;

    // 8方向の隣接セルをチェック
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (i === 0 && j === 0) continue; // 自分自身は除外
            let newRow = row + i;
            let newCol = col + j;
            if (newRow >= 0 && newRow < grid && newCol >= 0 && newCol < grid) {
                let neighborIndex = newRow * grid + newCol;
                if (mines[neighborIndex] === 1) {
                    count++;
                }
            }
        }
    }
    return count;
}


function makeMineBoard(startidx) {
    mines = [];
    for (let i = 0; i < grid * grid; i++) {
        mines.push(0);
    }

    end = 0;
    cnt = 0;
    while (end == 0){
        // ランダムにマスを選んで地雷を5個配置
        for (let i = 0; i < grid * grid; i++) {
            mines[i] = 0;
        }
        cnt = 0;

        while (cnt < 5) {

            let mineIndex = floor(random(grid * grid));
            if (!isNeibour(mineIndex,startidx) && mines[mineIndex] == 0) {
                mines[mineIndex] = 1;
                cnt++;
            }
        }


        check = [1,0,0,0];
        end = 1;
        for (let i = 0; i < grid * grid; i++) {
            res = getMineCount(i);
            if (res >= 4){
                end = 0;
            }else{
                check[res]++;
            }
        }

        for (let i = 0; i < 4; i++) {
            if (check[i] == 0){
                end = 0;
            }
        }

    }
    return mines;
}


function calcNewImage(index) {
    if (mines.length == 0) {
        makeMineBoard(index);
    }

    if (mines[index] == 1) {
        // 地雷がある場合は地雷の画像を返す
        if (cleared == 0){
           return 32; // 地雷の画像インデックス
        }else{
            return 31; // 地雷の画像インデックス（クリア後）
        }
    }

    // 地雷がない場合は周囲の地雷の数に応じた画像を返す
    let mineCount = getMineCount(index);
    return mineCount + 27;
}

function make_tweet(res=0) {
    score = grid*grid;
    for (let i = 0; i < grid*grid; i++){
        if (clicked[i] == 1){
            score--;
        }
    }

    attempt = 3 - remainingAttempts + 1;

    if (res == 0){
        tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid*grid} (${attempt}回目)\n`;
    } else{
        tweetText = `CASE${nazoid}\n\nScore: 失格\n`;
    }
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
    tweetText += location.href + palam;

    console.log(tweetText);
    return tweetText;
}


function tweet(tweet) {
    // XでツイートするためのURLを生成
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    // 新しいウィンドウで開く
    window.open(tweetUrl, '_blank');
}

function drawArea(){
    // 背景と画像を再描画して影を消す
    background(255);
    
    image(images[26], 0, 0, width, height);

    blendMode(ADD);
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (1<= showidx[index] && showidx[index] <= grid*grid){
                blendMode(BLEND);
            }else{
                blendMode(MULTIPLY);
            }
            if (index < images.length) {
                image(images[showidx[index]], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }
    }
    blendMode(BLEND);
}

function allOpen(){
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            if (clicked[i*grid+j] == 0){
                clicked[i*grid+j] = 1;
                let index = i * grid + j;
                showidx[index] = calcNewImage(index);
            }
        }
    }
    drawArea();
}

function mousePressed() {
    // タッチ開始位置を記録
    startX = mouseX;
    startY = mouseY;

    // タッチ中のマスを影で強調
    let col = floor(mouseX / cellWidth);
    let row = floor(mouseY / cellHeight);
    if(clicked[row * grid + col] === true){
        return;
    }

    if (col >= 0 && col < grid && row >= 0 && row < grid) {
        fill(0, 0, 0, 100); // 半透明の黒
        noStroke();
        rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
}

function mouseReleased() {
    if (cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);
        
        if (clicked[row*grid+col]==0 && col >= 0 && col < grid && row >= 0 && row < grid) {
            let index = row * grid + col;
            actionLog.push(index);
            clicked[index] = true;
            newpic = calcNewImage(index);
            showidx[index] = newpic;

            // 地雷を踏んだ場合
            if (newpic === 32) {
                cleared = 1;
                tweetMess = make_tweet(1);
                drawArea(); // 画像を先に更新
                showResultButtons(tweetMess); 
                setTimeout(() => {
                    alert('地雷を踏みました！');
                }, 100); // 100ミリ秒遅延
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
        if (answers.includes(answerInput)){
            alert('正解！');

            tweetMess = make_tweet();

            cleared = 1;

            showResultButtons(tweetMess);
        }else{
            if (answers.includes(answerInput)){
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
