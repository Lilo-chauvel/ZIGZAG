# ZIGZAP

Puzzle arcade : choisis ton START, puis dash tout droit jusqu'au premier obstacle (bord, bloc ou ta propre trace). Remplis toute la grille pour un CLEAR, sans REWIND pour un PERFECT.

## Lancer

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # générateur, règles, Palmarès, parcours d'une partie
npm run build    # site statique dans dist/
```

## Commandes

| Touche | Action |
|---|---|
| Flèches, ZQSD, WASD (ou souris) | choisir le START, puis Espace / Entrée |
| Clic ou toucher sur une autre case | déplacer le START, tant qu'aucun dash n'est joué |
| Flèches, ZQSD, WASD (ou glisser du doigt) | dash |
| ⌫ | REWIND (annule le dernier dash) |
| R | RETRY (recommence le stage) |
| Espace | NEXT STAGE (fin de partie) · START (menu) |
| Échap | menu |
| H | HIGH SCORES (depuis le menu) ; ↑↓ + Entrée pour rejouer un stage |

## Organisation

- `src/core/` : règles du jeu en TypeScript pur, sans affichage.
  - `slide.ts` : la règle de glissade, définie une seule fois.
  - `grid.ts` : génération de grilles résolubles et solveur.
  - `game.ts` : état d'une partie (placement, jeu, gagné, bloqué).
- `src/store/palmares.ts` : grilles réussies et séries, dans `localStorage`.
- `src/ui/` : écrans React (Menu, Jeu, Palmarès), plateau en SVG, animations.
- `design/tokens.json` : couleurs, espacements et durées du design system ; `npm run tokens` génère `src/styles/tokens.css`.

## Grilles toujours résolubles

1. Le générateur trace d'abord une solution par glissades aléatoires, et pose un trou juste après chaque arrêt. Les cases jamais traversées deviennent des trous.
2. Un solveur indépendant (recherche exhaustive avec retour arrière) vérifie qu'une solution existe et compte les impasses, qui mesurent la difficulté.

Une graine donne toujours la même grille, dans tous les navigateurs : c'est le numéro affiché (« STAGE #4821 ») qui permet de la rejouer depuis le Palmarès.
