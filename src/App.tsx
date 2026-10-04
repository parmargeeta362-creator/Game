import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DEFAULT_PLAYERS,
  DEFAULT_SNAKES,
  DEFAULT_LADDERS,
} from './utils/boardConstants';
import {
  Player,
  GameSettings,
  Snake,
  Ladder,
  UserProfile,
  RoomBroadcastEvent,
  ChatMessage,
  MatchRecord,
} from './types/game';
import { soundEffects } from './utils/audio';
import { Board } from './components/Board';
import { Dice3D } from './components/Dice3D';
import { SettingsModal } from './components/SettingsModal';
import { VictoryModal } from './components/VictoryModal';
import { ProfileModal, AVATAR_FRAMES } from './components/ProfileModal';
import { OnlineRoomModal } from './components/OnlineRoomModal';
import { OnlineChatBox } from './components/OnlineChatBox';
import { Goti } from './components/Goti';
import { Settings, User, Globe, Users, Smile, Crown, MessageCircle, X } from 'lucide-react';
import { fetchPlayerProfile, savePlayerProfile, supabase } from './utils/supabase';
import {
  joinRoomChannel,
  broadcastRoomEvent,
  leaveRoomChannel,
  RoomPresenceState,
  normalizeRoomCode,
} from './utils/supabaseRealtime';
import { RealtimeChannel } from '@supabase/supabase-js';

const QUICK_EMOJIS = ['🎲', '🐍', '🪜', '🔥', '🎉', '😂'];

export default function App() {
  // Game Settings: theme (light, dark, system), sound, rules, board, dice & goti styles
  const [settings, setSettings] = useState<GameSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('snakes_ladders_game_settings');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      playerCount: 2,
      extraRollOnSix: true,
      winCondition: 'exact_bounce',
      moveSpeedMs: 170,
      soundEnabled: true,
      theme: 'system',
      boardTheme: 'classic_wood',
      diceStyle: 'classic_ivory',
      gotiStyle: 'classic_pawn',
    };
  });

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('snakes_ladders_game_settings', JSON.stringify(newSettings));
    } catch {}
  };

  // User Profile with Full Game Customization (Frame, Title, Google, Stats, Match History)
  const [profile, setProfile] = useState<UserProfile>(() => {
    let savedHistory: MatchRecord[] = [];
    if (typeof window !== 'undefined') {
      try {
        const hist = localStorage.getItem('snakes_ladders_match_history');
        if (hist) savedHistory = JSON.parse(hist);
      } catch {}
    }
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('snakes_ladders_user_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...parsed,
            matchHistory: parsed.matchHistory || savedHistory,
          };
        }
      } catch {
        // ignore
      }
    }
    return {
      id: 'user_' + Math.random().toString(36).substring(2, 9),
      name: 'Player 1',
      photoUrl: '',
      provider: 'guest',
      wins: 0,
      gamesPlayed: 0,
      frame: 'gold',
      title: 'Snake Charmer',
      level: 1,
      xp: 0,
      matchHistory: savedHistory,
    };
  });

  // System theme listener
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const isDark =
    settings.theme === 'dark' || (settings.theme === 'system' && systemPrefersDark);

  // Players State (Player 1 syncs with user profile)
  const [players, setPlayers] = useState<Player[]>(() =>
    DEFAULT_PLAYERS.map((p, idx) =>
      idx === 0
        ? {
            ...p,
            name: profile.name || p.name,
            photoUrl: profile.photoUrl || undefined,
            frame: profile.frame || 'gold',
            title: profile.title || 'Snake Charmer',
          }
        : { ...p }
    )
  );

  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);

  // Board Elements
  const [snakes] = useState<Snake[]>(DEFAULT_SNAKES);
  const [ladders] = useState<Ladder[]>(DEFAULT_LADDERS);

  // Dice & Animation State
  const [diceValue, setDiceValue] = useState<number>(1);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [highlightTile, setHighlightTile] = useState<number | null>(null);

  // Match State
  const [turnCount, setTurnCount] = useState<number>(1);
  const [winner, setWinner] = useState<Player | null>(null);
  const [lastEventText, setLastEventText] = useState<string>('Game ready. Roll the dice to begin!');

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isOnlineRoomOpen, setIsOnlineRoomOpen] = useState<boolean>(false);

  // Online Multiplayer State
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [connectedRoomPlayers, setConnectedRoomPlayers] = useState<RoomPresenceState[]>([]);
  const [isOnlineMatchActive, setIsOnlineMatchActive] = useState<boolean>(false);
  const [myOnlinePlayerIndex, setMyOnlinePlayerIndex] = useState<number>(0);
  const [floatingEmoji, setFloatingEmoji] = useState<{ emoji: string; id: number } | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [activeChatToast, setActiveChatToast] = useState<{
    senderName: string;
    text: string;
    id: number;
  } | null>(null);

  const roomChannelRef = useRef<RealtimeChannel | null>(null);
  const isExecutingTurn = useRef(false);
  const clientSessionId = useRef('c_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36)).current;
  const mySessionUserId = `${profile.id}_${clientSessionId}`;
  const handleRemoteRoomEventRef = useRef<(event: RoomBroadcastEvent) => void>(() => {});
  const hasRecordedMatch = useRef(false);

  // Sync sound settings
  useEffect(() => {
    soundEffects.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Check URL query parameters for direct room joining (?room=CODE)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam && !activeRoomCode) {
        setIsOnlineRoomOpen(true);
      }
    }
  }, []);

  // Fetch profile from Supabase on mount and listen to Google Auth sessions
  useEffect(() => {
    fetchPlayerProfile(profile.id || 'user_1').then((remoteProfile) => {
      if (remoteProfile) {
        setProfile(remoteProfile);
        try {
          localStorage.setItem('snakes_ladders_user_profile', JSON.stringify(remoteProfile));
        } catch {}
        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === 0
              ? {
                  ...p,
                  name: remoteProfile.name,
                  photoUrl: remoteProfile.photoUrl || undefined,
                  frame: remoteProfile.frame || 'gold',
                  title: remoteProfile.title || 'Snake Charmer',
                }
              : p
          )
        );
      }
    });

    // Supabase Auth listener for Google OAuth callbacks & sessions
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const gName =
          (u.user_metadata?.full_name as string) ||
          (u.user_metadata?.name as string) ||
          u.email?.split('@')[0] ||
          'Google Player';
        const gPhoto =
          (u.user_metadata?.avatar_url as string) ||
          (u.user_metadata?.picture as string) ||
          '';

        const updated: UserProfile = {
          id: u.id,
          name: gName,
          email: u.email,
          photoUrl: gPhoto,
          provider: 'google',
          wins: profile.wins,
          gamesPlayed: profile.gamesPlayed,
          frame: profile.frame || 'gold',
          title: profile.title || 'Snake Charmer',
          level: profile.level || 1,
          xp: profile.xp || 0,
        };

        setProfile(updated);
        try {
          localStorage.setItem('snakes_ladders_user_profile', JSON.stringify(updated));
        } catch {}

        setPlayers((prev) =>
          prev.map((p, idx) =>
            idx === 0
              ? {
                  ...p,
                  name: gName,
                  photoUrl: gPhoto || undefined,
                  frame: updated.frame,
                  title: updated.title,
                }
              : p
          )
        );

        savePlayerProfile(updated).catch(() => {});
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const activePlayers = players.slice(0, settings.playerCount);
  const currentPlayer = activePlayers[activePlayerIndex] || activePlayers[0];

  // Am I allowed to roll right now?
  const isMyTurn =
    !isOnlineMatchActive ||
    activePlayerIndex === myOnlinePlayerIndex ||
    currentPlayer.onlineUserId === mySessionUserId ||
    currentPlayer.onlineUserId === profile.id;

  // Profile update handler (saves locally and to Supabase)
  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    try {
      localStorage.setItem('snakes_ladders_user_profile', JSON.stringify(newProfile));
    } catch {
      // ignore
    }

    savePlayerProfile(newProfile).catch(() => {});

    // Sync Player 1 with profile name, photo, frame, and title
    setPlayers((prev) =>
      prev.map((p, idx) =>
        idx === 0
          ? {
              ...p,
              name: newProfile.name,
              photoUrl: newProfile.photoUrl || undefined,
              frame: newProfile.frame,
              title: newProfile.title,
            }
          : p
      )
    );
  };

  // Clean Match Restart (called from Settings or Victory modal)
  const handleRestart = useCallback(() => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        position: 1,
        laddersClimbed: 0,
        snakesBitten: 0,
        rollsCount: 0,
        sixesRolled: 0,
      }))
    );
    setActivePlayerIndex(0);
    setDiceValue(1);
    setIsRolling(false);
    setIsMoving(false);
    setHighlightTile(null);
    setWinner(null);
    setIsVictoryOpen(false);
    setTurnCount(1);
    setLastEventText('Match restarted. Roll the dice to start the race!');
    isExecutingTurn.current = false;
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Authoritative turn and pawn execution engine (used locally and on online broadcast)
  const executeAuthoritativeMove = useCallback(
    async (payload: {
      roll: number;
      playerIndex: number;
      playerId: string;
      startPos: number;
      steps: number[];
      isBouncing: boolean;
      finalPos: number;
      ladderClimbed?: { bottom: number; top: number };
      snakeBitten?: { head: number; tail: number };
      nextPlayerIndex: number;
      allPositions: { [id: string]: number };
      isWon: boolean;
      winner?: Player;
      turnsTotal?: number;
    }) => {
      isExecutingTurn.current = true;
      setIsRolling(true);
      soundEffects.playDiceRoll();

      // 1. Dice roll tumble animation
      await sleep(500);
      setDiceValue(payload.roll);
      setIsRolling(false);
      setIsMoving(true);

      const movingPlayer = activePlayers[payload.playerIndex] || activePlayers.find(p => p.id === payload.playerId) || activePlayers[0];

      // Track statistics
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === payload.playerId
            ? {
                ...p,
                rollsCount: p.rollsCount + 1,
                sixesRolled: payload.roll === 6 ? p.sixesRolled + 1 : p.sixesRolled,
              }
            : p
        )
      );

      // 2. Step-by-step tile progression
      let currentPos = payload.startPos;
      for (let i = 0; i < payload.steps.length; i++) {
        currentPos = payload.steps[i];
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === payload.playerId ? { ...p, position: currentPos } : p
          )
        );
        soundEffects.playPawnStep();
        await sleep(settings.moveSpeedMs);
      }

      if (payload.steps.length > 0) {
        if (payload.isBouncing) {
          soundEffects.playBounce();
          setLastEventText(
            `↩️ ${movingPlayer.name} rolled ${payload.roll}, reached 100 and bounced back to Tile ${currentPos}!`
          );
        } else {
          setLastEventText(`${movingPlayer.name} rolled ${payload.roll}, advanced to Tile ${currentPos}.`);
        }
      }

      // 3. Ladder climbing animation
      if (payload.ladderClimbed) {
        setHighlightTile(payload.ladderClimbed.top);
        await sleep(350);
        soundEffects.playLadderClimb();

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === payload.playerId
              ? {
                  ...p,
                  position: payload.ladderClimbed!.top,
                  laddersClimbed: p.laddersClimbed + 1,
                }
              : p
          )
        );

        setLastEventText(
          `🪜 Climbed ladder from Tile ${payload.ladderClimbed.bottom} up to Tile ${payload.ladderClimbed.top}!`
        );
        await sleep(400);
        setHighlightTile(null);
      } else if (payload.snakeBitten) {
        // Snake slide animation
        setHighlightTile(payload.snakeBitten.tail);
        await sleep(350);
        soundEffects.playSnakeSlide();

        setPlayers((prev) =>
          prev.map((p) =>
            p.id === payload.playerId
              ? {
                  ...p,
                  position: payload.snakeBitten!.tail,
                  snakesBitten: p.snakesBitten + 1,
                }
              : p
          )
        );

        setLastEventText(
          `🐍 Bitten by snake at Tile ${payload.snakeBitten.head}! Slid to Tile ${payload.snakeBitten.tail}!`
        );
        await sleep(400);
        setHighlightTile(null);
      }

      // 4. Authoritative position lock: Sync every player's tile exactly
      if (payload.allPositions) {
        setPlayers((prev) =>
          prev.map((p) => {
            const authoritativePos = payload.allPositions[p.id];
            return authoritativePos !== undefined ? { ...p, position: authoritativePos } : p;
          })
        );
      }

      // 5. Victory check
      if (payload.isWon) {
        const winningPlayer: Player = payload.winner || {
          ...movingPlayer,
          position: 100,
          laddersClimbed: movingPlayer.laddersClimbed + (payload.ladderClimbed ? 1 : 0),
          snakesBitten: movingPlayer.snakesBitten + (payload.snakeBitten ? 1 : 0),
        };
        setWinner(winningPlayer);
        if (payload.turnsTotal) setTurnCount(payload.turnsTotal);
        setIsVictoryOpen(true);
        soundEffects.playWinFanfare();
        setLastEventText(`🏆 ${winningPlayer.name} reached Tile 100 and won!`);

        if (winningPlayer.id === activePlayers[0]?.id) {
          setProfile((prev) => {
            const updated = {
              ...prev,
              wins: prev.wins + 1,
              gamesPlayed: prev.gamesPlayed + 1,
              level: Math.max(1, 1 + Math.floor((prev.wins + 1) / 2)),
              xp: (prev.xp + 150) % 500,
            };
            try {
              localStorage.setItem('snakes_ladders_user_profile', JSON.stringify(updated));
            } catch {}
            savePlayerProfile(updated).catch(() => {});
            return updated;
          });
        }

        setIsMoving(false);
        isExecutingTurn.current = false;
        return;
      }

      // 6. Turn advance or bonus roll on 6
      if (payload.roll === 6 && settings.extraRollOnSix) {
        soundEffects.playSixChime();
        setLastEventText(`✨ Rolled a 6! ${movingPlayer.name} gets an extra roll!`);
      } else {
        setActivePlayerIndex(payload.nextPlayerIndex);
        setTurnCount((prev) => prev + 1);
      }

      setIsMoving(false);
      isExecutingTurn.current = false;
    },
    [activePlayers, settings]
  );

  // Local or Online dice roll trigger
  const handleRollDice = useCallback(async () => {
    if (isRolling || isMoving || winner || isExecutingTurn.current) return;
    if (isOnlineMatchActive && !isMyTurn) return;

    const roll = Math.floor(Math.random() * 6) + 1;
    const player = activePlayers[activePlayerIndex] || activePlayers[0];
    const startPos = player.position;

    // Calculate traversal steps
    let steps: number[] = [];
    let isBouncing = false;

    if (settings.winCondition === 'reach_or_pass') {
      const target = Math.min(100, startPos + roll);
      for (let pos = startPos + 1; pos <= target; pos++) steps.push(pos);
    } else if (settings.winCondition === 'exact_stay') {
      if (startPos + roll <= 100) {
        for (let pos = startPos + 1; pos <= startPos + roll; pos++) steps.push(pos);
      } else {
        steps = [];
        setLastEventText(
          `${player.name} rolled ${roll} - requires exact roll to hit 100. Held at ${startPos}.`
        );
      }
    } else {
      // exact_bounce
      if (startPos + roll <= 100) {
        for (let pos = startPos + 1; pos <= startPos + roll; pos++) steps.push(pos);
      } else {
        isBouncing = true;
        const to100 = 100 - startPos;
        const bounceBack = roll - to100;
        for (let pos = startPos + 1; pos <= 100; pos++) steps.push(pos);
        for (let pos = 99; pos >= 100 - bounceBack; pos--) steps.push(pos);
      }
    }

    const stepEndPos = steps.length > 0 ? steps[steps.length - 1] : startPos;
    let finalPos = stepEndPos;
    let ladderClimbed: { bottom: number; top: number } | undefined;
    let snakeBitten: { head: number; tail: number } | undefined;

    if (finalPos < 100) {
      const ladder = ladders.find((l) => l.bottom === finalPos);
      const snake = snakes.find((s) => s.head === finalPos);
      if (ladder) {
        finalPos = ladder.top;
        ladderClimbed = { bottom: ladder.bottom, top: ladder.top };
      } else if (snake) {
        finalPos = snake.tail;
        snakeBitten = { head: snake.head, tail: snake.tail };
      }
    }

    const isWon = finalPos === 100;
    const extraRoll = roll === 6 && settings.extraRollOnSix;
    const nextPlayerIndex = (extraRoll || isWon)
      ? activePlayerIndex
      : (activePlayerIndex + 1) % activePlayers.length;

    // Authoritative positions map
    const allPositions: { [id: string]: number } = {};
    activePlayers.forEach((p, idx) => {
      allPositions[p.id] = idx === activePlayerIndex ? finalPos : p.position;
    });

    const finalWinner: Player | undefined = isWon
      ? {
          ...player,
          position: 100,
          laddersClimbed: player.laddersClimbed + (ladderClimbed ? 1 : 0),
          snakesBitten: player.snakesBitten + (snakeBitten ? 1 : 0),
        }
      : undefined;

    const movePayload = {
      roll,
      playerIndex: activePlayerIndex,
      playerId: player.id,
      startPos,
      steps,
      isBouncing,
      finalPos,
      ladderClimbed,
      snakeBitten,
      nextPlayerIndex,
      allPositions,
      isWon,
      winner: finalWinner,
      turnsTotal: turnCount,
    };

    // If online match active, broadcast move payload to peers
    if (isOnlineMatchActive && roomChannelRef.current) {
      broadcastRoomEvent(
        roomChannelRef.current,
        'ROLL_DICE',
        movePayload,
        mySessionUserId
      ).catch(() => {});

      if (isWon && finalWinner) {
        broadcastRoomEvent(
          roomChannelRef.current,
          'GAME_WIN',
          { winner: finalWinner, turnsTotal: turnCount },
          mySessionUserId
        ).catch(() => {});
      }
    }

    await executeAuthoritativeMove(movePayload);
  }, [
    isRolling,
    isMoving,
    winner,
    isOnlineMatchActive,
    isMyTurn,
    activePlayers,
    activePlayerIndex,
    settings,
    ladders,
    snakes,
    mySessionUserId,
    turnCount,
    executeAuthoritativeMove,
  ]);

  // Set up online match with human players at starting position
  const setupOnlineGameSession = useCallback(
    (onlinePlayersList: { userId: string; name: string; avatar: string; frame?: string; title?: string }[]) => {
      const initializedPlayers: Player[] = onlinePlayersList.map((op, idx) => {
        const base = DEFAULT_PLAYERS[idx] || DEFAULT_PLAYERS[0];
        return {
          ...base,
          id: op.userId,
          name: op.name,
          photoUrl: op.avatar || undefined,
          frame: op.frame || 'gold',
          title: op.title || 'Snake Charmer',
          type: 'human' as const, // 100% human! Never bot!
          onlineUserId: op.userId,
          position: 1,
          laddersClimbed: 0,
          snakesBitten: 0,
          rollsCount: 0,
          sixesRolled: 0,
        };
      });

      setSettings((prev) => ({ ...prev, playerCount: initializedPlayers.length }));
      setPlayers(initializedPlayers);
      setActivePlayerIndex(0);
      setDiceValue(1);
      setIsRolling(false);
      setIsMoving(false);
      setHighlightTile(null);
      setWinner(null);
      setIsVictoryOpen(false);
      setTurnCount(1);
      isExecutingTurn.current = false;
      setIsOnlineMatchActive(true);
      setIsOnlineRoomOpen(false);
      setLastEventText('🌐 Online Match Launched! Host has first turn.');
    },
    []
  );

  // Remote Realtime Event Listener
  const handleRemoteRoomEvent = useCallback(
    (event: RoomBroadcastEvent) => {
      if (event.senderId === mySessionUserId) return; // ignore self-broadcast

      if (event.type === 'PLAYER_JOINED') {
        const joinedPlayer = event.payload as RoomPresenceState;
        if (joinedPlayer && joinedPlayer.userId) {
          setConnectedRoomPlayers((prev) => {
            if (prev.some((p) => p.userId === joinedPlayer.userId)) {
              return prev;
            }
            return [...prev, joinedPlayer];
          });

          // Handshake: Reply with my presence so the new peer immediately receives it
          if (roomChannelRef.current) {
            const myPresence: RoomPresenceState = {
              userId: mySessionUserId,
              name: profile.name,
              avatar: profile.photoUrl,
              frame: profile.frame,
              title: profile.title,
              isHost: isHost,
              joinedAt: Date.now(),
            };
            broadcastRoomEvent(
              roomChannelRef.current,
              'SYNC_STATE',
              { presence: myPresence },
              mySessionUserId
            ).catch(() => {});
          }
        }
      } else if (event.type === 'SYNC_STATE') {
        const incoming = event.payload?.presence as RoomPresenceState;
        if (incoming && incoming.userId) {
          setConnectedRoomPlayers((prev) => {
            if (prev.some((p) => p.userId === incoming.userId)) {
              return prev;
            }
            return incoming.isHost ? [incoming, ...prev] : [...prev, incoming];
          });
        }
      } else if (event.type === 'ROLL_DICE') {
        const payload = event.payload;
        if (payload) {
          executeAuthoritativeMove(payload);
        }
      } else if (event.type === 'GAME_START') {
        const { onlinePlayers } = event.payload;
        if (Array.isArray(onlinePlayers)) {
          setupOnlineGameSession(onlinePlayers);
        }
      } else if (event.type === 'GAME_WIN') {
        const { winner: winPlayer, turnsTotal: totalTurns } = event.payload;
        if (winPlayer) {
          setWinner(winPlayer);
          if (totalTurns) setTurnCount(totalTurns);
          setIsVictoryOpen(true);
          soundEffects.playWinFanfare();
          setLastEventText(`🏆 ${winPlayer.name} reached Tile 100 and won!`);
        }
      } else if (event.type === 'EMOJI_REACTION') {
        const emoji = event.payload.emoji;
        setFloatingEmoji({ emoji, id: Date.now() });
        setTimeout(() => setFloatingEmoji(null), 2500);
      } else if (event.type === 'CHAT_MESSAGE') {
        const msg = event.payload as ChatMessage;
        setChatMessages((prev) => [...prev, msg]);
        soundEffects.playPawnStep();

        setActiveChatToast({
          senderName: msg.senderName,
          text: msg.text,
          id: Date.now(),
        });
        setTimeout(() => {
          setActiveChatToast(null);
        }, 4500);

        setUnreadChatCount((prev) => prev + 1);
      }
    },
    [profile, isHost, mySessionUserId, executeAuthoritativeMove, setupOnlineGameSession]
  );

  useEffect(() => {
    handleRemoteRoomEventRef.current = handleRemoteRoomEvent;
  }, [handleRemoteRoomEvent]);

  // Send text chat message in online room
  const handleSendChatMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const newMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        senderId: profile.id,
        senderName: profile.name,
        senderAvatar: profile.photoUrl,
        text: trimmed,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, newMsg]);

      if (roomChannelRef.current) {
        broadcastRoomEvent(
          roomChannelRef.current,
          'CHAT_MESSAGE',
          newMsg,
          mySessionUserId
        ).catch(() => {});
      }
    },
    [profile, mySessionUserId]
  );

  // Send interactive emoji reaction in online room
  const sendEmojiReaction = (emoji: string) => {
    setFloatingEmoji({ emoji, id: Date.now() });
    setTimeout(() => setFloatingEmoji(null), 2500);

    if (isOnlineMatchActive && roomChannelRef.current) {
      broadcastRoomEvent(
        roomChannelRef.current,
        'EMOJI_REACTION',
        { emoji },
        mySessionUserId
      ).catch(() => {});
    }
  };

  // Create Online Room (Host)
  const handleCreateRoom = (maxPlayers: number) => {
    if (roomChannelRef.current) {
      leaveRoomChannel(roomChannelRef.current).catch(() => {});
      roomChannelRef.current = null;
    }

    const code = normalizeRoomCode('SNAKE-' + Math.floor(100 + Math.random() * 900));
    setActiveRoomCode(code);
    setIsHost(true);
    setMyOnlinePlayerIndex(0);

    const userPresence: RoomPresenceState = {
      userId: mySessionUserId,
      name: profile.name,
      avatar: profile.photoUrl,
      frame: profile.frame,
      title: profile.title,
      isHost: true,
      joinedAt: Date.now(),
    };

    // Immediately seed connectedRoomPlayers with host presence so it never shows 0 players
    setConnectedRoomPlayers([userPresence]);

    const channel = joinRoomChannel(code, userPresence, {
      onEvent: (event) => handleRemoteRoomEventRef.current(event),
      onPresenceSync: (presences) => {
        setConnectedRoomPlayers((prev) => {
          const map = new Map<string, RoomPresenceState>();
          prev.forEach((p) => map.set(p.userId, p));
          presences.forEach((p) => map.set(p.userId, p));
          if (!map.has(userPresence.userId)) {
            map.set(userPresence.userId, userPresence);
          }
          return Array.from(map.values());
        });
      },
    });

    roomChannelRef.current = channel;
  };

  // Join Online Room (Client)
  const handleJoinRoom = (code: string) => {
    if (roomChannelRef.current) {
      leaveRoomChannel(roomChannelRef.current).catch(() => {});
      roomChannelRef.current = null;
    }

    const formattedCode = normalizeRoomCode(code);
    setActiveRoomCode(formattedCode);
    setIsHost(false);

    const userPresence: RoomPresenceState = {
      userId: mySessionUserId,
      name: profile.name,
      avatar: profile.photoUrl,
      frame: profile.frame,
      title: profile.title,
      isHost: false,
      joinedAt: Date.now(),
    };

    // Immediately seed connectedRoomPlayers with user presence
    setConnectedRoomPlayers([userPresence]);

    const channel = joinRoomChannel(formattedCode, userPresence, {
      onEvent: (event) => handleRemoteRoomEventRef.current(event),
      onPresenceSync: (presences) => {
        setConnectedRoomPlayers((prev) => {
          const map = new Map<string, RoomPresenceState>();
          prev.forEach((p) => map.set(p.userId, p));
          presences.forEach((p) => map.set(p.userId, p));
          if (!map.has(userPresence.userId)) {
            map.set(userPresence.userId, userPresence);
          }
          return Array.from(map.values());
        });
        const myIndex = presences.findIndex((p) => p.userId === mySessionUserId);
        if (myIndex !== -1) {
          setMyOnlinePlayerIndex(myIndex);
        }
      },
    });

    roomChannelRef.current = channel;
  };

  // Start Online Match (Host launches)
  const handleStartOnlineMatch = () => {
    if (!isHost || !roomChannelRef.current || connectedRoomPlayers.length < 2) return;

    // Convert room presences to active game players
    const onlinePlayersList = connectedRoomPlayers.map((p) => ({
      userId: p.userId,
      name: p.name,
      avatar: p.avatar,
      frame: p.frame,
      title: p.title,
    }));

    // Broadcast GAME_START to all connected players
    broadcastRoomEvent(
      roomChannelRef.current,
      'GAME_START',
      { onlinePlayers: onlinePlayersList },
      mySessionUserId
    ).catch(() => {});

    setupOnlineGameSession(onlinePlayersList);
  };

  // Leave room
  const handleLeaveRoom = () => {
    if (roomChannelRef.current) {
      leaveRoomChannel(roomChannelRef.current).catch(() => {});
      roomChannelRef.current = null;
    }
    setActiveRoomCode(null);
    setIsHost(false);
    setIsOnlineMatchActive(false);
    setConnectedRoomPlayers([]);
    setChatMessages([]);
    setIsChatOpen(false);
    setUnreadChatCount(0);
    setActiveChatToast(null);
    handleRestart();
  };

  // Bot auto-roll (in local play only)
  useEffect(() => {
    if (winner || isOnlineMatchActive) return;

    const currentP = activePlayers[activePlayerIndex];
    if (
      currentP &&
      currentP.type === 'bot' &&
      !isRolling &&
      !isMoving &&
      !isExecutingTurn.current
    ) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [activePlayerIndex, activePlayers, isRolling, isMoving, winner, isOnlineMatchActive, handleRollDice]);

  // Spacebar to roll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !isSettingsOpen &&
        !isVictoryOpen &&
        !isProfileOpen &&
        !isOnlineRoomOpen &&
        isMyTurn &&
        currentPlayer.type === 'human'
      ) {
        e.preventDefault();
        handleRollDice();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isVictoryOpen, isProfileOpen, isOnlineRoomOpen, isMyTurn, currentPlayer, handleRollDice]);

  const activeFrame = AVATAR_FRAMES.find((f) => f.id === profile.frame) || AVATAR_FRAMES[1];

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-300 relative select-none ${
        isDark ? 'bg-[#0f0e0d] text-stone-100' : 'bg-[#faf6ee] text-stone-900'
      }`}
    >
      {/* FLOATING EMOJI ANIMATION ON SCREEN */}
      {floatingEmoji && (
        <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 text-6xl animate-bounce drop-shadow-2xl">
          {floatingEmoji.emoji}
        </div>
      )}

      {/* 1. TOP HEADER: Title, Turn Pill, Online Room Indicator & Custom Profile */}
      <header
        className={`flex items-center justify-between px-3 sm:px-6 py-2 border-b transition-colors z-20 ${
          isDark
            ? 'border-stone-800/80 bg-stone-950/80 backdrop-blur-md'
            : 'border-amber-200/70 bg-amber-50/80 backdrop-blur-md'
        }`}
      >
        {/* Brand / Game Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl leading-none">🐍</span>
          <div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight font-display block leading-none">
              Snakes & Ladders
            </span>
            {isOnlineMatchActive && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Room: {activeRoomCode}
              </span>
            )}
          </div>
        </div>

        {/* Current Turn Badge */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            isDark
              ? 'bg-stone-900 border-stone-700/80 text-stone-100'
              : 'bg-white border-amber-300/80 text-stone-900 shadow-xs'
          }`}
        >
          <Goti player={currentPlayer} isActive={false} size={15} />
          <span style={{ color: currentPlayer.color }} className="font-bold">
            {currentPlayer.name}
          </span>
          <span className="opacity-60 text-[11px] font-mono">
            Tile {currentPlayer.position}
          </span>
        </div>

        {/* Top Action Controls: Online Rooms & Gamer Profile */}
        <div className="flex items-center gap-2">
          {/* Online Room Button */}
          <button
            type="button"
            onClick={() => setIsOnlineRoomOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              activeRoomCode
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isDark
                ? 'bg-stone-900/90 border-stone-800 hover:border-amber-400 text-stone-200'
                : 'bg-white border-amber-200 hover:border-amber-400 text-stone-800 shadow-xs'
            }`}
            title="Create or Join Online Multiplayer Room"
          >
            <Globe size={13} className={activeRoomCode ? 'text-emerald-400 animate-spin-slow' : 'text-amber-400'} />
            <span className="hidden sm:inline">
              {activeRoomCode ? 'Room Lobby' : 'Online Room'}
            </span>
          </button>

          {/* Profile Trigger Button with Custom Frame */}
          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isDark
                ? 'bg-stone-900/90 border-stone-800 hover:border-amber-400 text-stone-200'
                : 'bg-white border-amber-200 hover:border-amber-400 text-stone-800 shadow-xs'
            }`}
            title="Player Profile & Customization"
          >
            <div
              className={`w-6 h-6 rounded-full overflow-hidden border-2 ${activeFrame.borderClass} bg-amber-500/20 flex items-center justify-center shrink-0`}
            >
              {profile.photoUrl ? (
                <img
                  src={profile.photoUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User size={13} className="text-amber-400" />
              )}
            </div>
            <span className="text-xs font-bold max-w-[80px] truncate hidden md:inline">
              {profile.name}
            </span>
          </button>
        </div>
      </header>

      {/* 2. PURE GAMEPLAY VIEW: GAME BOARD & SLIM SIDE DICE ARENA */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-2.5 sm:p-5 lg:p-6 gap-5 max-w-6xl w-full mx-auto">
        {/* A. ATTRACTIVE GAME BOARD (Prominent Centerpiece) */}
        <div className="w-full max-w-[590px] lg:max-w-[650px] shrink-0 flex justify-center">
          <Board
            players={activePlayers}
            snakes={snakes}
            ladders={ladders}
            activePlayerId={currentPlayer.id}
            isMoving={isMoving}
            highlightTile={highlightTile}
            isDark={isDark}
            boardTheme={settings.boardTheme || 'classic_wood'}
            gotiStyle={settings.gotiStyle || 'classic_pawn'}
          />
        </div>

        {/* B. SLIM SIDE DICE & GOTI DOCK */}
        <div className="w-full max-w-[210px] sm:max-w-[220px] lg:w-52 shrink-0 flex flex-col items-center gap-2.5">
          {/* Compact 3D Dice Card */}
          <div
            className={`w-full p-3 sm:p-3.5 rounded-2xl border shadow-lg flex flex-col items-center transition-colors ${
              isDark
                ? 'bg-stone-900/90 border-stone-800 shadow-black/50'
                : 'bg-white/95 border-amber-200 shadow-amber-950/10'
            }`}
          >
            {/* Active Turn Header with sculpted Goti */}
            <div className="flex items-center gap-2 w-full mb-1.5 pb-2 border-b border-stone-700/30">
              <Goti
                player={currentPlayer}
                isActive={true}
                size={22}
                gotiStyle={settings.gotiStyle || 'classic_pawn'}
              />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] uppercase font-extrabold tracking-wider opacity-60 block leading-tight">
                  {isOnlineMatchActive
                    ? isMyTurn
                      ? '⭐ Your Turn!'
                      : `${currentPlayer.name}'s Turn`
                    : currentPlayer.type === 'bot'
                    ? 'Bot'
                    : 'Turn'}
                </span>
                <span
                  className="text-xs font-bold truncate block font-display"
                  style={{ color: currentPlayer.color }}
                >
                  {currentPlayer.name}
                </span>
              </div>
              <span className="font-mono text-xs font-extrabold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-500">
                {currentPlayer.position}
              </span>
            </div>

            {/* Compact 3D Rolling Dice */}
            <div className="my-0.5 w-full flex justify-center">
              <Dice3D
                value={diceValue}
                isRolling={isRolling}
                disabled={
                  isMoving ||
                  !!winner ||
                  (isOnlineMatchActive && !isMyTurn) ||
                  (!isOnlineMatchActive && currentPlayer.type === 'bot' && !isRolling)
                }
                onRoll={handleRollDice}
                playerColor={currentPlayer.color}
                size={62}
                diceStyle={settings.diceStyle || 'classic_ivory'}
              />
            </div>

            {/* Event status line */}
            <div className="mt-2 text-center min-h-[28px] flex items-center justify-center px-1">
              <p className="text-[11px] font-medium opacity-75 leading-tight">
                {isRolling
                  ? 'Rolling...'
                  : isMoving
                  ? 'Moving...'
                  : isOnlineMatchActive && !isMyTurn
                  ? `Waiting for ${currentPlayer.name} to roll...`
                  : lastEventText}
              </p>
            </div>

            {/* Quick Interactive Emoji & Chat in Online Matches */}
            {isOnlineMatchActive && (
              <div className="mt-2 pt-2 border-t border-stone-700/30 w-full flex flex-col gap-1.5">
                <div className="flex items-center justify-between w-full px-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                    Reactions
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChatOpen(!isChatOpen);
                      setUnreadChatCount(0);
                    }}
                    className="relative flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
                  >
                    <MessageCircle size={12} />
                    <span>{isChatOpen ? 'Close Chat' : 'Chat'}</span>
                    {unreadChatCount > 0 && !isChatOpen && (
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                        {unreadChatCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-1">
                  {QUICK_EMOJIS.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => sendEmojiReaction(em)}
                      className="p-1 rounded-lg hover:scale-125 transition-transform text-sm cursor-pointer"
                      title={`Send ${em} reaction`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Compact Player Goti Standings Dock */}
          <div
            className={`w-full p-2.5 rounded-2xl border transition-colors flex flex-col gap-1.5 ${
              isDark
                ? 'bg-stone-900/70 border-stone-800/80'
                : 'bg-white/80 border-amber-200/80 shadow-xs'
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 px-1 flex justify-between">
              <span>Gotis</span>
              <span>Tile</span>
            </div>

            {activePlayers.map((p, idx) => {
              const isActive = p.id === currentPlayer.id;
              return (
                <div
                  key={p.id}
                  className={`px-2 py-1 rounded-xl border flex items-center justify-between transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-stone-800/90 border-amber-400/80 ring-1 ring-amber-400/40'
                        : 'bg-amber-100/90 border-amber-400 ring-1 ring-amber-400/40'
                      : isDark
                      ? 'bg-stone-950/40 border-stone-800/60 opacity-80'
                      : 'bg-stone-50 border-stone-200/60 opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Goti
                      player={p}
                      isActive={isActive}
                      size={15}
                      gotiStyle={settings.gotiStyle || 'classic_pawn'}
                    />
                    <span className="text-xs font-bold truncate">
                      {p.name}
                      {isOnlineMatchActive && idx === myOnlinePlayerIndex ? ' (You)' : ''}
                    </span>
                  </div>
                  <span
                    className="text-xs font-extrabold font-mono tabular-nums shrink-0 ml-1"
                    style={{ color: p.color }}
                  >
                    {p.position}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 3. FLOATING SETTINGS BUTTON IN BOTTOM-RIGHT CORNER */}
      <button
        type="button"
        onClick={() => setIsSettingsOpen(true)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 p-2.5 sm:px-3.5 sm:py-2.5 rounded-full shadow-2xl flex items-center gap-2 border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
          isDark
            ? 'bg-stone-900/95 border-amber-500/40 text-stone-200 hover:text-white shadow-black/80 backdrop-blur-md'
            : 'bg-white/95 border-amber-300 text-stone-800 hover:text-stone-950 shadow-amber-950/20 backdrop-blur-md'
        }`}
        title="Settings, Sound, Theme & Reset"
        aria-label="Open Game Settings"
      >
        <Settings size={18} className="text-amber-500" />
        <span className="text-xs font-bold font-display hidden sm:inline">Settings</span>
      </button>

      {/* 4. SETTINGS & RESTART MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        players={players}
        settings={settings}
        onUpdatePlayers={setPlayers}
        onUpdateSettings={handleUpdateSettings}
        onRestartGame={handleRestart}
        isDark={isDark}
        profile={profile}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* 5. GAMER PROFILE & CUSTOMIZATION MODAL */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        isDark={isDark}
      />

      {/* 6. ONLINE MULTIPLAYER ROOM MODAL */}
      <OnlineRoomModal
        isOpen={isOnlineRoomOpen}
        onClose={() => setIsOnlineRoomOpen(false)}
        profile={profile}
        activeRoomCode={activeRoomCode}
        isHost={isHost}
        connectedPlayers={connectedRoomPlayers}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onStartOnlineMatch={handleStartOnlineMatch}
        onLeaveRoom={handleLeaveRoom}
        isDark={isDark}
      />

      {/* 7. IN-GAME FLOATING CHAT DRAWER DURING MATCHES */}
      {isOnlineMatchActive && isChatOpen && (
        <div className="fixed bottom-16 right-4 sm:bottom-20 sm:right-6 z-40 w-80 max-w-[calc(100vw-2rem)] shadow-2xl animate-fade-in">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="absolute top-2 right-2 z-10 p-1 rounded-lg bg-black/40 hover:bg-black/60 text-white cursor-pointer"
              title="Close Chat"
            >
              <X size={14} />
            </button>
            <OnlineChatBox
              messages={chatMessages}
              onSendMessage={handleSendChatMessage}
              currentUser={profile}
              isDark={isDark}
              isCompact={true}
            />
          </div>
        </div>
      )}

      {/* 8. FLOATING CHAT SPEECH BUBBLE TOAST */}
      {activeChatToast && !isChatOpen && (
        <div
          onClick={() => {
            setIsChatOpen(true);
            setUnreadChatCount(0);
            setActiveChatToast(null);
          }}
          className="fixed top-14 left-1/2 -translate-x-1/2 z-40 max-w-sm px-4 py-2 rounded-2xl bg-amber-500 text-stone-950 font-bold text-xs shadow-2xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform animate-bounce"
        >
          <MessageCircle size={15} className="shrink-0" />
          <span className="truncate">
            <strong>{activeChatToast.senderName}:</strong> {activeChatToast.text}
          </span>
          <span className="text-[10px] bg-stone-950/20 px-1.5 py-0.5 rounded font-mono shrink-0">
            Open
          </span>
        </div>
      )}

      {/* 9. VICTORY CELEBRATION MODAL */}
      <VictoryModal
        winner={winner}
        isOpen={isVictoryOpen}
        onRestart={handleRestart}
        onClose={() => setIsVictoryOpen(false)}
        turnsTotal={turnCount}
        isDark={isDark}
      />
    </div>
  );
}
