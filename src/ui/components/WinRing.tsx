import { useLayoutEffect, useRef } from "react";
import { cssMs } from "../hooks/useReducedMotion";
import s from "./WinRing.module.css";

/**
 * Anneau vert qui part de la case de départ (coordonnées écran), grandit
 * jusqu'à sortir de la fenêtre, puis s'efface.
 */
export function WinRing({ x, y, from }: { x: number; y: number; from: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el?.animate) return;
    // Rayon pour couvrir le coin le plus éloigné de la fenêtre.
    const w = window.innerWidth, h = window.innerHeight;
    const to = Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + 8;
    const expand = cssMs("--ring-expand", 500), fade = cssMs("--ring-fade", 300);
    el.animate([{ width: `${from * 2}px`, height: `${from * 2}px` }, { width: `${to * 2}px`, height: `${to * 2}px` }], {
      duration: expand,
      easing: "cubic-bezier(0.2, 0.6, 0.3, 1)",
      fill: "forwards",
    });
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fade, delay: expand - 100, fill: "forwards" });
  }, [x, y, from]);
  return <div ref={ref} className={s.ring} style={{ left: x, top: y, width: from * 2, height: from * 2 }} aria-hidden="true" />;
}
