let nazoid = 35;
let imageNum = 40; // 画像の枚数
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

let answers = ["skateboarding"];
let hintMessage = "ちがいます。ヒントは「スケートボーディング」です。";

let remainingAttempts = 3;

let revealedQuestions = 0;

// CASE35
var cand = [];
let jun = [6,7,8,9,4,3,2,1,0,5,10,11,12,13,14,19,24,23,18,17,22,21,16,15,20];
function dfs(start, choose) {
  if (choose === 0) {
    combos.push(buf.slice());
    return;
  }
  for (let i = start; i <= 23 - choose; i++) {
    buf[i]=choose;
    dfs(i + 1, choose - 1);
    buf[i]=0;
  }
}

function makeCombinations(n, r) {
  combos = [];
  buf = Array(n).fill(0);
  dfs(0, r);
  return combos;
}

function preload() {
    for (let i = 0; i < imageNum; i++) {
        images.push(loadImage(i >= 1 && i <= 25 ? `../images/pic(${i + 25}).PNG` : `images/pic(${i}).PNG`));
    }

    for (let i = 1; i <= grid * grid; i++) {
        clicked.push(0);
        showidx.push(i);
    }

    cand = makeCombinations(23, 11);
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

    console.log(cand[0]);
  
}

function calcNewImage(index) {
    if (index==jun[0]){
        return 27;
    }
    if (index==jun[24]){
        return 39;
    }

    // daihyo = cand[12345];
    mazeindex = jun.indexOf(index) - 1;

    // daihyoを決める
    // candからmazeindex番目の項目の値を参照し、[1,2,4,9]->[0]->[それ以外]の優先度をつける
    // もっとも優先が高いもののみをfilterで抽出し、その中からランダムに1つ選ぶ

    // mazeindex番目のみを集める
    let sec = Array(25).fill(0);
    for (let i = 0; i < cand.length; i++) {
        sec[cand[i][mazeindex]]++;
    }

    secmax = 0;
    if (sec[1]+sec[2]+sec[4]+sec[9]>0){
        lis = [sec[1],sec[2],sec[4],sec[9]];
        secmax = [1,2,4,9][lis.indexOf(max(lis))];
        cand = cand.filter(arr => (arr[mazeindex] == secmax));
    }else if (sec[0]>0){
        cand = cand.filter(arr => arr[mazeindex] == 0);
        secmax=0;
    }else{
        secmax = sec.indexOf(max(sec));
        cand = cand.filter(arr => (arr[mazeindex] == secmax));
    }

    
    let daihyo = cand[floor(random(cand.length))];
    cand = cand.filter(arr => arr[mazeindex] == daihyo[mazeindex]);
    

    cc = daihyo[mazeindex];
    if (cc==0)return 0;
    return 39-cc;
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
