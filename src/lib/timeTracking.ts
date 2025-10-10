import { supabase } from './supabase';
import type { ActivityTimeEntry, UserTimeStats } from '../types';

export async function startActivityTimer(activityId: string, userId: string): Promise<ActivityTimeEntry | null> {
  try {
    const existingActive = await supabase
      .from('activity_time_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (existingActive.data) {
      await stopActivityTimer(existingActive.data.id, userId);
    }

    const { data, error } = await supabase
      .from('activity_time_entries')
      .insert({
        activity_id: activityId,
        user_id: userId,
        started_at: new Date().toISOString(),
        is_active: true,
        duration_seconds: 0
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      activityId: data.activity_id,
      userId: data.user_id,
      startedAt: new Date(data.started_at),
      endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
      durationSeconds: data.duration_seconds,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error starting timer:', error);
    return null;
  }
}

export async function stopActivityTimer(entryId: string, userId: string): Promise<ActivityTimeEntry | null> {
  try {
    const { data: currentEntry } = await supabase
      .from('activity_time_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();

    if (!currentEntry || !currentEntry.is_active) return null;

    const startedAt = new Date(currentEntry.started_at);
    const endedAt = new Date();
    const elapsedSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
    const totalSeconds = currentEntry.duration_seconds + elapsedSeconds;

    const { data, error } = await supabase
      .from('activity_time_entries')
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: totalSeconds,
        is_active: false
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      activityId: data.activity_id,
      userId: data.user_id,
      startedAt: new Date(data.started_at),
      endedAt: new Date(data.ended_at),
      durationSeconds: data.duration_seconds,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error stopping timer:', error);
    return null;
  }
}

export async function pauseActivityTimer(entryId: string, userId: string): Promise<ActivityTimeEntry | null> {
  try {
    const { data: currentEntry } = await supabase
      .from('activity_time_entries')
      .select('*')
      .eq('id', entryId)
      .eq('user_id', userId)
      .single();

    if (!currentEntry || !currentEntry.is_active) return null;

    const startedAt = new Date(currentEntry.started_at);
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
    const totalSeconds = currentEntry.duration_seconds + elapsedSeconds;

    const { data, error } = await supabase
      .from('activity_time_entries')
      .update({
        duration_seconds: totalSeconds,
        is_active: false
      })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      activityId: data.activity_id,
      userId: data.user_id,
      startedAt: new Date(data.started_at),
      endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
      durationSeconds: data.duration_seconds,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error pausing timer:', error);
    return null;
  }
}

export async function resumeActivityTimer(activityId: string, userId: string): Promise<ActivityTimeEntry | null> {
  try {
    const { data: lastEntry } = await supabase
      .from('activity_time_entries')
      .select('*')
      .eq('activity_id', activityId)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastEntry && !lastEntry.is_active && !lastEntry.ended_at) {
      const { data, error } = await supabase
        .from('activity_time_entries')
        .update({
          started_at: new Date().toISOString(),
          is_active: true
        })
        .eq('id', lastEntry.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        activityId: data.activity_id,
        userId: data.user_id,
        startedAt: new Date(data.started_at),
        endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
        durationSeconds: data.duration_seconds,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    }

    return startActivityTimer(activityId, userId);
  } catch (error) {
    console.error('Error resuming timer:', error);
    return null;
  }
}

export async function getActivityTimeStats(activityId: string): Promise<UserTimeStats[]> {
  try {
    const { data: entries, error } = await supabase
      .from('activity_time_entries')
      .select(`
        *,
        users!inner(id, name)
      `)
      .eq('activity_id', activityId);

    if (error) throw error;

    const userStatsMap = new Map<string, UserTimeStats>();

    for (const entry of entries || []) {
      const userId = entry.user_id;
      const userName = entry.users.name;

      if (!userStatsMap.has(userId)) {
        userStatsMap.set(userId, {
          userId,
          userName,
          totalSeconds: 0,
          activeEntry: undefined
        });
      }

      const stats = userStatsMap.get(userId)!;

      if (entry.is_active) {
        const startedAt = new Date(entry.started_at);
        const now = new Date();
        const currentSessionSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
        stats.totalSeconds += entry.duration_seconds + currentSessionSeconds;
        stats.activeEntry = {
          id: entry.id,
          activityId: entry.activity_id,
          userId: entry.user_id,
          startedAt: new Date(entry.started_at),
          endedAt: entry.ended_at ? new Date(entry.ended_at) : undefined,
          durationSeconds: entry.duration_seconds,
          isActive: entry.is_active,
          createdAt: new Date(entry.created_at),
          updatedAt: new Date(entry.updated_at)
        };
      } else {
        stats.totalSeconds += entry.duration_seconds;
      }
    }

    return Array.from(userStatsMap.values());
  } catch (error) {
    console.error('Error getting activity time stats:', error);
    return [];
  }
}

export async function getUserActiveTimer(userId: string): Promise<ActivityTimeEntry | null> {
  try {
    const { data, error } = await supabase
      .from('activity_time_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      activityId: data.activity_id,
      userId: data.user_id,
      startedAt: new Date(data.started_at),
      endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
      durationSeconds: data.duration_seconds,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error('Error getting user active timer:', error);
    return null;
  }
}

export function formatTimeDisplay(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
