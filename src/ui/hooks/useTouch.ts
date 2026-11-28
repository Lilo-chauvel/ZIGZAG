import { useEffect, useState } from "react";

/** Écran tactile sans souris (téléphone, tablette) : pas de clavier physique à proposer. */
export const TOUCH_QUERY = "(hover: none) and (pointer: coarse)";
const query = () => window.matchMedia?.(TOUCH_QUERY);

export function useTouch() {
  const [touch, setTouch] = useState(() => query()?.matches ?? false);
  useEffect(() => {
    const mq = query();
    if (!mq) return;
    const on = () => setTouch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return touch;
}
