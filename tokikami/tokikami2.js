img=[];
maisu=50
extra=maisu+maisu/4+(maisu%4>0?1:0)-1
lim=30
var BSIZE=600
var SSIZE=BSIZE/2
var YRATE=1.4

function preload(){
  for(let i=0;i<maisu;i++){
    img[i]= loadImage("tsk2/taisaku%20("+(i+1)+").JPG");
    //C:\Users\sakurai\Desktop\pppppwork\tokikami\pict2\tokikami\tokikami (8).PNG
  }
}

function setup() {
    createCanvas(1000,BSIZE);
    createElement("br");
    /*
    for(q=0;q<50;q++){
      if(q%5==0)createElement("br");
      createInput().attribute('placeholder', q+1);;
    }
    */

    frameRate(1);
    textSize(100);
    fill(255);
    background(128);
    text("Click to Start",50,200,800,800);
    noLoop();
}

start=false;
function mouseClicked(){
  if(!start){loop();start=true}
}

function touchStarted(){
  mouseClicked();
}

i=1
maime=-1

function draw(){
  if(!start){
    return -1;
  }
  i--;
  if(i==0){
    maime++;
    i=lim;
  }
  if(maime>=extra){
    background(128);
    text("Finish!",200,200,800,800);
    noloop();
  }else if(maime<50){
    background(128);
    text(("00"+str(i)).slice(-2),BSIZE*YRATE,100,200,200);
    image(img[maime],0,0,BSIZE*YRATE,BSIZE);
  }else{
    background(128);
    ex=maime-50;
    if(4*ex+0<maisu){image(img[4*ex],0,0,SSIZE*YRATE,SSIZE);}
    if(4*ex+1<maisu){image(img[4*ex+1],0,SSIZE,SSIZE*YRATE,SSIZE);}
    if(4*ex+2<maisu){image(img[4*ex+2],SSIZE*YRATE,0,SSIZE*YRATE,SSIZE);}
    if(4*ex+3<maisu){image(img[4*ex+3],SSIZE*YRATE,SSIZE,SSIZE*YRATE,SSIZE);}
    text(("00"+str(i)).slice(-2),BSIZE*YRATE,100,200,200);

  }
  
}
 
