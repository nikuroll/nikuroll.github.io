let nazoid = 53;
let imageNum = 27; // 共通パネルと問題画像1枚
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

let answers = ["くどう","駆動","工藤"]; 
let hintMessage = "紫色の丸に「いて」が入るとき、丸全体には「ひらいて」「といて」が入ります。紫色の丸に「てん」が入るときはどうでしょうか？ヒントは、この記号。この記号を、埋めましょう。読点と、句点。";
let explanationMessage = "扉の先で、物語は駆動する。" 

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
    const startwidth = min(window.innerWidth - 32, window.innerHeight, 800);
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

const whisperLines = {
    start: ['最初の一枚を、待っています。', '今日の直感に、席をひとつ。', 'まだ白い時間に、好奇心をひとさじ。', '小さな予感と、目を合わせて。'],
    first: ['ひとつの発見が、次の扉をひらく。', 'はじめの一歩に、景色が応える。', 'その指先から、物語が動きだす。', '小さな窓にも、大きな予感。'],
    early: ['見えたかけらに、想像を添えて。', '気になるところが、あなたの入口。', 'ひらめきの種に、光が差してきた。', '遠くの答えへ、小さな寄り道。', 'その違和感を、ポケットに。', '余白の向こうで、何かが待っている。'],
    middle: ['点と点が、言葉になってゆく。', 'ばらばらの景色に、一本の糸を。', '見慣れた形も、角度を変えて。', '考える時間に、深呼吸をひとつ。', '気づきの足音が、少し近づいた。', 'まだ言えない予感を、大切に。'],
    late: ['見えてきた世界を、もうひと眺め。', '残る余白にも、物語がある。', 'ここまでの直感を、そっと並べて。', '答えの輪郭に、あなたの言葉を。', '最後の景色へ、好奇心のままに。', 'たくさんの発見が、ひとつになる前に。'],
    full: ['すべての景色が、あなたの味方。', '一枚の世界と、ゆっくり向き合う。', '見渡した先に、新しい見方を。', '隠れたものはなくても、驚きは残っている。'],
    clear: ['見つけてくれて、ありがとう。', '今日のひらめきに、花束を。', 'あなたが開いた扉に、光が差す。', 'ひとつの謎が、思い出になった。', 'その瞬間を、心のしおりに。', '答えに出会えた今日を、少し好きになる。'],
    idle: ['言葉になる前も、ひらめきの途中。', '空っぽの欄にも、可能性はいっぱい。', '答えの居場所を、あけておきました。', 'まだ名前のない予感と、ひと休み。'],
    focus: ['急がなくていい、ひらめきはあなたのもの。', '心に浮かんだ声を、聞いてみよう。', '言葉の入口で、肩の力を抜いて。', '小さな確信を、迎える準備。'],
    writing: ['その言葉に、勇気を添えて。', '指先のリズムが、予感をつづる。', '思いついた今を、逃さないで。', 'あなたの言葉が、答えを探している。', 'ひと文字ずつに、直感を込めて。', 'その候補にも、出会った理由がある。'],
    retry: ['遠回りも、答えへの道になる。', '別の角度から、もう一度。', 'ひとつ試した分だけ、景色は変わる。', '迷った足跡も、あなたの地図。', '思い込みの窓を、少し開けて。', '考え直す時間に、やさしい余白を。'],
    wrong: ['迷いの先に、ひらめきはある。', '答えはまだ、かくれんぼの途中。', 'その挑戦にも、小さな拍手を。', '違ったからこそ、見えるものがある。', 'ひと息ついたら、別の道へ。', '次の予感が、出番を待っている。']
};

// 場面ごとに全候補を使い切ってから補充し、直前の文も避ける。
const whisperBags = new Map();
const lastWhispers = new Map();
function pickWhisper(scene) {
    let bag = whisperBags.get(scene);
    if (!bag || bag.length === 0) {
        bag = [...whisperLines[scene]];
        whisperBags.set(scene, bag);
    }
    const choices = bag.filter(line => line !== lastWhispers.get(scene));
    const line = choices[Math.floor(Math.random() * choices.length)];
    bag.splice(bag.indexOf(line), 1);
    lastWhispers.set(scene, line);
    return line;
}

function updateBoardWhisper() {
    const whisper = document.getElementById('board-whisper');
    if (!whisper) return;
    const scene = cleared ? 'clear' : revealed === 25 ? 'full'
        : revealed >= 20 ? 'late' : revealed >= 10 ? 'middle'
        : revealed >= 2 ? 'early' : revealed === 1 ? 'first' : 'start';
    whisper.textContent = pickWhisper(scene);
}
updateBoardWhisper();

const poeticInput = document.getElementById('answerInput');
if (poeticInput) {
    let previousScene = '';
    const updateInputWhisper = (event) => {
        if (event?.isComposing) return;
        const scene = poeticInput.value.length ? 'writing'
            : document.activeElement === poeticInput ? 'focus' : 'idle';
        if (scene === previousScene && event?.type !== 'focus') return;
        previousScene = scene;
        document.getElementById('input-whisper').textContent = pickWhisper(scene);
    };
    for (const event of ['focus', 'input', 'blur', 'compositionend']) {
        poeticInput.addEventListener(event, updateInputWhisper);
    }
    updateInputWhisper();
}

function windowResized() {
    const size = min(window.innerWidth - 32, window.innerHeight, 800);
    resizeCanvas(size, size);
    cellWidth = width / grid;
    cellHeight = height / grid;
    drawArea();
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
                // blendMode(DIFFERENCE);
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
                revealed++;
            }
        }
    }
    drawArea();
    updateBoardWhisper();
}

function showExplanationMessageOnScreen(message, open = false) {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    let box = document.getElementById('explanation-message');
    if (!box) {
        box = document.createElement('div');
        box.id = 'explanation-message';
        box.style.marginTop = '16px';
        box.style.maxWidth = '800px';
        box.style.width = 'min(800px, 92vw)';
        box.style.padding = '12px 14px';
        box.style.borderRadius = '8px';
        box.style.border = '1px solid rgba(0,0,0,0.15)';
        box.style.background = 'rgba(255,255,255,0.95)';
        box.style.boxShadow = '0 6px 18px rgba(0,0,0,0.10)';
        box.style.color = '#222';
        box.style.fontSize = '14px';
        box.style.lineHeight = '1.6';
        box.style.whiteSpace = 'pre-wrap';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.gap = '12px';
        header.style.marginBottom = '8px';
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.tabIndex = 0;
        header.setAttribute('role', 'button');
        header.setAttribute('aria-label', '解説を開閉');
        header.setAttribute('aria-expanded', 'false');

        const title = document.createElement('div');
        title.textContent = '解説';
        title.style.fontWeight = '700';

        const toggleIcon = document.createElement('span');
        toggleIcon.id = 'explanation-toggle-icon';
        toggleIcon.textContent = '▶';
        toggleIcon.style.fontSize = '16px';
        toggleIcon.style.lineHeight = '1';
        toggleIcon.style.padding = '2px 6px';
        toggleIcon.style.opacity = '0.9';
        toggleIcon.style.pointerEvents = 'none';

        const toggle = () => {
            const body = document.getElementById('explanation-message-body');
            const icon = document.getElementById('explanation-toggle-icon');
            const isOpen = body && body.style.display !== 'none';
            if (body) {
                body.style.display = isOpen ? 'none' : 'block';
            }
            if (icon) {
                icon.textContent = isOpen ? '▶' : '▼';
            }
            header.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        };

        header.addEventListener('click', () => {
            toggle();
        });
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });

        header.appendChild(title);
        header.appendChild(toggleIcon);

        const body = document.createElement('div');
        body.id = 'explanation-message-body';
        body.style.display = 'none';

        box.appendChild(header);
        const caption = document.createElement('p');
        caption.className = 'poem';
        caption.textContent = '答えの奥へ、もう一歩。';
        box.appendChild(caption);
        box.appendChild(body);

        container.appendChild(box);
    }

    const body = document.getElementById('explanation-message-body');
    if (body) body.textContent = message;

    const icon = document.getElementById('explanation-toggle-icon');
    if (body) body.style.display = open ? 'block' : 'none';
    if (icon) icon.textContent = open ? '▼' : '▶';
    if (box) box.setAttribute('aria-expanded', open ? 'true' : 'false');

    box.style.display = 'block';
 }

function mousePressed() {
    if (cleared) return;
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
            updateBoardWhisper();
        }
    }
    
    drawArea();
}

// Add event listener for the quiz answer submission
const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value;
        if (answers.includes(answerInput.toLowerCase())) {
            window.showCaseMessage('正解！\n' + pickWhisper('clear'));

            tweetMess = make_tweet();

            cleared = 1;
            updateBoardWhisper();

            showResultButtons(tweetMess);
        } else {
            if (answers.includes(answerInput)) {
                answers = answers.filter(e => e !== answerInput);
            }

            remainingAttempts--;
            document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;
            
            if (revealed == 25){
                window.showCaseMessage('ちがいます。\n' + pickWhisper('wrong') + '\n' + hintMessage);
            }else{
                window.showCaseMessage('ちがいます。\n' + pickWhisper('wrong'));
            }

            actionLog.push(-1);
            document.getElementById('input-whisper').textContent = pickWhisper('retry');
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
    shareButton.textContent = 'Xで、共有する。';
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
    customButton.textContent = '全部を、開ける。';
    customButton.style.padding = '10px 20px';
    customButton.style.fontSize = '16px';
    customButton.style.color = '#fff';
    customButton.style.backgroundColor = '#28a745';
    customButton.style.border = 'none';
    customButton.style.borderRadius = '5px';
    customButton.style.cursor = 'pointer';
    customButton.addEventListener('click', () => {
        allOpen();
        showExplanationMessageOnScreen(explanationMessage, false);
        customButton.disabled = true;
        customButton.style.backgroundColor = '#6c757d';
        customButton.style.cursor = 'not-allowed';
    });

    for (const [button, text] of [
        [shareButton, 'そのひらめきを、世界へ。'],
        [customButton, 'すべてを開いて、余韻にひたる。']
    ]) {
        const item = document.createElement('div');
        const caption = document.createElement('p');
        caption.className = 'poem';
        caption.textContent = text;
        item.append(button, caption);
        buttonContainer.appendChild(item);
    }

    const container = document.getElementById('canvas-container');
    const intro = document.createElement('section');
    intro.className = 'result-intro';
    const heading = document.createElement('h2');
    heading.textContent = 'ひらめきに、拍手を。';
    const afterword = document.createElement('p');
    afterword.className = 'poem';
    afterword.textContent = 'あなたの一歩が、謎を物語に変えた。';
    intro.append(heading, afterword);
    container.prepend(intro);
    container.appendChild(buttonContainer);
}
