import { addMiss, addWin, list, listMisses } from "./palmares";

beforeEach(() => localStorage.clear());

it("enregistre les victoires par difficulté, la plus récente d'abord", () => {
  addWin({ difficulty: "normal", seed: 1, moves: 10, date: 1 });
  addWin({ difficulty: "normal", seed: 2, moves: 12, date: 2 });
  addWin({ difficulty: "facile", seed: 3, moves: 5, date: 3 });
  expect(list("normal").map((w) => w.seed)).toEqual([2, 1]);
  expect(list("difficile")).toEqual([]);
});

it("garde les stages non réussis à part des victoires", () => {
  addMiss({ difficulty: "normal", seed: 4, outcome: "abandon", left: 6, date: 1 });
  addMiss({ difficulty: "facile", seed: 5, outcome: "solve", left: 0, date: 2 });
  expect(listMisses("normal").map((m) => m.seed)).toEqual([4]);
  expect(list("normal")).toEqual([]);
});

it("survit à un stockage indisponible", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("bloqué");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("bloqué");
  });
  expect(() => addWin({ difficulty: "facile", seed: 1, moves: 1, date: 1 })).not.toThrow();
  expect(list("facile")).toEqual([]);
  vi.restoreAllMocks();
});
