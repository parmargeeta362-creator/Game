import React from 'react';
import { Player } from '../types/game';

interface PlayerRosterProps {
  players: Player[];
  activePlayerId: string;
  isMoving: boolean;
}

export const PlayerRoster: React.FC<PlayerRosterProps> = ({
  players,
  activePlayerId,
  isMoving,
}) => {
  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-stone-400">
        <span>Players & Standings</span>
        <span className="font-mono text-stone-500 tabular-nums">Goal: 100</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
        {players.map((player, index) => {
          const isActive = player.id === activePlayerId;
          const progressPercent = Math.min(100, Math.max(1, player.position));
          const distanceToWin = 100 - player.position;

          return (
            <div
              key={player.id}
              className={`p-3 rounded-xl border transition-all duration-200 relative overflow-hidden ${
                isActive
                  ? 'bg-stone-800/90 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                  : 'bg-stone-900/60 border-stone-800 hover:border-stone-700/80 text-stone-300'
              }`}
            >
              {/* Active Player Indicator Bar on left */}
              {isActive && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: player.color }}
                />
              )}

              {/* Player Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Pawn Color Dot */}
                  <div
                    className="w-4 h-4 rounded-full border border-white/60 shadow-sm shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: player.pawnColor }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                  </div>

                  {/* Player Name */}
                  <span className="font-bold text-stone-100 text-sm truncate font-display">
                    {player.name}
                  </span>

                  {/* Player Type (Bot or Human) */}
                  <span className="text-[11px] text-stone-400 shrink-0">
                    {player.type === 'bot' ? '🤖 Bot' : '👤 Human'}
                  </span>
                </div>

                {/* Current Tile Badge */}
                <div className="flex items-baseline gap-1 shrink-0 font-mono">
                  <span className="text-xs text-stone-400">Tile</span>
                  <span
                    className="text-base font-bold tabular-nums"
                    style={{ color: player.color }}
                  >
                    {player.position}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-stone-950/80 rounded-full h-2 overflow-hidden mb-2 border border-stone-800">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor: player.color,
                  }}
                />
              </div>

              {/* Stats & Distance */}
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                <div className="flex items-center gap-2">
                  <span title="Ladders climbed">🪜 {player.laddersClimbed}</span>
                  <span aria-hidden="true" className="text-stone-600">·</span>
                  <span title="Snakes encountered">🐍 {player.snakesBitten}</span>
                </div>

                <div>
                  {distanceToWin === 0 ? (
                    <span className="text-amber-400 font-bold">Winner! 🏆</span>
                  ) : (
                    <span>{distanceToWin} to win</span>
                  )}
                </div>
              </div>

              {/* Active Turn Banner */}
              {isActive && (
                <div className="mt-2 pt-2 border-t border-stone-700/50 flex items-center justify-between text-xs">
                  <span className="text-amber-300 font-medium flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    {isMoving ? 'Moving on board...' : player.type === 'bot' ? 'Bot is thinking...' : 'Your turn to roll!'}
                  </span>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">
                    Turn
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
