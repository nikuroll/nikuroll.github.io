//-----------------------------------------------
// 数独を解く                width=420 height=420
//                             takaken 2020/07/24
//-----------------------------------------------
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

const DD = 40;  // 単位長

//-----------------------------------------------
// グローバル変数定義
//-----------------------------------------------
// 場面モード
let Mode = 0;
// 0:入力中
// 1:探索中
// 2:結果表示

// キー入力待ちタイマー
let keyWait = 0;

// 入力位置
let EY = 0;
let EX = 0;
let Blink = 0;

// 数字ボタンのOnOff
let EN = [0,0,0,0,0,0,0,0,0,0];

// 実行ボタンのOnOff
let EC = [0,0,0];
let EE = [0,1,1];   // enable

// 入力マップ(サンプル入り)
let EDIT = [
 [0,0,0,3,0,0,0,1,0],
 [0,9,3,0,0,0,2,0,0],
 [0,8,7,0,0,2,0,0,0],
 [4,0,0,0,1,0,0,0,8],
 [0,0,0,5,0,0,0,2,0],
 [0,0,6,0,0,9,7,0,0],
 [0,1,0,0,0,5,8,0,0],
 [7,0,0,0,8,0,0,0,2],
 [0,0,0,1,0,0,0,4,0]
];

// 探察用作業データ
let TB = new Array(9);
let WK = new Array(9);
for (y=0; y<9; y++) {
    TB[y] = new Array(9);   // 答え(重複解は+10)
    WK[y] = new Array(9);   // 探索ワーク
}

// 27エリア
let BY = new Array(9);
let BX = new Array(9);
let BB = new Array(3);
for (i=0; i<3; i++) {
    BB[i] = new Array(3);
}

// 探索結果
let RESULT = 0;

// 確定探索で配置したスタック
let SP = 0;
let SY = new Array(81);
let SX = new Array(81);
let SB = new Array(81);

//-----------------------------------------------
// 汎用モジュール
//-----------------------------------------------
// 文字表示
function DrawText(str, x, y, height) {
    context.beginPath();            // パスをリセット
    context.fillStyle = '#000000';
    context.font = "" + height + "px 'ＭＳ ゴシック', 'MS Gothic', sans-serif";
    context.fillText(str, x, y + height);
}

// 文字表示(太字+color)
function DrawTextB(str, x, y, height, color) {
    context.beginPath();            // パスをリセット
    context.fillStyle = color;
    context.font = "bold " + height + "px 'ＭＳ ゴシック', 'MS Gothic', sans-serif";
    context.fillText(str, x, y + height);
}

// 四角表示(塗りつぶし)
function DrawRect(x, y, width, height, color) {
    context.beginPath();            // パスをリセット
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
}

// 線
function DrawLine(x1, y1, x2, y2, color) {
    context.beginPath();            // パスをリセット
    context.moveTo(x1, y1);         // スタート地点
    context.lineTo(x2, y2);         // 目的地点
    context.strokeStyle = color;    // 線の色
    context.lineWidth = 2;          // 線の太さ
    context.stroke();               // 線を描画する
}

// 数字ボタン(数独専用)
function DrawButtonN(n) {
    x = 10+DD*9+3+EN[n];
    y = 10+DD*n+3+EN[n];

    DrawLine(x+1, y+1, x+33, y+1, '#E3E3E3');
    DrawLine(x+1, y+1, x+1, y+33, '#E3E3E3');

    DrawLine(x, y, x+34, y, '#FFFFFF');
    DrawLine(x, y, x, y+34, '#FFFFFF');

    DrawLine(x+1, y+36, x+36, y+36, '#696969');
    DrawLine(x+35, y, x+35, y+36, '#696969');

    DrawLine(x+2, y+35, x+34, y+35, '#A0A0A0');
    DrawLine(x+34, y, x+34, y+34, '#A0A0A0');

    if (Mode == 0) {
        if (n) DrawText(""+n, x+11, y+2, 26);
    } else {
        if (n) DrawTextB(""+n, x+11, y+2, 26, '#CCCCCC');
    }
}

// 実行ボタン(数独専用)
function DrawButtonC(n, text) {
    x = 10+DD*2*n+3+EC[n];
    y = 10+DD*9+4+EC[n];

    DrawLine(x+1, y+1, x+33+40, y+1, '#E3E3E3');
    DrawLine(x+1, y+1, x+1, y+33, '#E3E3E3');

    DrawLine(x, y, x+34+40, y, '#FFFFFF');
    DrawLine(x, y, x, y+34, '#FFFFFF');

    DrawLine(x+1, y+36, x+36+40, y+36, '#696969');
    DrawLine(x+35+40, y, x+35+40, y+36, '#696969');

    DrawLine(x+2, y+35, x+34+40, y+35, '#A0A0A0');
    DrawLine(x+34+40, y, x+34+40, y+34, '#A0A0A0');

    if (EE[n]) {
        DrawText(text, x+6, y+8, 16);
    } else {
        DrawTextB(text, x+3, y+8, 16, '#CCCCCC');
    }
}

//-----------------------------------------------
// 入力イベント
//-----------------------------------------------
// マウス イベント
function mousedown(e) {
    cx = e.clientX - canvas.getBoundingClientRect().left;
    cy = e.clientY - canvas.getBoundingClientRect().top;

    // 入力位置
    if (Mode==0 && cx>10 && cx<(10+DD*9) && cy>10 && cy<(10+DD*9)) {
        EX = parseInt((cx - 10) / DD);
        EY = parseInt((cy - 10) / DD);
    }

    // 数字ボタン
    EN[0] = EN[1] = EN[2] = EN[3] = EN[4] = EN[5] = EN[6] = EN[7] = EN[8] = EN[9] = 0;
    if (Mode==0 && cx>(10+DD*9) && cx<(10+DD*10) && cy>10 && cy<(10+DD*10)) {
        n = parseInt((cy - 10) / DD);
        EN[n] = 1;
        EDIT[EY][EX] = n;
    }

    // [実行ボタン] 戻る, 全消去, 探索開始
    EC[0] = EC[1] = EC[2] = 0;
    if (cx>10 && cx<(10+DD*6) && cy>(10+DD*9) && cy<(10+DD*10)) {
        i = parseInt((cx - 10) / (DD+DD));
        if (EE[i]) EC[i] = 1;
    }
}
function mouseup(e) {
    EN[0] = EN[1] = EN[2] = EN[3] = EN[4] = EN[5] = EN[6] = EN[7] = EN[8] = EN[9] = 0;
    EC[0] = EC[1] = EC[2] = 0;
}
// キーイベント
var key = new Object();
function keydown(e) {
    if (e.keyCode === 37) key.left = true;
    if (e.keyCode === 38) key.up = true;
    if (e.keyCode === 39) key.right = true;
    if (e.keyCode === 40) key.down = true;
    if (e.keyCode>=96 && e.keyCode<=105) key.n = e.keyCode - 96;    // テンキー
    if (e.keyCode>=48 && e.keyCode<=57) key.n = e.keyCode - 48;     // 数字キー
    if (e.keyCode === 46) key.n = 0;                                // Delete
    e.preventDefault(); // 方向キーでブラウザがスクロールしないようにする
}
function keyup() {
    key.left = false;
    key.up = false;
    key.right = false;
    key.down = false;
    key.n = -1;
}

//-----------------------------------------------
// 主処理
//-----------------------------------------------
addEventListener('load', main, false);
addEventListener("mousedown", mousedown, false);
addEventListener("mouseup", mouseup, false);
addEventListener("keydown", keydown, false);
addEventListener("keyup", keyup, false);
function main() {
    Ctrl(); // 制御
    Draw(); // 描画
    requestAnimationFrame(main);    // 60fps
}

//-----------------------------------------------
// 制御
//-----------------------------------------------
function Ctrl()
{
    switch (Mode) {
    case 0: // 問題入力
        if (keyWait) {
            keyWait--;
        } else {
            if (key.left  && EX>0) { EX--; keyWait=8; }
            if (key.up    && EY>0) { EY--; keyWait=8; }
            if (key.right && EX<8) { EX++; keyWait=8; }
            if (key.down  && EY<8) { EY++; keyWait=8; }
            if (key.n >= 0) { EDIT[EY][EX] = key.n; keyWait=8; }
        }
        if (Blink) {
            Blink--;
        } else {
            Blink = 40;
        }
        if (EC[1]) {    // 全消去
            for (y=0; y<9; y++)
            for (x=0; x<9; x++)
                EDIT[y][x] = 0;
        }
        if (EC[2]) Mode = 1;// 探索開始
        break;
    case 1: // 探索中
        Computer();
        Mode = 2;
        break;
    case 2: // 結果表示
        if (EC[0]) Mode = 0;// 戻る
        break;
    }
}

//-----------------------------------------------
// 描画
//-----------------------------------------------
function Draw()
{
    // 背景
    DrawRect(0, 0, 420, 420, '#F0F0F0');
    DrawRect(10, 10, DD*9, DD*9, '#FFFFFF');

    // 細線
    for (i=0; i<10; i++) {
        DrawLine(10+i*DD, 10, 10+i*DD, 10+DD*9, '#000000');
        DrawLine(10, 10+i*DD, 10+DD*9, 10+i*DD, '#000000');
    }

    // 太線
    for (i=0; i<4; i++) {
        DrawLine(10+i*DD*3+1, 10+1, 10+i*DD*3+1, 10+DD*9+1, '#000000');
        DrawLine(10+1, 10+i*DD*3+1, 10+DD*9+1, 10+i*DD*3+1, '#000000');
        DrawLine(10+i*DD*3-1, 10-1, 10+i*DD*3-1, 10+DD*9-1, '#000000');
        DrawLine(10-1, 10+i*DD*3-1, 10+DD*9-1, 10+i*DD*3-1, '#000000');
    }

    // 数字ボタン
    for (i=0; i<10; i++) {
        DrawButtonN(i);
    }

    // 実行ボタン
    switch (Mode) {
    case 0: // 問題入力
        EE[0]=0; EE[1]=EE[2]=1; break;
    case 1: // 探索中
        EE[0]=EE[1]=EE[2]=0; break;
    case 2: // 結果表示
        EE[0]=1; EE[1]=EE[2]=0; break;
    }
    DrawButtonC(0, "　戻 る");
    DrawButtonC(1, " 全消去");
    DrawButtonC(2, "探索開始");

    // 入力位置と入力値
    if (Mode != 2) {
        if (Mode==0 && Blink>20)
            DrawRect(12+DD*EX, 12+DD*EY, 36, 36, '#DDDDDD');
        for (y=0; y<9; y++)
        for (x=0; x<9; x++) {
            if (EDIT[y][x]) {
                DrawTextB(""+EDIT[y][x], 21+x*DD, 12+y*DD, 30, '#000000');
            }
        }
    } else {
        // 結果表示
        for (y=0; y<9; y++)
        for (x=0; x<9; x++) {
            if (EDIT[y][x]) {
                DrawTextB(""+EDIT[y][x], 21+x*DD, 12+y*DD, 30, '#000000');
            } else if (RESULT != 3) {
                if (TB[y][x] > 10) {
                    DrawTextB(""+(TB[y][x]-10), 21+x*DD, 12+y*DD, 30, '#FF0000');
                } else {
                    DrawTextB(""+TB[y][x], 21+x*DD, 12+y*DD, 30, '#0088FF');
                }
            }
        }
    }

    // 状態表示
    if (Mode == 1) {
        DrawTextB("探 索 中", 268, 380, 20, '#000000');
    } else
    if (Mode == 2) {
        switch (RESULT) {
        case 1: DrawTextB("探索終了", 268, 380, 20, '#0000FF'); break;
        case 2: DrawTextB("重複あり", 268, 380, 20, '#FF0000'); break;
        case 3: DrawTextB("問題異常", 268, 380, 20, '#FF0000'); break;
        }
    }
}

//-----------------------------------------------
// 探索ルーチン
//-----------------------------------------------
// 解の記録と重複検査
function Record()
{
    // 記録が無い場合
    if (RESULT == 0) {
        for (y=0; y<9; y++)
        for (x=0; x<9; x++)
            TB[y][x] = WK[y][x];
        RESULT = 1;

    // 既に記録が有る場合
    } else {
        for (y=0; y<9; y++)
        for (x=0; x<9; x++) {
            if (TB[y][x]<10 && TB[y][x]!=WK[y][x]) {
                TB[y][x] += 10;
                RESULT = 2;
            }
        }
   }
}
// 数を置く
function SetNum(y, x, num, bit)
{
    WK[y][x] = num;
    BY[y] += bit;
    BX[x] += bit;
    BB[parseInt(y/3)][parseInt(x/3)] += bit;
}
// 数を取る
function DelNum(y, x, bit)
{
    WK[y][x] = 0;
    BY[y] -= bit;
    BX[x] -= bit;
    BB[parseInt(y/3)][parseInt(x/3)] -= bit;
}
// 確定処理
function Kakutei()
{
    let y, x, num, bit, yr=0, xr=0, cnt, r, c;
    let flag=1;

    while (flag != 0) {
        flag = 0;

        // ３×３ブロック
        for (r=0; r<3; r++)
        for (c=0; c<3; c++) {
            bit = 1;
            for (num=1; num<=9; num++) {
                if ((BB[r][c] & bit) == 0) {    // numが未配置
                    cnt = 0;
                    // numを矛盾無く配置可能な場所を探す
                    for (y=(r*3); y<(r*3+3) && cnt<2; y++)
                    for (x=(c*3); x<(c*3+3) && cnt<2; x++) {
                        if (WK[y][x] != 0) continue;
                        if (((BY[y] | BX[x]) & bit) == 0) {
                            yr = y;
                            xr = x;
                            cnt++;
                        }
                    }
                    if (cnt == 0) return 1;      // 異常(どこにも配置不可)
                    if (cnt == 1) {              // 確定(配置可能位置１つ)
                        // 確定探索処理を実行記録
                        SetNum(yr, xr, num, bit);
                        SY[SP] = yr;
                        SX[SP] = xr;
                        SB[SP] = bit;
                        SP++;
                        flag = 1;
                    }
                }
                bit <<= 1;
            }
        }

        // 各横列
        for (y=0; y<9; y++) {
            bit = 1;
            for (num=1; num<=9; num++) {
                if ((BY[y] & bit) == 0) {   // numが未配置
                    cnt = 0;
                    // numを矛盾無く配置可能な場所を探す
                    for (x=0; x<9 && cnt<2; x++) {
                        if (WK[y][x] != 0) continue;
                        if (((BB[parseInt(y/3)][parseInt(x/3)] | BX[x]) & bit) == 0) {
                            yr = y;
                            xr = x;
                            cnt++;
                        }
                    }
                    if (cnt == 0) return 1;  // 異常(どこにも配置不可)
                    if (cnt == 1) {          // 確定(配置可能位置１つ)
                        // 確定探索処理を実行記録
                        SetNum(yr, xr, num, bit);
                        SY[SP] = yr;
                        SX[SP] = xr;
                        SB[SP] = bit;
                        SP++;
                        flag = 1;
                    }
                }
                bit <<= 1;
            }
        }

        // 各縦列
        for (x=0; x<9; x++) {
            bit = 1;
            for (num=1; num<=9; num++) {
                if ((BX[x] & bit) == 0) {   // numが未配置
                    cnt = 0;
                    // numを矛盾無く配置可能な場所を探す
                    for (y=0; y<9 && cnt<2; y++) {
                        if (WK[y][x] != 0) continue;
                        if (((BB[parseInt(y/3)][parseInt(x/3)] | BY[y]) & bit) == 0) {
                            yr = y;
                            xr = x;
                            cnt++;
                        }
                    }
                    if (cnt == 0) return 1;  // 異常(どこにも配置不可)
                    if (cnt == 1) {          // 確定(配置可能位置１つ)
                        // 確定探索処理を実行記録
                        SetNum(yr, xr, num, bit);
                        SY[SP] = yr;
                        SX[SP] = xr;
                        SB[SP] = bit;
                        SP++;
                        flag = 1;
                    }
                }
                bit <<= 1;
            }
        }
    }
    return 0;   // 正常終了
}

// 再帰探索処理
function Backtrack()
{
    let  y=0, x=0, num, bit, map, pos=SP;

    // 確定探索を実行し異常無しなら、未確定部分を再帰探索
    if (Kakutei() == 0) {
        // 未確定部分を探す
        for (y=0; y<9; y++) {
            for (x=0; x<9; x++)
                if (WK[y][x]==0 && TB[y][x]<10) break;
            if (x < 9) break;
        }

        if (y == 9) {
            Record();     // 解の記録
        } else {
            map = BY[y] | BX[x] | BB[parseInt(y/3)][parseInt(x/3)];
            bit = 1;
            for (num=1; num<=9; num++) {
                if ((map & bit) == 0) {      // 矛盾無く配置可能なら
                    SetNum(y, x, num, bit);
                    Backtrack();
                    DelNum(y, x, bit);
                }
                bit <<= 1;
            }
        }
    }
    // 確定探索処理を戻す
    while (pos < SP) {
        SP--;
        y   = SY[SP];
        x   = SX[SP];
        bit = SB[SP];
        DelNum(y, x, bit);
    }
}
// 探索
function Computer()
{
    // 初期クリアー
    for (y=0; y<9; y++) {
        BY[y] = BX[y] = 0;
        for (x=0; x<9; x++) {
            TB[y][x] = WK[y][x] = 0;
        }
    }
    for (y=0; y<3; y++)
    for (x=0; x<3; x++) {
        BB[y][x] = 0;
    }
    SP = RESULT = 0;

    // 問題取込み
    for (y=0; y<9; y++)
    for (x=0; x<9; x++) {
        num = EDIT[y][x];
        if (num != 0) {
            bit = 1 << (num - 1);
            if ((BY[y] & bit) != 0) RESULT = 3;
            if ((BX[x] & bit) != 0) RESULT = 3;
            if ((BB[parseInt(y/3)][parseInt(x/3)] & bit) != 0) RESULT = 3;
            SetNum(y, x, num, bit);
        }
    }

    // 探索
    if (RESULT == 0) {
        Backtrack();
        if (RESULT == 0) RESULT = 3;
    }
}