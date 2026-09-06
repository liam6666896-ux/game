"use strict";

/* =====================================================
   CANVAS
===================================================== */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let W = 0;
let H = 0;
let DPR = 1;

/* =====================================================
   BACKGROUND MUSIC
===================================================== */
const bgMusic = document.getElementById("bgMusic");
const musicBtn = document.getElementById("musicBtn");
let musicEnabled = true;

if (bgMusic) bgMusic.volume = 0.35;

function startMusic() {
    if (!musicEnabled || !bgMusic) return;
    bgMusic.play().catch(function () {});
}

function toggleMusic() {
    if (!bgMusic || !musicBtn) return;
    if (bgMusic.paused) {
        musicEnabled = true;
        bgMusic.play().catch(function () {});
        musicBtn.textContent = "🔊 ON";
    } else {
        musicEnabled = false;
        bgMusic.pause();
        musicBtn.textContent = "🔇 OFF";
    }
}

if (musicBtn) {
    musicBtn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        toggleMusic();
    });
}

function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* =====================================================
   MENU MUSIC
===================================================== */
const menuMusic = document.getElementById("menuMusic");
if (menuMusic) menuMusic.volume = 0.35;
let menuMusicEnabled = true;

function playMenuMusic() {
    if (!menuMusicEnabled || !menuMusic) return;
    if (menuMusic.paused) {
        menuMusic.play().catch(() => {});
    }
}

function stopMenuMusic() {
    if (!menuMusic) return;
    menuMusic.pause();
    menuMusic.currentTime = 0;
}

/* =====================================================
   PAGES
===================================================== */
const startPage = document.getElementById("startPage");
const levelPage = document.getElementById("levelPage");
const gamePage = document.getElementById("gamePage");
const restartPage = document.getElementById("restartPage");
const winPage = document.getElementById("winPage");

/* =====================================================
   BUTTONS
===================================================== */
const startButton = document.getElementById("startButton");
const levelButtons = document.querySelectorAll(".levelButton");
const restartButton = document.getElementById("restartButton");
const nextLevelButton = document.getElementById("nextLevelButton");
const deathLevelsButton = document.getElementById("deathLevelsButton");
const winLevelsButton = document.getElementById("winLevelsButton");
const deadLevel = document.getElementById("deadLevel");
const completedLevel = document.getElementById("completedLevel");

/* =====================================================
   LEVEL SETTINGS
===================================================== */
const MAX_LEVEL = 15;
const LEVEL_DISTANCE = {
    1: 1500, 2: 1500, 3: 1500, 4: 1500, 5: 1500,
    6: 1500, 7: 1500, 8: 1500, 9: 1500, 10: 1500,
    11: 1500, 12: 1500, 13: 1500, 14: 1500, 15: 1500
};

/* =====================================================
   GAME STATE
===================================================== */
let playing = false;
let selectedLevel = 1;
let gameTime = 0;
let lastTime = performance.now();
let moveDirection = 0;

/* =====================================================
   PLAYER
===================================================== */
const player = {
    x: 180,
    y: 0,
    width: 34,
    height: 62,
    velocityY: 0,
    grounded: false,
    visible: true,
    enteringGate: false
};

const GRAVITY = 1900;
const JUMP_FORCE = 760;
const MOVE_SPEED = 600;

/* =====================================================
   DISTANCE
===================================================== */
let distance = 1;
const DISTANCE_RATE = 0.15;

/* =====================================================
   WORLD
===================================================== */
let buildings = [];
let traps = [];
let nextBuildingX = 0;
const BUILDING_HEIGHT = 260;
const BUILDING_Y_OFFSET = 75;

/* =====================================================
   CAMERA
===================================================== */
let cameraX = 0;

/* =====================================================
   CLOUDS & SHARKS
===================================================== */
let clouds = [];
let sharks = [];
const MAX_SHARKS = 3;

/* =====================================================
   TRAPS
===================================================== */
const TRAP_TYPES = [
    "spike", "hole", "electric", "fire", "moving", "falling",
    "lightning", "fakeGate", "fallingBuilding"
];
const MAX_TRAPS = 150;

/* =====================================================
   WIN GATE
===================================================== */
let winGate = {
    x: 0,
    y: 0,
    width: 90,
    height: 180,
    state: "open",
    animationTime: 0,
    closeDuration: 0.7,
    sinkDuration: 1.2,
    sinkDistance: 220,
    originalY: 0
};

/* =====================================================
   FIXED RANDOM
===================================================== */
let randomSeed = 1;

function setSeed(seed) {
    randomSeed = seed;
}

function seededRandom() {
    randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0;
    return randomSeed / 4294967296;
}

function random(min, max) {
    return min + seededRandom() * (max - min);
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function getLevelSeed(level) {
    return 918273 + level * 1000003;
}

/* =====================================================
   PAGE NAVIGATION
===================================================== */
function hideAllPages() {
    if (startPage) startPage.classList.add("hidden");
    if (levelPage) levelPage.classList.add("hidden");
    if (gamePage) gamePage.classList.add("hidden");
    if (restartPage) restartPage.classList.add("hidden");
    if (winPage) winPage.classList.add("hidden");
}

function hideMiniMap() {
    const miniMapCanvas = document.getElementById("miniMapCanvas");
    if (miniMapCanvas) miniMapCanvas.style.display = "none";
}

function showStartPage() {
    playing = false;
    moveDirection = 0;
    hideMiniMap();
    hideAllPages();
    if (startPage) startPage.classList.remove("hidden");
}

function showLevelPage() {
    playing = false;
    moveDirection = 0;
    hideMiniMap();
    hideAllPages();
    if (levelPage) levelPage.classList.remove("hidden");
}

function showRestartPage() {
    playing = false;
    moveDirection = 0;
    hideMiniMap();
    hideAllPages();
    if (restartPage) restartPage.classList.remove("hidden");
}

function showWinPage() {
    playing = false;
    moveDirection = 0;
    hideMiniMap();
    hideAllPages();
    if (winPage) winPage.classList.remove("hidden");
}

/* =====================================================
   BUTTON EVENTS
===================================================== */
if (startButton) {
    startButton.addEventListener("click", function () {
        hideAllPages();
        if (levelPage) levelPage.classList.remove("hidden");
        playMenuMusic();
    });
}

levelButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
        event.preventDefault();
        selectedLevel = Number(button.dataset.level);
        startSelectedLevel();
    });
});

function startSelectedLevel() {
    stopMenuMusic();
    hideAllPages();
    if (gamePage) gamePage.classList.remove("hidden");
    resetGame();
    playing = true;

    const miniMapCanvas = document.getElementById("miniMapCanvas");
    if (miniMapCanvas) miniMapCanvas.style.display = "block";

    moveDirection = 0;
    lastTime = performance.now();
    startMusic();
}

function resetGame() {
    hideMiniMap();
    setSeed(getLevelSeed(selectedLevel));

    buildings = [];
    traps = [];
    clouds = [];
    sharks = [];

    nextBuildingX = 0;
    cameraX = 0;
    distance = 1;
    gameTime = 0;
    moveDirection = 0;

    player.visible = true;
    player.enteringGate = false;
    player.velocityY = 0;

    createLevelMap();

    player.x = 180;
    player.velocityY = 0;
    player.grounded = true;
    player.y = buildings[0] ? buildings[0].y - player.height : 0;

    createClouds();
    createSharks();
    createTraps();
    createWinGate();
    updateDistance();
}

/* =====================================================
   CREATE LEVEL MAP
===================================================== */
function createLevelMap() {
    buildings = [];
    nextBuildingX = 0;

    buildings.push({
        x: 0,
        y: H - BUILDING_Y_OFFSET - BUILDING_HEIGHT,
        width: 1050,
        height: BUILDING_HEIGHT
    });

    nextBuildingX = 1050;
    const level = selectedLevel;
    let platformCount = 70 + level * 8;
    let previousY = buildings[0].y;

    for (let i = 0; i < platformCount; i++) {
        let width = random(180 - level * 8, 330 - level * 5);
        width = Math.max(150, width);

        let yChange = random(-75 - level * 8, 75 + level * 8);
        yChange = Math.max(-115, Math.min(115, yChange));

        let y = previousY + yChange;
        const minY = H - BUILDING_Y_OFFSET - BUILDING_HEIGHT - 110;
        const maxY = H - BUILDING_Y_OFFSET - BUILDING_HEIGHT + 100;
        y = Math.max(minY, Math.min(maxY, y));

        let gapChance = 0.12 + level * 0.025;
        let gap = 0;

        if (seededRandom() < gapChance) {
            gap = random(35 + level * 5, 80 + level * 8);
        }

        const x = nextBuildingX + gap;
        buildings.push({
            x: x,
            y: y,
            width: width,
            height: BUILDING_HEIGHT
        });

        nextBuildingX = x + width;
        previousY = y;
    }
}

/* =====================================================
   DECORATIONS (CLOUDS & SHARKS)
===================================================== */
function createClouds() {
    clouds = [];
    for (let i = 0; i < 80; i++) {
        clouds.push({
            x: i * 500 + random(-150, 150),
            y: random(60, H * 0.35),
            scale: random(0.7, 1.5),
            speed: random(0.08, 0.18)
        });
    }
}

function updateClouds(dt) {
    for (const cloud of clouds) {
        cloud.x += cloud.speed * 100 * dt;
        if (cloud.x < cameraX - 500) {
            cloud.x = cameraX + W + random(100, 500);
        }
    }
}

function createSharks() {
    sharks = [];
    for (let i = 0; i < MAX_SHARKS; i++) {
        sharks.push({
            x: 1300 + i * 2500 + random(0, 700),
            y: random(100, H * 0.42),
            scale: random(0.45, 0.65),
            speed: random(20, 45),
            phase: random(0, Math.PI * 2)
        });
    }
}

function updateSharks(dt) {
    for (const shark of sharks) {
        shark.phase += dt * 1.5;
        shark.x += shark.speed * dt;
        shark.y += Math.sin(shark.phase) * 15 * dt;

        if (shark.x < cameraX - 300) {
            shark.x = cameraX + W + random(300, 1000);
            shark.y = random(100, H * 0.4);
        }
    }
}

/* =====================================================
   TRAP LOGIC
===================================================== */
function createTraps() {
    traps = [];
    const targetDistance = LEVEL_DISTANCE[selectedLevel];
    const finishX = 180 + targetDistance / DISTANCE_RATE;
    const safeX = 950;
    const level = selectedLevel;

    let minSpacing = Math.max(190, 330 - level * 25);
    let lastTrapX = safeX - minSpacing;

    for (const building of buildings) {
        if (building.x >= finishX - 400) break;
        if (building.x < safeX) continue;
        if (building.x < lastTrapX + minSpacing) continue;

        const trapChance = 0.52 + level * 0.08;
        if (seededRandom() > trapChance) continue;

        const type = TRAP_TYPES[randomInt(0, TRAP_TYPES.length - 1)];
        const margin = 50;
        const usableWidth = Math.max(40, building.width - margin * 2);
        const x = building.x + margin + random(0, usableWidth);
        const surprise = seededRandom() < (0.15 + level * 0.06);

        const specialChance = 0.10 + selectedLevel * 0.05;
        if (seededRandom() < specialChance) {
            const specialTypes = ["lightning", "fakeGate", "fallingBuilding"];
            const specialType = specialTypes[randomInt(0, specialTypes.length - 1)];

            traps.push({
                type: specialType,
                x: x,
                y: building.y,
                width: 70,
                height: 60,
                active: true,
                triggered: false,
                visible: true,
                surprise: true,
                revealTime: 0,
                velocityY: 0,
                startY: building.y - 120,
                phase: random(0, Math.PI * 2),
                warning: false,
                warningTime: 0,
                attackTime: 0,
                originalX: x,
                originalY: building.y,
                targetX: x,
                triggeredOnce: false
            });
            lastTrapX = x;
            continue;
        }

        traps.push({
            type: type,
            x: x,
            y: building.y,
            width: 55,
            height: 45,
            active: true,
            triggered: false,
            visible: !surprise,
            surprise: surprise,
            revealTime: 0,
            velocityY: 0,
            startY: building.y - 120,
            phase: random(0, Math.PI * 2)
        });

        lastTrapX = x;
        if (traps.length >= MAX_TRAPS) break;
    }

    createFinalTraps(finishX);
}

function createFinalTraps(finishX) {
    const level = selectedLevel;
    const lateStart = finishX - 1600;
    const candidates = buildings.filter(b => b.x >= lateStart && b.x < finishX - 400);
    const count = Math.min(3 + level, candidates.length);

    for (let i = 0; i < count; i++) {
        const building = candidates[i * Math.max(1, Math.floor(candidates.length / count))];
        if (!building) continue;

        const x = building.x + building.width / 2;
        const type = TRAP_TYPES[randomInt(0, TRAP_TYPES.length - 1)];

        if (traps.some(trap => Math.abs(trap.x - x) < 100)) continue;

        traps.push({
            type: type,
            x: x,
            y: building.y,
            width: 55,
            height: 45,
            active: true,
            triggered: false,
            visible: true,
            surprise: false,
            revealTime: 0,
            velocityY: 0,
            startY: building.y - 120,
            phase: random(0, Math.PI * 2)
        });
    }
}

function updateTraps(dt) {
    for (const trap of traps) {
        if (trap.surprise && !trap.visible) {
            if (Math.abs(player.x - trap.x) < 180) {
                trap.visible = true;
                trap.revealTime = 0;
            }
        }

        if (trap.visible && trap.revealTime < 0.25) {
            trap.revealTime += dt;
        }

        if (trap.type === "moving") {
            trap.phase += dt * 3;
            trap.y = trap.startY + Math.sin(trap.phase) * 90;
        }

        if (trap.type === "falling") {
            if (!trap.triggered && player.x > trap.x - 280 && player.x < trap.x + 280) {
                trap.triggered = true;
            }
            if (trap.triggered) {
                trap.velocityY += 1500 * dt;
                trap.y += trap.velocityY * dt;
                if (trap.y > H + 100) {
                    trap.y = trap.startY;
                    trap.velocityY = 0;
                    trap.triggered = false;
                }
            }
        }

        if (trap.type === "lightning") updateLightningTrap(trap, dt);
        if (trap.type === "fakeGate") updateFakeGateTrap(trap, dt);
        if (trap.type === "fallingBuilding") updateFallingBuildingTrap(trap, dt);
    }
}

function updateLightningTrap(trap, dt) {
    const distance = Math.abs(player.x - trap.x);
    if (!trap.triggered && distance < 240) {
        trap.triggered = true;
        trap.warning = true;
        trap.warningTime = 0;
    }
    if (!trap.triggered) return;

    trap.warningTime += dt;
    if (trap.warningTime < 0.65) {
        trap.warning = true;
        return;
    }

    trap.warning = false;
    trap.attackTime += dt;

    if (trap.attackTime > 0.25) {
        trap.triggered = false;
        trap.attackTime = 0;
        trap.warningTime = 0;
    }
}

function updateFakeGateTrap(trap, dt) {
    const distance = Math.abs(player.x - trap.x);
    if (!trap.triggered && distance < 180) {
        trap.triggered = true;
        trap.attackTime = 0;
        trap.warning = true;
    }
    if (!trap.triggered) return;

    trap.attackTime += dt;
    if (trap.attackTime < 0.45) {
        trap.warning = true;
        return;
    }

    trap.warning = false;
    if (trap.attackTime < 1.2) {
        const p = (trap.attackTime - 0.45) / 0.75;
        trap.x = trap.originalX + 300 * p;
    }

    if (!trap.triggeredOnce && trap.attackTime >= 1.2) {
        trap.triggeredOnce = true;
        traps.push({
            type: "spike",
            x: trap.originalX,
            y: trap.originalY,
            width: 70,
            height: 50,
            active: true,
            triggered: false,
            visible: true,
            surprise: false,
            revealTime: 0,
            velocityY: 0,
            startY: trap.originalY - 120,
            phase: 0
        });
    }
}

function updateFallingBuildingTrap(trap, dt) {
    const distance = Math.abs(player.x - trap.x);
    if (!trap.triggered && distance < 300) {
        trap.triggered = true;
        trap.warning = true;
        trap.warningTime = 0;
        trap.y = trap.originalY - 420;
        trap.velocityY = 0;
    }
    if (!trap.triggered) return;

    trap.warningTime += dt;
    if (trap.warningTime < 0.45) {
        trap.warning = true;
        return;
    }

    trap.warning = false;
    trap.velocityY += 2300 * dt;
    trap.y += trap.velocityY * dt;

    if (trap.y > trap.originalY) {
        trap.y = trap.originalY;
        trap.velocityY = 0;
    }
}

/* =====================================================
   COLLISION CHECKS
===================================================== */
function checkTrapCollision() {
    if (!player.visible) return;

    function checkSpecialTrapCollision(trap) {
        if (!trap.active || !trap.visible) return false;

        let left, right, top, bottom;

        if (trap.type === "lightning") {
            if (trap.warning || !trap.triggered || trap.warningTime < 0.65) return false;
            left = trap.x - 35;
            right = trap.x + 35;
            top = -100;
            bottom = trap.originalY;
        } else if (trap.type === "fallingBuilding") {
            if (trap.warning) return false;
            left = trap.x - 55;
            right = trap.x + 55;
            top = trap.y - 60;
            bottom = trap.y + 20;
        } else {
            return false;
        }

        const playerLeft = player.x + 7;
        const playerRight = player.x + player.width - 7;
        const playerTop = player.y + 5;
        const playerBottom = player.y + player.height;

        return (playerRight > left && playerLeft < right && playerBottom > top && playerTop < bottom);
    }

    const playerLeft = player.x + 7;
    const playerRight = player.x + player.width - 7;
    const playerTop = player.y + 5;
    const playerBottom = player.y + player.height;

    for (const trap of traps) {
        if (checkSpecialTrapCollision(trap)) {
            die();
            return;
        }

        let trapLeft, trapRight, trapTop, trapBottom;

        if (trap.type === "spike") {
            trapLeft = trap.x - 30; trapRight = trap.x + 30;
            trapTop = trap.y - 38; trapBottom = trap.y + 5;
        } else if (trap.type === "hole") {
            trapLeft = trap.x - 30; trapRight = trap.x + 30;
            trapTop = trap.y - 8; trapBottom = trap.y + 12;
        } else if (trap.type === "electric") {
            trapLeft = trap.x - 30; trapRight = trap.x + 30;
            trapTop = trap.y - 30; trapBottom = trap.y + 8;
        } else if (trap.type === "fire") {
            trapLeft = trap.x - 25; trapRight = trap.x + 25;
            trapTop = trap.y - 48; trapBottom = trap.y + 8;
        } else if (trap.type === "moving") {
            trapLeft = trap.x - 25; trapRight = trap.x + 25;
            trapTop = trap.y - 28; trapBottom = trap.y + 8;
        } else {
            trapLeft = trap.x - 22; trapRight = trap.x + 22;
            trapTop = trap.y - 22; trapBottom = trap.y + 22;
        }

        if (playerRight > trapLeft && playerLeft < trapRight && playerBottom > trapTop && playerTop < trapBottom) {
            die();
            return;
        }
    }
}

function jump() {
    if (!playing) return;
    if (player.grounded) {
        player.velocityY = -JUMP_FORCE;
        player.grounded = false;
    }
}

function checkGround() {
    player.grounded = false;
    const left = player.x + 5;
    const right = player.x + player.width - 5;
    const previousBottom = player.y + player.height - player.velocityY * 0.016;
    const bottom = player.y + player.height;

    let bestGround = null;
    let bestRoof = Infinity;

    for (const building of buildings) {
        const leftEdge = building.x;
        const rightEdge = building.x + building.width;
        const roof = building.y;

        if (!(right > leftEdge && left < rightEdge)) continue;
        if (player.velocityY < 0) continue;

        const crossedRoof = previousBottom <= roof && bottom >= roof;
        const nearRoof = bottom >= roof && bottom <= roof + 55;

        if (!crossedRoof && !nearRoof) continue;

        if (roof < bestRoof) {
            bestRoof = roof;
            bestGround = building;
        }
    }

    if (bestGround) {
        player.y = bestGround.y - player.height;
        player.velocityY = 0;
        player.grounded = true;
    }
}

/* =====================================================
   UPDATE PLAYER & CAMERA
===================================================== */
function updatePlayer(dt) {
    player.x += moveDirection * MOVE_SPEED * dt;
    if (player.x < 50) player.x = 50;

    player.velocityY += GRAVITY * dt;
    player.y += player.velocityY * dt;

    checkGround();

    if (player.y > H + 250) {
        let lowerPlatform = null;
        for (const building of buildings) {
            const horizontal = player.x + player.width > building.x && player.x < building.x + building.width;
            if (!horizontal) continue;
            if (building.y > player.y + player.height) {
                if (lowerPlatform === null || building.y < lowerPlatform.y) {
                    lowerPlatform = building;
                }
            }
        }
        if (lowerPlatform) return;
        die();
    }
}

function updateCamera(dt) {
    const target = Math.max(0, player.x - W * 0.28);
    cameraX += (target - cameraX) * Math.min(1, dt * 6);
}

function updateDistance() {
    const target = LEVEL_DISTANCE[selectedLevel];
    distance = Math.max(1, (player.x - 180) * DISTANCE_RATE);
    const shownDistance = Math.min(Math.floor(distance), target);

    const distanceElement = document.getElementById("distance");
    if (distanceElement) distanceElement.textContent = shownDistance;

    const targetElement = document.getElementById("targetDistance");
    if (targetElement) targetElement.textContent = target;

    const levelElement = document.getElementById("currentLevel");
    if (levelElement) levelElement.textContent = "LEVEL " + selectedLevel;
}

function die() {
    if (!playing) return;
    playing = false;
    moveDirection = 0;

    player.velocityY = 0;
    player.grounded = false;
    player.enteringGate = false;

    if (player.y > H - 300) player.y = H - 300;
    cameraX = Math.max(0, player.x - W * 0.28);
    player.visible = true;

    if (deadLevel) deadLevel.textContent = selectedLevel;
    showRestartPage();
}

function winLevel() {
    if (winGate.state !== "finished") return;

    moveDirection = 0;
    playing = false;
    player.visible = false;
    player.enteringGate = false;

    if (completedLevel) completedLevel.textContent = selectedLevel;
    showWinPage();
}

/* =====================================================
   WIN GATE LOGIC
===================================================== */
function createWinGate() {
    const targetDistance = LEVEL_DISTANCE[selectedLevel];
    const gateX = 180 + targetDistance / DISTANCE_RATE;

    let gateBuilding = buildings.find(b => gateX >= b.x && gateX <= b.x + b.width);
    if (!gateBuilding) gateBuilding = buildings[buildings.length - 1];

    winGate.x = gateX;
    winGate.y = gateBuilding.y;
    winGate.originalY = gateBuilding.y;
    winGate.width = 90;
    winGate.height = 180;
    winGate.state = "open";
    winGate.animationTime = 0;
}

function startGateAnimation() {
    if (!playing || winGate.state !== "open") return;

    moveDirection = 0;
    playing = false;

    player.x = winGate.x - player.width / 2;
    player.y = winGate.y - player.height;
    player.velocityY = 0;
    player.grounded = true;
    player.enteringGate = true;
    player.visible = false;

    winGate.state = "closing";
    winGate.animationTime = 0;
}

function updateWinGate(dt) {
    if (winGate.state === "open") return;

    if (winGate.state === "closing") {
        winGate.animationTime += dt;
        if (winGate.animationTime / winGate.closeDuration >= 1) {
            winGate.state = "sinking";
            winGate.animationTime = 0;
        }
        return;
    }

    if (winGate.state === "sinking") {
        winGate.animationTime += dt;
        const progress = Math.min(1, winGate.animationTime / winGate.sinkDuration);
        const eased = progress * progress * (3 - 2 * progress);

        winGate.y = winGate.originalY + winGate.sinkDistance * eased;

        if (progress >= 1) {
            winGate.state = "finished";
            player.visible = false;
            player.enteringGate = false;
            moveDirection = 0;
            winLevel();
        }
    }
}

function checkWinGateCollision() {
    if (winGate.state !== "open") return false;

    const playerLeft = player.x;
    const playerRight = player.x + player.width;
    const playerTop = player.y;
    const playerBottom = player.y + player.height;

    const gateLeft = winGate.x - winGate.width / 2;
    const gateRight = winGate.x + winGate.width / 2;
    const gateTop = winGate.y - winGate.height;
    const gateBottom = winGate.y;

    if (playerRight > gateLeft && playerLeft < gateRight && playerBottom > gateTop && playerTop < gateBottom) {
        startGateAnimation();
        return true;
    }
    return false;
}

/* =====================================================
   RENDER / DRAW
===================================================== */
function drawBackground() {

    const gradient = ctx.createLinearGradient(0, 0, 0, H);

    /* =========================================
       LEVEL 1 - 5
       🌃 NIGHT CITY
    ========================================= */
    if (selectedLevel <= 5) {

        gradient.addColorStop(0, "#071020");
        gradient.addColorStop(0.55, "#182941");
        gradient.addColorStop(1, "#5b6878");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        // Moon
        ctx.fillStyle = "rgba(230,235,220,0.75)";

        ctx.beginPath();

        ctx.arc(
            W * 0.80,
            H * 0.18,
            35,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    /* =========================================
       LEVEL 6 - 10
       🌅 SUNSET
    ========================================= */
    else if (selectedLevel <= 10) {

        gradient.addColorStop(0, "#160d2b");
        gradient.addColorStop(0.35, "#5b2757");
        gradient.addColorStop(0.65, "#c85c4a");
        gradient.addColorStop(1, "#f2a65a");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        // Sun
        ctx.fillStyle = "rgba(255,225,150,0.9)";

        ctx.beginPath();

        ctx.arc(
            W * 0.78,
            H * 0.22,
            42,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    /* =========================================
       LEVEL 11 - 15
       🌌 DARK PURPLE / DANGER
    ========================================= */
    else {

        gradient.addColorStop(0, "#02020b");
        gradient.addColorStop(0.35, "#0c0924");
        gradient.addColorStop(0.65, "#241044");
        gradient.addColorStop(1, "#09051a");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        // Purple Moon
        ctx.fillStyle = "rgba(190,150,255,0.75)";

        ctx.beginPath();

        ctx.arc(
            W * 0.80,
            H * 0.18,
            35,
            0,
            Math.PI * 2
        );

        ctx.fill();

        // Small stars
        ctx.fillStyle = "rgba(255,255,255,0.7)";

        for (let i = 0; i < 35; i++) {

            const x = (i * 137) % W;
            const y = (i * 73) % (H * 0.55);

            const size = (i % 3) + 1;

            ctx.fillRect(
                x,
                y,
                size,
                size
            );
        }
    }
}
function drawCloud(cloud) {
    const x = cloud.x - cameraX * 0.55;
    const y = cloud.y;
    const s = cloud.scale;

    if (x < -400 || x > W + 400) return;

    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#c4ccd6";
    ctx.beginPath();
    ctx.arc(x, y, 32 * s, 0, Math.PI * 2);
    ctx.arc(x + 35 * s, y - 15 * s, 42 * s, 0, Math.PI * 2);
    ctx.arc(x + 75 * s, y, 30 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawClouds() {
    for (const cloud of clouds) drawCloud(cloud);
}

function drawBuildings() {
    for (const building of buildings) {
        const x = building.x - cameraX;
        const y = building.y;

        if (x > W + 300 || x + building.width < -300) continue;

        ctx.fillStyle = "#090e18";
        ctx.fillRect(x, y, building.width, building.height);

        ctx.fillStyle = "#202b3a";
        ctx.fillRect(x, y, building.width, 8);

        ctx.fillStyle = "#9b8750";
        const columns = Math.floor(building.width / 35);
        const rows = Math.floor(building.height / 40);

        for (let col = 0; col < columns; col++) {
            for (let row = 0; row < rows; row++) {
                if ((col * 7 + row * 11) % 5 < 3) {
                    ctx.fillRect(x + 12 + col * 35, y + 25 + row * 40, 10, 13);
                }
            }
        }
    }
}

function drawTraps() {
    for (const trap of traps) {
        if (!trap.visible) continue;
        const x = trap.x - cameraX;
        const y = trap.y;

        if (x < -150 || x > W + 150) continue;

        ctx.save();
        if (trap.surprise && trap.revealTime < 0.25) {
            const p = trap.revealTime / 0.25;
            ctx.globalAlpha = p;
            ctx.translate(0, 20 * (1 - p));
        }

        if (trap.type === "spike") drawSpike(x, y);
        else if (trap.type === "hole") drawHole(x, y);
        else if (trap.type === "electric") drawElectric(x, y);
        else if (trap.type === "fire") drawFire(x, y);
        else if (trap.type === "moving") drawMoving(x, y);
        else if (trap.type === "lightning") drawLightningTrap(x, y, trap);
        else if (trap.type === "fakeGate") drawFakeGateTrap(x, y, trap);
        else if (trap.type === "fallingBuilding") drawFallingBuildingTrap(x, y, trap);
        else drawFalling(x, y);

        ctx.restore();
    }
}

function drawLightningTrap(x, y, trap) {
    ctx.save();
    if (trap.warning) {
        const pulse = 0.5 + Math.sin(gameTime * 15) * 0.5;
        ctx.globalAlpha = 0.35 + pulse * 0.4;
        ctx.fillStyle = "#fff36a";
        ctx.beginPath();
        ctx.ellipse(x, y - 5, 38, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#fff36a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, y);
        ctx.stroke();
    }

    if (trap.triggered && !trap.warning && trap.warningTime >= 0.65) {
        ctx.strokeStyle = "#e9fbff";
        ctx.shadowColor = "#55ddff";
        ctx.shadowBlur = 25;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x - 15, y - 80);
        ctx.lineTo(x + 12, y - 40);
        ctx.lineTo(x - 5, y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawFakeGateTrap(x, y, trap) {
    ctx.save();
    const pulse = Math.sin(gameTime * 8) * 3;
    ctx.strokeStyle = "#ffcc55";
    ctx.lineWidth = 8;
    ctx.shadowColor = "#ffcc55";
    ctx.shadowBlur = 15;
    ctx.strokeRect(x - 40, y - 150, 80, 150);

    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff0a0";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FINISH?", x, y - 165);

    if (trap.triggered) {
        ctx.fillStyle = "#d8dce2";
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(trap.originalX - 35 + i * 18, trap.originalY);
            ctx.lineTo(trap.originalX - 26 + i * 18, trap.originalY - 35 - pulse);
            ctx.lineTo(trap.originalX - 17 + i * 18, trap.originalY);
            ctx.closePath();
            ctx.fill();
        }
    }
    ctx.restore();
}

function drawFallingBuildingTrap(x, y, trap) {
    ctx.save();
    if (trap.warning) {
        ctx.fillStyle = "rgba(255,80,60,0.25)";
        ctx.fillRect(x - 55, trap.originalY - 5, 110, 10);
        ctx.strokeStyle = "#ff5544";
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(x - 60, trap.originalY - 65, 120, 75);
        ctx.setLineDash([]);
    }

    ctx.fillStyle = "#303a48";
    ctx.fillRect(x - 55, y - 60, 110, 70);

    ctx.fillStyle = "#9b8750";
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
            ctx.fillRect(x - 43 + col * 27, y - 47 + row * 25, 10, 12);
        }
    }
    ctx.restore();
}

function drawSpike(x, y) {
    ctx.fillStyle = "#505864";
    ctx.fillRect(x - 30, y - 5, 60, 8);
    ctx.fillStyle = "#c2c8ce";
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 27 + i * 18, y);
        ctx.lineTo(x - 18 + i * 18, y - 38);
        ctx.lineTo(x - 9 + i * 18, y);
        ctx.closePath();
        ctx.fill();
    }
}

function drawHole(x, y) {
    ctx.fillStyle = "#020306";
    ctx.fillRect(x - 28, y - 3, 56, 12);
    ctx.strokeStyle = "#68717d";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 28, y - 3, 56, 12);
}

function drawElectric(x, y) {
    ctx.fillStyle = "#333d4a";
    ctx.fillRect(x - 28, y - 5, 56, 8);
    ctx.strokeStyle = "#b9eaff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 22, y - 8);
    ctx.lineTo(x - 8, y - 25);
    ctx.lineTo(x, y - 8);
    ctx.lineTo(x + 13, y - 28);
    ctx.lineTo(x + 25, y - 8);
    ctx.stroke();
}

function drawFire(x, y) {
    const flame = Math.sin(gameTime * 10) * 5;
    ctx.fillStyle = "#713020";
    ctx.fillRect(x - 25, y - 5, 50, 8);
    ctx.fillStyle = "#e76f24";
    ctx.beginPath();
    ctx.moveTo(x - 20, y);
    ctx.quadraticCurveTo(x - 12, y - 45 - flame, x - 3, y);
    ctx.quadraticCurveTo(x + 5, y - 35 + flame, x + 13, y);
    ctx.closePath();
    ctx.fill();
}

function drawMoving(x, y) {
    ctx.fillStyle = "#6b7380";
    ctx.fillRect(x - 25, y - 8, 50, 12);
    ctx.fillStyle = "#d2d7dc";
    ctx.beginPath();
    ctx.arc(x, y - 12, 18, 0, Math.PI * 2);
    ctx.fill();
}

function drawFalling(x, y) {
    ctx.fillStyle = "#444b56";
    ctx.fillRect(x - 22, y - 22, 44, 44);
    ctx.fillStyle = "#1b2028";
    ctx.fillRect(x - 15, y - 15, 30, 30);
    ctx.fillStyle = "#d8a832";
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x - 9, y + 9);
    ctx.lineTo(x + 9, y + 9);
    ctx.closePath();
    ctx.fill();
}

function drawWinGate() {
    const x = winGate.x - cameraX;
    const y = winGate.y;

    if (x < -250 || x > W + 250) return;

    ctx.save();
    let closeProgress = 0;
    if (winGate.state === "closing") {
        closeProgress = Math.min(1, winGate.animationTime / winGate.closeDuration);
    }
    const doorMove = 31 * closeProgress;

    let sinkProgress = 0;
    if (winGate.state === "sinking") {
        sinkProgress = Math.min(1, winGate.animationTime / winGate.sinkDuration);
    }

    ctx.globalAlpha = Math.max(0, 1 - sinkProgress);

    ctx.shadowColor = "#66ddff";
    ctx.shadowBlur = 25;
    ctx.fillStyle = "#6edcff";
    ctx.fillRect(x - 45, y - 180, 14, 180);
    ctx.fillRect(x + 31, y - 180, 14, 180);
    ctx.fillRect(x - 45, y - 180, 90, 14);
    ctx.shadowBlur = 0;

    const innerGradient = ctx.createLinearGradient(x, y - 160, x, y);
    innerGradient.addColorStop(0, "rgba(100,220,255,0.45)");
    innerGradient.addColorStop(1, "rgba(100,220,255,0.05)");
    ctx.fillStyle = innerGradient;
    ctx.fillRect(x - 31, y - 166, 62, 166);

    ctx.fillStyle = "#49bfe8";
    ctx.fillRect(x - 31, y - 166, Math.max(0, 31 - doorMove), 166);
    ctx.fillRect(x + doorMove, y - 166, Math.max(0, 31 - doorMove), 166);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText("FINISH", x, y - 195);

    if (winGate.state === "open") {
        ctx.font = "bold 30px Arial";
        ctx.fillText("↓", x, y - 130);
    }
    ctx.restore();
}

function drawPlayer() {
    if (!player.visible) return;

    const x = player.x - cameraX;
    const y = player.y;

    ctx.save();
    ctx.translate(x + player.width / 2, y + player.height / 2);

    let bob = (player.grounded && moveDirection !== 0) ? Math.sin(gameTime * 15) * 2 : 0;
    ctx.translate(0, bob);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 34, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#171b22";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-5, 13); ctx.lineTo(-8, 34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 13); ctx.lineTo(8, 34); ctx.stroke();

    ctx.strokeStyle = "#080b10";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-9, 34); ctx.lineTo(-16, 34); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, 34); ctx.lineTo(16, 34); ctx.stroke();

    ctx.fillStyle = "#245ca8";
    ctx.beginPath();
    ctx.roundRect(-11, -10, 22, 27, 5);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.13)";
    ctx.fillRect(-6, -8, 5, 23);

    ctx.strokeStyle = "#d89d78";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-9, -5); ctx.lineTo(-17, 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, -5); ctx.lineTo(17, 10); ctx.stroke();

    ctx.fillStyle = "#e0a47e";
    ctx.beginPath(); ctx.arc(-18, 11, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(18, 11, 4, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#d99c75";
    ctx.fillRect(-5, -18, 10, 9);

    ctx.fillStyle = "#e2a77f";
    ctx.beginPath(); ctx.arc(0, -27, 13, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#d59670";
    ctx.beginPath(); ctx.arc(-13, -26, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13, -26, 4, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#17191d";
    ctx.beginPath(); ctx.arc(0, -31, 13, Math.PI, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-12, -31); ctx.quadraticCurveTo(-5, -40, 4, -36); ctx.quadraticCurveTo(10, -39, 13, -31); ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#25252a";
    ctx.beginPath(); ctx.arc(-5, -27, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -27, 1.5, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = "#bd805e";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(2, -22); ctx.stroke();

    ctx.fillStyle = "rgba(80,40,30,0.25)";
    ctx.fillRect(-5, -18, 10, 3);

    ctx.restore();
}

function drawShark(shark) {
    const x = shark.x - cameraX;
    const y = shark.y;
    const s = shark.scale;

    if (x < -250 || x > W + 250) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);

    ctx.fillStyle = "#3f82b6";
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    ctx.quadraticCurveTo(-55, -30, 25, -20);
    ctx.quadraticCurveTo(70, -12, 90, 0);
    ctx.quadraticCurveTo(70, 15, 25, 22);
    ctx.quadraticCurveTo(-55, 30, -100, 0);
    ctx.fill();

    ctx.fillStyle = "#326e9f";
    ctx.beginPath();
    ctx.moveTo(75, 0);
    ctx.lineTo(120, -42);
    ctx.lineTo(108, 0);
    ctx.lineTo(120, 42);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(20, -17);
    ctx.lineTo(35, -55);
    ctx.lineTo(50, -15);
    ctx.closePath();
    ctx.fill();

    const flap = Math.sin(gameTime * 6) * 0.18;
    ctx.save();
    ctx.rotate(flap);
    ctx.fillStyle = "#dcecff";
    ctx.beginPath();
    ctx.moveTo(-15, -15);
    ctx.quadraticCurveTo(-40, -70, -82, -100);
    ctx.quadraticCurveTo(-50, -55, -10, -25);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-10, 15);
    ctx.quadraticCurveTo(-40, 70, -82, 100);
    ctx.quadraticCurveTo(-48, 55, -8, 25);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#10151c";
    ctx.beginPath();
    ctx.arc(-72, -8, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawSharks() {
    for (const shark of sharks) drawShark(shark);
}

function drawMiniMap() {
    const miniMapCanvas = document.getElementById("miniMapCanvas");
    if (!miniMapCanvas) return;

    if (!playing) {
        miniMapCanvas.style.display = "none";
        return;
    }

    miniMapCanvas.style.display = "block";
    const mapCtx = miniMapCanvas.getContext("2d");
    const rect = miniMapCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const width = rect.width;
    const height = rect.height;
    if (width <= 0 || height <= 0) return;

    const realWidth = Math.floor(width * dpr);
    const realHeight = Math.floor(height * dpr);

    if (miniMapCanvas.width !== realWidth || miniMapCanvas.height !== realHeight) {
        miniMapCanvas.width = realWidth;
        miniMapCanvas.height = realHeight;
    }

    mapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mapCtx.clearRect(0, 0, width, height);

    const padding = 12;
    const mapWidth = width - padding * 2;
    const mapHeight = height - padding * 2;

    const startX = 0;
    const finishX = winGate.x + 100;
    const worldWidth = Math.max(1, finishX - startX);

    let minY = Infinity, maxY = -Infinity;
    for (const building of buildings) {
        if (building.x > finishX) continue;
        minY = Math.min(minY, building.y);
        maxY = Math.max(maxY, building.y);
    }

    if (minY === Infinity || maxY === -Infinity) return;

    minY -= 60;
    maxY += 60;
    const worldHeight = Math.max(1, maxY - minY);

    function miniX(worldX) { return padding + (worldX / worldWidth) * mapWidth; }
    function miniY(worldY) { return padding + ((worldY - minY) / worldHeight) * mapHeight; }

    mapCtx.save();
    mapCtx.beginPath();
    let started = false;

    for (const building of buildings) {
        if (building.x > finishX) continue;
        const x1 = miniX(Math.max(startX, building.x));
        const x2 = miniX(Math.min(finishX, building.x + building.width));
        const y = miniY(building.y);

        if (!started) { mapCtx.moveTo(x1, y); started = true; }
        else mapCtx.lineTo(x1, y);
        mapCtx.lineTo(x2, y);
    }

    mapCtx.strokeStyle = "#e4e8ed";
    mapCtx.lineWidth = 7;
    mapCtx.lineCap = "round";
    mapCtx.lineJoin = "round";
    mapCtx.stroke();

    mapCtx.beginPath();
    started = false;
    for (const building of buildings) {
        if (building.x > finishX) continue;
        const x1 = miniX(Math.max(startX, building.x));
        const x2 = miniX(Math.min(finishX, building.x + building.width));
        const y = miniY(building.y);

        if (!started) { mapCtx.moveTo(x1, y); started = true; }
        else mapCtx.lineTo(x1, y);
        mapCtx.lineTo(x2, y);
    }

    mapCtx.strokeStyle = "#58636f";
    mapCtx.lineWidth = 2;
    mapCtx.stroke();

    const sx = miniX(180);
    const startBuilding = buildings[0];
    const sy = miniY(startBuilding ? startBuilding.y : minY);

    mapCtx.fillStyle = "#ffffff";
    mapCtx.beginPath();
    mapCtx.arc(sx, sy, 4, 0, Math.PI * 2);
    mapCtx.fill();

    const px = miniX(Math.max(startX, Math.min(player.x, finishX)));
    const py = miniY(player.y + player.height);

    mapCtx.fillStyle = "#ffffff";
    mapCtx.beginPath();
    mapCtx.arc(px, py, 4, 0, Math.PI * 2);
    mapCtx.fill();

    mapCtx.strokeStyle = "rgba(255,255,255,0.45)";
    mapCtx.lineWidth = 2;
    mapCtx.beginPath();
    mapCtx.arc(px, py, 7, 0, Math.PI * 2);
    mapCtx.stroke();

    const fx = miniX(winGate.x);
    const fy = miniY(winGate.y);

    mapCtx.fillStyle = "#55ddff";
    mapCtx.fillRect(fx - 3, fy - 9, 6, 14);

    mapCtx.strokeStyle = "rgba(85,221,255,0.5)";
    mapCtx.lineWidth = 2;
    mapCtx.beginPath();
    mapCtx.arc(fx, fy - 2, 8, 0, Math.PI * 2);
    mapCtx.stroke();

    mapCtx.restore();
}

function draw() {
    drawBackground();
    drawClouds();
    drawSharks();
    drawBuildings();
    drawTraps();
    drawWinGate();
    drawPlayer();
    drawMiniMap();
}

function update(dt) {
    updateWinGate(dt);
    if (!playing) return;

    gameTime += dt;
    updatePlayer(dt);
    if (!playing) return;

    updateTraps(dt);
    checkTrapCollision();
    if (!playing) return;

    checkWinGateCollision();
    if (!playing) return;

    updateCamera(dt);
    updateClouds(dt);
    updateSharks(dt);
    updateDistance();
}

function gameLoop(currentTime) {
    const dt = Math.min(0.033, (currentTime - lastTime) / 1000);
    lastTime = currentTime;
    update(dt);
    draw();
    requestAnimationFrame(gameLoop);
}

/* =====================================================
   INPUT CONTROLS
===================================================== */
document.addEventListener("keydown", function (event) {
    if (event.code === "ArrowRight" || event.code === "KeyD") {
        event.preventDefault();
        if (playing) moveDirection = 1;
    } else if (event.code === "ArrowLeft" || event.code === "KeyA") {
        event.preventDefault();
        if (playing) moveDirection = -1;
    } else if (event.code === "ArrowUp") {
        event.preventDefault();
        jump();
    } else if (event.code === "Space") {
        event.preventDefault();
    }
});

document.addEventListener("keyup", function (event) {
    if (["ArrowRight", "KeyD", "ArrowLeft", "KeyA"].includes(event.code)) {
        event.preventDefault();
        moveDirection = 0;
    }
});

const jumpButton = document.getElementById("jumpButton");
const forwardButton = document.getElementById("forwardButton");
const backButton = document.getElementById("backButton");

if (forwardButton) {
    forwardButton.addEventListener("pointerdown", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (playing) moveDirection = 1;
    });
    forwardButton.addEventListener("pointerup", function (e) {
        e.preventDefault(); e.stopPropagation();
        moveDirection = 0;
    });
    forwardButton.addEventListener("pointercancel", function () { moveDirection = 0; });
}

if (backButton) {
    backButton.addEventListener("pointerdown", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (playing) moveDirection = -1;
    });
    backButton.addEventListener("pointerup", function (e) {
        e.preventDefault(); e.stopPropagation();
        moveDirection = 0;
    });
    backButton.addEventListener("pointercancel", function () { moveDirection = 0; });
}

if (jumpButton) {
    jumpButton.addEventListener("pointerdown", function (e) {
        e.preventDefault(); e.stopPropagation();
        if (playing) jump();
    });
}

window.addEventListener("blur", function () { moveDirection = 0; });

canvas.addEventListener("mousedown", function (event) {
    event.preventDefault();
    if (playing) jump();
});

canvas.addEventListener("touchstart", function (event) {
    event.preventDefault();
    if (playing) jump();
}, { passive: false });

if (restartButton) restartButton.addEventListener("click", startSelectedLevel);
if (deathLevelsButton) deathLevelsButton.addEventListener("click", showLevelPage);
if (nextLevelButton) {
    nextLevelButton.addEventListener("click", function () {
        if (selectedLevel < MAX_LEVEL) {
            selectedLevel++;
            startSelectedLevel();
        } else {
            showLevelPage();
        }
    });
}
if (winLevelsButton) winLevelsButton.addEventListener("click", showLevelPage);

/* =====================================================
   INITIALIZATION
===================================================== */
hideAllPages();
if (startPage) startPage.classList.remove("hidden");
selectedLevel = 1;
resetGame();
requestAnimationFrame(gameLoop);

/* =====================================================
   MOBILE HELPER
===================================================== */
(function () {
    const isMobile = /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || window.matchMedia("(max-width: 700px)").matches;
    if (!isMobile) return;

    function mobileCanvasResize() {
        const c = document.getElementById("gameCanvas");
        if (!c) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = window.innerWidth;
        const h = window.innerHeight;

        c.style.width = w + "px";
        c.style.height = h + "px";

        if (c.width !== Math.floor(w * dpr) || c.height !== Math.floor(h * dpr)) {
            c.width = Math.floor(w * dpr);
            c.height = Math.floor(h * dpr);
        }
    }

    window.addEventListener("resize", mobileCanvasResize);
    window.addEventListener("orientationchange", function () {
        setTimeout(mobileCanvasResize, 200);
    });
    mobileCanvasResize();

    document.addEventListener("touchstart", function (e) {
        if (e.target.closest("#controls") || e.target.closest("#gameCanvas")) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener("touchmove", function (e) {
        if (e.target.closest("#controls") || e.target.closest("#gameCanvas")) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener("touchend", function (e) {
        if (e.target.closest("#controls")) {
            e.preventDefault();
        }
    }, { passive: false });

    function bindMobileControl(id, dir) {
        const btn = document.getElementById(id);
        if (!btn) return;

        const start = (e) => { e.preventDefault(); if (playing) moveDirection = dir; };
        const end = (e) => { e.preventDefault(); moveDirection = 0; };

        btn.addEventListener("touchstart", start, { passive: false });
        btn.addEventListener("touchend", end, { passive: false });
        btn.addEventListener("touchcancel", end, { passive: false });
        btn.addEventListener("mousedown", start);
        btn.addEventListener("mouseup", end);
        btn.addEventListener("mouseleave", end);
    }

    bindMobileControl("backButton", -1);
    bindMobileControl("forwardButton", 1);

    const jBtn = document.getElementById("jumpButton");
    if (jBtn) {
        const handleJump = (e) => {
            e.preventDefault();
            if (playing) jump();
        };
        jBtn.addEventListener("touchstart", handleJump, { passive: false });
        jBtn.addEventListener("mousedown", handleJump);
    }
})();

const themeBtn = document.getElementById("themeBtn");

let lightTheme = localStorage.getItem("skyRunnerTheme") === "light";

function updateTheme() {
    
    document.body.classList.toggle(
        "lightTheme",
        lightTheme
    );

    themeBtn.textContent =
        lightTheme
            ? "☀️ LIGHT"
            : "🌙 DARK";
}

themeBtn.addEventListener("click", () => {

    lightTheme = !lightTheme;

    localStorage.setItem(
        "skyRunnerTheme",
        lightTheme ? "light" : "dark"
    );

    updateTheme();
});

updateTheme();
