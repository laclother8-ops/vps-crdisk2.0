import { WSEventPayload, WSEventType } from '@omnicrm/shared';

type EventHandler = (data: any) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private reconnectTimeout: any = null;
  private url: string;

  constructor() {
    this.url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000/ws';
  }

  connect() {
    if (typeof window === 'undefined') return;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('⚡ Connected to OmniCRM Realtime Gateway');
      };

      this.socket.onmessage = (event) => {
        try {
          const payload: WSEventPayload = JSON.parse(event.data);
          this.emit(payload.type, payload.data);
        } catch (e) {
          // Non-JSON message
        }
      };

      this.socket.onclose = () => {
        console.warn('⚠️ WebSocket disconnected. Reconnecting in 3s...');
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
  }

  on(eventType: WSEventType | string, handler: EventHandler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);
    return () => this.off(eventType, handler);
  }

  off(eventType: string, handler: EventHandler) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit(eventType: string, data: any) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach(h => h(data));
    }
  }
}

export const wsClient = new WebSocketClient();

export function connectWebSocket() {
  wsClient.connect();
  return wsClient;
}
