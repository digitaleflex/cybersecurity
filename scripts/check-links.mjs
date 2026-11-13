// Contrôle de disponibilité des URL du catalogue.
// Usage : node scripts/check-links.mjs [--featured] [--domain=osint] [--limit=20] [--markdown] [--json=chemin] [--no-fail]
// --no-fail : rapporte les liens cassés sans faire échouer la commande (utilisé sur les pull requests).
// Ne modifie jamais data/resources.json : la validation (licence, accès, métadonnées) reste humaine.
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

const catalog = JSON.parse(readFileSync(new URL("../data/resources.json", import.meta.url), "utf8"));
let resources = catalog.resources.filter((r) => !["archived", "removed"].includes(r.status));
if (flag("featured")) resources = resources.filter((r) => r.featured);
if (option("domain")) resources = resources.filter((r) => r.domain === option("domain"));
if (option("limit")) resources = resources.slice(0, Number(option("limit")));

const TIMEOUT_MS = Number(process.env.LINK_TIMEOUT_MS || 15000);
const CONCURRENCY = Number(process.env.LINK_CONCURRENCY || 8);
const HEADERS = {
  "User-Agent": "HashCodeCyberLibrary-LinkChecker/1.0 (+https://github.com/digitaleflex/cybersecurity)",
  Accept: "text/html,application/xhtml+xml,*/*;q=0.8"
};

async function request(url, method) {
  return fetch(url, { method, headers: HEADERS, redirect: "follow", signal: AbortSignal.timeout(TIMEOUT_MS) });
}

function classify(resource, response, error) {
  if (error) {
    const code = error.cause?.code || error.name;
    if (["ENOTFOUND", "ERR_INVALID_URL"].includes(code)) return { level: "broken", detail: `DNS / URL invalide (${code})` };
    return { level: "warn", detail: `Réseau : ${code}` };
  }
  const { status } = response;
  if (status === 404 || status === 410) return { level: "broken", detail: `HTTP ${status}` };
  if ([401, 403, 429, 999].includes(status)) return { level: "warn", detail: `HTTP ${status} (protection anti-robot ?)` };
  if (status >= 500) return { level: "warn", detail: `HTTP ${status}` };
  if (status >= 400) return { level: "broken", detail: `HTTP ${status}` };
  const from = new URL(resource.url);
  const to = new URL(response.url);
  if (from.hostname.replace(/^www\./, "") !== to.hostname.replace(/^www\./, "")) {
    return { level: "warn", detail: `Redirigé vers ${to.origin}` };
  }
  return { level: "ok", detail: `HTTP ${status}` };
}

async function check(resource) {
  let response;
  let error;
  try {
    response = await request(resource.url, "HEAD");
    if (response.status >= 400) response = await request(resource.url, "GET"); // certains sites refusent HEAD
  } catch (e) {
    try { response = await request(resource.url, "GET"); error = undefined; } catch (e2) { error = e2; }
  }
  return { id: resource.id, title: resource.title, url: resource.url, featured: Boolean(resource.featured), ...classify(resource, response, error) };
}

const results = [];
let cursor = 0;
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, resources.length) }, async () => {
  while (cursor < resources.length) results.push(await check(resources[cursor++]));
}));
results.sort((a, b) => a.id.localeCompare(b.id));

const count = (level) => results.filter((r) => r.level === level).length;
const summary = `${results.length} URL contrôlées : ${count("ok")} OK, ${count("warn")} à surveiller, ${count("broken")} cassées`;
const problems = results.filter((r) => r.level !== "ok");

if (flag("markdown")) {
  console.log(`## Contrôle des liens\n\n${summary}\n`);
  if (problems.length) {
    console.log("| Niveau | Ressource | Détail |\n|---|---|---|");
    for (const r of problems) console.log(`| ${r.level === "broken" ? "🔴 cassé" : "🟡 à surveiller"} | [${r.title}](${r.url}) (\`${r.id}\`) | ${r.detail} |`);
  }
} else {
  console.log(summary);
  for (const r of problems) console.log(`${r.level === "broken" ? "✖" : "!"} ${r.id} — ${r.detail} — ${r.url}`);
}
if (option("json")) writeFileSync(option("json"), JSON.stringify({ checked: new Date().toISOString(), summary, results }, null, 2));
process.exit(count("broken") > 0 && !flag("no-fail") ? 1 : 0);
