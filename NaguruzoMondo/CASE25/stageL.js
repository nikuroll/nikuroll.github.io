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

let answers = ["米津玄師","よねつけんし","よねづけんし","よねづげんし","よねつげんし"];

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
    
    // 初期クリッピング領域をstage2の終了状態に設定
    // stage2終了時: 縦20%-100%, 横20%-80%
    canvasClipX = width * 0.2;   // 20%の位置から開始
    canvasClipY = height * 0.2;  // 20%の位置から開始
    canvasClipWidth = width * 0.6;  // 80% - 20% = 60%の幅
    canvasClipHeight = height * 0.8; // 100% - 20% = 80%の高さ

    // CSSクリッピングも初期状態で適用
    const canvasElement = document.querySelector('#canvas canvas');
    if (canvasElement) {
        const clipPath = `inset(${canvasClipY}px ${width - (canvasClipX + canvasClipWidth)}px ${height - (canvasClipY + canvasClipHeight)}px ${canvasClipX}px)`;
        canvasElement.style.clipPath = clipPath;
        canvasElement.style.webkitClipPath = clipPath;
    }

    // main.jsからの進捗を適用
    applyProgressFromMain();

    // 初期画像描画
    drawArea();

    // ページ読み込み直後に解体イベントを開始
    setTimeout(() => {
        startDestructionEventDirectly();
    }, 1000); // 1秒後に解体イベント開始
}

// main.jsからの進捗を適用する関数
function applyProgressFromMain() {
    // URLパラメータから進捗情報を取得
    const urlParams = new URLSearchParams(window.location.search);
    const progressParam = urlParams.get('progress');
    
    if (progressParam) {
        // カンマ区切りのインデックスを配列に変換
        const openedIndices = progressParam.split(',').map(index => parseInt(index, 10));
        
        console.log('Main.jsからの進捗:', openedIndices);
        
        // 対応するパネルを開く
        openedIndices.forEach(index => {
            if (index >= 0 && index < clicked.length) {
                clicked[index] = 1;
                showidx[index] = calcNewImage(index);
                revealed++;
            }
        });
        
        console.log('StageL: 開けたパネル数', revealed);
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


function drawArea() {
    // 背景と画像を再描画して影を消す
    background(255);

    push(); // 現在の変換行列を保存

    // 震えエフェクト
    if (shakeIntensity > 0) {
        translate(random(-shakeIntensity, shakeIntensity), random(-shakeIntensity, shakeIntensity));
    }

    // 解体イベント中のクリッピング処理
    if (isDestructionEvent && canvasClipWidth > 0 && canvasClipHeight > 0) {
        // クリッピング領域外を黒で塗りつぶして隠す
        fill(0);
        noStroke();
        
        // 上部を黒で塗りつぶし
        rect(0, 0, width, canvasClipY);
        // 下部を黒で塗りつぶし
        rect(0, canvasClipY + canvasClipHeight, width, height - (canvasClipY + canvasClipHeight));
        // 左側を黒で塗りつぶし
        rect(0, canvasClipY, canvasClipX, canvasClipHeight);
        // 右側を黒で塗りつぶし
        rect(canvasClipX + canvasClipWidth, canvasClipY, width - (canvasClipX + canvasClipWidth), canvasClipHeight);
    }

    // 背景画像を描画（クリッピング領域内のみ）
    if (isDestructionEvent && canvasClipWidth > 0 && canvasClipHeight > 0) {
        // 表示領域内のみ背景を描画（整数値に変換）
        let bgX = Math.floor(canvasClipX);
        let bgY = Math.floor(canvasClipY);
        let bgW = Math.floor(canvasClipWidth);
        let bgH = Math.floor(canvasClipHeight);
        
        // 背景画像の対応する部分を切り取って描画
        image(images[backgroundIndex], 0, 0, width, height);
    } else {
        // 通常時は全体を描画
        image(images[backgroundIndex], 0, 0, width, height);
    }

    // パズルピースを描画
    blendMode(ADD);
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            let pieceX = j * cellWidth;
            let pieceY = i * cellHeight;
            
            if (1 <= showidx[index] && showidx[index] <= grid * grid) {
                blendMode(BLEND);
            } else {
                blendMode(MULTIPLY);
            }
            if (showidx[index] < images.length) {
                image(images[showidx[index]], pieceX, pieceY, cellWidth, cellHeight);
            }
        }
    }
    blendMode(BLEND);

    pop(); // 変換行列を復元
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
    // キャンバス領域外のクリックは処理しない（フォーム入力を妨害しない）
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return; // return falseを使わずにreturnのみ
    }
    
    if (mouseButton === RIGHT || !canInteract || isDestructionEvent) {
        return; // return falseを使わずにreturnのみ
    }
    
    // 解体後は表示エリア内のクリックのみ有効
    if (canvasClipWidth > 0 && canvasClipHeight > 0) {
        if (mouseX < canvasClipX || mouseX > canvasClipX + canvasClipWidth ||
            mouseY < canvasClipY || mouseY > canvasClipY + canvasClipHeight) {
            return; // return falseを使わずにreturnのみ
        }
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
    // キャンバス領域外のクリックは処理しない（フォーム入力を妨害しない）
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return; // return falseを使わずにreturnのみ
    }
    
    if (mouseButton === RIGHT || !canInteract || isDestructionEvent) {
        return; // return falseを使わずにreturnのみ
    }
    
    // 解体後は表示エリア内のクリックのみ有効
    if (canvasClipWidth > 0 && canvasClipHeight > 0) {
        if (mouseX < canvasClipX || mouseX > canvasClipX + canvasClipWidth ||
            mouseY < canvasClipY || mouseY > canvasClipY + canvasClipHeight) {
            return; // return falseを使わずにreturnのみ
        }
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
            // 豪華な正解演出を表示
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

// Add event listener for the hint button
const hintButton = document.getElementById('hintButton');
if (hintButton) {
    hintButton.addEventListener('click', () => {
        showHintEffect();
    });
}

// ページ読み込み直後の解体イベント
function startDestructionEventDirectly() {
    // 解体イベント開始
    isDestructionEvent = true;
    destructionProgress = 0;
    
    // クリッピング領域は既にsetup()で設定済み（stage2の終了状態）
    // 解体アニメーション開始
    animateDestruction();
}

// 正解時の豪華演出（main.jsと同様の派手な演出）
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
    greatText.textContent = 'Excellent!';
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
    const speechContent = 'ああ、これで真実が明らかに...！';
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

// 解体アニメーション
function animateDestruction() {
    const duration = 3000; // 3秒間のアニメーション
    const startTime = millis();
    
    // Canvas要素を取得してCSSクリッピングも併用
    const canvasElement = document.querySelector('#canvas canvas');
    
    function updateDestruction() {
        const elapsed = millis() - startTime;
        const progress = min(elapsed / duration, 1);
        
        // 震えの強度を徐々に減らす
        shakeIntensity = (1 - progress) * 15;
        
        // キャンバス範囲をstage2の終了状態からstageLの最終状態へ狭める
        // stage2終了: 縦20%-100%, 横20%-80%
        // stageL最終: 縦20%-40%, 横40%-60%
        const initialClipX = width * 0.2;   // stage2終了時の開始位置
        const initialClipY = height * 0.2;  // stage2終了時の開始位置
        const initialClipWidth = width * 0.6;  // stage2終了時の幅
        const initialClipHeight = height * 0.8; // stage2終了時の高さ
        
        const targetClipX = width * 0.4;   // 40%の位置から開始
        const targetClipY = height * 0.2;  // 20%の位置から開始（変わらず）
        const targetClipWidth = width * 0.2;  // 60% - 40% = 20%の幅
        const targetClipHeight = height * 0.2; // 40% - 20% = 20%の高さ
        
        // イージング関数（スムーズな減速）
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        canvasClipX = lerp(initialClipX, targetClipX, easeOut);
        canvasClipY = lerp(initialClipY, targetClipY, easeOut);
        canvasClipWidth = lerp(initialClipWidth, targetClipWidth, easeOut);
        canvasClipHeight = lerp(initialClipHeight, targetClipHeight, easeOut);
        
        // CSSでもクリッピングを適用（バックアップ）
        if (canvasElement) {
            const clipPath = `inset(${canvasClipY}px ${width - (canvasClipX + canvasClipWidth)}px ${height - (canvasClipY + canvasClipHeight)}px ${canvasClipX}px)`;
            canvasElement.style.clipPath = clipPath;
            canvasElement.style.webkitClipPath = clipPath; // Safari対応
        }
        
        // 再描画
        drawArea();
        
        if (progress < 1) {
            requestAnimationFrame(updateDestruction);
        } else {
            // 解体イベント終了
            completeDestructionEvent();
        }
    }
    
    updateDestruction();
}

// 解体イベント完了
function completeDestructionEvent() {
    isDestructionEvent = false;
    shakeIntensity = 0;
    canInteract = true; // パネル操作を有効化
    
    // CSSクリッピングを維持（解体後の状態を保持）
    const canvasElement = document.querySelector('#canvas canvas');
    if (canvasElement) {
        // 最終的なクリッピングを固定
        const clipPath = `inset(${canvasClipY}px ${width - (canvasClipX + canvasClipWidth)}px ${height - (canvasClipY + canvasClipHeight)}px ${canvasClipX}px)`;
        canvasElement.style.clipPath = clipPath;
        canvasElement.style.webkitClipPath = clipPath;
    }
    
    // 最終的な描画
    drawArea();
    
    // ユーザーに操作可能であることを知らせる
    showInteractionHint();
}

// 操作可能になったことを知らせるヒント
function showInteractionHint() {
    const hint = document.createElement('div');
    hint.textContent = 'これが最後です。';
    hint.style.position = 'fixed';
    hint.style.top = '50%';
    hint.style.left = '50%';
    hint.style.transform = 'translate(-50%, -50%)';
    hint.style.background = 'rgba(0, 0, 0, 0.8)';
    hint.style.color = '#fff';
    hint.style.padding = '15px 25px';
    hint.style.borderRadius = '10px';
    hint.style.fontSize = '18px';
    hint.style.fontWeight = 'bold';
    hint.style.zIndex = '999';
    hint.style.opacity = '0';
    hint.style.transition = 'opacity 0.5s ease-in-out';
    
    document.body.appendChild(hint);
    
    // フェードイン
    setTimeout(() => {
        hint.style.opacity = '1';
    }, 100);
    
    // 3秒後にフェードアウト
    setTimeout(() => {
        hint.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(hint);
        }, 500);
    }, 3000);
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

    // 次の章へボタンを作成
    const nextButton = document.createElement('a');
    // stageLの進捗情報をURLに追加してend.htmlへ
    const progressParam = generateProgressParam();
    nextButton.href = `./end.html${progressParam}`;
    nextButton.textContent = 'エンディング';
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

// ヒント表示機能
function showHintEffect() {
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

    // ヒントテキストを作成
    const hintText = document.createElement('div');
    hintText.textContent = 'Hint!';
    hintText.style.fontSize = '6rem';
    hintText.style.fontWeight = 'bold';
    hintText.style.color = '#4CAF50';
    hintText.style.textShadow = '0 0 20px rgba(255, 255, 255, 0.9), 0 0 40px rgba(255, 255, 255, 0.7), 0 0 60px rgba(255, 255, 255, 0.5), 0 0 80px rgba(76, 175, 80, 0.8)';
    hintText.style.transform = 'scale(0) rotate(-10deg)';
    hintText.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
    hintText.style.opacity = '0';
    hintText.style.marginBottom = '50px';

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
    // TODO: 人物画像のパスを設定（クリア時と同じでも、異なってもOK）
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
    speechBubble.style.maxWidth = '350px';
    speechBubble.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
    speechBubble.style.fontSize = '18px';
    speechBubble.style.color = '#333';
    speechBubble.style.fontWeight = 'bold';
    speechBubble.style.lineHeight = '1.4';
    
    // ヒントのテキスト
    const speechText = document.createElement('div');
    // TODO: 実際のヒントメッセージに変更。\nで改行できます
    const hintContent = 'ピースサイン。\nそして丸の色はLemon色。\nおまけにこのパネルは8番です。\nこの特徴を組み合わせて導かれる\n人物は一人しかいません！';
    speechText.innerHTML = hintContent.replace(/\n/g, '<br>');
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

    // 閉じるボタンを作成
    const closeButton = document.createElement('button');
    closeButton.textContent = '閉じる';
    closeButton.style.position = 'absolute';
    closeButton.style.bottom = '80px';
    closeButton.style.left = '50%';
    closeButton.style.transform = 'translateX(-50%)';
    closeButton.style.padding = '15px 40px';
    closeButton.style.fontSize = '20px';
    closeButton.style.fontWeight = 'bold';
    closeButton.style.color = '#fff';
    closeButton.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '30px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
    closeButton.style.transition = 'all 0.3s ease';
    closeButton.style.opacity = '0';

    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.transform = 'translateX(-50%) scale(1.05) translateY(-3px)';
        closeButton.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.4)';
        closeButton.style.background = 'linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.transform = 'translateX(-50%) scale(1) translateY(0)';
        closeButton.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
        closeButton.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
    });

    // 閉じるボタンのクリックイベント
    closeButton.addEventListener('click', () => {
        overlay.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(overlay);
        }, 500);
    });

    overlay.appendChild(hintText);
    overlay.appendChild(characterContainer);
    overlay.appendChild(closeButton);
    document.body.appendChild(overlay);

    // アニメーション開始
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 50);

    setTimeout(() => {
        hintText.style.transform = 'scale(1.1) rotate(0deg)';
        hintText.style.opacity = '1';
    }, 100);

    setTimeout(() => {
        hintText.style.transform = 'scale(1) rotate(0deg)';
    }, 800);

    // 人物とセリフのアニメーション
    setTimeout(() => {
        characterContainer.style.opacity = '1';
        characterContainer.style.transform = 'translateY(0)';
    }, 1200);

    // 閉じるボタンの表示
    setTimeout(() => {
        closeButton.style.opacity = '1';
    }, 1800);
}

// 進捗生成関数
function generateProgressParam() {
    const openedIndices = [];
    
    // 開いているパネルのインデックスを収集
    for (let i = 0; i < clicked.length; i++) {
        if (clicked[i] === 1) {
            openedIndices.push(i);
        }
    }
    
    // URLパラメータとして返す
    if (openedIndices.length > 0) {
        return `?progress=${openedIndices.join(',')}`;
    }
    
    return '';
}
