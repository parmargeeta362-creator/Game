import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, X, Sparkles } from 'lucide-react';
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
      className={`flex flex-col rounded-2xl border overflow-hidden transition-colors ${
        isCompact ? 'h-56 sm:h-64' : 'h-64 sm:h-72'
      } ${
        isDark
          ? 'bg-stone-950/80 border-stone-800 text-stone-100'
          : 'bg-white/95 border-amber-200 text-stone-900 shadow-sm'
      }`}
    >
      {/* Chat Header */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-stone-800/80 bg-stone-900/60' : 'border-amber-200/80 bg-amber-50/80'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <MessageCircle size={14} className="text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Room Chat</span>
        </div>
        <span className="text-[10px] opacity-60 font-mono">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-2 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-3">
            <span className="text-xl mb-1">💬</span>
            <p className="text-[11px]">No messages yet in this room.</p>
            <p className="text-[10px] mt-0.5">Send a greeting or tap a quick phrase below!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const timeStr = new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1 mb-0.5 px-1">
                  {!isMe && (
                    <span className="text-[10px] font-bold text-amber-400">
                      {msg.senderName}
                    </span>
                  )}
                  <span className="text-[9px] opacity-50 font-mono">{timeStr}</span>
                </div>

                <div
                  className={`px-3 py-1.5 rounded-2xl max-w-[85%] break-words text-xs shadow-xs ${
                    isMe
                      ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-xs'
                      : isDark
                      ? 'bg-stone-800/90 text-stone-100 rounded-tl-xs border border-stone-700/60'
                      : 'bg-stone-100 text-stone-900 rounded-tl-xs border border-stone-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Phrases Bar */}
      <div
        className={`px-2 py-1.5 border-t overflow-x-auto flex gap-1.5 shrink-0 scrollbar-none ${
          isDark ? 'border-stone-800/70 bg-stone-900/40' : 'border-amber-100 bg-amber-50/50'
        }`}
      >
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => handleQuickSend(phrase)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
              isDark
                ? 'bg-stone-800/90 hover:bg-stone-700 text-stone-300'
                : 'bg-stone-200/80 hover:bg-stone-300 text-stone-700'
            }`}
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className={`p-2 border-t flex items-center gap-1.5 shrink-0 ${
          isDark ? 'border-stone-800 bg-stone-900/80' : 'border-amber-200 bg-white'
        }`}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={140}
          placeholder="Say something to room..."
          className={`flex-1 rounded-xl px-3 py-1.5 text-xs border focus:outline-none focus:ring-1 focus:ring-amber-400 font-medium ${
            isDark
              ? 'bg-stone-800/80 border-stone-700 text-white placeholder-stone-500'
              : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'
          }`}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-2 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
            inputText.trim()
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md'
              : isDark
              ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
          title="Send message"
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
};
