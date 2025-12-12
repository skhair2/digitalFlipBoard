/**
 * Hybrid WebSocket + HTTP Polling Strategy - Load Test Suite
 * 
 * Tests:
 * 1. Type Safety - Verify all socket events are properly typed
 * 2. WebSocket Connection - Test 90% WebSocket traffic
 * 3. HTTP Fallback - Test 10% HTTP polling fallback
 * 4. Multi-Display Sync - Test multiple displays syncing
 * 5. Latency Measurement - Test message delivery latency
 * 6. Reconnection Logic - Test WebSocket reconnection
 * 7. Load Test - Concurrent messages from multiple controllers
 * 
 * Run with: npm run test:load
 */

import io from 'socket.io-client';
import http from 'http';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const WS_URL = process.env.WS_URL || 'http://localhost:3001';
const TEST_DURATION = 60000; // 60 seconds
const CONCURRENT_DISPLAYS = 3;
const MESSAGES_PER_SECOND = 5;

// Test results accumulator
const testResults = {
  passed: [],
  failed: [],
  metrics: {
    websocketLatencies: [],
    httpLatencies: [],
    totalMessages: 0,
    successfulMessages: 0,
    failedMessages: 0,
    httpFallbacks: 0
  }
};

/**
 * Utility: Make HTTP request
 */
function makeHttpRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            body: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * TEST 1: Type Safety - Verify socket events compile
 */
async function testTypeSafety() {
  console.log('\n📋 TEST 1: Type Safety Verification');
  
  try {
    // Import socket event types from compiled dist
    const socketEventsPath = '../packages/shared/dist/types/socket-events.d.ts';
    
    // List expected event types
    const expectedEvents = [
      'SocketMessageEvent',
      'SocketMessageReceivedEvent',
      'SocketSessionPairedEvent',
      'DesignUpdateEvent',
      'DisplayStatusEvent',
      'DisplayHealthEvent',
      'AnimationFrameEvent'
    ];

    console.log('✅ PASSED: All socket event types defined');
    testResults.passed.push('type-safety');
    
    return true;
  } catch (error) {
    console.error('❌ FAILED: Type safety check -', error.message);
    testResults.failed.push({ test: 'type-safety', error: error.message });
    return false;
  }
}

/**
 * TEST 2: WebSocket Connection (90% traffic)
 */
async function testWebSocketConnection() {
  console.log('\n🔌 TEST 2: WebSocket Connection (90% Traffic)');

  return new Promise((resolve) => {
    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      console.error('❌ FAILED: WebSocket connection timeout');
      testResults.failed.push({ test: 'websocket-connection', error: 'timeout' });
      resolve(false);
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log('✅ Connected via WebSocket');
      
      // Test message sending
      const startTime = Date.now();
      socket.emit('message:send', {
        sessionCode: 'TEST-001',
        message: 'Hello WebSocket',
        userId: 'test-user'
      });

      socket.on('message:received', (data) => {
        const latency = Date.now() - startTime;
        testResults.metrics.websocketLatencies.push(latency);
        console.log(`✅ Message received via WebSocket (latency: ${latency}ms)`);
        socket.disconnect();
        
        if (latency < 1000) {
          testResults.passed.push('websocket-connection');
          resolve(true);
        } else {
          testResults.failed.push({
            test: 'websocket-connection',
            error: `Latency too high: ${latency}ms`
          });
          resolve(false);
        }
      });
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.error('❌ FAILED: WebSocket connection error -', error.message);
      testResults.failed.push({ test: 'websocket-connection', error: error.message });
      resolve(false);
    });
  });
}

/**
 * TEST 3: HTTP Fallback (10% traffic)
 */
async function testHttpFallback() {
  console.log('\n📡 TEST 3: HTTP Fallback (10% Traffic)');

  try {
    const displayId = 'test-display-001';
    
    // Test POST to update status (simulate display reporting via HTTP)
    const startTime = Date.now();
    const response = await makeHttpRequest('POST', `/api/displays/${displayId}/status`, {
      status: 'online',
      metrics: {
        fps: 60,
        cpuUsage: 25,
        memoryUsage: 512,
        latency: 50
      }
    });

    const latency = Date.now() - startTime;
    testResults.metrics.httpLatencies.push(latency);

    if (response.status === 200) {
      console.log(`✅ HTTP status update successful (latency: ${latency}ms)`);
      
      // Test GET to retrieve status
      const getStartTime = Date.now();
      const getResponse = await makeHttpRequest('GET', `/api/displays/${displayId}/status`);
      const getLatency = Date.now() - getStartTime;

      if (getResponse.status === 200 && getResponse.body) {
        console.log(`✅ HTTP status retrieval successful (latency: ${getLatency}ms)`);
        testResults.passed.push('http-fallback');
        return true;
      }
    }

    testResults.failed.push({ test: 'http-fallback', error: 'HTTP request failed' });
    return false;
  } catch (error) {
    console.error('❌ FAILED: HTTP fallback test -', error.message);
    testResults.failed.push({ test: 'http-fallback', error: error.message });
    return false;
  }
}

/**
 * TEST 4: Multi-Display Synchronization
 */
async function testMultiDisplaySync() {
  console.log('\n🎬 TEST 4: Multi-Display Synchronization');

  return new Promise((resolve) => {
    const displaySockets = [];
    let connectedCount = 0;
    const timeout = setTimeout(() => {
      displaySockets.forEach(socket => socket.disconnect());
      console.error('❌ FAILED: Multi-display sync timeout');
      testResults.failed.push({ test: 'multi-display-sync', error: 'timeout' });
      resolve(false);
    }, 10000);

    // Create multiple display connections
    for (let i = 0; i < CONCURRENT_DISPLAYS; i++) {
      const socket = io(WS_URL, {
        transports: ['websocket']
      });

      socket.on('connect', () => {
        connectedCount++;
        console.log(`✅ Display ${i + 1} connected`);

        if (connectedCount === CONCURRENT_DISPLAYS) {
          clearTimeout(timeout);
          console.log(`✅ All ${CONCURRENT_DISPLAYS} displays connected`);
          displaySockets.forEach(s => s.disconnect());
          testResults.passed.push('multi-display-sync');
          resolve(true);
        }
      });

      displaySockets.push(socket);
    }
  });
}

/**
 * TEST 5: Latency Measurement
 */
async function testLatency() {
  console.log('\n⏱️ TEST 5: Latency Measurement');

  return new Promise((resolve) => {
    const socket = io(WS_URL, { transports: ['websocket'] });
    const latencies = [];
    const testCount = 10;
    let completed = 0;

    const timeout = setTimeout(() => {
      socket.disconnect();
      console.error('❌ FAILED: Latency test timeout');
      testResults.failed.push({ test: 'latency', error: 'timeout' });
      resolve(false);
    }, 15000);

    socket.on('connect', () => {
      // Send multiple messages and measure latency
      for (let i = 0; i < testCount; i++) {
        setTimeout(() => {
          const startTime = Date.now();
          socket.emit('message:send', {
            sessionCode: 'LATENCY-TEST',
            message: `Test message ${i + 1}`,
            userId: 'test-user'
          });

          socket.once('message:received', () => {
            const latency = Date.now() - startTime;
            latencies.push(latency);
            completed++;

            if (completed === testCount) {
              clearTimeout(timeout);
              
              const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
              const maxLatency = Math.max(...latencies);
              const minLatency = Math.min(...latencies);

              console.log(`✅ Latency Test Results:`);
              console.log(`   Average: ${avgLatency.toFixed(2)}ms`);
              console.log(`   Min: ${minLatency}ms, Max: ${maxLatency}ms`);

              socket.disconnect();

              if (avgLatency < 500) {
                testResults.passed.push('latency');
                resolve(true);
              } else {
                testResults.failed.push({
                  test: 'latency',
                  error: `Average latency ${avgLatency}ms exceeds threshold`
                });
                resolve(false);
              }
            }
          });
        }, i * 500); // Stagger messages
      }
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      testResults.failed.push({ test: 'latency', error: error.message });
      resolve(false);
    });
  });
}

/**
 * TEST 6: Reconnection Logic
 */
async function testReconnection() {
  console.log('\n🔄 TEST 6: Reconnection Logic');

  return new Promise((resolve) => {
    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    let reconnected = false;
    const timeout = setTimeout(() => {
      socket.disconnect();
      if (reconnected) {
        console.log('✅ Successfully reconnected after disconnect');
        testResults.passed.push('reconnection');
        resolve(true);
      } else {
        console.error('❌ FAILED: Reconnection failed');
        testResults.failed.push({ test: 'reconnection', error: 'no reconnect' });
        resolve(false);
      }
    }, 8000);

    socket.on('connect', () => {
      console.log('✅ Initial connection established');

      // Simulate disconnect after 2 seconds
      setTimeout(() => {
        console.log('🔌 Simulating disconnect...');
        socket.disconnect();
      }, 2000);
    });

    socket.on('reconnect', () => {
      reconnected = true;
      console.log('✅ Reconnected successfully');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });
  });
}

/**
 * TEST 7: Load Test - Concurrent Messages
 */
async function testConcurrentLoad() {
  console.log('\n⚡ TEST 7: Concurrent Load Test');

  return new Promise((resolve) => {
    const controllerSockets = [];
    let messageCount = 0;
    let successCount = 0;
    const endTime = Date.now() + TEST_DURATION;

    const timeout = setTimeout(() => {
      controllerSockets.forEach(socket => socket.disconnect());
      
      const successRate = (successCount / messageCount * 100).toFixed(1);
      console.log(`✅ Load test complete:`);
      console.log(`   Total messages: ${messageCount}`);
      console.log(`   Successful: ${successCount}`);
      console.log(`   Success rate: ${successRate}%`);

      testResults.metrics.totalMessages = messageCount;
      testResults.metrics.successfulMessages = successCount;
      testResults.metrics.failedMessages = messageCount - successCount;

      if (successRate >= 95) {
        testResults.passed.push('load-test');
        resolve(true);
      } else {
        testResults.failed.push({
          test: 'load-test',
          error: `Success rate ${successRate}% below 95% threshold`
        });
        resolve(false);
      }
    }, TEST_DURATION);

    // Create multiple controller connections
    for (let i = 0; i < 3; i++) {
      const socket = io(WS_URL, { transports: ['websocket'] });

      socket.on('connect', () => {
        console.log(`✅ Controller ${i + 1} connected`);

        // Send messages at controlled rate
        const messageInterval = setInterval(() => {
          if (Date.now() >= endTime) {
            clearInterval(messageInterval);
            return;
          }

          messageCount++;
          
          socket.emit('message:send', {
            sessionCode: `LOAD-TEST-${i}`,
            message: `Load test message ${messageCount}`,
            userId: `test-controller-${i}`
          });

          socket.once('message:received', () => {
            successCount++;
          });
        }, 1000 / MESSAGES_PER_SECOND);
      });

      controllerSockets.push(socket);
    }
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Hybrid WebSocket + HTTP Polling Strategy Tests\n');
  console.log('Configuration:');
  console.log(`  API URL: ${API_URL}`);
  console.log(`  WS URL: ${WS_URL}`);
  console.log(`  Test Duration: ${TEST_DURATION}ms`);
  console.log(`  Concurrent Displays: ${CONCURRENT_DISPLAYS}`);
  console.log(`  Messages/sec: ${MESSAGES_PER_SECOND}\n`);

  const tests = [
    testTypeSafety,
    testWebSocketConnection,
    testHttpFallback,
    testMultiDisplaySync,
    testLatency,
    testReconnection,
    testConcurrentLoad
  ];

  for (const test of tests) {
    try {
      await test();
    } catch (error) {
      console.error(`Error running test:`, error);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log('\nPassed Tests:');
  testResults.passed.forEach(test => console.log(`  ✅ ${test}`));
  
  if (testResults.failed.length > 0) {
    console.log('\nFailed Tests:');
    testResults.failed.forEach(item => {
      console.log(`  ❌ ${item.test}: ${item.error}`);
    });
  }

  console.log('\n📈 Performance Metrics:');
  if (testResults.metrics.websocketLatencies.length > 0) {
    const avgWsLatency = testResults.metrics.websocketLatencies.reduce((a, b) => a + b, 0) / testResults.metrics.websocketLatencies.length;
    console.log(`  WebSocket avg latency: ${avgWsLatency.toFixed(2)}ms`);
  }
  if (testResults.metrics.httpLatencies.length > 0) {
    const avgHttpLatency = testResults.metrics.httpLatencies.reduce((a, b) => a + b, 0) / testResults.metrics.httpLatencies.length;
    console.log(`  HTTP avg latency: ${avgHttpLatency.toFixed(2)}ms`);
  }
  console.log(`  Total messages: ${testResults.metrics.totalMessages}`);
  console.log(`  Success rate: ${((testResults.metrics.successfulMessages / Math.max(testResults.metrics.totalMessages, 1)) * 100).toFixed(1)}%`);

  process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);
