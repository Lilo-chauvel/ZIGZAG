import { DIFFICULTY_ORDER, generate, replay, solve } from "./grid";

describe("solve", () => {
  it("reconnaît une grille résoluble", () => {
    expect(solve(["....", "....", "....", "...#"]).solvable).toBe(true);
  });
  it("reconnaît une grille impossible", () => {
    expect(solve([".#.", "###", ".#."]).solvable).toBe(false);
  });
});

describe.each(DIFFICULTY_ORDER)("generate(%s)", (difficulty) => {
  const seeds = Array.from({ length: 30 }, (_, i) => i + 1);

  it.each(seeds)("graine %i : la solution remplit toutes les cases", (seed) => {
    const g = generate(difficulty, seed);
    const path = replay(g.grid, g.solution);
    expect(path.length).toBe(g.cells);
    expect(new Set(path.map(String)).size).toBe(g.cells);
  });

  it("même graine, même grille", () => {
    expect(generate(difficulty, 42).grid).toEqual(generate(difficulty, 42).grid);
  });
});

it("une graine donne toujours la même grille (numéros du Palmarès stables)", () => {
  // Si ce test casse, l'algorithme a changé : les grilles déjà au Palmarès ne seraient plus les mêmes.
  expect(generate("facile", 42).grid).toEqual([".....", ".....", ".....", ".....", "....."]);
});
