import { useMemo } from "react";
import { Cell } from "./Cell";
import type { Board as BoardType, Piece, PieceType } from "@/types/tetris";
import { ghostY } from "@/game/engine";

type Props = {
  board: BoardType;
  piece: Piece | null;
  cellSize?: number;
  showGhost?: boolean;
  dim?: boolean;
};

export function Board({ board, piece, cellSize = 22, showGhost = true, dim = false }: Props) {
  const composed = useMemo(() => {
    const out: (PieceType | null)[][] = board.map((row) => row.map((c) => c.type));
    const ghost: boolean[][] = board.map((row) => row.map(() => false));

    if (piece) {
      if (showGhost) {
        const gy = ghostY(piece, board);
        for (let y = 0; y < piece.shape.length; y++) {
          for (let x = 0; x < piece.shape[y].length; x++) {
            if (!piece.shape[y][x]) continue;
            const by = gy + y;
            const bx = piece.x + x;
            if (by >= 0 && by < ghost.length && bx >= 0 && bx < ghost[0].length) {
              if (out[by][bx] === null) ghost[by][bx] = true;
            }
          }
        }
      }
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (!piece.shape[y][x]) continue;
          const by = piece.y + y;
          const bx = piece.x + x;
          if (by >= 0 && by < out.length && bx >= 0 && bx < out[0].length) {
            out[by][bx] = piece.type;
            ghost[by][bx] = false;
          }
        }
      }
    }
    return { out, ghost };
  }, [board, piece, showGhost]);

  return (
    <div
      className={`inline-grid bg-board-bg p-1 rounded-md scanline ${
        dim ? "opacity-60 grayscale" : ""
      }`}
      style={{
        gridTemplateColumns: `repeat(${board[0].length}, ${cellSize}px)`,
        gap: 0,
      }}
    >
      {composed.out.map((row, y) =>
        row.map((type, x) => (
          <Cell key={`${y}-${x}`} type={type} ghost={composed.ghost[y][x]} size={cellSize} />
        ))
      )}
    </div>
  );
}