import React from 'react';
import { Player } from '../types/game';

interface GotiProps {
  player: Player;
  isActive: boolean;
  size?: number; // width in pixels, default 30
}

export const Goti: React.FC<GotiProps> = ({ player, isActive, size = 32 }) => {
  // Height is proportional (~1.3x width for classic pawn aspect ratio)
  const height = Math.round(size * 1.35);

  // Gradient IDs unique to player
  const gradId = `goti-grad-${player.id}`;
  const rimId = `goti-rim-${player.id}`;
  const goldId = `goti-gold-${player.id}`;

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center pointer-events-none select-none transition-transform duration-200 ${
        isActive ? '-translate-y-1.5 animate-bounce' : ''
      }`}
      style={{ width: size, height: height }}
    >
      {/* Dynamic Ground Shadow */}
      <div
        className={`absolute bottom-0 w-[85%] h-[6px] rounded-full bg-black/60 blur-[1.5px] transition-all duration-300 ${
          isActive ? 'scale-75 opacity-40' : 'scale-100 opacity-70'
        }`}
      />

      {/* SVG Sculpted Classic Pawn / Goti */}
      <svg
        viewBox="0 0 36 48"
        className="w-full h-full drop-shadow-md overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Main Body Radial Gradient for 3D Specular Spherical & Cylindrical Volume */}
          <radialGradient
            id={gradId}
            cx="35%"
            cy="25%"
            r="70%"
            fx="30%"
            fy="20%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="25%" stopColor={player.pawnColor} />
            <stop offset="80%" stopColor={player.pawnColor} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
          </radialGradient>

          {/* Gold Metallic Accent for Collars and Base Rim */}
          <linearGradient id={goldId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="30%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Base Rim Gradient */}
          <linearGradient id={rimId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="50%" stopColor={player.pawnColor} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.7" />
          </linearGradient>

          {/* Active Player Glow Filter */}
          {isActive && (
            <filter id={`goti-glow-${player.id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}

          {/* Clip path for user photo */}
          {player.photoUrl && (
            <clipPath id={`goti-photo-clip-${player.id}`}>
              <circle cx="18" cy="32" r="4.2" />
            </clipPath>
          )}
        </defs>

        {/* Halo Aura if active */}
        {isActive && (
          <ellipse
            cx="18"
            cy="22"
            rx="16"
            ry="18"
            fill={player.color}
            opacity="0.3"
            filter={`url(#goti-glow-${player.id})`}
          />
        )}

        <g>
          {/* 1. Base Pedestal Ring (Bottom Lip) */}
          <ellipse
            cx="18"
            cy="42"
            rx="14"
            ry="4.5"
            fill={`url(#${rimId})`}
            stroke="#1c1917"
            strokeWidth="0.8"
          />

          {/* 2. Gold Metallic Trim on Base */}
          <ellipse
            cx="18"
            cy="40"
            rx="12.5"
            ry="3.5"
            fill={`url(#${goldId})`}
            stroke="#92400e"
            strokeWidth="0.5"
          />

          {/* 3. Flared Skirt / Stem (Classic Curvature of traditional Goti) */}
          <path
            d="M 8.5,39 C 10.5,33 13.5,27 14,21 L 22,21 C 22.5,27 25.5,33 27.5,39 Z"
            fill={`url(#${gradId})`}
            stroke="#1c1917"
            strokeWidth="0.8"
          />

          {/* Vertical gloss sheen reflection on stem */}
          <path
            d="M 12,38 C 13.5,32 15,26 15.5,21.5 C 16.5,21.5 17,21.5 17,21.5 C 16.5,26 14.5,32 13.5,38 Z"
            fill="#ffffff"
            opacity="0.35"
          />

          {/* 4. Collar Ring (Waist Bead) with Gold Accent */}
          <ellipse
            cx="18"
            cy="20.5"
            rx="5.5"
            ry="2"
            fill={`url(#${goldId})`}
            stroke="#92400e"
            strokeWidth="0.6"
          />

          {/* 5. Goti Head Sphere */}
          <circle
            cx="18"
            cy="11.5"
            r="8.5"
            fill={`url(#${gradId})`}
            stroke="#1c1917"
            strokeWidth="0.8"
          />

          {/* Specular curved highlight on sphere head */}
          <ellipse
            cx="15.5"
            cy="8.5"
            rx="3.5"
            ry="2.2"
            transform="rotate(-25 15.5 8.5)"
            fill="#ffffff"
            opacity="0.8"
          />

          {/* Little secondary soft reflection on bottom right of head */}
          <ellipse
            cx="21.5"
            cy="14"
            rx="2"
            ry="1"
            fill="#ffffff"
            opacity="0.25"
          />

          {/* Player Identifier Tag / Photo on goti body */}
          {player.frame && player.frame !== 'none' && (
            <circle
              cx="18"
              cy="32"
              r="4.9"
              fill="none"
              stroke={
                player.frame === 'neon'
                  ? '#06b6d4'
                  : player.frame === 'emerald'
                  ? '#10b981'
                  : player.frame === 'ruby'
                  ? '#f43f5e'
                  : player.frame === 'royal'
                  ? '#a855f7'
                  : '#fbbf24'
              }
              strokeWidth="0.9"
              strokeDasharray={player.frame === 'neon' ? '1 0.6' : undefined}
            />
          )}

          <circle
            cx="18"
            cy="32"
            r="4.2"
            fill="#ffffff"
            stroke={
              player.frame === 'neon'
                ? '#06b6d4'
                : player.frame === 'emerald'
                ? '#10b981'
                : player.frame === 'ruby'
                ? '#f43f5e'
                : player.frame === 'royal'
                ? '#a855f7'
                : `url(#${goldId})`
            }
            strokeWidth="0.8"
          />
          {player.photoUrl ? (
            <image
              href={player.photoUrl}
              x="13.8"
              y="27.8"
              width="8.4"
              height="8.4"
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#goti-photo-clip-${player.id})`}
            />
          ) : (
            <text
              x="18"
              y="34.5"
              textAnchor="middle"
              fontSize="5.5"
              fontWeight="900"
              fontFamily="'Outfit', sans-serif"
              fill="#1c1917"
            >
              {player.name.replace('Player ', 'P').slice(0, 2)}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};
