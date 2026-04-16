let nazoid = 32;
let imageNum = 51; // 画像の枚数
let backgroundIndex = 0; // 背景画像のインデックス
let images = [];
let grid = 5;
let cellWidth, cellHeight;
let startX, startY;

let clicked = []; // パネル(上)が開いているか（タイルに紐づく: clicked[tile]）
let cleared = 0;
let revealed = 0;

let actionLog = [];

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = ["ロウガイ","ろうがい"];
let hintMessage = "ちがいます。ヒント：スライドパズルの穴は「左上」になります。";

let remainingAttempts = 3;

let revealedQuestions = 0;

// --- スライドパズル（下の盤面） ---
// タイル値: 1..25（空欄も含む）
// 対応画像: tile=1(空欄) -> pic(26), tile=2..25 -> pic(27)..pic(50)
const TILE_IMAGE_BASE = 26;
const BLANK_TILE = 1;
let board = []; // length = 25
let anim = null;



function preload() {
    for (let i = 0; i < imageNum; i++) {
        images.push(loadImage(i >= 1 && i <= 25 ? `../images/pic(${i + 25}).PNG` : `images/pic(${i}).PNG`));
    }

    // clicked[tile]（tileは1..25）。0番は未使用。
    clicked = new Array(grid * grid + 1).fill(false);

    board = createSolvedBoard();
    board = shuffleBoardByBlankMoves(board, 250);
}

function setup() {
    startwidth = min(window.innerWidth, window.innerHeight, 800);
    const canvas = createCanvas(startwidth, startwidth);
    canvas.parent('canvas');
    background(255);
    noLoop();

    cellWidth = width / grid;
    cellHeight = height / grid;

    redraw();
}

function createSolvedBoard() {
    // 完成形: 左上が空欄(tile=1)、以降を 2..25 で埋める（hintに合わせる）
    const arr = [BLANK_TILE];
    for (let tile = 2; tile <= grid * grid; tile++) {
        arr.push(tile);
    }
    return arr;
}

function isPositionOpen(posIndex) {
    const tile = board[posIndex];
    return !!clicked[tile];
}

function posToXY(posIndex) {
    const col = posIndex % grid;
    const row = Math.floor(posIndex / grid);
    return { x: col * cellWidth, y: row * cellHeight };
}

function tileToImageIndex(tile) {
    // tile=1 -> pic(26), tile=2..25 -> pic(27)..pic(50)
    return TILE_IMAGE_BASE + (tile - 1);
}

function buildTilePosMap(boardArr) {
    const map = new Array(grid * grid + 1);
    for (let i = 0; i < boardArr.length; i++) {
        map[boardArr[i]] = i;
    }
    return map;
}

function getBlankIndex(boardArr) {
    return boardArr.indexOf(BLANK_TILE);
}

function getAdjacentIndices(index) {
    const col = index % grid;
    const row = Math.floor(index / grid);
    const out = [];
    if (row > 0) out.push(index - grid);
    if (row < grid - 1) out.push(index + grid);
    if (col > 0) out.push(index - 1);
    if (col < grid - 1) out.push(index + 1);
    return out;
}

function shuffleBoardByBlankMoves(startBoard, steps) {
    // 完成形から空きマスをランダムに動かす（常に解ける＝偶置換を満たす）
    let b = [...startBoard];
    let prevBlank = -1;
    for (let i = 0; i < steps; i++) {
        const blank = getBlankIndex(b);
        const neighbors = getAdjacentIndices(blank).filter(n => n !== prevBlank);
        const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
        prevBlank = blank;
        // blank と pick をスワップ
        const tmp = b[blank];
        b[blank] = b[pick];
        b[pick] = tmp;
    }
    // たまたま完成形に戻った時は少し追加で崩す
    if (isBoardSolved(b)) {
        return shuffleBoardByBlankMoves(b, Math.floor(steps / 2) + 10);
    }
    return b;
}

function isBoardSolved(boardArr) {
    for (let i = 0; i < grid * grid - 1; i++) {
        if (boardArr[i] !== i + 1) return false;
    }
    return boardArr[grid * grid - 1] === BLANK_TILE;
}

function startBoardAnimation(fromBoard, toBoard, durationMs = 180) {
    anim = {
        startMs: millis(),
        durationMs,
        fromBoard: [...fromBoard],
        toBoard: [...toBoard],
        fromPos: buildTilePosMap(fromBoard),
        toPos: buildTilePosMap(toBoard),
    };
    loop();
}

function trySlideAt(index) {
    const blankIndex = getBlankIndex(board);
    if (blankIndex === -1) return false;

    const srcRow = Math.floor(index / grid);
    const srcCol = index % grid;
    const blankRow = Math.floor(blankIndex / grid);
    const blankCol = blankIndex % grid;

    if (srcRow !== blankRow && srcCol !== blankCol) return false;
    if (index === blankIndex) return false;

    const newBoard = [...board];

    if (srcRow === blankRow) {
        // 同じ行: index 〜 blankIndex の間をシフト
        if (blankCol > srcCol) {
            for (let c = blankCol; c > srcCol; c--) {
                newBoard[srcRow * grid + c] = newBoard[srcRow * grid + (c - 1)];
            }
            newBoard[srcRow * grid + srcCol] = BLANK_TILE;
        } else {
            for (let c = blankCol; c < srcCol; c++) {
                newBoard[srcRow * grid + c] = newBoard[srcRow * grid + (c + 1)];
            }
            newBoard[srcRow * grid + srcCol] = BLANK_TILE;
        }
    } else {
        // 同じ列
        if (blankRow > srcRow) {
            for (let r = blankRow; r > srcRow; r--) {
                newBoard[r * grid + srcCol] = newBoard[(r - 1) * grid + srcCol];
            }
            newBoard[srcRow * grid + srcCol] = BLANK_TILE;
        } else {
            for (let r = blankRow; r < srcRow; r++) {
                newBoard[r * grid + srcCol] = newBoard[(r + 1) * grid + srcCol];
            }
            newBoard[srcRow * grid + srcCol] = BLANK_TILE;
        }
    }

    startBoardAnimation(board, newBoard, 200);
    board = newBoard;
    return true;
}

function make_tweet(res = 0) {
    const totalPanels = grid * grid; // 空欄もパネル1として扱う
    let openedPanels = 0;
    for (let tile = 1; tile <= grid * grid; tile++) {
        if (clicked[tile]) openedPanels++;
    }
    score = totalPanels - openedPanels;

    attempt = 3 - remainingAttempts + 1;

    if (res == 0) {
        tweetText = `CASE${nazoid}\n\nScore: ${score}/${totalPanels} (${attempt}回目)\n`;
    }
    for (let i = 0; i < grid; i++) {
        ret = "";
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (isPositionOpen(index)) {
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

function draw() {
    // p5の描画ループ: noLoop時は redraw()/loop() で呼ばれる
    let progress = 1;
    if (anim) {
        progress = constrain((millis() - anim.startMs) / anim.durationMs, 0, 1);
    }

    // 背景
    background(255);
    image(images[backgroundIndex], 0, 0, width, height);

    // 穴（床）を全マスに固定で描く：これ自体は動かない
    const holeImageIndex = TILE_IMAGE_BASE; // pic(26)
    for (let pos = 0; pos < grid * grid; pos++) {
        const xy = posToXY(pos);
        if (holeImageIndex >= 0 && holeImageIndex < images.length) {
            image(images[holeImageIndex], xy.x, xy.y, cellWidth, cellHeight);
        } else {
            noStroke();
            fill(230);
            rect(xy.x, xy.y, cellWidth, cellHeight);
        }
    }

    // 下のスライドピース（穴の上を動く。空欄(tile=1)は描かない）
    const fromPos = anim ? anim.fromPos : buildTilePosMap(board);
    const toPos = anim ? anim.toPos : fromPos;

    for (let tile = 1; tile <= grid * grid; tile++) {
        if (tile === BLANK_TILE) continue;
        const fromIndex = fromPos[tile];
        const toIndex = toPos[tile];
        if (fromIndex === undefined || toIndex === undefined) continue;

        const fromXY = posToXY(fromIndex);
        const toXY = posToXY(toIndex);
        const x = lerp(fromXY.x, toXY.x, progress);
        const y = lerp(fromXY.y, toXY.y, progress);
        const imgIndex = tileToImageIndex(tile);
        if (imgIndex >= 0 && imgIndex < images.length) {
            image(images[imgIndex], x, y, cellWidth, cellHeight);
        }
    }

    // 上の数字パネル（タイルに紐づいてピースと同期して動く）
    for (let tile = 1; tile <= grid * grid; tile++) {
        if (clicked[tile]) continue;
        const fromIndex = fromPos[tile];
        const toIndex = toPos[tile];
        if (fromIndex === undefined || toIndex === undefined) continue;

        const fromXY = posToXY(fromIndex);
        const toXY = posToXY(toIndex);
        const x = lerp(fromXY.x, toXY.x, progress);
        const y = lerp(fromXY.y, toXY.y, progress);

        const panelImageIndex = tile; // pic(1)..pic(25)
        if (panelImageIndex >= 0 && panelImageIndex < images.length) {
            image(images[panelImageIndex], x, y, cellWidth, cellHeight);
        }
    }

    if (anim && progress >= 1) {
        anim = null;
        noLoop();
    }
}

function allOpen() {
    for (let tile = 1; tile <= grid * grid; tile++) {
        clicked[tile] = true;
    }
    revealed = grid * grid;
    redraw();
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
    if (col < 0 || col >= grid || row < 0 || row >= grid) {
        return;
    }

    const posIndex = row * grid + col;
    const tile = board[posIndex];
    if (clicked[tile] === true) {
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
    if (anim) {
        return;
    }
    if (cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);

        if (col < 0 || col >= grid || row < 0 || row >= grid) {
            return;
        }

        let index = row * grid + col;

        const tile = board[index];

        // まだパネルが閉じているなら「開ける」（タイル単位）
        // かつ、その位置が動かせる状況なら初回でもそのままスライドさせる
        if (!clicked[tile]) {
            actionLog.push(index);
            clicked[tile] = true;
            revealed++;

            const movedOnFirstOpen = trySlideAt(index);
            if (!movedOnFirstOpen) {
                redraw();
            }
            return;
        }

        // 開いているなら、空きマスが同列/同行にあるときスライド
        const moved = trySlideAt(index);
        if (moved) {
            actionLog.push(index);
        } else {
            redraw();
        }
    }

    redraw();
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
            
            if (revealed >= grid * grid){
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
