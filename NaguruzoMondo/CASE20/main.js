let nazoid = 20;
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
    // 画質改善
    pixelDensity(2);
    const canvas = createCanvas(startwidth, startwidth);
    canvas.parent('canvas');
    background(255);

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

    drawArea();
  
}

function draw() {
    drawArea();
}

function calcNewImage(index) {
    if (index >=18){
        checkCounter[2]++;
        return 43+checkCounter[2];
    }
    if (index % 2 == 0) {
        checkCounter[0]++;
        return 25 + checkCounter[0];
    } else {
        checkCounter[1]++;
        return 34 + checkCounter[1];
    }
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
    
    // 影の描画
    if (shadowCell.active) {
        fill(0, 0, 0, 100); // 半透明の黒
        noStroke();
        rect(shadowCell.col * cellWidth, shadowCell.row * cellHeight, cellWidth, cellHeight);
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
    // タッチ開始位置を記録
    startX = mouseX;
    startY = mouseY;

    // タッチ中のマスを影で強調
    let col = floor(mouseX / cellWidth);
    let row = floor(mouseY / cellHeight);
    if (clicked[row * grid + col] === true) {
        return;
    }

    if (col >= 0 && col < grid && row >= 0 && row < grid) {
        shadowCell.row = row;
        shadowCell.col = col;
        shadowCell.active = true;
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    
    // 影を非表示にする
    shadowCell.active = false;
    
    if (cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);

        if (clicked[row * grid + col] == 0 && col >= 0 && col < grid && row >= 0 && row < grid) {
            let index = row * grid + col;
            actionLog.push(index);
            clicked[index] = true;
            newpic = calcNewImage(index);
            showidx[index] = newpic;
            revealed++;

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
