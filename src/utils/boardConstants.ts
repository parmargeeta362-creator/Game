import { Snake, Ladder, Player } from '../types/game';

// 8 Balanced Ladders
export const DEFAULT_LADDERS: Ladder[] = [
  { id: 'ladder-4-14', bottom: 4, top: 14, color: '#38bdf8' },
  { id: 'ladder-9-31', bottom: 9, top: 31, color: '#0ea5e9' },
  { id: 'ladder-20-38', bottom: 20, top: 38, color: '#38bdf8' },
  { id: 'ladder-28-84', bottom: 28, top: 84, color: '#60a5fa' },
  { id: 'ladder-40-59', bottom: 40, top: 59, color: '#38bdf8' },
  { id: 'ladder-51-67', bottom: 51, top: 67, color: '#0ea5e9' },
  { id: 'ladder-63-81', bottom: 63, top: 81, color: '#38bdf8' },
  { id: 'ladder-71-91', bottom: 71, top: 91, color: '#60a5fa' },
];

// 8 Balanced Snakes
export const DEFAULT_SNAKES: Snake[] = [
  { id: 'snake-17-7', head: 17, tail: 7, color: '#ef4444' },
  { id: 'snake-54-34', head: 54, tail: 34, color: '#f43f5e' },
  { id: 'snake-62-19', head: 62, tail: 19, color: '#e11d48' },
  { id: 'snake-64-60', head: 64, tail: 60, color: '#f43f5e' },
  { id: 'snake-87-24', head: 87, tail: 24, color: '#dc2626' },
  { id: 'snake-93-73', head: 93, tail: 73, color: '#e11d48' },
  { id: 'snake-95-75', head: 95, tail: 75, color: '#ef4444' },
  { id: 'snake-99-78', head: 99, tail: 78, color: '#b91c1c' },
];

export const DEFAULT_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'Player 1',
    color: '#ef4444', // Red
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/40',
    textColor: 'text-red-400',
    pawnColor: '#ef4444',
    type: 'human',
    position: 1,
    laddersClimbed: 0,
    snakesBitten: 0,
    rollsCount: 0,
    sixesRolled: 0,
    avatarIcon: '🔴',
  },
  {
    id: 'p2',
    name: 'Player 2 (Bot)',
    color: '#3b82f6', // Blue
    bgColor: 'bg-blue-500/15',
    borderColor: 'border-blue-500/40',
    textColor: 'text-blue-400',
    pawnColor: '#3b82f6',
    type: 'bot',
    position: 1,
    laddersClimbed: 0,
    snakesBitten: 0,
    rollsCount: 0,
    sixesRolled: 0,
    avatarIcon: '🔵',
  },
  {
    id: 'p3',
    name: 'Player 3',
    color: '#10b981', // Green
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    pawnColor: '#10b981',
    type: 'bot',
    position: 1,
    laddersClimbed: 0,
    snakesBitten: 0,
    rollsCount: 0,
    sixesRolled: 0,
    avatarIcon: '🟢',
  },
  {
    id: 'p4',
    name: 'Player 4',
    color: '#f59e0b', // Amber/Yellow
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    pawnColor: '#f59e0b',
    type: 'bot',
    position: 1,
    laddersClimbed: 0,
    snakesBitten: 0,
    rollsCount: 0,
    sixesRolled: 0,
    avatarIcon: '🟡',
  },
];

/**
 * Returns grid column (0..9) and row (0..9 from top) for tile 1..100
 * Tile 1 = (0, 9) [bottom-left]
 * Tile 10 = (9, 9) [bottom-right]
 * Tile 11 = (9, 8)
 * Tile 20 = (0, 8)
 * Tile 100 = (0, 0) [top-left]
 */
export function getTileCoordinates(tileNumber: number): { x: number; y: number } {
  const clamped = Math.max(1, Math.min(100, tileNumber));
  const zeroBased = clamped - 1;
  const rowFromBottom = Math.floor(zeroBased / 10);
  const colInRow = zeroBased % 10;
  
  const x = rowFromBottom % 2 === 0 ? colInRow : 9 - colInRow;
  const y = 9 - rowFromBottom;

  return { x, y };
}

/**
 * Returns center coordinate in percentage (0..100)
 */
export function getTileCenterPercent(tileNumber: number): { cx: number; cy: number } {
  const { x, y } = getTileCoordinates(tileNumber);
  return {
    cx: (x + 0.5) * 10,
    cy: (y + 0.5) * 10,
  };
}

/**
 * Creates SVG wavy path for a snake from head to tail with realistic serpentine curves
 */
export function generateSnakePath(headTile: number, tailTile: number): {
  path: string;
  headX: number;
  headY: number;
  tailX: number;
  tailY: number;
  angleDeg: number;
} {
  const head = getTileCenterPercent(headTile);
  const tail = getTileCenterPercent(tailTile);

  const dx = tail.cx - head.cx;
  const dy = tail.cy - head.cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;

  // Perpendicular unit vector
  const px = -Math.sin(angleRad);
  const py = Math.cos(angleRad);

  // Frequency of snake coils based on distance
  const coils = dist > 40 ? 3 : 2;
  const amplitude = Math.min(4.5, dist * 0.08);

  const points: { x: number; y: number }[] = [];
  points.push({ x: head.cx, y: head.cy });

  const steps = coils * 2;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const sign = i % 2 === 1 ? 1 : -1;
    const waveAmp = amplitude * (1 - 0.2 * t); // slightly taper towards tail
    const curX = head.cx + dx * t + px * waveAmp * sign;
    const curY = head.cy + dy * t + py * waveAmp * sign;
    points.push({ x: curX, y: curY });
  }
  points.push({ x: tail.cx, y: tail.cy });

  // Generate cubic bezier or quadratic bezier smooth path
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;

  return {
    path,
    headX: head.cx,
    headY: head.cy,
    tailX: tail.cx,
    tailY: tail.cy,
    angleDeg,
  };
}

/**
 * Calculates ladder geometry (left rail, right rail, rungs) in percentage coordinates
 */
export function generateLadderGeometry(bottomTile: number, topTile: number, width: number = 3.2): {
  leftRail: { x1: number; y1: number; x2: number; y2: number };
  rightRail: { x1: number; y1: number; x2: number; y2: number };
  rungs: { x1: number; y1: number; x2: number; y2: number }[];
  bottomX: number;
  bottomY: number;
  topX: number;
  topY: number;
} {
  const b = getTileCenterPercent(bottomTile);
  const t = getTileCenterPercent(topTile);

  const dx = t.cx - b.cx;
  const dy = t.cy - b.cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angleRad = Math.atan2(dy, dx);

  // Perpendicular vector for rails
  const px = -Math.sin(angleRad) * (width / 2);
  const py = Math.cos(angleRad) * (width / 2);

  const leftRail = {
    x1: b.cx - px,
    y1: b.cy - py,
    x2: t.cx - px,
    y2: t.cy - py,
  };

  const rightRail = {
    x1: b.cx + px,
    y1: b.cy + py,
    x2: t.cx + px,
    y2: t.cy + py,
  };

  // Generate rungs every ~5-6 units
  const rungCount = Math.max(3, Math.round(dist / 5.5));
  const rungs: { x1: number; y1: number; x2: number; y2: number }[] = [];

  for (let i = 1; i < rungCount; i++) {
    const fraction = i / rungCount;
    const rx1 = leftRail.x1 + (leftRail.x2 - leftRail.x1) * fraction;
    const ry1 = leftRail.y1 + (leftRail.y2 - leftRail.y1) * fraction;
    const rx2 = rightRail.x1 + (rightRail.x2 - rightRail.x1) * fraction;
    const ry2 = rightRail.y1 + (rightRail.y2 - rightRail.y1) * fraction;
    rungs.push({ x1: rx1, y1: ry1, x2: rx2, y2: ry2 });
  }

  return {
    leftRail,
    rightRail,
    rungs,
    bottomX: b.cx,
    bottomY: b.cy,
    topX: t.cx,
    topY: t.cy,
  };
}
