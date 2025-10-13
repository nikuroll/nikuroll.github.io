let nazoid = 25;
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

let answers = ["かいたい","解体"];

let remainingAttempts = 3;

let revealedQuestions = 0;

// 解体イベント用変数
let isDestructionEvent = false;
let destructionProgress = 0;
let shakeIntensity = 0;
let canvasClipX = 0;
let canvasClipY = 0;
let canvasClipWidth = 0;
let canvasClipHeight = 0;
let canInteract = false; // パネル操作可能フラグ

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
    
    // loopを有効化（アニメーション用）
    loop();

    cellWidth = width / grid;
    cellHeight = height / grid;

    // 初期設定
    canInteract = false; // 最初は操作不可
    
    // 初期クリッピング領域を設定
    canvasClipX = 0;
    canvasClipY = 0;
    canvasClipWidth = width;
    canvasClipHeight = height;

    // 初期画像描画
    drawArea();
    
    // // ページ読み込み直後に解体イベントを開始
    // setTimeout(() => {
    //     startDestructionEvent();
    // }, 1000); // 1秒後に開始
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
    // 背景と画像を再描画して影を消す
    background(255);

    image(images[backgroundIndex], 0, 0, width, height);

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

        if (clicked[row * grid + col] == 0 && col >= 0 && col < grid && row >= 0 && row < grid) {
            let index = row * grid + col;
            actionLog.push(index);
            clicked[index] = true;
            newpic = calcNewImage(index);
            showidx[index] = newpic;
            drawArea();
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
            // alertの代わりに豪華な演出を表示
            showVictoryEffect();

            tweetMess = make_tweet();

            cleared = 1;

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

// 正解時の豪華演出
function showVictoryEffect() {
    // オーバーレイを作成
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(64, 64, 64, 0.9)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.flexDirection = 'column';
    overlay.style.zIndex = '1000';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s ease-in-out';

    // Greatテキストを作成
    const greatText = document.createElement('div');
    greatText.textContent = 'Great!';
    greatText.style.fontSize = '8rem';
    greatText.style.fontWeight = 'bold';
    greatText.style.color = '#ff4444';
    greatText.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.9), 0 0 40px rgba(255, 255, 255, 0.7), 0 0 60px rgba(255, 255, 255, 0.5), 0 0 80px rgba(255, 68, 68, 0.8)';
    greatText.style.transform = 'scale(0) rotate(-180deg)';
    greatText.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
    greatText.style.opacity = '0';
    greatText.style.marginBottom = '50px';

    // 人物画像とセリフのコンテナを作成
    const characterContainer = document.createElement('div');
    characterContainer.style.display = 'flex';
    characterContainer.style.alignItems = 'center';
    characterContainer.style.gap = '30px';
    characterContainer.style.opacity = '0';
    characterContainer.style.transform = 'translateY(50px)';
    characterContainer.style.transition = 'opacity 1s ease-out, transform 1s ease-out';

    // 人物画像を作成
    const characterImage = document.createElement('img');
    // TODO: 人物画像のパスを設定
    characterImage.src = 'images/character.png'; // TODO: 実際の画像パスに変更
    characterImage.style.width = '150px';
    characterImage.style.height = '150px';
    characterImage.style.borderRadius = '50%';
    characterImage.style.border = '4px solid #fff';
    characterImage.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.3)';
    characterImage.style.objectFit = 'cover';

    // セリフバルーンを作成
    const speechBubble = document.createElement('div');
    speechBubble.style.position = 'relative';
    speechBubble.style.background = '#fff';
    speechBubble.style.padding = '20px 25px';
    speechBubble.style.borderRadius = '20px';
    speechBubble.style.maxWidth = '300px';
    speechBubble.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
    speechBubble.style.fontSize = '18px';
    speechBubble.style.color = '#333';
    speechBubble.style.fontWeight = 'bold';
    speechBubble.style.lineHeight = '1.4';
    
    // セリフのテキスト
    const speechText = document.createElement('div');
    // TODO: 実際のセリフに変更。\nで改行できます
    const speechContent = '素晴らしい！\nそれでは解体をはじめましょう。';
    speechText.innerHTML = speechContent.replace(/\n/g, '<br>');
    speechBubble.appendChild(speechText);

    // セリフバルーンの吹き出し部分（三角形）
    const speechTail = document.createElement('div');
    speechTail.style.position = 'absolute';
    speechTail.style.left = '-15px';
    speechTail.style.top = '50%';
    speechTail.style.transform = 'translateY(-50%)';
    speechTail.style.width = '0';
    speechTail.style.height = '0';
    speechTail.style.borderTop = '15px solid transparent';
    speechTail.style.borderBottom = '15px solid transparent';
    speechTail.style.borderRight = '15px solid #fff';
    speechBubble.appendChild(speechTail);

    characterContainer.appendChild(characterImage);
    characterContainer.appendChild(speechBubble);

    overlay.appendChild(greatText);
    overlay.appendChild(characterContainer);
    document.body.appendChild(overlay);

    // アニメーション開始
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 50);

    setTimeout(() => {
        greatText.style.transform = 'scale(1.2) rotate(0deg)';
        greatText.style.opacity = '1';
    }, 100);

    setTimeout(() => {
        greatText.style.transform = 'scale(1) rotate(0deg)';
    }, 800);

    // 人物とセリフのアニメーション
    setTimeout(() => {
        characterContainer.style.opacity = '1';
        characterContainer.style.transform = 'translateY(0)';
    }, 1200);

    // 3秒後に「次の章へ」ボタンを暗転画面上に表示
    setTimeout(() => {
        addNextChapterButton(overlay);
    }, 3000);

    // オーバーレイを保持（暗転を解除しない）
}

// 暗転画面上に「次の章へ」ボタンを追加
function addNextChapterButton(overlay) {
    // ボタンコンテナを作成
    const buttonContainer = document.createElement('div');
    buttonContainer.style.position = 'absolute';
    buttonContainer.style.bottom = '80px';
    buttonContainer.style.left = '50%';
    buttonContainer.style.transform = 'translateX(-50%)';
    buttonContainer.style.opacity = '0';
    buttonContainer.style.transition = 'opacity 0.5s ease-in-out';

    // 進捗パラメータを生成（開けたパネルの情報）
    const progressParam = generateProgressParam();

    // 次の章へボタンを作成
    const nextButton = document.createElement('a');
    nextButton.href = `./stage2.html${progressParam}`; // 進捗パラメータ付きでstage2へ
    nextButton.textContent = '次の章へ';
    nextButton.style.display = 'inline-block';
    nextButton.style.padding = '15px 40px';
    nextButton.style.fontSize = '20px';
    nextButton.style.fontWeight = 'bold';
    nextButton.style.color = '#fff';
    nextButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    nextButton.style.border = 'none';
    nextButton.style.borderRadius = '30px';
    nextButton.style.cursor = 'pointer';
    nextButton.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
    nextButton.style.transition = 'all 0.3s ease';
    nextButton.style.textDecoration = 'none';

    nextButton.addEventListener('mouseenter', () => {
        nextButton.style.transform = 'scale(1.05) translateY(-3px)';
        nextButton.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.4)';
        nextButton.style.background = 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)';
    });
    nextButton.addEventListener('mouseleave', () => {
        nextButton.style.transform = 'scale(1) translateY(0)';
        nextButton.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
        nextButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    });

    buttonContainer.appendChild(nextButton);
    overlay.appendChild(buttonContainer);

    // フェードインで表示
    setTimeout(() => {
        buttonContainer.style.opacity = '1';
    }, 200);
}

// 進捗パラメータを生成する関数
function generateProgressParam() {
    let openedPanels = [];
    
    // 開けたパネル（clicked[i] == 1）のインデックスを収集
    for (let i = 0; i < clicked.length; i++) {
        if (clicked[i] == 1) {
            openedPanels.push(i);
        }
    }
    
    // パラメータとして返す
    if (openedPanels.length > 0) {
        return `?progress=${openedPanels.join(',')}`;
    } else {
        return '';
    }
}