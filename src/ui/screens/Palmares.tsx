import { useMemo, useRef, useState } from "react";
import { DIFFICULTY_ORDER, generate, replay } from "../../core/grid";
import type { Difficulty } from "../../core/types";
import { list, listMisses, type Miss, type Win } from "../../store/palmares";
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

/** Entrée de l'historique : victoire, ou stage non réussi (`miss`). */
type Entry = { kind: "win"; win: Win } | { kind: "miss"; miss: Miss };

function Row({ entry, onReplay }: { entry: Entry; onReplay: () => void }) {
  const e = entry.kind === "win" ? entry.win : entry.miss;
  const { grid, path } = useMemo(() => {
    const g = generate(e.difficulty, e.seed);
    // Chemin du joueur s'il est enregistré, sinon la solution du générateur.
    const sol = e.start && e.dirs ? { start: e.start, moves: e.dirs } : g.solution;
    return { grid: g.grid, path: replay(g.grid, sol) };
  }, [e]);
  const abandon = entry.kind === "miss" && entry.miss.outcome === "abandon";
  const meta =
    entry.kind === "win"
      ? T.dashes(entry.win.moves)
      : abandon
        ? T.missAbandon(entry.miss.left)
        : T.missSolve;
  return (
    <button type="button" className={s.row} onClick={onReplay}>
      <span className={s.thumb}>
        <Board grid={grid} path={path} phase={abandon ? "bloqué" : "gagné"} hideStartRing label={`${T.stage(e.seed)} · ${meta}`} />
      </span>
      <span className={s.rowText}>
        <span className={s.rowTitle}>{T.stage(e.seed)}</span>
        <span className={[s.rowMeta, abandon ? s.rowMiss : ""].join(" ")}>{meta}</span>
      </span>
      <span className={s.rowDate}>{dateFmt.format(e.date)}</span>
    </button>
  );
}

export function Palmares({ initial, onMenu, onReplay }: Props) {
  const [tab, setTab] = useState<Difficulty>(initial);
  // Victoires et stages non réussis mêlés, du plus récent au plus ancien.
  const entries = useMemo<Entry[]>(
    () =>
      [...list(tab).map((win) => ({ kind: "win" as const, win })), ...listMisses(tab).map((miss) => ({ kind: "miss" as const, miss }))].sort(
        (a, b) => (b.kind === "win" ? b.win.date : b.miss.date) - (a.kind === "win" ? a.win.date : a.miss.date),
      ),
    [tab],
  );
  const shift = (delta: number) => {
    const i = DIFFICULTY_ORDER.indexOf(tab);
    setTab(DIFFICULTY_ORDER[(i + delta + DIFFICULTY_ORDER.length) % DIFFICULTY_ORDER.length]);
  };

  // ↑↓ parcourent les stages (Entrée rejoue celui qui a le focus).
  const listRef = useRef<HTMLDivElement>(null);
  const focusRow = (delta: number) => {
    const rows = [...(listRef.current?.querySelectorAll("button") ?? [])];
    if (!rows.length) return;
    const i = rows.indexOf(document.activeElement as HTMLButtonElement);
    rows[i < 0 ? 0 : Math.min(rows.length - 1, Math.max(0, i + delta))].focus();
  };
  useKeyboard({
    dir: (d) => (d === "gauche" ? shift(-1) : d === "droite" ? shift(1) : focusRow(d === "haut" ? -1 : 1)),
    escape: onMenu,
  });

  return (
    <main className={s.screen}>
      <div className={s.header}>
        <h1 className={s.headline}>{T.highScores}</h1>
        <Hint k="Échap">{T.menu}</Hint>
      </div>

      <Tabs items={DIFFICULTY_ORDER.map((d) => ({ id: d, label: T.difficulties[d] }))} value={tab} onChange={setTab} />


      {entries.length === 0 ? (
        <p className={s.empty}>{T.empty(tab)}</p>
      ) : (
        <div className={s.list} ref={listRef}>
          {entries.slice(0, MAX_ROWS).map((en) => {
            const e = en.kind === "win" ? en.win : en.miss;
            return <Row key={`${en.kind}-${e.seed}-${e.date}`} entry={en} onReplay={() => onReplay(e.difficulty, e.seed)} />;
          })}
        </div>
      )}

      <div className={s.hints}>
        <Hint k="←→">{T.difficulty}</Hint>
        <Hint k="↑↓">{T.moveCursor}</Hint>
        <Hint k="Entrée">{T.replay}</Hint>
      </div>
    </main>
  );
}
