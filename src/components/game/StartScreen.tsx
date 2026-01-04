import React from 'react';
import { Play, Trophy } from 'lucide-react';
import { GAME_COLORS, COLOR_ORDER } from '@/lib/gameTypes';

interface StartScreenProps {
  highScore: number;
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ highScore, onStart }) => {
  return (
    <div 
      className="fixed inset-0 z-30 flex flex-col items-center justify-center game-canvas"
      onClick={onStart}
      onTouchStart={(e) => {
        e.preventDefault();
        onStart();
      }}
    >
      {/* Logo / Title */}
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        {/* Color Ring Logo */}
        <div className="relative w-32 h-32 animate-float">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {COLOR_ORDER.map((color, i) => {
              const startAngle = i * 90;
              const endAngle = (i + 1) * 90;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const radius = 40;
              const cx = 50;
              const cy = 50;
              
              const x1 = cx + radius * Math.cos(startRad);
              const y1 = cy + radius * Math.sin(startRad);
              const x2 = cx + radius * Math.cos(endRad);
              const y2 = cy + radius * Math.sin(endRad);
              
              return (
                <path
                  key={color}
                  d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
                  fill="none"
                  stroke={GAME_COLORS[color]}
                  strokeWidth="10"
                  strokeLinecap="butt"
                  style={{
                    filter: `drop-shadow(0 0 8px ${GAME_COLORS[color]})`
                  }}
                />
              );
            })}
          </svg>
          
          {/* Center ball */}
          <div 
            className="absolute top-1/2 left-1/2 w-8 h-8 rounded-full -translate-x-1/2 -translate-y-1/2"
            style={{
              background: GAME_COLORS.cyan,
              boxShadow: `0 0 20px ${GAME_COLORS.cyan}`
            }}
          />
        </div>
        
        {/* Title */}
        <h1 className="text-4xl font-bold text-white text-glow tracking-wide">
          COLOR SWITCH
        </h1>
      </div>
      
      {/* High Score */}
      {highScore > 0 && (
        <div className="flex items-center gap-2 mt-8 animate-slide-up">
          <Trophy className="w-5 h-5 text-game-yellow" />
          <span className="text-lg text-white/80">Best: {highScore}</span>
        </div>
      )}
      
      {/* Play Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
        className="mt-12 game-button flex items-center gap-3 animate-pulse-glow"
      >
        <Play className="w-6 h-6 fill-white" />
        <span>TAP TO PLAY</span>
      </button>
      
      {/* Instructions */}
      <p className="mt-8 text-sm text-white/50 animate-slide-up">
        Tap to jump • Match colors to pass
      </p>
    </div>
  );
};

export default StartScreen;
