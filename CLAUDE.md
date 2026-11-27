# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

ZIGZAP (dossier/paquet encore nommés `snake_like`) : puzzle arcade où l'on dash jusqu'au premier obstacle (bord, trou, sa propre trace) ; on gagne en remplissant toutes les cases libres. Vite + TypeScript + React 18, plateau en SVG, aucun backend.

Le code et ses noms de domaine restent en français (`placer`, `glisser`, `gagné`, `bloqué`, `haut`/`bas`/`gauche`/`droite`). Tout texte affiché vient de `src/ui/texts.ts` (registre arcade : cris en capitales, consignes en français) ; ne pas écrire de texte en dur dans les écrans.

| Code | Affiché |
|---|---|
| grille (graine) | STAGE #n |
| départ / coup | START / dash |
| `bloqué` / `gagné` | GAME OVER / CLEAR! (PERFECT! si `rewinds === 0`) |
| `annuler` / `recommencer` / nouvelle grille | REWIND / RETRY / NEXT STAGE |
| résolution auto (`gen.solution` rejouée, hors Palmarès) | SOLVE → SOLVED |
| facile · normal · difficile | EASY · NORMAL · HARD (onglets, au menu sous START) |
| Palmarès (`store/palmares.ts`) | HIGH SCORES (historique par difficulté, sans temps ni stats ; les non réussies `Miss` y sont listées à part) |

## Workflow git

- Commiter directement sur `main`. Une branche seulement si l'utilisateur la demande pour une nouvelle fonctionnalité.
- Avant chaque commit : `npm test` et `npm run build` doivent passer.

## Commandes

```sh
npm run dev                              # serveur de dev (régénère tokens.css)
npm test                                 # tous les tests Vitest (jsdom)
npx vitest run src/core/game.test.ts     # un fichier
npx vitest run -t "se bloque"            # un test par nom
npm run build                            # tokens → tsc (strict) → vite build → dist/
npm run tokens                           # design/tokens.json → src/styles/tokens.css
```

Pas de linter configuré : `tsc` en mode strict (`noUnusedLocals`, `noUnusedParameters`) via `npm run build` sert de vérification.

## Architecture

**`src/core/` est pur (aucun DOM, aucun React)** et contient toute la logique ; l'UI ne fait qu'afficher l'état et envoyer des actions.

- `slide.ts` : LA règle de glissade, définie une seule fois. Le solveur (`grid.ts`), le reducer (`game.ts`) et `replay()` l'utilisent tous : toute évolution de règle passe par là.
- `grid.ts` : `generate(difficulté, graine)` construit une grille à partir d'une solution (`carve` : glissades aléatoires + trou posé après chaque arrêt), puis la revalide avec `solve()` (DFS avec retour arrière, compte les impasses = mesure de difficulté). Seuils par difficulté dans `DIFFICULTIES`. `solve()` renvoie `solvable: null` si le budget est dépassé : la grille est alors rejetée.
- `game.ts` : reducer `reduce(state, action)` avec phases `placement → jeu → gagné | bloqué`. `moveEnds` stocke la longueur du chemin à la fin de chaque coup (Annuler) ; `dirsOf()` en déduit les directions jouées. Les horodatages (`now`) sont passés dans les actions pour garder le reducer pur.

**Graines reproductibles** : une graine = une grille, identique dans tous les moteurs JS (c'est le numéro affiché et rejoué depuis le Palmarès). Conséquences :
- tout aléatoire dans `core/` passe par `rng(seed)` ; jamais `Math.random`, jamais `rand()` dans un comparateur de `sort` (l'ordre dépendrait du moteur) ;
- modifier l'algorithme de `carve`/`generate` change les grilles déjà enregistrées : le test « une graine donne toujours la même grille » dans `grid.test.ts` le signale volontairement.

**UI (`src/ui/`)** : `App.tsx` gère l'écran courant par simple état (pas de routeur) ; `Game` est remonté via `key` à chaque nouvelle grille. Les animations sont des hooks à minuteries enchaînées depuis des effets React :
- `useSlide` révèle le chemin case par case (`--step-duration`) ; une touche pressée pendant une glissade est mise en file et jouée ensuite (dans `Game.tsx`).
- `useWinSequence` : repassage en vert (`--retrace-step`) → anneau `WinRing` (Web Animations API, `--ring-expand` / `--ring-fade`) → écran de fin.
- Les durées sont lues depuis les variables CSS via `cssMs()` ; `prefers-reduced-motion` court-circuite tout.

Dans les tests d'interface, ces minuteries s'avancent pas à pas (`act(() => vi.advanceTimersByTime(40))` en boucle, voir `flush()` dans `game.flow.test.tsx`) : un seul gros `advanceTimersByTime` n'exécute qu'une étape.

**Persistance** : `store/palmares.ts`, clés `localStorage` versionnées (`.../v1`), chaque accès dans un `try/catch` : stockage indisponible = Palmarès vide, le jeu fonctionne.

## Design system

`design/tokens.json` est une copie du design system « Snake Like » (artifact claude.ai) et la source unique des couleurs, espacements et durées ; `src/styles/tokens.css` est généré (gitignoré). Styler via les variables CSS (`var(--trail)`, etc.), jamais de couleur en dur. Les maquettes de référence sont dans le fichier Figma `snake_like`, page « Maquettes ». Conventions visuelles : départ toujours vert (`--success`), chemin en jeu ambre (`--trail`), tête `--head`, tête bloquée `--danger` ; géométrie du plateau proportionnelle au pas (`boardGeometry()` dans `Board.tsx`).
