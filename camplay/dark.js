  // Classifier Variable
  let classifier;
  // Model URL
  let imageModelURL = 'https://teachablemachine.withgoogle.com/models/mzVFEdTsW/';
  
  // Video
  let video;
  let flippedVideo;
  // To store the classification
  let label = "";
  let conf = 0.0;

  //loading local pict
  let pics1;
  let pics2;

  //Dark flg
  var isDark;

  //pict size score
  var ScoreArray = {"Good": 0.0, "Claps": 0.0};

  //restart button
  let button;
  function setRestartButton(){
    createElement("br");
    button = createButton('再生');
    button.mousePressed(restart);
  }

  function restart() {
    isDark=false;
  }

  // Load the model first
  function preload() {
    classifier = ml5.imageClassifier(imageModelURL + 'model.json');
    
    pics0=loadImage("./imgs/1.png");
    pics1=loadImage("./imgs/0.png");
    pics2=loadImage("./imgs/omati.png");

    isDark = false;
  }

  function setup() {
    createCanvas(320, 260);

    // Create the video
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();

    flippedVideo = ml5.flipImage(video);
    // Start classifying
    classifyVideo();

    isDark=false;
    image(pics2,0,0,width,height);

    setRestartButton();
  }

  fading=0;
  mode=-1;
  function draw() {
    //background(0);
    nowLabel = label;

    if(nowLabel == "Dark" || isDark==true){
      isDark=true;
      image(pics2,0,0,width,height);
      return;
    }else{
      image(pics2,0,0,width,height);
    }

    tint(255);
    // Draw the video
    image(flippedVideo, 0, 0);

    // Draw the label
    fill(255);
    textSize(16);
    textAlign(CENTER);
    text(label, width / 2, height - 4);

    
    // my append
    if(nowLabel=="Good"){
      mode=0;
      fading=255;
     
    }

    if(nowLabel=="Claps"){
      mode=1;
      fading=255;
    }

    tint(255,fading);
    if(mode==0){
      pictsize=pow(ScoreArray["Good"],3);
      image(pics1,0,0,pictsize,pictsize);
    }else if(mode==1){
      pictsize=pow(ScoreArray["Claps"],3);
      image(pics0,0,0,pictsize,pictsize);
    }
    fading-=10;

  }

  // Get a prediction for the current video frame
  function classifyVideo() {
    flippedVideo = ml5.flipImage(video)
    classifier.classify(flippedVideo, gotResult);
    flippedVideo.remove();

  }

  // When we get a result
  function gotResult(error, results) {
    // If there is an error
    if (error) {
      console.error(error);
      return;
    }
    // The results are in an array ordered by confidence.
    //console.log(results[0]);
    label = results[0].label;
    conf = results[0].confidence;
    if(conf<0.75){
      label="Wakaran";
    }

    //update pict size Score
    for(let key in ScoreArray){
      if(key==label){
        ScoreArray[key]=min(5.5 , ScoreArray[key]+conf);
      }else{
        ScoreArray[key]=max(0.01 , ScoreArray[key]-conf);
      }
    }

    // Classifiy again!
    classifyVideo();
  }