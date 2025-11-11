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
let scoreText;
let sceneRef;

const game = new Phaser.Game(config);

function preload() {
  // Carré bleu = serpent
  const g1 = this.add.graphics();
  g1.fillStyle(0x0088ff, 0.5);
  g1.fillRect(0, 0, cellSize, cellSize);
  g1.generateTexture("body", cellSize, cellSize);
  g1.destroy();

  // Rond jaune = nourriture
  const g2 = this.add.graphics();
  g2.fillStyle(0xffd700, 1);
  g2.fillCircle(cellSize / 2, cellSize / 2, cellSize / 2);
  g2.generateTexture("food", cellSize, cellSize);
  g2.destroy();
}

function create() {
  sceneRef = this;

  // Serpent initial (3 carrés)
  const startX = 400;
  const startY = 300;
  for (let i = 0; i < 3; i++) {
    const part = this.add.image(startX - i * cellSize, startY, "body");
    snake.push(part);
  }

  // Nourriture
  food = this.add.image(randomX(), randomY(), "food");

  // Texte du score
  scoreText = this.add.text(10, 10, "Score: 0", { fontSize: "24px", fill: "#fff" });

  // Contrôles (ZQSD + flèches)
  keys = this.input.keyboard.addKeys({
    up: Phaser.Input.Keyboard.KeyCodes.Z,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.Q,
    right: Phaser.Input.Keyboard.KeyCodes.D,
    upA: Phaser.Input.Keyboard.KeyCodes.UP,
    downA: Phaser.Input.Keyboard.KeyCodes.DOWN,
    leftA: Phaser.Input.Keyboard.KeyCodes.LEFT,
    rightA: Phaser.Input.Keyboard.KeyCodes.RIGHT
  });
}

function update(time) {
  // Direction
  if ((keys.left.isDown || keys.leftA.isDown) && direction !== "RIGHT")
    nextDirection = "LEFT";
  else if ((keys.right.isDown || keys.rightA.isDown) && direction !== "LEFT")
    nextDirection = "RIGHT";
  else if ((keys.up.isDown || keys.upA.isDown) && direction !== "DOWN")
    nextDirection = "UP";
  else if ((keys.down.isDown || keys.downA.isDown) && direction !== "UP")
    nextDirection = "DOWN";

  // Mouvement à intervalles fixes
  if (time > moveTimer) {
    moveSnake();
    moveTimer = time + moveDelay;
  }
}

function moveSnake() {
  direction = nextDirection;
  const head = snake[0];

  const newX =
    head.x +
    (direction === "LEFT" ? -cellSize : direction === "RIGHT" ? cellSize : 0);
  const newY =
    head.y +
    (direction === "UP" ? -cellSize : direction === "DOWN" ? cellSize : 0);

  // Collision murs
  if (newX < 0 || newX >= config.width || newY < 0 || newY >= config.height) {
    restartGame();
    return;
  }

  // Collision sur soi-même
  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === newX && snake[i].y === newY) {
      restartGame();
      return;
    }
  }

  // Nouvelle tête
  const newPart = sceneRef.add.image(newX, newY, "body");
  snake.unshift(newPart);

  // Collision nourriture (alignement parfait sur grille)
  if (newX === food.x && newY === food.y) {
    score++;
    scoreText.setText("Score: " + score);
    food.setPosition(randomX(), randomY());
  } else {
    const tail = snake.pop();
    tail.destroy();
  }
}

// Position aléatoire sur la grille
function randomX() {
  const cols = Math.floor(config.width / cellSize);
  return Math.floor(Math.random() * cols) * cellSize;
}
function randomY() {
  const rows = Math.floor(config.height / cellSize);
  return Math.floor(Math.random() * rows) * cellSize;
}

function restartGame() {
  snake.forEach(p => p.destroy());
  snake = [];
  score = 0;
  scoreText.setText("Score: 0");
  direction = "RIGHT";
  nextDirection = "RIGHT";
  const startX = 400;
  const startY = 300;
  for (let i = 0; i < 3; i++) {
    const part = sceneRef.add.image(startX - i * cellSize, startY, "body");
    snake.push(part);
  }
  food.setPosition(randomX(), randomY());
}