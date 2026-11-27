import { useEffect, useMemo, useReducer, useRef, useState, type PointerEvent } from "react";
import { centerCell, moveCursor } from "../../core/cursor";
import { availableDirs, dirsOf, newGame, reduce } from "../../core/game";
import { DIFFICULTIES, generate } from "../../core/grid";
import type { Cell, Difficulty, Dir } from "../../core/types";
import { addMiss, addWin } from "../../store/palmares";
import { Board } from "../components/Board";
import { ArrowPad, Button, Hint, Hud } from "../components/controls";
import { ringOrigin, WinRing } from "../components/WinRing";
import { useKeyboard } from "../hooks/useKeyboard";
import { cssMs, useReducedMotion } from "../hooks/useReducedMotion";
import { useSlide } from "../hooks/useSlide";
import { useWinSequence } from "../hooks/useWinSequence";
import { T } from "../texts";
import s from "./screens.module.css";

interface Props {
  difficulty: Difficulty;
  seed: number;
  onMenu: () => void;
  onNewGrid: () => void;
}

export function Game({ difficulty, seed, onMenu, onNewGrid }: Props) {
  const gen = useMemo(() => generate(difficulty, seed), [difficulty, seed]);
  const [state, dispatch] = useReducer(reduce, undefined, () => newGame(gen.grid, difficulty, seed));
  // Curseur de placement (clavier et souris) : la case où le START sera posé.
  const [cursor, setCursor] = useState<Cell>(() => centerCell(gen.grid));
  const reduced = useReducedMotion();
  const { visible, sliding } = useSlide(state.path.length, reduced);
  const won = state.phase === "gagné";
  const win = useWinSequence(won && !sliding, state.path.length, reduced);
  const svgRef = useRef<SVGSVGElement>(null);
  const dirs = dirsOf(state);
  const conf = DIFFICULTIES[difficulty];
  // SOLVE : rejoue la solution connue de generate() (validée par solve()).
  // `solving` = dashs restant à jouer ; une partie assistée n'entre pas au Palmarès.
  const [solving, setSolving] = useState<Dir[] | null>(null);
  const [assisted, setAssisted] = useState(false);

  // Tant que la glissade s'affiche, on montre l'état « en jeu ».
  const shownPhase = sliding && state.phase !== "placement" ? "jeu" : state.phase;
  const boardPhase = won && (win.stage === "anneau" || win.stage === "fin") ? "gagné" : shownPhase === "gagné" ? "jeu" : shownPhase;
  const ended = win.stage === "fin";

  // Enregistre la victoire une seule fois.
  const saved = useRef(false);
  useEffect(() => {
    if (!won || saved.current || state.startedAt == null || state.endedAt == null) return;
    saved.current = true;
    if (assisted) return addMiss({ difficulty, seed, outcome: "solve", left: 0, date: Date.now(), start: state.path[0], dirs: dirsOf(state) });
    addWin({ difficulty, seed, moves: state.moveEnds.length, date: Date.now(), start: state.path[0], dirs: dirsOf(state) });
  }, [won, assisted, state, difficulty, seed]);
  useEffect(() => {
    if (!won) saved.current = false;
  }, [won]);

  const leave = (then: () => void) => {
    if (!won && state.path.length > 0) {
      addMiss({ difficulty, seed, outcome: assisted ? "solve" : "abandon", left: state.cells - state.path.length, date: Date.now(), start: state.path[0], dirs: dirsOf(state) });
    }
    then();
  };
  // Une touche pressée pendant une glissade est jouée dès qu'elle se termine.
  const queued = useRef<Dir | null>(null);
  const move = (dir: Dir) => {
    if (solving) return;
    if (state.phase === "placement") return setCursor((c) => moveCursor(state.grid, c, dir));
    if (state.phase !== "jeu") return;
    if (sliding) queued.current = dir;
    else dispatch({ type: "glisser", dir, now: Date.now() });
  };
  useEffect(() => {
    if (sliding || !queued.current) return;
    const dir = queued.current;
    queued.current = null;
    if (state.phase === "jeu") dispatch({ type: "glisser", dir, now: Date.now() });
  }, [sliding, state.phase]);
  const undo = () => !sliding && !solving && dispatch({ type: "annuler" });
  const restart = () => !solving && (!won || ended) && dispatch({ type: "recommencer" });
  const solveIt = () => {
    if (solving || won) return;
    setAssisted(true);
    queued.current = null;
    dispatch({ type: "recommencer" });
    dispatch({ type: "placer", cell: gen.solution.start, now: Date.now() });
    setSolving(gen.solution.moves);
  };
  // Joue le dash suivant de la solution une fois la glissade précédente affichée.
  useEffect(() => {
    if (!solving || sliding) return;
    if (state.phase !== "jeu" || solving.length === 0) return setSolving(null);
    const t = setTimeout(() => {
      dispatch({ type: "glisser", dir: solving[0], now: Date.now() });
      setSolving(solving.slice(1));
    }, reduced ? 0 : cssMs("--step-duration", 55) * 3);
    return () => clearTimeout(t);
  }, [solving, sliding, state.phase, reduced]);
  const place = (cell: Cell) => dispatch({ type: "placer", cell, now: Date.now() });

  useKeyboard({
    dir: move,
    undo,
    restart,
    space: () => (state.phase === "placement" ? place(cursor) : (ended || state.phase === "bloqué") && leave(onNewGrid)),
    enter: () => (state.phase === "placement" ? place(cursor) : ended && onNewGrid()),
    escape: () => leave(onMenu),
    h: solveIt,
  });

  // Glisser du doigt sur le plateau (mobile).
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: PointerEvent) => (swipe.current = { x: e.clientX, y: e.clientY });
  const onUp = (e: PointerEvent) => {
    const from = swipe.current;
    swipe.current = null;
    if (!from) return;
    const dx = e.clientX - from.x, dy = e.clientY - from.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "droite" : "gauche") : dy > 0 ? "bas" : "haut");
  };

  const ring = win.stage === "anneau" && svgRef.current ? ringOrigin(state.grid, state.path, svgRef.current.getBoundingClientRect()) : null;

  const left = state.cells - state.path.length;
  const tone = state.phase === "placement" ? "muted" : shownPhase === "bloqué" ? "danger" : ended ? "success" : "ink";

  return (
    <main className={s.screen}>
      <div className={s.topBar}>
        <Hint k="Échap">{T.menu}</Hint>
        <span className={s.seed}>{T.stage(seed)}</span>
      </div>
      <Hud caption={`${T.difficulties[difficulty]} · ${conf.size} × ${conf.size}`} value={`${visible} / ${state.cells}`} tone={tone} />

      <div className={s.boardWrap} onPointerDown={onDown} onPointerUp={onUp}>
        <Board
          ref={svgRef}
          grid={state.grid}
          path={state.path.slice(0, visible)}
          greenUpTo={win.greenUpTo}
          phase={boardPhase}
          ghost={state.phase === "placement" ? cursor : null}
          hideStartRing={win.stage === "anneau" || ended}
          onCellHover={state.phase === "placement" ? (c) => c && setCursor(c) : undefined}
          onCellClick={state.phase === "placement" ? place : undefined}
        />
      </div>
      {ring && <WinRing {...ring} />}

      <section className={s.foot} aria-live="polite">
        {state.phase === "placement" && (
          <>
            <p className={s.body}>{T.placement}</p>
            <div className={s.hints}>
              <Hint k="↑↓←→">{T.moveCursor}</Hint>
              <Hint k="Espace">{T.start}</Hint>
              <Hint k="H" onClick={solveIt}>
                {T.solve}
              </Hint>
            </div>
          </>
        )}

        {shownPhase === "jeu" && (
          <>
            <p className={s.body}>{solving ? T.solving : T.playing}</p>
            <div className={s.controls}>
              <ArrowPad available={sliding || solving ? [] : availableDirs(state)} last={dirs.at(-1) ?? null} />
              {!solving && (
                <div className={s.stack}>
                  <Hint k="⌫">{T.rewind}</Hint>
                  <Hint k="R">{T.retry}</Hint>
                  <Hint k="H" onClick={solveIt}>
                    {T.solve}
                  </Hint>
                </div>
              )}
            </div>
          </>
        )}

        {shownPhase === "bloqué" && (
          <>
            <h2 className={s.headline}>{T.gameOver}</h2>
            <p className={s.body}>{T.gameOverBody(left)}</p>
            <div className={s.actions}>
              <Button shortcut="⌫" onClick={undo} autoFocus>
                {T.rewind}
              </Button>
              <Button variant="secondary" shortcut="R" onClick={restart}>
                {T.retry}
              </Button>
              <Button variant="secondary" shortcut="H" onClick={solveIt}>
                {T.solve}
              </Button>
              <Button variant="secondary" shortcut="Espace" onClick={() => leave(onNewGrid)}>
                {T.nextStage}
              </Button>
            </div>
          </>
        )}

        {ended && state.startedAt != null && state.endedAt != null && (
          <>
            <h2 className={s.headline}>{assisted ? T.solved : state.rewinds === 0 ? T.perfect : T.clear}</h2>
            <p className={s.body}>{T.clearBody(state.cells, state.moveEnds.length)}</p>
            <div className={s.actions}>
              <Button shortcut="Espace" onClick={onNewGrid} autoFocus>
                {T.nextStage}
              </Button>
              <Button variant="secondary" shortcut="R" onClick={restart}>
                {T.retry}
              </Button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
