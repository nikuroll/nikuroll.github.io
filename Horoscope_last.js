var Balls=[];
let MAX_BALLS=800;
let limit=MAX_BALLS;
let quake=0;

function setup(){
  let canvas=createCanvas(640, 480);
  canvas.parent('canvas');
  background(0);

  
  noFill();
  fill(0);
  for(var i=0;i<MAX_BALLS;i++){
    Balls[i]=new Ball(random(0),random(TWO_PI));
  }
  //slider=createSlider(0, MAX_BALLS, 1);
  limit=MAX_BALLS;
}

function draw(){
  colorMode(RGB);
  fill(0,0,0,10);
  noStroke();
  rect(0,0,width,height);
  translate(width/2, height/2);
  translate(random(quake)-quake/2,random(quake)-quake/2);
  quake*=0.8;

  //rotate(frameCount/500);
  //scale(map(sin(frameCount/100),-1,1,0.8,1.2));

  noFill();
  colorMode(HSB);
  /*
  strokeWeight(4);
  for(var i=0;i<8;i++){
    drawTriangle(110,color(120,128-i*16,255),(-i*2-frameCount*3)/300);
  }

  strokeWeight(5);
  for(var i=0;i<8;i++){
    drawTriangle(240,color(0,128-i*16,255),(i+frameCount*3)/300);
  }
  */
 

  strokeWeight(5);
  for(i=0;i<limit;i++){
    Balls[i].update();
    Balls[i].mydraw();
  }
  
}

function drawTriangle(siz=240,col=color(255),ang=0){
  stroke(col);
  push();
  rotate(ang);
  triangle(siz, 0, -siz/2, siz*sqrt(3)/2, -siz/2, -siz*sqrt(3)/2);
  pop();
}

class Ball{
  constructor(r,ang){
    this.r=r;
    this.ang=ang;
    this.mode=0;
    this.col=(128,128,128);
    this.p=0;
  }

  mydraw(){
    stroke(this.col);
    point(this.r*cos(this.ang), this.r*sin(this.ang));
  }

  update(){
    switch(this.mode){
      case 0:
        this.r+=2;
        break;
      case 1:
        this.ang+=0.02;
        break;
      case 2:
        this.r-=2;
        break;
      case 3:
        this.ang-=0.02;
        break;
    }
    this.modeChange();

    this.col=color(map(mod(this.ang+frameCount/50,TWO_PI),0,TWO_PI,0,255),map(this.r,height/4,height*2/3,0,128),255);
  }

  modeChange(){
    if(random(100)<this.p){
      this.p=0;
      this.mode=this.mode+1;
      this.mode=this.mode%4;
    }else{
      this.p+=0.01;
    }
    if(this.r>height*2/3){
      this.mode=2;
    }
    if(this.r<height/5){
      this.mode=0;
    }

    //this.mode=1;
  }

}

function mod(i,j){
  return i%j<0 ? (i%j)+0+(j<0? -j: j) : (i % j + 0);
}

function mouseClicked(){
  let x = mouseX-width/2;
  let y = mouseY-height/2;
  let dis = x*x+y*y;
  if(96*96<dis && dis<320*320){
    limit-=8;
    quake+=100;
  }
}

function touchStarted(){
  /*
  if(touches.length > 0){
    let x = mouseX-width/2;
    let y = mouseY-height/2;
    let dis = x*x+y*y;
    if(96*96<dis && dis<320*320){
      */
      limit-=8;
      quake+=100;
  /*  }
  }*/
}