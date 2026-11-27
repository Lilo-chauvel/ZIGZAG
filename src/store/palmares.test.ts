import { addWin, breakStreak, formatMs, list, stats } from "./palmares";

beforeEach(() => localStorage.clear());

it("enregistre et compte les victoires par difficulté", () => {
  addWin({ difficulty: "normal", seed: 1, moves: 10, ms: 72_000, date: 1 });
  addWin({ difficulty: "normal", seed: 2, moves: 12, ms: 48_000, date: 2 });
  addWin({ difficulty: "facile", seed: 3, moves: 5, ms: 20_000, date: 3 });
  expect(list("normal").map((w) => w.seed)).toEqual([2, 1]);
  expect(stats("normal")).toEqual({ wins: 2, bestMs: 48_000, streak: 2 });
  expect(stats("difficile")).toEqual({ wins: 0, bestMs: null, streak: 0 });
});

it("un abandon casse la série sans effacer les victoires", () => {
  addWin({ difficulty: "facile", seed: 1, moves: 5, ms: 1000, date: 1 });
  breakStreak("facile");
  expect(stats("facile")).toMatchObject({ wins: 1, streak: 0 });
});

it("survit à un stockage indisponible", () => {
  const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("bloqué");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("bloqué");
  });
  expect(() => addWin({ difficulty: "facile", seed: 1, moves: 1, ms: 1, date: 1 })).not.toThrow();
  expect(list("facile")).toEqual([]);
  spy.mockRestore();
  vi.restoreAllMocks();
});

it("formate les temps", () => {
  expect(formatMs(48_000)).toBe("0:48");
  expect(formatMs(125_400)).toBe("2:05");
});
