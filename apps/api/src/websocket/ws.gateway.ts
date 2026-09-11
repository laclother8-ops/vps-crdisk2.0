import { WebSocket } from 'ws';
import { WSEventPayload, WSEventType } from '@omnicrm/shared';

export class WebSocketGateway {
  private static instance: WebSocketGateway;
  private clients: Set<WebSocket> = new Set();

  private constructor() {}

  static getInstance(): WebSocketGateway {
    if (!WebSocketGateway.instance) {
      WebSocketGateway.instance = new WebSocketGateway();
    }
    return WebSocketGateway.instance;
  }

  addClient(ws: WebSocket) {
    this.clients.add(ws);

    ws.on('message', (raw) => {
      try {
        const payload = JSON.parse(raw.toString());
        this.handleClientMessage(ws, payload);
      } catch (e) {
        // Non-json or ping
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('error', () => {
      this.clients.delete(ws);
    });
  }

  private handleClientMessage(sender: WebSocket, payload: any) {
    if (!payload || !payload.type) return;

    // Handle incoming typing indicator
    if (payload.type === WSEventType.CHAT_TYPING) {
      this.broadcastExcept(sender, WSEventType.CHAT_TYPING, payload.data);
    }
  }

  broadcast<T>(type: WSEventType, data: T, orgId = '11111111-1111-1111-1111-111111111111') {
    const payload: WSEventPayload<T> = {
      type,
      orgId,
      data,
      timestamp: new Date().toISOString()
    };

    const message = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  broadcastExcept<T>(excludedClient: WebSocket, type: WSEventType, data: T, orgId = '11111111-1111-1111-1111-111111111111') {
    const payload: WSEventPayload<T> = {
      type,
      orgId,
      data,
      timestamp: new Date().toISOString()
    };

    const message = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client !== excludedClient && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}
