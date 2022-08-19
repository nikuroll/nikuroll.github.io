let test0;
let mapWidth=4;
let mapHeight=4;
const map=["S",".",".","#",".","#",".",".",".",".","#",".",".","#","G","."];
var pos=0;
var oldcom=4;
var cool=0;
var board="↓←→↑A↓←→↑";
var board="A←A↑A↓A→A";
let start = new Date();


function setup() {
 createCanvas(360, 720);
 const rad1=0;
const rad2=TWO_PI*7/16;
const rad3=TWO_PI*9/16;
 test0 = new Fish(180,180);
 noStroke();
 textAlign(CENTER,CENTER);
 tweet = createElement();
}

function draw() {
strokeCap(SQUARE);
 noStroke();
 background(0);
 applyMatrix(0.8,0,0,0.8,36,36);
 fill(200,200,255);
 rect(-15,-15,390,390);
 stroke(128);
 strokeWeight(1);
 for(let i=1;i<3;i++){
    line(130*i-15,-15,130*i-15,375);
 }
 for(let i=1;i<3;i++){
  line(-15,130*i-15,375,130*i-15);
}
 test0.display();
 resetMatrix();
 test0.turn();
 test0.walk(noise(frameCount*2)*5);
 printMaps();
 useCommand();

 touchdraw();
}

function touchdraw(){
    if (mouseIsPressed) {
        fill(255,255,0);
        ellipse(mouseX, mouseY, 50, 50);
      }
}

class Fish {
 constructor(x,y) {
   noStroke();
   this.x=x;
   this.y=y;
   this.rot=0;
   this.siz=30;
 }
 display() {
   //ellipse(this.position.x, this.position.y, this.diameter, this.diameter);
   fill(0,0,128,250);
   const rad1=0;
   const rad2=TWO_PI*7/16;
   const rad3=TWO_PI*9/16;
   this.x1=this.x+this.siz*cos(rad1+this.rot);
   this.y1=this.y+this.siz*sin(rad1+this.rot);
   this.x2=this.x+this.siz*cos(rad2+this.rot);
   this.y2=this.y+this.siz*sin(rad2+this.rot);
   this.x3=this.x+this.siz*cos(rad3+this.rot);
   this.y3=this.y+this.siz*sin(rad3+this.rot);
   triangle(this.x1,this.y1,this.x2,this.y2,this.x3,this.y3);
   this.turn();
   //ellipse(this.position.x, this.position.y, this.diameter, this.diameter);
 }
 turn(){
   this.n=noise(frameCount/500);
   this.rot=this.n*TWO_PI*5;
 }
 walk(speed){
   this.x+=speed*cos(this.rot);
   this.y+=speed*sin(this.rot);
   this.checkNowPos();
 }
 checkNowPos(){
   if(this.x>width){this.x=width-1};
   if(this.x<0){this.x=0};
   if(this.y>height/2){this.y=height/2-1};
   if(this.y<0){this.y=0};
 }
}

function getCommand(){
  x=floor(test0.x*3/width); y=floor(test0.y*3/width);
  return 3*x+y;
}

function printCommand(com){
  textSize(40);
  stroke(0);
  strokeWeight(4);
  fill(255);
  let s="Command: " + board.charAt(com);
  fill(255);
  text(s, 0, width-30, 360, 60); 
}

function useCommand(){
  cool+=1;
  com=getCommand();
  printCommand(com);
  if(cool%60==0 || com!=oldcom){
    Move(board.charAt(com));
    cool=0;
  }
  oldcom=com;
}

function printMaps(){
  noStroke();
  applyMatrix(0.8,0,0,0.8,36,36+width);
  printArrow();
  fill(128);
  rect(-15,-15,390,390);
  fill(255);
  rect(0,0,360,360);

  stroke(0);
  strokeWeight(calcWallType(pos,'↑'));
  line(0,0,360,0);
  strokeWeight(calcWallType(pos,'↓'));
  line(0,360,360,360);
  strokeWeight(calcWallType(pos,'→'));
  line(360,0,360,360);
  strokeWeight(calcWallType(pos,'←'));
  line(0,0,0,360);

  noFill();
  stroke(204);
  strokeWeight(20);
  rect(-5,-5,370,370);

  fill(0);

  printMapWord(pos);

  resetMatrix();
}

function printArrow(){
  arrowRad=calcArrow(pos,14);
  //text(pos, 0, 100, width, 200); 
  stroke(255);
  strokeWeight(18);
  arrs=290;
  arrs2=90;
  strokeCap(ROUND);
  line(180-arrs*cos(arrowRad),180-arrs*sin(arrowRad),180+arrs*cos(arrowRad),180+arrs*sin(arrowRad));
  line(180+arrs*cos(arrowRad),180+arrs*sin(arrowRad),180+arrs*cos(arrowRad)-arrs2*cos(arrowRad-TWO_PI/9),180+arrs*sin(arrowRad)-arrs2*sin(arrowRad-TWO_PI/9));
  line(180+arrs*cos(arrowRad),180+arrs*sin(arrowRad),180+arrs*cos(arrowRad)-arrs2*cos(arrowRad+TWO_PI/9),180+arrs*sin(arrowRad)-arrs2*sin(arrowRad+TWO_PI/9));
  stroke(0);
  strokeWeight(12);
  strokeCap(ROUND);
  line(180-arrs*cos(arrowRad),180-arrs*sin(arrowRad),180+arrs*cos(arrowRad),180+arrs*sin(arrowRad));
  line(180+arrs*cos(arrowRad),180+arrs*sin(arrowRad),180+arrs*cos(arrowRad)-arrs2*cos(arrowRad-TWO_PI/9),180+arrs*sin(arrowRad)-arrs2*sin(arrowRad-TWO_PI/9));
  line(180+arrs*cos(arrowRad),180+arrs*sin(arrowRad),180+arrs*cos(arrowRad)-arrs2*cos(arrowRad+TWO_PI/9),180+arrs*sin(arrowRad)-arrs2*sin(arrowRad+TWO_PI/9));
}

function printMapWord(pos){
  switch(map[pos]){
    case ".":
      break;
    case "#":
      break
    case "S":
      noStroke();
      textSize(300);
      text(map[pos],50,0,360,360);

      break;
    case "G":
      noStroke();
      textSize(300);
      text(map[pos],50,0,360,360);
      fill(0,128);
      rect(-15,-15,390,390);
      textSize(120);
      fill(255);
      text("Clear!",25,75,360,360);
      createClearMessage();
      noLoop();
      break;
  }
}

function calcWallType(pos,waystr){
  h=2;
  m=20;
  b=40;
  switch(waystr){
    case "↑":
      if(pos>=mapWidth){
        if(map[pos-mapWidth]=="#"){return b;}else{return h;}
      }else{return m;}
      break;
    case "↓":
      if(mapHeight*mapWidth>pos+mapWidth ){
        if(map[pos+mapWidth]=="#"){return b;}else{return h;}
      }else{return m;}
      break;
    case "←":
      if(pos%mapWidth>0){
        if (map[pos-1]=='#'){return b;}else{return h;}
      }else{return m;}
      break;
    case "→":
      if(pos%mapWidth<mapWidth-1){
        if (map[pos+1]=="#"){return b;}else{return h;}
      }else{return m;}
      break;
  }
}

function calcArrow(now,goal){
  let x1,x2,y1,y2;
  x1=now%mapWidth;
  x2=goal%mapWidth;
  y1=floor(now/(mapHeight));
  y2=floor(goal/(mapHeight));
  return atan2(y2-y1,x2-x1);
}

function Move(strcom){
  switch(strcom){
    case "A":
      break;
    case "↑":
      if(pos>=mapWidth && map[pos-mapWidth]!="#"){
        pos-=mapWidth;
      }
      break;
    case "↓":
      if(mapHeight*mapWidth>pos+mapWidth && map[pos+mapWidth]!="#"){
        pos+=mapWidth;
      }
      break;
    case "←":
      if(pos%mapWidth>0 && map[pos-1]!="#"){
        pos-=1;
      }
      break;
    case "→":
      if(pos%mapWidth<mapWidth-1 && map[pos+1]!="#"){
        pos+=1;
      }
      break;
  }
}

function createClearMessage() {
  var stop = new Date();

  // 経過時間をミリ秒で取得
  var ms = stop.getTime() - start.getTime();
  var s = ms / 1000;

  const clearMessage = "挑戦的web謎『鯊』を"+s+"秒で解いていた！";

  //ツイートボタンのDOM生成
  document.getElementById("tweetBtn").innerHTML =
      '<a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-size="large"data-text="' +
      clearMessage + '" data-hashtags="ハゼHAZE">Tweet</a>';

  //ツイートボタン再構築
  twttr.widgets.load();
}

