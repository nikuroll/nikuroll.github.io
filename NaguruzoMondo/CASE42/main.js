const nazoid = 42;
const grid = 5;
const backgroundIndex = 34;
const diceFaceImageIndices = [27, 28, 29, 30, 31, 32];
const diceFaceAssignment = [0, 5, null, 1, 2, 3];
const landmineImageIndex = 33;
const sugorokuConfig = {
    columns: 10,
    rows: 5,
    maxStep: 50
};
const landmineSteps = [13, 25, 49];
const sugorokuLabels = {
    start: '①りだ③',
    finish: 'あ②り'
};
const failureMessages = {
    overGoal: 'あがりをオーバーしました！失格です。',
    landmine: '爆弾マスに止まりました！失格です。'
};
const successMessages = {
    goal: 'おめでとう！あがりです'
};
const goalBonusScore = 10000;

const answers = ["ふがし","麩菓子"];
const hintMessage = "左上と右下のマスには「ふりだし」と「あがり」が入ります。これって「スタート」と「ゴール」にしても文字数が同じなんですよね。まあそれは関係ないです。";
const explanationMessage = hintMessage;

const tuning = {
    roomWidth: 12,
    roomHeight: 18,
    roomDepth: 12,
    backgroundWidth: 18,
    backgroundDepth: 18,
    wallThickness: 0.34,
    cubeGap: 0.02,
    cubeDepth: 2.4,
    topInset: 0.06,
    cameraFov: 28,
    cameraHeight: 34,
    cameraTargetY: -3.8,
    backgroundInset: 0.01,
    idleFloat: 0.02,
    dropGravity: 18,
    dropInitialSpeed: 1.4,
    dropInitialSpread: 0.9,
    lateralDrift: 1.4,
    floorBounce: 0.18,
    floorFriction: 0.82,
    wallBounce: 0.45,
    settleLinearSpeed: 0.22,
    settleAngularSpeed: 0.9,
    physicsStep: 1 / 60,
    physicsMaxSubSteps: 4,
    panelMass: 1.1,
    panelSleepTimeLimit: 0.35,
    panelSleepSpeedLimit: 0.18,
    panelLinearDamping: 0.28,
    panelAngularDamping: 0.3,
    physicsFriction: 0.42,
    physicsRestitution: 0.08,
    wrongAnswerJumpSpeedMin: 13,
    wrongAnswerJumpSpeedMax: 16,
    wrongAnswerSideDrift: 0.55,
    wrongAnswerSpinMinDeg: 35,
    wrongAnswerSpinMaxDeg: 90,
    wrongAnswerFloorThreshold: 30
};

const roomConfig = {
    width: tuning.roomWidth,
    height: tuning.roomHeight,
    depth: tuning.roomDepth,
    backgroundWidth: tuning.backgroundWidth,
    backgroundDepth: tuning.backgroundDepth,
    wallThickness: tuning.wallThickness,
    cubeGap: tuning.cubeGap,
    cubeDepth: tuning.cubeDepth,
    topInset: tuning.topInset,
    cameraFov: tuning.cameraFov,
    cameraHeight: tuning.cameraHeight,
    cameraTargetY: tuning.cameraTargetY,
    backgroundInset: tuning.backgroundInset,
    idleFloat: tuning.idleFloat,
    dropGravity: tuning.dropGravity,
    dropInitialSpeed: tuning.dropInitialSpeed,
    dropInitialSpread: tuning.dropInitialSpread,
    lateralDrift: tuning.lateralDrift,
    floorBounce: tuning.floorBounce,
    floorFriction: tuning.floorFriction,
    wallBounce: tuning.wallBounce,
    settleLinearSpeed: tuning.settleLinearSpeed,
    settleAngularSpeed: tuning.settleAngularSpeed,
    physicsStep: tuning.physicsStep,
    physicsMaxSubSteps: tuning.physicsMaxSubSteps,
    panelMass: tuning.panelMass,
    panelSleepTimeLimit: tuning.panelSleepTimeLimit,
    panelSleepSpeedLimit: tuning.panelSleepSpeedLimit,
    panelLinearDamping: tuning.panelLinearDamping,
    panelAngularDamping: tuning.panelAngularDamping,
    physicsFriction: tuning.physicsFriction,
    physicsRestitution: tuning.physicsRestitution,
    wrongAnswerJumpSpeedMin: tuning.wrongAnswerJumpSpeedMin,
    wrongAnswerJumpSpeedMax: tuning.wrongAnswerJumpSpeedMax,
    wrongAnswerSideDrift: tuning.wrongAnswerSideDrift,
    wrongAnswerSpinMinDeg: tuning.wrongAnswerSpinMinDeg,
    wrongAnswerSpinMaxDeg: tuning.wrongAnswerSpinMaxDeg,
    wrongAnswerFloorThreshold: tuning.wrongAnswerFloorThreshold
};

roomConfig.cubeSize = (roomConfig.width - roomConfig.cubeGap * (grid - 1)) / grid;
roomConfig.topY = roomConfig.height / 2 - roomConfig.cubeDepth / 2 - roomConfig.topInset;
roomConfig.floorY = -roomConfig.height / 2;
roomConfig.floorCollisionY = roomConfig.floorY + roomConfig.cubeDepth / 2;
roomConfig.sideLimitX = roomConfig.width / 2 - roomConfig.cubeSize / 2;
roomConfig.sideLimitZ = roomConfig.depth / 2 - roomConfig.cubeSize / 2;

const clicked = Array(grid * grid).fill(0);
let cleared = 0;
let revealed = 0;
let remainingAttempts = 3;
let actionLog = [];
let tweetMess = "NaguruzoMondoに挑戦中！";
let scoreBonus = 0;

const boardState = {
    boardSize: 0,
    renderer: null,
    scene: null,
    camera: null,
    roomGroup: null,
    floorMesh: null,
    floorTexture: null,
    floorCanvas: null,
    floorContext: null,
    staticFloorCanvas: null,
    staticFloorContext: null,
    floorBackgroundImage: null,
    floorLandmineImage: null,
    raycaster: null,
    pointer: null,
    pointerDown: null,
    hoveredPanel: null,
    panels: [],
    animationFrameId: 0,
    clock: null,
    anisotropy: 1,
    physicsWorld: null,
    physicsMaterials: null,
    pieceCurrentStep: 1,
    pieceTargetStep: 1,
    pieceAnimationFromStep: 1,
    pieceAnimationStartMs: 0,
    pieceAnimationDurationMs: 600,
    pieceIsAnimating: false,
    numberEffects: [],
    lastFloorRedrawMs: 0
};

function createPhysicsWorld() {
    const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -roomConfig.dropGravity, 0)
    });
    world.allowSleep = true;
    world.broadphase = new CANNON.SAPBroadphase(world);

    const wallMaterial = new CANNON.Material('wall');
    const panelMaterial = new CANNON.Material('panel');
    const contactMaterial = new CANNON.ContactMaterial(panelMaterial, wallMaterial, {
        friction: roomConfig.physicsFriction,
        restitution: roomConfig.physicsRestitution
    });
    const panelContactMaterial = new CANNON.ContactMaterial(panelMaterial, panelMaterial, {
        friction: roomConfig.physicsFriction,
        restitution: roomConfig.physicsRestitution
    });

    world.addContactMaterial(contactMaterial);
    world.addContactMaterial(panelContactMaterial);
    world.defaultContactMaterial.friction = roomConfig.physicsFriction;
    world.defaultContactMaterial.restitution = roomConfig.physicsRestitution;

    boardState.physicsWorld = world;
    boardState.physicsMaterials = {
        wall: wallMaterial,
        panel: panelMaterial
    };
}

function addStaticPhysicsBody(halfExtents, position) {
    const body = new CANNON.Body({
        mass: 0,
        material: boardState.physicsMaterials.wall,
        shape: new CANNON.Box(halfExtents)
    });
    body.position.copy(position);
    boardState.physicsWorld.addBody(body);
    return body;
}

function createRoomPhysics() {
    addStaticPhysicsBody(
        new CANNON.Vec3(roomConfig.backgroundWidth / 2, roomConfig.wallThickness / 2, roomConfig.backgroundDepth / 2),
        new CANNON.Vec3(0, roomConfig.floorY - roomConfig.wallThickness / 2, 0)
    );

    // addStaticPhysicsBody(
    //     new CANNON.Vec3(roomConfig.wallThickness / 2, roomConfig.height / 2, roomConfig.depth / 2),
    //     new CANNON.Vec3(-roomConfig.width / 2 - roomConfig.wallThickness / 2, 0, 0)
    // );
    // addStaticPhysicsBody(
    //     new CANNON.Vec3(roomConfig.wallThickness / 2, roomConfig.height / 2, roomConfig.depth / 2),
    //     new CANNON.Vec3(roomConfig.width / 2 + roomConfig.wallThickness / 2, 0, 0)
    // );
    // addStaticPhysicsBody(
    //     new CANNON.Vec3(roomConfig.width / 2, roomConfig.height / 2, roomConfig.wallThickness / 2),
    //     new CANNON.Vec3(0, 0, -roomConfig.depth / 2 - roomConfig.wallThickness / 2)
    // );
    // addStaticPhysicsBody(
    //     new CANNON.Vec3(roomConfig.width / 2, roomConfig.height / 2, roomConfig.wallThickness / 2),
    //     new CANNON.Vec3(0, 0, roomConfig.depth / 2 + roomConfig.wallThickness / 2)
    // );
}

function syncPanelMeshFromBody(panel) {
    if (!panel.body) {
        return;
    }

    panel.mesh.position.set(panel.body.position.x, panel.body.position.y, panel.body.position.z);
    panel.mesh.quaternion.set(panel.body.quaternion.x, panel.body.quaternion.y, panel.body.quaternion.z, panel.body.quaternion.w);
}

function createPanelPhysicsBody(panel) {
    if (panel.body) {
        return panel.body;
    }

    const halfExtents = new CANNON.Vec3(roomConfig.cubeSize / 2, roomConfig.cubeDepth / 2, roomConfig.cubeSize / 2);
    const body = new CANNON.Body({
        mass: roomConfig.panelMass,
        material: boardState.physicsMaterials.panel,
        shape: new CANNON.Box(halfExtents),
        position: new CANNON.Vec3(panel.mesh.position.x, panel.mesh.position.y, panel.mesh.position.z),
        quaternion: new CANNON.Quaternion(panel.mesh.quaternion.x, panel.mesh.quaternion.y, panel.mesh.quaternion.z, panel.mesh.quaternion.w),
        linearDamping: roomConfig.panelLinearDamping,
        angularDamping: roomConfig.panelAngularDamping,
        allowSleep: true,
        sleepTimeLimit: roomConfig.panelSleepTimeLimit,
        sleepSpeedLimit: roomConfig.panelSleepSpeedLimit
    });

    boardState.physicsWorld.addBody(body);
    panel.body = body;
    return body;
}

function getImagePath(index) {
    return index <= 25 ? `../images/pic(${index === 0 ? 0 : index + 25}).PNG` : `images/pic(${index}).PNG`;
}

function getCaseImagePathCandidates(index) {
    return [
        `images/pic(${index}).PNG`,
        `images/pic(${index}) .PNG`
    ];
}

function calculateBoardSize() {
    return Math.max(320, Math.min(window.innerWidth, window.innerHeight, 800));
}

function syncBoardHostSize() {
    const boardHost = document.getElementById('canvas');
    if (!boardHost) {
        return null;
    }

    boardState.boardSize = calculateBoardSize();
    boardHost.style.position = 'relative';
    boardHost.style.display = 'flex';
    boardHost.style.justifyContent = 'center';
    boardHost.style.alignItems = 'center';
    boardHost.style.flexDirection = 'column';
    boardHost.style.width = `${boardState.boardSize}px`;
    boardHost.style.height = `${boardState.boardSize}px`;
    boardHost.style.margin = '0 auto';
    boardHost.style.overflow = 'hidden';
    boardHost.style.borderRadius = '0';
    boardHost.style.touchAction = 'manipulation';
    boardHost.style.background = 'transparent';
    boardHost.style.boxShadow = 'none';

    return boardHost;
}

function ensureStatusElement() {
    const boardHost = document.getElementById('canvas');
    if (!boardHost) {
        return null;
    }

    let status = document.getElementById('board-status');
    if (!status) {
        status = document.createElement('div');
        status.id = 'board-status';
        status.style.position = 'absolute';
        status.style.left = '50%';
        status.style.top = '18px';
        status.style.transform = 'translateX(-50%)';
        status.style.padding = '8px 14px';
        status.style.borderRadius = '999px';
        status.style.background = 'rgba(22, 16, 11, 0.72)';
        status.style.color = '#fff';
        status.style.fontSize = '13px';
        status.style.letterSpacing = '0.04em';
        status.style.backdropFilter = 'blur(8px)';
        status.style.pointerEvents = 'none';
        status.style.zIndex = '3';
        boardHost.appendChild(status);
    }

    return status;
}

function setStatusMessage(message, isError = false) {
    const status = ensureStatusElement();
    if (!status) {
        return;
    }

    status.textContent = message;
    status.style.display = 'block';
    status.style.background = isError ? 'rgba(138, 25, 25, 0.82)' : 'rgba(22, 16, 11, 0.72)';
}

function clearStatusMessage() {
    const status = document.getElementById('board-status');
    if (status) {
        status.style.display = 'none';
    }
}

function loadImageAsset(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`画像の読み込みに失敗しました: ${src}`));
        image.src = src;
    });
}

async function loadFirstAvailableImageAsset(paths) {
    let lastError = null;
    for (const path of paths) {
        try {
            return await loadImageAsset(path);
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError || new Error('画像の読み込みに失敗しました。');
}

function createTextureFromImage(image) {
    const texture = new THREE.Texture(image);
    if ('colorSpace' in texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
    }
    texture.anisotropy = boardState.anisotropy;
    texture.needsUpdate = true;
    return texture;
}

async function loadBoardTextures() {
    const backgroundImage = await loadImageAsset(getImagePath(backgroundIndex));
    const panelImages = await Promise.all(
        Array.from({ length: grid * grid }, (_, index) => loadImageAsset(getImagePath(index + 1)))
    );
    const diceImages = await Promise.all(
        diceFaceImageIndices.map((imageIndex) => loadImageAsset(getImagePath(imageIndex)))
    );
    const landmineImage = await loadFirstAvailableImageAsset(getCaseImagePathCandidates(landmineImageIndex));

    return {
        backgroundImage,
        landmineImage,
        backgroundTexture: createTextureFromImage(backgroundImage),
        panelTextures: panelImages.map((image) => createTextureFromImage(image)),
        diceTextures: diceImages.map((image) => createTextureFromImage(image))
    };
}

function buildScene() {
    const boardHost = syncBoardHostSize();
    if (!boardHost) {
        return;
    }

    boardHost.innerHTML = '';

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(boardState.boardSize, boardState.boardSize);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if ('outputColorSpace' in renderer) {
        renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.cursor = 'pointer';

    boardHost.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf3eadc, 20, 3);

    const camera = new THREE.PerspectiveCamera(roomConfig.cameraFov, 1, 0.1, 100);
    camera.position.set(0, roomConfig.cameraHeight, 0);
    camera.up.set(0, 0, -1);
    camera.lookAt(0, roomConfig.cameraTargetY, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.3);
    keyLight.position.set(-8, 16, 11);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -16;
    keyLight.shadow.camera.right = 16;
    keyLight.shadow.camera.top = 16;
    keyLight.shadow.camera.bottom = -16;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xbad3ff, 0.9);
    fillLight.position.set(8, 7, -6);
    scene.add(fillLight);

    const insideLight = new THREE.PointLight(0xfff6ea, 1.2, 40, 2.2);
    insideLight.position.set(0, 2.4, 0);
    scene.add(insideLight);

    boardState.renderer = renderer;
    boardState.scene = scene;
    boardState.camera = camera;
    boardState.raycaster = new THREE.Raycaster();
    boardState.pointer = new THREE.Vector2();
    boardState.clock = new THREE.Clock();
    boardState.anisotropy = renderer.capabilities.getMaxAnisotropy();

    ensureStatusElement();
}

function getSugorokuCellPosition(step, columns, rows, drawWidth, drawHeight, offsetX, offsetY) {
    const clampedStep = Math.max(1, Math.min(step, columns * rows));
    const zeroBasedIndex = clampedStep - 1;
    const row = Math.floor(zeroBasedIndex / columns);
    const columnInRow = zeroBasedIndex % columns;
    const serpentineColumn = row % 2 === 0 ? columnInRow : columns - 1 - columnInRow;
    const cellWidth = drawWidth / columns;
    const cellHeight = drawHeight / rows;

    return {
        x: offsetX + cellWidth * serpentineColumn + cellWidth / 2,
        y: offsetY + cellHeight * row + cellHeight / 2,
        cellWidth,
        cellHeight
    };
}

function getSugorokuPathPosition(step, columns, rows, drawWidth, drawHeight, offsetX, offsetY) {
    const clampedStep = Math.max(1, Math.min(step, columns * rows));
    const fromStep = Math.floor(clampedStep);
    const toStep = Math.ceil(clampedStep);
    const localProgress = clampedStep - fromStep;
    const from = getSugorokuCellPosition(fromStep, columns, rows, drawWidth, drawHeight, offsetX, offsetY);
    const to = getSugorokuCellPosition(toStep, columns, rows, drawWidth, drawHeight, offsetX, offsetY);

    return {
        x: from.x + (to.x - from.x) * localProgress,
        y: from.y + (to.y - from.y) * localProgress,
        cellWidth: from.cellWidth,
        cellHeight: from.cellHeight
    };
}

function updatePieceAnimation() {
    if (!boardState.pieceIsAnimating) {
        return;
    }

    const now = performance.now();
    const elapsed = now - boardState.pieceAnimationStartMs;
    const progress = Math.min(elapsed / boardState.pieceAnimationDurationMs, 1);

    const eased = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;

    boardState.pieceCurrentStep = boardState.pieceAnimationFromStep
        + (boardState.pieceTargetStep - boardState.pieceAnimationFromStep) * eased;

    if (progress >= 1) {
        boardState.pieceCurrentStep = boardState.pieceTargetStep;
        boardState.pieceIsAnimating = false;
    }
}

function startPieceAnimation(targetStep) {
    boardState.pieceAnimationFromStep = boardState.pieceCurrentStep;
    boardState.pieceTargetStep = Math.max(1, Math.min(targetStep, sugorokuConfig.maxStep));
    boardState.pieceAnimationStartMs = performance.now();
    boardState.pieceIsAnimating = boardState.pieceAnimationFromStep !== boardState.pieceTargetStep;
}

function getSugorokuDrawMetrics(canvas) {
    const offsetX = 60;
    const offsetY = 130;
    return {
        columns: sugorokuConfig.columns,
        rows: sugorokuConfig.rows,
        maxStep: sugorokuConfig.maxStep,
        offsetX,
        offsetY,
        drawWidth: canvas.width - offsetX * 2,
        drawHeight: canvas.height - offsetY - 110
    };
}

function drawLandmineImage(context, image, position, radius) {
    if (!image) {
        return false;
    }

    const size = radius * 1.58;
    context.drawImage(image, position.x - size / 2, position.y - size / 2, size, size);
    return true;
}

function drawSugorokuStaticOverlay() {
    if (!boardState.staticFloorCanvas || !boardState.staticFloorContext || !boardState.floorBackgroundImage) {
        return;
    }

    const canvas = boardState.staticFloorCanvas;
    const context = boardState.staticFloorContext;
    const backgroundImage = boardState.floorBackgroundImage;
    const { columns, rows, maxStep, offsetX, offsetY, drawWidth, drawHeight } = getSugorokuDrawMetrics(canvas);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    context.save();

    for (let step = 1; step < maxStep; step += 1) {
        const current = getSugorokuCellPosition(step, columns, rows, drawWidth, drawHeight, offsetX, offsetY);
        const next = getSugorokuCellPosition(step + 1, columns, rows, drawWidth, drawHeight, offsetX, offsetY);
        context.beginPath();
        context.strokeStyle = 'rgba(181, 129, 86, 0.72)';
        context.lineWidth = 7;
        context.moveTo(current.x, current.y);
        context.lineTo(next.x, next.y);
        context.stroke();
    }

    for (let step = 1; step <= maxStep; step += 1) {
        const position = getSugorokuCellPosition(step, columns, rows, drawWidth, drawHeight, offsetX, offsetY);
        const isLandmine = landmineSteps.includes(step);
        const isStart = step === 1;
        const isFinish = step === maxStep;
        const radius = Math.min(position.cellWidth, position.cellHeight) * (isStart || isFinish ? 0.5 : 0.35);

        context.beginPath();
        context.arc(position.x, position.y, radius, 0, Math.PI * 2);
        if (isLandmine) {
            context.fillStyle = 'rgba(200, 100, 100, 0.85)';
            context.strokeStyle = 'rgba(150, 50, 50, 0.95)';
        } else if (isStart || isFinish) {
            context.fillStyle = isStart ? 'rgba(245, 250, 255, 0.88)' : 'rgba(255, 246, 190, 0.9)';
            context.strokeStyle = isStart ? 'rgba(45, 97, 138, 0.9)' : 'rgba(154, 105, 18, 0.92)';
        } else {
            context.fillStyle = 'rgba(255, 248, 234, 0.78)';
            context.strokeStyle = 'rgba(78, 49, 29, 0.78)';
        }
        context.lineWidth = 3;
        context.fill();
        context.stroke();

        if (isLandmine) {
            const usedImage = drawLandmineImage(context, boardState.floorLandmineImage, position, radius);
            context.fillStyle = usedImage ? 'rgba(22, 16, 11, 0.9)' : 'rgba(22, 16, 11, 0.92)';
            context.font = 'bold 14px sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            if (!usedImage) {
                context.font = 'bold 20px sans-serif';
                context.fillText('💣', position.x, position.y - 8);
            }
            context.fillText(String(step), position.x, position.y + radius * 0.68);
        } else if (isStart || isFinish) {
            context.fillStyle = 'rgba(42, 30, 18, 0.94)';
            context.font = 'bold 25px sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(isStart ? sugorokuLabels.start : sugorokuLabels.finish, position.x, position.y - 10);
            context.font = 'bold 18px sans-serif';
            context.fillText(String(step), position.x, position.y + 20);
        } else {
            context.fillStyle = 'rgba(78, 49, 29, 0.92)';
            context.font = 'bold 24px sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(String(step), position.x, position.y);
        }
    }
    context.restore();
}

function drawSugorokuOverlay(force = false) {
    if (!boardState.floorCanvas || !boardState.floorContext || !boardState.floorTexture || !boardState.staticFloorCanvas) {
        return;
    }

    const now = performance.now();
    if (!force && now - boardState.lastFloorRedrawMs < 33) {
        return;
    }
    boardState.lastFloorRedrawMs = now;

    const canvas = boardState.floorCanvas;
    const context = boardState.floorContext;
    const { columns, rows, maxStep, offsetX, offsetY, drawWidth, drawHeight } = getSugorokuDrawMetrics(canvas);

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(boardState.staticFloorCanvas, 0, 0);
    context.save();

    const piecePosition = getSugorokuPathPosition(
        boardState.pieceCurrentStep,
        columns,
        rows,
        drawWidth,
        drawHeight,
        offsetX,
        offsetY
    );

    if (piecePosition) {
        const pieceRadius = Math.min(piecePosition.cellWidth, piecePosition.cellHeight) * 0.32;
        context.beginPath();
        context.fillStyle = '#d92929';
        context.arc(piecePosition.x, piecePosition.y, pieceRadius, 0, Math.PI * 2);
        context.fill();
        context.lineWidth = 8;
        context.strokeStyle = 'rgba(255, 255, 255, 0.88)';
        context.stroke();
    }

    boardState.numberEffects = boardState.numberEffects.filter((effect) => now - effect.startedAtMs < 900);
    for (const effect of boardState.numberEffects) {
        const age = now - effect.startedAtMs;
        const progress = Math.min(age / 900, 1);
        const effectPosition = getSugorokuCellPosition(
            Math.max(1, Math.min(effect.step, maxStep)),
            columns,
            rows,
            drawWidth,
            drawHeight,
            offsetX,
            offsetY
        );
        context.globalAlpha = 1 - progress;
        context.fillStyle = 'rgba(42, 30, 18, 0.86)';
        context.font = 'bold 58px sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(`+${effect.value}`, effectPosition.x, effectPosition.y - 38 - progress * 36);
        context.globalAlpha = 1;
    }

    context.restore();
    boardState.floorTexture.needsUpdate = true;
}

function createRoom(backgroundImage, landmineImage) {
    const roomGroup = new THREE.Group();
    boardState.scene.add(roomGroup);

    const floorCanvas = document.createElement('canvas');
    floorCanvas.width = 1024;
    floorCanvas.height = 1024;
    const floorContext = floorCanvas.getContext('2d');
    const staticFloorCanvas = document.createElement('canvas');
    staticFloorCanvas.width = floorCanvas.width;
    staticFloorCanvas.height = floorCanvas.height;
    const staticFloorContext = staticFloorCanvas.getContext('2d');
    const floorTexture = new THREE.CanvasTexture(floorCanvas);
    if ('colorSpace' in floorTexture) {
        floorTexture.colorSpace = THREE.SRGBColorSpace;
    }
    floorTexture.anisotropy = boardState.anisotropy;

    boardState.floorCanvas = floorCanvas;
    boardState.floorContext = floorContext;
    boardState.staticFloorCanvas = staticFloorCanvas;
    boardState.staticFloorContext = staticFloorContext;
    boardState.floorTexture = floorTexture;
    boardState.floorBackgroundImage = backgroundImage;
    boardState.floorLandmineImage = landmineImage;

    drawSugorokuStaticOverlay();
    drawSugorokuOverlay(true);

    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        roughness: 0.98,
        metalness: 0.02
    });

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(roomConfig.backgroundWidth, roomConfig.backgroundDepth),
        floorMaterial
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, roomConfig.floorY, 0);
    floor.receiveShadow = true;
    roomGroup.add(floor);

    boardState.floorMesh = floor;
    boardState.roomGroup = roomGroup;
}

function createPanels(panelTextures, diceTextures) {
    const panelGroup = new THREE.Group();
    boardState.roomGroup.add(panelGroup);

    const halfGrid = (grid - 1) / 2;
    const pitch = roomConfig.cubeSize + roomConfig.cubeGap;
    const sharedSideMaterial = new THREE.MeshStandardMaterial({
        color: 0xb58156,
        roughness: 0.86,
        metalness: 0.04
    });
    const diceMaterials = diceTextures.map((texture) => new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: texture,
        roughness: 0.86,
        metalness: 0.04
    }));

    boardState.panels = [];

    for (let row = 0; row < grid; row++) {
        for (let col = 0; col < grid; col++) {
            const index = row * grid + col;
            const frontMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                map: panelTextures[index],
                roughness: 0.9,
                metalness: 0.03
            });
            const faceMaterials = diceFaceAssignment.map((diceIndex, faceIndex) => {
                if (faceIndex === 2) {
                    return frontMaterial;
                }
                if (typeof diceIndex === 'number' && diceMaterials[diceIndex]) {
                    return diceMaterials[diceIndex].clone();
                }
                return sharedSideMaterial.clone();
            });
            const faceMeta = diceFaceAssignment.map((diceIndex, faceIndex) => {
                if (faceIndex === 2) {
                    return { kind: 'question', value: index + 1 };
                }
                if (typeof diceIndex === 'number') {
                    return { kind: 'dice', value: diceIndex + 1 };
                }
                return { kind: 'none', value: 0 };
            });

            const cube = new THREE.Mesh(
                new THREE.BoxGeometry(roomConfig.cubeSize, roomConfig.cubeDepth, roomConfig.cubeSize),
                faceMaterials
            );

            cube.position.set(
                (col - halfGrid) * pitch,
                roomConfig.topY,
                (row - halfGrid) * pitch
            );
            cube.rotation.x = 0;
            cube.rotation.y = (col - halfGrid) * 0.0;
            cube.rotation.z = (row - halfGrid) * 0.0;
            cube.castShadow = true;
            cube.receiveShadow = true;
            cube.userData.index = index;

            const outline = new THREE.LineSegments(
                new THREE.EdgesGeometry(cube.geometry),
                new THREE.LineBasicMaterial({ color: 0x4e311d, transparent: true, opacity: 0.35 })
            );
            cube.add(outline);

            panelGroup.add(cube);

            boardState.panels[index] = {
                index,
                mesh: cube,
                outline,
                state: 'closed',
                delayRemaining: 0,
                body: null,
                velocity: new THREE.Vector3(),
                angularVelocity: new THREE.Vector3(),
                settledRotation: null,
                faceMeta,
                basePosition: cube.position.clone(),
                baseRotation: cube.rotation.clone()
            };
        }
    }
}

function ensureFaceSummaryElement() {
    const boardHost = document.getElementById('canvas');
    if (!boardHost) {
        return null;
    }

    let status = document.getElementById('face-summary-status');
    if (!status) {
        status = document.createElement('div');
        status.id = 'face-summary-status';
        status.style.position = 'absolute';
        status.style.left = '50%';
        status.style.top = '56px';
        status.style.transform = 'translateX(-50%)';
        status.style.padding = '8px 14px';
        status.style.borderRadius = '999px';
        status.style.background = 'rgba(22, 16, 11, 0.72)';
        status.style.color = '#fff';
        status.style.fontSize = '13px';
        status.style.letterSpacing = '0.04em';
        status.style.backdropFilter = 'blur(8px)';
        status.style.pointerEvents = 'none';
        status.style.zIndex = '3';
        boardHost.appendChild(status);
    }

    return status;
}

function setFaceSummaryMessage(message) {
    const status = ensureFaceSummaryElement();
    if (!status) {
        return;
    }
    status.textContent = message;
    status.style.display = 'block';
}

function getUpwardFaceIndex(panel) {
    if (!panel || !panel.body) {
        return -1;
    }

    const faceNormals = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -1, 0),
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, -1)
    ];
    const bodyQuaternion = new THREE.Quaternion(
        panel.body.quaternion.x,
        panel.body.quaternion.y,
        panel.body.quaternion.z,
        panel.body.quaternion.w
    );
    const worldUp = new THREE.Vector3(0, 1, 0);

    let bestDot = -Infinity;
    let bestIndex = -1;
    for (let index = 0; index < faceNormals.length; index += 1) {
        const dot = faceNormals[index].clone().applyQuaternion(bodyQuaternion).dot(worldUp);
        if (dot > bestDot) {
            bestDot = dot;
            bestIndex = index;
        }
    }

    return bestIndex;
}

function removeSettledPanel(panel) {
    if (!panel) {
        return;
    }

    if (panel.body && boardState.physicsWorld) {
        boardState.physicsWorld.removeBody(panel.body);
        panel.body = null;
    }
    if (panel.mesh && panel.mesh.parent) {
        panel.mesh.parent.remove(panel.mesh);
    }
    panel.state = 'removed';
}

function failCase(message) {
    if (cleared !== 0) {
        return;
    }

    cleared = 1;
    setStatusMessage(message, true);
    triggerWrongAnswerFloorJump();
    showResultButtons(make_tweet(1));
    setTimeout(() => {
        alert(message);
    }, 100);
}

function completeGoal() {
    if (cleared !== 0) {
        return;
    }

    scoreBonus = goalBonusScore;
    tweetMess = make_tweet();
    cleared = 1;
    setStatusMessage(successMessages.goal);
    showResultButtons(tweetMess);
    setTimeout(() => {
        alert(successMessages.goal);
    }, 100);
}

function applyConfirmedDice(panel) {
    if (!panel || !panel.body || panel.processedResult) {
        return;
    }

    panel.processedResult = true;
    if (panel.body.position.y < roomConfig.floorY) {
        removeSettledPanel(panel);
        return;
    }

    const upwardFaceIndex = getUpwardFaceIndex(panel);
    const faceInfo = upwardFaceIndex >= 0 && panel.faceMeta ? panel.faceMeta[upwardFaceIndex] : null;
    if (!faceInfo || faceInfo.kind !== 'dice') {
        removeSettledPanel(panel);
        drawSugorokuOverlay(true);
        return;
    }

    const nextStep = boardState.pieceTargetStep + faceInfo.value;
    boardState.numberEffects.push({
        value: faceInfo.value,
        step: Math.min(nextStep, sugorokuConfig.maxStep),
        startedAtMs: performance.now()
    });

    startPieceAnimation(nextStep);
    removeSettledPanel(panel);
    drawSugorokuOverlay(true);

    if (nextStep > sugorokuConfig.maxStep) {
        failCase(failureMessages.overGoal);
        return;
    }
    if (nextStep === sugorokuConfig.maxStep) {
        completeGoal();
        return;
    }
    if (landmineSteps.includes(nextStep)) {
        failCase(failureMessages.landmine);
    }
}

function setPanelHighlight(panel, highlighted) {
    if (!panel || !Array.isArray(panel.mesh.material)) {
        return;
    }

    const faceMaterial = panel.mesh.material[2];
    faceMaterial.emissive.setHex(highlighted ? 0x3a3326 : 0x000000);
    faceMaterial.emissiveIntensity = highlighted ? 0.28 : 0;
    panel.outline.material.opacity = highlighted ? 0.88 : 0.35;
}

function setHoveredPanel(index) {
    const nextPanel = typeof index === 'number' ? boardState.panels[index] : null;
    if (boardState.hoveredPanel === nextPanel) {
        return;
    }

    if (boardState.hoveredPanel) {
        setPanelHighlight(boardState.hoveredPanel, false);
    }

    boardState.hoveredPanel = nextPanel && nextPanel.state === 'closed' ? nextPanel : null;
    if (boardState.hoveredPanel) {
        setPanelHighlight(boardState.hoveredPanel, true);
    }

    if (boardState.renderer) {
        boardState.renderer.domElement.style.cursor = boardState.hoveredPanel ? 'pointer' : 'default';
    }
}

function getPointerFromEvent(event) {
    const rect = boardState.renderer.domElement.getBoundingClientRect();
    boardState.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    boardState.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickPanelIndex(event) {
    if (!boardState.renderer || !boardState.camera || !boardState.raycaster) {
        return null;
    }

    getPointerFromEvent(event);
    boardState.raycaster.setFromCamera(boardState.pointer, boardState.camera);

    const interactiveMeshes = boardState.panels
        .filter((panel) => panel && panel.state === 'closed')
        .map((panel) => panel.mesh);

    if (interactiveMeshes.length === 0) {
        return null;
    }

    const hits = boardState.raycaster.intersectObjects(interactiveMeshes, false);
    if (hits.length === 0) {
        return null;
    }

    const panelIndex = hits[0].object.userData.index;
    return typeof panelIndex === 'number' ? panelIndex : null;
}

function startPanelDrop(panel) {
    if (!panel || panel.state === 'settled' || panel.state === 'dropping') {
        return;
    }

    if (boardState.hoveredPanel === panel) {
        setHoveredPanel(null);
    }

    panel.state = 'dropping';
    const body = createPanelPhysicsBody(panel);
    body.position.set(panel.mesh.position.x, panel.mesh.position.y, panel.mesh.position.z);
    body.quaternion.set(panel.mesh.quaternion.x, panel.mesh.quaternion.y, panel.mesh.quaternion.z, panel.mesh.quaternion.w);
    body.velocity.set(
        panel.basePosition.x * 0.05 + (Math.random() - 0.5) * roomConfig.lateralDrift,
        -roomConfig.dropInitialSpeed - Math.random() * roomConfig.dropInitialSpread,
        panel.basePosition.z * 0.05 + (Math.random() - 0.5) * roomConfig.lateralDrift
    );
    body.angularVelocity.set(
        THREE.MathUtils.degToRad(-180 - Math.random() * 70),
        THREE.MathUtils.degToRad((panel.basePosition.x >= 0 ? -95 : 95) + (Math.random() - 0.5) * 24),
        THREE.MathUtils.degToRad((panel.basePosition.z >= 0 ? -55 : 55) + (Math.random() - 0.5) * 28)
    );
    body.wakeUp();
    panel.settledRotation = null;
}

function revealPanel(index, options = {}) {
    const panel = boardState.panels[index];
    if (!panel || panel.state !== 'closed') {
        return false;
    }

    const { delayMs = 0, recordAction = true } = options;
    if (recordAction) {
        actionLog.push(index);
    }

    clicked[index] = 1;
    revealed += 1;

    if (delayMs > 0) {
        panel.state = 'queued';
        panel.delayRemaining = delayMs / 1000;
    } else {
        startPanelDrop(panel);
    }

    return true;
}

function updatePanels(delta, elapsedTime) {
    for (const panel of boardState.panels) {
        if (!panel) {
            continue;
        }

        if (panel.state === 'closed') {
            const pulse = Math.sin(elapsedTime * 1.2 + panel.index * 0.33) * roomConfig.idleFloat;
            panel.mesh.position.y = panel.basePosition.y + pulse;
            panel.mesh.rotation.x = panel.baseRotation.x;
            panel.mesh.rotation.y = panel.baseRotation.y;
            panel.mesh.rotation.z = panel.baseRotation.z;
            continue;
        }

        if (panel.state === 'settled') {
            syncPanelMeshFromBody(panel);
            continue;
        }

        if (panel.state === 'queued') {
            panel.delayRemaining -= delta;
            if (panel.delayRemaining <= 0) {
                startPanelDrop(panel);
            }
            continue;
        }

        if (panel.state === 'dropping') {
            syncPanelMeshFromBody(panel);
            if (panel.body && panel.body.sleepState === CANNON.Body.SLEEPING) {
                panel.state = 'settled';
                applyConfirmedDice(panel);
            }
        }
    }

    updatePieceAnimation();
    if (boardState.pieceIsAnimating || boardState.numberEffects.length > 0) {
        drawSugorokuOverlay();
    }
}

function animateBoard() {
    boardState.animationFrameId = requestAnimationFrame(animateBoard);

    if (!boardState.renderer || !boardState.scene || !boardState.camera || !boardState.clock) {
        return;
    }

    const delta = Math.min(boardState.clock.getDelta(), 0.05);
    const elapsedTime = boardState.clock.elapsedTime;

    if (boardState.physicsWorld) {
        boardState.physicsWorld.step(roomConfig.physicsStep, delta, roomConfig.physicsMaxSubSteps);
    }

    updatePanels(delta, elapsedTime);
    boardState.renderer.render(boardState.scene, boardState.camera);
}

function onPointerDown(event) {
    boardState.pointerDown = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId
    };

    if (boardState.renderer && boardState.renderer.domElement.setPointerCapture) {
        try {
            boardState.renderer.domElement.setPointerCapture(event.pointerId);
        } catch (error) {
            console.debug(error);
        }
    }
}

function onPointerMove(event) {
    if (cleared !== 0) {
        setHoveredPanel(null);
        return;
    }

    const index = pickPanelIndex(event);
    setHoveredPanel(index);
}

function onPointerUp(event) {
    if (!boardState.pointerDown) {
        return;
    }

    const travel = Math.hypot(event.clientX - boardState.pointerDown.x, event.clientY - boardState.pointerDown.y);
    boardState.pointerDown = null;

    if (travel > 12 || cleared !== 0) {
        return;
    }

    const index = pickPanelIndex(event);
    if (typeof index === 'number') {
        revealPanel(index, { recordAction: true });
    }
}

function onPointerExit() {
    boardState.pointerDown = null;
    setHoveredPanel(null);
}

function bindBoardInteraction() {
    const canvas = boardState.renderer.domElement;
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerExit);
    canvas.addEventListener('pointercancel', onPointerExit);
}

function make_tweet(res = 0) {
    const score = grid * grid - clicked.filter((value) => value === 1).length + scoreBonus;
    const attempt = 3 - remainingAttempts + 1;
    let tweetText = '';

    if (res === 0) {
        tweetText = `CASE${nazoid}\n\nScore: ${score}/${grid * grid} (${attempt}回目)\n`;
    } else {
        tweetText = `CASE${nazoid}\n\nScore: 失格\n`;
    }

    for (let row = 0; row < grid; row++) {
        let line = '';
        for (let col = 0; col < grid; col++) {
            const index = row * grid + col;
            line += clicked[index] === 1 ? '⬜' : '🟨';
        }
        tweetText += `${line}\n`;
    }

    let param = '?ac=';
    for (const action of actionLog) {
        param += action === -1 ? 'z' : String.fromCharCode(action + 97);
    }

    tweetText += '#NaguruzoMondo\n';
    tweetText += location.origin + location.pathname + param;
    return tweetText;
}

function tweet(text) {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(tweetUrl, '_blank');
}

function allOpen() {
    boardState.panels.forEach((panel, index) => {
        if (panel.state === 'closed') {
            revealPanel(index, { delayMs: index * 45, recordAction: false });
        }
    });
}

function triggerWrongAnswerFloorJump() {
    for (const panel of boardState.panels) {
        if (!panel || !panel.body || panel.state !== 'settled') {
            continue;
        }

        const isOnFloor = panel.body.position.y <= roomConfig.floorCollisionY + roomConfig.wrongAnswerFloorThreshold;
        if (!isOnFloor) {
            continue;
        }

        const jumpSpeed = THREE.MathUtils.lerp(
            roomConfig.wrongAnswerJumpSpeedMin,
            roomConfig.wrongAnswerJumpSpeedMax,
            Math.random()
        );
        const spinRange = THREE.MathUtils.degToRad(roomConfig.wrongAnswerSpinMaxDeg - roomConfig.wrongAnswerSpinMinDeg);
        const spinBase = THREE.MathUtils.degToRad(roomConfig.wrongAnswerSpinMinDeg);
        const randomSpin = () => {
            const direction = Math.random() < 0.5 ? -1 : 1;
            return direction * (spinBase + Math.random() * spinRange);
        };

        panel.body.velocity.set(
            (Math.random() - 0.5) * roomConfig.wrongAnswerSideDrift,
            jumpSpeed,
            (Math.random() - 0.5) * roomConfig.wrongAnswerSideDrift
        );
        panel.body.angularVelocity.set(randomSpin(), randomSpin(), randomSpin());
        panel.body.wakeUp();
        panel.state = 'dropping';
    }
}

function handleSubmitAnswer() {
    const answerInput = document.getElementById('answerInput');
    if (!answerInput) {
        return;
    }

    const userAnswer = answerInput.value.trim().toLowerCase();
    if (!userAnswer) {
        return;
    }

    if (answers.includes(userAnswer)) {
        alert('正解！');
        tweetMess = make_tweet();
        cleared = 1;
        showResultButtons(tweetMess);
        return;
    }

    remainingAttempts = Math.max(remainingAttempts - 1, 0);
    const remainingAttemptsLabel = document.getElementById('remainingAttempts');
    if (remainingAttemptsLabel) {
        remainingAttemptsLabel.textContent = `残り解答回数: ${remainingAttempts}`;
    }

    alert(revealed === grid * grid ? `ちがいます。${hintMessage}` : 'ちがいます');
    triggerWrongAnswerFloorJump();
    actionLog.push(-1);
}

function bindQuizEvents() {
    const submitButton = document.getElementById('submitAnswer');
    if (submitButton && submitButton.dataset.bound !== 'true') {
        submitButton.dataset.bound = 'true';
        submitButton.addEventListener('click', handleSubmitAnswer);
    }

    const answerInput = document.getElementById('answerInput');
    if (answerInput && answerInput.dataset.bound !== 'true') {
        answerInput.dataset.bound = 'true';
        answerInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSubmitAnswer();
            }
        });
    }

    const remainingAttemptsLabel = document.getElementById('remainingAttempts');
    if (remainingAttemptsLabel) {
        remainingAttemptsLabel.textContent = `残り解答回数: ${remainingAttempts}`;
    }
}

function showExplanationMessageOnScreen(message, open = false) {
    const container = document.getElementById('canvas-container');
    if (!container) {
        return;
    }

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
        header.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
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
    if (body) {
        body.textContent = message;
        body.style.display = open ? 'block' : 'none';
    }

    const icon = document.getElementById('explanation-toggle-icon');
    if (icon) {
        icon.textContent = open ? '▼' : '▶';
    }
    if (box) {
        box.setAttribute('aria-expanded', open ? 'true' : 'false');
        box.style.display = 'block';
    }
}

function showResultButtons(tweetText) {
    const quizContainer = document.querySelector('.quiz-container');
    if (quizContainer) {
        quizContainer.style.display = 'none';
    }

    if (document.getElementById('result-buttons')) {
        return;
    }

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
        tweet(tweetText);
    });

    const openAllButton = document.createElement('button');
    openAllButton.textContent = '全部開ける';
    openAllButton.style.padding = '10px 20px';
    openAllButton.style.fontSize = '16px';
    openAllButton.style.color = '#fff';
    openAllButton.style.backgroundColor = '#28a745';
    openAllButton.style.border = 'none';
    openAllButton.style.borderRadius = '5px';
    openAllButton.style.cursor = 'pointer';
    openAllButton.addEventListener('click', () => {
        allOpen();
        showExplanationMessageOnScreen(explanationMessage, false);
        openAllButton.disabled = true;
        openAllButton.style.backgroundColor = '#6c757d';
        openAllButton.style.cursor = 'not-allowed';
    });

    buttonContainer.appendChild(shareButton);
    buttonContainer.appendChild(openAllButton);

    const container = document.getElementById('canvas-container');
    if (container) {
        container.appendChild(buttonContainer);
    }
}

function handleWindowResize() {
    const boardHost = syncBoardHostSize();
    if (!boardHost || !boardState.renderer || !boardState.camera) {
        return;
    }

    boardState.renderer.setSize(boardState.boardSize, boardState.boardSize);
    boardState.camera.aspect = 1;
    boardState.camera.updateProjectionMatrix();
}

async function bootstrap() {
    bindQuizEvents();
    if (!window.THREE) {
        setStatusMessage('Three.js の読み込みに失敗しました。', true);
        return;
    }
    if (!window.CANNON) {
        setStatusMessage('cannon-es の読み込みに失敗しました。', true);
        return;
    }

    setStatusMessage('3D盤面を読み込み中...');

    try {
        buildScene();
        createPhysicsWorld();
        const textures = await loadBoardTextures();
        createRoom(textures.backgroundImage, textures.landmineImage);
        createRoomPhysics();
        createPanels(textures.panelTextures, textures.diceTextures);
        bindBoardInteraction();
        clearStatusMessage();
        animateBoard();
    } catch (error) {
        console.error(error);
        setStatusMessage('3D盤面の初期化に失敗しました。', true);
    }
}

window.addEventListener('resize', handleWindowResize);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
    bootstrap();
}
