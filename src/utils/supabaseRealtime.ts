import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { Player, RoomBroadcastEvent } from '../types/game';

export interface RoomPresenceState {
  userId: string;
  name: string;
  avatar: string;
  frame?: string;
  title?: string;
  isHost: boolean;
  joinedAt: number;
}

/**
 * Normalizes any user-entered room code:
 * - "452" -> "SNAKE-452"
 * - "snake 452" -> "SNAKE-452"
 * - "snake-452" -> "SNAKE-452"
 * - "SNAKE452" -> "SNAKE-452"
 */
export function normalizeRoomCode(code: string): string {
  if (!code) return '';
  const cleaned = code.trim().toUpperCase().replace(/\s+/g, '');
  if (/^\d{3,4}$/.test(cleaned)) {
    return `SNAKE-${cleaned}`;
  }
  if (/^SNAKE\d{3,4}$/.test(cleaned)) {
    return `SNAKE-${cleaned.replace('SNAKE', '')}`;
  }
  if (!cleaned.startsWith('SNAKE-') && /^\w+-\d+$/.test(cleaned)) {
    return cleaned;
  }
  return cleaned;
}

/**
 * Join or create a Supabase Realtime Channel for a game room
 */
export function joinRoomChannel(
  rawRoomCode: string,
  userPresence: RoomPresenceState,
  callbacks: {
    onEvent: (event: RoomBroadcastEvent) => void;
    onPresenceSync: (presences: RoomPresenceState[]) => void;
    onStatusChange?: (status: string) => void;
  }
): RealtimeChannel {
  const roomCode = normalizeRoomCode(rawRoomCode);
  const channelName = `snake-room-${roomCode}`;

  // Clean up existing registered channel with this topic if any
  try {
    const existing = supabase
      .getChannels()
      .find((c) => c.topic === `realtime:${channelName}` || c.topic === channelName);
    if (existing) {
      supabase.removeChannel(existing);
    }
  } catch {}

  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
      presence: { key: userPresence.userId },
    },
  });

  // Helper to extract and deduplicate active room users
  const syncPresence = () => {
    try {
      const state = channel.presenceState();
      const activeUsers: RoomPresenceState[] = [];
      const seen = new Set<string>();

      Object.values(state).forEach((presenceArray) => {
        if (Array.isArray(presenceArray)) {
          presenceArray.forEach((p: any) => {
            if (p && p.userId && !seen.has(p.userId)) {
              seen.add(p.userId);
              activeUsers.push(p as RoomPresenceState);
            }
          });
        }
      });

      // Always guarantee current user is included in presence
      if (!seen.has(userPresence.userId)) {
        activeUsers.unshift(userPresence);
      }

      callbacks.onPresenceSync(activeUsers);
    } catch (err) {
      console.warn('Error reading presence state:', err);
      callbacks.onPresenceSync([userPresence]);
    }
  };

  // 1. Listen for broadcast events (dice rolls, player moves, game start, chat, emojis)
  channel.on(
    'broadcast',
    { event: 'GAME_EVENT' },
    (response: { payload: RoomBroadcastEvent }) => {
      if (response && response.payload) {
        callbacks.onEvent(response.payload);
      }
    }
  );

  // 2. Track online presence in room on sync, join and leave events
  channel.on('presence', { event: 'sync' }, syncPresence);
  channel.on('presence', { event: 'join' }, syncPresence);
  channel.on('presence', { event: 'leave' }, syncPresence);

  // Immediately invoke with self so room list never shows 0 players
  callbacks.onPresenceSync([userPresence]);

  // Subscribe to channel and track presence
  channel.subscribe(async (status) => {
    callbacks.onStatusChange?.(status);
    if (status === 'SUBSCRIBED') {
      try {
        await channel.track(userPresence);
      } catch (err) {
        console.warn('Presence track error:', err);
      }

      // Broadcast join event in multi-waves to guarantee instant peer discovery
      const sendJoin = async () => {
        try {
          await broadcastRoomEvent(channel, 'PLAYER_JOINED', userPresence, userPresence.userId);
        } catch {}
      };

      await sendJoin();
      setTimeout(sendJoin, 300);
      setTimeout(sendJoin, 900);
    }
  });

  return channel;
}

/**
 * Broadcast an event to all players in the room
 */
export async function broadcastRoomEvent(
  channel: RealtimeChannel,
  type: RoomBroadcastEvent['type'],
  payload: any,
  senderId: string
): Promise<void> {
  const eventData: RoomBroadcastEvent = {
    type,
    payload,
    senderId,
    timestamp: Date.now(),
  };

  await channel.send({
    type: 'broadcast',
    event: 'GAME_EVENT',
    payload: eventData,
  });
}

/**
 * Leave and clean up room channel
 */
export async function leaveRoomChannel(channel: RealtimeChannel | null): Promise<void> {
  if (channel) {
    try {
      await channel.untrack();
    } catch {}
    try {
      await supabase.removeChannel(channel);
    } catch {}
  }
}
