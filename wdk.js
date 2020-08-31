let gazo;
let nowmode=0;
let check=0;
let s="Clear";
let field;

function preload() {
 gazo = loadImage('eto10.jpg');
 k1=loadImage('kt1.png');
 k2=loadImage('kt2.png');
 k3=loadImage('kt3.png');
 k4=loadImage('kt4.png');
}

function setup() {
  createCanvas(800, 800);
  createDiv("<br>");
  field = createInput("");
  field.size(100);
  field.attribute('placeholder', '漢字1文字');
  field.attribute('maxlength', '1');
  select(field);
  //field2 = createElement("button","ooo");
  //field.style(value,"www");
  button = createButton("GO","submit");
  button.mousePressed(checkAns);
  //button.attribute('type', 'submit');
  imageMode(CENTER);
  image(gazo, width/2, height/2);
  nowmode=0;
  textSize(100);
  tweet = createElement()
  noLoop();

}

function draw() {
  background(255);
  fill(189,183,107);
  ellipse(width/2,width/2,width,height);
  let step=(frameCount-1)%100;
  let angle = map(step, 0, 100, 0, TWO_PI);
  if(nowmode>=2){
    let step=(frameCount-1-check)%100;
    let angle = map(step, 0, 100, 0, TWO_PI);
    applyMatrix(1,0,0,1,width/2,height/2);
    applyMatrix(cos(angle),sin(angle),-sin(angle),cos(angle),0,0);
    applyMatrix(1,0,0,1,-width/2,-height/2);
  }

  //中心回転
  push();
  applyMatrix(cos(angle),sin(angle),-sin(angle),cos(angle),width/2,height/2-250);
  image(k1, 0, 0);
  pop();
  
  //中心反転
  push()
  let a=1;
  if(Math.floor(step/50)%2==0){
    var newstep=100/(1+exp(-1*(step%100-25)*a));
    var newangle= map(newstep, 0, 100, 0, PI);
  }else{
    var newstep=100/(1+exp(-1*(step%100-75)*a));
    var newangle=map(newstep, 0, 100, PI, 0);
  }
  applyMatrix(cos(newangle),0,0,1,width/2-250,height/2);
  image(k2, 0, 0);
  pop()

  //倒れる
  push();
  newangle=min(angle,TWO_PI/4);
  applyMatrix(cos(newangle),sin(newangle),-sin(newangle),cos(newangle),width/2,height/2+250);
  image(k3, 0, 0);
  pop();
  //覆う
  let siz=200;
  newstep=min(step,80);
  push();
  applyMatrix(1,0,0,1,width/2+250,height/2);
  image(k4, 0, 0);
  if(nowmode>0){
    fill(128);
   rect(160-2*newstep-siz/2,160-2*newstep-siz/2,siz,siz);
  }
  pop();

  //四角
  fill(255);
  rect(width/2-100,height/2-100,200,200);

  pop();
   if(nowmode==1.9){
    resetMatrix();
    let s="大謎募集中";
    fill(255);
    text(s, 250, 300, 1000, 200); 
  }
  if(nowmode>=2){
    resetMatrix();
    let s="Clear!!";
    fill(0,128);
    rect(0,0,width,height);
    fill(255);
    text(s, 250, 300, 1000, 200); 
  }

}

function nextStage(){
  loop();
  nowmode+=1;
  if(nowmode==2){
    check=frameCount;
    createClearMessage();
  }
}

function checkAns(){
  let ans=field.value();
  if((ans=="回"&&nowmode==0)||(ans=="転"&&nowmode==1)||(nowmode==2)){
    nextStage();
  }
  field.value("");
}

function mouseClicked(){
  //nextStage();
}

function keyPressed(){
  if(keyCode==13){
    checkAns();
  }
}

function createClearMessage() {
  const clearMessage = "なんか解けた！";

  //ツイートボタンのDOM生成
  document.getElementById("tweetBtn").innerHTML =
      '<a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-size="large"data-text="' +
      clearMessage +" "+getURL() + '" data-hashtags="#にくわどう謎">Tweet</a>';

  //ツイートボタン再構築
  twttr.widgets.load();
}