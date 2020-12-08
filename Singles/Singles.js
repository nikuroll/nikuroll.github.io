class Player{
  constructor(x,y){
    this.x=x;
    this.y=y;
  }
  show(){
    fill(128);
    ellipse(this.x*40+40,this.y*40+40,20,20);  
  }
  up(){
    if(!cango(me.x,me.y-1))return -1;
    if(this.push(me.x,me.y,0,-1)==-1)return -1;
    this.y-=1;
  }
  down(){
    if(!cango(me.x,me.y+1))return -1;
    if(this.push(me.x,me.y,0,1)==-1)return -1;
    this.y+=1;
  }
  left(){
    if(!cango(me.x-1,me.y))return -1;
    if(this.push(me.x,me.y,-1,0)==-1)return -1;
    this.x-=1;
  }
  right(){
    if(!cango(me.x+1,me.y))return -1;
    if(this.push(me.x,me.y,1,0)==-1)return -1;
    this.x+=1;
  }
  push(x,y,dx,dy){
    if(cango(x+dx,y+dy)){
      if(this.rpush(x+dx,y+dy,dx,dy)==0){
        board[x+dx][y+dy]=0;
        return 0;
      }else{
        return -1;
      };
    }else{
      return -1;
    }
  }
  rpush(x,y,dx,dy){
    if(board[x][y]==0){
      return 0;
    }
    if(cango(x+dx,y+dy)){
      if(this.rpush(x+dx,y+dy,dx,dy)==0){
        board[x+dx][y+dy]=board[x][y];
        return 0;
      }else{
        return -1;
      };
    }else{
      return -1;
    }
  }
}
var me=new Player(4,4);

class undoArr{
  constructor(){
    this.arr=[];
  }
  undo(){
    if(this.arr.length>0){
      return this.arr.pop();
    }
    return [];
  }
  enqueue(arr){
    this.arr.push(arr);
    if(this.arr.length>10){
      this.arr.shift();
    }
  }
}
var myundoArr = new undoArr;

function cango(x,y){
  if (x<0 || y<0 || x>=9 || y>=9){
    return false;
  }
  return true;
}

function setup(){
  createCanvas(400, 400);
  background(128);
  strokeWeight(3);

}

let board = [
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,1,0,2,0,3,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,4,0,5,0,6,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,7,0,8,0,9,0,0],
  [0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0]
 ];

 function draw(){
  let i=0;
  let q=0; 
  background(128);
  textSize(30);
  textAlign(CENTER,CENTER);
  //applyMatrix(.5, 0, 0, .5, 0, 0);
  strokeWeight(3);
  for(i=0;i<9;i++){
    for(q=0;q<9;q++){
      //fill(i*30-q*15+100);
      fill(255);
      rect(20+40*i,20+40*q,40,40);
      fill(0);
      if(board[i][q]){
        text(str(board[i][q]),20+40*i,20+40*q,40,40);
      }
    }
  }
  strokeWeight(6);
  for(i=0;i<3;i++){
    for(q=0;q<3;q++){
      //fill(i*30-q*15+100);
      noFill();
      rect(20+40*i*3,20+40*q*3,120,120);
    }
  }
  strokeWeight(3);
  me.show()
 }

 function Comp(){
   for(i=0;i<9;i++){
     for(q=0;q<9;q++){
       EDIT[i][q]=board[i][q];
     }
   }
   Result=0;
   Computer();
   if (RESULT==2){
     fill(0,128);
     rect(0,0,width,height);
   }
   for (y=0; y<9; y++){
    for (x=0; x<9; x++){
       if (EDIT[y][x]) {
           board[y][x]=EDIT[y][x];
       } else if (RESULT != 3) {
           if (TB[y][x] > 10) {
               board[y][x]=0;
           } else {
               board[y][x]=TB[y][x];
           }
       }
     }
    }
 }

 function now2memory(){
  let arr=[];
  for(i=0;i<9;i++){
    for(q=0;q<9;q++){
      arr.push(board[i][q]);
    }
  }
  arr.push(me.x);
  arr.push(me.y);
  return arr;
 }

 function memory2now(arr){
   for(i=0;i<81;i++){
     board[Math.floor(i/9)][i%9]=arr[i];
   }
   me.x=arr[81];
   me.y=arr[82];
 }

 function makeMemory(){
   myundoArr.enqueue(now2memory());
 }

 function getundo(){
   let a=myundoArr.undo();
   if(a.length>0){
     memory2now(a);
   }
 }

 function keyPressed(){
   if(keyCode===LEFT_ARROW){
     makeMemory();
     me.left();
     Comp();
     return 0;
   }
   if(keyCode===RIGHT_ARROW){
    makeMemory();
    me.right();
    Comp();
    return 0;
  }
  if(keyCode===UP_ARROW){
    makeMemory();
    me.up();
    Comp();
    return 0;
  }
  if(keyCode===DOWN_ARROW){
    makeMemory();
    me.down();
    Comp();
    return 0;
  }
  if(keyCode==90){
    getundo();
  }
 }