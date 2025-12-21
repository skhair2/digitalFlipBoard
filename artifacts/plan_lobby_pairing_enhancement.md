# Plan: Lobby & Pairing Enhancement (Scalability & Performance)

**Task ID**: `LOBBY_PAIRING_ENHANCEMENT`
**Goal**: Optimize the pairing mechanism to reduce server load and improve scalability for thousands of concurrent sessions.

## Architectural Assessment
The current pairing mechanism relies on persistent WebSocket connections for both "waiting" displays and "active" controllers. This creates a linear increase in server load as the number of idle displays grows.

### Bottlenecks
1.  **Idle Connections**: Displays waiting for pairing consume server memory and socket descriptors.
2.  **Centralized Broadcasting**: All messages pass through the Express server, creating a potential bottleneck.
3.  **Room Iteration**: The inactivity monitor iterates over all active rooms, which scales poorly.

## Proposed Enhancements

### 1. "Lazy" WebSocket Connection (Lobby Optimization)
- **Change**: Displays will not open a WebSocket connection immediately upon code generation.
- **Mechanism**: 
    - Display registers its `sessionCode` in Redis with a "waiting" status.
    - Controller validates the code via a REST API.
    - Once validated, the API triggers a "pairing:ready" event via Redis Pub/Sub.
    - Display (listening via a lightweight SSE or long-polling) then upgrades to a WebSocket connection.
- **Impact**: Reduces idle WebSocket connections by ~80%.

### 2. WebRTC DataChannel (P2P Messaging)
- **Change**: Implement WebRTC for direct Controller-to-Display communication.
- **Mechanism**:
    - Use the existing Socket.io connection as a signaling server.
    - Exchange ICE candidates and SDP offers/answers.
    - Establish a P2P DataChannel for message delivery.
- **Impact**: Near-zero server load for message broadcasting; lower latency.

### 3. Redis-Native Session Monitoring
- **Change**: Move inactivity monitoring from the Node.js loop to Redis TTLs and Keyspace Notifications.
- **Mechanism**:
    - Set TTLs on session keys in Redis.
    - Use Redis Keyspace Notifications (`EXPIRED` events) to trigger cleanup logic in the `worker` package.
- **Impact**: Removes the `setInterval` loop from the API server, improving CPU efficiency.

## Step Checklist

- [ ] **Phase 1: Lazy Connection**
    - [ ] Create `POST /api/sessions/register` for displays.
    - [ ] Create `POST /api/sessions/pair` for controllers.
    - [ ] Update `useWebSocket` hook to support delayed connection.
- [ ] **Phase 2: WebRTC Signaling**
    - [ ] Add `webrtc:offer`, `webrtc:answer`, and `webrtc:ice-candidate` events to `packages/shared`.
    - [ ] Implement signaling logic in `packages/api`.
    - [ ] Create `useWebRTC` hook in `packages/web`.
- [ ] **Phase 3: Redis Monitoring**
    - [ ] Configure Redis Keyspace Notifications.
    - [ ] Implement `expired` event listener in `packages/worker`.

## Test Plan
- **Load Test**: Simulate 5,000 "waiting" displays and verify server memory usage.
- **P2P Test**: Verify messages are delivered even if the API server is throttled/delayed.
- **Cleanup Test**: Verify Redis keys are deleted and `session:terminated` events are fired correctly.

## Rollback Plan
- Revert `useWebSocket` to immediate connection mode.
- Disable WebRTC signaling events in the API.
- Re-enable the `monitorInactiveSessions` loop in `index.js`.
