import React, { useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Eye, Sparkles, Crown, Flame } from 'lucide-react';
import { Player } from '../types/game';
import { Goti } from './Goti';
import { soundEffects } from '../utils/audio';

interface VictoryModalProps {
  winner: Player | null;
  isOpen: boolean;
  onRestart: () => void;
  onClose: () => void;
  turnsTotal: number;
  isDark?: boolean;
}

interface ParticleData {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  size: number;
  shape: 'circle' | 'star' | 'diamond' | 'sparkle' | 'ring';
  duration: number;
  delay: number;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  isOpen,
  onRestart,
  onClose,
  turnsTotal,
  isDark = true,
}) => {
  const [explosionKey, setExplosionKey] = useState<number>(0);

  // Generate 54 celebratory radial particles for the explosion
  const particles = useMemo<ParticleData[]>(() => {
    const palette = [
      '#fbbf24', // Amber/Gold
      '#f59e0b', // Deep Gold
      '#fef08a', // Bright Yellow
      '#ef4444', // Ruby Red
      '#10b981', // Emerald Green
      '#38bdf8', // Sky Blue
      '#ec4899', // Pink Gem
      '#ffffff', // Diamond White
    ];

    const shapes: ('circle' | 'star' | 'diamond' | 'sparkle' | 'ring')[] = [
      'circle',
      'star',
      'diamond',
      'sparkle',
      'ring',
    ];

    return Array.from({ length: 54 }, (_, i) => {
      // 360 degree radial dispersion with slight variance
      const angle = (i / 54) * Math.PI * 2 + (Math.random() * 0.2 - 0.1);
      // Distance between 90px and 280px
      const dist = 90 + Math.random() * 190;
      const x = Math.round(Math.cos(angle) * dist);
      const y = Math.round(Math.sin(angle) * dist);

      return {
        id: i,
        x,
        y,
        scale: 0.2 + Math.random() * 0.9,
        rotation: Math.round(Math.random() * 720 - 360),
        color: palette[i % palette.length],
        size: Math.round(8 + Math.random() * 12),
        shape: shapes[i % shapes.length],
        duration: 1.1 + Math.random() * 0.8,
        delay: Math.random() * 0.35,
      };
    });
  }, [explosionKey]);

  // Trigger celebration fireworks and audio
  const triggerCelebration = () => {
    soundEffects.playWinFanfare();
    setExplosionKey((prev) => prev + 1);

    // 1. Central Massive Star & Confetti Cannon
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.45 },
      colors: ['#fbbf24', '#f59e0b', '#ef4444', '#10b981', '#38bdf8', '#fef08a'],
      shapes: ['star', 'circle'],
      scalar: 1.2,
      ticks: 200,
    });

    // 2. Left and Right celebratory fountains
    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0.1, y: 0.65 },
        colors: ['#fbbf24', '#38bdf8', '#ffffff'],
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 0.9, y: 0.65 },
        colors: ['#ef4444', '#10b981', '#fbbf24'],
      });
    }, 400);

    // 3. Falling gold shower
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 120,
        origin: { y: 0.2 },
        colors: ['#fbbf24', '#fef08a', '#ffffff'],
        shapes: ['circle'],
        scalar: 0.9,
        gravity: 0.7,
      });
    }, 900);
  };

  useEffect(() => {
    if (isOpen && winner) {
      triggerCelebration();
    }
  }, [isOpen, winner]);

  if (!isOpen || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-hidden select-none">
      {/* 1. FULL-SCREEN CSS RADIAL EXPLOSION SHOCKWAVE LAYER */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0">
        {/* Pulsing golden shockwave rings */}
        <div
          key={`shockwave-1-${explosionKey}`}
          className="absolute w-72 h-72 rounded-full border-2 border-amber-400/60 shadow-[0_0_50px_rgba(251,191,36,0.6)] animate-shockwave"
        />
        <div
          key={`shockwave-2-${explosionKey}`}
          className="absolute w-72 h-72 rounded-full border border-yellow-300/40 shadow-[0_0_80px_rgba(253,224,71,0.4)] animate-shockwave"
          style={{ animationDelay: '0.4s' }}
        />

        {/* Ambient Victory Sunburst Rays */}
        <div className="absolute w-[600px] h-[600px] opacity-25 animate-sunburst pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-amber-400">
            {Array.from({ length: 16 }).map((_, i) => (
              <polygon
                key={i}
                points="50,50 48,0 52,0"
                transform={`rotate(${i * 22.5} 50 50)`}
              />
            ))}
          </svg>
        </div>

        {/* 54 Radial Explosive Particles bursting from center */}
        <div className="relative w-0 h-0" key={`particles-${explosionKey}`}>
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
              style={
                {
                  '--burst-x': `${p.x}px`,
                  '--burst-y': `${p.y}px`,
                  '--burst-s': p.scale,
                  '--burst-r': `${p.rotation}deg`,
                  animation: `particle-burst ${p.duration}s cubic-bezier(0.12, 0.82, 0.28, 1) ${p.delay}s forwards`,
                } as React.CSSProperties
              }
            >
              {p.shape === 'star' && (
                <span
                  style={{ color: p.color, fontSize: `${p.size + 4}px` }}
                  className="drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                >
                  ★
                </span>
              )}
              {p.shape === 'diamond' && (
                <span
                  style={{ color: p.color, fontSize: `${p.size + 2}px` }}
                  className="drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
                >
                  ✦
                </span>
              )}
              {p.shape === 'sparkle' && (
                <Sparkles
                  size={p.size + 4}
                  style={{ color: p.color }}
                  className="drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                />
              )}
              {p.shape === 'ring' && (
                <div
                  className="rounded-full border-2"
                  style={{
                    width: p.size,
                    height: p.size,
                    borderColor: p.color,
                    boxShadow: `0 0 10px ${p.color}`,
                  }}
                />
              )}
              {p.shape === 'circle' && (
                <div
                  className="rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    boxShadow: `0 0 12px ${p.color}`,
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN CELEBRATION MODAL CARD */}
      <div
        className={`max-w-md w-full rounded-3xl p-6 sm:p-8 shadow-2xl relative text-center border overflow-hidden transition-colors z-10 ${
          isDark
            ? 'bg-gradient-to-b from-stone-900/95 via-stone-950/95 to-black/95 border-amber-500/60 text-stone-100 shadow-amber-500/20'
            : 'bg-gradient-to-b from-amber-50/95 via-white/95 to-amber-100/95 border-amber-400 text-stone-900 shadow-amber-900/20'
        }`}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full blur-3xl opacity-50 pointer-events-none"
          style={{ backgroundColor: winner.color }}
        />

        {/* Floating Sparks around trophy */}
        <div className="absolute top-8 left-8 text-amber-400 animate-spark pointer-events-none">✨</div>
        <div
          className="absolute top-12 right-8 text-yellow-300 animate-spark pointer-events-none"
          style={{ animationDelay: '0.7s' }}
        >
          ✦
        </div>
        <div
          className="absolute top-24 left-14 text-amber-300 animate-spark pointer-events-none"
          style={{ animationDelay: '1.2s' }}
        >
          ★
        </div>

        {/* 3D WINNER PODIUM WITH SCULPTED GOTI & CROWN */}
        <div
          onClick={triggerCelebration}
          className="relative mx-auto w-24 h-24 flex items-center justify-center mb-3 cursor-pointer group"
          title="Click to re-fire celebration fireworks!"
        >
          {/* Circular Radiance */}
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-60 group-hover:opacity-90 transition-opacity"
            style={{ backgroundColor: winner.color }}
          />

          {/* Golden Trophy Pedestal Base */}
          <div className="absolute bottom-0 w-20 h-6 rounded-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-700 shadow-lg border border-amber-300/60" />

          {/* Floating Crown over Goti */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <Crown size={28} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]" />
          </div>

          {/* Winner's Actual 3D Goti Game Piece */}
          <div className="relative z-10 scale-125 -translate-y-2 group-hover:scale-135 transition-transform duration-200">
            <Goti player={winner} isActive={true} size={36} />
          </div>
        </div>

        {/* Banner Pill: Conquered Tile 100 */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-500/20 border border-amber-400/50 text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-2 shadow-inner">
          <Trophy size={14} className="text-amber-400" />
          <span>Champion of Tile 100</span>
        </div>

        {/* Victory Headline */}
        <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 drop-shadow">
          Victory!
        </h2>
        <p className="text-sm mt-1 opacity-85">
          <span
            className="font-bold text-base px-2 py-0.5 rounded shadow-sm"
            style={{
              color: winner.color,
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            }}
          >
            {winner.name}
          </span>{' '}
          has conquered the board!
        </p>

        {/* Match Statistics Summary */}
        <div
          className={`grid grid-cols-3 gap-2.5 my-5 p-3.5 rounded-2xl border transition-colors ${
            isDark ? 'bg-stone-900/90 border-stone-800' : 'bg-amber-100/60 border-amber-200'
          }`}
        >
          <div className="flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Total Turns</span>
            <span className="text-lg font-bold font-mono text-amber-400 mt-0.5">{turnsTotal}</span>
          </div>

          <div
            className={`flex flex-col items-center border-x px-1 ${
              isDark ? 'border-stone-800' : 'border-amber-200'
            }`}
          >
            <span className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Ladders</span>
            <span className="text-lg font-bold font-mono text-sky-400 mt-0.5">
              🪜 {winner.laddersClimbed}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] uppercase tracking-wider opacity-70 font-semibold">Snakes</span>
            <span className="text-lg font-bold font-mono text-rose-400 mt-0.5">
              🐍 {winner.snakesBitten}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={onRestart}
              className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
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

          {/* Quick Celebration Re-Trigger */}
          <button
            onClick={triggerCelebration}
            className={`w-full py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              isDark
                ? 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'
                : 'text-amber-700 hover:text-amber-800 hover:bg-amber-500/15'
            }`}
          >
            <Sparkles size={13} />
            <span>Celebrate Again! (Re-fire Fireworks)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
