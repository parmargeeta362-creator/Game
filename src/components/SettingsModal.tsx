import React, { useState } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Users,
  RotateCcw,
  Sun,
  Moon,
  Laptop,
  Palette,
  Dices,
  Crown,
  ChevronRight,
  User,
  Sparkles,
} from 'lucide-react';
import {
  Player,
  GameSettings,
  WinCondition,
  PlayerType,
  ThemeMode,
  UserProfile,
  BoardTheme,
  DiceStyle,
  GotiStyle,
} from '../types/game';
import { soundEffects } from '../utils/audio';
import { Goti } from './Goti';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  settings: GameSettings;
  onUpdatePlayers: (players: Player[]) => void;
  onUpdateSettings: (settings: GameSettings) => void;
  onRestartGame: () => void;
  isDark?: boolean;
  profile?: UserProfile;
  onOpenProfile?: () => void;
}

export const BOARD_THEMES: {
  id: BoardTheme;
  name: string;
  desc: string;
  badge: string;
  colors: string[];
}[] = [
  {
    id: 'classic_wood',
    name: 'Classic Mahogany',
    desc: 'Regal dark wood with polished brass inlays',
    badge: '🪵 Classic',
    colors: ['#78350f', '#451a03', '#fef3c7'],
  },
  {
    id: 'midnight_neon',
    name: 'Midnight Neon',
    desc: 'Cyber obsidian frame with glowing cyan & purple',
    badge: '🌌 Cyber',
    colors: ['#030712', '#06b6d4', '#8b5cf6'],
  },
  {
    id: 'emerald_jungle',
    name: 'Emerald Jungle',
    desc: 'Ancient rainforest jade with golden vine borders',
    badge: '🌿 Jungle',
    colors: ['#022c22', '#10b981', '#fbbf24'],
  },
  {
    id: 'golden_palace',
    name: 'Golden Palace',
    desc: 'Luxurious 24K gold and warm desert sandstone',
    badge: '👑 Royal',
    colors: ['#b45309', '#f59e0b', '#fef3c7'],
  },
  {
    id: 'candy_retro',
    name: 'Candy Arcade',
    desc: 'Playful synthwave lavender and mint pastels',
    badge: '🍬 Retro',
    colors: ['#4c1d95', '#d946ef', '#a7f3d0'],
  },
];

export const DICE_STYLES: {
  id: DiceStyle;
  name: string;
  desc: string;
  previewBg: string;
  pipColor: string;
}[] = [
  {
    id: 'classic_ivory',
    name: 'Classic Ivory',
    desc: 'Pearl off-white with crimson center ace',
    previewBg: 'bg-stone-100 text-stone-900 border-stone-300',
    pipColor: '#ef4444',
  },
  {
    id: 'golden_metal',
    name: 'Golden Deluxe',
    desc: 'Polished 24K gold with metallic bronze pips',
    previewBg: 'bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-500 text-amber-950 border-amber-600',
    pipColor: '#78350f',
  },
  {
    id: 'ruby_crystal',
    name: 'Ruby Gem',
    desc: 'Translucent crimson crystal with white glow',
    previewBg: 'bg-gradient-to-br from-rose-600 to-red-800 text-white border-rose-400',
    pipColor: '#ffffff',
  },
  {
    id: 'midnight_obsidian',
    name: 'Cyber Obsidian',
    desc: 'Space black finish with electric cyan pips',
    previewBg: 'bg-gradient-to-br from-stone-900 to-black text-cyan-300 border-cyan-500',
    pipColor: '#22d3ee',
  },
  {
    id: 'emerald_jade',
    name: 'Imperial Jade',
    desc: 'Imperial green jade with golden foil pips',
    previewBg: 'bg-gradient-to-br from-emerald-600 to-emerald-900 text-amber-200 border-emerald-400',
    pipColor: '#fde68a',
  },
];

export const GOTI_STYLES: {
  id: GotiStyle;
  name: string;
  desc: string;
  icon: string;
}[] = [
  {
    id: 'classic_pawn',
    name: 'Classic Regal Pawn',
    desc: 'Traditional turned tournament piece',
    icon: '♟️',
  },
  {
    id: 'crown_monarch',
    name: 'Crown Monarch',
    desc: 'Royal golden 3-point king crown',
    icon: '👑',
  },
  {
    id: 'crystal_gem',
    name: 'Crystal Gem',
    desc: 'Diamond faceted gemstone cuts',
    icon: '💎',
  },
  {
    id: 'modern_pin',
    name: 'Cyber Modern Pin',
    desc: 'Futuristic aerodynamic neon band',
    icon: '📍',
  },
];

export const AVAILABLE_GOTI_COLORS = [
  { name: 'Red', hex: '#ef4444', bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-400' },
  { name: 'Sky Blue', hex: '#0ea5e9', bg: 'bg-sky-500/15', border: 'border-sky-500/40', text: 'text-sky-400' },
  { name: 'Emerald', hex: '#10b981', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', text: 'text-emerald-400' },
  { name: 'Gold', hex: '#f59e0b', bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-400' },
  { name: 'Purple', hex: '#8b5cf6', bg: 'bg-purple-500/15', border: 'border-purple-500/40', text: 'text-purple-400' },
  { name: 'Pink', hex: '#ec4899', bg: 'bg-pink-500/15', border: 'border-pink-500/40', text: 'text-pink-400' },
  { name: 'Orange', hex: '#f97316', bg: 'bg-orange-500/15', border: 'border-orange-500/40', text: 'text-orange-400' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  players,
  settings,
  onUpdatePlayers,
  onUpdateSettings,
  onRestartGame,
  isDark = true,
  profile,
  onOpenProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'customization' | 'players' | 'rules'>('customization');

  if (!isOpen) return null;

  const handlePlayerCountChange = (count: number) => {
    onUpdateSettings({ ...settings, playerCount: count });
  };

  const handlePlayerNameChange = (id: string, name: string) => {
    const updated = players.map((p) => (p.id === id ? { ...p, name } : p));
    onUpdatePlayers(updated);
  };

  const handlePlayerTypeChange = (id: string, type: PlayerType) => {
    const updated = players.map((p) => (p.id === id ? { ...p, type } : p));
    onUpdatePlayers(updated);
  };

  const handlePlayerColorChange = (playerId: string, colorObj: typeof AVAILABLE_GOTI_COLORS[0]) => {
    const updated = players.map((p) =>
      p.id === playerId
        ? {
            ...p,
            color: colorObj.hex,
            pawnColor: colorObj.hex,
            bgColor: colorObj.bg,
            borderColor: colorObj.border,
            textColor: colorObj.text,
          }
        : p
    );
    onUpdatePlayers(updated);
    soundEffects.playPawnStep();
  };

  const handleBoardThemeChange = (boardTheme: BoardTheme) => {
    onUpdateSettings({ ...settings, boardTheme });
    soundEffects.playSixChime();
  };

  const handleDiceStyleChange = (diceStyle: DiceStyle) => {
    onUpdateSettings({ ...settings, diceStyle });
    soundEffects.playDiceRoll();
  };

  const handleGotiStyleChange = (gotiStyle: GotiStyle) => {
    onUpdateSettings({ ...settings, gotiStyle });
    soundEffects.playPawnStep();
  };

  const handleThemeChange = (theme: ThemeMode) => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleSoundToggle = () => {
    const next = !settings.soundEnabled;
    onUpdateSettings({ ...settings, soundEnabled: next });
    if (next) {
      soundEffects.setEnabled(true);
      soundEffects.playSixChime();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in select-none">
      <div
        className={`max-w-xl w-full rounded-3xl p-5 sm:p-6 shadow-2xl relative border overflow-hidden transition-colors flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-stone-900 border-stone-700/80 text-stone-100'
            : 'bg-amber-50/95 border-amber-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b pb-3 mb-3 shrink-0 ${
            isDark ? 'border-stone-800' : 'border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-lg font-bold font-display">Settings & Customization</h2>
              <p className="text-[11px] opacity-70">Customize Board Theme, Dice, Player Gotis & Rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-stone-800'
                : 'text-stone-600 hover:text-stone-950 hover:bg-amber-200/60'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selector Buttons */}
        <div
          className={`grid grid-cols-3 p-1 rounded-2xl border mb-3 shrink-0 text-xs font-bold ${
            isDark ? 'bg-stone-950/70 border-stone-800' : 'bg-amber-100/70 border-amber-200'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('customization')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'customization'
                ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Palette size={14} />
            <span>Theme & Skins</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('players')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'players'
                ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Users size={14} />
            <span>Gotis & Players</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-1 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Dices size={14} />
            <span>Rules & Audio</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="space-y-4 overflow-y-auto pr-1 text-sm flex-1">
          {/* TAB 1: BOARD & DICE CUSTOMIZATION */}
          {activeTab === 'customization' && (
            <div className="space-y-4 animate-fade-in">
              {/* 1. BOARD THEME CUSTOMIZATION */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white/80 border-amber-200/80 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Palette size={15} className="text-amber-400" />
                    <label className="text-xs font-bold uppercase tracking-wider opacity-85">
                      Board Customization (Theme)
                    </label>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                    {BOARD_THEMES.find((b) => b.id === (settings.boardTheme || 'classic_wood'))?.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {BOARD_THEMES.map((theme) => {
                    const isSelected = (settings.boardTheme || 'classic_wood') === theme.id;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => handleBoardThemeChange(theme.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-400/60 shadow-md'
                            : isDark
                            ? 'bg-stone-900 border-stone-800 hover:border-stone-700'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            <span>{theme.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-stone-500/20 opacity-80">
                              {theme.badge}
                            </span>
                          </div>
                          <p className="text-[10px] opacity-65 leading-tight mt-0.5">{theme.desc}</p>
                        </div>

                        {/* Theme color swatch circles */}
                        <div className="flex items-center -space-x-1 shrink-0 ml-2">
                          {theme.colors.map((c, i) => (
                            <div
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. DICE CUSTOMIZATION */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white/80 border-amber-200/80 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Dices size={15} className="text-amber-400" />
                    <label className="text-xs font-bold uppercase tracking-wider opacity-85">
                      Dice Customization (Skin & Material)
                    </label>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                    {DICE_STYLES.find((d) => d.id === (settings.diceStyle || 'classic_ivory'))?.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {DICE_STYLES.map((dice) => {
                    const isSelected = (settings.diceStyle || 'classic_ivory') === dice.id;
                    return (
                      <button
                        key={dice.id}
                        type="button"
                        onClick={() => handleDiceStyleChange(dice.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-400/60 shadow-md'
                            : isDark
                            ? 'bg-stone-900 border-stone-800 hover:border-stone-700'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs">{dice.name}</div>
                          <p className="text-[10px] opacity-65 leading-tight mt-0.5">{dice.desc}</p>
                        </div>

                        {/* Miniature Dice Preview Icon */}
                        <div
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ml-2 shadow-xs ${dice.previewBg}`}
                        >
                          <div
                            className="w-2 h-2 rounded-full shadow-xs"
                            style={{ backgroundColor: dice.pipColor }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. GOTI SHAPE STYLE CUSTOMIZATION */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white/80 border-amber-200/80 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Crown size={15} className="text-amber-400" />
                    <label className="text-xs font-bold uppercase tracking-wider opacity-85">
                      Player Goti Customization (Shape / Skin)
                    </label>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                    {GOTI_STYLES.find((g) => g.id === (settings.gotiStyle || 'classic_pawn'))?.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {GOTI_STYLES.map((style) => {
                    const isSelected = (settings.gotiStyle || 'classic_pawn') === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleGotiStyleChange(style.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-400/60 shadow-md'
                            : isDark
                            ? 'bg-stone-900 border-stone-800 hover:border-stone-700'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1">
                            <span>{style.icon}</span>
                            <span>{style.name}</span>
                          </div>
                          <p className="text-[10px] opacity-65 leading-tight mt-0.5">{style.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOTIS & PLAYERS CUSTOMIZATION */}
          {activeTab === 'players' && (
            <div className="space-y-4 animate-fade-in">
              {/* Profile Link Card */}
              {profile && onOpenProfile && (
                <div
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                    isDark
                      ? 'bg-stone-950/80 border-stone-800 hover:border-amber-500/50'
                      : 'bg-white border-amber-200 hover:border-amber-400 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full border border-amber-500 overflow-hidden bg-stone-800 flex items-center justify-center shrink-0">
                      {profile.photoUrl ? (
                        <img
                          src={profile.photoUrl}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User size={18} className="text-stone-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs">{profile.name} (You)</div>
                      <span className="text-[10px] opacity-70 block">
                        Edit Photo, Avatar Frame & Player Title
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
                    <span>Edit Profile</span>
                    <ChevronRight size={15} />
                  </div>
                </div>
              )}

              {/* Player Count Buttons */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white/80 border-amber-200/80 shadow-sm'
                }`}
              >
                <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-2">
                  Player Count
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => handlePlayerCountChange(count)}
                      className={`py-2 px-3 rounded-xl font-bold border transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        settings.playerCount === count
                          ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-extrabold'
                          : isDark
                          ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                          : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      <Users size={14} />
                      <span>{count} Players</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Player Roster & Custom Goti Color Picker */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider opacity-75">
                  Player Gotis & Colors
                </label>

                {players.slice(0, settings.playerCount).map((player, idx) => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isDark ? 'bg-stone-950/70 border-stone-800' : 'bg-white border-stone-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {/* Live Goti Preview */}
                        <div className="shrink-0 flex items-center justify-center w-7">
                          <Goti
                            player={player}
                            isActive={false}
                            size={20}
                            gotiStyle={settings.gotiStyle || 'classic_pawn'}
                          />
                        </div>

                        {/* Player Name Input */}
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                          maxLength={16}
                          className={`flex-1 rounded-lg px-2.5 py-1 text-xs border focus:outline-none focus:ring-1 focus:ring-amber-400 font-semibold ${
                            isDark
                              ? 'bg-stone-800 border-stone-700 text-white'
                              : 'bg-stone-50 border-stone-300 text-stone-900'
                          }`}
                          placeholder={`Player ${idx + 1}`}
                        />
                      </div>

                      {/* Human vs Bot Toggle */}
                      <div
                        className={`flex rounded-lg p-0.5 border shrink-0 ${
                          isDark ? 'bg-stone-900 border-stone-700' : 'bg-stone-200 border-stone-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handlePlayerTypeChange(player.id, 'human')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            player.type === 'human'
                              ? 'bg-amber-500 text-stone-950 shadow-xs'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          Human
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePlayerTypeChange(player.id, 'bot')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                            player.type === 'bot'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          Bot 🤖
                        </button>
                      </div>
                    </div>

                    {/* Color Swatches for this Player */}
                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-stone-800/40">
                      <span className="text-[10px] opacity-60 font-medium mr-1">Goti Color:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {AVAILABLE_GOTI_COLORS.map((col) => {
                          const isSelected = player.pawnColor === col.hex || player.color === col.hex;
                          return (
                            <button
                              key={col.hex}
                              type="button"
                              onClick={() => handlePlayerColorChange(player.id, col)}
                              title={col.name}
                              className={`w-5 h-5 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                                isSelected ? 'scale-125 ring-2 ring-amber-400 shadow-md' : 'hover:scale-110'
                              }`}
                              style={{ backgroundColor: col.hex }}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RULES & AUDIO & SYSTEM CONTROLS */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-fade-in">
              {/* Display Theme (Light/Dark/System) */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white/80 border-amber-200/80 shadow-sm'
                }`}
              >
                <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-2.5">
                  App Display Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settings.theme === 'light'
                        ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-md font-extrabold'
                        : isDark
                        ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                        : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    <Sun size={15} />
                    <span>Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settings.theme === 'dark'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-extrabold'
                        : isDark
                        ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                        : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    <Moon size={15} />
                    <span>Dark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange('system')}
                    className={`py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      settings.theme === 'system'
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-extrabold'
                        : isDark
                        ? 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
                        : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                    }`}
                  >
                    <Laptop size={15} />
                    <span>System</span>
                  </button>
                </div>
              </div>

              {/* Audio & Match Restart Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Sound Toggle */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white/80 border-amber-200/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {settings.soundEnabled ? (
                      <Volume2 size={18} className="text-amber-500 shrink-0" />
                    ) : (
                      <VolumeX size={18} className="text-stone-400 shrink-0" />
                    )}
                    <div>
                      <span className="font-bold text-xs block leading-tight">Sound Effects</span>
                      <span className="text-[10px] opacity-70">Dice, hops & chimes</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSoundToggle}
                    className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      settings.soundEnabled
                        ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-sm'
                        : isDark
                        ? 'bg-stone-800 text-stone-400 border-stone-700'
                        : 'bg-stone-200 text-stone-600 border-stone-300'
                    }`}
                  >
                    {settings.soundEnabled ? '🔊 Sound On' : '🔇 Muted'}
                  </button>
                </div>

                {/* Restart Game Button */}
                <div
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                    isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white/80 border-amber-200/80 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <RotateCcw size={18} className="text-rose-500 shrink-0" />
                    <div>
                      <span className="font-bold text-xs block leading-tight">Restart Game</span>
                      <span className="text-[10px] opacity-70">Reset pawns to Tile 1</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onRestartGame();
                      onClose();
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>Restart Match</span>
                  </button>
                </div>
              </div>

              {/* Gameplay Rules */}
              <div
                className={`p-3.5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white/80 border-amber-200/80 shadow-sm'
                }`}
              >
                <label className="block text-xs font-bold uppercase tracking-wider opacity-75">
                  Gameplay Rules
                </label>

                {/* Extra Roll on 6 */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-xs block">Roll 6 Grants Extra Turn</span>
                    <span className="text-[10px] opacity-70">Classic rule: rolling 6 gives a bonus roll</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.extraRollOnSix}
                    onChange={(e) => onUpdateSettings({ ...settings, extraRollOnSix: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                {/* Winning Condition */}
                <div className="pt-2 border-t border-stone-800/40 space-y-1.5">
                  <span className="font-bold text-xs block">Win Condition at Tile 100</span>
                  {[
                    { id: 'exact_bounce', label: 'Exact Roll (Bounce Back)', desc: 'Overshooting bounces backwards' },
                    { id: 'exact_stay', label: 'Exact Roll (Hold Position)', desc: 'Overshooting waits for next turn' },
                    { id: 'reach_or_pass', label: 'Reach or Pass 100', desc: 'First to reach or pass 100 wins immediately' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => onUpdateSettings({ ...settings, winCondition: opt.id as WinCondition })}
                      className={`flex items-start gap-2 p-2 rounded-xl cursor-pointer border text-xs transition-colors ${
                        settings.winCondition === opt.id
                          ? 'bg-amber-500/15 border-amber-500/60 font-semibold'
                          : 'border-transparent hover:bg-stone-500/10 opacity-70'
                      }`}
                    >
                      <input
                        type="radio"
                        name="winCondition"
                        checked={settings.winCondition === opt.id}
                        onChange={() => {}}
                        className="mt-0.5 accent-amber-500"
                      />
                      <div>
                        <div className="font-bold">{opt.label}</div>
                        <div className="text-[10px] opacity-75">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Close Footer */}
        <div
          className={`mt-3 pt-3 border-t flex justify-end shrink-0 ${
            isDark ? 'border-stone-800' : 'border-amber-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md cursor-pointer active:scale-95"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
