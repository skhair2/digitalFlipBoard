export interface Design {
  id: string;
  userId: string;
  name: string;
  boardConfig: {
    style: 'classic_bw' | 'vintage_cream' | 'modern_dark' | 'glass';
    rows: number;
    columns: number;
    fontSize: number;
    textColor: string;
    bgColor: string;
  };
  content: {
    messages: Message[];
  };
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  animationType?: 'flip' | 'scroll' | 'fade' | 'wave';
  colorTheme?: string;
}

export interface GridConfig {
  rows: number;
  columns: number;
}

export interface SessionState {
  sessionCode: string;
  gridConfig: GridConfig;
  currentMessage: string;
  boardState?: string[];
  animationType?: string;
  colorTheme?: string;
  isConnected: boolean;
}
