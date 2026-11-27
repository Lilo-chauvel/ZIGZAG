import { useEffect, useState } from "react";

const query = () => window.matchMedia?.("(prefers-reduced-motion: reduce)");

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => query()?.matches ?? false);
  useEffect(() => {
    const mq = query();
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Lit une durée CSS des tokens (« 55ms ») ; valeur de secours si absente. */
export function cssMs(name: string, fallback: number) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
}
