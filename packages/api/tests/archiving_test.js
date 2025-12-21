import { createClient } from 'redis';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testArchiving() {
  console.log('--- Starting Durable History Test ---');
  
  const redis = createClient({ url: REDIS_URL });
  await redis.connect();
  
  const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  const sessionCode = 'ARCHIVE-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  console.log(`Using session code: ${sessionCode}`);
  
  // 1. Create session data and history
  await redis.set(`session:${sessionCode}`, 'active', { EX: 5 }); // 5 second TTL
  
  const historyKey = `session:${sessionCode}:messages`;
  const testMessages = [
    { text: 'Hello World', timestamp: Date.now(), senderType: 'controller' },
    { text: 'Testing Archiving', timestamp: Date.now() + 100, senderType: 'controller' }
  ];
  
  for (const msg of testMessages) {
    await redis.lPush(historyKey, JSON.stringify(msg));
  }
  
  console.log('Session and history created in Redis.');
  
  // 2. Wait for expiration (worker should archive)
  console.log('Waiting 10 seconds for expiration and worker processing...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // 3. Verify data is in Supabase
  console.log('Checking Supabase for archived history...');
  const { data, error } = await supabase
    .from('session_history')
    .select('*')
    .eq('session_code', sessionCode)
    .single();
    
  if (error) {
    console.error('FAILED: Could not find archived history in Supabase', error);
    process.exit(1);
  }
  
  if (data && data.messages && data.messages.length === 2) {
    console.log('SUCCESS: History was archived to Supabase!');
    console.log('Archived messages:', data.messages);
  } else {
    console.error('FAILED: Archived history is incorrect or missing messages');
    process.exit(1);
  }
  
  await redis.quit();
}

testArchiving().catch(console.error);
