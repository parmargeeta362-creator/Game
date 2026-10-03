import React, { useState } from 'react';
import { Player, Snake, Ladder } from '../types/game';
import {
  getTileCoordinates,
  getTileCenterPercent,
  generateSnakePath,
  generateLadderGeometry,
} from '../utils/boardConstants';
import { Goti } from './Goti';

interface BoardProps {
  players: Player[];
  snakes: Snake[];
  ladders: Ladder[];
  activePlayerId: string;
  isMoving: boolean;
  highlightTile?: number | null;
  onTileClick?: (tile: number) => void;
  isDark?: boolean;
}

export const Board: React.FC<BoardProps> = ({
  players,
  snakes,
  ladders,
  activePlayerId,
  isMoving,
  highlightTile = null,
  onTileClick,
  isDark = true,
}) => {
  const [hoveredElement, setHoveredElement] = useState<{
    type: 'snake' | 'ladder';
    from: number;
    to: number;
  } | null>(null);

  // Group players by position to calculate offsets when multiple share a tile
  const playersByPosition: { [tile: number]: Player[] } = {};
  players.forEach((p) => {
    if (!playersByPosition[p.position]) {
      playersByPosition[p.position] = [];
    }
    playersByPosition[p.position].push(p);
  });

  // Calculate pawn offset (in % of board)
  const getPawnOffset = (player: Player): { dx: number; dy: number } => {
    const list = playersByPosition[player.position] || [];
    const index = list.findIndex((p) => p.id === player.id);
    const count = list.length;

    if (count <= 1) return { dx: 0, dy: 0 };
    if (count === 2) {
      return index === 0 ? { dx: -2.0, dy: 0 } : { dx: 2.0, dy: 0 };
    }
    if (count === 3) {
      if (index === 0) return { dx: 0, dy: -2.0 };
      if (index === 1) return { dx: -2.0, dy: 1.8 };
      return { dx: 2.0, dy: 1.8 };
    }
    // 4 players
    const offsets = [
      { dx: -2.0, dy: -2.0 },
      { dx: 2.0, dy: -2.0 },
      { dx: -2.0, dy: 2.0 },
      { dx: 2.0, dy: 2.0 },
    ];
    return offsets[index % 4];
  };

  const tiles = Array.from({ length: 100 }, (_, i) => i + 1);

  const snakeHeads = new Map(snakes.map((s) => [s.head, s.tail]));
  const ladderBottoms = new Map(ladders.map((l) => [l.bottom, l.top]));

  return (
    <div className="relative w-full max-w-[620px] aspect-square mx-auto select-none">
      {/* Outer Luxury Mahogany Wooden Frame with Brass Accents */}
      <div
        className={`w-full h-full p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-2xl transition-colors duration-300 relative ${
          isDark
            ? 'bg-gradient-to-br from-amber-950 via-stone-900 to-stone-950 border-2 border-amber-600/40 shadow-black/80'
            : 'bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 border-2 border-amber-500/50 shadow-amber-950/40'
        }`}
        style={{
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.75), inset 0 2px 4px rgba(245, 158, 11, 0.2)'
            : '0 20px 45px -10px rgba(120, 53, 15, 0.5), inset 0 2px 4px rgba(254, 243, 199, 0.3)',
        }}
      >
        {/* Brass Corner Inlays */}
        <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-amber-400/80 rounded-tl-sm pointer-events-none" />
        <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-amber-400/80 rounded-tr-sm pointer-events-none" />
        <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-amber-400/80 rounded-bl-sm pointer-events-none" />
        <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-amber-400/80 rounded-br-sm pointer-events-none" />

        {/* Board Playing Surface */}
        <div
          className={`relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden grid grid-cols-10 grid-rows-10 border transition-colors duration-300 ${
            isDark
              ? 'border-amber-600/30 bg-stone-950 shadow-inner'
              : 'border-amber-700/30 bg-amber-50 shadow-inner'
          }`}
        >
          {/* 100 Board Cells */}
          {tiles.map((num) => {
            const { x, y } = getTileCoordinates(num);
            const isAlternate = (Math.floor((num - 1) / 10) + ((num - 1) % 10)) % 2 === 0;

            const isStart = num === 1;
            const isFinish = num === 100;
            const isSnakeHead = snakeHeads.has(num);
            const isLadderBottom = ladderBottoms.has(num);
            const isHighlighted = highlightTile === num;

            const isElementHovered =
              hoveredElement &&
              (hoveredElement.from === num || hoveredElement.to === num);

            // High aesthetic dual-tone tile textures
            let cellStyle = '';
            if (isStart) {
              cellStyle = isDark
                ? 'bg-gradient-to-br from-emerald-950/90 to-emerald-900/90 text-emerald-200 border-emerald-600/40'
                : 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-950 border-emerald-400/50';
            } else if (isFinish) {
              cellStyle = isDark
                ? 'bg-gradient-to-br from-amber-700/80 via-yellow-600/70 to-amber-900/90 text-amber-100 border-amber-400/60 shadow-inner'
                : 'bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-300 text-amber-950 border-amber-400 shadow-inner';
            } else if (isDark) {
              cellStyle = isAlternate
                ? 'bg-stone-900/90 text-stone-200 border-stone-800/80'
                : 'bg-stone-950/90 text-stone-300 border-stone-800/60';
            } else {
              cellStyle = isAlternate
                ? 'bg-amber-100/95 text-stone-800 border-amber-200/80'
                : 'bg-[#fffbf0] text-stone-700 border-amber-200/50';
            }

            return (
              <div
                key={num}
                onClick={() => onTileClick?.(num)}
                style={{
                  gridColumnStart: x + 1,
                  gridRowStart: y + 1,
                }}
                className={`relative flex flex-col justify-between p-1 transition-all duration-200 border ${cellStyle} ${
                  isHighlighted ? 'ring-4 ring-amber-400 ring-inset z-10' : ''
                } ${isElementHovered ? 'brightness-125 ring-2 ring-amber-300 ring-inset' : ''}`}
              >
                {/* Tile Header: Number & Indicators */}
                <div className="flex items-center justify-between leading-none w-full">
                  <span
                    className={`font-mono text-[10px] sm:text-xs font-bold tabular-nums tracking-tighter ${
                      isStart || isFinish ? 'scale-105' : 'opacity-85'
                    }`}
                  >
                    {num}
                  </span>

                  {/* Corner icon badges */}
                  {isStart && (
                    <span className="text-[8px] sm:text-[9px] uppercase font-extrabold tracking-wider text-emerald-400 drop-shadow">
                      START
                    </span>
                  )}
                  {isFinish && (
                    <span className="text-xs sm:text-sm drop-shadow" title="Goal Tile 100!">
                      👑
                    </span>
                  )}
                  {isSnakeHead && (
                    <span className="text-[10px] sm:text-xs text-rose-500 animate-pulse" title="Snake Head">
                      🐍
                    </span>
                  )}
                  {isLadderBottom && (
                    <span className="text-[10px] sm:text-xs text-sky-400" title="Ladder Base">
                      🪜
                    </span>
                  )}
                </div>

                {/* Bottom destination marker for snake/ladder */}
                <div className="flex justify-between items-end text-[8px] sm:text-[9px] font-mono font-bold leading-none">
                  {isSnakeHead && (
                    <span className="text-rose-500/90 ml-auto">
                      ↓{snakeHeads.get(num)}
                    </span>
                  )}
                  {isLadderBottom && (
                    <span className="text-sky-400/90 ml-auto">
                      ↑{ladderBottoms.get(num)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* SVG Overlay for High-Fidelity Snakes and Ladders */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-auto z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Drop shadow filter */}
              <filter id="board-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0.5" dy="1.0" stdDeviation="0.8" floodOpacity="0.45" />
              </filter>

              {/* Ladder wood gradient */}
              <linearGradient id="ladder-wood-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="35%" stopColor="#d97706" />
                <stop offset="70%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>

              {/* Ladder highlight rail gradient */}
              <linearGradient id="ladder-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              {/* Crimson Snake Gradient */}
              <linearGradient id="snake-ruby-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="40%" stopColor="#dc2626" />
                <stop offset="80%" stopColor="#991b1b" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </linearGradient>

              {/* Emerald/Jade Snake Gradient */}
              <linearGradient id="snake-emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#059669" />
                <stop offset="100%" stopColor="#064e3b" />
              </linearGradient>
            </defs>

            {/* 1. LADDERS */}
            {ladders.map((ladder, index) => {
              const geo = generateLadderGeometry(ladder.bottom, ladder.top, 3.4);
              const isHovered =
                hoveredElement?.type === 'ladder' && hoveredElement.from === ladder.bottom;

              return (
                <g
                  key={ladder.id}
                  filter="url(#board-shadow)"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() =>
                    setHoveredElement({
                      type: 'ladder',
                      from: ladder.bottom,
                      to: ladder.top,
                    })
                  }
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  {/* Invisible wide targeting stroke */}
                  <line
                    x1={geo.bottomX}
                    y1={geo.bottomY}
                    x2={geo.topX}
                    y2={geo.topY}
                    stroke="transparent"
                    strokeWidth="8"
                  />

                  {/* Left Rail */}
                  <line
                    x1={geo.leftRail.x1}
                    y1={geo.leftRail.y1}
                    x2={geo.leftRail.x2}
                    y2={geo.leftRail.y2}
                    stroke={isHovered ? '#38bdf8' : 'url(#ladder-wood-gradient)'}
                    strokeWidth={isHovered ? '1.5' : '1.1'}
                    strokeLinecap="round"
                  />
                  {/* Left Rail Highlight Glint */}
                  <line
                    x1={geo.leftRail.x1}
                    y1={geo.leftRail.y1}
                    x2={geo.leftRail.x2}
                    y2={geo.leftRail.y2}
                    stroke="#fef08a"
                    strokeWidth="0.3"
                    opacity={isHovered ? '0.8' : '0.4'}
                    strokeLinecap="round"
                  />

                  {/* Right Rail */}
                  <line
                    x1={geo.rightRail.x1}
                    y1={geo.rightRail.y1}
                    x2={geo.rightRail.x2}
                    y2={geo.rightRail.y2}
                    stroke={isHovered ? '#38bdf8' : 'url(#ladder-wood-gradient)'}
                    strokeWidth={isHovered ? '1.5' : '1.1'}
                    strokeLinecap="round"
                  />
                  {/* Right Rail Highlight Glint */}
                  <line
                    x1={geo.rightRail.x1}
                    y1={geo.rightRail.y1}
                    x2={geo.rightRail.x2}
                    y2={geo.rightRail.y2}
                    stroke="#fef08a"
                    strokeWidth="0.3"
                    opacity={isHovered ? '0.8' : '0.4'}
                    strokeLinecap="round"
                  />

                  {/* Rungs with metallic brackets */}
                  {geo.rungs.map((rung, rIdx) => (
                    <g key={rIdx}>
                      {/* Rung Shadow */}
                      <line
                        x1={rung.x1}
                        y1={rung.y1 + 0.3}
                        x2={rung.x2}
                        y2={rung.y2 + 0.3}
                        stroke="#451a03"
                        strokeWidth="0.8"
                        strokeLinecap="round"
                        opacity="0.5"
                      />
                      {/* Rung Main Body */}
                      <line
                        x1={rung.x1}
                        y1={rung.y1}
                        x2={rung.x2}
                        y2={rung.y2}
                        stroke={isHovered ? '#bae6fd' : '#f59e0b'}
                        strokeWidth="0.9"
                        strokeLinecap="round"
                      />
                      {/* Brass rivet dots on left and right */}
                      <circle cx={rung.x1} cy={rung.y1} r="0.4" fill="#fbbf24" />
                      <circle cx={rung.x2} cy={rung.y2} r="0.4" fill="#fbbf24" />
                    </g>
                  ))}

                  {/* Top destination indicator halo */}
                  {isHovered && (
                    <circle
                      cx={geo.topX}
                      cy={geo.topY}
                      r="2.2"
                      fill="#0284c7"
                      stroke="#ffffff"
                      strokeWidth="0.6"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}

            {/* 2. SNAKES */}
            {snakes.map((snake, sIdx) => {
              const data = generateSnakePath(snake.head, snake.tail);
              const isHovered =
                hoveredElement?.type === 'snake' && hoveredElement.from === snake.head;
              const isEmerald = sIdx % 2 === 1;
              const mainGradient = isEmerald
                ? 'url(#snake-emerald-gradient)'
                : 'url(#snake-ruby-gradient)';

              return (
                <g
                  key={snake.id}
                  filter="url(#board-shadow)"
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() =>
                    setHoveredElement({
                      type: 'snake',
                      from: snake.head,
                      to: snake.tail,
                    })
                  }
                  onMouseLeave={() => setHoveredElement(null)}
                >
                  {/* Invisible wide hover stroke */}
                  <path
                    d={data.path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="9"
                  />

                  {/* Ambient Glow on hover */}
                  {isHovered && (
                    <path
                      d={data.path}
                      fill="none"
                      stroke={isEmerald ? '#6ee7b7' : '#fca5a5'}
                      strokeWidth="4.2"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                  )}

                  {/* Snake Outer Silhouette */}
                  <path
                    d={data.path}
                    fill="none"
                    stroke={isHovered ? (isEmerald ? '#10b981' : '#ef4444') : mainGradient}
                    strokeWidth={isHovered ? '2.8' : '2.4'}
                    strokeLinecap="round"
                  />

                  {/* Snake Underbelly / Pattern Ridge */}
                  <path
                    d={data.path}
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="0.65"
                    strokeDasharray="0.8 1.4"
                    opacity="0.85"
                  />

                  {/* Snake Serpent Head */}
                  <g
                    transform={`translate(${data.headX}, ${data.headY}) rotate(${data.angleDeg + 90})`}
                  >
                    {/* Forked tongue */}
                    <path
                      d="M 0,-2.4 L 0,-4.5 M 0,-4.5 L -0.7,-5.6 M 0,-4.5 L 0.7,-5.6"
                      stroke="#ef4444"
                      strokeWidth="0.4"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {/* Flared Head Hood */}
                    <ellipse
                      cx="0"
                      cy="0"
                      rx="2.1"
                      ry="2.6"
                      fill={isEmerald ? '#047857' : '#b91c1c'}
                      stroke="#fef08a"
                      strokeWidth="0.35"
                    />

                    {/* Left & Right Glowing Eyes */}
                    <circle cx="-0.9" cy="-0.6" r="0.5" fill="#fef08a" />
                    <circle cx="-0.9" cy="-0.6" r="0.22" fill="#000000" />
                    <circle cx="0.9" cy="-0.6" r="0.5" fill="#fef08a" />
                    <circle cx="0.9" cy="-0.6" r="0.22" fill="#000000" />
                  </g>

                  {/* Snake Tail Rattle */}
                  <circle
                    cx={data.tailX}
                    cy={data.tailY}
                    r="0.9"
                    fill="#451a03"
                    stroke="#fef08a"
                    strokeWidth="0.3"
                  />
                </g>
              );
            })}
          </svg>

          {/* 3. LUXURY 3D GAME GOTIS (Traditional Sculpted Game Pieces) */}
          {players.map((player) => {
            const center = getTileCenterPercent(player.position);
            const offset = getPawnOffset(player);
            const isActive = player.id === activePlayerId;

            const posX = center.cx + offset.dx;
            const posY = center.cy + offset.dy;

            return (
              <div
                key={player.id}
                className={`absolute -translate-x-1/2 -translate-y-[75%] pointer-events-none transition-all duration-300 ease-out z-20 ${
                  isActive ? 'z-30 scale-110' : ''
                }`}
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                }}
              >
                <Goti player={player} isActive={isActive} size={28} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Tooltip info on hover */}
      {hoveredElement && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-stone-900/95 text-stone-100 text-xs px-4 py-1.5 rounded-full border border-amber-500/50 shadow-2xl backdrop-blur-md z-40 flex items-center gap-2 whitespace-nowrap animate-fade-in">
          {hoveredElement.type === 'ladder' ? (
            <>
              <span className="text-sky-400 font-bold">🪜 Ladder</span>
              <span>Climbs from Tile {hoveredElement.from} ➔ {hoveredElement.to}</span>
            </>
          ) : (
            <>
              <span className="text-rose-400 font-bold">🐍 Snake</span>
              <span>Bites at Tile {hoveredElement.from} ➔ Slides down to {hoveredElement.to}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
