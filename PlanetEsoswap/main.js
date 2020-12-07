var Planets=[];
var N = 10
var cleared=false;
var old=0;
Planet.N=N;

function setup(){
  noStroke();
  createCanvas(820, 300);
  background(128);
  let i=0;
  let arr=[]

  for(i=0;i<N;i++){
    arr.push(i);
  }

  for(i=0;i<5000;i++){
    var k=Math.floor(random(N-1));
    if(i%N==k){
      continue;
    }
    arr[i%N]=arr[i%N]+arr[k]
    arr[k]=arr[i%N]-arr[k]
    arr[i%N]=arr[i%N]-arr[k]
  }

  for(i=0;i<N;i++){
    Planets.push(new Planet(arr[i],i));
  }
  /*
  for(i=0;i<5000;i++){
    var k=Math.floor(random(N-1));
    let nex=Planets[k].eso1();
    PlanetSwap(k,nex)
    Planets[k].eso2(k);
  }
  */
 
  showPlanets();
}

function back(){
  let T=3*N;
  let xs=width/T;
  for(let i=0;i<T;i++){
    fill(i*10+50);
    rect(xs*i,0,xs*i+xs,height);
  }
  fill(128,128);
  rect(0,height/4,width,170);
}

function showPlanets(){
  for(let i=0;i<N;i++){
    Planets[i].myshow();
  }
}

function PlanetSwap(i,q){
  var a=Planets[i];
  Planets[i]=Planets[q];
  Planets[q]=a;
}

function mouseClicked(){
  for(let i=0;i<N;i++){
    if(Planets[i].clickcheck()){
      /*process*/
      //Planets[i].mycolor=color(100,0,0);
      let nex=Planets[i].eso1();
      PlanetSwap(i,nex)
      Planets[i].eso2(i);
      break;
    }
  }
  back();
  showPlanets();
  gameclear();
}

function clearcheck(){
  for(let i=0;i<N;i++){
    if(Planets[i].getId()!=i){
      return false;
    }
  }
  return true;
}

function gameclear(){
  if (clearcheck()){
    cleared=true;
  }
}

function draw(){
  if(old==0 && touches.length==1){
    old=1;
    for(let i=0;i<N;i++){
      if(Planets[i].touchcheck()){
        /*process*/
        //Planets[i].mycolor=color(100,0,0);
        let nex=Planets[i].eso1();
        PlanetSwap(i,nex)
        Planets[i].eso2(i);
        break;
      }
    }
    back();
    showPlanets();
    gameclear();
  }else if(old==1 && touches.length==0){
    old=0;
  }
  for(let i=0;i<N;i++){
    Planets[i].update();
  }
  back();
  showPlanets();

  if(cleared){
    fill(128,128);
    rect(width,height);
    textSize(120);
    fill(255);
    text("Clear!",25,75,360,360);
  }
}