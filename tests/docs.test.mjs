import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, normalize, relative } from "node:path";
import { DOCUMENTS } from "../js/docs-index.js";

const root = new URL("..", import.meta.url).pathname;
const catalog = JSON.parse(readFileSync(join(root, "data/resources.json"), "utf8"));
const docPaths = new Set(DOCUMENTS.map((d) => d.path));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", ".git", ".github"].includes(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(relative(root, full).split("\\").join("/"));
  }
  return out;
}
const allFiles = walk(root);
const markdownFiles = allFiles.filter((f) => f.endsWith(".md"));

test("chaque fichier .md du dépôt est lisible dans le lecteur de documentation", () => {
  const missing = markdownFiles.filter((f) => !docPaths.has(f));
  assert.deepEqual(missing, [], `Documents absents de js/docs-index.js : ${missing.join(", ")}`);
});

test("chaque document de l'index existe, avec un titre et un groupe, sans doublon", () => {
  assert.equal(docPaths.size, DOCUMENTS.length, "chemins en double");
  for (const d of DOCUMENTS) {
    assert.ok(existsSync(join(root, d.path)), `fichier manquant : ${d.path}`);
    assert.ok(d.title && d.group, `titre ou groupe vide : ${d.path}`);
  }
});

test("le chemin guide de chaque domaine pointe vers un document lisible", () => {
  for (const domain of catalog.domains) assert.ok(docPaths.has(domain.path), `${domain.id} : ${domain.path}`);
});

test("tous les liens internes des documents Markdown se résolvent", () => {
  const problems = [];
  for (const file of markdownFiles) {
    const text = readFileSync(join(root, file), "utf8");
    for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const href = m[1];
      if (/^(https?:|mailto:|#)/i.test(href)) continue;
      const path = href.split("#")[0];
      if (!path) continue;
      let target = normalize(join(dirname(file), path)).split("\\").join("/");
      if (existsSync(join(root, target)) && statSync(join(root, target)).isDirectory()) target = `${target.replace(/\/$/, "")}/README.md`;
      if (!existsSync(join(root, target))) problems.push(`${file} → ${href} (fichier introuvable)`);
      else if (target.endsWith(".md") && !docPaths.has(target)) problems.push(`${file} → ${href} (non lisible dans le lecteur)`);
    }
  }
  assert.deepEqual(problems, []);
});
