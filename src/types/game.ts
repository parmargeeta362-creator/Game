export type PlayerType = 'human' | 'bot';

export interface Player {
  id: string;
  name: string;
  color: string; // hex or tailwind identifier
  bgColor: string;
  borderColor: string;
  textColor: string;
  pawnColor: string;
  type: PlayerType;
  position: number; // 1 to 100
  laddersClimbed: number;
  snakesBitten: number;
  rollsCount: number;
  sixesRolled: number;
  avatarIcon: string;
  photoUrl?: string;
  frame?: string; // e.g. 'none', 'gold', 'neon', 'emerald', 'ruby', 'royal'
  title?: string; // e.g. 'Snake Charmer', 'Ladder King'
  onlineUserId?: string; // for multiplayer matching
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  photoUrl: string;
  provider: 'google' | 'guest';
  wins: number;
  gamesPlayed: number;
  frame: string; // avatar border frame
  title: string; // player title / tag
  level: number;
  xp: number;
}

export interface OnlineRoom {
  code: string;
  hostId: string;
  maxPlayers: number;
  status: 'waiting' | 'in_progress' | 'finished';
  players: Player[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: number;
}

export interface RoomBroadcastEvent {
  type:
    | 'PLAYER_JOINED'
    | 'GAME_START'
    | 'ROLL_DICE'
    | 'SYNC_STATE'
    | 'EMOJI_REACTION'
    | 'CHAT_MESSAGE';
  payload: any;
  senderId: string;
  timestamp: number;
}

export interface Snake {
  id: string;
  head: number; // Start tile (higher number)
  tail: number; // End tile (lower number)
  color: string;
}

export interface Ladder {
  id: string;
  bottom: number; // Start tile (lower number)
  top: number; // End tile (higher number)
  color: string;
}

export type WinCondition = 'exact_bounce' | 'exact_stay' | 'reach_or_pass';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface GameSettings {
  playerCount: number;
  extraRollOnSix: boolean;
  winCondition: WinCondition;
  moveSpeedMs: number; // duration per step
  soundEnabled: boolean;
  theme: ThemeMode;
}

export interface GameLogEntry {
  id: string;
  turnNumber: number;
  playerId: string;
  playerName: string;
  playerColor: string;
  diceRoll: number;
  fromPosition: number;
  toPosition: number;
  eventType: 'roll' | 'step' | 'ladder' | 'snake' | 'bounce' | 'extra_turn' | 'win';
  message: string;
  timestamp: Date;
}

export type GamePhase = 'setup' | 'playing' | 'animating' | 'game_over';
