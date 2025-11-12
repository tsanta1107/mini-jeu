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
const foodCount = 5;
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
let rotationTarget = 90;

const game = new Phaser.Game(config);


// -------- PRELOAD --------
function preload() {
  // Fond et textures principales
  this.load.image('herbe', 'snak/assets/boz.jpg');
  this.load.image('head', 'snak/assets/tt.png');

  // Obstacles
  this.load.image('ail', 'snak/assets/ail.png');
  this.load.image('oignon', 'snak/assets/oignon.png');

  // Nourritures (ajoute d'autres si tu veux)
  this.load.image('pomme', 'snak/assets/pomme.png');
  this.load.image('banane', 'snak/assets/banane.png');
  this.load.image('tomate', 'snak/assets/tomate.png');
  this.load.image('fraise', 'snak/assets/fraise.png');

  // Texture du corps
  const g1 = this.add.graphics();
  g1.fillStyle(0x0088ff, 0.9);
  g1.fillCircle(cellSize / 2, cellSize / 2, cellSize / 2);
  g1.generateTexture("body", cellSize, cellSize);
  g1.destroy();
}


// -------- CREATE --------
function create() {
  sceneRef = this;

  bgContainer = this.add.container(0, 0);
  const bgImage = this.add.image(400, 300, 'herbe').setDisplaySize(800, 600);
  bgContainer.add(bgImage);
  bgContainer.setDepth(-10);

  titleText = this.add.text(400, 180, "🐍 Jeu de Serpent 🐍", {
    fontSize: "60px",
    fill: "#00ff00",
    fontStyle: "bold"
  }).setOrigin(0.5);

  const playerText = this.add.text(400, 250, `Bienvenue, ${playerName}`, {
    fontSize: "26px",
    fill: "#ffffff"
  }).setOrigin(0.5);

  startButton = this.add.text(400, 350, "▶ COMMENCER", {
    fontSize: "36px",
    fill: "#ffd700",
    fontStyle: "bold",
    backgroundColor: "#004400",
    padding: { x: 20, y: 10 }
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });

  startButton.on('pointerdown', () => {
    startMenu.setVisible(false);
    startGame();
  });

  gameOverText = this.add.text(400, 260, "", {
    fontSize: "48px", fill: "#ff0000", fontStyle: "bold"
  }).setOrigin(0.5).setVisible(false);

  scoreText = this.add.text(10, 10, "", { fontSize: "24px", fill: "#fff" });
  bestScoreText = this.add.text(10, 40, "", { fontSize: "20px", fill: "#aaa" });

  startMenu = this.add.container(0, 0, [titleText, playerText, startButton]);

  keys = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.Z,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.Q,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    space: Phaser.Input.Keyboard.KeyCodes.SPACE
  });

  // --- Pause ---
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
      pauseText = this.add.text(400, 300, "⏸ PAUSE", {
        fontSize: "60px",
        fill: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 6
      }).setOrigin(0.5).setDepth(1000);
    } else {
      setBackgroundBlur(this, false);
      if (pauseText) pauseText.destroy();
    }
  });
}


// -------- START GAME --------
function startGame() {
  gameStarted = true;
  gameOverText.setVisible(false);
  score = 0;
  direction = "RIGHT";
  nextDirection = "RIGHT";
  snake.forEach(s => s.destroy());
  snake = [];
  obstacles.forEach(o => o.sprite.destroy());
  obstacles = [];
  foods.forEach(f => f.destroy());
  foods = [];

  setBackgroundBlur(sceneRef, false);

  const startX = 400;
  const startY = 300;

  const head = sceneRef.add.image(startX, startY, 'head').setDisplaySize(cellSize, cellSize);
  snake.push(head);

  for (let i = 1; i < 3; i++) {
    const seg = sceneRef.add.image(startX - i * cellSize, startY, 'body');
    snake.push(seg);
  }

  // 5 nourritures aléatoires
  for (let i = 0; i < 5; i++) createFood();

  // obstacles
  for (let i = 0; i < 10; i++) createObstacle();

  scoreText.setText("Score: " + score);
  bestScoreText.setText("Meilleur: " + bestScore);
}


// -------- UPDATE --------
function update(time) {
  if (!gameStarted || isPaused) return;

  if (keys.left.isDown && direction !== "RIGHT") nextDirection = "LEFT";
  else if (keys.right.isDown && direction !== "LEFT") nextDirection = "RIGHT";
  else if (keys.up.isDown && direction !== "DOWN") nextDirection = "UP";
  else if (keys.down.isDown && direction !== "UP") nextDirection = "DOWN";

  if (time > moveTimer) {
    moveSnake();
    moveTimer = time + moveDelay;
  }
}


// -------- MOVE SNAKE --------
function moveSnake() {
  direction = nextDirection;
  const head = snake[0];
  const newX = head.x + (direction === "LEFT" ? -cellSize : direction === "RIGHT" ? cellSize : 0);
  const newY = head.y + (direction === "UP" ? -cellSize : direction === "DOWN" ? cellSize : 0);

  if (newX < 0 || newX >= config.width || newY < 0 || newY >= config.height) return gameOver();

  for (let i = 1; i < snake.length; i++)
    if (snake[i].x === newX && snake[i].y === newY) return gameOver();

  for (let o of obstacles)
    if (Phaser.Math.Distance.Between(newX, newY, o.sprite.x, o.sprite.y) < cellSize / 2)
      return gameOver();

  const newHead = sceneRef.add.image(newX, newY, 'head').setDisplaySize(cellSize, cellSize);
  snake.unshift(newHead);
  snake[1].setTexture('body');

  let grew = false;

  // --- collision avec la nourriture ---
  for (let f of foods) {
    if (Phaser.Math.Distance.Between(newX, newY, f.x, f.y) < cellSize / 2) {
      score++;
      scoreText.setText("Score: " + score);
      if (score > bestScore) {
        bestScore = score;
        bestScoreText.setText("Meilleur: " + bestScore);
      }
      f.setPosition(randomX(), randomY()); // repositionne la nourriture
      grew = true;
    }
  }

  if (!grew) {
    const tail = snake.pop();
    tail.destroy();
  }

  const currentHead = snake[0];
  const targetAngle =
    direction === "UP" ? 0 :
    direction === "RIGHT" ? 90 :
    direction === "DOWN" ? 180 : -90;
  sceneRef.tweens.add({
    targets: currentHead,
    angle: targetAngle,
    duration: 100,
    ease: 'Sine.easeOut'
  });
}


// -------- CREATE FOOD --------
function createFood() {
  const foodTypes = ["pomme", "banane", "tomate", "fraise"];
  const tex = foodTypes[Phaser.Math.Between(0, foodTypes.length - 1)];
  const f = sceneRef.add.image(randomX(), randomY(), tex)
    .setDisplaySize(cellSize, cellSize)
    .setDepth(0);
  foods.push(f);
}


// -------- CREATE OBSTACLE --------
function createObstacle() {
  const x = randomX();
  const y = randomY();
  if (Phaser.Math.Distance.Between(x, y, 400, 300) < 50) return;
  const textureKey = Phaser.Math.Between(0, 1) === 0 ? 'ail' : 'oignon';
  const obs = sceneRef.add.image(x, y, textureKey)
    .setDisplaySize(cellSize * 1.5, cellSize * 1.5);
  obstacles.push({ sprite: obs });
}


// -------- GAME OVER --------
function gameOver() {
  snake.forEach(p => p.destroy());
  snake = [];
  obstacles.forEach(o => o.sprite.destroy());
  obstacles = [];
  foods.forEach(f => f.destroy());
  foods = [];
  setBackgroundBlur(sceneRef, true);
  gameOverText.setText("Partie terminée !");
  gameOverText.setVisible(true);
  scoreText.setText("Score: " + score);
  bestScoreText.setText("Meilleur: " + bestScore);
  startMenu.setVisible(true);
  startButton.setText("▶ REJOUER");
  gameStarted = false;
}


// -------- OUTILS --------
function randomX() {
  const cols = Math.floor(config.width / cellSize);
  return Math.floor(Math.random() * cols) * cellSize;
}
function randomY() {
  const rows = Math.floor(config.height / cellSize);
  return Math.floor(Math.random() * rows) * cellSize;
}
function setBackgroundBlur(scene, active) {
  const bg = bgContainer?.list?.[0];
  if (!bg) return;
  if (active) blurEffect = bg.postFX.addBlur(6, 6, 0.4);
  else if (blurEffect) {
    bg.postFX.clear();
    blurEffect = null;
  }
}
