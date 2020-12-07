class Planet{
  N=10;
  constructor(id,p){
    this.id=id;
    this.mycolor=color(id*20);
    this.x=p*80+50;
    this.p=p;
    this.d=60;
  }
  getId(){
    return this.id;
  }
  myshow(){
    ellipseMode(CENTER);
    fill(this.mycolor);
    ellipse(this.x, 150, this.d);
    fill(0);
    textSize(30);
    text(str(this.id),this.x,200,90,40);
  }
  clickcheck(){
    if((mouseX-this.x)*(mouseX-this.x)+(mouseY-150)*(mouseY-150)<this.d*this.d){
      return true;
    }else{
      return false;
    }
  }
  touchcheck(){
    mX=touches[0].x;
    mY=touches[0].y;
    if((mX-this.x)*(mX-this.x)+(mY-150)*(mY-150)<this.d*this.d){
      return true;
    }else{
      return false;
    }
  }
  eso1(){
    this.p=(this.p+this.id)%N;
    return this.p;
  }
  eso2(x){
    this.p=x;
  }
  update(){
    this.x=(3*this.x+this.p*80+50)/4;
  }
}