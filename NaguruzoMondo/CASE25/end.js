// エンディングページのロジック
let clickedData = [];

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    // URLパラメータから進捗情報を取得
    loadProgressData();
    
    // キャラクターの会話を開始
    startDialogueSequence();
    
    // シェアボタンの設定
    setupShareButton();
});

// 進捗データの読み込み
function loadProgressData() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // progress配列の復元（開けたマスのインデックス）
    const progressParam = urlParams.get('progress');
    if (progressParam) {
        const openedIndices = progressParam.split('-').map(x => parseInt(x));
        
        // 25マスのclicked配列を初期化
        clickedData = new Array(25).fill(0);
        
        // 開けたマスを1にする
        openedIndices.forEach(index => {
            if (index >= 0 && index < 25) {
                clickedData[index] = 1;
            }
        });
    } else {
        // パラメータがない場合はデフォルト値
        clickedData = new Array(25).fill(0);
    }
    
    console.log('Progress loaded:', { clicked: clickedData, openedCount: clickedData.filter(x => x === 1).length });
}

// キャラクター会話のデータ
const dialogues = [
    {
        text: 'これで...真実が明らかに...？'
    },
    {
        text: 'はい。'
    },
    {
        text: '今までの答えを並べてみましょう。'
    },
    {
        text: '解体される納屋の中に、<br>米津玄師がいたのです。'
    },
    {
        text: 'そうだったのか...！'
    }
];

// 会話シーケンスの開始
function startDialogueSequence() {
    const dialogueSection = document.getElementById('dialogueSection');
    
    dialogues.forEach((dialogue, index) => {
        // 会話要素を作成
        const dialogueItem = createDialogueElement(dialogue, index);
        dialogueSection.appendChild(dialogueItem);
        
        // 順次表示アニメーション
        setTimeout(() => {
            dialogueItem.classList.add('show');
        }, (index + 1) * 600);
    });
}

// 会話要素の作成
function createDialogueElement(dialogue, index) {
    const dialogueItem = document.createElement('div');
    dialogueItem.className = 'dialogue-item';
    
    // キャラクター画像を作成（2,1,1,1,2の順番）
    const characterOrder = [2, 1, 1, 1, 2]; // 使用するキャラクター番号
    const characterNumber = characterOrder[index];
    
    const characterImage = document.createElement('img');
    characterImage.className = 'character-image';
    characterImage.src = `images/character${characterNumber}.png`;
    characterImage.alt = `Character ${characterNumber}`;
    
    // 画像読み込みエラー時のフォールバック
    characterImage.onerror = function() {
        // 画像が見つからない場合はアルファベットアイコンに変更
        const fallbackDiv = document.createElement('div');
        fallbackDiv.className = 'character-image';
        fallbackDiv.style.display = 'flex';
        fallbackDiv.style.alignItems = 'center';
        fallbackDiv.style.justifyContent = 'center';
        fallbackDiv.style.fontSize = '24px';
        fallbackDiv.style.color = '#f8f9fa';
        fallbackDiv.style.fontWeight = 'bold';
        fallbackDiv.textContent = characterNumber; // キャラクター番号を表示
        
        // 元の画像要素を置換
        this.parentNode.replaceChild(fallbackDiv, this);
    };
    
    const speechBubble = document.createElement('div');
    speechBubble.className = 'speech-bubble';
    speechBubble.innerHTML = dialogue.text;
    
    dialogueItem.appendChild(characterImage);
    dialogueItem.appendChild(speechBubble);
    
    return dialogueItem;
}

// シェアボタンの設定
function setupShareButton() {
    const shareButton = document.getElementById('shareButton');
    
    shareButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        // シェア用のテキストを生成
        const shareText = make_tweet();
        
        // XのシェアURL
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        
        // 新しいウィンドウでXを開く
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    });
}

// シェア用テキストの生成
function make_tweet(res = 0) {
    // clickedDataを使用してスコア計算
    const openedCount = clickedData.filter(x => x === 1).length;
    const score = 25 - openedCount;

    if (res == 0) {
        tweetText = `CASE25 \n\nScore: ${score}/25\n`;
    }
    for (let i = 0; i < 5; i++) {
        ret = "";
        for (let j = 0; j < 5; j++) {
            let index = i * 5 + j;
            if (clickedData[index] == 1) {
                ret += "⬜";
            } else {
                ret += "🟨";
            }
        }

        tweetText += ret + "\n";
    }

    tweetText += `#NaguruzoMondo\n`;
    // index.htmlのパスを表示
    const indexPath = location.pathname.replace('/end.html', '/index.html');
    tweetText += location.origin + indexPath;

    console.log(tweetText);
    return tweetText;
}