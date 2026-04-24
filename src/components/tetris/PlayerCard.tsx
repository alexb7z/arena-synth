import { cn } from "@/lib/utils";
import type { Player } from "@/types/tetris";
import { Board } from "./Board";
import { NextPiece } from "./NextPiece";

const STATUS_LABEL: Record<Player["status"], string> = {
  waiting: "AGUARDANDO",
  ready: "PRONTO",
  playing: "JOGANDO",
  paused: "PAUSADO",
  gameover: "GAME OVER",
  disconnected: "DESCONECTADO",
};

type Props = {
  player: Player;
  isMe: boolean;
  active?: boolean;
  cellSize?: number;
};

export function PlayerCard({ player, isMe, active, cellSize = 18 }: Props) {
  const dim = player.status === "gameover" || player.status === "disconnected";

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card/80 backdrop-blur-sm p-3 transition-all",
        active
          ? "border-foreground/60 glow-active"
          : "border-border hover:border-foreground/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "h-2 w-2 rounded-full shrink-0",
              player.status === "playing" && "bg-foreground animate-pulse-soft",
              player.status === "paused" && "bg-muted-foreground",
              player.status === "gameover" && "bg-destructive-foreground/40",
              player.status === "disconnected" && "bg-muted-foreground/40",
              (player.status === "ready" || player.status === "waiting") && "bg-foreground/40"
            )}
          />
          <span className="text-mono text-xs uppercase truncate text-foreground">
            {player.name}
            {isMe && <span className="text-muted-foreground"> · você</span>}
          </span>
        </div>
        <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {STATUS_LABEL[player.status]}
        </span>
      </div>

      {/* Board */}
      <div className="flex gap-3">
        <Board board={player.board} piece={player.current} cellSize={cellSize} dim={dim} />

        <div className="flex flex-col gap-3 min-w-[80px]">
          <Stat label="SCORE" value={player.score.toString().padStart(6, "0")} />
          <Stat label="LINES" value={player.lines.toString()} />
          <Stat label="LEVEL" value={player.level.toString()} />
          <div>
            <div className="text-mono text-[10px] text-muted-foreground mb-1">NEXT</div>
            <NextPiece type={player.next} />
          </div>
        </div>
      </div>

      {dim && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-mono text-sm tracking-[0.3em] text-foreground/80 bg-background/70 px-3 py-1 rounded border border-border">
            {STATUS_LABEL[player.status]}
          </span>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-mono text-[10px] text-muted-foreground">{label}</div>
      <div className="text-mono text-base text-foreground">{value}</div>
    </div>
  );
}