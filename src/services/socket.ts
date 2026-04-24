/**
 * Socket.IO adapter — talks to the Node.js server in /tetris-server.
 */
import { io, type Socket } from "socket.io-client";
import type { ClientInput, RoomState } from "@/types/tetris";
import type {
  ErrorListener,
  MultiplayerAdapter,
  StateListener,
} from "./multiplayerAdapter";

const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ??
  "http://3.87.157.51:3001";

export class SocketAdapter implements MultiplayerAdapter {
  private socket: Socket | null = null;
  private stateListeners = new Set<StateListener>();
  private errorListeners = new Set<ErrorListener>();

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const s = io(SOCKET_URL, {
        transports: ["polling", "websocket"],
        reconnection: true,
        timeout: 8000,
      });

      this.socket = s;

      s.on("connect", () => {
  console.log("Socket conectado:", s.id);

  // 🔥 ESSA LINHA RESOLVE SEU PROBLEMA
  sessionStorage.setItem("tetris.me", s.id);

  resolve();
});

	s.on("connect_error", (err) => {
        console.error("Erro Socket.IO:", err.message);
        this.errorListeners.forEach((l) => l(err.message));
        reject(err);
      });

      s.on("state_update", (state: RoomState) => {
        this.stateListeners.forEach((l) => l(state));
      });

      s.on("server_error", (msg: string) => {
        this.errorListeners.forEach((l) => l(msg));
      });
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinRoom(roomId: string, playerName: string): void {
    this.socket?.emit("join_room", { roomId, playerName });
  }

  ready(): void {
    this.socket?.emit("player_ready");
  }

  startGame(): void {
    this.socket?.emit("start_game");
  }

  sendInput(input: ClientInput): void {
    switch (input.type) {
      case "move":
        this.socket?.emit("player_move", { dir: input.dir });
        break;
      case "rotate":
        this.socket?.emit("player_rotate");
        break;
      case "soft-drop":
        this.socket?.emit("player_drop", { kind: "soft" });
        break;
      case "hard-drop":
        this.socket?.emit("player_drop", { kind: "hard" });
        break;
      case "pause":
        this.socket?.emit("player_pause");
        break;
    }
  }

  onState(l: StateListener) {
    this.stateListeners.add(l);
    return () => this.stateListeners.delete(l) as unknown as void;
  }

  onError(l: ErrorListener) {
    this.errorListeners.add(l);
    return () => this.errorListeners.delete(l) as unknown as void;
  }
}
