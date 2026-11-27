import { useState } from "react";
import { DIFFICULTY_ORDER } from "../../core/grid";
import type { Difficulty } from "../../core/types";
import { saveDifficulty } from "../../store/palmares";
import { Button, Hint, Tabs } from "../components/controls";
import { useKeyboard } from "../hooks/useKeyboard";
import { T } from "../texts";
import s from "./screens.module.css";

interface Props {
  initial: Difficulty;
  onPlay: (d: Difficulty) => void;
  onPalmares: (d: Difficulty) => void;
}

type Item = "start" | "scores";

export function Menu({ initial, onPlay, onPalmares }: Props) {
  const [focus, setFocus] = useState<Item>("start");
  const [selected, setSelected] = useState<Difficulty>(initial);

  const select = (d: Difficulty) => {
    setSelected(d);
    saveDifficulty(d);
  };
  const shift = (delta: number) => {
    const i = DIFFICULTY_ORDER.indexOf(selected);
    select(DIFFICULTY_ORDER[Math.min(DIFFICULTY_ORDER.length - 1, Math.max(0, i + delta))]);
  };
  const activate = () => (focus === "start" ? onPlay(selected) : onPalmares(selected));

  useKeyboard({
    dir: (d) => {
      if (d === "haut") setFocus("start");
      else if (d === "bas") setFocus("scores");
      else if (focus === "start") shift(d === "gauche" ? -1 : 1);
    },
    space: activate,
    enter: activate,
    h: () => onPalmares(selected),
  });

  return (
    <main className={s.screen}>
      <div className={s.titleBlock}>
        <h1 className={s.title}>{T.game}</h1>
        <p className={s.tagline}>{T.tagline}</p>
      </div>

      <div className={s.stack}>
        <div onFocus={() => setFocus("start")} className={s.stack}>
          <Button wide variant={focus === "start" ? "primary" : "secondary"} shortcut={focus === "start" ? "Espace" : undefined} onClick={() => onPlay(selected)}>
            {T.start}
          </Button>
          {focus === "start" && (
            <>
              <Tabs items={DIFFICULTY_ORDER.map((d) => ({ id: d, label: T.difficulties[d] }))} value={selected} onChange={select} />
              <span className={s.caption}>{T.difficultyDetail[selected]}</span>
            </>
          )}
        </div>
        <div onFocus={() => setFocus("scores")}>
          <Button wide variant={focus === "scores" ? "primary" : "secondary"} shortcut="H" onClick={() => onPalmares(selected)}>
            {T.highScores}
          </Button>
        </div>
      </div>

      <div className={s.hints}>
        <Hint k="↑↓">{T.moveCursor}</Hint>
        {focus === "start" && <Hint k="←→">{T.difficulty}</Hint>}
        <Hint k="Espace">{focus === "start" ? T.start : T.highScores}</Hint>
      </div>
    </main>
  );
}
