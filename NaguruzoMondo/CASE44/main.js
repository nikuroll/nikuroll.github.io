let nazoid = 44;
let imageNum = 34; // 画像の枚数
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

let answers = ["swing", "Swing", "SWING"];
let hintMessage = "ちがいます。あなたは中央の3*3において〇✕ゲームを行い、見事勝利しました。つまりwinってことです。";

let remainingAttempts = 3;

let revealedQuestions = 0;

const marubatsuCells = [6, 7, 8, 11, 12, 13, 16, 17, 18];
const marubatsuEmpty = 0;
const marubatsuMaru = 1;
const marubatsuBatsu = 2;
let marubatsuReservations = Array(9).fill(marubatsuEmpty);
let marubatsuWaiting = false;
let marubatsuWaitTimer = null;
let marubatsuWaitRequested = false;

// CASE44
function marubatsu(idx, reservations){
    // 0~8のマスのどれかが与えられる。これは〇✕ゲームの丸側
    // これに対し、✕側は必ず負けたい
    // 負けるマスを返す
    if (!Number.isInteger(idx) || idx < 0 || idx > 8) {
        return -1;
    }

    const board = createMarubatsuBoard(idx, reservations);
    if (!board) {
        return -1;
    }

    return findLosingBatsuMove(board);
}

function createMarubatsuBoard(idx, reservations) {
    const board = Array(9).fill("");
    if (Array.isArray(reservations)) {
        for (let i = 0; i < Math.min(reservations.length, 9); i++) {
            if (reservations[i] === marubatsuMaru || reservations[i] === "o") {
                board[i] = "o";
            } else if (reservations[i] === marubatsuBatsu || reservations[i] === "x") {
                board[i] = "x";
            }
        }
    }

    if (Number.isInteger(idx) && idx >= 0 && idx <= 8) {
        if (board[idx] && board[idx] !== "o") {
            return null;
        }
        board[idx] = "o";
    }
    return board;
}

function marubatsuWinnerOf(nowBoard) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (nowBoard[a] && nowBoard[a] === nowBoard[b] && nowBoard[b] === nowBoard[c]) {
            return nowBoard[a];
        }
    }
    return "";
}

function openMarubatsuCells(nowBoard) {
    const cells = [];
    for (let i = 0; i < nowBoard.length; i++) {
        if (!nowBoard[i]) {
            cells.push(i);
        }
    }
    return cells;
}

function isBetterForMaru(candidate, best) {
    if (!best) {
        return true;
    }
    if (candidate.score !== best.score) {
        return candidate.score > best.score;
    }
    if (candidate.score === 1) {
        return candidate.depth < best.depth;
    }
    return candidate.depth > best.depth;
}

function searchMarubatsu(nowBoard, turn, depth) {
    const winner = marubatsuWinnerOf(nowBoard);
    if (winner === "o") {
        return { score: 1, depth };
    }
    if (winner === "x") {
        return { score: -1, depth };
    }

    const cells = openMarubatsuCells(nowBoard);
    if (cells.length === 0) {
        return { score: 0, depth };
    }

    let best = null;
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        nowBoard[cell] = turn;
        const result = searchMarubatsu(nowBoard, turn === "o" ? "x" : "o", depth + 1);
        nowBoard[cell] = "";

        if (isBetterForMaru(result, best)) {
            best = result;
        }
    }
    return best;
}

function findLosingBatsuMove(board) {
    let losingMove = -1;
    let best = null;
    const cells = openMarubatsuCells(board);
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        board[cell] = "x";
        const result = searchMarubatsu(board, "o", 1);
        board[cell] = "";

        if (isBetterForMaru(result, best)) {
            best = result;
            losingMove = cell;
        }
    }
    return losingMove;
}

function isMarubatsuMaruWin() {
    const board = createMarubatsuBoard(-1, marubatsuReservations);
    return board && marubatsuWinnerOf(board) === "o";
}

function marubatsuImageFor(mark) {
    const maruWin = isMarubatsuMaruWin();
    if (mark === marubatsuMaru) {
        return maruWin ? 30 : 28;
    }
    if (mark === marubatsuBatsu) {
        return maruWin ? 31 : 29;
    }
    return maruWin ? 33 : 0;
}

function refreshClickedMarubatsuImages() {
    if (!isMarubatsuMaruWin()) {
        return;
    }

    for (let i = 0; i < marubatsuCells.length; i++) {
        const index = marubatsuCells[i];
        if (clicked[index] == 1) {
            showidx[index] = marubatsuImageFor(marubatsuReservations[i]);
        }
    }
}

function drawMarubatsuWaitOverlay() {
    push();
    blendMode(BLEND);
    noStroke();
    fill(0, 0, 0, 170);
    rect(0, 0, width, height);
    fill(255);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(Math.max(28, Math.min(width, height) * 0.075));
    text("please wait", width / 2, height / 2);
    textStyle(NORMAL);
    pop();
}

function startMarubatsuWaitOverlay() {
    if (marubatsuWaitTimer !== null) {
        clearTimeout(marubatsuWaitTimer);
    }

    marubatsuWaiting = true;
    drawMarubatsuWaitOverlay();
    marubatsuWaitTimer = setTimeout(() => {
        marubatsuWaiting = false;
        marubatsuWaitTimer = null;
        drawArea();
    }, 500);
}

function preload() {
    for (let i = 0; i < imageNum; i++) {
        const imagePath = i <= 25 ? `../images/pic(${i === 0 ? 0 : i + 25}).PNG` : `images/pic(${i}).PNG`;
        images.push(loadImage(imagePath));
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

function calcNewImage(index) {
    // 6.7.8 11.12.13 16.17.18 なら中央　0~8の○×indexに直し、○×する
    // まだ指定されていないならそこを〇に予約し、それに対する✕の位置を予約する
    // マルの予約なら 28 を返す
    // バツで予約済みのマスなら 29 を返す
    // ただし、〇が3つ揃っているならそれぞれ30,31を返す
    // 勝敗確定後の空きマスは予約せず33を返す
    // それ以外は 0を返す
    if (index === 14) {
        return 27;
    }
    if (index === 20) {
        return 32;
    }

    const marubatsuIndex = marubatsuCells.indexOf(index);
    if (marubatsuIndex === -1) {
        return 0;
    }

    if (isMarubatsuMaruWin()) {
        return marubatsuImageFor(marubatsuReservations[marubatsuIndex]);
    }

    if (marubatsuReservations[marubatsuIndex] === marubatsuEmpty) {
        marubatsuReservations[marubatsuIndex] = marubatsuMaru;
        if (!isMarubatsuMaruWin()) {
            marubatsuWaitRequested = true;
            const batsuIndex = marubatsu(marubatsuIndex, marubatsuReservations);
            if (batsuIndex !== -1 && marubatsuReservations[batsuIndex] === marubatsuEmpty) {
                marubatsuReservations[batsuIndex] = marubatsuBatsu;
            }
        }
    }

    refreshClickedMarubatsuImages();
    return marubatsuImageFor(marubatsuReservations[marubatsuIndex]);
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

function drawSpecial() {
}

function drawArea() {
    // 背景と画像を再描画して影を消す
    background(255);

    image(images[backgroundIndex], 0, 0, width, height);
    
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (1<= showidx[index] && showidx[index] <= grid*grid){
                blendMode(BLEND);
            }else{
                blendMode(MULTIPLY);
            }
   
            if (showidx[index] < images.length && showidx[index] > 0) {
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
    if (marubatsuWaiting) {
        return false;
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
        fill(0, 0, 0, 100); // 半透明の黒
        noStroke();
        rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    if (marubatsuWaiting) {
        return false;
    }

    let waitAfterDraw = false;
    if (cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);

        if (clicked[row * grid + col] == 0 && col >= 0 && col < grid && row >= 0 && row < grid) {
            let index = row * grid + col;
            actionLog.push(index);
            clicked[index] = true;
            marubatsuWaitRequested = false;
            newpic = calcNewImage(index);
            waitAfterDraw = marubatsuWaitRequested;
            marubatsuWaitRequested = false;
            showidx[index] = newpic;
            drawArea();
            revealed++;
        }
    }
    
    drawArea();
    if (waitAfterDraw) {
        startMarubatsuWaitOverlay();
    }
}

// Add event listener for the quiz answer submission
const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value.trim().toLowerCase();
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
            
            if (revealed == 25){
                alert(hintMessage);
            }else{
                alert(`ちがいます`);
            }

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
