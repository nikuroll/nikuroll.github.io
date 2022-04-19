let table;
let img;
let number=-1;
let mousecnt=0;
let answer="";
let past=0;
let button;
let tw_button;
let total=25235;

function preload(){
    table=loadTable('./data/illustDic3.txt', 'tsv');
}

function random_choice(num=-1){
    past=0;
    if (num==-1){
        tar=round(random(1,total-1));
    }else{
        tar=num;
    }
    number=tar;
    answer=table.getString(number,0);
    img = loadImage(table.getString(number, 1));

    return tar
}

function setup(){
    let canvas=createCanvas(300,300);
    canvas.parent("canvas");
    background(255);

    var params = (new URL(document.location)).searchParams;
    var getID=params.get("ID");
    if(getID){
        number=getID;
    }

    if(0<=number && number<total){
        r=number;
    }else{
        r=random_choice(num=number);
    }
    answer = table.getString(r, 0);
    img = loadImage(table.getString(r, 1));
    imageMode(CENTER);
    textSize(40);
    frameRate(10);

    button = createButton("いらすとやで確認する");
    button.parent("linkbutton");

    tw_button = createButton("ツイート");
    tw_button.parent("tw_button");
    tw_button.class("twitter-share-button");

    // tw_button = document.getElementById("tw_button");

    link=table.getString(number,2);
    button.attribute('onclick',"window.open('"+link+"')");
    // button.touchStarted(updateLink);
    updateLink();
    updateTweetLink();
}

function draw(){
    background(255);
    noFill();
    rect(0,0,width-1,height);
    push();
    if (img.width>200){
        scale(.5);
        image(img,width,height);
    }else{
        image(img,width/2,height/2);
    }
    pop();
    if (mousecnt==1){
        fill(255,0,0);
        textSize(width*.8/max(12,answer.length));
        text(answer,20,height*.9,30,height*.9);
    }

    if (past%5==0 && past>0 && img.width*img.height<100){
        random_choice();
        updateLink();
        updateTweetLink();
    }
    past+=1;
}

function touchStarted(fxn){
    if (past<3){
        return;
    }
    // console.log(mouseX,mouseY);
    if ((0<mouseX && mouseX<width && 0<mouseY && mouseY<height)==false){
        return;
    }
    past=0;
    mousecnt=1-mousecnt;
    if (mousecnt==0){
        background(255);
        noFill();
        rect(0,0,width-1,height);
        random_choice();
        updateLink();
        updateTweetLink();
        
    }
}

function updateLink() {
	link=table.getString(number,2);
    button.removeAttribute('onclick');
    button.attribute('onclick',"window.open('"+link+"')");
    console.log(link);
}

function makeTweetLink() {
    console.log(number);
    // imglink = table.getString(number, 1)
    myurl = window.location.href;
    myurl = myurl.replace(location.search , '');
    myurl += "?ID="+number;

    content = "問題ID: " + number + " &hashtags=いらすとやは暗記しろ";
    // tw_contents = encodeURI(content);
    tw_contents = content + "\n" + myurl;

    return encodeURI("https://twitter.com/intent/tweet?text=" + tw_contents);
}

function updateTweetLink() {
    tw_button.attribute("onclick", "window.open('" + makeTweetLink() + "')");
    // link = makeTweetLink();
    // tw_button.innerHTML = '<a class="twitter-share-button" data-show-count="false" href="'+ link +'">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>'
    // twttr.widgets.load();
}