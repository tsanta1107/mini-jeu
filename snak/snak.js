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
let bgContainer;
let blurEffect;
let obstacles = [];
let startMenu;
let startButton;
let titleText;
let playerName = "à vous"; // pseudo
let pauseText;
let headTextureLoaded = false; // vérif charge de la tête

const game = new Phaser.Game(config);


//      PRELOAD

function preload() {
  // Image de fond et tête (assure-toi que le chemin est correct)
  this.load.image('herbe', 'snak/assets/herbe.jpg');
  this.load.image('head', 'snak/assets/tt.png');
  this.load.image('ail', 'snak/assets/ail.png');
  this.load.image('oignon', 'snak/assets/oignon.png');
  


  // Crée les textures dynamiques pour le corps, nourriture et obstacles
  const g1 = this.add.graphics();
  g1.fillStyle(0x0088ff, 0.9);
  //g1.fillRect(0, 0, cellSize, cellSize);
  g1.fillCircle(cellSize / 2, cellSize / 2, cellSize / 2);
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


//      CREATE

function create() {
  sceneRef = this;

  // --- Fond herbe (conteneur pour pouvoir flouter séparément) ---
  bgContainer = this.add.container(0, 0);
  const bgImage = this.add.image(400, 300, 'herbe').setDisplaySize(800, 600);
  bgContainer.add(bgImage);
  bgContainer.setDepth(-10);

  // --- Menu principal ---
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

  startButton.on('pointerover', () => startButton.setStyle({ fill: "#00ff00" }));
  startButton.on('pointerout', () => startButton.setStyle({ fill: "#ffd700" }));
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

  // Menu principal container
  startMenu = this.add.container(0, 0, [titleText, playerText, startButton]);

  // Touches clavier
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

  // --- Pause avec espace ---
  this.input.keyboard.on('keydown-SPACE', () => {
    if (!gameStarted) {
      if (startMenu.visible) {
        startMenu.setVisible(false);
        startGame();
      }
      return;
    }

    // --- Toggle pause ---
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
      if (pauseText) {
        pauseText.destroy();
        pauseText = null;
      }
    }
  });
}


//     START GAME

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

  // Retirer flou si présent
  setBackgroundBlur(sceneRef, false);

  const startX = 400;
  const startY = 300;

  //  Crée la tête (image) comme premier segment 
  const head = sceneRef.add.image(startX, startY, 'head').setDisplaySize(cellSize, cellSize);
  snake.push(head);
  
   // crée quelques segments de corps derrière la tête visuellement (facultatif)
  for (let i = 1; i < 3; i++) {
    const seg = sceneRef.add.image(startX - i * cellSize, startY, 'body');
    snake.push(seg);
  }

  food = sceneRef.add.image(randomX(), randomY(), "food");

  for (let i = 0; i < 20; i++) createObstacle();

  scoreText.setText("Score: " + score);
  bestScoreText.setText("Meilleur: " + bestScore);
}


//     UPDATE

function update(time) {
  if (!gameStarted || isPaused) return;

  if ((keys.left.isDown || keys.leftA.isDown) && direction !== "RIGHT") nextDirection = "LEFT";
  else if ((keys.right.isDown || keys.rightA.isDown) && direction !== "LEFT") nextDirection = "RIGHT";
  else if ((keys.up.isDown || keys.upA.isDown) && direction !== "DOWN") nextDirection = "UP";
  else if ((keys.down.isDown || keys.downA.isDown) && direction !== "UP") nextDirection = "DOWN";

  if (time > moveTimer) {
    moveSnake();
    moveTimer = time + moveDelay;
  }
}


//     MOVE SNAKE

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

  // --- Crée la nouvelle tête (toujours avec la texture 'head') ---
  const newHead = sceneRef.add.image(newX, newY, 'head').setDisplaySize(cellSize, cellSize);
  snake.unshift(newHead);

  // transforme l'ancienne tête (maintenant snake[1]) en corps
  if (snake.length > 1) {
    snake[1].setTexture('body');
    snake[1].setDisplaySize(cellSize, cellSize);
  }

  // Si a mangé la nourriture, on laisse la queue (grandit)
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
    // retire la queue
    const tail = snake.pop();
    tail.destroy();
  }

  // --- Faire pivoter la tête selon la direction ---
  const currentHead = snake[0];
  if (direction === "UP") currentHead.setAngle(0);
  else if (direction === "RIGHT") currentHead.setAngle(90);
  else if (direction === "DOWN") currentHead.setAngle(180);
  else if (direction === "LEFT") currentHead.setAngle(-90);
}


/*/     OBSTACLES

function createObstacle() {
  const x = randomX();
  const y = randomY();
  if (Phaser.Math.Distance.Between(x, y, 400, 300) < 50) return;
  const obs = sceneRef.add.image(x, y, "obstacle");
  const vx = Phaser.Math.FloatBetween(-0.2, 0.2);
  const vy = Phaser.Math.FloatBetween(-0.2, 0.2);
  obstacles.push({ sprite: obs, vx, vy });
}*/
function createObstacle() {
  const x = randomX();
  const y = randomY();

  // éviter de faire apparaître un obstacle trop proche du centre
  if (Phaser.Math.Distance.Between(x, y, 400, 300) < 50) return;

  // choisir une image au hasard
  const obstacleType = Phaser.Math.Between(1, 2); // 1 ou 2
  const textureKey = obstacleType === 1 ? 'ail' : 'oignon';

  // créer l’obstacle
  const obs = sceneRef.add.image(x, y, textureKey)
    .setDisplaySize(cellSize * 1.5, cellSize * 1.5)
    .setDepth(0);

  // vitesse aléatoire de déplacement
  const vx = Phaser.Math.FloatBetween(-0.2, 0.2);
  const vy = Phaser.Math.FloatBetween(-0.2, 0.2);

  obstacles.push({ sprite: obs, vx, vy });
}



//     GAME OVER

function gameOver() {
  snake.forEach(p => p.destroy());
  snake = [];
  obstacles.forEach(o => o.sprite.destroy());
  obstacles = [];
  if (food) food.destroy();
  food = null;

  setBackgroundBlur(sceneRef, true);

  gameOverText.setText("Partie terminée !");
  gameOverText.setVisible(true);

  scoreText.setText("Score: " + score);
  bestScoreText.setText("Meilleur: " + bestScore);

  startMenu.setVisible(true);
  startButton.setText("▶ REJOUER");
  gameStarted = false;
}


//   UTILITAIRES

function randomX() {
  const cols = Math.floor(config.width / cellSize);
  return Math.floor(Math.random() * cols) * cellSize;
}
function randomY() {
  const rows = Math.floor(config.height / cellSize);
  return Math.floor(Math.random() * rows) * cellSize;
}

// --- Appliquer ou retirer le flou sur le fond ---
function setBackgroundBlur(scene, active) {
  const bg = bgContainer && bgContainer.list && bgContainer.list[0];
  if (!bg) return;

  if (active) {
    // ajoute un flou sur l'image de fond uniquement
    blurEffect = bg.postFX.addBlur(6, 6, 0.4);
  } else {
    if (blurEffect) {
      bg.postFX.clear();
      blurEffect = null;
    }
  }
}
