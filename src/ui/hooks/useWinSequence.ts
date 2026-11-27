import { useEffect, useState } from "react";
import { cssMs } from "./useReducedMotion";

export type WinStage = "attente" | "retrace" | "anneau" | "fin";

/**
 * Séquence de victoire :
 * 1. retrace : le chemin repasse en vert depuis le départ (une case / retrace-step) ;
 * 2. anneau  : l'anneau du départ grandit puis s'efface (ring-expand + ring-fade) ;
 * 3. fin     : l'écran de fin s'affiche.
 * Mouvement réduit : directement à la fin, tout en vert.
 */
export function useWinSequence(active: boolean, length: number, reduced: boolean) {
  const [stage, setStage] = useState<WinStage>("attente");
  const [greenUpTo, setGreenUpTo] = useState(0);

  useEffect(() => {
    if (!active) {
      setStage("attente");
      setGreenUpTo(0);
      return;
    }
    if (reduced) {
      setGreenUpTo(length);
      setStage("fin");
      return;
    }
    setStage("retrace");
    setGreenUpTo(0);
  }, [active, length, reduced]);

  useEffect(() => {
    if (stage === "retrace") {
      if (greenUpTo >= length - 1) {
        setStage("anneau");
        return;
      }
      const t = setTimeout(() => setGreenUpTo((g) => g + 1), cssMs("--retrace-step", 40));
      return () => clearTimeout(t);
    }
    if (stage === "anneau") {
      const total = cssMs("--ring-expand", 500) + cssMs("--ring-fade", 300) - 100;
      const t = setTimeout(() => setStage("fin"), total);
      return () => clearTimeout(t);
    }
  }, [stage, greenUpTo, length]);

  return { stage, greenUpTo };
}
