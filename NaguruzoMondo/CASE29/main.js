let nazoid = 29;
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

let answers = ["名古屋","なごや","名古屋駅","なごやえき"];
let hintMessage = "ちがいます。画像に移っているのは味噌カツです。ここからある都市名を当てましょう。雑魚のアタック25です。";

const CLEAR_EXTRA_MESSAGE = "今年4月にスタートしたNaguruzoMondoも、皆様のおかげで早いものでCASE29を迎えることができました。毎週楽しみにしてくださった方、SNSでシェアしてくださった方、温かいコメントをくださった方、本当にありがとうございました。これが2025年最後の問題となりますが、来年も引き続き、楽しんでいただけるような問題を作成してまいります。どうぞよろしくお願いいたします。";
const CLEAR_EXTRA_IMAGE_SRC = "images/S__99008516.jpg";

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function setMessageWithBreaks(element, rawText) {
    const text = String(rawText ?? '');
    const parts = text.split(/\r?\n|<br\s*\/?>/i);
    element.innerHTML = parts.map(escapeHtml).join('<br>');
}

let remainingAttempts = 3;

let revealedQuestions = 0;

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

function drawSpecial() {
}

function calcLines(){
    let bingos = 0;
    let reachs = 0;
    // 横列のチェック
    for (let i = 0; i < grid; i++) {
        let count = 0;
        for (let j = 0; j < grid; j++) {
            if (clicked[i * grid + j] == 1) {
                count++;
            }
        }
        if (count == grid) {
            bingos++;
        } else if (count == grid - 1) {
            reachs++;
        }
    }

    // 縦列のチェック
    for (let j = 0; j < grid; j++) {
        let count = 0;
        for (let i = 0; i < grid; i++) {
            if (clicked[i * grid + j] == 1) {
                count++;
            }
        }
        if (count == grid) {
            bingos++;
        } else if (count == grid - 1) {
            reachs++;
        }
    }

    // 斜め列のチェック
    let count1 = 0;
    let count2 = 0;
    for (let i = 0; i < grid; i++) {
        if (clicked[i * grid + i] == 1) {
            count1++;
        }
        if (clicked[i * grid + (grid - 1 - i)] == 1) {
            count2++;
        }
    }
    if (count1 == grid) {
        bingos++;
    } else if (count1 == grid - 1) {
        reachs++;
    }
    if (count2 == grid) {
        bingos++;
    }
    else if (count2 == grid - 1) {
        reachs++;
    }
}


function drawArea() {
    // 背景と画像を再描画して影を消す
    background(255);

    image(images[backgroundIndex], 0, 0, width, height);
    
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (1 <= showidx[index] && showidx[index] <= grid * grid) {
                blendMode(BLEND);
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
    calcLines();
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
            calcLines();
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

    const container = document.getElementById('canvas-container');
    if (!container) return;

    // 追加のメッセージ＆画像（既存のクリア後UIに自然に追記）
    if (!document.getElementById('result-extra')) {
        const extraContainer = document.createElement('div');
        extraContainer.id = 'result-extra';
        extraContainer.style.display = 'flex';
        extraContainer.style.flexDirection = 'column';
        extraContainer.style.alignItems = 'center';
        extraContainer.style.gap = '12px';
        extraContainer.style.marginTop = '18px';

        const messageEl = document.createElement('div');
        setMessageWithBreaks(messageEl, CLEAR_EXTRA_MESSAGE);
        messageEl.style.maxWidth = 'min(720px, 92vw)';
        messageEl.style.fontSize = '15px';
        messageEl.style.fontWeight = '600';
        messageEl.style.lineHeight = '1.7';
        messageEl.style.textAlign = 'left';
        messageEl.style.overflowWrap = 'anywhere';

        const imgEl = document.createElement('img');
        imgEl.src = CLEAR_EXTRA_IMAGE_SRC;
        imgEl.alt = 'クリア画像';
        imgEl.loading = 'lazy';
        imgEl.style.width = 'min(520px, 90vw)';
        imgEl.style.height = 'auto';
        imgEl.style.borderRadius = '8px';

        extraContainer.appendChild(messageEl);
        extraContainer.appendChild(imgEl);
        container.appendChild(extraContainer);
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

    container.appendChild(buttonContainer);
}
