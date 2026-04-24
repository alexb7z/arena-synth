/**
 * Pure functional Tetris engine.
 * No DOM, no React, no I/O. Same code can run on the server (authoritative)
 * or the client (prediction / replay).
 */
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  type Board,
  type Cell,
  type Piece,
  type PieceType,
} from "@/types/tetris";
import { ALL_PIECES, PIECE_SHAPES } from "./pieces";

export function createBoard(width = BOARD_WIDTH, height = BOARD_HEIGHT): Board {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, (): Cell => ({ type: null }))
  );
}

export function randomPieceType(): PieceType {
  return ALL_PIECES[Math.floor(Math.random() * ALL_PIECES.length)];
}

export function generatePiece(type: PieceType = randomPieceType()): Piece {
  const shape = PIECE_SHAPES[type].map((row) => [...row]);
  // spawn centered, top
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  return { type, shape, x, y: 0, rotation: 0 };
}

/** Rotate matrix 90° clockwise. Pure. */
export function rotateMatrix(matrix: number[][]): number[][] {
  const N = matrix.length;
  const M = matrix[0].length;
  const out: number[][] = Array.from({ length: M }, () => Array(N).fill(0));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < M; x++) {
      out[x][N - 1 - y] = matrix[y][x];
    }
  }
  return out;
}

export function rotatePiece(piece: Piece, board: Board): Piece {
  const newShape = rotateMatrix(piece.shape);
  const candidate: Piece = { ...piece, shape: newShape, rotation: (piece.rotation + 1) % 4 };
  // basic wall kicks: try offsets [0, -1, 1, -2, 2]
  for (const dx of [0, -1, 1, -2, 2]) {
    const test = { ...candidate, x: candidate.x + dx };
    if (!checkCollision(test, board)) return test;
  }
  return piece;
}

export function movePiece(piece: Piece, dx: number, dy: number, board: Board): Piece {
  const moved: Piece = { ...piece, x: piece.x + dx, y: piece.y + dy };
  return checkCollision(moved, board) ? piece : moved;
}

export function checkCollision(piece: Piece, board: Board): boolean {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (!piece.shape[y][x]) continue;
      const bx = piece.x + x;
      const by = piece.y + y;
      if (bx < 0 || bx >= BOARD_WIDTH || by >= BOARD_HEIGHT) return true;
      if (by < 0) continue; // allow spawning above
      if (board[by][bx].type !== null) return true;
    }
  }
  return false;
}

/** Returns a new board with the piece merged into it (does not mutate). */
export function mergePiece(piece: Piece, board: Board): Board {
  const next = board.map((row) => row.map((c) => ({ ...c })));
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (!piece.shape[y][x]) continue;
      const bx = piece.x + x;
      const by = piece.y + y;
      if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
        next[by][bx] = { type: piece.type };
      }
    }
  }
  return next;
}

/** Removes complete lines, returns new board + count of cleared lines. */
export function clearLines(board: Board): { board: Board; cleared: number } {
  const remaining = board.filter((row) => row.some((c) => c.type === null));
  const cleared = BOARD_HEIGHT - remaining.length;
  const empty: Board = Array.from({ length: cleared }, () =>
    Array.from({ length: BOARD_WIDTH }, (): Cell => ({ type: null }))
  );
  return { board: [...empty, ...remaining], cleared };
}

/** Standard Tetris scoring (NES-like) */
export function calculateScore(linesCleared: number, level: number): number {
  const base = [0, 40, 100, 300, 1200];
  return (base[linesCleared] ?? 0) * (level + 1);
}

export function levelFromLines(totalLines: number): number {
  return Math.floor(totalLines / 10);
}

/** Tick interval in ms for a given level (gravity speed). */
export function tickIntervalMs(level: number): number {
  return Math.max(80, 800 - level * 60);
}

/** Compute the y where the piece would rest if hard-dropped. */
export function ghostY(piece: Piece, board: Board): number {
  let p = piece;
  while (!checkCollision({ ...p, y: p.y + 1 }, board)) {
    p = { ...p, y: p.y + 1 };
  }
  return p.y;
}