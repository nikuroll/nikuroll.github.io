let mic;
let img;
let imgs=[];
let now=0;
// setup()より先に呼び出される
function preload() {
    let i=1;
    for(i=1;i<14;i++){
      img = loadImage('./img/'+str(i)+'.gif');
      imgs.push(img);
    }
}

// https://p5js.org/examples/sound-mic-input.html

function setup() {
  createCanvas(600, 600);

  mic = new p5.AudioIn();
  mic.start();
  frameRate(15);
}

function draw() {
  background(220);

  let volume = mic.getLevel(); // 0〜1
  d=volume*180;
  d = map(d,0.5,180,0,180,true);
  let fram=min(Math.floor(d),12);
  now=Math.floor((now+3*fram)/4);
  let area=now==0?-10:0;
  image(imgs[now],200+area,100+area);
  text(str(d),50,50,50,50);
}