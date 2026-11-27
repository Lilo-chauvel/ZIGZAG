import { useMemo, useState } from "react";
import { DIFFICULTY_ORDER, generate, replay } from "../../core/grid";
import type { Difficulty } from "../../core/types";
import { formatMs, list, stats, type Win } from "../../store/palmares";
import { Board } from "../components/Board";
import { Hint, Tabs } from "../components/controls";
import { useKeyboard } from "../hooks/useKeyboard";
import { T } from "../texts";
import s from "./screens.module.css";

interface Props {
  initial: Difficulty;
  onMenu: () => void;
  onReplay: (d: Difficulty, seed: number) => void;
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const MAX_ROWS = 50;

function Row({ win, best, onReplay }: { win: Win; best: boolean; onReplay: () => void }) {
  const { grid, path } = useMemo(() => {
    const g = generate(win.difficulty, win.seed);
    // Chemin du joueur s'il est enregistré, sinon la solution du générateur.
    const sol = win.start && win.dirs ? { start: win.start, moves: win.dirs } : g.solution;
    return { grid: g.grid, path: replay(g.grid, sol) };
  }, [win]);
  return (
    <button type="button" className={s.row} onClick={onReplay}>
      <span className={s.thumb}>
        <Board grid={grid} path={path} phase="gagné" hideStartRing label={`${T.stage(win.seed)} clear`} />
      </span>
      <span className={s.rowText}>
        <span className={s.rowTitle}>{T.stage(win.seed)}</span>
        <span className={[s.rowMeta, best ? s.rowBest : ""].join(" ")}>
          {T.dashes(win.moves)} · {formatMs(win.ms)}
          {best ? ` · ${T.best}` : ""}
        </span>
      </span>
      <span className={s.rowDate}>{dateFmt.format(win.date)}</span>
    </button>
  );
}

export function Palmares({ initial, onMenu, onReplay }: Props) {
  const [tab, setTab] = useState<Difficulty>(initial);
  const wins = useMemo(() => list(tab), [tab]);
  const st = useMemo(() => stats(tab), [tab]);
  const shift = (delta: number) => {
    const i = DIFFICULTY_ORDER.indexOf(tab);
    setTab(DIFFICULTY_ORDER[(i + delta + DIFFICULTY_ORDER.length) % DIFFICULTY_ORDER.length]);
  };

  useKeyboard({
    dir: (d) => (d === "gauche" ? shift(-1) : d === "droite" ? shift(1) : undefined),
    escape: onMenu,
  });

  return (
    <main className={s.screen}>
      <div className={s.header}>
        <h1 className={s.headline}>{T.highScores}</h1>
        <Hint k="Échap">{T.menu}</Hint>
      </div>

      <Tabs items={DIFFICULTY_ORDER.map((d) => ({ id: d, label: T.difficulties[d] }))} value={tab} onChange={setTab} />

      <div className={s.stats}>
        <div className={s.stat}>
          <span className={s.statValue}>{st.wins}</span>
          <span className={s.caption}>{T.statClears}</span>
        </div>
        <div className={s.stat}>
          <span className={s.statValue}>{st.bestMs == null ? "–" : formatMs(st.bestMs)}</span>
          <span className={s.caption}>{T.statBest}</span>
        </div>
        <div className={s.stat}>
          <span className={[s.statValue, st.streak > 0 ? s.statAccent : ""].join(" ")}>{st.streak}</span>
          <span className={s.caption}>{T.statCombo}</span>
        </div>
      </div>

      {wins.length === 0 ? (
        <p className={s.empty}>{T.empty(tab)}</p>
      ) : (
        <div className={s.list}>
          {wins.slice(0, MAX_ROWS).map((w) => (
            <Row key={`${w.seed}-${w.date}`} win={w} best={w.ms === st.bestMs} onReplay={() => onReplay(w.difficulty, w.seed)} />
          ))}
        </div>
      )}

      <div className={s.hints}>
        <Hint k="←→">{T.difficulty}</Hint>
        <Hint k="Entrée">{T.replay}</Hint>
      </div>
    </main>
  );
}
