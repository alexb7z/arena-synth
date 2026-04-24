/**
 * Shared Tetris types used by frontend, multiplayer adapter and (future) Node backend.
 * Keep this file dependency-free so it can be copied into the server folder verbatim.
 */

export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type Cell = {
  /** null = empty cell, otherwise the piece type that filled it */
  type: PieceType | null;
};

export type Board = Cell[][]; // rows[y][x]

export type Piece = {
  type: PieceType;
  /** rotation matrix (1 = filled, 0 = empty) */
  shape: number[][];
  x: number;
  y: number;
  rotation: number;
};

export type PlayerStatus = "waiting" | "ready" | "playing" | "paused" | "gameover" | "disconnected";

export type Player = {
  id: string;
  name: string;
  status: PlayerStatus;
  board: Board;
  current: Piece | null;
  next: PieceType | null;
  score: number;
  lines: number;
  level: number;
};

export type RoomState = {
  roomId: string;
  started: boolean;
  hostId: string | null;
  players: Player[];
};

export type GameState = RoomState;

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

/** Input events the client sends to the server */
export type ClientInput =
  | { type: "move"; dir: -1 | 1 }
  | { type: "soft-drop" }
  | { type: "hard-drop" }
  | { type: "rotate" }
  | { type: "pause" };