export interface GameObjects {
    x: number;
    y: number;
    speed: number;
}

export interface Player extends GameObjects {
    lives: number;
}

export interface Asteroid extends GameObjects {
    size: number;
}