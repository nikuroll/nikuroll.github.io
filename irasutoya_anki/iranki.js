let table;
let img;
let number=0;
let mousecnt=0;
let answer="";
let past=0;

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
    let canvas=createCanvas(600,600);
    canvas.parent("canvas");
    background(255);
    r=random_choice();
    console.log(table.getString(r, 1));
    img = loadImage(table.getString(r, 1));
    imageMode(CENTER);
    textSize(40);
}

function draw(){
    background(255);
    image(img,300,300);
    if (mousecnt==1){
        fill(255,0,0);
        textSize(500/max(12,answer.length));
        text(answer,20,500,30,520);
    }

    if (past%60==0 && past>30 && img.width*img.height<100){
        random_choice();
    }
    past+=1;
}

function touchEnded(fxn){
    if (past<3){
        return;
    }
    past=0;
    mousecnt=1-mousecnt;
    if (mousecnt==0){
        background(128);
        r=random_choice();
        
    }
}

