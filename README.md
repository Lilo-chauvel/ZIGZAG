# Snake Like

Un puzzle en une seule ligne. Place ton départ sur une case, puis choisis une direction : le serpent glisse tout droit jusqu'au premier obstacle (bord, trou ou sa propre trace). Remplis toutes les cases pour gagner.

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
| Souris | placer le départ |
| Flèches, ZQSD, WASD (ou glisser du doigt) | glisser |
| ⌫ | annuler le dernier coup |
| R | recommencer la grille |
| Espace | nouvelle grille (fin de partie) · jouer (menu) |
| Échap | menu |
| P | Palmarès (depuis le menu) |

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

Une graine donne toujours la même grille, dans tous les navigateurs : c'est le numéro affiché (« Grille #4821 ») qui permet de la rejouer depuis le Palmarès.
