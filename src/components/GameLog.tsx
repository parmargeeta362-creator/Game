import React, { useState, useRef, useEffect } from 'react';
import { GameLogEntry } from '../types/game';

interface GameLogProps {
  logs: GameLogEntry[];
  onClear?: () => void;
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  const [filter, setFilter] = useState<'all' | 'events' | 'rolls'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top or bottom? Let's show newest at the top or auto-scroll to bottom.
  // Showing newest at top makes it instantly readable without having to scroll!
  const filteredLogs = logs.filter((log) => {
    if (filter === 'events') return log.eventType === 'ladder' || log.eventType === 'snake' || log.eventType === 'win';
    if (filter === 'rolls') return log.eventType === 'roll' || log.eventType === 'extra_turn';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-stone-900/80 rounded-xl border border-stone-800 overflow-hidden">
      {/* Log Header with Filter Tabs */}
      <div className="flex items-center justify-between p-3 border-b border-stone-800 bg-stone-900">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
            Game Action Log
          </span>
          <span className="text-[11px] font-mono text-stone-500 tabular-nums">
            ({logs.length})
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-stone-950 rounded-lg text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filter === 'all'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('events')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filter === 'events'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Climbs & Bites
          </button>
          <button
            onClick={() => setFilter('rolls')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filter === 'rolls'
                ? 'bg-stone-800 text-stone-100 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Rolls
          </button>
        </div>
      </div>

      {/* Log Entries Container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 max-h-[260px] min-h-[160px]"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-stone-500 text-xs italic text-center py-6">
            No events yet. Roll the dice to start the race!
          </div>
        ) : (
          filteredLogs.map((log) => {
            let icon = '🎲';
            let badgeBg = 'bg-stone-800/80 text-stone-300 border-stone-700/60';

            if (log.eventType === 'ladder') {
              icon = '🪜';
              badgeBg = 'bg-sky-950/60 text-sky-300 border-sky-800/50';
            } else if (log.eventType === 'snake') {
              icon = '🐍';
              badgeBg = 'bg-rose-950/60 text-rose-300 border-rose-800/50';
            } else if (log.eventType === 'win') {
              icon = '🏆';
              badgeBg = 'bg-amber-950/60 text-amber-300 border-amber-800/50';
            } else if (log.eventType === 'bounce') {
              icon = '↩️';
              badgeBg = 'bg-purple-950/60 text-purple-300 border-purple-800/50';
            } else if (log.eventType === 'extra_turn') {
              icon = '✨';
              badgeBg = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50';
            }

            return (
              <div
                key={log.id}
                className={`p-2 rounded-lg border text-xs flex items-start gap-2.5 transition-all ${badgeBg}`}
              >
                <span className="text-sm shrink-0 leading-none pt-0.5">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span
                      className="font-bold truncate"
                      style={{ color: log.playerColor }}
                    >
                      {log.playerName}
                    </span>
                    <span className="text-stone-400 font-mono text-[10px]">
                      Turn #{log.turnNumber}
                    </span>
                  </div>
                  <div className="text-stone-300 mt-0.5 leading-snug">
                    {log.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
