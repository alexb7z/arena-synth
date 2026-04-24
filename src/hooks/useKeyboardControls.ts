import { useEffect } from "react";
import type { ClientInput } from "@/types/tetris";

/**
 *  ←  move left
 *  →  move right
 *  ↓  soft drop
 *  ↑  rotate
 *  space hard drop
 *  P  pause
 */
export function useKeyboardControls(
  onInput: (input: ClientInput) => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      // ignore typing in inputs
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onInput({ type: "move", dir: -1 });
          break;
        case "ArrowRight":
          e.preventDefault();
          onInput({ type: "move", dir: 1 });
          break;
        case "ArrowDown":
          e.preventDefault();
          onInput({ type: "soft-drop" });
          break;
        case "ArrowUp":
          e.preventDefault();
          onInput({ type: "rotate" });
          break;
        case " ":
          e.preventDefault();
          onInput({ type: "hard-drop" });
          break;
        case "p":
        case "P":
          e.preventDefault();
          onInput({ type: "pause" });
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onInput, enabled]);
}