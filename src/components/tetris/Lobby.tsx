import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onJoin: (name: string, room: string) => void;
  transport: "local" | "socket" | "connecting";
  error: string | null;
};

export function Lobby({ onJoin, transport, error }: Props) {
  const [name, setName] = useState("");
  const [room, setRoom] = useState("ARENA-01");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onJoin(name.trim().toUpperCase().slice(0, 12), room.trim().toUpperCase() || "ARENA-01");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <section className="w-full max-w-md">
        <header className="text-center mb-10">
          <p className="text-mono text-[11px] tracking-[0.4em] text-muted-foreground mb-3">
            // PROTOCOL · v1
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground text-mono">
            TETRIS
            <br />
            <span className="text-muted-foreground">MULTIPLAYER</span> ARENA
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            4 jogadores · tempo real · servidor autoritativo
          </p>
        </header>

        <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card/60 backdrop-blur p-6">
          <div>
            <label className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 block">
              Nome
            </label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="DIGITE SEU NOME"
              maxLength={12}
              className="text-mono uppercase bg-background border-border focus-visible:ring-foreground/40"
            />
          </div>
          <div>
            <label className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2 block">
              Sala
            </label>
            <Input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="ARENA-01"
              maxLength={16}
              className="text-mono uppercase bg-background border-border focus-visible:ring-foreground/40"
            />
          </div>

          <Button
            type="submit"
            className="w-full text-mono tracking-widest uppercase bg-foreground text-background hover:bg-foreground/90"
            disabled={!name.trim() || transport === "connecting"}
          >
            {transport === "connecting" ? "Conectando..." : "Entrar na sala"}
          </Button>

          <div className="flex items-center justify-between pt-2">
            <span className="text-mono text-[10px] text-muted-foreground">TRANSPORTE</span>
            <span className="text-mono text-[10px] uppercase tracking-wider text-foreground">
              {transport === "socket"
                ? "● SOCKET.IO"
                : transport === "local"
                ? "○ LOCAL (offline)"
                : "… aguardando"}
            </span>
          </div>
          {error && (
            <p className="text-mono text-[10px] text-muted-foreground border-t border-border pt-3">
              {error}
            </p>
          )}
        </form>

        <footer className="mt-8 text-center text-mono text-[10px] text-muted-foreground tracking-wider">
          ← → ↓ ↑ · SPACE · P
        </footer>
      </section>
    </main>
  );
}