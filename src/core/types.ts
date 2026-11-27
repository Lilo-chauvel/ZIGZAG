/** Une case de la grille : [ligne, colonne], à partir de 0. */
export type Cell = readonly [number, number];

export type Dir = "haut" | "bas" | "gauche" | "droite";

/** Une chaîne par ligne : "." case libre, "#" trou. */
export type Grid = readonly string[];

export type Difficulty = "facile" | "normal" | "difficile";

export const DIRS: Record<Dir, Cell> = {
  haut: [-1, 0],
  bas: [1, 0],
  gauche: [0, -1],
  droite: [0, 1],
};

export const DIR_NAMES = Object.keys(DIRS) as Dir[];

export const cellKey = (c: Cell) => `${c[0]},${c[1]}`;

export const isOpen = (grid: Grid, r: number, c: number) =>
  r >= 0 && c >= 0 && r < grid.length && c < grid[0].length && grid[r][c] !== "#";

export const countOpen = (grid: Grid) => grid.join("").split(".").length - 1;
