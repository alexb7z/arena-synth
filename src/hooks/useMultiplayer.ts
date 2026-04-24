import { useEffect, useRef, useState } from "react";
import { LocalAdapter } from "@/services/localAdapter";
import { SocketAdapter } from "@/services/socket";
import type { MultiplayerAdapter } from "@/services/multiplayerAdapter";
import type { ClientInput, RoomState } from "@/types/tetris";

export type Mode = "auto" | "local" | "socket";

/**
 * Connects to the multiplayer transport.
 *  - mode "auto" tries Socket.IO first and falls back to LocalAdapter.
 *  - mode "local" forces the in-browser sandbox (great for the Lovable preview).
 *  - mode "socket" requires the Node.js server in /tetris-server to be running.
 */
export function useMultiplayer(mode: Mode = "auto") {
  const [state, setState] = useState<RoomState | null>(null);
  const [transport, setTransport] = useState<"local" | "socket" | "connecting">("connecting");
  const [error, setError] = useState<string | null>(null);
  const adapterRef = useRef<MultiplayerAdapter | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const tryLocal = () => {
        const a = new LocalAdapter();
        adapterRef.current = a;
        a.onState((s) => !cancelled && setState(s));
        a.onError((e) => !cancelled && setError(e));
        setTransport("local");
      };

      if (mode === "local") {
        tryLocal();
        return;
      }

      const sock = new SocketAdapter();
      try {
        await sock.connect();
        if (cancelled) {
          sock.disconnect();
          return;
        }
        adapterRef.current = sock;
        sock.onState((s) => !cancelled && setState(s));
        sock.onError((e) => !cancelled && setError(e));
        setTransport("socket");
      } catch {
        if (mode === "socket") {
          setError("Servidor offline. Inicie o backend em /tetris-server (npm run dev).");
          tryLocal(); // still let the user play
        } else {
          tryLocal();
        }
      }
    }

    init();
    return () => {
      cancelled = true;
      adapterRef.current?.disconnect();
      adapterRef.current = null;
    };
  }, [mode]);

  const api = {
    state,
    transport,
    error,
    joinRoom: (roomId: string, name: string) => adapterRef.current?.joinRoom(roomId, name),
    ready: () => adapterRef.current?.ready(),
    startGame: () => adapterRef.current?.startGame(),
    sendInput: (input: ClientInput) => adapterRef.current?.sendInput(input),
  };
  return api;
}