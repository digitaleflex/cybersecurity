// Catalogue : filtres dans l'URL, recherche avancée, tolérance aux fautes, suggestions, favoris.
import { test, expect } from "@playwright/test";
import { loadCatalogData, ready } from "./helpers.mjs";

const count = (page) => page.locator("#resultsCount").evaluate((el) => Number(el.textContent.trim().split(" ")[0]));

test("les filtres vivent dans l'URL : lien direct, retour arrière et valeurs invalides", async ({ page, request }) => {
  const { active } = await loadCatalogData(request);
  await page.goto("/catalogue?domain=red-team&sort=az");
  await ready(page);
  expect(await count(page)).toBe(active.filter((r) => r.domain === "red-team").length);
  await expect(page.locator("#domainFilter")).toHaveValue("red-team");
  await expect(page).toHaveTitle(/Red Team/);

  await page.selectOption("#typeFilter", { index: 1 });
  await expect(page).toHaveURL(/type=/);
  await page.goBack();
  await expect(page).not.toHaveURL(/type=/);
  await expect(page.locator("#typeFilter")).toHaveValue("");

  await page.goto("/catalogue?domain=zzz&sort=hack&lang=klingon&tag=<b>");
  await ready(page);
  await expect(page.locator("#domainFilter")).toHaveValue("");
  await expect(page.locator("#sortFilter")).toHaveValue("featured");
  expect(await count(page)).toBe(active.length);
});

test("filtres langue, accès et mot-clé : résultats identiques aux données", async ({ page, request }) => {
  const { active } = await loadCatalogData(request);
  await page.goto("/catalogue?lang=fr");
  await ready(page);
  expect(await count(page)).toBe(active.filter((r) => r.language.includes("fr")).length);
  await expect(page.locator("#advSearch")).toHaveJSProperty("open", true);
  await expect(page.locator("#advBadge")).toHaveText("1");

  await page.goto("/catalogue?access=free&tag=geoint");
  await ready(page);
  expect(await count(page)).toBe(active.filter((r) => r.access === "free" && r.tags.includes("geoint")).length);
});

test("syntaxe avancée : opérateurs, exclusion et phrase exacte", async ({ page, request }) => {
  const { active } = await loadCatalogData(request);
  await page.goto("/catalogue");
  await ready(page);
  await page.fill("#searchInput", "lang:fr -tag:benin");
  await expect.poll(() => count(page)).toBe(active.filter((r) => r.language.includes("fr") && !r.tags.includes("benin")).length);
  await expect(page).toHaveURL(/q=lang%3Afr\+-tag%3Abenin/);

  await page.fill("#searchInput", "lang:klingon");
  await expect(page.locator("#searchNote")).toContainText("Valeur inconnue");
  expect(await count(page)).toBe(0);

  await page.fill("#searchInput", '"zzz phrase inexistante"');
  await expect.poll(() => count(page)).toBe(0);
});

test("faute de frappe : résultats approchants signalés, jamais en premier choix", async ({ page, request }) => {
  const { active } = await loadCatalogData(request);
  const word = active.map((r) => r.title.split(/\W+/)[0].toLowerCase()).find((w) => /^[a-z]{7,}$/.test(w));
  const typo = word.slice(0, 2) + word[3] + word[2] + word.slice(4);
  await page.goto(`/catalogue?q=${typo}`);
  await ready(page);
  await expect(page.locator("#searchNote")).toContainText("résultats approchants");
  expect(await count(page)).toBeGreaterThan(0);
  await page.fill("#searchInput", word);
  await expect(page.locator("#searchNote")).toBeHidden();
});

test("pertinence : le mot présent dans le titre passe en premier", async ({ page, request }) => {
  const { active } = await loadCatalogData(request);
  const word = active.map((r) => r.title.split(/\W+/)[0].toLowerCase()).find((w) => /^[a-z]{6,}$/.test(w));
  await page.goto(`/catalogue?q=${word}`);
  await ready(page);
  await expect(page.locator(".resource-card h2").first()).toContainText(new RegExp(word, "i"));
});

test("aucun résultat : suggestions de filtres à retirer et lien pour proposer la ressource", async ({ page, request }) => {
  const { active } = await loadCatalogData(request);
  await page.goto("/catalogue?domain=osint&q=zzzzzinconnu");
  await ready(page);
  await expect(page.locator("#emptyState")).toBeVisible();
  await expect(page.locator("#emptySuggestions button")).toContainText("Retirer la recherche");
  await expect(page.locator("#emptyPropose")).toHaveAttribute("href", "contribuer?title=zzzzzinconnu#formulaire");
  await page.click("#emptySuggestions button");
  expect(await count(page)).toBe(active.filter((r) => r.domain === "osint").length);
});

test("mots-clés populaires et exemples de syntaxe sont cliquables", async ({ page }) => {
  await page.goto("/catalogue");
  await ready(page);
  await page.click("#advSearch summary");
  await page.locator("#tagChips [data-tag]").first().click();
  await expect(page).toHaveURL(/tag=/);
  await expect(page.locator("#tagChips [data-tag]").first()).toHaveAttribute("aria-pressed", "true");
  await page.locator(".syntax-ex").nth(1).click();
  await expect(page.locator("#searchInput")).toHaveValue("acces:gratuit niveau:debutant");
  expect(await count(page)).toBeGreaterThan(0);
});

test("un avertissement « usage autorisé » s'affiche sur les domaines offensifs uniquement", async ({ page }) => {
  await page.goto("/catalogue?domain=red-team");
  await ready(page);
  await expect(page.locator("#domainNotice")).toBeVisible();
  await page.goto("/catalogue?domain=blue-team");
  await ready(page);
  await expect(page.locator("#domainNotice")).toBeHidden();
});

test("favoris : ajout, compteur de la barre latérale, vue dédiée, persistance", async ({ page }) => {
  await page.goto("/catalogue");
  await ready(page);
  await page.locator(".fav-btn").first().click();
  await expect(page.locator("[data-count='fav']")).toHaveText("1");
  await page.click("a[href*='view=favorites'].side-link");
  await expect.poll(() => count(page)).toBe(1);
  await page.reload();
  await ready(page);
  expect(await count(page)).toBe(1);
  await page.locator(".fav-btn").first().click();
  await expect.poll(() => count(page)).toBe(0);
});
