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
 * Join or create a Supabase Realtime Channel for a game room
 */
export function joinRoomChannel(
  roomCode: string,
  userPresence: RoomPresenceState,
  callbacks: {
    onEvent: (event: RoomBroadcastEvent) => void;
    onPresenceSync: (presences: RoomPresenceState[]) => void;
    onStatusChange?: (status: string) => void;
  }
): RealtimeChannel {
  const channelName = `snake-room-${roomCode.trim().toUpperCase()}`;

  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false },
      presence: { key: userPresence.userId },
    },
  });

  // 1. Listen for broadcast events (dice rolls, player moves, game start, emojis)
  channel.on(
    'broadcast',
    { event: 'GAME_EVENT' },
    (response: { payload: RoomBroadcastEvent }) => {
      if (response && response.payload) {
        callbacks.onEvent(response.payload);
      }
    }
  );

  // 2. Track online presence in room
  channel.on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    const activeUsers: RoomPresenceState[] = [];

    Object.values(state).forEach((presenceArray) => {
      if (Array.isArray(presenceArray)) {
        presenceArray.forEach((p) => {
          activeUsers.push(p as unknown as RoomPresenceState);
        });
      }
    });

    callbacks.onPresenceSync(activeUsers);
  });

  // Subscribe to channel and track presence
  channel.subscribe(async (status) => {
    callbacks.onStatusChange?.(status);
    if (status === 'SUBSCRIBED') {
      await channel.track(userPresence);
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
    await channel.untrack();
    await supabase.removeChannel(channel);
  }
}
