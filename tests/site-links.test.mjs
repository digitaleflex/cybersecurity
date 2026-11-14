import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DOCUMENTS } from "../js/docs-index.js";

const root = new URL("..", import.meta.url).pathname;
const docPaths = new Set(DOCUMENTS.map((d) => d.path));
const pages = readdirSync(root).filter((f) => f.endsWith(".html"));
const scripts = readdirSync(join(root, "js")).filter((f) => f.endsWith(".js")).map((f) => `js/${f}`).concat("docs.js");
const PAGE_NAMES = pages.map((p) => p.replace(/\.html$/, ""));

/** Transforme une URL du site en fichier du dépôt : "/" -> index.html, "catalogue" -> catalogue.html. */
function toFile(target) {
  const path = target.split("?")[0].split("#")[0].replace(/^\.?\//, "");
  if (path === "") return "index.html";
  if (!/\.[A-Za-z0-9]+$/.test(path) && path !== "LICENSE") return `${path}.html`;
  return path;
}
const internalTargets = (source) => [...source.matchAll(/(?:href|src)=["']([^"'#][^"']*)["']/g)].map((m) => m[1])
  .concat([...source.matchAll(/href=["'](\.\/#[^"']*)["']/g)].map((m) => m[1]))
  .filter((v) => !/^(https?:|mailto:|data:|javascript:)/i.test(v));

test("les pages HTML pointent vers des fichiers ou des pages existants (liens, images, scripts, styles)", () => {
  const problems = [];
  for (const page of pages) {
    for (const target of internalTargets(readFileSync(join(root, page), "utf8"))) {
      if (!existsSync(join(root, toFile(target)))) problems.push(`${page} → ${target}`);
    }
  }
  assert.deepEqual(problems, []);
});

test("aucun lien interne ne garde l'extension .html (URL propres uniquement)", () => {
  const problems = [];
  for (const file of [...pages, ...scripts]) {
    const text = readFileSync(join(root, file), "utf8");
    for (const m of text.matchAll(/(?:href|src)=["']([^"']*\.html[^"']*)["']/g)) problems.push(`${file} → ${m[1]}`);
  }
  assert.deepEqual(problems, []);
});

test("toutes les références docs?doc=… (HTML et JS) désignent un document connu", () => {
  const problems = [];
  for (const file of [...pages, ...scripts]) {
    const text = readFileSync(join(root, file), "utf8");
    for (const m of text.matchAll(/docs\?doc=([A-Za-z0-9_./%-]+\.md)/g)) {
      const path = decodeURIComponent(m[1]);
      if (!docPaths.has(path)) problems.push(`${file} → ${path}`);
    }
  }
  assert.deepEqual(problems, []);
});

test("les pages référencées par les modules JS existent (catalogue, domaines, communaute…)", () => {
  const problems = [];
  const re = new RegExp("[\"'`](" + PAGE_NAMES.filter((n) => n !== "index").join("|") + ")(?:[?#\"'`])", "g");
  for (const file of scripts) {
    for (const m of readFileSync(join(root, file), "utf8").matchAll(re)) if (!existsSync(join(root, `${m[1]}.html`))) problems.push(`${file} → ${m[1]}`);
  }
  assert.deepEqual(problems, []);
});
