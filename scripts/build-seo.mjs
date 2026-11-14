// Génère sitemap.xml et robots.txt à partir de la configuration du site.
// Usage : node scripts/build-seo.mjs          (écrit les fichiers)
//         node scripts/build-seo.mjs --check  (échoue si les fichiers committés sont périmés ; utilisé par les tests)
import { readFileSync, writeFileSync } from "node:fs";
import { SITE_URL, PAGES } from "./site-config.mjs";
import { DOCUMENTS, docURL } from "../js/docs-index.js";

const root = new URL("../", import.meta.url);
const updated = JSON.parse(readFileSync(new URL("data/resources.json", root), "utf8")).updated;
const LEGAL_DATE = "2026-11-13";

const pageURL = (page) => (page === "index" ? `${SITE_URL}/` : `${SITE_URL}/${page}`);
const entries = [
  ...PAGES.map((page) => ({ loc: pageURL(page), lastmod: page.startsWith("mentions") || page === "confidentialite" ? LEGAL_DATE : updated })),
  ...DOCUMENTS.map((doc) => ({ loc: `${SITE_URL}/${docURL(doc.path)}`, lastmod: updated }))
];
// la page « docs » sans paramètre est un doublon de ?doc=README.md : on ne garde que les URL de documents
const unique = entries.filter((e, i) => e.loc !== `${SITE_URL}/docs` && entries.findIndex((x) => x.loc === e.loc) === i);

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique
  .map((e) => `  <url><loc>${e.loc.replace(/&/g, "&amp;")}</loc><lastmod>${e.lastmod}</lastmod></url>`).join("\n")}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;

export const generated = { "sitemap.xml": xml, "robots.txt": robots };

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const check = process.argv.includes("--check");
  let stale = false;
  for (const [file, content] of Object.entries(generated)) {
    const path = new URL(file, root);
    let current = "";
    try { current = readFileSync(path, "utf8"); } catch { /* absent */ }
    if (check) { if (current !== content) { console.error(`${file} est périmé : lance « npm run build:seo ».`); stale = true; } }
    else writeFileSync(path, content);
  }
  if (check) process.exit(stale ? 1 : 0);
  console.log(`sitemap.xml (${unique.length} URL) et robots.txt écrits pour ${SITE_URL}`);
}
