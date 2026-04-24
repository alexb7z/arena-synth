import { useEffect, useMemo, useState } from "react";
import { Lobby } from "@/components/tetris/Lobby";
import { Arena } from "@/components/tetris/Arena";
import { useMultiplayer } from "@/hooks/useMultiplayer";

/**
 * Tetris Multiplayer Arena
 * - Frontend (this app) renders the lobby + 4-player arena.
 * - Multiplayer is abstracted behind useMultiplayer:
 *     · "auto"  → tries Socket.IO server in /tetris-server, falls back to local
 *     · "local" → in-browser sandbox (used in this preview)
 *     · "socket"→ forces real backend
 * - Authoritative game logic lives in src/game (pure, shared with the server).
 */
const Index = () => {
  // SEO basics
  useEffect(() => {
    document.title = "Tetris Multiplayer Arena · 4 jogadores online";
    const desc =
      "Tetris multiplayer para 4 jogadores em tempo real. Tema dark minimalista, servidor autoritativo, pronto para escalar.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  const mp = useMultiplayer("auto");
  const [joined, setJoined] = useState(false);

  // Identify "me": in LocalAdapter the id is fixed; with Socket it's the socket id (sent inside state).
  const meId = useMemo(() => {
    if (!mp.state) return null;
    // local fallback
    const local = mp.state.players.find((p) => p.id === "local-player");
    if (local) return local.id;
    // socket: server marks the player whose socket matches; we approximate via stored id.
    const stored = sessionStorage.getItem("tetris.me");
    return stored ?? mp.state.players[0]?.id ?? null;
  }, [mp.state]);

  const handleJoin = (name: string, room: string) => {
    sessionStorage.setItem("tetris.name", name);
    mp.joinRoom(room, name);
    setJoined(true);
  };

  if (!joined) {
    return <Lobby onJoin={handleJoin} transport={mp.transport} error={mp.error} />;
  }

  if (!mp.state) {
    return (
      <main className="min-h-screen flex items-center justify-center text-mono text-sm text-muted-foreground">
        Conectando à arena…
      </main>
    );
  }

  return (
    <Arena
      state={mp.state}
      meId={meId}
      transport={mp.transport}
      onReady={mp.ready}
      onStart={mp.startGame}
      onInput={mp.sendInput}
    />
  );
};

export default Index;
