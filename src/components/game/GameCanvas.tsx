import React, { useRef, useEffect, useCallback, useState } from 'react';
import { 
  GameState, 
  GAME_COLORS, 
  COLOR_ORDER, 
  GameColor,
  getRandomColor,
  GRAVITY,
  JUMP_FORCE,
  BALL_RADIUS,
  OBSTACLE_GAP,
  Obstacle,
  Star,
  ColorSwitcher
} from '@/lib/gameTypes';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  onScoreChange: (score: number) => void;
  gameStatus: 'playing' | 'paused';
}

const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, onScoreChange, gameStatus }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Initialize game state
  const initGame = useCallback((canvasWidth: number, canvasHeight: number): GameState => {
    const initialColor = getRandomColor();
    
    return {
      status: 'playing',
      score: 0,
      highScore: parseInt(localStorage.getItem('colorSwitchHighScore') || '0'),
      ball: {
        x: canvasWidth / 2,
        y: canvasHeight * 0.7,
        radius: BALL_RADIUS,
        velocity: 0,
        color: initialColor,
      },
      obstacles: generateInitialObstacles(canvasWidth, canvasHeight),
      stars: [],
      colorSwitchers: [],
      cameraY: 0,
    };
  }, []);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Generate initial obstacles
  const generateInitialObstacles = (canvasWidth: number, canvasHeight: number): Obstacle[] => {
    const obstacles: Obstacle[] = [];
    const startY = canvasHeight * 0.3;
    
    for (let i = 0; i < 5; i++) {
      obstacles.push(createObstacle(canvasWidth, startY - i * OBSTACLE_GAP, i));
    }
    
    return obstacles;
  };

  // Create a single obstacle
  const createObstacle = (canvasWidth: number, y: number, index: number): Obstacle => {
    const types: Obstacle['type'][] = ['ring', 'dotCircle', 'halfRing'];
    const type = types[index % types.length];
    const direction = Math.random() > 0.5 ? 1 : -1;
    
    return {
      id: generateId(),
      type,
      y,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: 0.02 * direction * (0.8 + Math.random() * 0.4),
      radius: type === 'dotCircle' ? 60 : 70,
      passed: false,
    };
  };

  // Handle tap/click
  const handleTap = useCallback(() => {
    if (!gameStateRef.current || gameStatus !== 'playing') return;
    
    gameStateRef.current.ball.velocity = JUMP_FORCE;
  }, [gameStatus]);

  // Draw the ball
  const drawBall = (ctx: CanvasRenderingContext2D, ball: GameState['ball'], cameraY: number) => {
    const screenY = ball.y - cameraY;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(ball.x, screenY, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = GAME_COLORS[ball.color];
    ctx.shadowColor = GAME_COLORS[ball.color];
    ctx.shadowBlur = 15;
    ctx.fill();
    ctx.restore();
  };

  // Draw rotating ring obstacle
  const drawRing = (ctx: CanvasRenderingContext2D, obstacle: Obstacle, centerX: number, cameraY: number) => {
    const screenY = obstacle.y - cameraY;
    const { radius, rotation } = obstacle;
    const thickness = 12;
    
    ctx.save();
    ctx.translate(centerX, screenY);
    ctx.rotate(rotation);
    
    // Draw 4 colored segments
    COLOR_ORDER.forEach((color, i) => {
      const startAngle = (i * Math.PI / 2);
      const endAngle = ((i + 1) * Math.PI / 2);
      
      ctx.beginPath();
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.lineWidth = thickness;
      ctx.strokeStyle = GAME_COLORS[color];
      ctx.lineCap = 'butt';
      ctx.stroke();
    });
    
    ctx.restore();
  };

  // Draw dot circle obstacle
  const drawDotCircle = (ctx: CanvasRenderingContext2D, obstacle: Obstacle, centerX: number, cameraY: number) => {
    const screenY = obstacle.y - cameraY;
    const { radius, rotation } = obstacle;
    const dotCount = 16;
    const dotRadius = 8;
    
    ctx.save();
    ctx.translate(centerX, screenY);
    ctx.rotate(rotation);
    
    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      const color = COLOR_ORDER[i % 4];
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = GAME_COLORS[color];
      ctx.fill();
    }
    
    ctx.restore();
  };

  // Draw half ring obstacle
  const drawHalfRing = (ctx: CanvasRenderingContext2D, obstacle: Obstacle, centerX: number, cameraY: number) => {
    const screenY = obstacle.y - cameraY;
    const { radius, rotation } = obstacle;
    const thickness = 12;
    
    ctx.save();
    ctx.translate(centerX, screenY);
    ctx.rotate(rotation);
    
    // Draw 2 half rings (each with 2 colors)
    for (let half = 0; half < 2; half++) {
      const baseAngle = half * Math.PI;
      for (let i = 0; i < 2; i++) {
        const colorIndex = half * 2 + i;
        const startAngle = baseAngle + (i * Math.PI / 2);
        const endAngle = baseAngle + ((i + 1) * Math.PI / 2);
        
        ctx.beginPath();
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.lineWidth = thickness;
        ctx.strokeStyle = GAME_COLORS[COLOR_ORDER[colorIndex]];
        ctx.lineCap = 'butt';
        ctx.stroke();
      }
    }
    
    ctx.restore();
  };

  // Draw star
  const drawStar = (ctx: CanvasRenderingContext2D, x: number, y: number, cameraY: number) => {
    const screenY = y - cameraY;
    const size = 15;
    const spikes = 5;
    
    ctx.save();
    ctx.translate(x, screenY);
    ctx.beginPath();
    
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? size : size / 2;
      const angle = (i * Math.PI) / spikes - Math.PI / 2;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
  };

  // Draw color switcher
  const drawColorSwitcher = (ctx: CanvasRenderingContext2D, x: number, y: number, cameraY: number) => {
    const screenY = y - cameraY;
    const radius = 15;
    
    ctx.save();
    ctx.translate(x, screenY);
    
    // Draw 4 colored quarters
    COLOR_ORDER.forEach((color, i) => {
      const startAngle = (i * Math.PI / 2) - Math.PI / 4;
      const endAngle = ((i + 1) * Math.PI / 2) - Math.PI / 4;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = GAME_COLORS[color];
      ctx.fill();
    });
    
    ctx.restore();
  };

  // Check collision between ball and obstacle
  const checkCollision = (ball: GameState['ball'], obstacle: Obstacle, centerX: number): boolean => {
    const dx = ball.x - centerX;
    const dy = ball.y - obstacle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const innerRadius = obstacle.radius - 15;
    const outerRadius = obstacle.radius + 15;
    
    // Ball is in the obstacle zone
    if (distance > innerRadius && distance < outerRadius) {
      // Calculate which segment the ball is in
      let angle = Math.atan2(dy, dx) - obstacle.rotation;
      // Normalize angle
      while (angle < 0) angle += Math.PI * 2;
      while (angle >= Math.PI * 2) angle -= Math.PI * 2;
      
      const segmentIndex = Math.floor(angle / (Math.PI / 2));
      const segmentColor = COLOR_ORDER[segmentIndex % 4];
      
      // If ball color doesn't match segment color, it's a collision
      if (ball.color !== segmentColor) {
        return true;
      }
    }
    
    return false;
  };

  // Check if ball passed through a color switcher
  const checkColorSwitcher = (ball: GameState['ball'], switcher: ColorSwitcher): boolean => {
    const dx = ball.x - switcher.x;
    const dy = ball.y - switcher.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < ball.radius + 15;
  };

  // Main game loop
  const gameLoop = useCallback((timestamp: number) => {
    if (!canvasRef.current || !gameStateRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const game = gameStateRef.current;
    const centerX = canvas.width / 2;
    
    // Calculate delta time
    const deltaTime = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 16.67 : 1;
    lastTimeRef.current = timestamp;
    
    if (gameStatus === 'playing') {
      // Apply gravity
      game.ball.velocity += GRAVITY * deltaTime;
      game.ball.y += game.ball.velocity * deltaTime;
      
      // Update camera to follow ball
      const targetCameraY = game.ball.y - canvas.height * 0.7;
      game.cameraY += (targetCameraY - game.cameraY) * 0.1;
      
      // Rotate obstacles
      game.obstacles.forEach(obstacle => {
        obstacle.rotation += obstacle.rotationSpeed * deltaTime;
      });
      
      // Check collisions with obstacles
      for (const obstacle of game.obstacles) {
        if (checkCollision(game.ball, obstacle, centerX)) {
          game.status = 'gameover';
          onGameOver(game.score);
          return;
        }
        
        // Check if ball passed obstacle
        if (!obstacle.passed && game.ball.y < obstacle.y - obstacle.radius - 20) {
          obstacle.passed = true;
          game.score += 1;
          onScoreChange(game.score);
        }
      }
      
      // Generate new obstacles as needed
      const highestObstacle = Math.min(...game.obstacles.map(o => o.y));
      if (game.ball.y < highestObstacle + OBSTACLE_GAP * 2) {
        const newObstacle = createObstacle(canvas.width, highestObstacle - OBSTACLE_GAP, game.obstacles.length);
        game.obstacles.push(newObstacle);
        
        // Add color switcher between obstacles
        game.colorSwitchers.push({
          id: generateId(),
          x: centerX,
          y: highestObstacle - OBSTACLE_GAP / 2,
          used: false,
        });
        
        // Add star occasionally
        if (Math.random() > 0.5) {
          game.stars.push({
            id: generateId(),
            x: centerX,
            y: highestObstacle - OBSTACLE_GAP / 2 - 40,
            collected: false,
          });
        }
      }
      
      // Check color switchers
      game.colorSwitchers.forEach(switcher => {
        if (!switcher.used && checkColorSwitcher(game.ball, switcher)) {
          switcher.used = true;
          // Change to a different random color
          let newColor = getRandomColor();
          while (newColor === game.ball.color) {
            newColor = getRandomColor();
          }
          game.ball.color = newColor;
        }
      });
      
      // Remove off-screen obstacles
      game.obstacles = game.obstacles.filter(o => o.y < game.cameraY + canvas.height + 200);
      game.colorSwitchers = game.colorSwitchers.filter(s => s.y < game.cameraY + canvas.height + 200);
      game.stars = game.stars.filter(s => s.y < game.cameraY + canvas.height + 200);
      
      // Check bottom boundary (game over)
      if (game.ball.y > game.cameraY + canvas.height + 50) {
        game.status = 'gameover';
        onGameOver(game.score);
        return;
      }
    }
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw color switchers
    game.colorSwitchers.forEach(switcher => {
      if (!switcher.used) {
        drawColorSwitcher(ctx, switcher.x, switcher.y, game.cameraY);
      }
    });
    
    // Draw stars
    game.stars.forEach(star => {
      if (!star.collected) {
        drawStar(ctx, star.x, star.y, game.cameraY);
      }
    });
    
    // Draw obstacles
    game.obstacles.forEach(obstacle => {
      switch (obstacle.type) {
        case 'ring':
          drawRing(ctx, obstacle, centerX, game.cameraY);
          break;
        case 'dotCircle':
          drawDotCircle(ctx, obstacle, centerX, game.cameraY);
          break;
        case 'halfRing':
          drawHalfRing(ctx, obstacle, centerX, game.cameraY);
          break;
      }
    });
    
    // Draw ball
    drawBall(ctx, game.ball, game.cameraY);
    
    // Continue loop
    if (game.status === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameStatus, onGameOver, onScoreChange]);

  // Initialize canvas and game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      if (!gameStateRef.current || gameStateRef.current.status !== 'playing') {
        gameStateRef.current = initGame(canvas.width, canvas.height);
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [initGame]);

  // Start game loop
  useEffect(() => {
    if (gameStatus === 'playing') {
      const canvas = canvasRef.current;
      if (canvas && !gameStateRef.current) {
        gameStateRef.current = initGame(canvas.width, canvas.height);
      }
      animationRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [gameStatus, gameLoop, initGame]);

  // Reset game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && gameStatus === 'playing') {
      gameStateRef.current = initGame(canvas.width, canvas.height);
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(gameLoop);
    }
  }, [gameStatus, initGame, gameLoop]);

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas touch-none"
      onClick={handleTap}
      onTouchStart={(e) => {
        e.preventDefault();
        handleTap();
      }}
    />
  );
};

export default GameCanvas;
