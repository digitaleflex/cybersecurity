// Navigation commune : thème, raccourcis, menu Domaines, accueil et communauté.
import { test, expect } from "@playwright/test";
import { ready } from "./helpers.mjs";

test("le thème se change, se mémorise et s'applique sans flash au rechargement", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.click("#themeToggle");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.goto("/domaines");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("#themeToggle")).toHaveAttribute("aria-label", /sombre/);
});

test("Ctrl+K depuis n'importe quelle page ouvre la recherche du catalogue", async ({ page }) => {
  await page.goto("/communaute");
  await ready(page);
  await page.keyboard.press("Control+k");
  await expect(page).toHaveURL(/\/catalogue$/);
  await expect(page.locator("#searchInput")).toBeFocused();
  await page.goto("/");
  await ready(page);
  await page.keyboard.press("Control+k");
  await expect(page.locator("#heroSearch")).toBeFocused();
});

test("la recherche de l'accueil et les raccourcis mènent au catalogue filtré", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.fill("#heroSearch", "osint");
  await page.press("#heroSearch", "Enter");
  await expect(page).toHaveURL(/\/catalogue\?q=osint$/);
  await page.goto("/");
  await ready(page);
  await page.locator("#domainRail .tile").nth(1).click();
  await expect(page).toHaveURL(/\/catalogue\?domain=/);
});

test("le menu Domaines liste les 12 domaines et mène au catalogue filtré", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.click("#domainsMenuBtn");
  await expect(page.locator("#domainsMenu a")).toHaveCount(13); // « Tous les domaines » + 12
  await page.locator("#domainsMenu a").nth(2).click();
  await expect(page).toHaveURL(/\/catalogue\?domain=osint$/);
});

test("la page Domaines affiche les 12 domaines avec leurs catégories cliquables", async ({ page }) => {
  await page.goto("/domaines");
  await ready(page);
  await expect(page.locator(".domain-page-card")).toHaveCount(12);
  await page.locator(".cat-chips a.chip:not(.chip-guide):not(.chip-more)").first().click();
  await expect(page).toHaveURL(/domain=.*&category=|category=.*&domain=/);
});

test("la page Communauté propose le groupe WhatsApp avec un lien sûr et un QR code lisible", async ({ page }) => {
  await page.goto("/communaute");
  await ready(page);
  const links = page.locator("a[href^='https://chat.whatsapp.com/']");
  await expect(links.first()).toHaveAttribute("rel", "noopener noreferrer");
  await expect(links.first()).toHaveAttribute("target", "_blank");
  const loaded = await page.evaluate(() => {
    const img = document.querySelector(".qr img");
    return img.complete && img.naturalWidth > 0;
  });
  expect(loaded).toBe(true);
});

test("une page inconnue affiche la page 404 du site avec le statut 404", async ({ page }) => {
  const response = await page.goto("/n-existe-pas");
  expect(response.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("introuvable");
  await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
});

test("les pages juridiques sont accessibles depuis le pied de page", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.click("footer a[href='mentions-legales']");
  await expect(page.locator("h1")).toHaveText("Mentions légales");
  await page.click("footer a[href='confidentialite']");
  await expect(page.locator("h1")).toHaveText("Confidentialité");
});
