import { useMemo, useState } from "react";
import { DIFFICULTIES, DIFFICULTY_ORDER } from "../../core/grid";
import type { Difficulty } from "../../core/types";
import { saveDifficulty, stats } from "../../store/palmares";
import { Button, DifficultyOption, Hint } from "../components/controls";
import { useKeyboard } from "../hooks/useKeyboard";
import s from "./screens.module.css";

const DETAILS: Record<Difficulty, string> = {
  facile: "5 × 5 · environ 20 cases",
  normal: "7 × 7 · environ 38 cases",
  difficile: "9 × 9 · environ 56 cases",
};

interface Props {
  initial: Difficulty;
  onPlay: (d: Difficulty) => void;
  onPalmares: (d: Difficulty) => void;
}

export function Menu({ initial, onPlay, onPalmares }: Props) {
  const [selected, setSelected] = useState<Difficulty>(initial);
  const wins = useMemo(() => Object.fromEntries(DIFFICULTY_ORDER.map((d) => [d, stats(d).wins])) as Record<Difficulty, number>, []);

  const select = (d: Difficulty) => {
    setSelected(d);
    saveDifficulty(d);
  };
  const shift = (delta: number) => {
    const i = DIFFICULTY_ORDER.indexOf(selected);
    select(DIFFICULTY_ORDER[Math.min(DIFFICULTY_ORDER.length - 1, Math.max(0, i + delta))]);
  };

  useKeyboard({
    dir: (d) => (d === "haut" ? shift(-1) : d === "bas" ? shift(1) : undefined),
    space: () => onPlay(selected),
    enter: () => onPlay(selected),
    p: () => onPalmares(selected),
  });

  return (
    <main className={s.screen}>
      <div className={s.titleBlock}>
        <h1 className={s.title}>Snake Like</h1>
        <p className={s.tagline}>Une ligne, toutes les cases, jusqu'au mur.</p>
      </div>

      <span className={s.caption}>DIFFICULTÉ</span>
      <div className={s.stack} role="radiogroup" aria-label="Difficulté">
        {DIFFICULTY_ORDER.map((d) => (
          <DifficultyOption key={d} name={DIFFICULTIES[d].label} detail={DETAILS[d]} wins={wins[d]} selected={d === selected} onSelect={() => select(d)} />
        ))}
      </div>

      <div className={s.stack} style={{ marginTop: 8 }}>
        <Button wide shortcut="Espace" onClick={() => onPlay(selected)}>
          Jouer
        </Button>
        <Button wide variant="secondary" shortcut="P" onClick={() => onPalmares(selected)}>
          Palmarès
        </Button>
      </div>

      <div className={s.hints}>
        <Hint k="↑↓">Difficulté</Hint>
        <Hint k="Espace">Jouer</Hint>
      </div>
    </main>
  );
}
