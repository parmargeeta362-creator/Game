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
      return index === 0 ? { dx: -1.8, dy: 0 } : { dx: 1.8, dy: 0 };
    }
    if (count === 3) {
      if (index === 0) return { dx: 0, dy: -1.5 };
      if (index === 1) return { dx: -1.6, dy: 1.3 };
      return { dx: 1.6, dy: 1.3 };
    }
    // 4 players
    const offsets = [
      { dx: -1.5, dy: -1.5 },
      { dx: 1.5, dy: -1.5 },
      { dx: -1.5, dy: 1.5 },
      { dx: 1.5, dy: 1.5 },
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
              {/* Ultra-realistic Board Element Drop Shadow */}
              <filter id="board-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0.6" dy="1.2" stdDeviation="0.9" floodColor="#000000" floodOpacity="0.65" />
              </filter>

              {/* Ladder Soft Ambient Contact Shadow */}
              <filter id="ladder-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0.8" dy="1.4" stdDeviation="1.0" floodColor="#1c1917" floodOpacity="0.75" />
              </filter>

              {/* 1. REALISTIC LADDER GRADIENTS */}
              {/* Solid Polished Hardwood Rails (Mahogany / Teak) */}
              <linearGradient id="ladder-wood-rail" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="15%" stopColor="#d97706" />
                <stop offset="45%" stopColor="#92400e" />
                <stop offset="80%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>

              {/* 3D Cylindrical Wooden Rung */}
              <linearGradient id="ladder-wood-rung" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="65%" stopColor="#b45309" />
                <stop offset="90%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#291203" />
              </linearGradient>

              {/* Brass Joint Hardware & Rivets */}
              <linearGradient id="ladder-brass-hardware" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="35%" stopColor="#eab308" />
                <stop offset="70%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#713f12" />
              </linearGradient>

              {/* 2. REALISTIC SNAKE SPECIES GRADIENTS */}
              {/* Species A: Emerald Amazon Python (Vibrant Jade & Forest Green) */}
              <linearGradient id="snake-emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6ee7b7" />
                <stop offset="20%" stopColor="#10b981" />
                <stop offset="55%" stopColor="#047857" />
                <stop offset="85%" stopColor="#064e3b" />
                <stop offset="100%" stopColor="#022c22" />
              </linearGradient>

              {/* Species B: Crimson Coral Viper (Fiery Ruby & Mahogany) */}
              <linearGradient id="snake-ruby-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fca5a5" />
                <stop offset="25%" stopColor="#ef4444" />
                <stop offset="60%" stopColor="#b91c1c" />
                <stop offset="85%" stopColor="#7f1d1d" />
                <stop offset="100%" stopColor="#450a0a" />
              </linearGradient>

              {/* Species C: Golden Desert Pit Viper (Amber & Bronze) */}
              <linearGradient id="snake-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="25%" stopColor="#f59e0b" />
                <stop offset="60%" stopColor="#b45309" />
                <stop offset="85%" stopColor="#78350f" />
                <stop offset="100%" stopColor="#451a03" />
              </linearGradient>

              {/* Species D: Blue Mountain Viper (Cobalt & Indigo) */}
              <linearGradient id="snake-blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="25%" stopColor="#0284c7" />
                <stop offset="60%" stopColor="#1d4ed8" />
                <stop offset="85%" stopColor="#1e3a8a" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>

              {/* Snake Underbelly Scales */}
              <linearGradient id="snake-belly-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fefce8" />
                <stop offset="50%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>

              {/* Piercing Reptile Eye Iris */}
              <radialGradient id="snake-eye-iris" cx="40%" cy="40%" r="65%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="45%" stopColor="#f59e0b" />
                <stop offset="85%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#7f1d1d" />
              </radialGradient>
            </defs>

            {/* 1. REALISTIC 3D LADDERS */}
            {ladders.map((ladder) => {
              const geo = generateLadderGeometry(ladder.bottom, ladder.top, 3.4);
              const isHovered =
                hoveredElement?.type === 'ladder' && hoveredElement.from === ladder.bottom;

              return (
                <g
                  key={ladder.id}
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

                  {/* 1A. REALISTIC CAST SHADOW ON BOARD */}
                  <g opacity={isDark ? '0.7' : '0.45'}>
                    {/* Shadow for Left Rail */}
                    <line
                      x1={geo.leftRail.x1 + 0.7}
                      y1={geo.leftRail.y1 + 1.2}
                      x2={geo.leftRail.x2 + 0.7}
                      y2={geo.leftRail.y2 + 1.2}
                      stroke="#1c1917"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    {/* Shadow for Right Rail */}
                    <line
                      x1={geo.rightRail.x1 + 0.7}
                      y1={geo.rightRail.y1 + 1.2}
                      x2={geo.rightRail.x2 + 0.7}
                      y2={geo.rightRail.y2 + 1.2}
                      stroke="#1c1917"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    {/* Shadows for Rungs */}
                    {geo.rungs.map((rung, rIdx) => (
                      <line
                        key={`s-${rIdx}`}
                        x1={rung.x1 + 0.7}
                        y1={rung.y1 + 1.2}
                        x2={rung.x2 + 0.7}
                        y2={rung.y2 + 1.2}
                        stroke="#1c1917"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    ))}
                  </g>

                  {/* 1B. 3D CYLINDRICAL RUNGS WITH BRASS MOUNTING BRACKETS */}
                  {geo.rungs.map((rung, rIdx) => (
                    <g key={rIdx}>
                      {/* Rung Underside Contact Shadow */}
                      <line
                        x1={rung.x1}
                        y1={rung.y1 + 0.3}
                        x2={rung.x2}
                        y2={rung.y2 + 0.3}
                        stroke="#291203"
                        strokeWidth="1.1"
                        strokeLinecap="round"
                        opacity="0.8"
                      />

                      {/* Cylindrical Wooden Rung Body */}
                      <line
                        x1={rung.x1}
                        y1={rung.y1}
                        x2={rung.x2}
                        y2={rung.y2}
                        stroke={isHovered ? '#bae6fd' : 'url(#ladder-wood-rung)'}
                        strokeWidth={isHovered ? '1.4' : '1.15'}
                        strokeLinecap="round"
                      />

                      {/* Rung Top Surface Glint Highlight */}
                      <line
                        x1={rung.x1}
                        y1={rung.y1 - 0.25}
                        x2={rung.x2}
                        y2={rung.y2 - 0.25}
                        stroke="#fef9c3"
                        strokeWidth="0.35"
                        strokeLinecap="round"
                        opacity={isHovered ? '0.9' : '0.6'}
                      />

                      {/* Heavy Brass Reinforcement Brackets & Rivets on Left & Right */}
                      <circle
                        cx={rung.x1}
                        cy={rung.y1}
                        r="0.75"
                        fill="url(#ladder-brass-hardware)"
                        stroke="#451a03"
                        strokeWidth="0.2"
                      />
                      <circle cx={rung.x1 - 0.15} cy={rung.y1 - 0.15} r="0.2" fill="#ffffff" opacity="0.8" />

                      <circle
                        cx={rung.x2}
                        cy={rung.y2}
                        r="0.75"
                        fill="url(#ladder-brass-hardware)"
                        stroke="#451a03"
                        strokeWidth="0.2"
                      />
                      <circle cx={rung.x2 - 0.15} cy={rung.y2 - 0.15} r="0.2" fill="#ffffff" opacity="0.8" />
                    </g>
                  ))}

                  {/* 1C. SOLID HARDWOOD BEVELED RAILS */}
                  {/* Left Rail Underside Shadow */}
                  <line
                    x1={geo.leftRail.x1}
                    y1={geo.leftRail.y1 + 0.25}
                    x2={geo.leftRail.x2}
                    y2={geo.leftRail.y2 + 0.25}
                    stroke="#271003"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  {/* Left Rail Hardwood Main Beam */}
                  <line
                    x1={geo.leftRail.x1}
                    y1={geo.leftRail.y1}
                    x2={geo.leftRail.x2}
                    y2={geo.leftRail.y2}
                    stroke={isHovered ? '#38bdf8' : 'url(#ladder-wood-rail)'}
                    strokeWidth={isHovered ? '1.7' : '1.35'}
                    strokeLinecap="round"
                  />
                  {/* Left Rail Bevel Top Highlight */}
                  <line
                    x1={geo.leftRail.x1}
                    y1={geo.leftRail.y1 - 0.3}
                    x2={geo.leftRail.x2}
                    y2={geo.leftRail.y2 - 0.3}
                    stroke="#fef3c7"
                    strokeWidth="0.35"
                    opacity={isHovered ? '0.9' : '0.6'}
                    strokeLinecap="round"
                  />

                  {/* Right Rail Underside Shadow */}
                  <line
                    x1={geo.rightRail.x1}
                    y1={geo.rightRail.y1 + 0.25}
                    x2={geo.rightRail.x2}
                    y2={geo.rightRail.y2 + 0.25}
                    stroke="#271003"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  {/* Right Rail Hardwood Main Beam */}
                  <line
                    x1={geo.rightRail.x1}
                    y1={geo.rightRail.y1}
                    x2={geo.rightRail.x2}
                    y2={geo.rightRail.y2}
                    stroke={isHovered ? '#38bdf8' : 'url(#ladder-wood-rail)'}
                    strokeWidth={isHovered ? '1.7' : '1.35'}
                    strokeLinecap="round"
                  />
                  {/* Right Rail Bevel Top Highlight */}
                  <line
                    x1={geo.rightRail.x1}
                    y1={geo.rightRail.y1 - 0.3}
                    x2={geo.rightRail.x2}
                    y2={geo.rightRail.y2 - 0.3}
                    stroke="#fef3c7"
                    strokeWidth="0.35"
                    opacity={isHovered ? '0.9' : '0.6'}
                    strokeLinecap="round"
                  />

                  {/* 1D. BOTTOM FOOT PADS & TOP SAFETY CAPS */}
                  {/* Bottom rubber/brass grounded foot pads */}
                  <ellipse
                    cx={geo.leftRail.x1}
                    cy={geo.leftRail.y1}
                    rx="0.9"
                    ry="0.6"
                    fill="#1c1917"
                    stroke="#ca8a04"
                    strokeWidth="0.25"
                  />
                  <ellipse
                    cx={geo.rightRail.x1}
                    cy={geo.rightRail.y1}
                    rx="0.9"
                    ry="0.6"
                    fill="#1c1917"
                    stroke="#ca8a04"
                    strokeWidth="0.25"
                  />

                  {/* Top rounded brass hooks/caps */}
                  <circle
                    cx={geo.leftRail.x2}
                    cy={geo.leftRail.y2}
                    r="0.95"
                    fill="url(#ladder-brass-hardware)"
                    stroke="#451a03"
                    strokeWidth="0.3"
                  />
                  <circle cx={geo.leftRail.x2 - 0.2} cy={geo.leftRail.y2 - 0.2} r="0.25" fill="#ffffff" opacity="0.8" />

                  <circle
                    cx={geo.rightRail.x2}
                    cy={geo.rightRail.y2}
                    r="0.95"
                    fill="url(#ladder-brass-hardware)"
                    stroke="#451a03"
                    strokeWidth="0.3"
                  />
                  <circle cx={geo.rightRail.x2 - 0.2} cy={geo.rightRail.y2 - 0.2} r="0.25" fill="#ffffff" opacity="0.8" />

                  {/* Destination Halo on Hover */}
                  {isHovered && (
                    <circle
                      cx={geo.topX}
                      cy={geo.topY}
                      r="2.6"
                      fill="#0284c7"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}

            {/* 2. REALISTIC 3D ANATOMICAL SNAKES */}
            {snakes.map((snake, sIdx) => {
              const data = generateSnakePath(snake.head, snake.tail);
              const isHovered =
                hoveredElement?.type === 'snake' && hoveredElement.from === snake.head;

              // Distinct realistic serpent species gradients
              const speciesGradients = [
                'url(#snake-emerald-gradient)', // Emerald Python
                'url(#snake-ruby-gradient)',    // Crimson Coral Viper
                'url(#snake-gold-gradient)',    // Golden Pit Viper
                'url(#snake-blue-gradient)',    // Cobalt Tree Viper
              ];
              const mainGradient = speciesGradients[sIdx % speciesGradients.length];

              return (
                <g
                  key={snake.id}
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
                  {/* Invisible wide targeting stroke */}
                  <path
                    d={data.path}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="9"
                  />

                  {/* 2A. REALISTIC 3D CAST SHADOW ON BOARD TILES */}
                  <path
                    d={data.path}
                    fill="none"
                    stroke="#1c1917"
                    strokeWidth="3.6"
                    strokeLinecap="round"
                    opacity={isDark ? '0.65' : '0.4'}
                    transform="translate(0.8, 1.3)"
                  />
                  <path
                    d={data.path}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    opacity={isDark ? '0.4' : '0.25'}
                    transform="translate(0.4, 0.6)"
                  />

                  {/* Hover Aura */}
                  {isHovered && (
                    <path
                      d={data.path}
                      fill="none"
                      stroke="#fde047"
                      strokeWidth="4.6"
                      strokeLinecap="round"
                      opacity="0.75"
                    />
                  )}

                  {/* 2B. ANATOMICAL SERPENT BODY (Cylindrical Volume) */}
                  {/* Primary Muscular Scale Body */}
                  <path
                    d={data.path}
                    fill="none"
                    stroke={mainGradient}
                    strokeWidth={isHovered ? '3.4' : '2.9'}
                    strokeLinecap="round"
                  />

                  {/* Underbelly Segmented Scales */}
                  <path
                    d={data.path}
                    fill="none"
                    stroke="url(#snake-belly-gradient)"
                    strokeWidth="1.25"
                    strokeDasharray="0.8 1.4"
                    strokeLinecap="round"
                    opacity="0.9"
                  />

                  {/* Dorsal Spine Diamond Pattern */}
                  <path
                    d={data.path}
                    fill="none"
                    stroke="#18181b"
                    strokeWidth="0.8"
                    strokeDasharray="1.2 1.8"
                    strokeLinecap="round"
                    opacity="0.65"
                  />

                  {/* Wet Reptile Specular Spine Highlight Ridge */}
                  <path
                    d={data.path}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    opacity="0.55"
                  />

                  {/* 2C. SCULPTED REALISTIC VIPER / COBRA HEAD */}
                  <g
                    transform={`translate(${data.headX}, ${data.headY}) rotate(${data.angleDeg + 90})`}
                  >
                    {/* Head Drop Shadow */}
                    <ellipse
                      cx="0.5"
                      cy="0.8"
                      rx="2.6"
                      ry="3.3"
                      fill="#1c1917"
                      opacity="0.5"
                    />

                    {/* Sinuous Forked Tongue */}
                    <path
                      d="M 0,-2.6 Q 0.3,-3.8 0,-5.2 M 0,-5.2 Q -0.8,-6.4 -1.1,-7.2 M 0,-5.2 Q 0.8,-6.4 1.1,-7.2"
                      stroke="#dc2626"
                      strokeWidth="0.45"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {/* Sculpted Viper Angular Wedge Head */}
                    <path
                      d="M 0,-3.4 C 1.4,-3.0 2.5,-1.2 2.6,0.5 C 2.7,2.1 1.8,3.2 0,3.5 C -1.8,3.2 -2.7,2.1 -2.6,0.5 C -2.5,-1.2 -1.4,-3.0 0,-3.4 Z"
                      fill={mainGradient}
                      stroke="#fef08a"
                      strokeWidth="0.35"
                    />

                    {/* Crown Dorsal Diamond Mark */}
                    <polygon
                      points="0,-1.8 0.9,-0.2 0,1.2 -0.9,-0.2"
                      fill="#18181b"
                      opacity="0.75"
                    />

                    {/* Left Reptile Eye: Amber Iris with Vertical Black Slit Pupil */}
                    <circle cx="-1.1" cy="-0.6" r="0.65" fill="url(#snake-eye-iris)" stroke="#000000" strokeWidth="0.15" />
                    <ellipse cx="-1.1" cy="-0.6" rx="0.16" ry="0.5" fill="#000000" />
                    <circle cx="-1.25" cy="-0.75" r="0.15" fill="#ffffff" />

                    {/* Right Reptile Eye: Amber Iris with Vertical Black Slit Pupil */}
                    <circle cx="1.1" cy="-0.6" r="0.65" fill="url(#snake-eye-iris)" stroke="#000000" strokeWidth="0.15" />
                    <ellipse cx="1.1" cy="-0.6" rx="0.16" ry="0.5" fill="#000000" />
                    <circle cx="0.95" cy="-0.75" r="0.15" fill="#ffffff" />

                    {/* Supraocular Eye Brow Ridges */}
                    <path d="M -1.7,-1.2 Q -1.1,-1.5 -0.6,-1.2" stroke="#450a0a" strokeWidth="0.35" fill="none" strokeLinecap="round" />
                    <path d="M 1.7,-1.2 Q 1.1,-1.5 0.6,-1.2" stroke="#450a0a" strokeWidth="0.35" fill="none" strokeLinecap="round" />

                    {/* Nostrils / Heat-Sensing Pits */}
                    <circle cx="-0.4" cy="-2.5" r="0.16" fill="#18181b" />
                    <circle cx="0.4" cy="-2.5" r="0.16" fill="#18181b" />
                  </g>

                  {/* 2D. COILED TAIL & RATTLE ON LANDING TILE */}
                  <g transform={`translate(${data.tailX}, ${data.tailY})`}>
                    {/* Tail Drop Shadow */}
                    <circle cx="0.4" cy="0.6" r="1.3" fill="#1c1917" opacity="0.4" />
                    {/* Outer Tail Coil */}
                    <circle
                      cx="0"
                      cy="0"
                      r="1.2"
                      fill={mainGradient}
                      stroke="#451a03"
                      strokeWidth="0.3"
                    />
                    {/* Rattle Inner Segment Rings */}
                    <circle cx="0" cy="0" r="0.75" fill="#eab308" stroke="#78350f" strokeWidth="0.25" />
                    <circle cx="0" cy="0" r="0.35" fill="#fef08a" />
                  </g>
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
                className={`absolute pointer-events-none z-20 ${isActive ? 'z-30' : ''}`}
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: `translate(-50%, -50%) ${isActive ? 'scale(1.12)' : 'scale(1)'}`,
                  transition: isMoving
                    ? 'left 0.17s ease-out, top 0.17s ease-out'
                    : 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
