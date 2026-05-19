/**
 * Tagent WebSocket client for real-time updates.
 * Connects to the API Gateway WebSocket endpoint.
 * Automatically reconnects on disconnect.
 */

function getWsUrl(): string {
  // WebSocket disabled until ingress is configured
  return "";
}

const WS_URL = getWsUrl();

export type EventType = "incident" | "remediation" | "metric" | "guardian" | "connected";

export interface WSEvent {
  type: EventType;
  payload: any;
  timestamp: string;
}

type Listener = (event: WSEvent) => void;

class TagentWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Listener[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connected = false;

  connect() {
    if (typeof window === "undefined") return; // SSR guard
    if (!WS_URL) return; // WebSocket disabled

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        this.connected = true;
        console.log("[tagent-ws] Connected");
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WSEvent = JSON.parse(event.data);
          this.listeners.forEach((fn) => fn(data));
        } catch (e) {
          // ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        console.log("[tagent-ws] Disconnected, reconnecting in 5s...");
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.connected = false;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== listener);
    };
  }

  isConnected() {
    return this.connected;
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }
}

// Singleton instance
export const tagentWS = new TagentWebSocket();
