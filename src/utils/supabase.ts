import { createClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { UserProfile } from '../types/game';

export const SUPABASE_PROJECT_ID = 'hltwjzyifbqyzijrsrol';
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_LvrXk6yD1p0dVVSs6RNLNA_D0SexQB_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const SUPABASE_SCHEMA_SQL = `-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor) if table doesn't exist:
CREATE TABLE IF NOT EXISTS player_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  photo_url TEXT,
  provider TEXT DEFAULT 'guest',
  wins INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  frame TEXT DEFAULT 'gold',
  title TEXT DEFAULT 'Snake Charmer',
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;

-- Allow public read & write for player profiles
CREATE POLICY "Allow public read and write on player_profiles"
ON player_profiles FOR ALL
USING (true)
WITH CHECK (true);
`;

/**
 * Trigger Google OAuth Sign-in with Supabase
 */
export async function signInWithGoogleOAuth(): Promise<{
  error?: string;
  url?: string;
}> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        skipBrowserRedirect: true, // Prevent browser redirect to raw 400 JSON error
      },
    });

    if (error) {
      return { error: error.message };
    }
    return { url: data?.url };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Sign out user from Supabase
 */
export async function signOutUser(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Get current active session
 */
export async function getSupabaseSession(): Promise<Session | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Fetch a player profile from Supabase
 */
export async function fetchPlayerProfile(id: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      // Optional remote profile lookup fallback
      return null;
    }

    if (data) {
      return {
        id: data.id,
        name: data.name,
        email: data.email || undefined,
        photoUrl: data.photo_url || '',
        provider: (data.provider as 'google' | 'guest') || 'guest',
        wins: Number(data.wins) || 0,
        gamesPlayed: Number(data.games_played) || 0,
        frame: data.frame || 'gold',
        title: data.title || 'Snake Charmer',
        level: Number(data.level) || 1,
        xp: Number(data.xp) || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save or update a player profile in Supabase
 */
export async function savePlayerProfile(
  profile: UserProfile
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: profile.id,
      name: profile.name,
      email: profile.email || null,
      photo_url: profile.photoUrl || null,
      provider: profile.provider || 'guest',
      wins: profile.wins || 0,
      games_played: profile.gamesPlayed || 0,
      frame: profile.frame || 'gold',
      title: profile.title || 'Snake Charmer',
      level: profile.level || 1,
      xp: profile.xp || 0,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('player_profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save notice:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Supabase save exception:', message);
    return { success: false, error: message };
  }
}

/**
 * Quick ping to verify Supabase connectivity
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    const { error } = await supabase.from('player_profiles').select('id').limit(1);
    if (error) {
      // Table doesn't exist error (42P01 in postgres)
      if (error.code === '42P01') {
        return {
          connected: true,
          message: 'Connected to Supabase project! (Table player_profiles needs setup SQL)',
        };
      }
      return {
        connected: false,
        message: error.message,
      };
    }
    return {
      connected: true,
      message: 'Connected & synced with Supabase player_profiles table.',
    };
  } catch (err) {
    return {
      connected: false,
      message: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}
