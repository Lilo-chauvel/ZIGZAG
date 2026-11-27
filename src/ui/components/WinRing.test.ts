import { ringOrigin } from "./WinRing";

it("l'anneau part de la dernière case remplie, pas du START", () => {
  // Plateau 4×4 affiché en 350 px à (100, 50) : pas de 87,5 px, marge d'un demi-pas.
  const o = ringOrigin(["....", "....", "....", "...."], [[0, 0], [0, 1], [3, 2]], { left: 100, top: 50, width: 350 });
  expect(o.x).toBeCloseTo(100 + 43.75 + 2 * 87.5);
  expect(o.y).toBeCloseTo(50 + 43.75 + 3 * 87.5);
});
