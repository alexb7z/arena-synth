import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlayerCard } from "./PlayerCard";
import type { ClientInput, RoomState } from "@/types/tetris";
import { useKeyboardControls } from "@/hooks/useKeyboardControls";

type Props = {
  state: RoomState;
  meId: string | null;
  transport: "local" | "socket" | "connecting";
  onReady: () => void;
  onStart: () => void;
  onInput: (i: ClientInput) => void;
};

export function Arena({ state, meId, transport, onReady, onStart, onInput }: Props) {
  const me = useMemo(() => state.players.find((p) => p.id === meId) ?? null, [state, meId]);
  const others = useMemo(() => state.players.filter((p) => p.id !== meId), [state, meId]);

  // Pad to 4 slots so the grid stays consistent
  const slots = useMemo(() => {
    const list = [...state.players];
    while (list.length < 4) {
      list.push({
        id: `empty-${list.length}`,
        name: "—",
        status: "waiting",
        board: Array.from({ length: 20 }, () => Array.from({ length: 10 }, () => ({ type: null }))),
        current: null,
        next: null,
        score: 0,
        lines: 0,
        level: 0,
      });
    }
    return list;
  }, [state.players]);

  useKeyboardControls(onInput, !!me && state.started);

  const allReady = state.players.length >= 2 && state.players.every((p) => p.status === "ready" || p.status === "playing");
  const isHost = me && state.hostId === me.id;
  const canStart = !state.started && allReady && isHost;

  return (
    <main className="min-h-screen px-4 md:px-8 py-6">
      {/* Top bar */}
      <header className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-mono text-lg md:text-xl font-bold tracking-widest text-foreground">
            TETRIS · ARENA
          </h1>
          <p className="text-mono text-[10px] text-muted-foreground tracking-wider mt-1">
            SALA {state.roomId} · {state.players.length}/4 ·{" "}
            {transport === "socket" ? "ONLINE" : "LOCAL"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!state.started && me && me.status !== "ready" && (
            <Button
              onClick={onReady}
              variant="outline"
              className="text-mono uppercase tracking-wider border-foreground/40 hover:bg-foreground hover:text-background"
            >
              Pronto
            </Button>
          )}
          {!state.started && me && me.status === "ready" && (
            <span className="text-mono text-xs text-muted-foreground uppercase tracking-wider">
              ✓ Você está pronto
            </span>
          )}
          {canStart && (
            <Button
              onClick={onStart}
              className="text-mono uppercase tracking-wider bg-foreground text-background hover:bg-foreground/90"
            >
              Iniciar partida
            </Button>
          )}
          {!isHost && !state.started && (
            <span className="text-mono text-[10px] text-muted-foreground uppercase tracking-wider">
              Aguardando host
            </span>
          )}
        </div>
      </header>

      {/* Boards grid */}
      <section
        className="
          grid gap-4 max-w-7xl mx-auto
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        {slots.map((p) => (
          <PlayerCard
            key={p.id}
            player={p}
            isMe={p.id === meId}
            active={p.id === meId && p.status === "playing"}
            cellSize={18}
          />
        ))}
      </section>

      {/* Controls hint */}
      <footer className="mt-6 text-center text-mono text-[10px] text-muted-foreground tracking-widest">
        ← → MOVE · ↑ ROTATE · ↓ SOFT · SPACE HARD · P PAUSE
      </footer>

      {!me && (
        <div className="mt-8 text-center text-mono text-xs text-muted-foreground">
          Conectando à sala...
        </div>
      )}
    </main>
  );
}