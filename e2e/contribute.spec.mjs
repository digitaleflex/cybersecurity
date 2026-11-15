// Page Contribuer : validation, détection des doublons, ticket GitHub pré-rempli, fiche JSON.
import { test, expect } from "@playwright/test";
import { loadCatalogData, ready } from "./helpers.mjs";

async function fillValid(page, overrides = {}) {
  await page.fill("#f-title", overrides.title ?? "Exemple Outil de Test");
  await page.fill("#f-url", overrides.url ?? "https://exemple-outil-test.org/docs");
  await page.selectOption("#f-domain", overrides.domain ?? "blue-team");
  await page.selectOption("#f-type", "tool");
  await page.selectOption("#f-level", "beginner");
  await page.selectOption("#f-access", "free");
  await page.fill("#f-category", "SIEM");
  await page.check("#langBoxes input[value=fr]");
  await page.fill("#f-description", "Outil factice utilisé pour vérifier le fonctionnement du formulaire de contribution du site.");
  await page.fill("#f-tags", "Test, Démo");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/contribuer");
  await ready(page);
  await expect(page.locator("#f-domain option")).toHaveCount(13);
});

test("le bouton reste inactif et les erreurs s'affichent tant que la fiche est incomplète", async ({ page }) => {
  await expect(page.locator("#issueBtn")).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator("#copyBtn")).toBeDisabled();
  await page.click("#issueBtn", { force: true });
  await expect(page.locator("#e-title")).toContainText("nom officiel");
  await expect(page.locator("#e-url")).toContainText("adresse complète");
  await expect(page.locator("#e-description")).toContainText("40 caractères minimum");
  await page.focus("#f-title"); // le déplacement du focus ne doit pas effacer les erreurs
  await expect(page.locator("#e-url")).toContainText("adresse complète");
});

test("une URL non sécurisée ou invalide est refusée", async ({ page }) => {
  await page.fill("#f-url", "http://exemple.org");
  await page.locator("#f-url").blur();
  await expect(page.locator("#e-url")).toContainText("https");
  // entrée hostile volontaire : un schéma javascript: doit être refusé
  // eslint-disable-next-line no-script-url
  await page.fill("#f-url", "javascript:alert(1)");
  await expect(page.locator("#e-url")).toContainText("adresse complète");
});

test("une ressource déjà au catalogue est détectée et bloque l'envoi", async ({ page, request }) => {
  const { resources } = await loadCatalogData(request);
  await fillValid(page, { url: resources[0].url });
  await expect(page.locator("#dupPanel")).toContainText("déjà au catalogue");
  await page.check("#f-safety");
  await expect(page.locator("#issueBtn")).toHaveAttribute("aria-disabled", "true");
  await expect(page.locator("#e-form")).toContainText("déjà au catalogue");
});

test("un site déjà référencé ou un titre proche sont signalés sans bloquer", async ({ page, request }) => {
  const { resources } = await loadCatalogData(request);
  await fillValid(page, { url: new URL("/une-autre-page-inconnue", resources[0].url).href, title: "Autre nom" });
  await expect(page.locator("#dupPanel")).toContainText("déjà référencé");
  await page.check("#f-safety");
  await expect(page.locator("#issueBtn")).toHaveAttribute("aria-disabled", "false");
});

test("fiche valide : ticket GitHub pré-rempli, avertissement offensif et JSON conforme", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await fillValid(page, { domain: "red-team" });
  await expect(page.locator("#formNotice")).toBeVisible();
  await expect(page.locator("#issueBtn")).toHaveAttribute("aria-disabled", "true"); // case de sécurité non cochée
  await page.check("#f-safety");
  await expect(page.locator("#issueBtn")).toHaveAttribute("aria-disabled", "false");

  const href = await page.getAttribute("#issueBtn", "href");
  const url = new URL(href);
  expect(url.origin + url.pathname).toBe("https://github.com/digitaleflex/cybersecurity/issues/new");
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    template: "resource-suggestion.yml",
    resource_title: "Exemple Outil de Test",
    url: "https://exemple-outil-test.org/docs",
    domain: "Red Team",
    type: "Outil",
    level: "Débutant",
    access: "Gratuit",
    language: "Français",
    category: "SIEM",
    tags: "test, demo"
  });

  await page.click("#copyBtn");
  await expect(page.locator("#copyStatus")).toContainText("copiée");
  const json = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  expect(json).toMatchObject({
    id: "exemple-outil-de-test",
    status: "needs-review",
    verified: null,
    featured: false,
    domain: "red-team",
    language: ["fr"]
  });
  expect(json.added).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

test("le titre et l'adresse peuvent être préremplis depuis le catalogue", async ({ page }) => {
  await page.goto("/contribuer?title=Mon%20outil&url=https%3A%2F%2Fexemple.org");
  await ready(page);
  await expect(page.locator("#f-title")).toHaveValue("Mon outil");
  await expect(page.locator("#f-url")).toHaveValue("https://exemple.org");
});

test("depuis un catalogue sans résultat, « Proposer cette ressource » reprend la recherche", async ({ page }) => {
  await page.goto("/catalogue?q=ressource-introuvable-xyz");
  await ready(page);
  await page.click("#emptyPropose");
  await expect(page).toHaveURL(/\/contribuer\?title=ressource-introuvable-xyz#formulaire/);
  await expect(page.locator("#f-title")).toHaveValue("ressource-introuvable-xyz");
});
