import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { gunzipSync, brotliDecompressSync } from "node:zlib";
import { createSiteServer, isPublicPath } from "../scripts/serve.mjs";
import { SECURITY_HEADERS } from "../scripts/site-config.mjs";

let server; let base;
before(async () => {
  server = createSiteServer({ root: new URL("..", import.meta.url).pathname });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise((r) => server.close(r)));
const get = (path, init = {}) => fetch(base + path, { redirect: "manual", ...init });

test("les pages publiques répondent 200 avec toutes les en-têtes de sécurité", async () => {
  for (const path of ["/", "/catalogue", "/domaines", "/communaute", "/docs?doc=README.md", "/mentions-legales", "/confidentialite"]) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get("content-type"), /text\/html/);
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) assert.equal(res.headers.get(key), value, `${path} ${key}`);
  }
});

test("les fichiers internes ne sont jamais servis (liste blanche)", async () => {
  for (const path of ["/package.json", "/scripts/serve.mjs", "/scripts/site-config.mjs", "/tests/server.test.mjs", "/.gitignore", "/.git/HEAD", "/.git/config",
    "/.github/workflows/link-check.yml", "/.github/dependabot.yml", "/node_modules/x.js", "/vercel.json", "/data/", "/js/", "/library/02-OSINT/", "/library/02-OSINT/other.txt"]) {
    const res = await get(path);
    assert.equal(res.status, 404, path);
  }
});

test("les ressources nécessaires au site sont servies avec le bon type", async () => {
  const cases = { "/ui.css": /text\/css/, "/js/shell.js": /javascript/, "/data/resources.json": /json/, "/library/02-OSINT/README.md": /markdown/,
    "/assets/fonts/manrope-var-latin.woff2": /font\/woff2/, "/vendor/purify.min.js": /javascript/, "/robots.txt": /text\/plain/, "/sitemap.xml": /xml/,
    "/site.webmanifest": /manifest/, "/LICENSE": /text\/plain/, "/LICENSE-DATA.txt": /text\/plain/, "/assets/og-image.png": /image\/png/ };
  for (const [path, type] of Object.entries(cases)) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.match(res.headers.get("content-type"), type, path);
  }
});

test("URL propres : .html redirige en 308 vers l'URL canonique, requête conservée", async () => {
  let res = await get("/catalogue.html?domain=osint");
  assert.equal(res.status, 308);
  assert.equal(res.headers.get("location"), "/catalogue?domain=osint");
  res = await get("/index.html");
  assert.equal(res.headers.get("location"), "/");
});

test("une page inconnue renvoie le vrai statut 404 avec la page 404 du site", async () => {
  const res = await get("/n-existe-pas");
  assert.equal(res.status, 404);
  assert.match(await res.text(), /Page <span>introuvable/);
});

test("traversée de répertoire, méthodes interdites et URL invalides sont refusées", async () => {
  for (const path of ["/..%2f..%2fetc%2fpasswd", "/%2e%2e/package.json", "/assets/..%2f..%2fpackage.json", "/%00", "/a\\b"]) {
    const res = await get(path);
    assert.ok([400, 404].includes(res.status), `${path} → ${res.status}`);
  }
  assert.equal((await get("/", { method: "POST" })).status, 405);
  assert.equal((await get("/%E0%A4%A")).status, 400);
});

function rawGet(path, headers) {
  return new Promise((resolve, reject) => {
    http.get(base + path, { headers }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ res, body: Buffer.concat(chunks) }));
    }).on("error", reject);
  });
}

test("compression brotli et gzip (octets réellement plus petits), avec en-tête Vary", async () => {
  const identity = await rawGet("/ui.css", { "accept-encoding": "identity" });
  assert.equal(identity.res.headers["content-encoding"], undefined);
  const raw = identity.body.toString();
  const br = await rawGet("/ui.css", { "accept-encoding": "br" });
  assert.equal(br.res.headers["content-encoding"], "br");
  assert.equal(br.res.headers.vary, "Accept-Encoding");
  assert.ok(br.body.length < identity.body.length / 2, "brotli doit réduire la taille d'au moins moitié");
  assert.equal(brotliDecompressSync(br.body).toString(), raw);
  const gz = await rawGet("/ui.css", { "accept-encoding": "gzip" });
  assert.equal(gz.res.headers["content-encoding"], "gzip");
  assert.equal(gunzipSync(gz.body).toString(), raw);
  assert.equal(Number(gz.res.headers["content-length"]), gz.body.length);
});

test("cache : ETag et 304 ; HTML revalidé, polices et vendor immuables", async () => {
  const first = await get("/ui.css");
  const etag = first.headers.get("etag");
  assert.ok(etag);
  assert.equal(first.headers.get("cache-control"), "no-cache");
  assert.equal((await get("/ui.css", { headers: { "if-none-match": etag } })).status, 304);
  assert.match((await get("/assets/fonts/manrope-var-latin.woff2")).headers.get("cache-control"), /immutable/);
  assert.match((await get("/vendor/markdown-it.min.js")).headers.get("cache-control"), /immutable/);
  assert.match((await get("/data/resources.json")).headers.get("cache-control"), /max-age=300/);
});

test("HSTS uniquement derrière HTTPS ; HEAD sans corps", async () => {
  assert.equal((await get("/")).headers.get("strict-transport-security"), null);
  assert.match((await get("/", { headers: { "x-forwarded-proto": "https" } })).headers.get("strict-transport-security"), /max-age=31536000/);
  const head = await get("/", { method: "HEAD" });
  assert.equal(head.status, 200);
  assert.equal((await head.text()), "");
});

test("isPublicPath : seuls les chemins prévus sont publics", () => {
  assert.ok(isPublicPath("/index.html") && isPublicPath("/js/app-like.js") && isPublicPath("/library/03-RED-TEAM/Web-Security/README.md"));
  assert.ok(!isPublicPath("/package.json") && !isPublicPath("/.env") && !isPublicPath("/scripts/serve.mjs") && !isPublicPath("/library/x/y/z/README.md"));
});
