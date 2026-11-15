// Mise en page : jamais de défilement horizontal, du mobile au grand écran.
import { test, expect } from "@playwright/test";
import { PAGES, NOT_FOUND, ready } from "./helpers.mjs";

const WIDTHS = [320, 390, 768, 1024, 1440];
const STATES = [...PAGES, "/docs?doc=library%2F04-BLUE-TEAM%2FREADME.md", "/catalogue?lang=fr&tag=osint", NOT_FOUND];

for (const width of WIDTHS) {
  test(`aucun débordement horizontal à ${width}px`, async ({ browser, baseURL }) => {
    test.setTimeout(120_000);
    const context = await browser.newContext({ baseURL, viewport: { width, height: 800 } });
    const page = await context.newPage();
    const overflows = [];
    for (const path of STATES) {
      await page.goto(path);
      await ready(page);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (wide) overflows.push(path);
    }
    await context.close();
    expect(overflows).toEqual([]);
  });
}

test("sur mobile, la barre latérale devient un tiroir qui s'ouvre et se ferme", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  await ready(page);
  await expect(page.locator("#menuBtn")).toBeVisible();
  await page.click("#menuBtn");
  await expect(page.locator("#sidebar")).toHaveClass(/is-open/);
  await expect(page.locator("#menuBtn")).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(page.locator("#sidebar")).not.toHaveClass(/is-open/);
  await page.click("#menuBtn");
  await page.click("#sidebar a[href='catalogue']");
  await expect(page).toHaveURL(/\/catalogue$/);
  await expect(page.locator("#sidebar")).not.toHaveClass(/is-open/);
  await context.close();
});
