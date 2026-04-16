let nazoid = 2;
let imageNum = 43; // 画像の枚数
let images = [];
let showidx = [];
let grid = 5;
let cellWidth, cellHeight;
let startX, startY;

let clicked = [];
let cleared = 0;
let RC = [0, 0, 0, 0, 0];

let sumiCount = 0;
let questionalIndex = -100;

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = [];
let words = ["かじゅう", "いじゅう", "ひじゅう", "おじゅう", "じじゅう"];

let remainingAttempts = 3;



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

    for (let i = 0; i < 5; i++){
        answers.push(words.at(i));
    }
}

function calcNewImage(index) {
    if (index%5==3){
        return 41;

    }

    if (index%5==4){
        let row = floor(index / grid);
        word = words.at(row);
        if (answers.length == 1 && answers.includes(word)){
            return 42;
        }
        if (answers.includes(word)){
            answers = answers.filter(e => e !== word);
        }
        return 36 + row;
    }else{
        let row = floor(index / grid);
        word = words.at(row);
        RC[row]++;

        if (answers.length == 1 && answers.includes(word) && RC[row]==3){
            return 31+row;
        }else{
            if (RC[row] == 3){
                answers = answers.filter(e => e !== word);
            }
            return 26+row;
        }
    }
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

    
    
    tweetText += `#NaguruzoMondo\n`;
    tweetText += location.href;

    console.log(tweetText);
    return tweetText;
}


function tweet(tweet) {
    // XでツイートするためのURLを生成
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    // 新しいウィンドウで開く
    window.open(tweetUrl, '_blank');
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
    // 背景と画像を再描画して影を消す
    background(255);
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (index < images.length) {
                image(images[showidx[index]], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }
    }
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
    // タッチ終了位置が開始位置とほぼ同じ場合のみ動作
    if (cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);
        
        if (clicked[row*grid+col]==0 && col >= 0 && col < grid && row >= 0 && row < grid) {
            let index = row * grid + col;
            console.log(`マス (${col}, ${row}) がタッチされました。画像インデックス: ${index}`);
            // ここにマスがタッチされたときの動作を追加
            
            clicked[index] = true;
        
            newpic = calcNewImage(index);
            console.log(newpic);
            showidx[index] = newpic; // 画像を変更
        }
    }


    // 背景と画像を再描画して影を消す
    background(255);
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (index < images.length) {
                image(images[showidx[index]], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
        }
    }
}

// Add event listener for the quiz answer submission
const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value;
        if (answers.length == 1 && answers.includes(answerInput)){
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
            if (answers.includes(answerInput)){
                answers = answers.filter(e => e !== answerInput);
            }
            
            remainingAttempts--;
            document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;

            alert(`ちがいます`);
        }
    });
}

