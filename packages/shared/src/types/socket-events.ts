export interface SocketMessageEvent {
  event: 'message:send';
  sessionCode: string;
  message: string;
  timestamp: number;
  userId: string;
  animationType?: string;
  colorTheme?: string;
}

export interface SocketMessageReceivedEvent {
  event: 'message:received';
  sessionCode: string;
  message: string;
  animationType?: string;
  colorTheme?: string;
  timestamp: number;
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

export type SocketEvent = 
  | SocketMessageEvent 
  | SocketMessageReceivedEvent 
  | SocketSessionPairedEvent 
  | SocketSessionExpiredEvent 
  | SocketConnectionStatusEvent;
