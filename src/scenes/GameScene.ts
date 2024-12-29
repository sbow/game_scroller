import { Player, Asteroid } from '../types/GameObjects';

export class GameScene extends Phaser.Scene {
    private debugEnabled: boolean = false;
    private debugGraphics!: Phaser.GameObjects.Graphics;
    private player!: Phaser.GameObjects.Sprite;
    private asteroids: Array<{sprite: Phaser.GameObjects.Sprite; velocityX: number; velocityY: number}> = [];
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private gameOver: boolean = false;
    private spawnTimer!: Phaser.Time.TimerEvent;
    private level: number = 1;
    private levelProgress: number = 0;
    private levelThreshold: number = 1000; // Score needed to advance level

    constructor() {
        super({ key: 'GameScene' });
    }

    setDebug(enabled: boolean) {
        this.debugEnabled = enabled;
        // Always create debug graphics if enabled, even if it exists
        if (this.debugEnabled) {
            // Destroy existing debug graphics if it exists
            if (this.debugGraphics) {
                this.debugGraphics.destroy();
            }
            this.debugGraphics = this.add.graphics();
            this.debugGraphics.setDepth(2);
        }
        console.log('Debug mode set to:', this.debugEnabled);
    }    

    init() {
        // Make sure debug graphics is created if debug is enabled
        if (this.debugEnabled && !this.debugGraphics) {
            this.debugGraphics = this.add.graphics();
            this.debugGraphics.setDepth(2);
        }    
    }


    preload() {
   //     this.load.setBaseURL('https://labs.phaser.io');
   //     this.load.image('ship', 'assets/sprites/thrust_ship2.png');
   //     this.load.image('asteroid', 'assets/sprites/asteroid.png');
   //     this.load.image('background', 'assets/skies/space3.png');
        this.load.image('ship', 'assets/sprites/thrust_ship2.png');
        this.load.image('asteroid', 'assets/asteroids/medium/a10000.png');
        this.load.image('background', 'assets/skies/space3.png');
    }

    create() {
        this.resetGameState();

        const background = this.add.tileSprite(
            this.cameras.main.centerX, 
            this.cameras.main.centerY, 
            this.cameras.main.width,
            this.cameras.main.height,
            'background'
        );
        
        this.player = this.add.sprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'ship'
        ).setDepth(1);

        this.cursors = (this.input.keyboard as Phaser.Input.Keyboard.KeyboardPlugin).createCursorKeys();

        // Add score and level display
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            color: '#ffffff'
        });

        this.levelText = this.add.text(16, 56, 'Level: 1', {
            fontSize: '32px',
            color: '#ffffff'
        });
        
        this.startLevel();
    }

    private startLevel() {
        // Adjust difficulty based on level
        const spawnDelay = Math.max(1500 - (this.level * 100), 500); // Faster spawns each level, minimum 500ms
        
        this.spawnTimer = this.time.addEvent({
            delay: spawnDelay,
            callback: this.spawnAsteroid,
            callbackScope: this,
            loop: true
        });

        // Show level start text
        const levelStartText = this.add.text(400, 300, `Level ${this.level}`, {
            fontSize: '64px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Remove the text after 2 seconds
        this.time.delayedCall(2000, () => {
            levelStartText.destroy();
        });
    }

    update(time: number, delta: number) {
        if (this.gameOver) {
            return;
        }

        // Always clear and reset debug graphics if debug is enabled
        if (this.debugEnabled) {
            if (!this.debugGraphics) {
                this.debugGraphics = this.add.graphics();
                this.debugGraphics.setDepth(2);
            }
            this.debugGraphics.clear();
            this.debugGraphics.lineStyle(2, 0x00ff00);
        }

        // Update score and check for level progression
        this.score += delta * 0.01;
        this.levelProgress += delta * 0.01;
        this.scoreText.setText(`Score: ${Math.floor(this.score)}`);

        // Check for level up
        if (this.levelProgress >= this.levelThreshold) {
            this.levelUp();
        }

        // Handle player movement
        if (this.cursors.left.isDown) {
            this.player.x = Math.max(this.player.x - 5, 50);
        }
        if (this.cursors.right.isDown) {
            this.player.x = Math.min(this.player.x + 5, 750);
        }
        if (this.cursors.up.isDown) {
            this.player.y = Math.max(this.player.y - 5, 50);
        }
        if (this.cursors.down.isDown) {
            this.player.y = Math.min(this.player.y + 5, 550);
        }

        if (this.debugEnabled && this.debugGraphics) {
            // Draw player bounds
            const playerBounds = this.player.getBounds();
            this.debugGraphics.strokeRect(
                playerBounds.x,
                playerBounds.y,
                playerBounds.width,
                playerBounds.height
            );
        }

        // Update asteroids
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            const asteroidObj = this.asteroids[i];
            const asteroid = asteroidObj.sprite;
            
            asteroid.x += asteroidObj.velocityX;
            asteroid.y += asteroidObj.velocityY;

            // In your update loop's asteroid section:
            const asteroidBounds = asteroid.getBounds();
            const scaledBounds = this.getScaledBounds(asteroid, 0.4);

            if (this.debugEnabled && this.debugGraphics) {
                // Draw original bounds in red
                this.debugGraphics.lineStyle(2, 0xff0000);
                this.debugGraphics.strokeRect(
                    asteroidBounds.x,
                    asteroidBounds.y,
                    asteroidBounds.width,
                    asteroidBounds.height
                );

                // Draw scaled bounds in yellow
                this.debugGraphics.lineStyle(2, 0xffff00);
                this.debugGraphics.strokeRect(
                    scaledBounds.x,
                    scaledBounds.y,
                    scaledBounds.width,
                    scaledBounds.height
                );    
            }

            if (asteroid.x < -50 || asteroid.x > 850 || 
                asteroid.y < -50 || asteroid.y > 650) {
                asteroid.destroy();
                this.asteroids.splice(i, 1);
            }

            if (Phaser.Geom.Intersects.RectangleToRectangle(
                this.player.getBounds(),
                this.getScaledBounds(asteroid, 0.4)
            )) {
                this.handleGameOver();
            }
        }
    }

    private getScaledBounds(sprite: Phaser.GameObjects.Sprite, scale: number): Phaser.Geom.Rectangle {
        const bounds = sprite.getBounds();
        const widthDiff = bounds.width * (1 - scale);
        const heightDiff = bounds.height * (1 - scale);
        
        return new Phaser.Geom.Rectangle(
            bounds.x + (widthDiff / 2),
            bounds.y + (heightDiff / 2),
            bounds.width * scale,
            bounds.height * scale
        );
    }

    private levelUp() {
        this.level++;
        this.levelProgress = 0;
        this.levelThreshold *= 1.2; // Increase threshold for next level
        this.levelText.setText(`Level: ${this.level}`);

        // Clear existing asteroids for a brief respite
        this.asteroids.forEach(asteroidObj => asteroidObj.sprite.destroy());
        this.asteroids = [];

        // Stop current spawn timer
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
        }

        // Start new level
        this.startLevel();
    }

    private getRandomSpawnPosition(): { x: number; y: number; velocityX: number; velocityY: number } {
        const side = Phaser.Math.Between(0, 3);
        const baseSpeed = 3 + (this.level * 0.5); // Increase speed with level
        const targetingProbability = Math.min(0.3 + (this.level * 0.1), 0.8); // Increases with level, caps at 80%
        const isTargeting = Math.random() < targetingProbability;
        let x, y, velocityX, velocityY;

        switch(side) {
            case 0: // top
                x = Phaser.Math.Between(0, 800);
                y = -50;
                if (isTargeting) {
                    velocityX = this.player.x - x;
                    velocityY = this.player.y - y;
                } else {
                    velocityX = Phaser.Math.Between(-300, 300);
                    velocityY = 300;
                }
                break;
            case 1: // right
                x = 850;
                y = Phaser.Math.Between(0, 600);
                if (isTargeting) {
                    velocityX = this.player.x - x;
                    velocityY = this.player.y - y;
                } else {
                    velocityX = -300;
                    velocityY = Phaser.Math.Between(-300, 300);
                }
                break;
            case 2: // bottom
                x = Phaser.Math.Between(0, 800);
                y = 650;
                if (isTargeting) {
                    velocityX = this.player.x - x;
                    velocityY = this.player.y - y;
                } else {
                    velocityX = Phaser.Math.Between(-300, 300);
                    velocityY = -300;
                }
                break;
            default: // left
                x = -50;
                y = Phaser.Math.Between(0, 600);
                if (isTargeting) {
                    velocityX = this.player.x - x;
                    velocityY = this.player.y - y;
                } else {
                    velocityX = 300;
                    velocityY = Phaser.Math.Between(-300, 300);
                }
        }

        const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        velocityX = (velocityX / magnitude) * baseSpeed;
        velocityY = (velocityY / magnitude) * baseSpeed;

        return { x, y, velocityX, velocityY };
    }

    private resetGameState() {
        if (this.debugGraphics) {
            this.debugGraphics.clear();
        }        
        this.asteroids.forEach(asteroidObj => asteroidObj.sprite.destroy());
        this.asteroids = [];
        this.score = 0;
        this.gameOver = false;
        this.level = 1;
        this.levelProgress = 0;
        this.levelThreshold = 1000;
        
        if (this.spawnTimer) {
            this.spawnTimer.destroy();
        }
    }

    private spawnAsteroid() {
        if (this.gameOver) return;

        const spawnData = this.getRandomSpawnPosition();
        const asteroid = this.add.sprite(spawnData.x, spawnData.y, 'asteroid');
        const baseScale = 0.5 + (Math.random() * 1.0); // Random size between 0.5 and 1.5
        asteroid.setScale(baseScale);
        asteroid.setDepth(1);

        this.asteroids.push({
            sprite: asteroid,
            velocityX: spawnData.velocityX,
            velocityY: spawnData.velocityY
        });
    }

    private handleGameOver() {
        this.gameOver = true;
        this.spawnTimer.destroy();
        
        const gameOverText = this.add.text(400, 300, 'Game Over!', {
            fontSize: '64px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const finalScore = this.add.text(400, 350, `Final Score: ${Math.floor(this.score)}`, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const levelReached = this.add.text(400, 390, `Level Reached: ${this.level}`, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const restartButton = this.add.text(400, 450, 'Play Again', {
            fontSize: '32px',
            backgroundColor: '#4a4a4a',
            padding: { x: 10, y: 5 }
        })
        .setInteractive()
        .setOrigin(0.5)
        .on('pointerdown', () => {
            this.scene.restart();
        });
    }
}