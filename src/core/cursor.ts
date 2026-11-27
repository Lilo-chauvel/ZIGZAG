import { DIRS, isOpen, type Cell, type Dir, type Grid } from "./types";

/** Case libre la plus proche du centre : position de départ du curseur de placement. */
export function centerCell(grid: Grid): Cell {
  const rows = grid.length, cols = grid[0].length;
  const cr = (rows - 1) / 2, cc = (cols - 1) / 2;
  let best: Cell = [0, 0], bestD = Infinity;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const d = (r - cr) ** 2 + (c - cc) ** 2;
      if (isOpen(grid, r, c) && d < bestD) [best, bestD] = [[r, c], d];
    }
  return best;
}

/**
 * Déplace le curseur de placement vers la prochaine case libre dans `dir`,
 * en sautant les blocs. Si la ligne n'en a plus, prend la case libre la plus
 * proche dans les lignes suivantes ; sinon reste sur place.
 */
export function moveCursor(grid: Grid, [r, c]: Cell, dir: Dir): Cell {
  const [dr, dc] = DIRS[dir];
  const rows = grid.length, cols = grid[0].length;
  const n = Math.max(rows, cols);
  // 1. Tout droit, par-dessus les blocs.
  for (let step = 1; step < n; step++) if (isOpen(grid, r + dr * step, c + dc * step)) return [r + dr * step, c + dc * step];
  // 2. Ligne bouchée : rangée suivante la plus proche, en s'écartant de part et d'autre.
  for (let step = 1; step < n; step++) {
    const r0 = r + dr * step, c0 = c + dc * step;
    if (r0 < 0 || c0 < 0 || r0 >= rows || c0 >= cols) break;
    for (let off = 1; off < n; off++) {
      for (const sign of [-1, 1]) {
        const rr = r0 + (dr === 0 ? sign * off : 0), cc = c0 + (dc === 0 ? sign * off : 0);
        if (isOpen(grid, rr, cc)) return [rr, cc];
      }
    }
  }
  return [r, c];
}
