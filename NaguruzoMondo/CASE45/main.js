let nazoid = 45;
let imageNum = 27; // 画像の枚数
let backgroundIndex = 26; // 背景画像のインデックス
let images = [];
let drosteBackgroundCanvas = null;
let drosteRenderer = null;
let showidx = [];
let grid = 5;
let cellWidth, cellHeight;
let startX, startY;

let clicked = [];
let cleared = 0;
let revealed = 0;
let blackHoleTriggered = false;
let blackHoleAbsorbStartMs = 0;

let actionLog = [];

let tweetMess = "NaguruzoMondoに挑戦中！";

let answers = ["ふなぞこ", "船底", "funazoko"];
let hintMessage = "赤枠は「指示代名詞」、青枠は「さといも」を表しています。黒枠が何を表しているか考えましょう。また、黒枠は「なぞ」も表しています。";
let explanationMessage = "赤枠は「指示代名詞」、青枠は「さといも」を表しています。黒枠が何を表しているか考えましょう。また、黒枠は「ふ「黒枠」こ」を表しす謎なので、答えは「ふなぞこ」です。";

let remainingAttempts = 3;

let revealedQuestions = 0;

const drosteParams = {
    phaseX: 0.332,
    phaseY: 0.0,
    zoom: 10.94,
    scale: 2.86,
    twistK: 1.001
};

const DROSTE_AUTO_ZOOM_SECONDS = -5;
let drosteAnimationStartMs = 0;

const BLACK_HOLE_INDEX = 12;
const BLACK_HOLE_ABSORB_MS = 1800;

const drosteVertexShaderSource = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const drosteFragmentShaderSource = `
precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_center;
uniform float u_zoom;
uniform vec2 u_phase;
uniform float u_drosteScale;
uniform float u_twistK;

varying vec2 v_uv;

const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;

vec2 cMul(vec2 a, vec2 b) {
    return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

vec2 cDiv(vec2 a, vec2 b) {
    float d = max(dot(b, b), 0.000001);
    return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d;
}

vec2 cExp(vec2 z) {
    return exp(z.x) * vec2(cos(z.y), sin(z.y));
}

vec2 cLog(vec2 z) {
    return vec2(log(max(length(z), 0.000001)), atan(z.y, z.x));
}

vec2 cCis(float angle) {
    return vec2(cos(angle), sin(angle));
}

float squareRepeatFactor(float x, float base) {
    return exp(-floor(log(max(x, 0.000001)) / log(base)) * log(base));
}

void main() {
    float base = max(u_drosteScale, 1.001);
    float logBase = log(base);
    float angle = atan(logBase / TAU) * u_twistK;

    vec2 z = (v_uv - u_center) * u_zoom;
    z = cMul(z, cCis(u_phase.y * TAU));
    z = cExp(cDiv(cLog(z), cMul(cCis(angle), vec2(cos(angle), 0.0))));
    z *= exp(u_phase.x * logBase);
    z *= squareRepeatFactor(max(abs(z.x), abs(z.y)) * base, base);

    vec2 sampleUv = z * 0.5 + 0.5;
    vec4 color = texture2D(u_texture, clamp(sampleUv, vec2(0.0), vec2(1.0)));

    gl_FragColor = color;
}
`;

function preload() {
    for (let i = 0; i < imageNum; i++) {
        const imagePath = i <= 25 ? `../images/pic(${i === 0 ? 0 : i + 25}).PNG` : `images/pic(${i}).PNG`;
        images.push(loadImage(imagePath));
    }

    for (let i = 1; i <= grid * grid; i++) {
        clicked.push(0);
        showidx.push(i);
    }
}

function compileDrosteShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

function createDrosteProgram(gl) {
    const vertexShader = compileDrosteShader(gl, gl.VERTEX_SHADER, drosteVertexShaderSource);
    const fragmentShader = compileDrosteShader(gl, gl.FRAGMENT_SHADER, drosteFragmentShaderSource);

    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.warn(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

function createDrosteRenderer(sourceImage, targetWidth, targetHeight) {
    const sourceCanvas = sourceImage && sourceImage.canvas;
    if (!sourceCanvas) return null;

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = targetWidth;
    outputCanvas.height = targetHeight;

    const gl = outputCanvas.getContext('webgl');
    if (!gl) return null;

    const program = createDrosteProgram(gl);
    if (!program) return null;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1
        ]),
        gl.STATIC_DRAW
    );

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas);

    gl.viewport(0, 0, targetWidth, targetHeight);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1i(gl.getUniformLocation(program, 'u_texture'), 0);

    return {
        canvas: outputCanvas,
        gl,
        program,
        width: targetWidth,
        height: targetHeight,
        uniforms: {
            center: gl.getUniformLocation(program, 'u_center'),
            zoom: gl.getUniformLocation(program, 'u_zoom'),
            phase: gl.getUniformLocation(program, 'u_phase'),
            scale: gl.getUniformLocation(program, 'u_drosteScale'),
            twistK: gl.getUniformLocation(program, 'u_twistK')
        },
        render(params) {
            gl.viewport(0, 0, targetWidth, targetHeight);
            gl.useProgram(program);
            gl.uniform2f(this.uniforms.center, 0.5, 0.5);
            gl.uniform1f(this.uniforms.zoom, params.zoom);
            gl.uniform2f(this.uniforms.phase, params.phaseX, params.phaseY);
            gl.uniform1f(this.uniforms.scale, params.scale);
            gl.uniform1f(this.uniforms.twistK, params.twistK);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.flush();
            return outputCanvas;
        }
    };
}

function createDrosteBackground(sourceImage, targetWidth, targetHeight, params = drosteParams) {
    if (
        !drosteRenderer ||
        drosteRenderer.width !== targetWidth ||
        drosteRenderer.height !== targetHeight
    ) {
        drosteRenderer = createDrosteRenderer(sourceImage, targetWidth, targetHeight);
    }

    return drosteRenderer ? drosteRenderer.render(params) : null;
}

function getDrosteAutoZoomPhase() {
    if (!drosteAnimationStartMs) return 0;

    const elapsedSeconds = (performance.now() - drosteAnimationStartMs) / 1000;
    return (elapsedSeconds / DROSTE_AUTO_ZOOM_SECONDS) % 1;
}

function getAnimatedDrosteParams() {
    const autoPhase = getDrosteAutoZoomPhase();

    return {
        ...drosteParams,
        phaseX: drosteParams.phaseX + autoPhase
    };
}

function setup() {
    startwidth = min(window.innerWidth, window.innerHeight, 800);
    const canvas = createCanvas(startwidth, startwidth);
    canvas.parent('canvas');
    background(255);
    frameRate(30);

    cellWidth = width / grid;
    cellHeight = height / grid;

    drosteAnimationStartMs = performance.now();
    drosteBackgroundCanvas = createDrosteBackground(images[backgroundIndex], width, height, getAnimatedDrosteParams());
    drawArea();
  
}

function draw() {
    drosteBackgroundCanvas = createDrosteBackground(images[backgroundIndex], width, height, getAnimatedDrosteParams());
    drawArea();
}

function calcNewImage(index) {
    return 0;
}

function make_tweet(res = 0) {
    score = grid * grid;
    for (let i = 0; i < grid * grid; i++) {
        if (clicked[i] == 1) {
            score--;
        }
    }

    attempt = 3 - remainingAttempts + 1;

    if (res == 0) {
        tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid * grid} (${attempt}回目)\n`;
    }
    for (let i = 0; i < grid; i++) {
        ret = "";
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (clicked[index] == 1) {
                ret += "⬜";
            } else {
                ret += "🟨";
            }
        }

        tweetText += ret + "\n";
    }

    let palam = "?ac=";
    for (let i = 0; i < actionLog.length; i++) {
        if (actionLog[i] == -1) {
            palam += "z";
        } else {
            // # x番目のアルファベット
            palam += String.fromCharCode(actionLog[i] + 97);
        }
    }

    tweetText += `#NaguruzoMondo\n`;
    tweetText += location.origin + location.pathname + palam;

    console.log(tweetText);
    return tweetText;
}


function tweet(tweet) {
    // XでツイートするためのURLを生成
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    // 新しいウィンドウで開く
    window.open(tweetUrl, '_blank');
}

function drawSpecial() {
}

function isBlackHoleActive() {
    return clicked[BLACK_HOLE_INDEX] == 1 && !blackHoleTriggered && cleared == 0;
}

function getBlackHoleRadius() {
    return min(cellWidth, cellHeight) * 0.34;
}

function isBlackHoleClick(x, y) {
    if (!isBlackHoleActive()) return false;

    const dx = x - width / 2;
    const dy = y - height / 2;
    return sqrt(dx * dx + dy * dy) <= getBlackHoleRadius();
}

function easeInCubic(t) {
    return t * t * t;
}

function getBlackHoleAbsorbProgress() {
    if (!blackHoleTriggered) return 0;

    return min((performance.now() - blackHoleAbsorbStartMs) / BLACK_HOLE_ABSORB_MS, 1);
}

function triggerBlackHoleAbsorption() {
    if (blackHoleTriggered) return;

    blackHoleTriggered = true;
    blackHoleAbsorbStartMs = performance.now();
    actionLog.push(BLACK_HOLE_INDEX);
}

function finishBlackHoleAbsorption() {
    for (let i = 0; i < grid * grid; i++) {
        clicked[i] = 1;
        showidx[i] = calcNewImage(i);
    }
    revealed = grid * grid;
}

function drawBlackHole() {
    const cx = width / 2;
    const cy = height / 2;
    const radius = getBlackHoleRadius();
    const pulse = 0.5 + 0.5 * sin(millis() * 0.004);

    push();
    noStroke();
    drawingContext.save();
    drawingContext.filter = `blur(${8 + pulse * 5}px)`;

    fill(0, 0, 0, 170);
    ellipse(cx, cy, radius * 2.45, radius * 2.45);

    fill(18, 12, 38, 155);
    ellipse(cx, cy, radius * 1.75, radius * 1.75);

    drawingContext.restore();

    fill(0, 0, 0, 245);
    ellipse(cx, cy, radius * 1.22, radius * 1.22);

    noFill();
    strokeWeight(max(2, width * 0.004));
    stroke(120, 90, 190, 120 + pulse * 70);
    ellipse(cx, cy, radius * (1.52 + pulse * 0.12), radius * (0.72 + pulse * 0.06));
    stroke(230, 230, 255, 55);
    ellipse(cx, cy, radius * (1.92 - pulse * 0.1), radius * (0.9 - pulse * 0.04));
    pop();
}

function drawPanelImage(index, x, y, w, h) {
    if (showidx[index] < images.length && showidx[index] > 0) {
        image(images[showidx[index]], x, y, w, h);
    }
}

function drawAbsorbingPanel(index, x, y, w, h, progress) {
    if (!(showidx[index] < images.length && showidx[index] > 0)) return;

    const eased = easeInCubic(progress);
    const cx = x + w / 2;
    const cy = y + h / 2;
    const targetX = width / 2;
    const targetY = height / 2;
    const currentX = lerp(cx, targetX, eased);
    const currentY = lerp(cy, targetY, eased);
    const sizeScale = max(1 - eased, 0.02);
    const spin = (index - BLACK_HOLE_INDEX) * 0.22 + eased * TWO_PI * 1.4;

    push();
    translate(currentX, currentY);
    rotate(spin);
    tint(255, 255 * max(1 - progress * 0.7, 0));
    imageMode(CENTER);
    image(images[showidx[index]], 0, 0, w * sizeScale, h * sizeScale);
    imageMode(CORNER);
    noTint();
    pop();
}

function drawArea() {
    // 背景と画像を再描画して影を消す
    background(255);

    if (drosteBackgroundCanvas) {
        drawingContext.drawImage(drosteBackgroundCanvas, 0, 0, width, height);
    } else {
        image(images[backgroundIndex], 0, 0, width, height);
    }

    drawBlackHole();

    const absorbProgress = getBlackHoleAbsorbProgress();
    if (blackHoleTriggered && absorbProgress >= 1) {
        finishBlackHoleAbsorption();
    }
    
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            let index = i * grid + j;
            if (1<= showidx[index] && showidx[index] <= grid*grid){
                blendMode(BLEND);
            }else{
                blendMode(MULTIPLY);
            }
   
            if (blackHoleTriggered && absorbProgress < 1) {
                drawAbsorbingPanel(index, j * cellWidth, i * cellHeight, cellWidth, cellHeight, absorbProgress);
            } else {
                drawPanelImage(index, j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            }
 
        }
    }
    blendMode(BLEND);
}

function allOpen() {
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            if (clicked[i * grid + j] == 0) {
                clicked[i * grid + j] = 1;
                let index = i * grid + j;
                showidx[index] = calcNewImage(index);
            }
        }
    }
    drawArea();
}

function showExplanationMessageOnScreen(message, open = false) {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    let box = document.getElementById('explanation-message');
    if (!box) {
        box = document.createElement('div');
        box.id = 'explanation-message';
        box.style.marginTop = '16px';
        box.style.maxWidth = '800px';
        box.style.width = 'min(800px, 92vw)';
        box.style.padding = '12px 14px';
        box.style.borderRadius = '8px';
        box.style.border = '1px solid rgba(0,0,0,0.15)';
        box.style.background = 'rgba(255,255,255,0.95)';
        box.style.boxShadow = '0 6px 18px rgba(0,0,0,0.10)';
        box.style.color = '#222';
        box.style.fontSize = '14px';
        box.style.lineHeight = '1.6';
        box.style.whiteSpace = 'pre-wrap';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.justifyContent = 'space-between';
        header.style.gap = '12px';
        header.style.marginBottom = '8px';
        header.style.cursor = 'pointer';
        header.style.userSelect = 'none';
        header.tabIndex = 0;
        header.setAttribute('role', 'button');
        header.setAttribute('aria-label', '解説を開閉');
        header.setAttribute('aria-expanded', 'false');

        const title = document.createElement('div');
        title.textContent = '解説';
        title.style.fontWeight = '700';

        const toggleIcon = document.createElement('span');
        toggleIcon.id = 'explanation-toggle-icon';
        toggleIcon.textContent = '▶';
        toggleIcon.style.fontSize = '16px';
        toggleIcon.style.lineHeight = '1';
        toggleIcon.style.padding = '2px 6px';
        toggleIcon.style.opacity = '0.9';
        toggleIcon.style.pointerEvents = 'none';

        const toggle = () => {
            const body = document.getElementById('explanation-message-body');
            const icon = document.getElementById('explanation-toggle-icon');
            const isOpen = body && body.style.display !== 'none';
            if (body) {
                body.style.display = isOpen ? 'none' : 'block';
            }
            if (icon) {
                icon.textContent = isOpen ? '▶' : '▼';
            }
            header.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        };

        header.addEventListener('click', () => {
            toggle();
        });
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });

        header.appendChild(title);
        header.appendChild(toggleIcon);

        const body = document.createElement('div');
        body.id = 'explanation-message-body';
        body.style.display = 'none';

        box.appendChild(header);
        box.appendChild(body);

        container.appendChild(box);
    }

    const body = document.getElementById('explanation-message-body');
    if (body) body.textContent = message;

    const icon = document.getElementById('explanation-toggle-icon');
    if (body) body.style.display = open ? 'block' : 'none';
    if (icon) icon.textContent = open ? '▼' : '▶';
    if (box) box.setAttribute('aria-expanded', open ? 'true' : 'false');

    box.style.display = 'block';
 }

function mousePressed() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    if (blackHoleTriggered) {
        return;
    }
    // タッチ開始位置を記録
    startX = mouseX;
    startY = mouseY;

    // タッチ中のマスを影で強調
    let col = floor(mouseX / cellWidth);
    let row = floor(mouseY / cellHeight);
    if (clicked[row * grid + col] === true) {
        return;
    }

    if (col >= 0 && col < grid && row >= 0 && row < grid) {
        fill(0, 0, 0, 100); // 半透明の黒
        noStroke();
        rect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
    }
}

function mouseReleased() {
    if (mouseButton === RIGHT) {
        return false; // 右クリックを無効化
    }
    if (blackHoleTriggered) {
        return;
    }
    if (cleared == 0 && floor(startX / cellWidth) === floor(mouseX / cellWidth) && floor(startY / cellHeight) === floor(mouseY / cellHeight)) {
        let col = floor(mouseX / cellWidth);
        let row = floor(mouseY / cellHeight);

        if (isBlackHoleClick(mouseX, mouseY)) {
            triggerBlackHoleAbsorption();
            drawArea();
            return;
        }

        if (clicked[row * grid + col] == 0 && col >= 0 && col < grid && row >= 0 && row < grid) {
            let index = row * grid + col;
            actionLog.push(index);
            clicked[index] = true;
            newpic = calcNewImage(index);
            showidx[index] = newpic;
            drawArea();
            revealed++;
        }
    }
    
    drawArea();
}

// Add event listener for the quiz answer submission
const submitButton = document.getElementById('submitAnswer');
if (submitButton) {
    submitButton.addEventListener('click', () => {
        const answerInput = document.getElementById('answerInput').value;
        if (answers.includes(answerInput.toLowerCase())) {
            alert('正解！');

            tweetMess = make_tweet();

            cleared = 1;

            showResultButtons(tweetMess);
        } else {
            if (answers.includes(answerInput)) {
                answers = answers.filter(e => e !== answerInput);
            }

            remainingAttempts--;
            document.getElementById('remainingAttempts').textContent = `残り解答回数: ${remainingAttempts}`;
            
            if (revealed == 25){
                alert('ちがいます。' + hintMessage);
            }else{
                alert(`ちがいます`);
            }

            actionLog.push(-1);
        }
    });
}


function showResultButtons(tweetMess) {
    // クイズコンテナ全体を非表示にする
    const quizContainer = document.querySelector('.quiz-container');
    if (quizContainer) {
        quizContainer.style.display = 'none';
    }

    // すでにボタンが表示されていれば何もしない
    if (document.getElementById('result-buttons')) return;

    // 新しいボタンを生成
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'result-buttons';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '20px';
    buttonContainer.style.marginTop = '20px';

    const shareButton = document.createElement('button');
    shareButton.textContent = 'Xで共有';
    shareButton.style.padding = '10px 20px';
    shareButton.style.fontSize = '16px';
    shareButton.style.color = '#fff';
    shareButton.style.backgroundColor = '#007bff';
    shareButton.style.border = 'none';
    shareButton.style.borderRadius = '5px';
    shareButton.style.cursor = 'pointer';
    shareButton.addEventListener('click', () => {
        tweet(tweetMess);
    });

    const customButton = document.createElement('button');
    customButton.textContent = '全部開ける';
    customButton.style.padding = '10px 20px';
    customButton.style.fontSize = '16px';
    customButton.style.color = '#fff';
    customButton.style.backgroundColor = '#28a745';
    customButton.style.border = 'none';
    customButton.style.borderRadius = '5px';
    customButton.style.cursor = 'pointer';
    customButton.addEventListener('click', () => {
        allOpen();
        showExplanationMessageOnScreen(explanationMessage, false);
        customButton.disabled = true;
        customButton.style.backgroundColor = '#6c757d';
        customButton.style.cursor = 'not-allowed';
    });

    buttonContainer.appendChild(shareButton);
    buttonContainer.appendChild(customButton);

    const container = document.getElementById('canvas-container');
    container.appendChild(buttonContainer);
}
