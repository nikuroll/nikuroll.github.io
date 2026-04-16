let nazoid = 28;
let imageNum = 33; // 画像の枚数（1-25 + 背景7枚[金曜26-木曜32]）
let backgroundIndex = 0; // 背景画像のインデックス（曜日で決定）
let images = [];
let showidx = [];
let grid = 5;
let cellWidth, cellHeight;
let startX, startY;

let opened = []; // 開けたパネル（Cookie から復元）
let cleared = 0;

let currentDate = 1; // 現在の日付(12月n日)
let isTestMode = false; // テストモード(日付制限を無視)
let debugMode = false; // デバッグパネル表示フラグ
let manualDate = null; // 手動設定した日付(デバッグ用)
let manualDayOfWeek = null; // 手動設定した曜日(デバッグ用: 0=日曜...6=土曜)

let tweetMess = "NaguruzoMondoに挑戦中!";

let answers = ["げにきもす"];

let remainingAttempts = 3;

// 曜日から背景画像インデックスを取得(金曜=26, 土曜=27, ..., 木曜=32)
function getBackgroundIndexByDay() {
    // デバッグ用の手動曜日設定があればそれを使用
    let dayOfWeek;
    if (manualDayOfWeek !== null) {
        dayOfWeek = manualDayOfWeek;
    } else {
        const now = new Date();
        dayOfWeek = now.getDay(); // 0=日曜, 1=月曜, ..., 6=土曜
    }
    
    // 金曜(5)=26, 土曜(6)=27, 日曜(0)=28, 月曜(1)=29, 火曜(2)=30, 水曜(3)=31, 木曜(4)=32
    if (dayOfWeek === 5) return 26; // 金曜
    if (dayOfWeek === 6) return 27; // 土曜
    return 28 + dayOfWeek; // 日曜(0)=28, 月曜(1)=29, 火曜(2)=30, 水曜(3)=31, 木曜(4)=32
}

// Cookie管理関数
function saveProgress() {
    const expires = new Date();
    // 現在から30日後に期限設定（1ヶ月分の余裕を持たせる）
    expires.setDate(expires.getDate() + 30);
    const data = JSON.stringify(opened);
    document.cookie = `case28_advent=${data}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function loadProgress() {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('case28_advent='));
    if (cookie) {
        try {
            return JSON.parse(cookie.split('=')[1]);
        } catch (e) {
            return [];
        }
    }
    return [];
}

function clearProgress() {
    document.cookie = 'case28_advent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// 現在の日付を取得(1日〜25日)
function getCurrentDecemberDate() {
    // デバッグ用の手動日付設定があればそれを使用
    if (manualDate !== null) {
        return manualDate;
    }
    
    const now = new Date();
    const day = now.getDate(); // 1-31
    
    // 1日〜25日の場合はその日付を返す（月は関係なし）
    if (day >= 1 && day <= 25) {
        return day;
    }
    // 26日以降は26を返す（全パネルロック用）
    return 26;
}

// パネルが開けられるかチェック
function canOpenPanel(panelNum) {
    if (isTestMode) return true; // テストモードは全て開ける
    // 26日以降は全てロック
    if (currentDate > 25) return false;
    // 今日の日付のパネルのみ開けられる（過去の未開封パネルはロック）
    if (opened.includes(panelNum)) return false; // 既に開封済みは開けない
    return panelNum === currentDate; // 今日の日付と一致する場合のみ開ける
}

function preload() {
    for (let i = 0; i < imageNum; i++) {
        images.push(loadImage(i >= 1 && i <= 25 ? `../images/pic(${i + 25}).PNG` : `images/pic(${i}).PNG`));
    }

    // 曜日に応じた背景画像を設定
    backgroundIndex = getBackgroundIndexByDay();
    
    // 進捗を読み込み
    opened = loadProgress();
    
    // 現在の日付を取得
    currentDate = getCurrentDecemberDate();
    
    // showidx初期化（1-25の数字、背景は0）
    for (let i = 0; i < grid * grid; i++) {
        const panelNum = i + 1;
        if (opened.includes(panelNum)) {
            showidx.push(0); // 開けたパネルは背景表示
        } else {
            showidx.push(panelNum); // 未開封は番号表示
        }
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

    // 日付情報を表示
    updateDateDisplay();
    
    // 初期描画
    drawArea();
    
    // デバッグパネルを初期化
    initDebugPanel();
}

function updateDateDisplay() {
    const dateInfo = document.getElementById('remainingAttempts');
    if (dateInfo) {
        dateInfo.textContent = `残り解答回数: ${remainingAttempts}`;
    }
}

function make_tweet(res = 0) {
    score = grid * grid;
    for (let i = 0; i < grid * grid; i++) {
        if (opened.includes(i + 1)) {
            score--;
        }
    }

    attempt = 3 - remainingAttempts + 1;

    if (res == 0) {
        tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid * grid} (${attempt}回目)\n`;
    } else {
        tweetText = `CASE${nazoid}に挑戦中！\n\n`;
    }
    for (let i = 0; i < grid; i++) {
        ret = "";
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            let panelNum = index + 1;
            if (opened.includes(panelNum)) {
                ret += "⬜";
            } else {
                ret += "🟨";
            }
        }

        tweetText += ret + "\n";
    }

    tweetText += `#NaguruzoMondo #なぐるぞアドカレ\n`;
    tweetText += location.origin + location.pathname;

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
    background(255);

    // 背景画像を描画
    image(images[backgroundIndex], 0, 0, width, height);
    
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            let panelNum = index + 1;
            
            if (opened.includes(panelNum)) {
                // 開封済み: 背景が見える（何も描画しない）
                continue;
            } else {
                // 未開封: 番号パネルを表示
                if (showidx[index] > 0 && showidx[index] < images.length) {
                    image(images[showidx[index]], j * cellWidth, i * cellHeight, cellWidth, cellHeight);
                }
                
                // ロック表示（未来の日付）
                if (!canOpenPanel(panelNum)) {
                    fill(0, 0, 0, 150); // 半透明の黒オーバーレイ
                    noStroke();
                    rect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
                    
                    // 🔒アイコン風の表示
                    fill(255);
                    textAlign(CENTER, CENTER);
                    textSize(cellWidth * 0.3);
                    text('🔒', j * cellWidth + cellWidth / 2, i * cellHeight + cellHeight / 2);
                }
            }
        }
    }
    blendMode(BLEND);
}

function allOpen() {
    // 全パネルを開ける
    for (let i = 1; i <= 25; i++) {
        if (!opened.includes(i)) {
            opened.push(i);
        }
    }
    saveProgress();
    updateDateDisplay();
    drawArea();
}

function mousePressed() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    if (cleared) return; // クリア済みなら無効
    
    startX = mouseX;
    startY = mouseY;

    let col = floor(mouseX / cellWidth);
    let row = floor(mouseY / cellHeight);
    let index = row * grid + col;
    let panelNum = index + 1;
    
    // すでに開いているか、範囲外なら何もしない
    if (opened.includes(panelNum) || col < 0 || col >= grid || row < 0 || row >= grid) {
        return;
    }

    // タッチ中のマスを影で強調（開けられる場合のみ）
    if (canOpenPanel(panelNum)) {
        fill(0, 0, 0, 100);
        noStroke();
        rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    if (cleared) return;
    
    if (floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);
        let index = row * grid + col;
        let panelNum = index + 1;

        // 範囲チェック
        if (col < 0 || col >= grid || row < 0 || row >= grid) {
            drawArea();
            return;
        }

        // すでに開いている場合は何もしない
        if (opened.includes(panelNum)) {
            drawArea();
            return;
        }

        // 開けられる日付かチェック
        if (!canOpenPanel(panelNum)) {
            if (currentDate > 25) {
                alert(`開封期間が終了しました`);
            } else {
                alert(`まだ開けられません`);
            }
            drawArea();
            return;
        }

        // パネルを開ける
        opened.push(panelNum);
        showidx[index] = 0; // 背景を表示
        saveProgress();
        updateDateDisplay();
        drawArea();
    } else {
        drawArea();
    }
}

// Add event listener for the quiz answer submission
const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value.trim();
        
        if (answers.includes(answerInput)) {
            alert('正解！');

            tweetMess = make_tweet();
            cleared = 1;

            showResultButtons(tweetMess);
        } else {
            remainingAttempts--;
            document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;
            
            alert(`ちがいます`);
        }
    });
}

// Add event listener for sharing progress
const shareButton = document.getElementById('shareProgress');
if (shareButton) {
    shareButton.addEventListener('click', () => {
        const progressTweet = make_tweet(1);
        tweet(progressTweet);
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

    const allOpenButton = document.createElement('button');
    allOpenButton.textContent = '全部開ける';
    allOpenButton.style.padding = '10px 20px';
    allOpenButton.style.fontSize = '16px';
    allOpenButton.style.color = '#fff';
    allOpenButton.style.backgroundColor = '#28a745';
    allOpenButton.style.border = 'none';
    allOpenButton.style.borderRadius = '5px';
    allOpenButton.style.cursor = 'pointer';
    allOpenButton.addEventListener('click', () => {
        allOpen();
        allOpenButton.disabled = true;
        allOpenButton.style.backgroundColor = '#6c757d';
        allOpenButton.style.cursor = 'not-allowed';
    });

    const resetButton = document.createElement('button');
    resetButton.textContent = 'リセット';
    resetButton.style.padding = '10px 20px';
    resetButton.style.fontSize = '16px';
    resetButton.style.color = '#fff';
    resetButton.style.backgroundColor = '#dc3545';
    resetButton.style.border = 'none';
    resetButton.style.borderRadius = '5px';
    resetButton.style.cursor = 'pointer';
    resetButton.addEventListener('click', () => {
        if (confirm('進捗をリセットしてもよろしいですか？')) {
            clearProgress();
            location.reload();
        }
    });

    buttonContainer.appendChild(shareButton);
    buttonContainer.appendChild(allOpenButton);
    buttonContainer.appendChild(resetButton);

    const container = document.getElementById('canvas-container');
    container.appendChild(buttonContainer);
}

// デバッグパネルの初期化
function initDebugPanel() {
    // URLパラメータでデバッグモードを有効化 (?debug=1)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === '1') {
        debugMode = true;
    }
    
    if (!debugMode) return;
    
    // デバッグパネルを作成
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: #0f0;
        padding: 15px;
        border: 2px solid #0f0;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        min-width: 250px;
    `;
    
    debugPanel.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: #ff0;">🐛 DEBUG MODE</div>
        <div id="debug-info" style="margin-bottom: 10px;"></div>
        <div style="margin-bottom: 5px;">
            <label>日付変更: 
                <input type="number" id="debug-date" min="1" max="26" value="${currentDate}" 
                    style="width: 50px; background: #222; color: #0f0; border: 1px solid #0f0;">
            </label>
            <button id="debug-set-date" style="margin-left: 5px; padding: 2px 8px; background: #0a0; color: #fff; border: none; cursor: pointer;">適用</button>
        </div>
        <div style="margin-bottom: 5px;">
            <label>曜日変更: 
                <select id="debug-day" style="background: #222; color: #0f0; border: 1px solid #0f0;">
                    <option value="-1">実際の曜日</option>
                    <option value="0">日曜</option>
                    <option value="1">月曜</option>
                    <option value="2">火曜</option>
                    <option value="3">水曜</option>
                    <option value="4">木曜</option>
                    <option value="5">金曜</option>
                    <option value="6">土曜</option>
                </select>
            </label>
            <button id="debug-set-day" style="margin-left: 5px; padding: 2px 8px; background: #0a0; color: #fff; border: none; cursor: pointer;">適用</button>
        </div>
        <div style="margin-bottom: 10px;">
            <button id="debug-reset-date" style="padding: 2px 8px; background: #a00; color: #fff; border: none; cursor: pointer;">日付リセット</button>
        </div>
        <div style="margin-bottom: 5px;">
            <button id="debug-show-cookie" style="padding: 2px 8px; background: #05a; color: #fff; border: none; cursor: pointer; width: 100%;">Cookie確認</button>
        </div>
        <div style="margin-bottom: 5px;">
            <button id="debug-clear-cookie" style="padding: 2px 8px; background: #a50; color: #fff; border: none; cursor: pointer; width: 100%;">Cookie削除</button>
        </div>
        <div>
            <button id="debug-test-mode" style="padding: 2px 8px; background: #50a; color: #fff; border: none; cursor: pointer; width: 100%;">テストモード切替</button>
        </div>
    `;
    
    document.body.appendChild(debugPanel);
    
    // デバッグ情報を更新
    updateDebugInfo();
    
    // イベントリスナー設定
    document.getElementById('debug-set-date').addEventListener('click', () => {
        const newDate = parseInt(document.getElementById('debug-date').value);
        if (newDate >= 1 && newDate <= 26) {
            manualDate = newDate;
            currentDate = newDate;
            updateDateDisplay();
            drawArea();
            updateDebugInfo();
            console.log(`[DEBUG] 日付を${newDate}日目に変更しました`);
        }
    });
    
    document.getElementById('debug-set-day').addEventListener('click', () => {
        const selectedDay = parseInt(document.getElementById('debug-day').value);
        if (selectedDay === -1) {
            manualDayOfWeek = null;
            console.log('[DEBUG] 曜日を実際の曜日にリセットしました');
        } else {
            manualDayOfWeek = selectedDay;
            const dayNames = ['日曜', '月曜', '火曜', '水曜', '木曜', '金曜', '土曜'];
            console.log(`[DEBUG] 曜日を${dayNames[selectedDay]}に変更しました`);
        }
        backgroundIndex = getBackgroundIndexByDay();
        drawArea();
        updateDebugInfo();
    });
    
    document.getElementById('debug-reset-date').addEventListener('click', () => {
        manualDate = null;
        manualDayOfWeek = null;
        currentDate = getCurrentDecemberDate();
        backgroundIndex = getBackgroundIndexByDay();
        document.getElementById('debug-date').value = currentDate;
        document.getElementById('debug-day').value = -1;
        updateDateDisplay();
        drawArea();
        updateDebugInfo();
        console.log('[DEBUG] 日付と曜日を実際の日付にリセットしました');
    });
    
    document.getElementById('debug-show-cookie').addEventListener('click', () => {
        const cookieData = loadProgress();
        const cookieStr = document.cookie.split('; ').find(row => row.startsWith('case28_advent='));
        alert(`Cookie内容:\n${cookieStr || '(なし)'}\n\n開封済みパネル: ${JSON.stringify(cookieData)}`);
        console.log('[DEBUG] Cookie:', cookieStr, '\nデータ:', cookieData);
    });
    
    document.getElementById('debug-clear-cookie').addEventListener('click', () => {
        if (confirm('Cookie(進捗)を削除しますか?')) {
            clearProgress();
            opened = [];
            for (let i = 0; i < grid * grid; i++) {
                showidx[i] = i + 1;
            }
            updateDateDisplay();
            drawArea();
            updateDebugInfo();
            console.log('[DEBUG] Cookieを削除しました');
        }
    });
    
    document.getElementById('debug-test-mode').addEventListener('click', () => {
        isTestMode = !isTestMode;
        drawArea();
        updateDebugInfo();
        console.log(`[DEBUG] テストモード: ${isTestMode ? 'ON' : 'OFF'}`);
    });
}

// デバッグ情報を更新
function updateDebugInfo() {
    const debugInfo = document.getElementById('debug-info');
    if (!debugInfo) return;
    
    const now = new Date();
    const realDate = `${now.getMonth() + 1}/${now.getDate()}`;
    const dateStatus = currentDate > 25 ? '期間終了' : `${currentDate}日目`;
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const realDay = dayNames[now.getDay()];
    const currentDay = manualDayOfWeek !== null ? dayNames[manualDayOfWeek] : realDay;
    
    debugInfo.innerHTML = `
        <div>実際の日付: ${realDate}(${realDay})</div>
        <div>現在の日付: ${dateStatus}</div>
        <div>現在の曜日: ${currentDay} (背景=${backgroundIndex})</div>
        <div>画像読込: ${images.length}枚 / 必要: ${imageNum}枚</div>
        <div>手動設定: 日付=${manualDate !== null ? 'あり' : 'なし'} / 曜日=${manualDayOfWeek !== null ? 'あり' : 'なし'}</div>
        <div>テストモード: ${isTestMode ? 'ON' : 'OFF'}</div>
        <div>開封数: ${opened.length}/25</div>
        <div>開封済み: [${opened.sort((a,b) => a-b).join(', ')}]</div>
    `;
}
