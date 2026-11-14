// Vérifie la syntaxe de tous les fichiers JavaScript du projet (node --check) : plus de liste à tenir à jour à la main.
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const roots = ["js", "scripts", "tests", "e2e"];
const files = [
  ...readdirSync(root).filter((f) => /\.(m?js)$/.test(f)),
  ...roots.flatMap((dir) =>
    readdirSync(join(root, dir))
      .filter((f) => /\.(m?js)$/.test(f))
      .map((f) => `${dir}/${f}`)
  )
];

const failures = files.filter((file) => spawnSync(process.execPath, ["--check", join(root, file)], { stdio: "inherit" }).status !== 0);
if (failures.length) {
  console.error(`Erreur de syntaxe dans : ${failures.join(", ")}`);
  process.exit(1);
}
console.log(`Syntaxe valide : ${files.length} fichiers JavaScript.`);
