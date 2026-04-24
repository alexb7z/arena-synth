import { cn } from "@/lib/utils";
import type { PieceType } from "@/types/tetris";

const PIECE_BG: Record<PieceType, string> = {
  I: "bg-piece-i",
  O: "bg-piece-o",
  T: "bg-piece-t",
  S: "bg-piece-s",
  Z: "bg-piece-z",
  J: "bg-piece-j",
  L: "bg-piece-l",
};

type Props = {
  type: PieceType | null;
  ghost?: boolean;
  size?: number;
};

export function Cell({ type, ghost = false, size = 22 }: Props) {
  const filled = type !== null;
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative border border-board-grid/60",
        filled
          ? cn(PIECE_BG[type!], "shadow-[inset_0_0_0_1px_hsl(var(--piece-edge)/0.25)]")
          : ghost
          ? "bg-ghost/40 border-foreground/20"
          : "bg-cell-empty"
      )}
    >
      {filled && (
        <span className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
      )}
    </div>
  );
}