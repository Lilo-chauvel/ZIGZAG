import { useMemo, useState } from "react";
import { DIFFICULTY_ORDER } from "../../core/grid";
import type { Difficulty } from "../../core/types";
import { saveDifficulty, stats } from "../../store/palmares";
import { Button, DifficultyOption, Hint } from "../components/controls";
import { useKeyboard } from "../hooks/useKeyboard";
import { T } from "../texts";
import s from "./screens.module.css";

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
    h: () => onPalmares(selected),
  });

  return (
    <main className={s.screen}>
      <div className={s.titleBlock}>
        <h1 className={s.title}>{T.game}</h1>
        <p className={s.tagline}>{T.tagline}</p>
      </div>

      <span className={s.caption}>{T.difficulty}</span>
      <div className={s.stack} role="radiogroup" aria-label="Difficulté">
        {DIFFICULTY_ORDER.map((d) => (
          <DifficultyOption key={d} name={T.difficulties[d]} detail={T.difficultyDetail[d]} wins={T.clears(wins[d])} selected={d === selected} onSelect={() => select(d)} />
        ))}
      </div>

      <div className={s.stack} style={{ marginTop: 8 }}>
        <Button wide shortcut="Espace" onClick={() => onPlay(selected)}>
          {T.start}
        </Button>
        <Button wide variant="secondary" shortcut="H" onClick={() => onPalmares(selected)}>
          {T.highScores}
        </Button>
      </div>

      <div className={s.hints}>
        <Hint k="↑↓">{T.difficulty}</Hint>
        <Hint k="Espace">{T.start}</Hint>
      </div>
    </main>
  );
}
