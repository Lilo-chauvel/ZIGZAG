import { forwardRef, type ReactNode } from "react";
import type { Phase } from "../../core/game";
import { isOpen, type Cell, type Grid } from "../../core/types";
import s from "./Board.module.css";

/** Taille interne du plateau (viewBox). Le SVG s'adapte ensuite à son conteneur. */
export const BOARD_SIZE = 350;
const NODE = 0.56, LINK = 0.16, TRAIL = 0.32;

export function boardGeometry(grid: Grid) {
  const rows = grid.length, cols = grid[0].length;
  // Marge = un demi-pas : les cases du bord ne sont jamais coupées.
  const pitch = BOARD_SIZE / Math.max(rows, cols);
  const offX = (BOARD_SIZE - (cols - 1) * pitch) / 2;
  const offY = (BOARD_SIZE - (rows - 1) * pitch) / 2;
  return { pitch, x: (c: number) => offX + c * pitch, y: (r: number) => offY + r * pitch };
}

export interface BoardProps {
  grid: Grid;
  /** Cases visibles du chemin (déjà limitées à la glissade en cours). */
  path: readonly Cell[];
  /** Les cases d'index ≤ greenUpTo sont vertes. Le départ (0) l'est toujours. */
  greenUpTo?: number;
  phase: Phase;
  ghost?: Cell | null;
  hideStartRing?: boolean;
  onCellHover?: (cell: Cell | null) => void;
  onCellClick?: (cell: Cell) => void;
  label?: string;
  className?: string;
}

export const Board = forwardRef<SVGSVGElement, BoardProps>(function Board(
  { grid, path, greenUpTo = 0, phase, ghost, hideStartRing, onCellHover, onCellClick, label, className },
  ref,
) {
  const { pitch, x, y } = boardGeometry(grid);
  const rows = grid.length, cols = grid[0].length;
  const started = path.length > 0;
  const visited = new Set(path.map(([r, c]) => `${r},${c}`));
  const won = phase === "gagné";
  const green = (i: number) => i === 0 || won || i <= greenUpTo;

  const links: ReactNode[] = [], nodes: ReactNode[] = [], hits: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isOpen(grid, r, c)) continue;
      if (isOpen(grid, r, c + 1)) links.push(<line key={`h${r}-${c}`} x1={x(c)} y1={y(r)} x2={x(c + 1)} y2={y(r)} />);
      if (isOpen(grid, r + 1, c)) links.push(<line key={`v${r}-${c}`} x1={x(c)} y1={y(r)} x2={x(c)} y2={y(r + 1)} />);
      if (!visited.has(`${r},${c}`)) nodes.push(<circle key={`n${r}-${c}`} className={s.node} cx={x(c)} cy={y(r)} r={(pitch * NODE) / 2} />);
      if (onCellClick)
        hits.push(
          <rect
            key={`hit${r}-${c}`}
            className={s.hit}
            x={x(c) - pitch / 2}
            y={y(r) - pitch / 2}
            width={pitch}
            height={pitch}
            onPointerEnter={() => onCellHover?.([r, c])}
            onClick={() => onCellClick([r, c])}
          />,
        );
    }
  }

  const segments = path.slice(1).map(([r, c], i) => {
    const [pr, pc] = path[i];
    return <line key={`t${i}`} className={green(i + 1) ? s.trailGreen : s.trail} x1={x(pc)} y1={y(pr)} x2={x(c)} y2={y(r)} strokeWidth={pitch * TRAIL} />;
  });
  const filled = path.map(([r, c], i) => {
    const last = i === path.length - 1;
    const cls = i === 0 ? s.start : won ? s.green : last ? (phase === "bloqué" ? s.stuck : s.head) : green(i) ? s.green : s.filled;
    const rad = ((pitch * NODE) / 2) * (last && !won && i > 0 ? 1.2 : 1);
    return <circle key={`f${i}`} className={cls} cx={x(c)} cy={y(r)} r={rad} />;
  });

  return (
    <svg
      ref={ref}
      className={[s.board, started ? s.started : "", className].join(" ")}
      viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
      role="img"
      aria-label={label ?? `Grille ${cols} × ${rows}`}
      onPointerLeave={() => onCellHover?.(null)}
    >
      <rect className={s.bg} width={BOARD_SIZE} height={BOARD_SIZE} />
      <g className={s.links} strokeWidth={pitch * LINK}>{links}</g>
      {segments}
      {nodes}
      {filled}
      {started && !hideStartRing && (
        <circle className={s.ring} cx={x(path[0][1])} cy={y(path[0][0])} r={pitch * 0.38} strokeWidth={pitch * 0.05} />
      )}
      {ghost && !started && (
        <circle className={s.ghost} cx={x(ghost[1])} cy={y(ghost[0])} r={pitch * 0.4} strokeWidth={pitch * 0.06} />
      )}
      {hits}
    </svg>
  );
});
