# Testing Strategy

## Load Testing
The project includes a comprehensive load testing suite to verify the performance and reliability of the hybrid WebSocket + HTTP strategy.

- **Location**: `packages/api/tests/load-test.js`
- **Scenarios Covered**:
  1. **WebSocket Connection**: Verifies basic real-time connectivity.
  2. **HTTP Fallback**: Tests the REST endpoints used when WebSockets are unavailable.
  3. **Multi-Display Sync**: Ensures multiple displays in the same session receive updates simultaneously.
  4. **Latency Measurement**: Tracks the time from message send to receipt.
  5. **Reconnection Logic**: Simulates network drops and verifies automatic recovery.
  6. **Concurrent Load**: Stress tests the server with multiple simultaneous sessions.

## Running Tests
To run the load tests, ensure Redis is running and use the following command from the root:
```bash
cd packages/api && pnpm test
```
*(Note: Ensure `NODE_ENV` is set correctly to avoid impacting production data.)*

## Quality Metrics
- **Type Safety**: 100% coverage across shared types.
- **Success Threshold**: 95% success rate for concurrent load tests.
