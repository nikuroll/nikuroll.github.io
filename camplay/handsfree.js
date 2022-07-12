let capture;
// webカメラのロードフラグ
let videoDataLoaded = false;

let handsfree;

let cammode = 2;

const circleSize = 12;

const targetIndex = [4, 8, 12, 16, 20];
const upmouseIndex = [310,311,312,13,80,81,82];
const downmouseIndex = [318,317,402,14,87,178,88];
const lefteyeindex = [159];
const righteyeindex = [386];
const palette = ["#ff0000", "#ff0000", "#ff0000", "#ff0000", "#ff0000"];

let slider;

let faceCenterLog = [];

var farvaria=0.1;

function preload() {
  picsD=loadImage("./img/Deny.png");
  picsK=loadImage("./img/Nod.png");
  picsN=loadImage("./img/None.png");
  picsR=loadImage("./img/Raise.png");
  picsS=loadImage("./img/Speak.png");
  picsT=loadImage("./img/Think.png");
  picsW=loadImage("./img/Wait.png");
}

function setup() {
  // slider = createSlider(0, 255, 100);
  // slider.position(10, 10);
  // slider.style('width', '80px');

  frameRate(15);

  imageMode(CENTER);


  // webカメラの映像を準備
  capture = createCapture(VIDEO);

  // 映像をロードできたらキャンバスの大きさを設定
  capture.elt.onloadeddata = function () {
    videoDataLoaded = true;
    createCanvas(capture.width, capture.height);
  };

  // 映像を非表示化
  capture.hide();

  // handsfreeのhandモデルを準備
  handsfree = new Handsfree({
    showDebug: false,
    hands: true,
    facemesh: true
  });

  // handsfreeを開始
  handsfree.start();
}

function draw() {
  // 映像を左右反転させて表示
  push();
  translate(width, 0);
  scale(-1, 1);
  background(0);

  if (cammode == 0)image(capture, width/2, height/2, width, height);
  pop();

  // 顔の頂点を表示
  drawFace();

  // 手の頂点を表示
  drawHands();

  // ラベル追加
  label = classfy();
  drawlabel(label);

  //drawSymbol
  if(cammode==2)drawSymbol(label);
}

function average(data)
{
    var sum = {x:0.0,y:0.0};
    for (i=0; i<data.length; i++) {
      sum.x = sum.x + data[i].x;
      sum.y = sum.y + data[i].y;
    }
    sum.x/=data.length;
    sum.y/=data.length;
    return sum;
}

function variance(data)
{
    // 平均値を求める
    var ave = average(data);
 
    var varia = {x:0.0,y:0.0};
    for (i=0; i<data.length; i++) {
        varia.x = varia.x + Math.pow(data[i].x - ave.x, 2);
        varia.y = varia.y + Math.pow(data[i].y - ave.y, 2);
    }
    varia.x/=data.length;
    varia.y/=data.length;
    return varia;
}

var eyedist=0.3;
function drawFace() {
  const face = handsfree.data?.facemesh;
  faceCenterAve = {x:0,y:0};

  if(!face?.multiFaceLandmarks) return;

  // console.log(face.multiFaceLandmarks[0]);
  lefteye=face.multiFaceLandmarks[0][lefteyeindex[0]];
  righteye=face.multiFaceLandmarks[0][righteyeindex[0]];
  eyedist=dist(lefteye.x,lefteye.y,righteye.x,righteye.y);
  // console.log(eyedist);


  message = "";


  face.multiFaceLandmarks.forEach((facepoint,faceindex) => {
    facepoint.forEach((landmark,landmarkindex) =>{
      fill(255*landmarkindex/460);
      if(cammode==1)circle(width - landmark.x * width, landmark.y * height, circleSize/2);

      faceCenterAve.x += landmark.x;
      faceCenterAve.y += landmark.y;
      

      if (dist(width - landmark.x * width, landmark.y * height,mouseX,mouseY) < 6){
        message = landmarkindex;
        fill(255);
        textSize(60);
        text(landmarkindex,50,50);
      }
      
    });
    faceCenterAve.x /= facepoint.length;
    faceCenterAve.y /= facepoint.length;

    faceCenterLog.push(faceCenterAve);
    fill(100,100,255);
    mycircle(faceCenterAve.x, faceCenterAve.y);
  });

  drawMouse(face);
}

function mycircle(x,y){
  if (cammode!=1)return;
  circle(width - x * width, y * height, circleSize/2);
}

function drawMouse(face){
  upMouseAve = {x:0,y:0};
  downMouseAve = {x:0,y:0};
  allMouseAve = {x:0,y:0};

  for(let i=0;i<upmouseIndex.length;i++){
    fill(255,12,12);
    landmark = face.multiFaceLandmarks[0][upmouseIndex[i]];
    if(cammode==1)circle(width - landmark.x * width, landmark.y * height, circleSize/2);

    upMouseAve.x += landmark.x;
    upMouseAve.y += landmark.y;
    allMouseAve.x += landmark.x;
    allMouseAve.y += landmark.y;
  }

  for(let i=0;i<downmouseIndex.length;i++){
    fill(12,255,12);
    landmark = face.multiFaceLandmarks[0][downmouseIndex[i]];
    if(cammode==1)circle(width - landmark.x * width, landmark.y * height, circleSize/2);

    downMouseAve.x += landmark.x;
    downMouseAve.y += landmark.y;
    allMouseAve.x += landmark.x;
    allMouseAve.y += landmark.y;
  }

  upMouseAve.x /= upmouseIndex.length;
  downMouseAve.x /= downmouseIndex.length;
  allMouseAve.x /= upmouseIndex.length + downmouseIndex.length;
  upMouseAve.y /= upmouseIndex.length;
  downMouseAve.y /= downmouseIndex.length;
  allMouseAve.y /= upmouseIndex.length + downmouseIndex.length;
  // mycircle(allMouseAve.x,allMouseAve.y);


  //拡張
  // voiceSize = slider.value() / 255 + 1;
  voiceSize = 0;
  for(let i=0;i<upmouseIndex.length;i++){
    fill(208,12,12);
    landmark = face.multiFaceLandmarks[0][upmouseIndex[i]];
    mycircle((landmark.x - allMouseAve.x)*voiceSize + allMouseAve.x, (landmark.y - allMouseAve.y)*voiceSize + allMouseAve.y);
  }

  for(let i=0;i<downmouseIndex.length;i++){
    fill(12,128,12);
    landmark = face.multiFaceLandmarks[0][downmouseIndex[i]];
    mycircle((landmark.x - allMouseAve.x)*voiceSize + allMouseAve.x, (landmark.y - allMouseAve.y)*voiceSize + allMouseAve.y);
  }
}

function drawHands() {
  const hands = handsfree.data?.hands;

  // 手が検出されなければreturn
  if (!hands?.multiHandLandmarks) return;

  // 手の数だけlandmarkの地点にcircleを描写
  hands.multiHandLandmarks.forEach((hand, handIndex) => {
    hand.forEach((landmark, landmarkIndex) => {
      // 指先だけ色を変更
      switch (landmarkIndex) {
        case 4:
          fill(palette[0]);
          break;
        case 8:
          fill(palette[1]);
          break;
        case 12:
          fill(palette[2]);
          break;
        case 16:
          fill(palette[3]);
          break;
        case 20:
          fill(palette[4]);
          break;
        default:
          fill(color(255, 255, 255));
      }
      mycircle(landmark.x, landmark.y, circleSize);
    });
  });
}

function drawlabel(label){
  // Draw the label
  fill(255);
  textSize(16);
  textAlign(CENTER);
  text(label, width / 2, height - 4);
}

let knockflg=0;
let denyflg=0;
let duration =5;
function classfy(){
  knockflg-=1;
  denyflg-=1;

  nowclass = "Wait";
  if (openMouse()){
    nowclass = "Speak";
  }

  handsign = handsCheck();
  if (handsign){
    nowclass = handsign;
  }

  f=knock();
  if(f)knockflg=duration;

  if(knockflg>0){
    nowclass = "Nod";
  }

  f=deny();
  if(f)denyflg=duration;

  if(denyflg>knockflg && denyflg>0){
    nowclass = "Deny";
  }

  
  if (!is_face()){
    nowclass = "None";
  }
  return nowclass;
}

function knock(){
  if (faceCenterLog.length<5){
    return false;
  }
  newst = faceCenterLog.slice(-1)[0];
  oldst = faceCenterLog.slice(-3)[0];

  //console.log(abs(newst.y-oldst.y)*height);
  return abs(newst.x-oldst.x)*width < 6 && abs(newst.y-oldst.y)*height>20;

}

function deny(){
  if (faceCenterLog.length<5){
    return false;
  }
  newst = faceCenterLog.slice(-1)[0];
  oldst = faceCenterLog.slice(-3)[0];

  //console.log(abs(newst.y-oldst.y)*height);
  return abs(newst.y-oldst.y)*height < 6 && abs(newst.x-oldst.x)*width>20;

}

function handsCheck(){
  const hands = handsfree.data?.hands;

  // 手が検出されなければfalse
  if (!hands?.multiHandLandmarks || faceCenterLog.length<5) return false;

  handsAve = {x:0,y:0};

  hands.multiHandLandmarks.forEach((hand, handIndex) => {
    hand.forEach((landmark, landmarkIndex) => {
      handsAve.x += landmark.x;
      handsAve.y += landmark.y;
    });

    handsAve.x /= hand.length;
    handsAve.y /= hand.length;

    // fill(255,255,0);
    // circle(width-handsAve.x*width,handsAve.y*height,24)

  });

  if (abs(handsAve.x - faceCenterLog.slice(-1)[0].x) > 0.25){
    return "Raise";
  }else{
    return "Thinking";
  }

}

function is_face(){
  const face = handsfree.data?.facemesh;
  if(face?.multiFaceLandmarks) return true;
  return false;
}

function openMouse(){
  return is_face() && abs(upMouseAve.y - downMouseAve.y) > 0.01;
}

function drawSymbol(fg){
  // if (!is_face()){farvaria=0.1};
  pictsize=height*20*eyedist*eyedist;
  console.log(pictsize);
  

  switch (fg) {
    case "Deny":
      pic=picsD;
      break;
    case "Nod":
      pic=picsK;
      break;
    case "None":
      pic=picsN;
      break;
    case "Raise":
      pic=picsR;
      break;
    case "Speak":
      pic=picsS;
      break;
    case "Thinking":
      pic=picsT;
      break;
    case "Wait":
      pic=picsW;
      break;
  }
  pw = width/2;
  ph = height/2;
  if(faceCenterLog.length>5 && fg!="wait"){
    pw=width - faceCenterLog.slice(-1)[0].x * width;
    ph=faceCenterLog.slice(-1)[0].y * height;
  }
  image(pic,pw,ph,pictsize,pictsize);
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    cammode = 0;
  } else if (keyCode === UP_ARROW) {
    cammode = 1;
  } else if (keyCode === RIGHT_ARROW) {
    cammode = 2;
  }
}