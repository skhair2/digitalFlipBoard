import { SupabaseClient } from '@supabase/supabase-js';
import { RedisClientType } from 'redis';

/**
 * ScheduleProcessor - Handles polling and triggering of scheduled messages
 */
export class ScheduleProcessor {
  private supabase: SupabaseClient;
  private redis: RedisClientType;
  private interval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(supabase: SupabaseClient, redis: RedisClientType) {
    this.supabase = supabase;
    this.redis = redis;
  }

  /**
   * Start the polling loop
   * @param intervalMs - Polling interval in milliseconds (default: 30s)
   */
  start(intervalMs = 30000) {
    console.log(`[Scheduler] Starting polling loop every ${intervalMs}ms`);
    this.interval = setInterval(() => this.processSchedules(), intervalMs);
    // Run immediately on start
    this.processSchedules();
  }

  /**
   * Stop the polling loop
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Main processing logic
   */
  private async processSchedules() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date().toISOString();
      
      // 1. Fetch pending messages that are due
      const { data: dueMessages, error: fetchError } = await this.supabase
        .from('scheduled_messages')
        .select('*, boards(id)')
        .eq('status', 'pending')
        .lte('scheduled_time', now);

      if (fetchError) {
        console.error('[Scheduler] Error fetching due messages:', fetchError);
        return;
      }

      if (!dueMessages || dueMessages.length === 0) {
        return;
      }

      console.log(`[Scheduler] Found ${dueMessages.length} due messages`);

      for (const msg of dueMessages) {
        await this.triggerMessage(msg);
      }
    } catch (error) {
      console.error('[Scheduler] Unexpected error in processSchedules:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Trigger a single scheduled message
   */
  private async triggerMessage(msg: any) {
    const { id, board_id, content, layout, metadata } = msg;

    try {
      // 1. Find active session for this board
      const { data: session, error: sessionError } = await this.supabase
        .from('display_sessions')
        .select('session_code')
        .eq('board_id', board_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError || !session) {
        console.warn(`[Scheduler] No active session found for board ${board_id}. Skipping message ${id}.`);
        return;
      }

      const sessionCode = session.session_code;
      console.log(`[Scheduler] Triggering message for session ${sessionCode}: "${content}"`);

      // 2. Publish to Redis system channel
      const systemChannel = 'system:events';
      const payload = JSON.stringify({
        type: 'message:broadcast',
        timestamp: Date.now(),
        data: {
          sessionCode,
          content,
          layout,
          animation: metadata?.animation || 'flip',
          color: metadata?.color || 'monochrome',
          metadata: metadata || {},
          source: 'scheduler'
        }
      });

      await this.redis.publish(systemChannel, payload);

      // 3. Update status in Supabase
      const { error: updateError } = await this.supabase
        .from('scheduled_messages')
        .update({ status: 'sent' })
        .eq('id', id);

      if (updateError) {
        console.error(`[Scheduler] Failed to update status for message ${id}:`, updateError);
      } else {
        console.log(`[Scheduler] ✓ Message ${id} marked as sent`);
      }
    } catch (error) {
      console.error(`[Scheduler] Error triggering message ${id}:`, error);
      
      await this.supabase
        .from('scheduled_messages')
        .update({ status: 'failed' })
        .eq('id', id);
    }
  }
}
