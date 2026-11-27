import { useEffect, useState } from "react";
import { cssMs } from "./useReducedMotion";

/**
 * Nombre de cases du chemin à afficher. Quand le chemin s'allonge, on avance
 * d'une case toutes les `step-duration` pour montrer la glissade ; quand il
 * raccourcit (Annuler, Recommencer), on suit immédiatement.
 */
export function useSlide(length: number, reduced: boolean) {
  const [visible, setVisible] = useState(length);
  useEffect(() => {
    // Placement du départ (0 → 1) ou chemin qui raccourcit : immédiat.
    if (reduced || length <= visible || visible === 0) {
      setVisible(length);
      return;
    }
    const t = setTimeout(() => setVisible((v) => Math.min(v + 1, length)), cssMs("--step-duration", 55));
    return () => clearTimeout(t);
  }, [length, visible, reduced]);
  return { visible: Math.min(visible, length), sliding: visible < length };
}
