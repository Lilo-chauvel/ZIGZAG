import { useState } from "react";
import type { Difficulty } from "../core/types";
import { lastDifficulty } from "../store/palmares";
import { Game } from "./screens/Game";
import { Menu } from "./screens/Menu";
import { Palmares } from "./screens/Palmares";

type Screen =
  | { name: "menu" }
  | { name: "jeu"; difficulty: Difficulty; seed: number }
  | { name: "palmares"; difficulty: Difficulty };

/** Numéro de grille : court, pour qu'il reste lisible (« Grille #4821 »). */
const newSeed = () => 1 + Math.floor(Math.random() * 99_999);

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: "menu" });
  const [difficulty, setDifficulty] = useState<Difficulty>(() => lastDifficulty() ?? "normal");

  const play = (d: Difficulty, seed = newSeed()) => {
    setDifficulty(d);
    setScreen({ name: "jeu", difficulty: d, seed });
  };
  const menu = () => setScreen({ name: "menu" });

  switch (screen.name) {
    case "menu":
      return <Menu initial={difficulty} onPlay={play} onPalmares={(d) => setScreen({ name: "palmares", difficulty: d })} />;
    case "palmares":
      return <Palmares initial={screen.difficulty} onMenu={menu} onReplay={play} />;
    case "jeu":
      return (
        <Game
          key={`${screen.difficulty}-${screen.seed}`}
          difficulty={screen.difficulty}
          seed={screen.seed}
          onMenu={menu}
          onNewGrid={() => play(screen.difficulty)}
        />
      );
  }
}
