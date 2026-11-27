import type { Difficulty } from "../core/types";

/**
 * Tout le vocabulaire affiché. Registre arcade : les « cris » en capitales
 * (titres, résultats, boutons), les consignes en français.
 */
export const T = {
  game: "ZIGZAP",
  tagline: "Dash jusqu'au mur. Remplis toute la grille.",
  difficulty: "DIFFICULTÉ",
  difficulties: { facile: "EASY", normal: "NORMAL", difficile: "HARD" } as Record<Difficulty, string>,
  difficultyDetail: {
    facile: "5 × 5 · environ 20 cases",
    normal: "7 × 7 · environ 38 cases",
    difficile: "9 × 9 · environ 56 cases",
  } as Record<Difficulty, string>,
  clears: (n: number) => `${n} clear${n > 1 ? "s" : ""}`,

  start: "START",
  highScores: "HIGH SCORES",
  menu: "Menu",
  stage: (seed: number) => `STAGE #${String(seed).padStart(3, "0")}`,

  placement: "Choisis ta case de départ aux flèches ou à la souris.",
  moveCursor: "Choisir",
  playing: "Choisis une direction : tu dashes jusqu'au mur.",
  rewind: "REWIND",
  retry: "RETRY",
  nextStage: "NEXT STAGE",

  gameOver: "GAME OVER",
  gameOverBody: (left: number) => `Plus aucun dash possible. Il restait ${left} case${left > 1 ? "s" : ""}.`,
  clear: "CLEAR!",
  perfect: "PERFECT!",
  clearBody: (cells: number, dashes: number, time: string) => `${cells} cases en ${dashes} dashs · ${time}`,

  statClears: "CLEARS",
  statBest: "BEST TIME",
  statCombo: "COMBO",
  best: "BEST",
  dashes: (n: number) => `${n} dashs`,
  replay: "Rejouer le stage",
  empty: (d: Difficulty) => `Aucun stage ${T.difficulties[d]} clear pour l'instant. Termine un stage pour le voir ici.`,
};
