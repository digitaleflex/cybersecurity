import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SITE_URL, PAGES, SECURITY_HEADERS, HSTS } from "../scripts/site-config.mjs";
import { generated } from "../scripts/build-seo.mjs";

const root = new URL("..", import.meta.url).pathname;
const read = (f) => readFileSync(join(root, f), "utf8");
const pages = readdirSync(root).filter((f) => f.endsWith(".html"));
const canonicalFor = (page) => (page === "index" ? `${SITE_URL}/` : `${SITE_URL}/${page}`);

test("sitemap.xml et robots.txt sont à jour (npm run build:seo)", () => {
  for (const [file, content] of Object.entries(generated)) assert.equal(read(file), content, `${file} périmé`);
});

test("chaque page publique a un titre, une description, un canonical et des balises de partage complètes", () => {
  for (const page of PAGES) {
    const html = read(`${page}.html`);
    assert.match(html, /<title>[^<]{10,}<\/title>/, `${page}: titre`);
    assert.match(html, /<meta name="description" content="[^"]{40,}"/, `${page}: description`);
    assert.ok(html.includes(`<link rel="canonical" href="${canonicalFor(page)}">`), `${page}: canonical`);
    for (const tag of ["og:title", "og:description", "og:url", "og:image", "og:image:alt", "twitter:card", "twitter:image"]) {
      assert.ok(html.includes(`"${tag}"`), `${page}: ${tag}`);
    }
    assert.ok(html.includes(`content="${SITE_URL}/assets/og-image.png"`), `${page}: image de partage absolue`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, page === "docs" ? 0 : 1, `${page}: un seul h1 (docs : généré par le lecteur)`);
  }
  assert.match(read("404.html"), /noindex/);
});

test("l'image de partage et les icônes existent", () => {
  for (const f of ["assets/og-image.png", "assets/icon-192.png", "assets/icon-512.png", "assets/icon-maskable-512.png", "assets/favicon-64.png"]) assert.ok(existsSync(join(root, f)), f);
  const manifest = JSON.parse(read("site.webmanifest"));
  for (const icon of manifest.icons) assert.ok(existsSync(join(root, icon.src.replace(/^\//, ""))), icon.src);
  assert.ok(manifest.icons.some((i) => i.purpose === "maskable"));
});

test("aucune ressource tierce n'est chargée (polices, scripts, styles, images)", () => {
  const problems = [];
  for (const page of pages) {
    const html = read(page);
    for (const m of html.matchAll(/<(?:script|img|link|iframe)\b[^>]*\b(?:src|href)=["'](https?:\/\/[^"']+)["'][^>]*>/g)) {
      if (/rel="(?:canonical|alternate)"/.test(m[0])) continue;
      problems.push(`${page}: ${m[1]}`);
    }
  }
  for (const f of ["ui.css", "docs.css"]) if (/@import|url\(\s*["']?https?:/i.test(read(f))) problems.push(`${f}: ressource externe`);
  for (const f of readdirSync(join(root, "js")).map((x) => `js/${x}`).concat("docs.js")) if (/import\s*\(\s*["']https?:|importScripts/.test(read(f))) problems.push(`${f}: import externe`);
  assert.deepEqual(problems, []);
});

test("compatible avec la CSP stricte : aucun script/style/gestionnaire en ligne", () => {
  const problems = [];
  const sources = readdirSync(root).filter((f) => f.endsWith(".html")).map((f) => [f, read(f)])
    .concat(readdirSync(join(root, "js")).map((f) => [`js/${f}`, read(`js/${f}`)]), [["docs.js", read("docs.js")]]);
  for (const [name, text] of sources) {
    for (const m of text.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/g)) problems.push(`${name}: script en ligne`);
    if (/\son[a-z]+\s*=\s*["']/i.test(text.replace(/<script[\s\S]*?<\/script>/g, ""))) problems.push(`${name}: gestionnaire on…=`);
    if (/<[a-z][^>]*\sstyle\s*=\s*["']/i.test(text)) problems.push(`${name}: attribut style`);
  }
  assert.deepEqual(problems, []);
});

test("vercel.json applique les mêmes en-têtes de sécurité que le serveur", () => {
  const vercel = JSON.parse(read("vercel.json"));
  const all = Object.fromEntries(vercel.headers.find((h) => h.source === "/(.*)").headers.map((h) => [h.key, h.value]));
  for (const [key, value] of Object.entries({ ...SECURITY_HEADERS, "Strict-Transport-Security": HSTS })) assert.equal(all[key], value, key);
});

test("la licence est présente et déclarée", () => {
  assert.match(read("LICENSE"), /^MIT License/);
  assert.match(read("LICENSE-DATA.txt"), /Attribution 4\.0 International/);
  assert.equal(JSON.parse(read("package.json")).license, "MIT");
});

test("les chiffres du README et du CATALOG correspondent aux données", () => {
  const data = JSON.parse(read("data/resources.json"));
  const active = data.resources.filter((r) => !["archived", "removed"].includes(r.status));
  const osint = active.filter((r) => r.domain === "osint").length;
  const readme = read("README.md");
  assert.equal(Number(readme.match(/(\d+) entries across 12 domains/)[1]), data.resources.length);
  assert.equal(Number(readme.match(/\((\d+) active/)[1]), active.length);
  assert.equal(Number(readme.match(/including (\d+) active OSINT/)[1]), osint);
  assert.equal(Number(readme.match(/OSINT\]\([^)]*\) — (\d+) resources/)[1]), osint);
  assert.equal(Number(read("CATALOG.md").match(/02-OSINT[^\n]*?\| (\d+) ressources/)[1]), osint);
});
