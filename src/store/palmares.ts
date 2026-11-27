import type { Cell, Difficulty, Dir } from "../core/types";

export interface Win {
  difficulty: Difficulty;
  seed: number;
  moves: number;
  ms: number;
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

export interface Stats {
  wins: number;
  bestMs: number | null;
  /** Victoires d'affilée, sans blocage abandonné entre deux. */
  streak: number;
}

const KEY = "snake-like/palmares/v1";
const STREAK_KEY = "snake-like/serie/v1";
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
  const streaks = read<Record<string, number>>(STREAK_KEY, {});
  write(STREAK_KEY, { ...streaks, [win.difficulty]: (streaks[win.difficulty] ?? 0) + 1 });
}

/** Une partie bloquée et abandonnée casse la série. */
export function breakStreak(difficulty: Difficulty) {
  const streaks = read<Record<string, number>>(STREAK_KEY, {});
  if (streaks[difficulty]) write(STREAK_KEY, { ...streaks, [difficulty]: 0 });
}

export function list(difficulty: Difficulty): Win[] {
  return allWins().filter((w) => w.difficulty === difficulty);
}

/** Les stages non réussis n'entrent pas dans les stats, seulement dans l'historique. */
export function addMiss(miss: Miss) {
  const v = read<unknown>(MISS_KEY, []);
  write(MISS_KEY, [miss, ...(Array.isArray(v) ? v : [])].slice(0, 500));
}

export function listMisses(difficulty: Difficulty): Miss[] {
  const v = read<unknown>(MISS_KEY, []);
  return Array.isArray(v) ? (v as Miss[]).filter((m) => m.difficulty === difficulty) : [];
}

export function stats(difficulty: Difficulty): Stats {
  const wins = list(difficulty);
  return {
    wins: wins.length,
    bestMs: wins.length ? Math.min(...wins.map((w) => w.ms)) : null,
    streak: read<Record<string, number>>(STREAK_KEY, {})[difficulty] ?? 0,
  };
}

export const formatMs = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const PREF_KEY = "snake-like/difficulte/v1";
export const lastDifficulty = (): Difficulty | null => read<Difficulty | null>(PREF_KEY, null);
export const saveDifficulty = (d: Difficulty) => write(PREF_KEY, d);
