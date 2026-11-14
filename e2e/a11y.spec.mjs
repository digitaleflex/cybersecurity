// Accessibilité automatisée (axe-core, WCAG 2.2 AA + bonnes pratiques) : deux thèmes, bureau et mobile.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PAGES, NOT_FOUND, setTheme, ready } from "./helpers.mjs";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];
const STATES = [
  ...PAGES,
  "/docs?doc=library%2F02-OSINT%2FREADME.md",
  "/catalogue?domain=red-team&lang=fr&q=lang%3Aklingon",
  "/catalogue?q=zzzzinconnu&domain=osint",
  NOT_FOUND
];
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

const format = (violations) =>
  violations.map(
    (v) =>
      `${v.id} (${v.impact}) : ${v.help}\n   ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join("\n   ")}`
  );

for (const theme of ["dark", "light"]) {
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    test(`aucune violation axe — thème ${theme}, ${name}`, async ({ browser, baseURL }) => {
      test.setTimeout(180_000);
      const context = await browser.newContext({ baseURL, viewport });
      await setTheme(context, theme);
      const page = await context.newPage();
      const failures = [];
      for (const path of STATES) {
        await page.goto(path);
        await ready(page);
        const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
        if (violations.length) failures.push(`${path}\n${format(violations).join("\n")}`);
      }
      await context.close();
      expect(failures).toEqual([]);
    });
  }
}

test("le formulaire de contribution reste accessible en état d'erreur et de doublon", async ({ page }) => {
  await page.goto("/contribuer");
  await ready(page);
  await page.click("#issueBtn", { force: true });
  let { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(format(violations)).toEqual([]);
  const url = await page.evaluate(async () => (await (await fetch("/data/resources.json")).json()).resources[0].url);
  await page.fill("#f-title", "Doublon de test");
  await page.fill("#f-url", url);
  await expect(page.locator("#dupPanel")).toBeVisible();
  ({ violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze());
  expect(format(violations)).toEqual([]);
});

test("navigation au clavier : lien d'évitement, focus visible et menu Domaines", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await page.locator("#domainsMenuBtn").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#domainsMenu")).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Escape");
  await expect(page.locator("#domainsMenu")).toBeHidden();
  await expect(page.locator("#domainsMenuBtn")).toBeFocused();
});
