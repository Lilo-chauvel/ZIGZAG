import { act, fireEvent, render, screen } from "@testing-library/react";
import { newGame, reduce } from "../core/game";
import { generate } from "../core/grid";
import { isOpen } from "../core/types";
import { list } from "../store/palmares";
import { Game } from "./screens/Game";
import { Palmares } from "./screens/Palmares";
import { Menu } from "./screens/Menu";

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

  expect(screen.getByText("Clique sur une case pour placer le départ.")).toBeTruthy();
  clickCell(container, grid, solution.start);
  expect(screen.getByText(/Choisis une direction/)).toBeTruthy();

  for (const d of solution.moves) {
    fireEvent.keyDown(window, { key: KEYS[d] });
    flush(); // laisse la glissade s'afficher
  }
  flush(); // repassage vert + anneau
  expect(screen.getByText("Grille remplie")).toBeTruthy();
  expect(screen.getByText(new RegExp(`${cells} cases en ${solution.moves.length} coups`))).toBeTruthy();

  const wins = list("normal");
  expect(wins).toHaveLength(1);
  expect(wins[0]).toMatchObject({ seed, moves: solution.moves.length, start: solution.start, dirs: solution.moves });

  fireEvent.keyDown(window, { key: " " });
  expect(onNewGrid).toHaveBeenCalled();
  unmount();

  render(<Palmares initial="normal" onMenu={() => {}} onReplay={() => {}} />);
  expect(screen.getByText("Grille #042")).toBeTruthy();
});

it("se bloque, annule, et propose les bonnes actions", () => {
  const seed = 7;
  const { grid, solution } = generate("facile", seed);
  const { container } = render(<Game difficulty="facile" seed={seed} onMenu={() => {}} onNewGrid={() => {}} />);
  clickCell(container, grid, solution.start);
  // Joue des coups au hasard jusqu'à être bloqué ou gagner.
  const order = ["haut", "droite", "bas", "gauche"] as const;
  for (let i = 0; i < 40 && !screen.queryByText("Bloqué") && !screen.queryByText("Grille remplie"); i++) {
    fireEvent.keyDown(window, { key: KEYS[order[i % 4]] });
    flush();
  }
  if (screen.queryByText("Bloqué")) {
    fireEvent.click(screen.getByText("Annuler le coup"));
    flush();
    expect(screen.queryByText("Bloqué")).toBeNull();
    expect(screen.getByText(/Choisis une direction/)).toBeTruthy();
  }
});

it("le menu change de difficulté au clavier et lance la partie", () => {
  const onPlay = vi.fn();
  render(<Menu initial="normal" onPlay={onPlay} onPalmares={() => {}} />);
  fireEvent.keyDown(window, { key: "ArrowDown" });
  fireEvent.keyDown(window, { key: " " });
  expect(onPlay).toHaveBeenCalledWith("difficile");
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
