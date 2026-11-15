// Intégrité de la navigation : toutes les pages et tous les documents s'affichent, tous les liens internes répondent.
import { test, expect } from "@playwright/test";
import { PAGES, DOC_PATHS, docURL, ready } from "./helpers.mjs";

test("chaque page et chaque document se charge, et tous leurs liens internes répondent", async ({ page, request, baseURL }) => {
  test.setTimeout(240_000);
  const origin = new URL(baseURL).origin;
  const known = new Set(DOC_PATHS);
  const statuses = new Map();
  const problems = [];
  let linkCount = 0;

  for (const path of [...PAGES.filter((p) => !p.startsWith("/docs")), ...DOC_PATHS.map(docURL)]) {
    await page.goto(path);
    await ready(page);
    if (path.startsWith("/docs")) {
      if (!(await page.locator("#documentContent h1").count()) || (await page.locator("#docsStatus").isVisible()))
        problems.push(`document non rendu : ${path}`);
      const unavailable = await page.locator(".docs-link-unavailable").count();
      if (unavailable) problems.push(`${unavailable} lien(s) « indisponible » dans ${path}`);
    }
    const links = await page.$$eval("a[href]", (anchors) =>
      anchors.map((a) => ({ raw: a.getAttribute("href"), abs: a.href, inContent: Boolean(a.closest("#documentContent")) }))
    );
    for (const { raw, abs, inContent } of links) {
      if (/^(mailto:|javascript:)/.test(raw) || raw.startsWith("#")) continue;
      if (inContent && /\.md(#|$)/i.test(raw) && !/^docs\?doc=/.test(raw)) problems.push(`lien .md brut dans ${path} : ${raw}`);
      if (!abs.startsWith(origin)) continue; // les liens externes sont contrôlés par scripts/check-links.mjs
      const url = new URL(abs);
      const key = url.pathname + (url.pathname === "/docs" ? url.search : "");
      linkCount += 1;
      if (url.pathname === "/docs" && url.searchParams.get("doc") && !known.has(url.searchParams.get("doc")))
        problems.push(`document inconnu : ${abs} (depuis ${path})`);
      if (!statuses.has(key)) statuses.set(key, (await request.get(origin + key)).status());
      if (statuses.get(key) !== 200) problems.push(`${statuses.get(key)} ${abs} (depuis ${path})`);
    }
  }
  expect(linkCount).toBeGreaterThan(1000);
  expect(problems).toEqual([]);
});

test("le lecteur signale clairement un document inconnu", async ({ page }) => {
  await page.goto("/docs?doc=nope.md");
  await expect(page.locator("#docsStatus")).toContainText("n'existe pas");
});

test("les anciennes adresses en .html redirigent vers les URL propres", async ({ request, baseURL }) => {
  const response = await request.get(`${baseURL}/catalogue.html?domain=osint`, { maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe("/catalogue?domain=osint");
});
