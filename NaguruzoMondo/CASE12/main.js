let nazoid = 12;
let imageNum = 28; // 画像の枚数
let backgroundImage = 0; // 背景画像のインデックス


// パネルクラスの定義
class Panel {
    constructor(x, y, size, id) {
        this.x = x; // 左上X座標
        this.y = y; // 左上Y座標
        this.size = size; // パネルの一辺の長さ
        this.id = id; // パネルID（画像インデックスなど）
        this.targetY = y; // 目標Y座標（アニメーション用）
        this.isAnimating = false; // アニメーション中かどうか
    }

    // 指定座標(px, py)がこのパネル内かどうか判定
    contains(px, py) {
        return px >= this.x && px < this.x + this.size && py >= this.y && py < this.y + this.size;
    }

    // 対応した画像を描画
    draw(imgArray) {
        if (imgArray && imgArray[this.id]) {
            image(imgArray[this.id], this.x, this.y, this.size, this.size);
        }
    }

    // アニメーション更新
    updateAnimation() {
        if (this.isAnimating) {
            const speed = this.fallSpeed || 6; // 個別速度または固定速度
            if (this.y < this.targetY) {
                this.y += speed;
                if (this.y >= this.targetY) {
                    this.y = this.targetY;
                    this.isAnimating = false;
                }
            }
        }
    }

    // 落下アニメーション開始
    startFalling(newTargetY, animationFrames) {
        this.targetY = newTargetY;
        this.isAnimating = true;
        // 移動距離に応じて速度を調整
        const distance = newTargetY - this.y;
        this.fallSpeed = distance / animationFrames; // 固定フレーム数で移動するための速度
    }
}
let images = [];
let showidx = [];
let panels = [];
let grid = 5;
let totalRows = 10; // 画面上に5行追加（合計10行）
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

let isAnimating = false; // アニメーション中フラグ



let hoveredPanel = -1; // マウスホバー中のパネルインデックス

function preload() {
    for (let i = 0; i < imageNum; i++) {
        images.push(loadImage(`images/pic(${i}).PNG`));
    }

    // 全体のパネル数（画面外含む）を初期化
    for (let i = 0; i < totalRows * grid; i++) {
        clicked.push(0);
        if (i < grid * grid) {
            showidx.push(i + 1); // 画面内のパネルは通常の画像
        } else {
            showidx.push((i % (grid * grid)) + 1); // 画面外のパネルもランダムな画像
        }
    }
}

function setup() {
    startwidth = min(window.innerWidth, window.innerHeight, 800);
    const canvas = createCanvas(startwidth, startwidth);
    canvas.parent('canvas');
    background(255);

    cellWidth = width / grid;
    cellHeight = height / grid;

    // パネル配列を初期化（画面外含む）
    panels = [];
    for (let i = 0; i < totalRows; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            let id = showidx[index];
            // 画面外のパネルは負のY座標に配置
            let panelY = (i - (totalRows - grid)) * cellHeight;
            panels.push(new Panel(j * cellWidth, panelY, cellWidth, id));
        }
    }

    // 初期画像描画（画面内のパネルのみ）
    for (let p of panels) {
        if (p.y >= 0) {
            p.draw(images);
        }
    }
}

function draw() {
    // アニメーション更新
    for (let p of panels) {
        p.updateAnimation();
    }
    
    // アニメーション状態をチェック
    isAnimating = panels.some(p => p.isAnimating);
    
    drawArea();
}

// パネル重力落下処理
function applyGravity(clickedPanelIndex) {
    const clickedCol = clickedPanelIndex % grid;
    const clickedRow = Math.floor(clickedPanelIndex / grid);
    
    const fixedAnimationFrames = 15; // 固定アニメーション時間（フレーム数）
    
    // クリックされたパネルより上の列のパネルを下に移動（アニメーション開始）
    for (let row = clickedRow - 1; row >= 0; row--) {
        const currentIndex = row * grid + clickedCol;
        const targetIndex = (row + 1) * grid + clickedCol;
        
        if (currentIndex >= 0 && targetIndex < panels.length) {
            // アニメーション用の目標位置を設定
            const targetY = Math.floor(targetIndex / grid - (totalRows - grid)) * cellHeight;
            panels[currentIndex].startFalling(targetY, fixedAnimationFrames);
        }
    }
    
    // 固定時間でsetTimeoutを設定（60FPSで計算）
    const timeoutDuration = fixedAnimationFrames * (1000/60);
    
    // 最上段に新しい空パネルを追加（アニメーション後に適用）
    setTimeout(() => {
        // データの移動（下から上に向かって）
        for (let row = clickedRow; row > 0; row--) {
            const currentIndex = row * grid + clickedCol;
            const sourceIndex = (row - 1) * grid + clickedCol;
            showidx[currentIndex] = showidx[sourceIndex];
            clicked[currentIndex] = clicked[sourceIndex];
        }
        
        // 最上段を空にする
        const topIndex = clickedCol;
        showidx[topIndex] = 0; // 空画像
        clicked[topIndex] = 0;
        
        // パネルの位置をリセット
        for (let i = 0; i < panels.length; i++) {
            const row = Math.floor(i / grid);
            const col = i % grid;
            panels[i].y = (row - (totalRows - grid)) * cellHeight;
            panels[i].targetY = panels[i].y;
            panels[i].isAnimating = false;
            panels[i].fallSpeed = null; // 速度をリセット
        }
    }, timeoutDuration);
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

    // 通常パネル（BLEND）
    blendMode(BLEND);
    for (let idx = 0; idx < panels.length; idx++) {
        let p = panels[idx];
        let showid = showidx[idx];
        if (1 <= showid && showid <= grid * grid) {
            p.id = showid;
            p.draw(images);
        }
    }
    // 特殊パネル（MULTIPLY）
    blendMode(MULTIPLY);
    for (let idx = 0; idx < panels.length; idx++) {
        let p = panels[idx];
        let showid = showidx[idx];
        if (!(1 <= showid && showid <= grid * grid)) {
            p.id = showid;
            p.draw(images);
        }
    }
    blendMode(BLEND);
    
    // ホバー影の描画
    if (hoveredPanel >= 0 && clicked[hoveredPanel] !== true) {
        let p = panels[hoveredPanel];
        fill(0, 0, 0, 100); // 半透明の黒
        noStroke();
        rect(p.x, p.y, p.size, p.size);
    }
}

function allOpen() {
    for (let idx = 0; idx < panels.length; idx++) {
        if (clicked[idx] == 0) {
            clicked[idx] = 1;
            showidx[idx] = calcNewImage(idx);
        }
    }
    drawArea();
}

function mousePressed() {
    if (mouseButton === RIGHT || isAnimating) {
        return false; // 右クリックまたはアニメーション中は無効化
    }
    // タッチ開始位置を記録
    startX = mouseX;
    startY = mouseY;

    // ホバー中のパネルを設定
    hoveredPanel = -1;
    for (let idx = 0; idx < panels.length; idx++) {
        let p = panels[idx];
        if (p.contains(mouseX, mouseY) && clicked[idx] !== true) {
            hoveredPanel = idx;
            break;
        }
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT || isAnimating) {
        return false; // 右クリックまたはアニメーション中は無効化
    }
    
    // 開始時と終了時で同じパネル上にあるかチェック
    let startPanel = -1;
    let endPanel = -1;
    
    // 開始位置のパネルを特定
    for (let idx = 0; idx < panels.length; idx++) {
        let p = panels[idx];
        if (p.contains(startX, startY)) {
            startPanel = idx;
            break;
        }
    }
    
    // 終了位置のパネルを特定
    for (let idx = 0; idx < panels.length; idx++) {
        let p = panels[idx];
        if (p.contains(mouseX, mouseY)) {
            endPanel = idx;
            break;
        }
    }
    
    // 同じパネル上で開始・終了し、まだクリックされていない場合
    if (cleared == 0 && startPanel >= 0 && startPanel === endPanel && clicked[startPanel] == 0) {
        actionLog.push(startPanel);
        clicked[startPanel] = true;
        let newpic = calcNewImage(startPanel);
        showidx[startPanel] = newpic;
        
        // 重力アニメーション開始
        applyGravity(startPanel);
    }
    
    hoveredPanel = -1; // ホバー状態をリセット
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
