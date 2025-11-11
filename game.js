   // Configuration de base Phaser
            const config = {
              type: Phaser.AUTO,
              width: 800,
              height: 600,
              backgroundColor: '#1a1a1a',
              physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 } }
              },
              scene: { create, update }
            };

            let player, point, cursors, keys, score = 0, scoreText;

            // Création du jeu
            const game = new Phaser.Game(config);

            function create() {
              // Crée un carré bleu (50x50)
              const graphics1 = this.add.graphics();
              graphics1.fillStyle(0x0088ff, 0.81);
              graphics1.fillRect(0, 0, 50, 50);
              graphics1.generateTexture('player', 50, 50);
              graphics1.destroy();

              // point 
              const graphics2 = this.add.graphics();
              graphics2.fillStyle(0xffd700, 0.81);
              graphics2.fillCircle(10, 10, 10);
              graphics2.generateTexture('point', 20, 20);
              graphics2.destroy();


              // Ajoute le carré à la scène et active la physique
              player = this.physics.add.image(400, 300, 'player');
              player.setCollideWorldBounds(true);

              point = this.physics.add.image(
                Phaser.Math.Between(50, 750),
                Phaser.Math.Between(50, 550),
                'point'
              );

              // Active les touches fléchées
              cursors = this.input.keyboard.createCursorKeys();
              key = this.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.Z,
                left: Phaser.Input.Keyboard.KeyCodes.Q,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                right: Phaser.Input.Keyboard.KeyCodes.D
              });

              //score
              scoreText = this.add.text(16, 16, 'Score : 0', {
                fontSize: '24px',
                fill: '#ffffff'
              });
              //detection collision joueur et point
              this.physics.add.overlap(player, point, collectPoint, null, this);
            }

            function update() {
              const speed = 500;
              player.setVelocity(0);

              if (cursors.left.isDown || key.left.isDown){ player.setVelocityX(-speed);}
              else if (cursors.right.isDown || key.right.isDown){ player.setVelocityX(speed);}

              if (cursors.up.isDown || key.up.isDown){ player.setVelocityY(-speed);}
              else if (cursors.down.isDown || key.down.isDown){ player.setVelocityY(speed);}
            }
            function collectPoint(){
                // repesitionne le point ailleurs
                point.setPosition(
                    Phaser.Math.Between(50, 750),
                    Phaser.Math.Between(50, 550)

                    
                );

                //incrementation de score
                score += 1;
                scoreText.setText('Score : ' + score);
                player.setScale(player.scaleX * 1.1, player.scaleY);
              }
              