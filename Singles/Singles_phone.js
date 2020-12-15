//画面のスクロールについて
// スクロールを禁止する関数
function noScroll(event) {
  event.preventDefault();
}
document.addEventListener('touchmove', noScroll, { passive: false });

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
let EN = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// 実行ボタンのOnOff
let EC = [0, 0, 0];
let EE = [0, 1, 1]; // enable

// 入力マップ(サンプル入り)
let EDIT = [
  [0, 0, 0, 3, 0, 0, 0, 1, 0],
  [0, 9, 3, 0, 0, 0, 2, 0, 0],
  [0, 8, 7, 0, 0, 2, 0, 0, 0],
  [4, 0, 0, 0, 1, 0, 0, 0, 8],
  [0, 0, 0, 5, 0, 0, 0, 2, 0],
  [0, 0, 6, 0, 0, 9, 7, 0, 0],
  [0, 1, 0, 0, 0, 5, 8, 0, 0],
  [7, 0, 0, 0, 8, 0, 0, 0, 2],
  [0, 0, 0, 1, 0, 0, 0, 4, 0]
];

// 探察用作業データ
let TB = new Array(9);
let WK = new Array(9);
for (y = 0; y < 9; y++) {
  TB[y] = new Array(9); // 答え(重複解は+10)
  WK[y] = new Array(9); // 探索ワーク
}

// 27エリア
let BY = new Array(9);
let BX = new Array(9);
let BB = new Array(3);
for (i = 0; i < 3; i++) {
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
// 探索ルーチン
//-----------------------------------------------
// 解の記録と重複検査
function Record() {
  // 記録が無い場合
  if (RESULT == 0) {
    for (y = 0; y < 9; y++)
      for (x = 0; x < 9; x++)
        TB[y][x] = WK[y][x];
    RESULT = 1;

    // 既に記録が有る場合
  } else {
    for (y = 0; y < 9; y++)
      for (x = 0; x < 9; x++) {
        if (TB[y][x] < 10 && TB[y][x] != WK[y][x]) {
          TB[y][x] += 10;
          RESULT = 2;
        }
      }
  }
}
// 数を置く
function SetNum(y, x, num, bit) {
  WK[y][x] = num;
  BY[y] += bit;
  BX[x] += bit;
  BB[parseInt(y / 3)][parseInt(x / 3)] += bit;
}
// 数を取る
function DelNum(y, x, bit) {
  WK[y][x] = 0;
  BY[y] -= bit;
  BX[x] -= bit;
  BB[parseInt(y / 3)][parseInt(x / 3)] -= bit;
}
// 確定処理
function Kakutei() {
  let y, x, num, bit, yr = 0,
    xr = 0,
    cnt, r, c;
  let flag = 1;

  while (flag != 0) {
    flag = 0;

    // ３×３ブロック
    for (r = 0; r < 3; r++)
      for (c = 0; c < 3; c++) {
        bit = 1;
        for (num = 1; num <= 9; num++) {
          if ((BB[r][c] & bit) == 0) { // numが未配置
            cnt = 0;
            // numを矛盾無く配置可能な場所を探す
            for (y = (r * 3); y < (r * 3 + 3) && cnt < 2; y++)
              for (x = (c * 3); x < (c * 3 + 3) && cnt < 2; x++) {
                if (WK[y][x] != 0) continue;
                if (((BY[y] | BX[x]) & bit) == 0) {
                  yr = y;
                  xr = x;
                  cnt++;
                }
              }
            if (cnt == 0) return 1; // 異常(どこにも配置不可)
            if (cnt == 1) { // 確定(配置可能位置１つ)
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
    for (y = 0; y < 9; y++) {
      bit = 1;
      for (num = 1; num <= 9; num++) {
        if ((BY[y] & bit) == 0) { // numが未配置
          cnt = 0;
          // numを矛盾無く配置可能な場所を探す
          for (x = 0; x < 9 && cnt < 2; x++) {
            if (WK[y][x] != 0) continue;
            if (((BB[parseInt(y / 3)][parseInt(x / 3)] | BX[x]) & bit) == 0) {
              yr = y;
              xr = x;
              cnt++;
            }
          }
          if (cnt == 0) return 1; // 異常(どこにも配置不可)
          if (cnt == 1) { // 確定(配置可能位置１つ)
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
    for (x = 0; x < 9; x++) {
      bit = 1;
      for (num = 1; num <= 9; num++) {
        if ((BX[x] & bit) == 0) { // numが未配置
          cnt = 0;
          // numを矛盾無く配置可能な場所を探す
          for (y = 0; y < 9 && cnt < 2; y++) {
            if (WK[y][x] != 0) continue;
            if (((BB[parseInt(y / 3)][parseInt(x / 3)] | BY[y]) & bit) == 0) {
              yr = y;
              xr = x;
              cnt++;
            }
          }
          if (cnt == 0) return 1; // 異常(どこにも配置不可)
          if (cnt == 1) { // 確定(配置可能位置１つ)
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
  return 0; // 正常終了
}

// 再帰探索処理
function Backtrack() {
  let y = 0,
    x = 0,
    num, bit, map, pos = SP;

  // 確定探索を実行し異常無しなら、未確定部分を再帰探索
  if (Kakutei() == 0) {
    // 未確定部分を探す
    for (y = 0; y < 9; y++) {
      for (x = 0; x < 9; x++)
        if (WK[y][x] == 0 && TB[y][x] < 10) break;
      if (x < 9) break;
    }

    if (y == 9) {
      Record(); // 解の記録
    } else {
      map = BY[y] | BX[x] | BB[parseInt(y / 3)][parseInt(x / 3)];
      bit = 1;
      for (num = 1; num <= 9; num++) {
        if ((map & bit) == 0) { // 矛盾無く配置可能なら
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
    y = SY[SP];
    x = SX[SP];
    bit = SB[SP];
    DelNum(y, x, bit);
  }
}
// 探索
function Computer() {
  // 初期クリアー
  for (y = 0; y < 9; y++) {
    BY[y] = BX[y] = 0;
    for (x = 0; x < 9; x++) {
      TB[y][x] = WK[y][x] = 0;
    }
  }
  for (y = 0; y < 3; y++)
    for (x = 0; x < 3; x++) {
      BB[y][x] = 0;
    }
  SP = RESULT = 0;

  // 問題取込み
  for (y = 0; y < 9; y++)
    for (x = 0; x < 9; x++) {
      num = EDIT[y][x];
      if (num != 0) {
        bit = 1 << (num - 1);
        if ((BY[y] & bit) != 0) RESULT = 3;
        if ((BX[x] & bit) != 0) RESULT = 3;
        if ((BB[parseInt(y / 3)][parseInt(x / 3)] & bit) != 0) RESULT = 3;
        SetNum(y, x, num, bit);
      }
    }

  // 探索
  if (RESULT == 0) {
    Backtrack();
    if (RESULT == 0) RESULT = 3;
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  show() {
    fill(128);
    ellipse(this.x * 40 + 40, this.y * 40 + 40, 20, 20);
  }
  up() {
    if (!cango(me.x, me.y - 1)) return -1;
    if (this.push(me.x, me.y, 0, -1) == -1) return -1;
    this.y -= 1;
  }
  down() {
    if (!cango(me.x, me.y + 1)) return -1;
    if (this.push(me.x, me.y, 0, 1) == -1) return -1;
    this.y += 1;
  }
  left() {
    if (!cango(me.x - 1, me.y)) return -1;
    if (this.push(me.x, me.y, -1, 0) == -1) return -1;
    this.x -= 1;
  }
  right() {
    if (!cango(me.x + 1, me.y)) return -1;
    if (this.push(me.x, me.y, 1, 0) == -1) return -1;
    this.x += 1;
  }
  push(x, y, dx, dy) {
    if (cango(x + dx, y + dy)) {
      if (this.rpush(x + dx, y + dy, dx, dy) == 0) {
        board[x + dx][y + dy] = 0;
        return 0;
      } else {
        return -1;
      };
    } else {
      return -1;
    }
  }
  rpush(x, y, dx, dy) {
    if (board[x][y] == 0) {
      return 0;
    }
    if (cango(x + dx, y + dy)) {
      if (this.rpush(x + dx, y + dy, dx, dy) == 0) {
        board[x + dx][y + dy] = board[x][y];
        return 0;
      } else {
        return -1;
      };
    } else {
      return -1;
    }
  }
}
var me = new Player(4, 4);

class undoArr {
  constructor() {
    this.arr = [];
  }
  undo() {
    if (this.arr.length > 0) {
      return this.arr.pop();
    }
    return [];
  }
  enqueue(arr) {
    this.arr.push(arr);
    if (this.arr.length > 10) {
      this.arr.shift();
    }
  }
}
var myundoArr = new undoArr;



function cango(x, y) {
  if (x < 0 || y < 0 || x >= 9 || y >= 9) {
    return false;
  }
  return true;
}


function setup() {
  createCanvas(600, 400);
  background(128);
  strokeWeight(3);
  sdraw();
}

let board = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 2, 0, 3, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 4, 0, 5, 0, 6, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 7, 0, 8, 0, 9, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

function colBoard() {
  let colb = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];
  for (i = 0; i < 9; i++) {
    let nlis = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let flg = 0;
    for (q = 0; q < 9; q++) {
      if (board[i][q]) {
        if (nlis[board[i][q] - 1]++) {
          flg = 1;
          break;
        }
      }
    }
    if (flg) {
      for (q = 0; q < 9; q++) {
        colb[i][q] = 1;
      }
    }
  }
  for (q = 0; q < 9; q++) {
    let nlis = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let flg = 0;
    for (i = 0; i < 9; i++) {
      if (board[i][q]) {
        if (nlis[board[i][q] - 1]++) {
          flg = 1;
          break;
        }
      }
    }
    if (flg) {
      for (i = 0; i < 9; i++) {
        colb[i][q] = 1;
      }
    }
  }
  for (i = 0; i < 9; i++) {
    let nlis = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let flg = 0;
    for (q = 0; q < 9; q++) {
      if (board[(i / 3 | 0) * 3 + (q / 3 | 0)][i % 3 * 3 + q % 3]) {
        if (nlis[board[(i / 3 | 0) * 3 + (q / 3 | 0)][i % 3 * 3 + q % 3] - 1]++) {
          flg = 1;
          break;
        }
      }
    }
    if (flg) {

      for (q = 0; q < 9; q++) {
        colb[(i / 3 | 0) * 3 + (q / 3 | 0)][i % 3 * 3 + q % 3] = 1;
      }
    }
  }
  return colb;
}

class Score {
  constructor() {
    this.score = this.calc(board);
  }
  calc(b) {
    let cnt = 0;
    for (let i = 0; i < 9; i++) {
      for (let q = 0; q < 9; q++) {
        if (b[i][q]) cnt++;
      }
    }
    return cnt;
  }
  show() {
    this.score = this.calc(board);
    fill(255);
    textSize(50);
    text("SCORE", 400, 50, 200, 200);
    text(str(this.score), 400, 100, 200, 200);
  }
}
var myScore = new Score;

function sdraw() {
  let i = 0;
  let q = 0;
  background(128);
  textSize(30);
  textAlign(CENTER, CENTER);
  //applyMatrix(.5, 0, 0, .5, 0, 0);
  strokeWeight(3);
  let CB = colBoard();
  for (i = 0; i < 9; i++) {
    for (q = 0; q < 9; q++) {
      //fill(i*30-q*15+100);
      fill(255, 255 - CB[i][q] * 255, 255 - CB[i][q] * 255);
      rect(20 + 40 * i, 20 + 40 * q, 40, 40);
      fill(0);
      if (board[i][q]) {
        text(str(board[i][q]), 20 + 40 * i, 20 + 40 * q, 40, 40);
      }
    }
  }
  strokeWeight(6);
  for (i = 0; i < 3; i++) {
    for (q = 0; q < 3; q++) {
      //fill(i*30-q*15+100);
      noFill();
      rect(20 + 40 * i * 3, 20 + 40 * q * 3, 120, 120);
    }
  }
  strokeWeight(3);
  me.show();
  myScore.show();

  if (myScore.score == 81) {
    textSize(60);
    fill(0);
    text("Clear!", 327, 77, 360, 360);
    fill(255);
    text("Clear!", 322, 72, 360, 360);
    fill(255, 100, 100);
    text("Clear!", 325, 75, 360, 360);
  }
}

function draw() {
  //sdraw();
}

function Comp() {
  for (i = 0; i < 9; i++) {
    for (q = 0; q < 9; q++) {
      EDIT[i][q] = board[i][q];
    }
  }
  Result = 0;
  Computer();
  if (RESULT == 2) {
    fill(0, 128);
    //rect(0,0,width,height);
  }
  for (y = 0; y < 9; y++) {
    for (x = 0; x < 9; x++) {
      if (EDIT[y][x]) {
        board[y][x] = EDIT[y][x];
      } else if (RESULT != 3) {
        if (TB[y][x] > 10) {
          board[y][x] = 0;
        } else {
          board[y][x] = TB[y][x];
        }
      }
    }
  }
}

function now2memory() {
  let arr = [];
  for (i = 0; i < 9; i++) {
    for (q = 0; q < 9; q++) {
      arr.push(board[i][q]);
    }
  }
  arr.push(me.x);
  arr.push(me.y);
  return arr;
}

function memory2now(arr) {
  for (i = 0; i < 81; i++) {
    board[Math.floor(i / 9)][i % 9] = arr[i];
  }
  me.x = arr[81];
  me.y = arr[82];
}

function makeMemory() {
  myundoArr.enqueue(now2memory());
}

function getundo() {
  let a = myundoArr.undo();
  if (a.length > 0) {
    memory2now(a);
  }
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    makeMemory();
    me.left();
    sdraw();
    Comp();
  }
  if (keyCode === RIGHT_ARROW) {
    makeMemory();
    me.right();
    sdraw();
    Comp();
  }
  if (keyCode === UP_ARROW) {
    makeMemory();
    me.up();
    sdraw();
    Comp();
  }
  if (keyCode === DOWN_ARROW) {
    makeMemory();
    me.down();
    sdraw();
    Comp();
  }
  if (keyCode == 90) {
    getundo();
  }
  sdraw();
}

function smartPack(x) {
  makeMemory();
  switch (x) {
    case 0:
      me.up();
      break;
    case 1:
      me.down();
      break;
    case 2:
      me.left();
      break;
    case 3:
      me.right();
      break;
  }
  sdraw();
  Comp();
  sdraw();
}

//smartphone
var SmartVec = [0, 0];

function touchStarted() {
  SmartVec = [0, 0];
  timecnt=0;
}

function touchMoved() {
  SmartVec[0] += mouseX - pmouseX;
  SmartVec[1] += mouseY - pmouseY;
  if(timecnt>-1){
    timecnt+=1;
  }
}

function touchEnded() {
  VAL=50;
  let x = SmartVec[0];
  let y = SmartVec[1];
  SmartVec = [0, 0];
  if (abs(x)<abs(2*y) && abs(2*x)>abs(y)) {
    return;
  }
  if(abs(x) <= VAL && abs(y) <= VAL){
    getundo();
    sdraw();
    return;
  }
  if (abs(x) > abs(y)) {
    x>0 ? smartPack(3) : smartPack(2) ;
  }else{
    y>0 ? smartPack(1) : smartPack(0) ;
  }
}