// Game color definitions matching the original Color Switch
export const GAME_COLORS = {
  cyan: '#00FFFF',
  purple: '#9B30FF', 
  pink: '#FF1493',
  yellow: '#FFD700',
} as const;

export type GameColor = keyof typeof GAME_COLORS;

export const COLOR_ORDER: GameColor[] = ['cyan', 'purple', 'pink', 'yellow'];

// Get color value by name
export const getColorValue = (color: GameColor): string => GAME_COLORS[color];

// Get random color
export const getRandomColor = (): GameColor => {
  return COLOR_ORDER[Math.floor(Math.random() * COLOR_ORDER.length)];
};

// Ball state
export interface Ball {
  x: number;
  y: number;
  radius: number;
  velocity: number;
  color: GameColor;
}

// Obstacle types
export type ObstacleType = 'ring' | 'dotCircle' | 'halfRing' | 'doubleLine';

export interface Obstacle {
  id: string;
  type: ObstacleType;
  y: number;
  rotation: number;
  rotationSpeed: number;
  radius: number;
  passed: boolean;
}

// Star collectible
export interface Star {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

// Color switcher
export interface ColorSwitcher {
  id: string;
  x: number;
  y: number;
  used: boolean;
}

// Game state
export interface GameState {
  status: 'menu' | 'playing' | 'gameover';
  score: number;
  highScore: number;
  ball: Ball;
  obstacles: Obstacle[];
  stars: Star[];
  colorSwitchers: ColorSwitcher[];
  cameraY: number;
}

// Constants
export const GRAVITY = 0.35;
export const JUMP_FORCE = -9;
export const BALL_RADIUS = 15;
export const OBSTACLE_GAP = 300;
export const ROTATION_SPEED = 0.015;
