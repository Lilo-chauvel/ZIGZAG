import { useEffect, useRef } from "react";
import type { Dir } from "../../core/types";

/** Touches de direction : flèches, ZQSD (AZERTY) et WASD (QWERTY). */
const DIR_KEYS: Record<string, Dir> = {
  ArrowUp: "haut", z: "haut", w: "haut",
  ArrowDown: "bas", s: "bas",
  ArrowLeft: "gauche", q: "gauche", a: "gauche",
  ArrowRight: "droite", d: "droite",
};

export type KeyHandlers = Partial<{
  dir: (d: Dir) => void;
  undo: () => void; // Retour arrière
  restart: () => void; // R
  space: () => void; // Espace
  enter: () => void; // Entrée
  escape: () => void; // Échap
  h: () => void;
}>;

/** Écoute le clavier tant que le composant est monté. Les handlers peuvent changer à chaque rendu. */
export function useKeyboard(handlers: KeyHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const h = ref.current;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      let fn: (() => void) | undefined;
      if (DIR_KEYS[k] && h.dir) fn = () => h.dir!(DIR_KEYS[k]);
      else if (k === "Backspace") fn = h.undo;
      else if (k === "r") fn = h.restart;
      else if (k === " ") fn = h.space;
      else if (k === "Enter") fn = h.enter;
      else if (k === "Escape") fn = h.escape;
      else if (k === "h") fn = h.h;
      if (!fn) return;
      e.preventDefault();
      if (!e.repeat || DIR_KEYS[k]) fn();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
