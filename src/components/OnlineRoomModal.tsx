import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Copy,
  Check,
  Play,
  Share2,
  LogOut,
  Sparkles,
  Loader2,
  Crown,
  MessageCircle,
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types/game';
import { RoomPresenceState, normalizeRoomCode } from '../utils/supabaseRealtime';
import { OnlineChatBox } from './OnlineChatBox';

interface OnlineRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  activeRoomCode: string | null;
  isHost: boolean;
  connectedPlayers: RoomPresenceState[];
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onCreateRoom: (maxPlayers: number) => void;
  onJoinRoom: (code: string) => void;
  onStartOnlineMatch: () => void;
  onLeaveRoom: () => void;
  isDark?: boolean;
}

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  onClose,
  profile,
  activeRoomCode,
  isHost,
  connectedPlayers,
  messages,
  onSendMessage,
  onCreateRoom,
  onJoinRoom,
  onStartOnlineMatch,
  onLeaveRoom,
  isDark = true,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [lobbyView, setLobbyView] = useState<'players' | 'chat'>('players');
  const [inputCode, setInputCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [hasCopied, setHasCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    if (!activeRoomCode) return;
    navigator.clipboard.writeText(activeRoomCode);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleShareLink = () => {
    if (!activeRoomCode) return;
    const url = `${window.location.origin}?room=${activeRoomCode}`;
    navigator.clipboard.writeText(url);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`max-w-md w-full rounded-3xl p-5 sm:p-6 shadow-2xl relative border overflow-hidden transition-colors ${
          isDark
            ? 'bg-stone-900 border-stone-700/80 text-stone-100'
            : 'bg-amber-50/98 border-amber-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b pb-3.5 mb-3.5 ${
            isDark ? 'border-stone-800' : 'border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌐</span>
            <div>
              <h2 className="text-lg font-bold font-display">Online Multiplayer Room</h2>
              <p className="text-[11px] opacity-70">
                {activeRoomCode ? `Active Room: ${activeRoomCode}` : 'Play live with friends online'}
              </p>
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

        {/* IF CURRENTLY IN AN ACTIVE ROOM -> SHOW ROOM LOBBY & CHAT */}
        {activeRoomCode ? (
          <div className="space-y-3.5">
            {/* Room Code Badge */}
            <div
              className={`p-3.5 rounded-2xl border text-center relative overflow-hidden ${
                isDark ? 'bg-stone-950/70 border-amber-500/40' : 'bg-white border-amber-300 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">
                  Room Code
                </span>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 my-1.5">
                <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-amber-400">
                  {activeRoomCode}
                </span>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 transition-colors shadow-sm cursor-pointer"
                  title="Copy Room Code"
                >
                  {hasCopied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>

              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Share2 size={12} />
                  <span>{hasCopied ? 'Link Copied!' : 'Copy Invite Link'}</span>
                </button>
              </div>
            </div>

            {/* Toggle between Players Lobby and Live Chat */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-stone-950/40 border border-stone-800">
              <button
                type="button"
                onClick={() => setLobbyView('players')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  lobbyView === 'players'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Users size={13} />
                <span>Players ({connectedPlayers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setLobbyView('chat')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  lobbyView === 'chat'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <MessageCircle size={13} />
                <span>Chat ({messages.length})</span>
              </button>
            </div>

            {/* SUB-VIEW 1: PLAYERS IN ROOM */}
            {lobbyView === 'players' ? (
              <div className="space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {connectedPlayers.map((p, idx) => (
                    <div
                      key={p.userId || idx}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white border-stone-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-500 bg-stone-800 flex items-center justify-center shrink-0">
                          {p.avatar ? (
                            <img
                              src={p.avatar}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="font-bold text-xs">{p.name.slice(0, 2)}</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs truncate">{p.name}</span>
                            {p.isHost && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center gap-0.5">
                                <Crown size={10} /> Host
                              </span>
                            )}
                          </div>
                          {p.title && (
                            <span className="text-[10px] opacity-70 block truncate">{p.title}</span>
                          )}
                        </div>
                      </div>

                      <span className="text-xs font-bold text-emerald-400">Ready</span>
                    </div>
                  ))}

                  {connectedPlayers.length < 2 && (
                    <div className="p-3 rounded-2xl border border-dashed border-stone-700/60 text-center text-xs opacity-70 flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Waiting for other players to join...</span>
                    </div>
                  )}
                </div>

                {/* Host Launch or Member Waiting */}
                <div className="pt-1 flex flex-col gap-2">
                  {isHost ? (
                    <button
                      type="button"
                      onClick={onStartOnlineMatch}
                      disabled={connectedPlayers.length < 2}
                      className={`w-full py-2.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                        connectedPlayers.length < 2
                          ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
                          : 'bg-amber-500 hover:bg-amber-400 text-stone-950 cursor-pointer hover:scale-[1.01]'
                      }`}
                    >
                      <Play size={16} />
                      <span>
                        {connectedPlayers.length < 2
                          ? 'Need at least 2 players to start'
                          : 'Start Online Match!'}
                      </span>
                    </button>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-xs font-bold text-amber-400">
                      Waiting for Host to start the match...
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={onLeaveRoom}
                    className="w-full py-1.5 px-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Leave Room</span>
                  </button>
                </div>
              </div>
            ) : (
              /* SUB-VIEW 2: LOBBY CHAT */
              <div className="space-y-2">
                <OnlineChatBox
                  messages={messages}
                  onSendMessage={onSendMessage}
                  currentUser={profile}
                  isDark={isDark}
                  isCompact={true}
                />
              </div>
            )}
          </div>
        ) : (
          /* CREATE OR JOIN ROOM INTERFACE */
          <div className="space-y-4">
            {/* Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-stone-950/40 border border-stone-800">
              <button
                type="button"
                onClick={() => setTab('create')}
                className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  tab === 'create'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Create Room
              </button>
              <button
                type="button"
                onClick={() => setTab('join')}
                className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  tab === 'join'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Join Room
              </button>
            </div>

            {tab === 'create' ? (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-2">
                    Room Capacity (Players)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setMaxPlayers(count)}
                        className={`py-2 px-3 rounded-xl font-bold border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          maxPlayers === count
                            ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-extrabold'
                            : isDark
                            ? 'bg-stone-800 text-stone-300 border-stone-700'
                            : 'bg-stone-100 text-stone-700 border-stone-200'
                        }`}
                      >
                        <Users size={14} />
                        <span>{count} Players</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-2xl border text-xs ${
                    isDark ? 'bg-stone-950/60 border-stone-800' : 'bg-white border-amber-200'
                  }`}
                >
                  <span className="font-bold block mb-1">Playing as Host:</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-500 bg-stone-800 flex items-center justify-center shrink-0">
                      {profile.photoUrl ? (
                        <img
                          src={profile.photoUrl}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="font-bold text-xs">{profile.name.slice(0, 2)}</span>
                      )}
                    </div>
                    <div>
                      <span className="font-bold text-xs block">{profile.name}</span>
                      <span className="text-[10px] opacity-70">
                        {profile.title || 'Board Player'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onCreateRoom(maxPlayers)}
                  className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  <Sparkles size={16} />
                  <span>Create Private Room</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider opacity-75 mb-1.5">
                    Enter Room Code or 3-Digit Number
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="e.g. 452 or SNAKE-452"
                    className={`w-full rounded-xl px-4 py-2.5 text-base font-mono font-bold tracking-widest text-center border focus:outline-none focus:ring-2 focus:ring-amber-400 uppercase ${
                      isDark
                        ? 'bg-stone-800 border-stone-700 text-amber-400'
                        : 'bg-white border-stone-300 text-amber-600'
                    }`}
                  />
                  {inputCode.trim().length >= 2 && (
                    <div className="mt-1.5 text-center text-xs font-mono text-amber-400 font-bold">
                      ➔ Joining Room: <span className="underline">{normalizeRoomCode(inputCode)}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onJoinRoom(normalizeRoomCode(inputCode))}
                  disabled={inputCode.trim().length < 3}
                  className={`w-full py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                    inputCode.trim().length < 3
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700/50'
                      : 'bg-amber-500 hover:bg-amber-400 text-stone-950 cursor-pointer hover:scale-[1.01]'
                  }`}
                >
                  <Users size={16} />
                  <span>Join Online Room</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
