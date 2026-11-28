import { slide } from "./slide";
import { DIR_NAMES, cellKey, countOpen, isOpen, type Cell, type Difficulty, type Dir, type Grid } from "./types";

export type Phase = "placement" | "jeu" | "gagné" | "bloqué";

export interface GameState {
  grid: Grid;
  difficulty: Difficulty;
  seed: number;
  /** Nombre de cases libres à remplir. */
  cells: number;
  /** Toutes les cases remplies, dans l'ordre. path[0] = départ. */
  path: Cell[];
  /** Longueur de `path` à la fin de chaque coup, pour Annuler. */
  moveEnds: number[];
  phase: Phase;
  startedAt: number | null;
  endedAt: number | null;
  /** Nombre d'Annuler utilisés : 0 à la fin = PERFECT. */
  rewinds: number;
}

export type Action =
  | { type: "placer"; cell: Cell; now: number }
  | { type: "glisser"; dir: Dir; now: number }
  | { type: "annuler" }
  | { type: "recommencer" };

export function newGame(grid: Grid, difficulty: Difficulty, seed: number): GameState {
  return { grid, difficulty, seed, cells: countOpen(grid), path: [], moveEnds: [], phase: "placement", startedAt: null, endedAt: null, rewinds: 0 };
}

const freeTest = (s: GameState) => {
  const filled = new Set(s.path.map(cellKey));
  return (r: number, c: number) => isOpen(s.grid, r, c) && !filled.has(`${r},${c}`);
};

const head = (s: GameState) => s.path[s.path.length - 1];

/** Directions jouées, retrouvées depuis le chemin (pour la touche active et le Palmarès). */
export function dirsOf(s: Pick<GameState, "path" | "moveEnds">): Dir[] {
  let prevEnd = 1;
  return s.moveEnds.map((end) => {
    const [r0, c0] = s.path[prevEnd - 1], [r1, c1] = s.path[prevEnd];
    prevEnd = end;
    return r1 < r0 ? "haut" : r1 > r0 ? "bas" : c1 < c0 ? "gauche" : "droite";
  });
}

/** Directions qui font avancer le serpent (pour griser les autres touches). */
export function availableDirs(s: GameState): Dir[] {
  if (s.phase !== "jeu") return [];
  const isFree = freeTest(s);
  return DIR_NAMES.filter((d) => slide(isFree, head(s), d).length > 0);
}

/** Vrai tant qu'on peut (re)poser le départ : au placement, ou départ posé sans aucun dash. */
export function canPlace(s: GameState): boolean {
  return s.phase === "placement" || ((s.phase === "jeu" || s.phase === "bloqué") && s.moveEnds.length === 0);
}

/** Phase après un coup : gagné, bloqué, ou on continue. */
function settle(s: GameState, now: number): GameState {
  if (s.path.length === s.cells) return { ...s, phase: "gagné", endedAt: now };
  const isFree = freeTest(s);
  const stuck = DIR_NAMES.every((d) => slide(isFree, head(s), d).length === 0);
  return stuck ? { ...s, phase: "bloqué", endedAt: now } : { ...s, phase: "jeu", endedAt: null };
}

export function reduce(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "placer": {
      // Le départ reste modifiable tant qu'aucun dash n'a été joué.
      if (!canPlace(s) || !isOpen(s.grid, a.cell[0], a.cell[1])) return s;
      if (s.path.length && cellKey(s.path[0]) === cellKey(a.cell)) return s;
      return settle({ ...s, path: [a.cell], moveEnds: [], startedAt: a.now }, a.now);
    }
    case "glisser": {
      if (s.phase !== "jeu") return s;
      const trail = slide(freeTest(s), head(s), a.dir);
      if (trail.length === 0) return s;
      const path = [...s.path, ...trail];
      return settle({ ...s, path, moveEnds: [...s.moveEnds, path.length] }, a.now);
    }
    case "annuler": {
      if (s.phase === "placement" || s.phase === "gagné") return s;
      // Retirer un départ sans dash n'est pas un REWIND : on peut changer de départ sans perdre le PERFECT.
      if (s.moveEnds.length === 0) return { ...s, path: [], phase: "placement", startedAt: null, endedAt: null };
      const moveEnds = s.moveEnds.slice(0, -1);
      const keep = moveEnds.length ? moveEnds[moveEnds.length - 1] : 1;
      return { ...s, path: s.path.slice(0, keep), moveEnds, phase: "jeu", endedAt: null, rewinds: s.rewinds + 1 };
    }
    case "recommencer":
      return newGame(s.grid, s.difficulty, s.seed);
  }
}
