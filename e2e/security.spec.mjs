// Sécurité et propreté côté navigateur : CSP respectée, aucune requête tierce, aucune erreur console.
import { test, expect } from "@playwright/test";
import { PAGES, setTheme, watchPage, ready } from "./helpers.mjs";

const EXTRA = [
  "/docs?doc=SECURITY.md",
  "/docs?doc=library%2F02-OSINT%2FREADME.md",
  "/catalogue?domain=red-team&lang=fr&q=lang%3Afr",
  "/catalogue?q=zzzzinconnu&domain=osint"
];

for (const theme of ["dark", "light"]) {
  test(`aucune erreur console, violation de CSP ni requête hors du domaine (${theme})`, async ({ page, context, baseURL }) => {
    await setTheme(context, theme);
    const { issues, hosts } = watchPage(page);
    for (const path of [...PAGES, ...EXTRA]) {
      await page.goto(path);
      await ready(page);
    }
    expect(issues, "alertes console / CSP").toEqual([]);
    expect([...hosts], "domaines contactés").toEqual([new URL(baseURL).host]);
  });
}

test("les en-têtes de sécurité sont bien reçus par le navigateur", async ({ page }) => {
  const response = await page.goto("/catalogue");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("script-src 'self'");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-encoding"]).toMatch(/br|gzip/);
});

test("les polices du site sont servies par le site (aucun Google Fonts)", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
  });
  expect(loaded).toContain("Manrope");
});

test("le contenu d'un document est assaini : aucun script ni gestionnaire d'événement injecté", async ({ page }) => {
  await page.goto("/docs?doc=README.md");
  await page.waitForSelector("#documentContent h1");
  const dangerous = await page.evaluate(
    () =>
      document.querySelectorAll(
        "#documentContent script, #documentContent iframe, #documentContent [onerror], #documentContent [onclick], #documentContent [style]"
      ).length
  );
  expect(dangerous).toBe(0);
});

test("des paramètres d'URL hostiles ne s'exécutent pas et ne cassent pas la page", async ({ page }) => {
  const { issues } = watchPage(page);
  let dialog = false;
  page.on("dialog", async (d) => {
    dialog = true;
    await d.dismiss();
  });
  for (const url of [
    "/catalogue?q=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&domain=%3Cscript%3E",
    "/docs?doc=%3Cscript%3Ealert(1)%3C%2Fscript%3E.md",
    "/contribuer?title=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&url=javascript%3Aalert(1)"
  ]) {
    await page.goto(url);
    await ready(page);
  }
  expect(dialog).toBe(false);
  expect(await page.evaluate(() => document.querySelectorAll("img[onerror]").length)).toBe(0);
  expect(issues.filter((i) => !i.includes("404"))).toEqual([]);
});
