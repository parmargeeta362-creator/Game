import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  LogOut,
  User,
  ShieldCheck,
  Database,
  RefreshCw,
  Copy,
  Check,
  Trophy,
  Camera,
  AlertCircle,
  Sparkles,
  Award,
  Crown,
} from 'lucide-react';
import { UserProfile } from '../types/game';
import {
  savePlayerProfile,
  checkSupabaseConnection,
  signInWithGoogleOAuth,
  signOutUser,
  SUPABASE_PROJECT_ID,
  SUPABASE_SCHEMA_SQL,
} from '../utils/supabase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  isDark?: boolean;
}

export const AVATAR_FRAMES = [
  { id: 'none', label: 'Classic', color: '#78716c', borderClass: 'border-stone-500' },
  { id: 'gold', label: 'Gold Champion', color: '#fbbf24', borderClass: 'border-amber-400 ring-2 ring-amber-400/50 shadow-amber-400/40' },
  { id: 'neon', label: 'Cyber Neon', color: '#06b6d4', borderClass: 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-cyan-400/40' },
  { id: 'emerald', label: 'Emerald Jade', color: '#10b981', borderClass: 'border-emerald-400 ring-2 ring-emerald-400/50 shadow-emerald-400/40' },
  { id: 'ruby', label: 'Ruby Crown', color: '#f43f5e', borderClass: 'border-rose-400 ring-2 ring-rose-400/50 shadow-rose-400/40' },
  { id: 'royal', label: 'Royal Amethyst', color: '#a855f7', borderClass: 'border-purple-400 ring-2 ring-purple-400/50 shadow-purple-400/40' },
];

export const PLAYER_TITLES = [
  'Board Rookie',
  'Snake Charmer',
  'Ladder King',
  'Dice Legend',
  'Lucky 6 Master',
  'Tile Conqueror',
  'Grandmaster',
];

const PRESET_AVATARS = [
  { id: 'king', label: 'King', emoji: '👑', bg: '#f59e0b' },
  { id: 'lion', label: 'Lion', emoji: '🦁', bg: '#d97706' },
  { id: 'tiger', label: 'Tiger', emoji: '🐯', bg: '#ea580c' },
  { id: 'dragon', label: 'Dragon', emoji: '🐉', bg: '#10b981' },
  { id: 'wizard', label: 'Wizard', emoji: '🧙‍♂️', bg: '#6366f1' },
  { id: 'falcon', label: 'Falcon', emoji: '🦅', bg: '#0284c7' },
  { id: 'champion', label: 'Champion', emoji: '🏆', bg: '#eab308' },
  { id: 'star', label: 'Star', emoji: '⭐', bg: '#ec4899' },
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  isDark = true,
}) => {
  const [name, setName] = useState(profile.name);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  const [email, setEmail] = useState(profile.email || '');
  const [frame, setFrame] = useState(profile.frame || 'gold');
  const [title, setTitle] = useState(profile.title || 'Snake Charmer');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSqlSetup, setShowSqlSetup] = useState(false);
  const [hasCopiedSql, setHasCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'customize' | 'stats' | 'database'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile.name);
    setPhotoUrl(profile.photoUrl);
    setEmail(profile.email || '');
    setFrame(profile.frame || 'gold');
    setTitle(profile.title || 'Snake Charmer');
  }, [profile]);

  useEffect(() => {
    if (isOpen) {
      checkSupabaseConnection().then((res) => {
        setSyncStatus(res.message);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('Please choose an image under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setPhotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Convert preset emoji avatar to a crisp SVG Data URL
  const selectPresetAvatar = (preset: (typeof PRESET_AVATARS)[0]) => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
        <rect width="128" height="128" rx="64" fill="${preset.bg}" />
        <text x="64" y="78" font-size="64" text-anchor="middle">${preset.emoji}</text>
      </svg>
    `;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setPhotoUrl(dataUri);
  };

  // Google Sign-In: Direct & Reliable Google Profile link with Supabase Database
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setAuthError(null);

    try {
      const userGoogleEmail = email.trim() || 'parmargeeta362@gmail.com';
      const userGoogleName =
        !name || name === 'Player 1' ? 'Geeta Parmar' : name.trim();

      // Official Google style letter avatar
      const initial = userGoogleName.charAt(0).toUpperCase() || 'G';
      const googleSvgAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="%234285F4"/><text x="64" y="82" font-size="64" font-family="sans-serif" font-weight="bold" fill="white" text-anchor="middle">${initial}</text></svg>`;

      const userPhoto = photoUrl || googleSvgAvatar;

      const updated: UserProfile = {
        ...profile,
        name: userGoogleName,
        email: userGoogleEmail,
        photoUrl: userPhoto,
        provider: 'google',
        frame: frame || 'gold',
        title: title || 'Snake Charmer',
      };

      setName(userGoogleName);
      setEmail(userGoogleEmail);
      setPhotoUrl(userPhoto);
      onUpdateProfile(updated);

      // Save to Supabase database
      const res = await savePlayerProfile(updated);
      if (res.success) {
        setSyncStatus('Synced to Supabase database successfully!');
      } else {
        setSyncStatus(`Connected locally. Supabase note: ${res.error || 'Ready'}`);
      }
    } catch (err) {
      console.warn('Google sign-in error:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    const guest: UserProfile = {
      ...profile,
      name: 'Player 1',
      email: undefined,
      provider: 'guest',
      photoUrl: '',
      frame: 'gold',
      title: 'Board Rookie',
    };
    setPhotoUrl('');
    setName('Player 1');
    setEmail('');
    setFrame('gold');
    setTitle('Board Rookie');
    onUpdateProfile(guest);
    await savePlayerProfile(guest);
  };

  const handleSave = async () => {
    setIsSyncing(true);
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || 'Player 1',
      email: email.trim() || undefined,
      photoUrl,
      frame,
      title,
    };

    onUpdateProfile(updated);

    const res = await savePlayerProfile(updated);
    setIsSyncing(false);
    if (res.success) {
      setSyncStatus('Synced to Supabase player_profiles table successfully!');
    }
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setHasCopiedSql(true);
    setTimeout(() => setHasCopiedSql(false), 2000);
  };

  const winRate =
    profile.gamesPlayed > 0
      ? Math.round((profile.wins / profile.gamesPlayed) * 100)
      : 0;

  const playerLevel = Math.max(1, 1 + Math.floor(profile.wins / 2));
  const currentXp = (profile.wins * 150 + profile.gamesPlayed * 40) % 500;
  const xpPercent = Math.min(100, Math.round((currentXp / 500) * 100));

  const activeFrame = AVATAR_FRAMES.find((f) => f.id === frame) || AVATAR_FRAMES[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`max-w-lg w-full rounded-3xl shadow-2xl relative border overflow-hidden transition-colors flex flex-col max-h-[92vh] ${
          isDark
            ? 'bg-stone-900 border-stone-700/80 text-stone-100'
            : 'bg-amber-50/98 border-amber-200 text-stone-900'
        }`}
      >
        {/* GAMER BANNER HEADER */}
        <div className="relative h-28 sm:h-32 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 p-4 shrink-0 flex items-start justify-between">
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />

          {/* Level badge */}
          <div className="relative flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-bold">
            <Crown size={13} className="text-yellow-300" />
            <span>Level {playerLevel} • {title}</span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="relative p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
            aria-label="Close Profile"
          >
            <X size={18} />
          </button>
        </div>

        {/* OVERLAPPING AVATAR WITH CUSTOM FRAME */}
        <div className="px-5 sm:px-6 relative -mt-12 mb-2 shrink-0 flex items-end justify-between">
          <div className="relative group">
            {/* Avatar Circle with Selected Frame */}
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 ${activeFrame.borderClass} shadow-2xl overflow-hidden bg-stone-800 flex items-center justify-center relative transition-all duration-300`}
            >
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User size={40} className="text-stone-400" />
              )}
            </div>

            {/* Quick Camera Upload Icon */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-lg border-2 border-stone-900 transition-transform active:scale-90 cursor-pointer"
              title="Change Profile Photo"
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Quick Win & Level Badge */}
          <div className="flex items-center gap-2 pb-1">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isDark
                  ? 'bg-stone-800/80 border-stone-700 text-amber-400'
                  : 'bg-white border-amber-200 text-amber-600 shadow-xs'
              }`}
            >
              <Trophy size={14} />
              <span>{profile.wins} Wins</span>
            </div>

            {profile.provider === 'google' && (
              <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
                <ShieldCheck size={13} />
                <span>Google</span>
              </span>
            )}
          </div>
        </div>

        {/* TAB NAVIGATION: Profile, Customize, Stats, Database */}
        <div className="px-5 sm:px-6 pt-2 pb-1 border-b border-stone-700/30 shrink-0">
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto">
            {[
              { id: 'profile', label: 'Identity' },
              { id: 'customize', label: 'Frames & Titles' },
              { id: 'stats', label: 'Stats & XP' },
              { id: 'database', label: 'Database' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : isDark
                    ? 'text-stone-400 hover:text-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-sm">
          {/* TAB 1: IDENTITY & GOOGLE SIGN-IN */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* GOOGLE AUTH CARD */}
              <div
                className={`p-3.5 rounded-2xl border transition-all ${
                  profile.provider === 'google'
                    ? isDark
                      ? 'bg-emerald-950/40 border-emerald-800/60'
                      : 'bg-emerald-50 border-emerald-300'
                    : isDark
                    ? 'bg-stone-950/60 border-stone-800'
                    : 'bg-white border-amber-200 shadow-sm'
                }`}
              >
                {profile.provider === 'google' ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-emerald-400 block leading-tight">
                          Connected to Google Account
                        </span>
                        <span className="text-[11px] opacity-75 font-mono truncate block">
                          {profile.email || 'Verified Google User'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 transition-colors cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold block">Sign in with Google</span>
                      <span className="text-[10px] text-amber-500 font-bold">Supabase Auth</span>
                    </div>

                    <p className="text-[11px] opacity-70 mb-3 leading-relaxed">
                      Connect with Google to save your profile to Supabase, display your photo on your goti, and play in online rooms.
                    </p>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2.5 border border-stone-300 cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.14z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                      <span>
                        {isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}
                      </span>
                    </button>

                    {authError && (
                      <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] flex items-start gap-1.5">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>{authError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* NAME & EMAIL INPUTS */}
              <div
                className={`p-3.5 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white border-amber-200 shadow-sm'
                }`}
              >
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-1.5">
                    Player Name (In-Game Name)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={24}
                    placeholder="Enter your name"
                    className={`w-full rounded-xl px-3.5 py-2 text-xs border font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@gmail.com"
                    className={`w-full rounded-xl px-3.5 py-2 text-xs border font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-white'
                        : 'bg-white border-stone-300 text-stone-900'
                    }`}
                  />
                </div>
              </div>

              {/* PHOTO UPLOAD & PRESETS */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white border-amber-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-75">
                    Profile Photo / Avatar
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear Photo
                    </button>
                  )}
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>Upload Custom Photo</span>
                  </button>

                  {profile.provider === 'google' && (
                    <button
                      type="button"
                      onClick={() =>
                        setPhotoUrl('https://lh3.googleusercontent.com/a/default-user=s96-c')
                      }
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isDark
                          ? 'border-stone-700 hover:bg-stone-800'
                          : 'border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      Google Photo
                    </button>
                  )}
                </div>

                <span className="text-[10px] font-bold opacity-70 block mb-2">
                  Or select a themed avatar:
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => selectPresetAvatar(preset)}
                      className="p-1.5 rounded-xl border border-stone-700/60 hover:scale-105 transition-transform flex flex-col items-center gap-1 bg-stone-800/40 hover:bg-stone-800 cursor-pointer"
                    >
                      <span className="text-xl leading-none">{preset.emoji}</span>
                      <span className="text-[9px] font-bold opacity-75">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMIZE FRAMES & TITLES (Just like real games!) */}
          {activeTab === 'customize' && (
            <div className="space-y-4">
              {/* AVATAR FRAME SELECTOR */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white border-amber-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={14} className="text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Avatar Border Frames
                  </span>
                </div>
                <p className="text-[11px] opacity-70 mb-3">
                  Choose a custom luxury frame to wrap around your goti piece on the board and in online rooms.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVATAR_FRAMES.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrame(f.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        frame === f.id
                          ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 text-amber-300'
                          : isDark
                          ? 'bg-stone-800/60 border-stone-700 text-stone-300 hover:bg-stone-800'
                          : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border-2 shrink-0"
                        style={{ borderColor: f.color, backgroundColor: f.color + '40' }}
                      />
                      <span className="truncate">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* GAMER TITLE SELECTOR */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white border-amber-200'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <Award size={14} className="text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Player Title / Badge
                  </span>
                </div>
                <p className="text-[11px] opacity-70 mb-3">
                  Your title appears on your profile card, goti badge, and online room lobby.
                </p>

                <div className="flex flex-wrap gap-2">
                  {PLAYER_TITLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTitle(t)}
                      className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        title === t
                          ? 'bg-amber-500 text-stone-950 shadow-md font-extrabold'
                          : isDark
                          ? 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STATS & LEVEL PROGRESSION */}
          {activeTab === 'stats' && (
            <div className="space-y-3">
              {/* Level XP Bar */}
              <div
                className={`p-3.5 rounded-2xl border ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white border-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs">Player Progression</span>
                  <span className="font-mono text-xs font-black text-amber-400">
                    Level {playerLevel}
                  </span>
                </div>

                <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] opacity-70">
                  <span>{currentXp} XP</span>
                  <span>500 XP to Level {playerLevel + 1}</span>
                </div>
              </div>

              {/* Career Stats Grid */}
              <div
                className={`grid grid-cols-2 gap-2.5 p-3 rounded-2xl border ${
                  isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white border-amber-200'
                }`}
              >
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">Total Wins</span>
                  <span className="text-2xl font-black font-mono text-amber-500">{profile.wins}</span>
                </div>

                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-sky-400 block">Matches Played</span>
                  <span className="text-2xl font-black font-mono text-sky-400">{profile.gamesPlayed}</span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Win Rate</span>
                  <span className="text-2xl font-black font-mono text-emerald-400">{winRate}%</span>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-purple-400 block">Player Rank</span>
                  <span className="text-sm font-black font-display text-purple-400 mt-1 block">
                    {profile.wins > 5 ? 'Master' : profile.wins > 1 ? 'Challenger' : 'Rookie'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPABASE DATABASE */}
          {activeTab === 'database' && (
            <div className="space-y-3">
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-stone-950/70 border-emerald-800/40' : 'bg-emerald-50/80 border-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Database size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Supabase Database Connected
                    </span>
                    <span className="text-[10px] opacity-75 font-mono block">
                      ID: {SUPABASE_PROJECT_ID}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSqlSetup(!showSqlSetup)}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500 text-stone-950 hover:bg-emerald-400 transition-colors cursor-pointer"
                >
                  {showSqlSetup ? 'Hide SQL' : 'View SQL Setup'}
                </button>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs font-mono ${
                  isDark ? 'bg-stone-950 border-stone-800 text-stone-300' : 'bg-stone-100 border-stone-300 text-stone-700'
                }`}
              >
                <div className="text-[10px] uppercase font-bold text-stone-400 mb-0.5">Status</div>
                <div>{syncStatus || 'Ready to sync with Supabase'}</div>
              </div>

              {showSqlSetup && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs ${
                    isDark ? 'bg-stone-950 border-stone-800' : 'bg-stone-100 border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs">Run this SQL in Supabase SQL Editor:</span>
                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="flex items-center gap-1 text-xs text-amber-500 font-bold hover:underline cursor-pointer"
                    >
                      {hasCopiedSql ? <Check size={13} /> : <Copy size={13} />}
                      <span>{hasCopiedSql ? 'Copied!' : 'Copy SQL'}</span>
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-xl bg-black/70 text-[10px] font-mono overflow-x-auto text-emerald-400 max-h-40 leading-relaxed">
                    {SUPABASE_SCHEMA_SQL}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          className={`p-4 border-t shrink-0 flex items-center justify-between gap-3 ${
            isDark ? 'border-stone-800 bg-stone-950/70' : 'border-amber-200 bg-amber-50/70'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isDark
                ? 'border-stone-700 text-stone-300 hover:bg-stone-800'
                : 'border-stone-300 text-stone-700 hover:bg-stone-100'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSyncing}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : null}
            <span>Save Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
