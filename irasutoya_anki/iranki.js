let table;
let img;
let number=0;
let mousecnt=0;
let answer="";
let past=0;
let button;

function preload(){
    table=loadTable('./data/illustLinkDicSpecial.txt', 'tsv');
}

function random_choice(){
    past=0;
    let total=13702;
    tar=round(random(1,total-1));
    number=tar;
    answer=table.getString(number,0);
    img = loadImage(table.getString(number, 1));

    return tar
}

function setup(){
    let canvas=createCanvas(300,300);
    canvas.parent("canvas");
    background(255);
    r=random_choice();
    console.log(table.getString(r, 1));
    img = loadImage(table.getString(r, 1));
    imageMode(CENTER);
    textSize(40);

    button = createButton("いらすとやで確認する");
    button.parent("linkbutton");
    link=table.getString(number,2);
    button.attribute('onclick',"window.open('"+link+"')");
    // button.touchStarted(updateLink);
}

function draw(){
    background(255);
    noFill();
    rect(0,0,width-1,height);
    push();
    scale(.5);
    image(img,width,height);
    pop();
    if (mousecnt==1){
        fill(255,0,0);
        textSize(width*.8/max(12,answer.length));
        text(answer,20,height*.9,30,height*.9);
    }

    if (past%60==0 && past>30 && img.width*img.height<100){
        random_choice();
        updateLink();
    }
    past+=1;
}

function touchStarted(fxn){
    if (past<20){
        return;
    }
    // console.log(mouseX,mouseY);
    if ((0<mouseX && mouseX<width && 0<mouseY && mouseY<height)==false){
        return;
    }
    past=0;
    mousecnt=1-mousecnt;
    if (mousecnt==0){
        background(128);
        random_choice();
        updateLink();
        
    }
}

function updateLink() {
	link=table.getString(number,2);
    button.removeAttribute('onclick');
    button.attribute('onclick',"window.open('"+link+"')");
    console.log(link);
}