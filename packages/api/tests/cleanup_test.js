import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function testCleanup() {
  console.log('--- Starting Cleanup Test ---');
  
  const redis = createClient({ url: REDIS_URL });
  await redis.connect();
  
  const sessionCode = 'TEST-' + Math.random().toString(36).substring(2, 7).toUpperCase();
  console.log(`Using session code: ${sessionCode}`);
  
  // 1. Create session data
  await redis.set(`session:${sessionCode}`, 'active', { EX: 5 }); // 5 second TTL
  await redis.hSet(`presence:${sessionCode}`, 'display-1', JSON.stringify({ lastSeen: Date.now() }));
  await redis.rPush(`history:${sessionCode}`, JSON.stringify({ type: 'test', data: 'hello' }));
  
  console.log('Session data created with 5s TTL.');
  
  // 2. Verify data exists
  const presenceExists = await redis.exists(`presence:${sessionCode}`);
  const historyExists = await redis.exists(`history:${sessionCode}`);
  console.log(`Presence exists: ${!!presenceExists}`);
  console.log(`History exists: ${!!historyExists}`);
  
  if (!presenceExists || !historyExists) {
    console.error('FAILED: Initial data not found');
    process.exit(1);
  }
  
  // 3. Wait for expiration
  console.log('Waiting 7 seconds for expiration...');
  await new Promise(resolve => setTimeout(resolve, 7000));
  
  // 4. Verify data is cleaned up
  const presenceStillExists = await redis.exists(`presence:${sessionCode}`);
  const historyStillExists = await redis.exists(`history:${sessionCode}`);
  
  console.log(`Presence still exists: ${!!presenceStillExists}`);
  console.log(`History still exists: ${!!historyStillExists}`);
  
  if (!presenceStillExists && !historyStillExists) {
    console.log('SUCCESS: Data was cleaned up by worker!');
  } else {
    console.error('FAILED: Data was NOT cleaned up');
    process.exit(1);
  }
  
  await redis.quit();
}

testCleanup().catch(console.error);
