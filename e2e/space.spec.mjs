// Mon espace, listes personnalisées, partage par lien, export et import — tout en local, sans serveur.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loadCatalogData, ready } from "./helpers.mjs";

const clipboard = (context) => context.grantPermissions(["clipboard-read", "clipboard-write"]);

async function addFirstCardToNewList(page, name) {
  await page.goto("/catalogue");
  await ready(page);
  const card = page.locator(".resource-card").first();
  const title = (await card.locator("h2").first().innerText()).replace("✦", "").trim();
  await card.locator(".list-btn").click();
  await expect(page.locator("dialog.dialog")).toBeVisible();
  await page.fill("#newListName", name);
  await page.click("[data-create]");
  await expect(page.locator(".dialog-status")).toContainText("créée");
  await page.keyboard.press("Escape");
  return title;
}

test("la fenêtre « Ajouter à une liste » crée une liste, coche la ressource et rend le focus au bouton", async ({ page }) => {
  await page.goto("/catalogue");
  await ready(page);
  const button = page.locator(".resource-card .list-btn").first();
  await button.click();
  const dialog = page.locator("dialog.dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Ajouter à une liste" })).toBeVisible();
  await page.fill("#newListName", "Atelier OSINT");
  await page.keyboard.press("Enter");
  await expect(dialog.locator("[data-list]").first()).toBeChecked();
  await expect(dialog.locator("label.check").first()).toContainText("Atelier OSINT");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
});

test("la fenêtre de liste est accessible (axe) et se ferme avec Échap", async ({ page }) => {
  await page.goto("/catalogue");
  await ready(page);
  await page.locator(".resource-card .list-btn").first().click();
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  expect(violations.map((v) => v.id)).toEqual([]);
});

test("Mon espace : favoris visibles, retirés avec l'étoile, état vide explicite", async ({ page }) => {
  await page.goto("/catalogue");
  await ready(page);
  await page.locator(".fav-btn").first().click();
  await page.goto("/espace");
  await ready(page);
  await expect(page.locator("#favCount")).toHaveText("1");
  await expect(page.locator("#favGrid .resource-card")).toHaveCount(1);
  await page.locator("#favGrid .fav-btn").click();
  await expect(page.locator("#favCount")).toHaveText("0");
  await expect(page.locator("#favGrid")).toContainText("Aucun favori");
});

test("listes : création, renommage, ajout des favoris, retrait d'une ressource, suppression à confirmer", async ({ page }) => {
  await page.goto("/catalogue");
  await ready(page);
  await page.locator(".fav-btn").nth(0).click();
  await page.locator(".fav-btn").nth(1).click();
  await page.goto("/espace");
  await ready(page);
  await page.fill("#newListName", "  Ma   sélection  ");
  await page.click("#createListBtn");
  const list = page.locator(".user-list").first();
  await expect(list.getByRole("heading", { name: "Ma sélection" })).toBeVisible();
  await expect(page.locator("#listCount")).toHaveText("1");

  await list.locator("[data-add-favs]").click();
  await expect(list.locator(".list-items li")).toHaveCount(2);
  await list.locator("[data-remove]").first().click();
  await expect(page.locator(".user-list .list-items li")).toHaveCount(1);

  await page.locator("[data-rename]").click();
  await page.fill(".rename-form input", "Parcours Blue Team");
  await page.keyboard.press("Enter");
  await expect(page.locator(".user-list h3")).toHaveText("Parcours Blue Team");

  await page.reload();
  await ready(page);
  await expect(page.locator(".user-list h3")).toHaveText("Parcours Blue Team");

  const del = page.locator("[data-delete]");
  await del.click();
  await expect(del).toContainText("Confirmer");
  await expect(page.locator(".user-list")).toHaveCount(1);
  await del.click();
  await expect(page.locator(".user-list")).toHaveCount(0);
  await expect(page.locator("#spaceStatus")).toContainText("supprimée");
});

test("partage par lien : le lien copié ouvre la même sélection, enregistrable en liste et en favoris", async ({
  page,
  context,
  request
}) => {
  await clipboard(context);
  const { resources } = await loadCatalogData(request);
  const title = await addFirstCardToNewList(page, "Atelier OSINT");
  await page.goto("/espace");
  await ready(page);
  await expect(page.locator(".user-list .list-items")).toContainText(title.split(" ")[0]);
  await page.click("[data-share]");
  await expect(page.locator("#spaceStatus")).toContainText("copié");
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const shared = new URL(link);
  expect(shared.pathname).toBe("/liste");
  expect(shared.searchParams.get("titre")).toBe("Atelier OSINT");
  expect(resources.some((r) => shared.searchParams.get("ids").split(",").includes(r.id))).toBe(true);

  await page.goto(link);
  await ready(page);
  await expect(page.locator("h1")).toHaveText("Atelier OSINT");
  await expect(page.locator("#sharedGrid .resource-card")).toHaveCount(1);

  await page.click("#saveFavs");
  await expect(page.locator("#sharedStatus")).toContainText("ajoutée");
  await page.click("#saveFavs");
  await expect(page.locator("#sharedStatus")).toContainText("déjà");
  await page.click("#saveList");
  await expect(page.locator("#sharedStatus")).toContainText("enregistrée");
  await expect(page.locator("#openSpace")).toBeVisible();
  await page.goto("/espace");
  await ready(page);
  await expect(page.locator(".user-list")).toHaveCount(2);
});

test("liste partagée hostile : aucun script, identifiants invalides ignorés, titre affiché comme du texte", async ({ page }) => {
  let dialog = false;
  page.on("dialog", async (d) => {
    dialog = true;
    await d.dismiss();
  });
  await page.goto(
    "/liste?ids=%3Cscript%3Ealert(1)%3C%2Fscript%3E,..%2F..%2Fetc,inconnu-total&titre=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E"
  );
  await ready(page);
  expect(dialog).toBe(false);
  await expect(page.locator("h1")).toHaveText("<img src=x onerror=alert(1)>");
  expect(await page.locator("h1 img").count()).toBe(0);
  await expect(page.locator("#sharedIntro")).toContainText("vide ou son lien est invalide");
  await expect(page.locator("#sharedActions")).toBeHidden();
});

test("export : le fichier contient les favoris et les listes ; import : validé puis fusionné", async ({ page }) => {
  await page.goto("/catalogue");
  await ready(page);
  await page.locator(".fav-btn").first().click();
  await page.goto("/espace");
  await ready(page);
  const [download] = await Promise.all([page.waitForEvent("download"), page.click("#exportBtn")]);
  expect(download.suggestedFilename()).toMatch(/^hashcode-mon-espace-\d{4}-\d{2}-\d{2}\.json$/);
  const exported = JSON.parse(await (await import("node:fs/promises")).readFile(await download.path(), "utf8"));
  expect(exported).toMatchObject({ app: "hashcode-cyber-library", version: 1 });
  expect(exported.favorites).toHaveLength(1);

  // import dans un navigateur « vide » : fichier valide + une référence inconnue
  const incoming = {
    ...exported,
    favorites: [...exported.favorites, "ressource-fantome"],
    lists: [{ id: "l-import01", name: "Importée", items: exported.favorites, created: "2026-11-14" }]
  };
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await ready(page);
  await page.setInputFiles("#importFile", {
    name: "export.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(incoming))
  });
  await expect(page.locator("#importPreview")).toBeVisible();
  await expect(page.locator("#importSummary")).toContainText("1 favori");
  await expect(page.locator("#importSummary")).toContainText("1 référence inconnue ignorée");
  await page.click("#importApply");
  await expect(page.locator("#favCount")).toHaveText("1");
  await expect(page.locator(".user-list h3")).toHaveText("Importée");
  await expect(page.locator("#importPreview")).toBeHidden();
});

test("import : un fichier invalide ou étranger est refusé sans rien modifier", async ({ page }) => {
  await page.goto("/espace");
  await ready(page);
  await page.setInputFiles("#importFile", { name: "x.json", mimeType: "application/json", buffer: Buffer.from("{pas du json") });
  await expect(page.locator("#spaceStatus")).toContainText("JSON valide");
  await page.setInputFiles("#importFile", {
    name: "x.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ app: "autre", version: 1 }))
  });
  await expect(page.locator("#spaceStatus")).toContainText("ne vient pas de HashCode");
  await expect(page.locator("#importPreview")).toBeHidden();
});

test("tout effacer demande une confirmation et vide le navigateur", async ({ page }) => {
  await addFirstCardToNewList(page, "À effacer");
  await page.goto("/espace");
  await ready(page);
  const button = page.locator("#clearAll");
  await button.click();
  await expect(button).toContainText("Confirmer");
  await expect(page.locator(".user-list")).toHaveCount(1);
  await button.click();
  await expect(page.locator(".user-list")).toHaveCount(0);
  await expect(page.locator("#spaceStatus")).toContainText("effacées");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("hc-lists") || "[]").length)).toBe(0);
});

test("aucune donnée de Mon espace n'est envoyée au réseau", async ({ page, baseURL }) => {
  const external = [];
  page.on("request", (request) => {
    if (request.method() !== "GET" || new URL(request.url()).host !== new URL(baseURL).host)
      external.push(`${request.method()} ${request.url()}`);
  });
  await addFirstCardToNewList(page, "Privée");
  await page.goto("/espace");
  await ready(page);
  await page.click("#exportBtn");
  expect(external).toEqual([]);
});
