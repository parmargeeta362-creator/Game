import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Eye } from 'lucide-react';
import { Player } from '../types/game';

interface VictoryModalProps {
  winner: Player | null;
  isOpen: boolean;
  onRestart: () => void;
  onClose: () => void;
  turnsTotal: number;
  isDark?: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  isOpen,
  onRestart,
  onClose,
  turnsTotal,
  isDark = true,
}) => {
  useEffect(() => {
    if (isOpen && winner) {
      // Fire celebratory confetti bursts
      const count = 200;
      const defaults = { origin: { y: 0.7 } };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [isOpen, winner]);

  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center border overflow-hidden transition-colors ${
          isDark
            ? 'bg-gradient-to-b from-stone-900 to-stone-950 border-amber-500/50 text-stone-100'
            : 'bg-gradient-to-b from-amber-50 to-white border-amber-400 text-stone-900'
        }`}
      >
        {/* Glow ambient background */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ backgroundColor: winner.color }}
        />

        {/* Trophy Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mb-4 shadow-xl">
          <Trophy size={42} className="text-amber-500 animate-bounce" />
        </div>

        {/* Victory Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight">
          Victory!
        </h2>
        <p className="text-sm mt-1 opacity-80">
          <span
            className="font-bold text-base px-2 py-0.5 rounded"
            style={{ color: winner.color }}
          >
            {winner.name}
          </span>{' '}
          has conquered the board!
        </p>

        {/* Match Statistics Summary */}
        <div
          className={`grid grid-cols-3 gap-2.5 my-6 p-3.5 rounded-2xl border ${
            isDark ? 'bg-stone-900/90 border-stone-800' : 'bg-amber-100/60 border-amber-200'
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Total Turns</span>
            <span className="text-lg font-bold font-mono text-amber-500 mt-0.5">{turnsTotal}</span>
          </div>

          <div className={`flex flex-col items-center border-x px-1 ${isDark ? 'border-stone-800' : 'border-amber-200'}`}>
            <span className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Ladders</span>
            <span className="text-lg font-bold font-mono text-sky-500 mt-0.5">🪜 {winner.laddersClimbed}</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Snakes</span>
            <span className="text-lg font-bold font-mono text-rose-500 mt-0.5">🐍 {winner.snakesBitten}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Play Again</span>
          </button>
          
          <button
            onClick={onClose}
            className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
                : 'bg-stone-200 hover:bg-stone-300 text-stone-800 border-stone-300'
            }`}
          >
            <Eye size={16} />
            <span>View Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};
