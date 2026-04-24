/**
 * LocalAdapter — runs the authoritative engine in the browser so the UI is
 * fully playable without the Node.js server. Used as a fallback when the
 * Socket.IO server is unreachable, and for solo demos in the preview.
 *
 * Mirrors the server's room logic so the wire-equivalent behaviour stays
 * consistent. When migrating to AWS, this file is NOT used in production —
 * it just stays around for offline/dev mode.
 */
import {
  BOARD_HEIGHT,
  type ClientInput,
  type Player,
  type RoomState,
} from "@/types/tetris";
import {
  calculateScore,
  checkCollision,
  clearLines,
  createBoard,
  generatePiece,
  levelFromLines,
  mergePiece,
  movePiece,
  randomPieceType,
  rotatePiece,
  tickIntervalMs,
} from "@/game/engine";
import type {
  ErrorListener,
  MultiplayerAdapter,
  StateListener,
} from "./multiplayerAdapter";

const BOT_NAMES = ["NEO", "TRINITY", "MORPHEUS"];

export class LocalAdapter implements MultiplayerAdapter {
  private state: RoomState;
  private stateListeners = new Set<StateListener>();
  private errorListeners = new Set<ErrorListener>();
  private tickHandle: number | null = null;
  private meId = "local-player";

  constructor() {
    this.state = { roomId: "LOCAL", started: false, hostId: this.meId, players: [] };
  }

  async connect() {
    /* nothing to do */
  }
  disconnect() {
    if (this.tickHandle) window.clearInterval(this.tickHandle);
    this.tickHandle = null;
  }

  joinRoom(_roomId: string, playerName: string): void {
    const me: Player = this.makePlayer(this.meId, playerName);
    // Add 3 placeholder opponents so the 4-board UI is populated even offline.
    const others: Player[] = BOT_NAMES.map((n, i) =>
      this.makePlayer(`bot-${i}`, n, "waiting")
    );
    this.state = {
      roomId: "LOCAL",
      started: false,
      hostId: this.meId,
      players: [me, ...others],
    };
    this.emit();
  }

  ready(): void {
    const me = this.me();
    if (me) me.status = "ready";
    this.emit();
  }

  startGame(): void {
    this.state.started = true;
    for (const p of this.state.players) {
      p.status = "playing";
      p.board = createBoard();
      p.current = generatePiece(randomPieceType());
      p.next = randomPieceType();
      p.score = 0;
      p.lines = 0;
      p.level = 0;
    }
    this.emit();
    this.startTickLoop();
  }

  sendInput(input: ClientInput): void {
    const me = this.me();
    if (!me || me.status !== "playing" || !me.current) return;

    switch (input.type) {
      case "move":
        me.current = movePiece(me.current, input.dir, 0, me.board);
        break;
      case "rotate":
        me.current = rotatePiece(me.current, me.board);
        break;
      case "soft-drop":
        me.current = movePiece(me.current, 0, 1, me.board);
        break;
      case "hard-drop": {
        let p = me.current;
        while (!checkCollision({ ...p, y: p.y + 1 }, me.board)) {
          p = { ...p, y: p.y + 1 };
        }
        me.current = p;
        this.lockPiece(me);
        break;
      }
      case "pause":
        me.status = (me.status as string) === "paused" ? "playing" : "paused";
        break;
    }
    this.emit();
  }

  onState(l: StateListener) {
    this.stateListeners.add(l);
    return () => this.stateListeners.delete(l) as unknown as void;
  }
  onError(l: ErrorListener) {
    this.errorListeners.add(l);
    return () => this.errorListeners.delete(l) as unknown as void;
  }

  // ── internals ─────────────────────────────────────────────────────────────
  private me() {
    return this.state.players.find((p) => p.id === this.meId);
  }
  private makePlayer(id: string, name: string, status: Player["status"] = "waiting"): Player {
    return {
      id,
      name: name || "PLAYER",
      status,
      board: createBoard(),
      current: null,
      next: null,
      score: 0,
      lines: 0,
      level: 0,
    };
  }
  private emit() {
    const snapshot: RoomState = JSON.parse(JSON.stringify(this.state));
    this.stateListeners.forEach((l) => l(snapshot));
  }
  private startTickLoop() {
    if (this.tickHandle) window.clearInterval(this.tickHandle);
    this.tickHandle = window.setInterval(() => this.tick(), 60);
  }
  private lastTickAt = new Map<string, number>();
  private tick() {
    const now = performance.now();
    let dirty = false;
    for (const p of this.state.players) {
      if (p.status !== "playing" || !p.current) continue;
      const interval = tickIntervalMs(p.level);
      const last = this.lastTickAt.get(p.id) ?? 0;
      if (now - last < interval) continue;
      this.lastTickAt.set(p.id, now);

      const moved = movePiece(p.current, 0, 1, p.board);
      if (moved === p.current) {
        // couldn't move down → lock
        this.lockPiece(p);
      } else {
        p.current = moved;
      }
      dirty = true;
    }
    if (dirty) this.emit();
  }
  private lockPiece(p: Player) {
    if (!p.current) return;
    const merged = mergePiece(p.current, p.board);
    const { board: cleaned, cleared } = clearLines(merged);
    p.board = cleaned;
    p.lines += cleared;
    p.score += calculateScore(cleared, p.level);
    p.level = levelFromLines(p.lines);

    const nextType = p.next ?? randomPieceType();
    const spawned = generatePiece(nextType);
    p.next = randomPieceType();

    if (checkCollision(spawned, p.board)) {
      p.status = "gameover";
      p.current = null;
      // top-out: fill board to indicate
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < p.board[y].length; x++) {
          if (p.board[y][x].type === null && Math.random() > 0.6) {
            p.board[y][x] = { type: "I" };
          }
        }
      }
    } else {
      p.current = spawned;
    }
  }
}