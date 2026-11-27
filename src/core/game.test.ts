import { availableDirs, dirsOf, newGame, reduce, type Action, type GameState } from "./game";
import type { Grid } from "./types";

// Grille de la maquette Figma : 4×4, coin bas-droit troué. 15 cases.
const G4: Grid = ["....", "....", "....", "...#"];
const play = (s: GameState, ...actions: Action[]) => actions.reduce(reduce, s);
const at = (now = 0) => ({ now });

describe("placement", () => {
  it("refuse un trou", () => {
    const s = play(newGame(G4, "facile", 1), { type: "placer", cell: [3, 3], ...at() });
    expect(s.phase).toBe("placement");
    expect(s.path).toEqual([]);
  });
  it("accepte une case libre et passe en jeu", () => {
    const s = play(newGame(G4, "facile", 1), { type: "placer", cell: [0, 0], ...at(5) });
    expect(s.phase).toBe("jeu");
    expect(s.path).toEqual([[0, 0]]);
    expect(s.startedAt).toBe(5);
  });
});

describe("glissade", () => {
  const placed = play(newGame(G4, "facile", 1), { type: "placer", cell: [0, 0], ...at() });

  it("va jusqu'au bord", () => {
    const s = play(placed, { type: "glisser", dir: "droite", ...at() });
    expect(s.path).toEqual([[0, 0], [0, 1], [0, 2], [0, 3]]);
  });
  it("s'arrête avant un trou", () => {
    const s = play(placed, { type: "glisser", dir: "droite", ...at() }, { type: "glisser", dir: "bas", ...at() });
    expect(s.path.at(-1)).toEqual([2, 3]);
  });
  it("s'arrête avant sa propre trace", () => {
    const s = play(
      placed,
      { type: "glisser", dir: "bas", ...at() },
      { type: "glisser", dir: "droite", ...at() },
      { type: "glisser", dir: "haut", ...at() },
      { type: "glisser", dir: "gauche", ...at() },
    );
    expect(s.path.at(-1)).toEqual([0, 1]);
  });
  it("ignore un coup immobile", () => {
    const s = play(placed, { type: "glisser", dir: "haut", ...at() });
    expect(s).toBe(placed);
  });
  it("donne les directions possibles", () => {
    expect(availableDirs(placed).sort()).toEqual(["bas", "droite"]);
  });
});

describe("fin de partie", () => {
  it("gagne quand toutes les cases sont remplies", () => {
    // Solution vérifiée de la maquette « Gagné ».
    const s = play(
      newGame(G4, "facile", 1),
      { type: "placer", cell: [2, 1], ...at(0) },
      ...(["haut", "gauche", "bas", "droite", "haut", "droite", "bas"] as const).map((dir) => ({ type: "glisser" as const, dir, ...at(1000) })),
    );
    expect(s.phase).toBe("gagné");
    expect(s.path.length).toBe(15);
    expect(s.endedAt).toBe(1000);
    expect(dirsOf(s)).toEqual(["haut", "gauche", "bas", "droite", "haut", "droite", "bas"]);
  });

  it("se bloque quand plus rien ne bouge, et Annuler repart", () => {
    const G5: Grid = [".....", "..#..", ".....", "#....", "....."];
    const stuck = play(
      newGame(G5, "facile", 1),
      { type: "placer", cell: [0, 0], ...at() },
      { type: "glisser", dir: "droite", ...at() },
      { type: "glisser", dir: "bas", ...at() },
      { type: "glisser", dir: "gauche", ...at() },
    );
    expect(stuck.phase).toBe("bloqué");
    expect(stuck.path.length).toBe(13);

    const undone = reduce(stuck, { type: "annuler" });
    expect(undone.phase).toBe("jeu");
    expect(undone.path.length).toBe(9);
    expect(undone.path.at(-1)).toEqual([4, 4]);
  });

  it("compte les Annuler (0 = PERFECT)", () => {
    const s = play(
      newGame(G4, "facile", 1),
      { type: "placer", cell: [0, 0], ...at() },
      { type: "glisser", dir: "droite", ...at() },
      { type: "annuler" },
    );
    expect(s.rewinds).toBe(1);
    expect(play(s, { type: "recommencer" }).rewinds).toBe(0);
  });

  it("Annuler sans coup revient au placement", () => {
    const s = play(newGame(G4, "facile", 1), { type: "placer", cell: [0, 0], ...at() }, { type: "annuler" });
    expect(s.phase).toBe("placement");
    expect(s.path).toEqual([]);
  });

  it("Recommencer garde la grille et vide le chemin", () => {
    const s = play(newGame(G4, "facile", 7), { type: "placer", cell: [0, 0], ...at() }, { type: "recommencer" });
    expect(s.grid).toEqual(G4);
    expect(s.seed).toBe(7);
    expect(s.phase).toBe("placement");
  });
});
