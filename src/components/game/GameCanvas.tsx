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
  const colorChangeFlashRef = useRef<number>(0); // Flash effect timer when color changes
  const pendingColorChangeRef = useRef<{ timestamp: number; newColor: GameColor } | null>(null); // Delayed color change

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

  // Track last obstacle speed to ensure adjacent obstacles have different speeds
  const lastObstacleSpeedRef = useRef<number>(0);

  // Generate initial obstacles
  const generateInitialObstacles = (canvasWidth: number, canvasHeight: number): Obstacle[] => {
    const obstacles: Obstacle[] = [];
    const startY = canvasHeight * 0.3;

    for (let i = 0; i < 5; i++) {
      const prevSpeed = i > 0 ? obstacles[i - 1].rotationSpeed : 0;
      obstacles.push(createObstacle(canvasWidth, startY - i * OBSTACLE_GAP, i, prevSpeed));
    }

    // Store the last speed for future obstacles
    if (obstacles.length > 0) {
      lastObstacleSpeedRef.current = obstacles[obstacles.length - 1].rotationSpeed;
    }

    return obstacles;
  };

  // Create a single obstacle with speed different from previous
  const createObstacle = (canvasWidth: number, y: number, index: number, prevSpeed: number): Obstacle => {
    // Use dotCircle less frequently (every 5th obstacle), otherwise alternate ring/halfRing
    const type: Obstacle['type'] = index % 5 === 0 ? 'dotCircle' : (index % 2 === 0 ? 'ring' : 'halfRing');

    // Generate a speed that's guaranteed to be different from the previous obstacle
    let rotationSpeed: number;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      const direction = Math.random() > 0.5 ? 1 : -1;
      // Balanced speed multiplier for good gameplay
      const globalSpeedMultiplier = 1.2;
      const randomFactor = 0.6 + Math.random() * 1.0; // 0.6x to 1.6x random multiplier
      const indexFactor = 0.008 + (index % 11) * 0.004; // Varies from 0.008 to 0.048
      const baseSpeed = type === 'dotCircle' ? indexFactor * 2.5 : indexFactor;
      rotationSpeed = baseSpeed * direction * randomFactor * globalSpeedMultiplier;
      attempts++;

      // Check if speed is sufficiently different (at least 20% different or opposite direction)
      const speedDiff = Math.abs(Math.abs(rotationSpeed) - Math.abs(prevSpeed));
      const minDiff = Math.max(Math.abs(prevSpeed) * 0.2, 0.005);
      const isDifferentDirection = (rotationSpeed > 0) !== (prevSpeed > 0);

      if (speedDiff > minDiff || isDifferentDirection || attempts >= maxAttempts) {
        break;
      }
    } while (true);

    return {
      id: generateId(),
      type,
      y,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed,
      radius: 140, // Same radius for all obstacles
      passed: false,
    };
  };

  // Handle tap/click - no debounce, every tap should bounce
  const handleTap = useCallback(() => {
    if (!gameStateRef.current || gameStatus !== 'playing') return;

    gameStateRef.current.ball.velocity = JUMP_FORCE;
  }, [gameStatus]);

  // Set up native touch/mouse event listeners for better iOS/Flutter compatibility
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onInput = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      handleTap();
    };

    // Use touchstart for touch devices (iOS), mousedown for desktop
    canvas.addEventListener('touchstart', onInput, { passive: false });
    canvas.addEventListener('mousedown', onInput);

    // Prevent scrolling
    const preventScroll = (e: Event) => e.preventDefault();
    canvas.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onInput);
      canvas.removeEventListener('mousedown', onInput);
      canvas.removeEventListener('touchmove', preventScroll);
    };
  }, [handleTap]);

  // Draw the ball with prominent color and flash effect on color change
  const drawBall = (ctx: CanvasRenderingContext2D, ball: GameState['ball'], cameraY: number) => {
    const screenY = ball.y - cameraY;
    const color = GAME_COLORS[ball.color];
    const flashIntensity = colorChangeFlashRef.current;

    // Debug: log current ball color every 60 frames
    if (Math.random() < 0.02) {
      console.log('Drawing ball with color:', ball.color, color);
    }

    ctx.save();

    // Flash effect when color changes - expanding ring
    if (flashIntensity > 0) {
      const flashRadius = ball.radius + (1 - flashIntensity) * 50;
      ctx.beginPath();
      ctx.arc(ball.x, screenY, flashRadius, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 4 * flashIntensity;
      ctx.globalAlpha = flashIntensity;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Outer glow
    ctx.beginPath();
    ctx.arc(ball.x, screenY, ball.radius + 6, 0, Math.PI * 2);
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Main ball - larger and more visible
    ctx.beginPath();
    ctx.arc(ball.x, screenY, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fill();

    // White border to make the ball stand out
    ctx.beginPath();
    ctx.arc(ball.x, screenY, ball.radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(ball.x - ball.radius * 0.25, screenY - ball.radius * 0.25, ball.radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();

    ctx.restore();
  };

  // Draw rotating ring obstacle
  const drawRing = (ctx: CanvasRenderingContext2D, obstacle: Obstacle, centerX: number, cameraY: number) => {
    const screenY = obstacle.y - cameraY;
    const { radius, rotation } = obstacle;
    const thickness = 28;
    
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

  // Draw dot circle obstacle - groups of 6 same-colored dots
  const drawDotCircle = (ctx: CanvasRenderingContext2D, obstacle: Obstacle, centerX: number, cameraY: number) => {
    const screenY = obstacle.y - cameraY;
    const { radius, rotation } = obstacle;
    const dotCount = 24;
    const dotRadius = 16;
    const dotsPerGroup = 6; // 24 dots / 4 colors = 6 dots per color

    ctx.save();
    ctx.translate(centerX, screenY);
    ctx.rotate(rotation);

    for (let i = 0; i < dotCount; i++) {
      const angle = (i / dotCount) * Math.PI * 2;
      // Group dots by color: dots 0-5 = color 0, dots 6-11 = color 1, etc.
      const colorIndex = Math.floor(i / dotsPerGroup);
      const color = COLOR_ORDER[colorIndex];
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
    const thickness = 28;
    
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

    // Obstacle thickness - ball needs to be within this zone to check color
    const thickness = obstacle.type === 'dotCircle' ? 20 : 14; // Ring thickness / 2
    const innerRadius = obstacle.radius - thickness - ball.radius;
    const outerRadius = obstacle.radius + thickness + ball.radius;

    // Ball is NOT in the obstacle zone - no collision
    if (distance <= innerRadius || distance >= outerRadius) {
      return false;
    }

    // Ball IS in the obstacle zone - check if color matches
    // Calculate the angle from obstacle center to ball, accounting for rotation
    let angle = Math.atan2(dy, dx) - obstacle.rotation;
    // Normalize angle to 0-2π
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;

    // For dotCircle, segments are different (6 dots per color group)
    let segmentColor: GameColor;
    if (obstacle.type === 'dotCircle') {
      // 24 dots total, 6 per color, each dot covers (2π/24) radians
      const dotIndex = Math.floor((angle / (Math.PI * 2)) * 24);
      const colorIndex = Math.floor(dotIndex / 6);
      segmentColor = COLOR_ORDER[colorIndex % 4];
    } else {
      // For ring and halfRing, 4 segments of 90 degrees each
      const segmentIndex = Math.floor(angle / (Math.PI / 2));
      segmentColor = COLOR_ORDER[segmentIndex % 4];
    }

    // Debug: log collision check occasionally
    if (Math.random() < 0.01) {
      console.log('In obstacle zone:', {
        ballColor: ball.color,
        segmentColor,
        angle: (angle * 180 / Math.PI).toFixed(1),
        distance: distance.toFixed(1),
        match: ball.color === segmentColor
      });
    }

    // Collision only if colors DON'T match
    if (ball.color !== segmentColor) {
      console.log('COLLISION! Ball:', ball.color, 'Segment:', segmentColor);
      return true;
    }

    // Colors match - no collision, ball passes through
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

    // Decay flash effect
    if (colorChangeFlashRef.current > 0) {
      colorChangeFlashRef.current = Math.max(0, colorChangeFlashRef.current - 0.05 * deltaTime);
    }

    if (gameStatus === 'playing') {
      // Check if there's a pending color change that's ready to apply
      if (pendingColorChangeRef.current && timestamp >= pendingColorChangeRef.current.timestamp) {
        const newColor = pendingColorChangeRef.current.newColor;
        console.log('Applying delayed color change:', game.ball.color, '->', newColor);
        game.ball.color = newColor;
        colorChangeFlashRef.current = 1.0;
        pendingColorChangeRef.current = null;
      }

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

      // First, check if ball passed any obstacles and update score
      for (const obstacle of game.obstacles) {
        if (!obstacle.passed && game.ball.y < obstacle.y - obstacle.radius - 20) {
          obstacle.passed = true;
          game.score += 1;
          onScoreChange(game.score);

          // Schedule ball color change every 2 obstacles (with 1 second delay)
          if (game.score % 2 === 0 && !pendingColorChangeRef.current) {
            const currentColorIndex = COLOR_ORDER.indexOf(game.ball.color);
            const nextColorIndex = (currentColorIndex + 1) % COLOR_ORDER.length;
            const newColor = COLOR_ORDER[nextColorIndex];
            console.log('Scheduling color change in 1 second:', game.ball.color, '->', newColor);
            pendingColorChangeRef.current = {
              timestamp: timestamp + 1000, // 1 second delay
              newColor
            };
          }
        }
      }

      // Check collisions with obstacles that haven't been passed yet
      for (const obstacle of game.obstacles) {
        if (!obstacle.passed && checkCollision(game.ball, obstacle, centerX)) {
          console.log('Game over at score:', game.score, 'obstacle y:', obstacle.y, 'ball y:', game.ball.y);
          game.status = 'gameover';
          onGameOver(game.score);
          return;
        }
      }
      
      // Generate new obstacles as needed
      const highestObstacle = Math.min(...game.obstacles.map(o => o.y));
      if (game.ball.y < highestObstacle + OBSTACLE_GAP * 2) {
        // Use the last obstacle's speed to ensure different speed for new obstacle
        const newObstacle = createObstacle(canvas.width, highestObstacle - OBSTACLE_GAP, game.obstacles.length, lastObstacleSpeedRef.current);
        lastObstacleSpeedRef.current = newObstacle.rotationSpeed;
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
      
      // Check color switchers - now just marks them as collected (color changes automatically every 3 obstacles)
      game.colorSwitchers.forEach(switcher => {
        if (!switcher.used && checkColorSwitcher(game.ball, switcher)) {
          switcher.used = true;
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

    // Draw current ball color indicator on screen
    ctx.save();
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = GAME_COLORS[game.ball.color];
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(`Ball: ${game.ball.color.toUpperCase()}`, 20, 80);
    ctx.fillText(`Ball: ${game.ball.color.toUpperCase()}`, 20, 80);

    // Show "COLOR CHANGED!" when flash is active
    if (colorChangeFlashRef.current > 0.5) {
      ctx.font = 'bold 28px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      const text = 'COLOR CHANGED!';
      const textWidth = ctx.measureText(text).width;
      ctx.strokeText(text, (canvas.width - textWidth) / 2, 120);
      ctx.fillStyle = GAME_COLORS[game.ball.color];
      ctx.fillText(text, (canvas.width - textWidth) / 2, 120);
    }

    // Show upcoming color when a change is pending
    if (pendingColorChangeRef.current) {
      const timeLeft = Math.max(0, (pendingColorChangeRef.current.timestamp - timestamp) / 1000);
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = GAME_COLORS[pendingColorChangeRef.current.newColor];
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const text = `Next: ${pendingColorChangeRef.current.newColor.toUpperCase()} in ${timeLeft.toFixed(1)}s`;
      ctx.strokeText(text, 20, 110);
      ctx.fillText(text, 20, 110);
    }
    ctx.restore();

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
      style={{ touchAction: 'none' }}
    />
  );
};

export default GameCanvas;
