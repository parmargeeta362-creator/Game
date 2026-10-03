import React from 'react';
import { X, Volume2, VolumeX, Users, RotateCcw, Sun, Moon, Laptop, Trophy, ShieldAlert, Sparkles, User, ChevronRight } from 'lucide-react';
import { Player, GameSettings, WinCondition, PlayerType, ThemeMode, UserProfile } from '../types/game';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className={`max-w-lg w-full rounded-3xl p-6 shadow-2xl relative border overflow-hidden transition-colors ${
          isDark
            ? 'bg-stone-900 border-stone-700/80 text-stone-100'
            : 'bg-amber-50/95 border-amber-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b pb-4 mb-4 ${
            isDark ? 'border-stone-800' : 'border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">⚙️</span>
            <div>
              <h2 className="text-lg font-bold font-display">Settings & Match Control</h2>
              <p className="text-[11px] opacity-70">Customize theme, audio, players, and match rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark
                ? 'text-stone-400 hover:text-white hover:bg-stone-800'
                : 'text-stone-600 hover:text-stone-950 hover:bg-amber-200/60'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 max-h-[68vh] overflow-y-auto pr-1 text-sm">
          {/* PROFILE & GOOGLE SIGN-IN ENTRY */}
          {profile && onOpenProfile && (
            <div
              onClick={() => {
                onClose();
                onOpenProfile();
              }}
              className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] ${
                isDark
                  ? 'bg-stone-950/80 border-stone-800 hover:border-amber-500/50'
                  : 'bg-white border-amber-200 hover:border-amber-400 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full border-2 border-amber-500 overflow-hidden bg-stone-800 flex items-center justify-center shrink-0">
                  {profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User size={22} className="text-stone-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm truncate font-display">
                      {profile.name}
                    </span>
                    {profile.provider === 'google' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                        Google
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] opacity-70 block">
                    {profile.provider === 'google'
                      ? profile.email || 'Google Connected'
                      : 'Click to Sign in with Google / Change Photo'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-amber-500 font-bold text-xs shrink-0">
                <span>Edit</span>
                <ChevronRight size={16} />
              </div>
            </div>
          )}

          {/* SUPABASE DATABASE STATUS */}
          <div
            className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
              isDark ? 'bg-stone-950/50 border-stone-800/80' : 'bg-white border-amber-200/70 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="font-bold block leading-tight">Database: Supabase</span>
                <span className="text-[10px] opacity-70 font-mono">hltwjzyifbqyzijrsrol.supabase.co</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
              Connected
            </span>
          </div>

          {/* 1. THEME SELECTOR: Light, Dark, System Default */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white/80 border-amber-200/80 shadow-sm'
            }`}
          >
            <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-2.5">
              Display Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all ${
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
                className={`py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all ${
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
                className={`py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all ${
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

          {/* 2. AUDIO & GAME RESET (Placed squarely inside Settings as requested) */}
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
                  <span className="text-[10px] opacity-70">Dice, pawn hops & chimes</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSoundToggle}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
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

            {/* Reset Game Button */}
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

          {/* 3. PLAYER COUNT SELECTOR */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white/80 border-amber-200/80 shadow-sm'
            }`}
          >
            <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-2.5">
              Player Count (2 to 4 Players)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handlePlayerCountChange(count)}
                  className={`py-2 px-3 rounded-xl font-bold border transition-all text-xs flex items-center justify-center gap-1.5 ${
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

            {/* Player Roster Configuration */}
            <div className="mt-3.5 space-y-2">
              {players.slice(0, settings.playerCount).map((player, idx) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border ${
                    isDark ? 'bg-stone-900/90 border-stone-800' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <Goti player={player} isActive={false} size={18} />

                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => handlePlayerNameChange(player.id, e.target.value)}
                    maxLength={16}
                    className={`flex-1 rounded-lg px-2.5 py-1 text-xs border focus:outline-none focus:ring-1 focus:ring-amber-400 font-semibold ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                    placeholder={`Player ${idx + 1}`}
                  />

                  {/* Human vs Bot */}
                  <div
                    className={`flex rounded-lg p-0.5 border shrink-0 ${
                      isDark ? 'bg-stone-950 border-stone-700' : 'bg-stone-200 border-stone-300'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handlePlayerTypeChange(player.id, 'human')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
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
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        player.type === 'bot'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      Bot 🤖
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. GAMEPLAY RULES */}
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

        {/* Modal Close Footer */}
        <div
          className={`mt-4 pt-3 border-t flex justify-end ${
            isDark ? 'border-stone-800' : 'border-amber-200'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
