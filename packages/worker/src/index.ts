import dotenv from 'dotenv';
import { createClient } from 'redis';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) 
  ? createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

async function bootstrap() {
  console.log('[Worker] Starting background processor...');

  // 1. Create Redis client for general operations
  const redis = createClient({ url: REDIS_URL });
  redis.on('error', (err) => console.error('[Worker] Redis Error:', err));
  await redis.connect();

  // 2. Enable Keyspace Notifications (Ex = Expired events)
  // This ensures Redis emits events when keys expire
  try {
    await redis.configSet('notify-keyspace-events', 'Ex');
    console.log('[Worker] ✓ Redis keyspace notifications enabled (Ex)');
  } catch (error) {
    console.warn('[Worker] ⚠ Could not set notify-keyspace-events. Ensure Redis user has CONFIG permissions.');
  }

  // 3. Create Subscriber client for keyspace events
  const subscriber = redis.duplicate();
  await subscriber.connect();

  // 4. Subscribe to expired events
  // Pattern: __keyevent@<db>__:expired
  const expiredPattern = '__keyevent@0__:expired';
  
  await subscriber.subscribe(expiredPattern, async (key) => {
    console.log(`[Worker] Key expired: ${key}`);
    
    // Handle session expiration
    if (key.startsWith('session:')) {
      const sessionCode = key.split(':')[1];
      await handleSessionCleanup(redis, sessionCode);
    }
  });

  console.log(`[Worker] Listening for expired events on ${expiredPattern}`);
}

/**
 * Cleanup logic for expired sessions
 */
async function handleSessionCleanup(redis: any, sessionCode: string) {
  console.log(`[Worker] Cleaning up session: ${sessionCode}`);
  
  try {
    // 1. Archive history data to Supabase before deleting
    const historyKey = `session:${sessionCode}:messages`;
    const rawMessages = await redis.lRange(historyKey, 0, -1);
    
    if (rawMessages && rawMessages.length > 0 && supabase) {
      console.log(`[Worker] Archiving ${rawMessages.length} messages for session ${sessionCode}`);
      const messages = rawMessages.map((msg: string) => JSON.parse(msg));
      
      const { error } = await supabase
        .from('session_history')
        .insert({
          session_code: sessionCode,
          messages: messages,
          archived_at: new Date().toISOString()
        });
        
      if (error) {
        console.error(`[Worker] Failed to archive history for ${sessionCode}:`, error);
      } else {
        console.log(`[Worker] ✓ History archived for ${sessionCode}`);
      }
    }

    // 2. Remove presence data
    const presenceKey = `presence:${sessionCode}`;
    await redis.del(presenceKey);
    
    // 3. Remove history data from Redis
    await redis.del(historyKey);
    
    // 4. Notify API instances via Pub/Sub so they can disconnect sockets
    // We publish to a global system channel so all API instances receive it
    const systemChannel = 'system:events';
    const systemPayload = JSON.stringify({
      type: 'session:expired',
      timestamp: Date.now(),
      data: { sessionCode }
    });
    
    await redis.publish(systemChannel, systemPayload);
    
    // Also publish to session-specific channel for any direct listeners
    const sessionChannel = `session:${sessionCode}:status`;
    const sessionPayload = JSON.stringify({
      type: 'expired',
      timestamp: Date.now(),
      data: { sessionCode }
    });
    
    await redis.publish(sessionChannel, sessionPayload);
    
    console.log(`[Worker] ✓ Cleanup complete for ${sessionCode}`);
  } catch (error) {
    console.error(`[Worker] Cleanup failed for ${sessionCode}:`, error);
  }
}

bootstrap().catch((err) => {
  console.error('[Worker] Bootstrap failed:', err);
  process.exit(1);
});
