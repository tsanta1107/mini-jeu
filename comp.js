const cellSize = 20;
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#1a1a1a",
  scene: { preload, create, update }
};

let snake = [];
let direction = "RIGHT";
let nextDirection = "RIGHT";
let foods = [];
const FOOD_COUNT = 5;
let moveTimer = 0;
const moveDelay = 150;
let keys;
let score = 0;
let bestScore = 0;
let scoreText;
let bestScoreText;
let sceneRef;
let isPaused = false;
let gameStarted = false;
let gameOverText;
let bgContainer;
let blurEffect;
let obstacles = [];
let startMenu;
let startButton;
let titleText;
let playerName = "à vous";
let pauseText;

const game = new Phaser.Game(config);


function preload() {
  // background & head & obstacles
  this.load.image('herbe', 'snak/assets/herbe.jpg');
  this.load.image('head', 'snak/assets/r.png');
  this.load.image('ail', 'snak/assets/ail.png');
  this.load.image('oignon', 'snak/assets/oignon.png');
  this.load.image('fond2', 'snak/assets/fond2.jpg');
  this.load.image('peau', 'snak/assets/peau.jpg'); 

  // nourritures
  this.load.image('1', 'snak/assets/1.png');
  this.load.image('2', 'snak/assets/2.png');
  this.load.image('3', 'snak/assets/3.png');
  this.load.image('4', 'snak/assets/4.png');
  this.load.image('5', 'snak/assets/5.png');

  // corps dynamique (cercle)
  const g1 = this.add.graphics();
  g1.fillStyle(0x0088ff, 0.95);
  g1.fillCircle(cellSize / 2, cellSize / 2, cellSize / 2);
  g1.generateTexture("body", cellSize, cellSize);
  g1.destroy();

  // texture obstacle fallback
  const g2 = this.add.graphics();
  g2.fillStyle(0x654321, 1);
  g2.fillRect(0, 0, cellSize, cellSize);
  g2.generateTexture("obstacle", cellSize, cellSize);
  g2.destroy();
}


//  CREATE 
function create() {
  sceneRef = this;

// --- Fond d'écran du menu de démarrage ---
this.startBackground = this.add.image(400, 300, 'fond2').setDisplaySize(800, 600);
this.startBackground.setDepth(-5);


  // background container (pour l'effet blur séparé)
  bgContainer = this.add.container(0, 0);
  const bgImage = this.add.image(config.width / 2, config.height / 2, 'herbe').setDisplaySize(config.width, config.height);
  bgContainer.add(bgImage);
  bgContainer.setDepth(-10);

  // UI / menu
  titleText = this.add.text(config.width / 2, 140, "Jeu de Serpent", {
    fontSize: "52px", fill: "#00ff00", fontStyle: "bold"
  }).setOrigin(0.5);

  const playerText = this.add.text(config.width / 2, 200, `Bienvenue, ${playerName}`, {
    fontSize: "22px", fill: "#ffffff"
  }).setOrigin(0.5);

  startButton = this.add.text(config.width / 2, 400, "▶ COMMENCER", {
    fontSize: "32px", fill: "#ffd700", fontStyle: "bold",
    backgroundColor: "#004400", padding: { x: 18, y: 10 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  startButton.on('pointerover', () => startButton.setStyle({ fill: "#00ff00" }));
  startButton.on('pointerout', () => startButton.setStyle({ fill: "#ffd700" }));
  startButton.on('pointerdown', () => {
    startMenu.setVisible(false);
    startGame();
  });

  startMenu = this.add.container(0, 0, [titleText, playerText, startButton]);

  // game over text
  gameOverText = this.add.text(config.width / 2, config.height / 2 - 20, "", {
    fontSize: "48px", fill: "#ff0000", fontStyle: "bold"
  }).setOrigin(0.5).setVisible(false);

  // score UI
  scoreText = this.add.text(12, 12, "", { fontSize: "20px", fill: "#fff" }).setDepth(1000);
  bestScoreText = this.add.text(12, 36, "", { fontSize: "16px", fill: "#aaa" }).setDepth(1000);

  // keyboard
  keys = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.Z,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.Q,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    upA: Phaser.Input.Keyboard.KeyCodes.UP,
    downA: Phaser.Input.Keyboard.KeyCodes.DOWN,
    leftA: Phaser.Input.Keyboard.KeyCodes.LEFT,
    rightA: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    space: Phaser.Input.Keyboard.KeyCodes.SPACE
  });

  // espace = pause / start
  this.input.keyboard.on('keydown-SPACE', () => {
    if (!gameStarted) {
      if (startMenu.visible) {
        startMenu.setVisible(false);
        startGame();
      }
      return;
    }
    isPaused = !isPaused;
    if (isPaused) {
      setBackgroundBlur(this, true);
      pauseText = this.add.text(config.width / 2, config.height / 2, "⏸ PAUSE", {
        fontSize: "64px", fill: "#ffffff", stroke: "#000000", strokeThickness: 6
      }).setOrigin(0.5).setDepth(1000);
    } else {
      setBackgroundBlur(this, false);
      if (pauseText) { pauseText.destroy(); pauseText = null; }
    }
  });
}


function startGame() {
if (sceneRef.startBackground) {
  sceneRef.startBackground.setVisible(false); // cacher le fond du menu
}

  // reset flags & cleanup
  gameStarted = true;
  gameOverText.setVisible(false);
  score = 0;
  direction = "RIGHT";
  nextDirection = "RIGHT";

  // destroy previous sprites/events
  snake.forEach(s => { try { s.destroy(); } catch(e){} });
  snake = [];
  obstacles.forEach(o => { try { o.sprite.destroy(); } catch(e){} });
  obstacles = [];
  foods.forEach(f => {
    try {
      if (f.blinkTimerEvent) f.blinkTimerEvent.remove(false);
      if (f.tween) f.tween.stop();
      f.sprite.destroy();
    } catch(e){}
  });
  foods = [];
  setBackgroundBlur(sceneRef, false);

  // create snake head + initial segments
  const startX = Math.floor(config.width / 2 / cellSize) * cellSize;
  const startY = Math.floor(config.height / 2 / cellSize) * cellSize;

  const head = sceneRef.add.image(startX, startY, 'head').setDisplaySize(cellSize, cellSize).setDepth(20);
  snake.push(head);
  for (let i = 1; i < 3; i++) {
    const seg = sceneRef.add.image(startX - i * cellSize, startY, 'peau').setDisplaySize(cellSize, cellSize).setDepth(10);
    snake.push(seg);
  }

  // create foods
  for (let i = 0; i < FOOD_COUNT; i++) createFood();

  // create moving obstacles
  for (let i = 0; i < 14; i++) createObstacle();

  // UI
  scoreText.setText("Score: " + score);
  bestScoreText.setText("Meilleur: " + bestScore);
}


//  UPDATE 
function update(time) {
  if (!gameStarted || isPaused) return;

  // input -> nextDirection
  if ((keys.left.isDown || keys.leftA.isDown) && direction !== "RIGHT") nextDirection = "LEFT";
  else if ((keys.right.isDown || keys.rightA.isDown) && direction !== "LEFT") nextDirection = "RIGHT";
  else if ((keys.up.isDown || keys.upA.isDown) && direction !== "DOWN") nextDirection = "UP";
  else if ((keys.down.isDown || keys.downA.isDown) && direction !== "UP") nextDirection = "DOWN";

  // move snake at fixed interval
  if (time > moveTimer) {
    moveSnake();
    moveTimer = time + moveDelay;
  }

  // obstacles movement + rebonds
  for (let o of obstacles) {
    o.sprite.x += o.vx;
    o.sprite.y += o.vy;
    if (o.sprite.x < 0) { o.sprite.x = 0; o.vx *= -1; }
    if (o.sprite.x > config.width) { o.sprite.x = config.width; o.vx *= -1; }
    if (o.sprite.y < 0) { o.sprite.y = 0; o.vy *= -1; }
    if (o.sprite.y > config.height) { o.sprite.y = config.height; o.vy *= -1; }
  }
}


//  MOVE SNAKE 
function moveSnake() {
  direction = nextDirection;
  const head = snake[0];
  const newX = head.x + (direction === "LEFT" ? -cellSize : direction === "RIGHT" ? cellSize : 0);
  const newY = head.y + (direction === "UP" ? -cellSize : direction === "DOWN" ? cellSize : 0);

  // murs
  if (newX < 0 || newX >= config.width || newY < 0 || newY >= config.height) {
    return gameOver();
  }

  // collision avec soi-même
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === newX && snake[i].y === newY) {
      return gameOver();
    }
  }

  // collision obstacles
  for (let o of obstacles) {
    if (Phaser.Math.Distance.Between(newX, newY, o.sprite.x, o.sprite.y) < cellSize * 0.9) {
      return gameOver();
    }
  }

  // nouvelle tête
  const newHead = sceneRef.add.image(newX, newY, 'head').setDisplaySize(cellSize, cellSize).setDepth(20);
  snake.unshift(newHead);

  // ancienne tête -> corps
  if (snake.length > 1) {
    snake[1].setTexture('peau');
    snake[1].setDisplaySize(cellSize, cellSize);
    snake[1].setDepth(12);
  }

  // vérifie si a mangé une nourriture
  let ate = false;
  for (let i = foods.length - 1; i >= 0; i--) {
    const f = foods[i];
    if (newX === f.sprite.x && newY === f.sprite.y) {
      ate = true;
      // cleanup events/tweens liés
      if (f.blinkTimerEvent) f.blinkTimerEvent.remove(false);
      if (f.tween) f.tween.stop();
      f.sprite.destroy();
      foods.splice(i, 1);
      createFood(); // remplacer immédiatement
      score++;
      scoreText.setText("Score: " + score);
      if (score > bestScore) { bestScore = score; bestScoreText.setText("Meilleur: " + bestScore); }
      break;
    }
  }

  // si pas mangé -> retire la queue (sinon serpent grandit)
  if (!ate) {
    const tail = snake.pop();
    if (tail) tail.destroy();
  }

  // orientation tête
  const currentHead = snake[0];
  if (direction === "UP") currentHead.setAngle(0);
  else if (direction === "RIGHT") currentHead.setAngle(90);
  else if (direction === "DOWN") currentHead.setAngle(180);
  else if (direction === "LEFT") currentHead.setAngle(-90);
}


//  CREATE FOOD (avec blink + reposition) 
function createFood() {
  const textures = ['1', '2', '3', '4', '5'];
  // place safe (évite serpent & obstacles)
  let tries = 0;
  let x, y;
  do {
    x = randomX();
    y = randomY();
    const collSnake = snake.some(s => s.x === x && s.y === y);
    const collObs = obstacles.some(o => Phaser.Math.Distance.Between(x, y, o.sprite.x, o.sprite.y) < cellSize * 1.2);
    if (!collSnake && !collObs) break;
    tries++;
  } while (tries < 80);

  // fallback si impossible
  if (tries >= 80) { x = randomX(); y = randomY(); }

  const key = Phaser.Utils.Array.GetRandom(textures);
  const sprite = sceneRef.add.image(x, y, key).setDisplaySize(Math.round(cellSize * 1.2), Math.round(cellSize * 1.2)).setDepth(8);

  // planifier clignotement et déplacement si non mangée
  // délai initial avant premier blink (ms)
  const BLINK_DELAY = 5000;
  // comportement : après BLINK_DELAY on fait un tween alpha yoyo répété, puis reposition, puis reprogrammer
  const blinkTimerEvent = sceneRef.time.addEvent({
    delay: BLINK_DELAY,
    callback: () => blinkAndMove(sprite),
    loop: false
  });

  foods.push({ sprite, blinkTimerEvent, tween: null });
}

function blinkAndMove(sprite) {
  // retrouver l'objet foods correspondant (car il peut avoir été mangé)
  const fObj = foods.find(f => f.sprite === sprite);
  if (!fObj || !sprite.active) return;

  // clignote (alpha) puis repositionne
  const blinkTween = sceneRef.tweens.add({
    targets: sprite,
    alpha: 0.15,
    yoyo: true,
    repeat: 6, // nombre de clignotements
    duration: 180,
    onComplete: () => {
      // reposition safe
      let tries = 0;
      let nx, ny;
      do {
        nx = randomX();
        ny = randomY();
        const collSnake = snake.some(s => s.x === nx && s.y === ny);
        const collObs = obstacles.some(o => Phaser.Math.Distance.Between(nx, ny, o.sprite.x, o.sprite.y) < cellSize * 1.2);
        if (!collSnake && !collObs) break;
        tries++;
      } while (tries < 80);

      if (tries >= 80) { nx = randomX(); ny = randomY(); }

      sprite.setPosition(nx, ny);
      sprite.alpha = 1;

      // reprogrammer le prochain blink (après une pause)
      if (fObj) {
        fObj.blinkTimerEvent = sceneRef.time.addEvent({
          delay: 5000,
          callback: () => blinkAndMove(sprite),
          loop: false
        });
        fObj.tween = null;
      }
    }
  });

  if (fObj) fObj.tween = blinkTween;
}


//  CREATE OBSTACLE (mobile) 
function createObstacle() {
  let tries = 0;
  let x, y;
  do {
    x = randomX();
    y = randomY();
    // évite spawn trop proche du centre
    if (Phaser.Math.Distance.Between(x, y, config.width / 2, config.height / 2) < 60) { tries++; continue; }
    // évite serpent
    const collSnake = snake.some(s => s.x === x && s.y === y);
    if (collSnake) { tries++; continue; }
    break;
  } while (tries < 40);

  const textureKey = Phaser.Math.Between(0, 1) ? 'ail' : 'oignon';
  const obs = sceneRef.add.image(x, y, textureKey).setDisplaySize(Math.round(cellSize * 1.6), Math.round(cellSize * 1.6)).setDepth(6);
  const vx = Phaser.Math.FloatBetween(-0.45, 0.45);
  const vy = Phaser.Math.FloatBetween(-0.45, 0.45);
  obstacles.push({ sprite: obs, vx, vy });
}


function gameOver() {
  // destroy all
  snake.forEach(s => { try { s.destroy(); } catch(e){} });
  snake = [];
  obstacles.forEach(o => { try { o.sprite.destroy(); } catch(e){} });
  obstacles = [];
  foods.forEach(f => {
    try {
      if (f.blinkTimerEvent) f.blinkTimerEvent.remove(false);
      if (f.tween) f.tween.stop();
      f.sprite.destroy();
    } catch(e){}
  });
  foods = [];

  setBackgroundBlur(sceneRef, true);
  gameOverText.setText("Partie terminée !");
  gameOverText.setVisible(true);
  scoreText.setText("Score: " + score);
  bestScoreText.setText("Meilleur: " + bestScore);
  if (sceneRef.startBackground) {
  sceneRef.startBackground.setVisible(true); // réafficher le fond du menu
}

  startMenu.setVisible(true);
  startButton.setText("▶ REJOUER");
  gameStarted = false;
}


//  UTILITAIRES 
function randomX() {
  const cols = Math.floor(config.width / cellSize);
  return Math.floor(Math.random() * cols) * cellSize;
}
function randomY() {
  const rows = Math.floor(config.height / cellSize);
  return Math.floor(Math.random() * rows) * cellSize;
}
function setBackgroundBlur(scene, active) {
  const bg = bgContainer && bgContainer.list && bgContainer.list[0];
  if (!bg) return;
  if (active) {
    if (!blurEffect) blurEffect = bg.postFX.addBlur(6, 6, 0.4);
  } else {
    if (blurEffect) {
      bg.postFX.clear();
      blurEffect = null;
    }
  }
}
