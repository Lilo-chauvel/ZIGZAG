import type { Cell, Difficulty, Dir } from "../core/types";

export interface Win {
  difficulty: Difficulty;
  seed: number;
  moves: number;
  /** Horodatage de la victoire (ms). */
  date: number;
  /** Chemin du joueur, pour la miniature. */
  start?: Cell;
  dirs?: Dir[];
}

/** Stage non réussi : abandonné en cours de partie, ou résolu par SOLVE. */
export interface Miss {
  difficulty: Difficulty;
  seed: number;
  outcome: "abandon" | "solve";
  /** Cases restant à remplir au moment de l'abandon (0 si résolu). */
  left: number;
  date: number;
  start?: Cell;
  dirs?: Dir[];
}

const KEY = "snake-like/palmares/v1";
const MISS_KEY = "snake-like/echecs/v1";

// Le stockage peut être indisponible (navigation privée, données bloquées) :
// le jeu marche quand même, le Palmarès reste simplement vide.
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* stockage indisponible : on ignore */
  }
}

export function allWins(): Win[] {
  const v = read<unknown>(KEY, []);
  return Array.isArray(v) ? (v as Win[]) : [];
}

export function addWin(win: Win) {
  write(KEY, [win, ...allWins()].slice(0, 500));
}

export function list(difficulty: Difficulty): Win[] {
  return allWins().filter((w) => w.difficulty === difficulty);
}

/** Stages non réussis : listés dans l'historique, à part des victoires. */
export function addMiss(miss: Miss) {
  const v = read<unknown>(MISS_KEY, []);
  write(MISS_KEY, [miss, ...(Array.isArray(v) ? v : [])].slice(0, 500));
}

export function listMisses(difficulty: Difficulty): Miss[] {
  const v = read<unknown>(MISS_KEY, []);
  return Array.isArray(v) ? (v as Miss[]).filter((m) => m.difficulty === difficulty) : [];
}

const PREF_KEY = "snake-like/difficulte/v1";
export const lastDifficulty = (): Difficulty | null => read<Difficulty | null>(PREF_KEY, null);
export const saveDifficulty = (d: Difficulty) => write(PREF_KEY, d);
