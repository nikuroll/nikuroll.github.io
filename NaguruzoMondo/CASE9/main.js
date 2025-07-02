let nazoid = 9;
let imageNum = 28; // 画像の枚数
let backgroundImage = 0; // 背景画像のインデックス
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

let coin = 0;
let answers = ["からしめんたいこ","辛子明太子"];
function answerCheck(word){
    return answers.includes(word);
}

let remainingAttempts = 3;

let inner = [3,4,6,7,8,9,11,12,13,15,16,17,18,20,21];
let cand = [0,1,2,5,10];



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

function draw() {
    drawArea();
}

function calcNewImage(index) {
    if (inner.includes(index)){
        return 0;
    }
    
    if (cand.length == 1){
        if (index == cand[0]) {
            return 26;
        }else if (index == 24 - cand[0]) {
            return 27;
        }
    }

    if (cand.includes(index)){
        cand.splice(cand.indexOf(index), 1);
    }
    if (cand.includes(24-index)) {
        cand.splice(cand.indexOf(24 - index), 1);
    }

    console.log(inner, cand);

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
    } else {
        tweetText = `CASE${nazoid}\n\nScore: 失格\n`;
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
    // image(images[backgroundImage], 0, 0, width, height);
    drawTetrahedronNatural(width / 2, height / 2, width / 2, frameCount / 200);

    blendMode(ADD);
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (1 <= showidx[index] && showidx[index] <= grid * grid) {
                blendMode(BLEND);
            } else {
                blendMode(MULTIPLY);
            }
            if (index < images.length) {
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
        }
    }
    drawArea();
}

// Add event listener for the quiz answer submission
const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value;
        if (answerCheck(answerInput)) {
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

// 3Dノイズでランダムな回転を与えた正四面体を描画
function drawTetrahedron(cx, cy, size, phase = 0) {
    // 正四面体の4頂点（正規化済み）
    const rawVerts = [
        [1, 1, 1],
        [1, -1, -1],
        [-1, 1, -1],
        [-1, -1, 1]
    ].map(v => {
        let n = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
        return v.map(x => x / n);
    });
    // 3Dノイズで回転軸と角度を決める
    let theta = noise(phase, 0) * Math.PI * 2;
    let phi = noise(0, phase) * Math.PI;
    let axis = [
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi)
    ];
    let angle = noise(phase, phase) * Math.PI * 2;
    // ロドリゲスの回転公式
    function rotate(v, axis, angle) {
        const [x, y, z] = v;
        const [u, v1, w] = axis;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        return [
            (u*u+(1-u*u)*cosA)*x + (u*v1*(1-cosA)-w*sinA)*y + (u*w*(1-cosA)+v1*sinA)*z,
            (u*v1*(1-cosA)+w*sinA)*x + (v1*v1+(1-v1*v1)*cosA)*y + (v1*w*(1-cosA)-u*sinA)*z,
            (u*w*(1-cosA)-v1*sinA)*x + (v1*w*(1-cosA)+u*sinA)*y + (w*w+(1-w*w)*cosA)*z
        ];
    }
    // 回転適用
    let verts = rawVerts.map(v => rotate(v, axis, angle));
    // 2D投影（パース付き）
    let projected = verts.map(([x, y, z]) => {
        const d = 3.5; // 視点距離
        const perspective = d / (d - z);
        return [cx + x * size * perspective, cy + y * size * perspective];
    });
    // 頂点描画
    fill(100, 180, 255);
    stroke(0);
    strokeWeight(2);
    for(const [x, y] of projected){
        ellipse(x, y, 14, 14);
    }
    // 辺を描画
    const edges = [[0,1],[0,2],[0,3],[1,2],[2,3],[3,1]];
    for(const [i,j] of edges){
        const [x1,y1]=projected[i];
        const [x2,y2]=projected[j];
        line(x1,y1,x2,y2);
    }
}

// 3軸独立の連続回転で自然な3D回転を与える正四面体描画
function drawTetrahedronNatural(cx, cy, size, phase = 0) {
    // 正四面体の4頂点（正規化済み）
    const rawVerts = [
        [1, 1, 1],
        [1, -1, -1],
        [-1, 1, -1],
        [-1, -1, 1]
    ].map(v => {
        let n = Math.sqrt(v[0]**2 + v[1]**2 + v[2]**2);
        return v.map(x => x / n);
    });
    // 3軸独立の連続回転
    function rotate3D([x, y, z], t) {
        // X軸
        let rx = t * 0.7;
        let y1 = y * Math.cos(rx) - z * Math.sin(rx);
        let z1 = y * Math.sin(rx) + z * Math.cos(rx);
        let x1 = x;
        // Y軸
        let ry = t * 1.1;
        let z2 = z1 * Math.cos(ry) - x1 * Math.sin(ry);
        let x2 = z1 * Math.sin(ry) + x1 * Math.cos(ry);
        let y2 = y1;
        // Z軸
        let rz = t * 1.5;
        let x3 = x2 * Math.cos(rz) - y2 * Math.sin(rz);
        let y3 = x2 * Math.sin(rz) + y2 * Math.cos(rz);
        let z3 = z2;
        return [x3, y3, z3];
    }
    // 回転適用
    let verts = rawVerts.map(v => rotate3D(v, phase));
    // 2D投影（パース付き）
    let projected = verts.map(([x, y, z]) => {
        const d = 100; // 視点距離
        const perspective = d / (d - z);
        return [cx + x * size * perspective, cy + y * size * perspective];
    });
    // 頂点描画
    fill(100, 180, 255);
    stroke(0);
    strokeWeight(2);
    // for(const [x, y] of projected){
    //     ellipse(x, y, 14, 14);
    // }
    // 辺を描画
    const edges = [[0,1],[0,2],[0,3],[1,2],[2,3],[3,1]];
    for(const [i,j] of edges){
        const [x1,y1]=projected[i];
        const [x2,y2]=projected[j];
        line(x1,y1,x2,y2);
    }
}
