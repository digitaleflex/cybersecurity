import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { DOCUMENTS } from "../js/docs-index.js";

const root = new URL("..", import.meta.url).pathname;
const docPaths = new Set(DOCUMENTS.map((d) => d.path));
const pages = readdirSync(root).filter((f) => f.endsWith(".html"));
const scripts = readdirSync(join(root, "js")).filter((f) => f.endsWith(".js")).map((f) => `js/${f}`).concat("docs.js");

function internalTargets(source) {
  return [...source.matchAll(/(?:href|src)=["']([^"'#][^"']*)["']/g)].map((m) => m[1])
    .filter((v) => !/^(https?:|mailto:|data:|javascript:)/i.test(v));
}

test("les pages HTML pointent vers des fichiers existants (liens, images, scripts, styles)", () => {
  const problems = [];
  for (const page of pages) {
    for (const target of internalTargets(readFileSync(join(root, page), "utf8"))) {
      const path = target.split("?")[0].split("#")[0].replace(/^\//, "");
      if (path && !existsSync(join(root, path))) problems.push(`${page} → ${target}`);
    }
  }
  assert.deepEqual(problems, []);
});

test("toutes les références docs.html?doc=… (HTML et JS) désignent un document connu", () => {
  const problems = [];
  const sources = [...pages, ...scripts];
  for (const file of sources) {
    const text = readFileSync(join(root, file), "utf8");
    for (const m of text.matchAll(/docs\.html\?doc=([A-Za-z0-9_./%-]+\.md)/g)) {
      const path = decodeURIComponent(m[1]);
      if (!docPaths.has(path)) problems.push(`${file} → ${path}`);
    }
  }
  assert.deepEqual(problems, []);
});

test("les pages référencées par les modules JS existent (catalogue.html, domaines.html…)", () => {
  const problems = [];
  for (const file of scripts) {
    const text = readFileSync(join(root, file), "utf8");
    for (const m of text.matchAll(/["'`]((?:index|catalogue|domaines|communaute|docs|404)\.html)(?:[?#"'`])/g)) {
      if (!existsSync(join(root, m[1]))) problems.push(`${file} → ${m[1]}`);
    }
  }
  assert.deepEqual(problems, []);
});

test("les domaines et le fichier de données restent cohérents avec les pages", () => {
  const catalog = JSON.parse(readFileSync(join(root, "data/resources.json"), "utf8"));
  assert.equal(catalog.domains.length, 12);
});
