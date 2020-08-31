let posX = 0;

class ball {
  constructor(x, y, dx, dy, rot) {
      this.x = x;
      this.y = y;
      this.dx = dx;
      this.dy = dy;
      this.rot = rot;
  }
  mydraw(){
    fill(0,0,255);
    translate(this.x,this.y);
    rotate(this.rot / 6);
    ellipse(0, 0, this.dx, this.dy);
    rotate(-this.rot / 6);
    translate(-this.x,-this.y);
  }
}

let balls=[];

let gazo;

function preload() {
 gazo = loadImage('eto10.jpg');
}

function setup() {
  createCanvas(200, 200);
  imageMode(CENTER);
  image(gazo, width/2, height/2);
  for(i=0;i<12;i++){
    let ball_a = new ball((1+cos(TWO_PI*i/12))*50, (1+sin(TWO_PI*i/12))*50, 30, 50, 0);
    balls[i]=ball_a;
  }

}

function draw() {
  background(220);
  let step=frameCount%100;
  let angle = map(step, 0, 100, 0, TWO_PI);
  //rotate(frameCount/100.0);

  //中心回転
  // applyMatrix(cos(angle),sin(angle),-sin(angle),cos(angle),width/2,height/2);
  // image(gazo, 0, 0);
  // resetMatrix();
  
  //中心反転
  // applyMatrix(cos(angle),0,0,1,width/2,height/2);
  // image(gazo, 0, 0);
  // resetMatrix();

  //倒れる
  // newangle=min(angle,TWO_PI/4);
  // applyMatrix(cos(newangle),sin(newangle),-sin(newangle),cos(newangle),width/2,height/2);
  // image(gazo, 0, 0);
  // resetMatrix();


  ellipse(posX,100,30,30);
  
  posX += 1;
  
  if(posX > 200){
    posX = 0;
  }
  for(i=0;i<balls.length;i++){
    balls[i].mydraw();
    balls[i].rot+=0.1;
  }
  //ball_a.mydraw();
}