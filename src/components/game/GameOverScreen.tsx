import React from 'react';
import { RotateCcw, Trophy, Star, Home } from 'lucide-react';
import { GAME_COLORS } from '@/lib/gameTypes';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onHome: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  highScore,
  isNewHighScore,
  onRestart,
  onHome,
}) => {
  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center game-canvas bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Game Over Title */}
        <h2 className="text-3xl font-bold text-white/80">GAME OVER</h2>
        
        {/* Score Display */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Star className="w-8 h-8 text-white fill-white" />
            <span className="text-6xl font-bold text-white">{score}</span>
          </div>
          
          {isNewHighScore && (
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-full animate-pulse-glow"
              style={{ backgroundColor: `${GAME_COLORS.yellow}30` }}
            >
              <Trophy className="w-5 h-5 text-game-yellow" />
              <span className="text-game-yellow font-semibold">NEW BEST!</span>
            </div>
          )}
        </div>
        
        {/* High Score */}
        <div className="flex items-center gap-2 text-white/60">
          <Trophy className="w-4 h-4" />
          <span>Best: {highScore}</span>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={onHome}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white/10 transition-all hover:bg-white/20 active:scale-95"
          >
            <Home className="w-6 h-6 text-white" />
          </button>
          
          <button
            onClick={onRestart}
            className="game-button flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
