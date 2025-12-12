// ============================================================================
// Core Message Events (90% WebSocket, 10% HTTP fallback)
// ============================================================================

export interface SocketMessageEvent {
  event: 'message:send';
  sessionCode: string;
  message: string;
  timestamp: number;
  userId: string;
  animationType?: string;
  colorTheme?: string;
  rows?: number;
  cols?: number;
}

export interface SocketMessageReceivedEvent {
  event: 'message:received';
  sessionCode: string;
  message: string;
  animationType?: string;
  colorTheme?: string;
  timestamp: number;
  rows?: number;
  cols?: number;
}

export interface SocketSessionPairedEvent {
  event: 'session:paired';
  sessionCode: string;
  displayId: string;
  timestamp: number;
}

export interface SocketSessionExpiredEvent {
  event: 'session:expired';
  sessionCode: string;
  reason: string;
}

export interface SocketConnectionStatusEvent {
  event: 'connection:status';
  connected: boolean;
  timestamp: number;
}

// ============================================================================
// Design-Specific Events (Multi-design namespace support)
// ============================================================================

export interface DesignUpdateEvent {
  event: 'design:update';
  designId: string;
  gridConfig: {
    rows: number;
    cols: number;
  };
  timestamp: number;
}

export interface DesignStyleEvent {
  event: 'design:style';
  designId: string;
  style: {
    colorTheme?: string;
    animationType?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  timestamp: number;
}

export interface DesignSyncEvent {
  event: 'design:sync';
  designId: string;
  syncData: {
    version: number;
    boardState: string[];
    lastUpdated: number;
  };
  timestamp: number;
}

// ============================================================================
// Display Status Events (HTTP Polling + WebSocket)
// ============================================================================

export interface DisplayStatusEvent {
  event: 'display:status';
  displayId: string;
  status: 'online' | 'offline' | 'animating' | 'idle';
  metrics?: DisplayMetrics;
  timestamp: number;
}

export interface DisplayMetrics {
  fps?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  latency?: number;
  lastMessageReceivedAt?: number;
  messageCount?: number;
}

export interface DisplayHealthEvent {
  event: 'display:health';
  displayId: string;
  health: 'healthy' | 'degraded' | 'critical';
  issues?: string[];
  timestamp: number;
}

// ============================================================================
// Animation Frame Events (For advanced animation sequencing)
// ============================================================================

export interface AnimationFrameData {
  frameId: string;
  frameNumber: number;
  displayId: string;
  animationType: string;
  progress: number; // 0-1
  timestamp: number;
}

export interface AnimationFrameEvent {
  event: 'animation:frame';
  data: AnimationFrameData;
  timestamp: number;
}

export interface AnimationCompleteEvent {
  event: 'animation:complete';
  displayId: string;
  animationType: string;
  totalFrames: number;
  duration: number;
  timestamp: number;
}

// ============================================================================
// Control Sync Events
// ============================================================================

export interface ControllerStatusEvent {
  event: 'controller:status';
  sessionCode: string;
  isConnected: boolean;
  userCount: number;
  timestamp: number;
}

// ============================================================================
// Union Type for All Socket Events
// ============================================================================

export type SocketEvent = 
  | SocketMessageEvent 
  | SocketMessageReceivedEvent 
  | SocketSessionPairedEvent 
  | SocketSessionExpiredEvent 
  | SocketConnectionStatusEvent
  | DesignUpdateEvent
  | DesignStyleEvent
  | DesignSyncEvent
  | DisplayStatusEvent
  | DisplayHealthEvent
  | AnimationFrameEvent
  | AnimationCompleteEvent
  | ControllerStatusEvent;

// ============================================================================
// Helper Types for HTTP API Responses (10% Fallback Traffic)
// ============================================================================

export interface DisplayStatusResponse {
  displayId: string;
  status: DisplayStatusEvent;
  httpFallback: boolean;
  timestamp: number;
}

export interface DisplayListResponse {
  displays: Array<{
    displayId: string;
    sessionCode: string;
    status: DisplayStatusEvent['status'];
    lastHeartbeat: number;
  }>;
  timestamp: number;
}

// ============================================================================
// WebSocket Callback Types
// ============================================================================

export interface SocketIOCallback {
  (error?: Error | null, response?: any): void;
}
