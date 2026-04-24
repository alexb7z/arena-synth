/**
 * ────────────────────────────────────────────────────────────────────────────
 *  multiplayerAdapter
 * ────────────────────────────────────────────────────────────────────────────
 *  Abstract transport layer between the React client and the authoritative
 *  game server. The UI never imports Socket.IO directly — it talks to this
 *  adapter, so we can swap implementations without touching components.
 *
 *  Today:
 *    - LocalAdapter  → single-browser sandbox (in-memory, runs the engine
 *                      locally so the UI is fully usable without a server).
 *    - SocketAdapter → real multiplayer via the Node.js + Socket.IO server
 *                      shipped in /tetris-server (4-player rooms).
 *
 *  Future (AWS migration, NOT implemented now):
 *    - SqsAdapter    → publishes ClientInput as messages to an AWS SQS queue
 *                      consumed by an EC2/ECS worker that runs the engine
 *                      and broadcasts state via WebSocket / API Gateway.
 *
 *      Mapping when migrating:
 *        adapter.send(input)   →  SQS SendMessage  (player → queue)
 *        worker on EC2/ECS     →  consumes queue, advances engine, persists
 *        adapter.onState(cb)   →  WebSocket subscription to room channel
 *                                 (e.g. API Gateway WebSocket / AppSync)
 *
 *      Because the rest of the codebase only depends on this interface,
 *      that migration is a drop-in replacement.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { ClientInput, RoomState } from "@/types/tetris";

export type StateListener = (state: RoomState) => void;
export type ErrorListener = (err: string) => void;

export interface MultiplayerAdapter {
  /** connect to the transport (open socket, etc.) */
  connect(): Promise<void>;
  disconnect(): void;

  joinRoom(roomId: string, playerName: string): void;
  ready(): void;
  startGame(): void;
  sendInput(input: ClientInput): void;

  onState(listener: StateListener): () => void;
  onError(listener: ErrorListener): () => void;
}