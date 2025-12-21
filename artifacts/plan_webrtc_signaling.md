# Plan: WebRTC P2P Signaling

## Goal
Enable direct Peer-to-Peer (P2P) communication between the Controller (web) and Display applications to reduce latency and server load for high-frequency updates.

## Architecture
- **Signaling Server**: The existing Socket.io server will act as the signaling channel.
- **Protocol**: WebRTC (RTCPeerConnection).
- **Flow**:
  1. Controller initiates a connection by sending an `offer` via Socket.io.
  2. API broadcasts the `offer` to the specific session.
  3. Display receives the `offer`, creates an `answer`, and sends it back.
  4. Both peers exchange `ice-candidates` via the API.
  5. Once connected, data is sent over a `RTCDataChannel`.

## Files to Change
- `packages/api/src/index.js`: Add signaling event handlers (`webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`).
- `packages/web/src/hooks/useWebRTC.js`: Hook for the Controller to manage P2P.
- `packages/display/src/hooks/useWebRTC.js`: Hook for the Display to manage P2P.
- `packages/shared/src/constants.js`: Add WebRTC event constants.

## Step Checklist
1. [ ] Add signaling events to the API.
2. [ ] Implement `useWebRTC` hook in the `web` package (Initiator).
3. [ ] Implement `useWebRTC` hook in the `display` package (Receiver).
4. [ ] Update `Controller.jsx` and `Display.jsx` to use the new hook.
5. [ ] Fallback to WebSockets if P2P fails (Hybrid approach).

## Test Plan
- Open Controller and Display in two windows.
- Verify that `RTCPeerConnection` reaches `connected` state.
- Send a test message over the data channel and verify receipt.

## Rollback Plan
- Disable WebRTC initialization in the frontend; the system will naturally fall back to the existing WebSocket messaging.
