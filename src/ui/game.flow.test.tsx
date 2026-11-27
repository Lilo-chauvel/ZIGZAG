import { act, fireEvent, render, screen } from "@testing-library/react";
import { newGame, reduce } from "../core/game";
import { centerCell, moveCursor } from "../core/cursor";
import { generate } from "../core/grid";
import { boardGeometry } from "./components/Board";
import { isOpen } from "../core/types";
import { list, listMisses } from "../store/palmares";
import { Game } from "./screens/Game";
import { Palmares } from "./screens/Palmares";
import { Menu } from "./screens/Menu";
import { T } from "./texts";

const KEYS = { haut: "ArrowUp", bas: "ArrowDown", gauche: "ArrowLeft", droite: "ArrowRight" } as const;
// Chaque étape d'animation planifie la suivante depuis un effet React : on avance pas à pas.
const flush = () => {
  for (let i = 0; i < 150; i++) act(() => vi.advanceTimersByTime(40));
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

/** Clique la case [r, c] : les zones cliquables sont rendues ligne par ligne, cases libres seulement. */
function clickCell(container: HTMLElement, grid: readonly string[], [r, c]: readonly [number, number]) {
  let index = 0;
  for (let i = 0; i < grid.length; i++)
    for (let j = 0; j < grid[0].length; j++) {
      if (!isOpen(grid, i, j)) continue;
      if (i === r && j === c) return fireEvent.click(container.querySelectorAll("svg rect")[index + 1]); // +1 : fond
      index++;
    }
}

it("joue une grille jusqu'à la victoire et la retrouve dans le Palmarès", () => {
  const seed = 42;
  const { grid, solution, cells } = generate("normal", seed);
  const onNewGrid = vi.fn();
  const { container, unmount } = render(<Game difficulty="normal" seed={seed} onMenu={() => {}} onNewGrid={onNewGrid} />);

  expect(screen.getByText(T.placement)).toBeTruthy();
  clickCell(container, grid, solution.start);
  expect(screen.getByText(T.playing)).toBeTruthy();

  for (const d of solution.moves) {
    fireEvent.keyDown(window, { key: KEYS[d] });
    flush(); // laisse la glissade s'afficher
  }
  flush(); // repassage vert + anneau
  expect(screen.getByText(T.perfect)).toBeTruthy(); // aucun REWIND utilisé
  expect(screen.getByText(new RegExp(`${cells} cases en ${solution.moves.length} dashs`))).toBeTruthy();

  const wins = list("normal");
  expect(wins).toHaveLength(1);
  expect(wins[0]).toMatchObject({ seed, moves: solution.moves.length, start: solution.start, dirs: solution.moves });

  fireEvent.keyDown(window, { key: " " });
  expect(onNewGrid).toHaveBeenCalled();
  unmount();

  render(<Palmares initial="normal" onMenu={() => {}} onReplay={() => {}} />);
  expect(screen.getByText(T.stage(42))).toBeTruthy();
});

it("SOLVE rejoue la solution et la classe comme non réussie", () => {
  const seed = 42;
  const { grid, solution } = generate("normal", seed);
  const { container } = render(<Game difficulty="normal" seed={seed} onMenu={() => {}} onNewGrid={() => {}} />);
  // Part d'une partie déjà entamée ailleurs que sur la solution.
  const other = grid.flatMap((row, r) => [...row].map((_, c) => [r, c] as const)).find(([r, c]) => isOpen(grid, r, c) && (r !== solution.start[0] || c !== solution.start[1]))!;
  clickCell(container, grid, other);
  fireEvent.click(screen.getByRole("button", { name: new RegExp(T.solve) }));
  flush();
  flush();
  expect(screen.getByText(T.solved)).toBeTruthy();
  expect(screen.getByText(new RegExp(`en ${solution.moves.length} dashs`))).toBeTruthy();
  expect(list("normal")).toHaveLength(0);
  expect(listMisses("normal")).toMatchObject([{ seed, outcome: "solve" }]);
});

it("un stage abandonné apparaît dans l'historique", () => {
  const seed = 42;
  const { grid, solution, cells } = generate("normal", seed);
  const onMenu = vi.fn();
  const { container, unmount } = render(<Game difficulty="normal" seed={seed} onMenu={onMenu} onNewGrid={() => {}} />);
  clickCell(container, grid, solution.start);
  fireEvent.keyDown(window, { key: KEYS[solution.moves[0]] });
  flush();
  fireEvent.keyDown(window, { key: "Escape" });
  expect(onMenu).toHaveBeenCalled();
  unmount();

  const [miss] = listMisses("normal");
  expect(miss).toMatchObject({ seed, outcome: "abandon", dirs: [solution.moves[0]] });
  expect(miss.left).toBeGreaterThan(0);
  expect(miss.left).toBeLessThan(cells);
  render(<Palmares initial="normal" onMenu={() => {}} onReplay={() => {}} />);
  expect(screen.getByText(T.stage(seed))).toBeTruthy();
  expect(screen.getByText(T.missAbandon(miss.left))).toBeTruthy();
});

it("se bloque, annule, et propose les bonnes actions", () => {
  const seed = 7;
  const { grid, solution } = generate("facile", seed);
  const { container } = render(<Game difficulty="facile" seed={seed} onMenu={() => {}} onNewGrid={() => {}} />);
  clickCell(container, grid, solution.start);
  // Joue des coups au hasard jusqu'à être bloqué ou gagner.
  const order = ["haut", "droite", "bas", "gauche"] as const;
  for (let i = 0; i < 40 && !screen.queryByText(T.gameOver) && !screen.queryByText(T.perfect); i++) {
    fireEvent.keyDown(window, { key: KEYS[order[i % 4]] });
    flush();
  }
  if (screen.queryByText(T.gameOver)) {
    fireEvent.click(screen.getByRole("button", { name: new RegExp(T.rewind) }));
    flush();
    expect(screen.queryByText(T.gameOver)).toBeNull();
    expect(screen.getByText(T.playing)).toBeTruthy();
  }
});

it("le START se choisit entièrement au clavier", () => {
  const seed = 42;
  const { grid } = generate("normal", seed);
  const { container } = render(<Game difficulty="normal" seed={seed} onMenu={() => {}} onNewGrid={() => {}} />);
  const target = moveCursor(grid, centerCell(grid), "droite");
  fireEvent.keyDown(window, { key: "ArrowRight" });
  fireEvent.keyDown(window, { key: " " });
  expect(screen.getByText(T.playing)).toBeTruthy();
  // L'anneau du START est posé sur la case visée.
  const g = boardGeometry(grid);
  const ring = [...container.querySelectorAll("circle")].at(-1)!;
  expect([Number(ring.getAttribute("cx")), Number(ring.getAttribute("cy"))]).toEqual([g.x(target[1]), g.y(target[0])]);
});

it("le menu change de difficulté au clavier et lance la partie", () => {
  const onPlay = vi.fn();
  render(<Menu initial="normal" onPlay={onPlay} onPalmares={() => {}} />);
  fireEvent.keyDown(window, { key: "ArrowRight" });
  fireEvent.keyDown(window, { key: " " });
  expect(onPlay).toHaveBeenCalledWith("difficile");
});

it("la difficulté ne s'affiche que quand START est sélectionné", () => {
  const onPalmares = vi.fn();
  render(<Menu initial="facile" onPlay={() => {}} onPalmares={onPalmares} />);
  expect(screen.getByRole("tablist")).toBeTruthy();
  fireEvent.keyDown(window, { key: "ArrowDown" });
  expect(screen.queryByRole("tablist")).toBeNull();
  fireEvent.keyDown(window, { key: "Enter" });
  expect(onPalmares).toHaveBeenCalledWith("facile");
});

it("une touche pressée pendant une glissade est jouée ensuite", () => {
  const seed = 42;
  const { grid, solution } = generate("normal", seed);
  const { container } = render(<Game difficulty="normal" seed={seed} onMenu={() => {}} onNewGrid={() => {}} />);
  clickCell(container, grid, solution.start);
  const [m1, m2] = solution.moves;
  fireEvent.keyDown(window, { key: KEYS[m1] });
  fireEvent.keyDown(window, { key: KEYS[m2] }); // pendant la glissade
  flush();
  const expected = [m1, m2].reduce((st, dir) => reduce(st, { type: "glisser", dir, now: 0 }), reduce(newGame(grid, "normal", seed), { type: "placer", cell: solution.start, now: 0 }));
  expect(container.textContent).toContain(`${expected.path.length} / ${expected.cells}`);
});
