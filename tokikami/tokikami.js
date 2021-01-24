img=[];
maisu=63
lim=30
function preload(){
  for(let i=0;i<maisu;i++){
    img[i]= loadImage("pict/taisaku ("+(i+1)+").jpg");
  }
}

function setup() {
    createCanvas(800,600);
    createElement("br");
    for(q=0;q<50;q++){
      if(q%5==0)createElement("br");
      createInput().attribute('placeholder', q+1);;
    }

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
  if(maime==maisu){
    background(128);
    text("Finish!",200,200,800,800);
    noloop();
  }
  background(128);
  text(("00"+str(i)).slice(-2),600,100,200,200);
  image(img[maime],0,0,600,600);
  
}
 
