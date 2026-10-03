import React from 'react';
import { X, Trophy, ArrowUpRight, ArrowDownRight, Sparkles, Dices } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-stone-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl relative text-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎲</span>
            <h2 className="text-lg font-bold text-white font-display">How to Play Snakes & Ladders</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            aria-label="Close rules"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
          {/* Rule 1: Goal */}
          <div className="flex gap-3 items-start p-3 rounded-xl bg-stone-950/60 border border-stone-800">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Trophy size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-white">The Goal</h3>
              <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">
                Be the first player to traverse the 100 tiles and land on Tile 100!
              </p>
            </div>
          </div>

          {/* Rule 2: Rolling & Movement */}
          <div className="flex gap-3 items-start p-3 rounded-xl bg-stone-950/60 border border-stone-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Dices size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-white">Interactive Dice Rolls</h3>
              <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">
                Take turns clicking the 3D dice or pressing the <kbd className="px-1.5 py-0.5 bg-stone-800 text-stone-300 rounded border border-stone-700 text-[10px] font-mono">Spacebar</kbd>. Your pawn moves forward step-by-step.
              </p>
            </div>
          </div>

          {/* Rule 3: Ladders */}
          <div className="flex gap-3 items-start p-3 rounded-xl bg-stone-950/60 border border-stone-800">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
              <ArrowUpRight size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sky-300">Ladders (Climb Up)</h3>
              <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">
                Landing exactly on the bottom rung of a ladder automatically boosts you straight up to the ladder&apos;s top tile!
              </p>
            </div>
          </div>

          {/* Rule 4: Snakes */}
          <div className="flex gap-3 items-start p-3 rounded-xl bg-stone-950/60 border border-stone-800">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <ArrowDownRight size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-rose-300">Snakes (Slide Down)</h3>
              <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">
                Beware! Landing on a serpent&apos;s head causes you to get bitten and slide all the way down to the tail.
              </p>
            </div>
          </div>

          {/* Rule 5: Lucky Six & Exact Rolls */}
          <div className="flex gap-3 items-start p-3 rounded-xl bg-stone-950/60 border border-stone-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-300">Lucky Sixes & Exact Win</h3>
              <p className="text-stone-400 text-xs mt-0.5 leading-relaxed">
                Rolling a <strong>6</strong> awards an immediate free extra turn! To win, you must reach 100 with an exact roll (overshooting bounces back from 100).
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm transition-all"
          >
            Got it, Let&apos;s Play!
          </button>
        </div>
      </div>
    </div>
  );
};
