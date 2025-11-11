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
let food;
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
let bg;
let obstacles = [];
let startMenu;
let startButton;
let titleText;
let playerName = "à vous"; // pseudo

const game = new Phaser.Game(config);

function preload() {
  const g1 = this.add.graphics();
  g1.fillStyle(0x0088ff, 0.7);
  g1.fillRect(0, 0, cellSize, cellSize);
  g1.generateTexture("body", cellSize, cellSize);
  g1.destroy();

  const g2 = this.add.graphics();
  g2.fillStyle(0xffd700, 1);
  g2.fillCircle(cellSize / 2, cellSize / 2, cellSize / 2);
  g2.generateTexture("food", cellSize, cellSize);
  g2.destroy();

  const g3 = this.add.graphics();
  g3.fillStyle(0x654321, 1);
  g3.fillRect(0, 0, cellSize, cellSize);
  g3.generateTexture("obstacle", cellSize, cellSize);
  g3.destroy();
}

function create() {
  sceneRef = this;
  
  // --- Fond coloré uni ---
bg = this.add.rectangle(400, 300, 800, 600, 0x000000); // vert foncé
bg.setOrigin(0.5);
bg.setDepth(-1);


  // --- Menu principal ---
  titleText = this.add.text(400, 180, "🐍 SNAKE GAME 🐍", {
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

  // Effet hover
  startButton.on('pointerover', () => {
    startButton.setStyle({ fill: "#00ff00" });
  });
  startButton.on('pointerout', () => {
    startButton.setStyle({ fill: "#ffd700" });
  });

  startButton.on('pointerdown', () => {
    startMenu.setVisible(false);
    startGame();
  });

  // Texte fin de partie
  gameOverText = this.add.text(400, 260, "", {
    fontSize: "48px", fill: "#ff0000", fontStyle: "bold"
  }).setOrigin(0.5).setVisible(false);

  // Score
  scoreText = this.add.text(10, 10, "", { fontSize: "24px", fill: "#fff" });
  bestScoreText = this.add.text(10, 40, "", { fontSize: "20px", fill: "#aaa" });

  // Créer un groupe pour tout le menu
  startMenu = this.add.container(0, 0, [titleText, playerText, startButton]);

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

  this.input.keyboard.on('keydown-SPACE', () => {
    if (!gameStarted && startMenu.visible) {
      startMenu.setVisible(false);
      startGame();
    }
  });
}

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

  if (food) food.destroy();
  food = null;

  const startX = 400;
  const startY = 300;
  const part = sceneRef.add.image(startX, startY, "body");
  snake.push(part);

  food = sceneRef.add.image(randomX(), randomY(), "food");

  for (let i = 0; i < 10; i++) createObstacle();

  scoreText.setText("Score: " + score);
  bestScoreText.setText("Meilleur: " + bestScore);
}

function update(time) {
  bg.tilePositionX += 0.1; // fond animé lentement même dans le menu

  if (!gameStarted || isPaused) return;

  if (direction === "LEFT") bg.tilePositionX -= 0.3;
  else if (direction === "RIGHT") bg.tilePositionX += 0.3;
  else if (direction === "UP") bg.tilePositionY -= 0.3;
  else if (direction === "DOWN") bg.tilePositionY += 0.3;

  obstacles.forEach(o => {
    if (direction === "LEFT") o.sprite.x += 0.4;
    else if (direction === "RIGHT") o.sprite.x -= 0.4;
    else if (direction === "UP") o.sprite.y += 0.4;
    else if (direction === "DOWN") o.sprite.y -= 0.4;

    o.sprite.x += o.vx;
    o.sprite.y += o.vy;

    if (Math.random() < 0.01) {
      o.vx = Phaser.Math.FloatBetween(-0.2, 0.2);
      o.vy = Phaser.Math.FloatBetween(-0.2, 0.2);
    }
  });

  if ((keys.left.isDown || keys.leftA.isDown) && direction !== "RIGHT") nextDirection = "LEFT";
  else if ((keys.right.isDown || keys.rightA.isDown) && direction !== "LEFT") nextDirection = "RIGHT";
  else if ((keys.up.isDown || keys.upA.isDown) && direction !== "DOWN") nextDirection = "UP";
  else if ((keys.down.isDown || keys.downA.isDown) && direction !== "UP") nextDirection = "DOWN";

  if (time > moveTimer) {
    moveSnake();
    moveTimer = time + moveDelay;
  }
}

function moveSnake() {
  direction = nextDirection;
  const head = snake[0];
  const newX = head.x + (direction === "LEFT" ? -cellSize : direction === "RIGHT" ? cellSize : 0);
  const newY = head.y + (direction === "UP" ? -cellSize : direction === "DOWN" ? cellSize : 0);

  if (newX < 0 || newX >= config.width || newY < 0 || newY >= config.height) {
    gameOver();
    return;
  }

  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === newX && snake[i].y === newY) {
      gameOver();
      return;
    }
  }

  for (let o of obstacles) {
    if (Phaser.Math.Distance.Between(newX, newY, o.sprite.x, o.sprite.y) < cellSize / 2) {
      gameOver();
      return;
    }
  }

  const newPart = sceneRef.add.image(newX, newY, "body");
  snake.unshift(newPart);

  if (newX === food.x && newY === food.y) {
    score++;
    scoreText.setText("Score: " + score);
    if (score > bestScore) {
      bestScore = score;
      bestScoreText.setText("Meilleur: " + bestScore);
    }
    food.setPosition(randomX(), randomY());
    if (Math.random() < 0.5) createObstacle();
  } else {
    const tail = snake.pop();
    tail.destroy();
  }
}

function createObstacle() {
  const x = randomX();
  const y = randomY();
  if (Phaser.Math.Distance.Between(x, y, 400, 300) < 50) return;
  const obs = sceneRef.add.image(x, y, "obstacle");
  const vx = Phaser.Math.FloatBetween(-0.2, 0.2);
  const vy = Phaser.Math.FloatBetween(-0.2, 0.2);
  obstacles.push({ sprite: obs, vx, vy });
}

function gameOver() {
  snake.forEach(p => p.destroy());
  snake = [];
  obstacles.forEach(o => o.sprite.destroy());
  obstacles = [];
  if (food) food.destroy();
  food = null;

  gameOverText.setText("Partie terminée !");
  gameOverText.setVisible(true);

  scoreText.setText("Score: " + score);
  bestScoreText.setText("Meilleur: " + bestScore);

  startMenu.setVisible(true);
  startButton.setText("▶ REJOUER");
  gameStarted = false;
}

function randomX() {
  const cols = Math.floor(config.width / cellSize);
  return Math.floor(Math.random() * cols) * cellSize;
}
function randomY() {
  const rows = Math.floor(config.height / cellSize);
  return Math.floor(Math.random() * rows) * cellSize;
}
