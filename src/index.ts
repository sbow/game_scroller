// index.ts
import 'phaser';
import { GameScene } from './scenes/GameScene';

// Get debug mode from URL parameter
const debugMode = window.location.search.includes('debug=true');
console.log('Debug mode:', debugMode);

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: debugMode
        }
    },
    // Instead of passing the debug flag through scene config,
    // we'll pass it as data to the scene
    scene: GameScene,
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Create game instance
const game = new Phaser.Game(config);

// Get the scene and set debug mode
const gameScene = game.scene.getScene('GameScene') as GameScene;
if (gameScene) {
    gameScene.setDebug(debugMode);
}