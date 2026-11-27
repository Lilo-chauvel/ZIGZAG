import { DIRS, type Cell, type Dir } from "./types";

/**
 * LA règle du jeu, définie une seule fois : depuis `head`, le serpent avance
 * dans `dir` tant que la case suivante est libre (ni bord, ni trou, ni trace).
 * Renvoie les cases traversées, dans l'ordre ; vide si le coup est immobile.
 * Utilisée par le solveur et par la partie.
 */
export function slide(isFree: (r: number, c: number) => boolean, head: Cell, dir: Dir): Cell[] {
  const [dr, dc] = DIRS[dir];
  const out: Cell[] = [];
  let [r, c] = head;
  while (isFree(r + dr, c + dc)) {
    r += dr;
    c += dc;
    out.push([r, c]);
  }
  return out;
}
