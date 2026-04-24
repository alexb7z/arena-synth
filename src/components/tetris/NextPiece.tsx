import type { PieceType } from "@/types/tetris";
import { PIECE_SHAPES } from "@/game/pieces";
import { Cell } from "./Cell";

export function NextPiece({ type }: { type: PieceType | null }) {
  if (!type) {
    return (
      <div className="h-16 w-16 rounded border border-border bg-board-bg/60 flex items-center justify-center text-mono text-[10px] text-muted-foreground">
        —
      </div>
    );
  }
  const shape = PIECE_SHAPES[type];
  // trim empty rows/cols for cleaner preview
  const rows = shape.filter((r) => r.some((v) => v));
  const colMin = Math.min(...rows.map((r) => r.findIndex((v) => v)));
  const colMax = Math.max(...rows.map((r) => r.length - 1 - [...r].reverse().findIndex((v) => v)));
  const trimmed = rows.map((r) => r.slice(colMin, colMax + 1));
  return (
    <div
      className="inline-grid bg-board-bg p-1 rounded border border-border"
      style={{ gridTemplateColumns: `repeat(${trimmed[0].length}, 14px)` }}
    >
      {trimmed.flatMap((row, y) =>
        row.map((v, x) => (
          <Cell key={`${y}-${x}`} type={v ? type : null} size={14} />
        ))
      )}
    </div>
  );
}