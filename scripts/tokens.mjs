// Génère src/styles/tokens.css depuis design/tokens.json (le design system).
import { readFileSync, writeFileSync } from "node:fs";

const t = JSON.parse(readFileSync(new URL("../design/tokens.json", import.meta.url), "utf8"));
const theme = t.color.themes[0].id;
const lines = [];
for (const tok of t.color.tokens) lines.push(`  --${tok.name}: ${typeof tok.value === "string" ? tok.value : tok.value[theme]};`);
for (const fam of ["spacing", "radius", "grid", "timing"]) for (const tok of t[fam]?.tokens ?? []) lines.push(`  --${tok.name}: ${tok.value};`);
for (const [k, v] of Object.entries(t.type.families)) lines.push(`  --font-${k}: ${v};`);
writeFileSync(
  new URL("../src/styles/tokens.css", import.meta.url),
  `/* Généré par scripts/tokens.mjs depuis design/tokens.json — ne pas modifier à la main. */\n:root {\n${lines.join("\n")}\n}\n`,
);
console.log(`tokens.css : ${lines.length} variables`);
