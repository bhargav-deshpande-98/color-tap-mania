import React, { useState, useCallback, useEffect } from 'react';
import GameCanvas from './GameCanvas';
import GameUI from './GameUI';
import StartScreen from './StartScreen';
import GameOverScreen from './GameOverScreen';

type GameScreen = 'start' | 'playing' | 'gameover';

const ColorSwitchGame: React.FC = () => {
  const [screen, setScreen] = useState<GameScreen>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  // Load high score on mount
  useEffect(() => {
    const saved = localStorage.getItem('colorSwitchHighScore');
    if (saved) {
      setHighScore(parseInt(saved));
    }
  }, []);

  // Start game
  const handleStart = useCallback(() => {
    setScore(0);
    setIsNewHighScore(false);
    setIsPaused(false);
    setGameKey(prev => prev + 1);
    setScreen('playing');
  }, []);

  // Handle game over
  const handleGameOver = useCallback((finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      setIsNewHighScore(true);
      localStorage.setItem('colorSwitchHighScore', finalScore.toString());
    }
    setScreen('gameover');
  }, [highScore]);

  // Handle score change
  const handleScoreChange = useCallback((newScore: number) => {
    setScore(newScore);
  }, []);

  // Pause/Resume
  const handlePause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Return to home
  const handleHome = useCallback(() => {
    setScreen('start');
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Game Canvas - always rendered when playing or game over */}
      {screen !== 'start' && (
        <GameCanvas
          key={gameKey}
          onGameOver={handleGameOver}
          onScoreChange={handleScoreChange}
          gameStatus={isPaused ? 'paused' : 'playing'}
        />
      )}

      {/* UI Overlay */}
      <GameUI
        score={score}
        highScore={highScore}
        isPaused={isPaused}
        onPause={handlePause}
        onResume={handleResume}
        showScore={screen === 'playing'}
      />

      {/* Start Screen */}
      {screen === 'start' && (
        <StartScreen
          highScore={highScore}
          onStart={handleStart}
        />
      )}

      {/* Game Over Screen */}
      {screen === 'gameover' && (
        <GameOverScreen
          score={score}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onRestart={handleStart}
          onHome={handleHome}
        />
      )}

      {/* Pause Overlay */}
      {isPaused && screen === 'playing' && (
        <div 
          className="fixed inset-0 z-25 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={handleResume}
        >
          <div className="text-center animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-4">PAUSED</h2>
            <p className="text-white/60">Tap anywhere to continue</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorSwitchGame;
