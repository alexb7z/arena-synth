/**
 * LocalAdapter — modo local/offline.
 * Usado apenas quando o servidor Socket.IO não está disponível.
 * Não cria bots nem ocupa vagas de outros jogadores.
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

export class LocalAdapter implements MultiplayerAdapter {
  private state: RoomState;
  private stateListeners = new Set<StateListener>();
  private errorListeners = new Set<ErrorListener>();
  private tickHandle: number | null = null;
  private meId = "local-player";
  private lastTickAt = new Map<string, number>();

  constructor() {
    this.state = {
      roomId: "LOCAL",
      started: false,
      hostId: this.meId,
      players: [],
    };
  }

  async connect() {
    // modo local: nada para conectar
  }

  disconnect() {
    if (this.tickHandle) window.clearInterval(this.tickHandle);
    this.tickHandle = null;
  }

  joinRoom(_roomId: string, playerName: string): void {
    const me: Player = this.makePlayer(this.meId, playerName);

    this.state = {
      roomId: "LOCAL",
      started: false,
      hostId: this.meId,
      players: [me],
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
        me.status = me.status === "paused" ? "playing" : "paused";
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

  private me() {
    return this.state.players.find((p) => p.id === this.meId);
  }

  private makePlayer(
    id: string,
    name: string,
    status: Player["status"] = "waiting"
  ): Player {
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
