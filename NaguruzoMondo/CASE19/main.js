let nazoid = 19;
let imageNum = 31; // 画像の枚数
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

let shadowCell = { row: -1, col: -1, active: false }; // 影の状態管理

// 金魚のアニメーション用の変数
let fishPositions = []; // 複数の金魚の位置を管理
const FISH_COUNT = 3; // 表示する金魚の数
let FISH_SPEED_MIN; // 最小速度（setup内で設定）
let FISH_SPEED_MAX; // 最大速度（setup内で設定）
let FISH_SIZE_MIN; // 最小サイズ（setup内で設定）
let FISH_SIZE_MAX; // 最大サイズ（setup内で設定）

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = [""];

let remainingAttempts = 3;

let revealedQuestions = 0;

function preload() {
    for (let i = 0; i < imageNum; i++) {
        images.push(loadImage(`images/pic(${i}).PNG`));
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

    cellWidth = width / grid;
    cellHeight = height / grid;
    
    // ウィンドウサイズに合わせた金魚のパラメータを設定
    // サイズはセルサイズの30%～60%
    FISH_SIZE_MIN = min(cellWidth, cellHeight) * 0.2;
    FISH_SIZE_MAX = min(cellWidth, cellHeight) * 0.5;
    
    // 速度はキャンバス幅の0.5%～1.0%（画面の大きさに合わせた適切な速度）
    FISH_SPEED_MIN = width * 0.01;
    FISH_SPEED_MAX = width * 0.02;

    // 初期画像描画
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (index < images.length) {
                image(images[showidx[index]], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }
    }
    
    // 金魚の初期位置を設定
    initializeFish();

    drawArea();
}

// 金魚の初期化関数
function initializeFish() {
    fishPositions = [];
    for (let i = 0; i < FISH_COUNT; i++) {
        fishPositions.push({
            x: width + random(0, width * 0.2), // 画面右端からwidth*20%までの範囲でランダムに配置
            y: random(height * 0.01, height * 0.99), // 画面内の上下1%を除いた範囲のランダムな高さ
            speed: random(FISH_SPEED_MIN, FISH_SPEED_MAX), // ウィンドウサイズに合わせた速度
            size: random(FISH_SIZE_MIN, FISH_SIZE_MAX), // ウィンドウサイズに合わせたサイズ
            caught: false, // 捕まえられたかどうかのフラグ
            pict: round(random(29, 30)) // 金魚の画像をランダムに選択（29または30）
        });
    }
}

function draw() {
    drawArea();
    
    // 金魚の位置情報をコンソールに出力（デバッグ用、必要に応じて削除可能）
    // console.log(fishPositions[0]);
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
    imageFrame = floor(frameCount % 9 / 3);
    image(images[backgroundIndex], 0, 0, width, height);
    // 金魚のアニメーション処理
    updateAndDrawFish();
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

// 金魚を更新して描画する関数
function updateAndDrawFish() {
    // 金魚の位置を更新して描画
    for (let i = 0; i < fishPositions.length; i++) {
        let fish = fishPositions[i];
        
        // 捕まえられていない金魚のみ移動
        if (!fish.caught) {
            // 金魚を移動
            fish.x -= fish.speed;
            
            // 画面外に出たら右側から再登場
            if (fish.x < -fish.size) {
                fish.x = width + fish.size;
                fish.y = random(height * 0.1, height * 0.9); // 画面の上下10%を除いた範囲でランダムな高さに設定
                fish.speed = random(FISH_SPEED_MIN, FISH_SPEED_MAX); // ウィンドウサイズに合わせた速度に更新
            }
        }
        
        // 捕まえられた金魚は少し輝かせる
        if (fish.caught) {
            // 輝くエフェクト（オプション）
            push();
            noStroke();
            fill(255, 255, 0, 70 + 30 * sin(frameCount * 0.1)); // 明るさが変化する黄色の半透明オーバーレイ
            ellipse(fish.x, fish.y, fish.size * 1.2, fish.size * 1.2);
            pop();
        }
        
        // 金魚を描画（pic(30)の透過画像）
        // 位置をより明確に中心に合わせる
        imageMode(CENTER);
        image(images[fish.pict], fish.x, fish.y, fish.size, fish.size);
        imageMode(CORNER); // 他の描画に影響しないように戻す
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
            
            // クリックを離した位置（マウス座標）を使用する
            const clickX = mouseX;
            const clickY = mouseY;
            
            // ここで金魚との判定
            let fishFound = false;
            let caughtFishIndex = -1;
            
            for (let i = 0; i < fishPositions.length; i++) {
                let fish = fishPositions[i];
                
                // すでに捕まえた金魚はスキップ
                if (fish.caught) continue;
                
                // 金魚とクリック位置の距離を計算
                const distance = dist(fish.x, fish.y, clickX, clickY);
                
                // 距離が金魚サイズの半分より小さければ重なっていると判定
                // 大きさに応じて判定範囲を調整（画面が大きいほど判定も少し緩めに）
                if (distance < fish.size * 0.5) {
                    fishFound = true;
                    caughtFishIndex = i;
                    break;
                }
            }
            
            // 金魚が見つかった場合の判定処理
            if (fishFound) {
                // 見つかった金魚のcaughtフラグを立てる
                fishPositions[caughtFishIndex].caught = true;
                
                // 正解判定
                alert('金魚を見つけた！');

                tweetMess = make_tweet();

                cleared = 1;

                showResultButtons(tweetMess);
            }else if(revealed == grid * grid){
                alert('金魚をすくえなかった...');
                tweetMess = make_tweet();
                cleared = 1;
                showResultButtons(tweetMess);
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

            alert(`意味ないよ`);

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
