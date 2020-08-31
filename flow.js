var w = 400;
var h = 400;
var n = 200
var maxR = 95;
var minR = 5;
let balls=[];
var dist=1;
class ball {
  constructor(x, y, col) {
      this.x = x;
      this.y = y;
      this.col = col;
  }
  mydraw(){
    drawParticle(x,y,col);
    this.y+=1;
  }
}

function setup() {
  createCanvas(w, h);
  background(0);
  blendMode(SCREEN);
  
  var x = random(w);
  var y = 0;
  var cr = random([[3,0,3], [0,3,3], [3,3,0], [0,0,0]]);
  let nb=new ball(x,y,cr);
  balls[0]=nb;
  
  
}

function draw() {
  noLoop();
  stroke(255, 50);
  for(x = -w * 10; x < 11 * w;x+= 100){
    line(x, h, 200, -5);
  }
  var k = 5;
  for(y = 0; y < h;y+= k){
    line(0, y, w, y);
    k += 3;
  }
  noStroke();

  if(frameCount%dist==0){
    var x = random(w);
    var y = random(w);
    var cr = random([[3,0,3], [0,3,3], [3,3,0], [0,0,0]]);
    balls[frameCount]=new ball(x,y,cr);
  }
  
  
  for(i=0;i < balls.length;i++){
    balls[i].mydraw();
  }
  
}

function drawParticle(i){
  var r = i / (n / (maxR - minR)) + minR;
  var x = random(w);
  var y = pow((h / n) * i, 2) / h;
  var cr = random([[3,0,3], [0,3,3], [3,3,0], [0,0,0]]);
  for(j=0;j < r;j++){
    var alph = pow(j, 6) * 255 / pow(r, 6);
    fill(color(255 - j * cr[0], 255 - j * cr[1], 255 - j * cr[2], alph));
    var d = r - j;
    ellipse(x, y, d);
  }
}
function drawParticle(x,y,col){
  var r = y / (n / (maxR - minR)) + minR;
  //var x = random(w);
  var y = pow((h / n) * y, 2) / h;
  //var cr = random([[3,0,3], [0,3,3], [3,3,0], [0,0,0]]);
  var cr = col;
  for(j=0;j < r;j++){
    var alph = pow(j, 6) * 255 / pow(r, 6);
    fill(color(255 - j * cr[0], 255 - j * cr[1], 255 - j * cr[2], alph));
    var d = r - j;
    ellipse(x, y, d);
  }
}