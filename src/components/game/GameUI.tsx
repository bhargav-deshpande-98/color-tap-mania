import React from 'react';
import { Pause, Play, RotateCcw, Star } from 'lucide-react';

interface GameUIProps {
  score: number;
  highScore: number;
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  showScore: boolean;
}

const GameUI: React.FC<GameUIProps> = ({ 
  score, 
  highScore, 
  isPaused, 
  onPause, 
  onResume,
  showScore 
}) => {
  if (!showScore) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex items-start justify-between p-4 pt-8">
        {/* Score */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="score-display animate-fade-in">{score}</span>
        </div>
        
        {/* High Score Star */}
        <div className="flex items-center gap-2 animate-fade-in">
          <Star className="w-6 h-6 text-white fill-white animate-star-pulse" />
        </div>
        
        {/* Pause Button */}
        <button
          onClick={isPaused ? onResume : onPause}
          className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
        >
          {isPaused ? (
            <Play className="w-6 h-6 text-white fill-white" />
          ) : (
            <Pause className="w-6 h-6 text-white fill-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default GameUI;
