// Génération de grilles résolubles et solveur.
//
// 1. generate() construit la grille À PARTIR d'une solution : glissades
//    aléatoires, et un trou posé juste après chaque arrêt pour le justifier.
//    Les cases jamais traversées deviennent des trous : résoluble par construction.
// 2. solve() vérifie indépendamment, par recherche exhaustive avec retour
//    arrière, qu'une solution existe. Le nombre d'impasses mesure la difficulté.
// Une grille n'est gardée que si les deux sont d'accord.

import { rng } from "./rng";
import { slide } from "./slide";
import { DIR_NAMES, DIRS, countOpen, isOpen, type Cell, type Difficulty, type Dir, type Grid } from "./types";

export interface DifficultyConf {
  label: string;
  size: number;
  minFill: number;
  minDeadEnds: number;
}

export const DIFFICULTIES: Record<Difficulty, DifficultyConf> = {
  facile: { label: "EASY", size: 5, minFill: 0.7, minDeadEnds: 0 },
  normal: { label: "NORMAL", size: 7, minFill: 0.72, minDeadEnds: 4 },
  difficile: { label: "HARD", size: 9, minFill: 0.65, minDeadEnds: 20 },
};

export const DIFFICULTY_ORDER: Difficulty[] = ["facile", "normal", "difficile"];

const UNKNOWN = 0, OPEN = 1, HOLE = 2;

function carve(size: number, rand: () => number): { grid: Grid; start: Cell } {
  const cell = new Uint8Array(size * size);
  const idx = (r: number, c: number) => r * size + c;
  const inside = (r: number, c: number) => r >= 0 && c >= 0 && r < size && c < size;
  let r = Math.floor(rand() * size), c = Math.floor(rand() * size);
  cell[idx(r, c)] = OPEN;
  const start: Cell = [r, c];

  for (;;) {
    const options: [number, number, number][] = [];
    for (const d of DIR_NAMES) {
      const [dr, dc] = DIRS[d];
      let max = 0;
      while (inside(r + dr * (max + 1), c + dc * (max + 1)) && cell[idx(r + dr * (max + 1), c + dc * (max + 1))] === UNKNOWN) max++;
      for (let L = 1; L <= max; L++) options.push([dr, dc, L]);
    }
    if (options.length === 0) break;
    // Favorise les glissades longues : grilles plus pleines. Les clés aléatoires
    // sont tirées AVANT le tri : un comparateur qui appelle rand() donnerait un
    // ordre différent selon le moteur JS, donc une autre grille pour la même graine.
    const ranked = options.map((o) => ({ o, key: o[2] + (rand() - 0.5) * size })).sort((a, b) => b.key - a.key);
    const [dr, dc, L] = ranked[Math.floor(Math.pow(rand(), 2) * ranked.length)].o;
    for (let k = 1; k <= L; k++) cell[idx(r + dr * k, c + dc * k)] = OPEN;
    r += dr * L;
    c += dc * L;
    if (inside(r + dr, c + dc) && cell[idx(r + dr, c + dc)] === UNKNOWN) cell[idx(r + dr, c + dc)] = HOLE;
  }
  const grid: string[] = [];
  for (let i = 0; i < size; i++) {
    let row = "";
    for (let j = 0; j < size; j++) row += cell[idx(i, j)] === OPEN ? "." : "#";
    grid.push(row);
  }
  return { grid, start };
}

export interface Solution {
  start: Cell;
  moves: Dir[];
}

export interface SolveResult {
  /** true : résoluble ; false : impossible ; null : trop long à décider. */
  solvable: boolean | null;
  solution?: Solution;
  deadEnds: number;
}

export function solve(grid: Grid, { budget = 2_000_000, startAt }: { budget?: number; startAt?: Cell } = {}): SolveResult {
  const rows = grid.length, cols = grid[0].length;
  const open: Cell[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (isOpen(grid, r, c)) open.push([r, c]);
  const total = open.length;
  const filled = new Uint8Array(rows * cols);
  const isFree = (r: number, c: number) => isOpen(grid, r, c) && !filled[r * cols + c];
  let deadEnds = 0, steps = 0;
  const moves: Dir[] = [];

  const dfs = (head: Cell, count: number): boolean => {
    if (count === total) return true;
    if (++steps > budget) throw new Error("budget");
    let moved = false;
    for (const d of DIR_NAMES) {
      const trail = slide(isFree, head, d);
      if (trail.length === 0) continue;
      moved = true;
      for (const [r, c] of trail) filled[r * cols + c] = 1;
      moves.push(d);
      if (dfs(trail[trail.length - 1], count + trail.length)) return true;
      moves.pop();
      for (const [r, c] of trail) filled[r * cols + c] = 0;
    }
    if (!moved) deadEnds++;
    return false;
  };

  try {
    for (const s of startAt ? [startAt] : open) {
      filled[s[0] * cols + s[1]] = 1;
      if (dfs(s, 1)) return { solvable: true, solution: { start: s, moves: [...moves] }, deadEnds };
      filled[s[0] * cols + s[1]] = 0;
    }
  } catch (e) {
    if ((e as Error).message !== "budget") throw e;
    return { solvable: null, deadEnds };
  }
  return { solvable: false, deadEnds };
}

export interface GeneratedGrid {
  difficulty: Difficulty;
  seed: number;
  grid: Grid;
  cells: number;
  deadEnds: number;
  solution: Solution;
}

/** Grille résoluble pour une difficulté ; `seed` la rend reproductible (son numéro). */
export function generate(difficulty: Difficulty, seed: number): GeneratedGrid {
  const conf = DIFFICULTIES[difficulty];
  const rand = rng(seed);
  // Une tentative coûte quelques centièmes de ms ; 20 000 couvre largement les graines difficiles.
  for (let attempt = 0; attempt < 20_000; attempt++) {
    const { grid, start } = carve(conf.size, rand);
    const cells = countOpen(grid);
    if (cells / (conf.size * conf.size) < conf.minFill) continue;
    const fromCarved = solve(grid, { startAt: start });
    if (!fromCarved.solvable || !fromCarved.solution) continue;
    const full = solve(grid);
    if (full.solvable !== true || full.deadEnds < conf.minDeadEnds) continue;
    return { difficulty, seed, grid, cells, deadEnds: full.deadEnds, solution: fromCarved.solution };
  }
  throw new Error(`Aucune grille ${conf.label} trouvée pour la graine ${seed}`);
}

/** Rejoue une solution : toutes les cases du chemin, dans l'ordre. */
export function replay(grid: Grid, { start, moves }: Solution): Cell[] {
  const filled = new Set([`${start[0]},${start[1]}`]);
  const path: Cell[] = [start];
  const isFree = (r: number, c: number) => isOpen(grid, r, c) && !filled.has(`${r},${c}`);
  for (const d of moves) {
    for (const cell of slide(isFree, path[path.length - 1], d)) {
      filled.add(`${cell[0]},${cell[1]}`);
      path.push(cell);
    }
  }
  return path;
}
