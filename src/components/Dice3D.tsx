import React, { useState, useEffect } from 'react';

interface Dice3DProps {
  value: number; // 1 to 6
  isRolling: boolean;
  disabled?: boolean;
  onRoll: () => void;
  size?: number; // size in px, default 62
  playerColor?: string;
}

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling,
  disabled = false,
  onRoll,
  size = 62,
  playerColor = '#ef4444',
}) => {
  // Accumulated rotations to make consecutive rolls spin continuously rather than snapping back
  const [rotation, setRotation] = useState<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0,
  });

  const getFaceRotation = (val: number) => {
    switch (val) {
      case 1:
        return { x: 0, y: 0 };
      case 2:
        return { x: 0, y: -90 };
      case 3:
        return { x: 90, y: 0 };
      case 4:
        return { x: -90, y: 0 };
      case 5:
        return { x: 0, y: 90 };
      case 6:
      default:
        return { x: 0, y: 180 };
    }
  };

  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setRotation((prev) => ({
          x: prev.x + (Math.random() * 360 + 180),
          y: prev.y + (Math.random() * 360 + 180),
          z: prev.z + (Math.random() * 180 - 90),
        }));
      }, 90);
      return () => clearInterval(interval);
    } else {
      const target = getFaceRotation(value);
      setRotation((prev) => {
        const extraTurnsX = Math.round(prev.x / 360) * 360;
        const extraTurnsY = Math.round(prev.y / 360) * 360;
        return {
          x: extraTurnsX + target.x,
          y: extraTurnsY + target.y,
          z: 0,
        };
      });
    }
  }, [isRolling, value]);

  const halfSize = size / 2;

  // Face pip patterns
  const renderPips = (num: number) => {
    const pips: React.ReactNode[] = [];
    const pipSize = size < 66 ? 'w-2 h-2' : 'w-2.5 h-2.5';
    const pipStyle = `${pipSize} rounded-full bg-stone-900 shadow-inner`;
    const aceSize = size < 66 ? 'w-3 h-3' : 'w-3.5 h-3.5';

    switch (num) {
      case 1:
        pips.push(
          <div key="c" className="col-start-2 row-start-2 flex items-center justify-center">
            <div className={`${aceSize} rounded-full bg-rose-600 shadow-inner`} />
          </div>
        );
        break;
      case 2:
        pips.push(
          <div key="tl" className="col-start-1 row-start-1 flex items-center justify-center">
            <div className={pipStyle} />
          </div>,
          <div key="br" className="col-start-3 row-start-3 flex items-center justify-center">
            <div className={pipStyle} />
          </div>
        );
        break;
      case 3:
        pips.push(
          <div key="tl" className="col-start-1 row-start-1 flex items-center justify-center">
            <div className={pipStyle} />
          </div>,
          <div key="c" className="col-start-2 row-start-2 flex items-center justify-center">
            <div className={pipStyle} />
          </div>,
          <div key="br" className="col-start-3 row-start-3 flex items-center justify-center">
            <div className={pipStyle} />
          </div>
        );
        break;
      case 4:
        pips.push(
          <div key="tl" className="col-start-1 row-start-1 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="tr" className="col-start-3 row-start-1 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="bl" className="col-start-1 row-start-3 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="br" className="col-start-3 row-start-3 flex items-center justify-center"><div className={pipStyle} /></div>
        );
        break;
      case 5:
        pips.push(
          <div key="tl" className="col-start-1 row-start-1 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="tr" className="col-start-3 row-start-1 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="c" className="col-start-2 row-start-2 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="bl" className="col-start-1 row-start-3 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="br" className="col-start-3 row-start-3 flex items-center justify-center"><div className={pipStyle} /></div>
        );
        break;
      case 6:
        pips.push(
          <div key="tl" className="col-start-1 row-start-1 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="tr" className="col-start-3 row-start-1 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="ml" className="col-start-1 row-start-2 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="mr" className="col-start-3 row-start-2 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="bl" className="col-start-1 row-start-3 flex items-center justify-center"><div className={pipStyle} /></div>,
          <div key="br" className="col-start-3 row-start-3 flex items-center justify-center"><div className={pipStyle} /></div>
        );
        break;
    }

    return (
      <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-1.5 bg-gradient-to-br from-amber-50 via-stone-100 to-amber-100 rounded-lg sm:rounded-xl border border-stone-300 shadow-md">
        {pips}
      </div>
    );
  };

  const faceCommon = "absolute inset-0 flex items-center justify-center backface-hidden select-none";

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* 3D Dice Stage */}
      <div
        className="perspective-600 cursor-pointer group p-1.5 relative"
        onClick={() => {
          if (!disabled && !isRolling) {
            onRoll();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Dice showing ${value}. Click or press to roll.`}
        onKeyDown={(e) => {
          if ((e.key === ' ' || e.key === 'Enter') && !disabled && !isRolling) {
            e.preventDefault();
            onRoll();
          }
        }}
      >
        {/* Soft shadow under die */}
        <div
          className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-12 h-3 bg-stone-950/60 rounded-full blur-[2px] transition-transform duration-300 ${
            isRolling ? 'scale-75 opacity-40' : 'group-hover:scale-110 opacity-70'
          }`}
        />

        {/* 3D Cube Container */}
        <div
          className={`preserve-3d relative transition-transform ${
            isRolling ? 'duration-100 ease-linear' : 'duration-500 ease-out'
          } ${!disabled && !isRolling ? 'group-hover:-translate-y-1' : ''}`}
          style={{
            width: size,
            height: size,
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          }}
        >
          {/* Face 1 (Front) */}
          <div className={faceCommon} style={{ transform: `translateZ(${halfSize}px)` }}>
            {renderPips(1)}
          </div>

          {/* Face 6 (Back) */}
          <div className={faceCommon} style={{ transform: `rotateY(180deg) translateZ(${halfSize}px)` }}>
            {renderPips(6)}
          </div>

          {/* Face 2 (Right) */}
          <div className={faceCommon} style={{ transform: `rotateY(90deg) translateZ(${halfSize}px)` }}>
            {renderPips(2)}
          </div>

          {/* Face 5 (Left) */}
          <div className={faceCommon} style={{ transform: `rotateY(-90deg) translateZ(${halfSize}px)` }}>
            {renderPips(5)}
          </div>

          {/* Face 3 (Top) */}
          <div className={faceCommon} style={{ transform: `rotateX(-90deg) translateZ(${halfSize}px)` }}>
            {renderPips(3)}
          </div>

          {/* Face 4 (Bottom) */}
          <div className={faceCommon} style={{ transform: `rotateX(90deg) translateZ(${halfSize}px)` }}>
            {renderPips(4)}
          </div>
        </div>
      </div>

      {/* Compact Roll Button */}
      <button
        type="button"
        onClick={onRoll}
        disabled={disabled || isRolling}
        style={
          !disabled && !isRolling
            ? {
                boxShadow: `0 3px 10px ${playerColor}40`,
                backgroundColor: playerColor,
                color: '#ffffff',
              }
            : undefined
        }
        className={`w-full max-w-[170px] py-1.5 px-3 rounded-xl text-xs font-extrabold tracking-wide transition-all transform active:scale-95 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
          disabled || isRolling
            ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
            : 'text-stone-950 hover:brightness-110 border border-white/20'
        }`}
      >
        <span className="text-sm leading-none">🎲</span>
        <span>{isRolling ? 'Rolling...' : 'Roll Dice'}</span>
      </button>
    </div>
  );
};
