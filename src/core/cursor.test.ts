import { centerCell, moveCursor } from "./cursor";

const G: string[] = [
  ".....",
  "..#..",
  ".#.#.",
  "..#..",
  "##...",
];

it("démarre sur la case libre la plus centrale", () => {
  expect(centerCell(G)).toEqual([2, 2]);
  expect(centerCell(["###", "#.#", "###"])).toEqual([1, 1]);
  expect(centerCell(["##.", "###", "###"])).toEqual([0, 2]);
});

it("saute les blocs dans la direction", () => {
  expect(moveCursor(G, [2, 2], "haut")).toEqual([0, 2]); // (1,2) est un bloc
  expect(moveCursor(G, [2, 0], "droite")).toEqual([2, 2]);
});

it("se décale sur le côté quand la ligne est bouchée", () => {
  expect(moveCursor(G, [3, 1], "bas")).toEqual([4, 2]); // (4,1) et (4,0) bouchés
});

it("reste sur place au bord", () => {
  expect(moveCursor(G, [0, 0], "haut")).toEqual([0, 0]);
  expect(moveCursor(G, [0, 4], "droite")).toEqual([0, 4]);
});
