import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, CheckCheck } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types/game';

interface OnlineChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUser: UserProfile;
  isDark?: boolean;
  isCompact?: boolean;
}

const QUICK_PHRASES = [
  'Good luck! 🍀',
  'Nice roll! 🎲',
  'Watch out for snakes! 🐍',
  'Ladder boost! 🪜',
  'Close game! 🔥',
  'GG! 👏',
];

export const OnlineChatBox: React.FC<OnlineChatBoxProps> = ({
  messages,
  onSendMessage,
  currentUser,
  isDark = true,
  isCompact = false,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleQuickSend = (phrase: string) => {
    onSendMessage(phrase);
  };

  return (
    <div
      className={`flex flex-col rounded-3xl border overflow-hidden transition-all shadow-xl ${
        isCompact ? 'h-64 sm:h-72' : 'h-72 sm:h-80'
      } ${
        isDark
          ? 'bg-[#0b141a] border-emerald-950/80 text-stone-100'
          : 'bg-[#efeae2] border-emerald-200 text-stone-900'
      }`}
    >
      {/* WhatsApp Style Chat Header */}
      <div
        className={`px-3.5 py-2.5 border-b flex items-center justify-between shrink-0 shadow-xs ${
          isDark
            ? 'border-stone-800 bg-[#202c33] text-stone-100'
            : 'border-emerald-300/60 bg-[#008069] text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-xs font-bold">
              💬
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1 ring-stone-900" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5 leading-none">
              <span>Game Room Chat</span>
            </div>
            <p className="text-[10px] opacity-75 font-medium mt-0.5">Online • Real-time Sync</p>
          </div>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            isDark ? 'bg-stone-800/80 text-emerald-400' : 'bg-emerald-800/60 text-emerald-100'
          }`}
        >
          {messages.length} msgs
        </span>
      </div>

      {/* WhatsApp Messages Scroll Area */}
      <div
        className={`flex-1 p-3 overflow-y-auto space-y-3 text-xs ${
          isDark
            ? 'bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px]'
            : 'bg-[#efeae2] bg-[radial-gradient(#e1dbd1_1px,transparent_1px)] [background-size:16px_16px]'
        }`}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 p-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-xl mb-1.5 border border-emerald-500/30">
              💬
            </div>
            <p className="text-xs font-bold">No messages yet</p>
            <p className="text-[11px] opacity-70 mt-0.5">Say hello to the other player!</p>
          </div>
        ) : (
          messages.map((msg) => {
            // Determine if message is from the current user
            const isMe =
              msg.senderId === currentUser.id ||
              msg.senderId.startsWith(currentUser.id) ||
              (msg.senderName === currentUser.name &&
                (!msg.senderAvatar || msg.senderAvatar === currentUser.photoUrl));

            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* 1. SAAMNE WALA (Other Player) -> PHOTO ON LEFT SIDE */}
                {!isMe && (
                  <div className="shrink-0 mb-0.5">
                    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-emerald-500/60 bg-stone-800 flex items-center justify-center shadow-sm">
                      {msg.senderAvatar ? (
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="font-bold text-[10px] text-emerald-400">
                          {msg.senderName.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Chat Bubble */}
                <div
                  className={`max-w-[78%] sm:max-w-[72%] rounded-2xl px-3 py-1.5 shadow-sm text-xs break-words relative transition-all ${
                    isMe
                      ? isDark
                        ? 'bg-[#005c4b] text-white rounded-br-xs border border-emerald-600/30'
                        : 'bg-[#d9fdd3] text-stone-900 rounded-br-xs border border-emerald-200'
                      : isDark
                      ? 'bg-[#202c33] text-stone-100 rounded-bl-xs border border-stone-700/60'
                      : 'bg-white text-stone-900 rounded-bl-xs border border-stone-200/80 shadow-xs'
                  }`}
                >
                  {/* Sender Name for other player */}
                  {!isMe && (
                    <div className="text-[10px] font-bold text-amber-400 dark:text-emerald-400 leading-tight mb-0.5">
                      {msg.senderName}
                    </div>
                  )}

                  {/* Message Body */}
                  <div className="leading-relaxed font-medium pr-8">{msg.text}</div>

                  {/* Timestamp and WhatsApp Double Ticks */}
                  <div className="flex items-center justify-end gap-1 mt-0.5 -mb-0.5 select-none text-[9px] opacity-65">
                    <span>{timeStr}</span>
                    {isMe && (
                      <CheckCheck size={12} className="text-sky-400 inline stroke-[2.5]" />
                    )}
                  </div>
                </div>

                {/* 2. APNA MESSAGE (Current User) -> PHOTO ON RIGHT SIDE */}
                {isMe && (
                  <div className="shrink-0 mb-0.5">
                    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-amber-400 bg-stone-800 flex items-center justify-center shadow-sm">
                      {currentUser.photoUrl ? (
                        <img
                          src={currentUser.photoUrl}
                          alt={currentUser.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="font-bold text-[10px] text-amber-300">
                          {currentUser.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* WhatsApp Quick Phrases Chips */}
      <div
        className={`px-2.5 py-1.5 border-t overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none ${
          isDark ? 'border-stone-800 bg-[#111b21]' : 'border-stone-200 bg-[#f0f2f5]'
        }`}
      >
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => handleQuickSend(phrase)}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-[#202c33] hover:bg-stone-700 text-stone-200 border border-stone-700/60'
                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 shadow-xs'
            }`}
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* WhatsApp Style Input Bar */}
      <form
        onSubmit={handleSend}
        className={`p-2 border-t flex items-center gap-2 shrink-0 ${
          isDark ? 'border-stone-800 bg-[#202c33]' : 'border-stone-200 bg-[#f0f2f5]'
        }`}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={140}
          placeholder="Type a message..."
          className={`flex-1 rounded-full px-4 py-2 text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium ${
            isDark
              ? 'bg-[#2a3942] border-transparent text-white placeholder-stone-400'
              : 'bg-white border-stone-300 text-stone-900 placeholder-stone-500 shadow-xs'
          }`}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2.5 rounded-full transition-all flex items-center justify-center shrink-0 cursor-pointer ${
            inputText.trim()
              ? 'bg-[#00a884] hover:bg-[#008f6f] text-white shadow-md active:scale-95'
              : isDark
              ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
              : 'bg-stone-300 text-stone-400 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};
