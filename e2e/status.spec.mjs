// Page « État du catalogue » : chiffres calculés à partir des données, tableaux accessibles, santé des liens.
import { test, expect } from "@playwright/test";
import { loadCatalogData, ready } from "./helpers.mjs";

test("les chiffres clés affichés correspondent aux données publiques", async ({ page, request }) => {
  const { active, resources } = await loadCatalogData(request);
  const verified = active.filter((r) => r.status === "verified").length;
  const french = active.filter((r) => r.language.includes("fr")).length;
  await page.goto("/etat");
  await ready(page);
  const kpis = page.locator(".kpi");
  await expect(kpis).toHaveCount(4);
  await expect(kpis.nth(0)).toContainText(String(active.length));
  await expect(kpis.nth(0)).toContainText(`${resources.length - active.length} archivée`);
  await expect(kpis.nth(1)).toContainText(`${verified} / ${active.length}`);
  await expect(kpis.nth(2)).toContainText(String(french));
  await expect(page.locator(".verif-progress")).toHaveAttribute("max", String(active.length));
  await expect(page.locator(".verif-progress")).toHaveAttribute("value", String(verified));
});

test("chaque répartition est un tableau accessible dont la somme égale le catalogue", async ({ page, request }) => {
  const { active } = await loadCatalogData(request);
  await page.goto("/etat");
  await ready(page);
  for (const id of ["byDomain", "byType", "byLevel", "byAccess"]) {
    const section = page.locator(`section[aria-labelledby='${id}']`);
    await expect(section.locator("caption")).toHaveCount(1);
    const counts = await section.locator("tbody td.num:nth-of-type(1)").allInnerTexts();
    expect(
      counts.reduce((sum, value) => sum + Number(value), 0),
      id
    ).toBe(active.length);
  }
  const bars = await page
    .locator(".bar i")
    .first()
    .evaluate((el) => el.style.width);
  expect(parseFloat(bars)).toBeGreaterThan(0);
});

test("les libellés de chaque tableau mènent au catalogue filtré", async ({ page }) => {
  await page.goto("/etat");
  await ready(page);
  await page.locator("section[aria-labelledby='byLang'] tbody a").first().click();
  await expect(page).toHaveURL(/\/catalogue\?lang=(en|fr|multi)$/);
  await page.goBack();
  await page.locator("section[aria-labelledby='byDomain'] tbody a").first().click();
  await expect(page).toHaveURL(/\/catalogue\?domain=/);
});

test("santé des liens : date du contrôle, états, liste des liens à examiner avec signalement prérempli", async ({ page, request }) => {
  const health = await (await request.get("/data/health.json")).json();
  await page.goto("/etat");
  await ready(page);
  await expect(page.locator("#healthCard")).toBeVisible();
  await expect(page.locator(".health-grid li")).toHaveCount(5);
  const problems = Object.values(health.results).filter((r) => r.health !== "ok").length;
  await expect(page.locator("#healthBody tbody tr")).toHaveCount(problems);
  if (problems) {
    const href = await page.locator("#healthBody tbody a", { hasText: "Signaler" }).first().getAttribute("href");
    const url = new URL(href);
    expect(url.pathname).toBe("/digitaleflex/cybersecurity/issues/new");
    expect(url.searchParams.get("template")).toBe("broken-link.yml");
    expect(url.searchParams.get("old_url")).toMatch(/^https?:\/\//);
  }
});

test("sans fichier de santé, la page reste affichée (la section liens est masquée)", async ({ page }) => {
  await page.route("**/data/health.json", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("/etat");
  await ready(page);
  await expect(page.locator(".kpi")).toHaveCount(4);
  await expect(page.locator("#healthCard")).toBeHidden();
  await expect(page.locator(".kpi").nth(3)).toContainText("pas encore de contrôle publié");
});
