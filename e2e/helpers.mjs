// Utilitaires partagés par les tests de navigateur.
import { DOCUMENTS } from "../js/docs-index.js";

/** Pages publiques du site (URL propres). */
export const PAGES = [
  "/",
  "/catalogue",
  "/domaines",
  "/etat",
  "/communaute",
  "/contribuer",
  "/espace",
  "/liste?ids=osint-framework&titre=Test",
  "/mentions-legales",
  "/confidentialite",
  "/docs?doc=README.md"
];
export const NOT_FOUND = "/n-existe-pas";
export const DOC_PATHS = DOCUMENTS.map((doc) => doc.path);
export const docURL = (path) => `/docs?doc=${encodeURIComponent(path)}`;

/** Force le thème avant le chargement de la page. */
export async function setTheme(context, theme) {
  await context.addInitScript((value) => localStorage.setItem("hc-theme", value), theme);
}

/** Le catalogue tel que le site le lit (pour calculer les résultats attendus indépendamment de l'interface). */
export async function loadCatalogData(request) {
  const data = await (await request.get("/data/resources.json")).json();
  const active = data.resources.filter((r) => !["archived", "removed"].includes(r.status));
  return { ...data, active };
}

/** Écoute les alertes console et les requêtes : retourne { issues, hosts }. */
export function watchPage(page) {
  const issues = [];
  const hosts = new Set();
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) issues.push(`${message.type()}: ${message.text().slice(0, 160)}`);
  });
  page.on("pageerror", (error) => issues.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => issues.push(`requête échouée: ${request.url()}`));
  page.on("request", (request) => hosts.add(new URL(request.url()).host));
  return { issues, hosts };
}

/** Attend que la page soit prête : navigation commune rendue (sauf page 404, qui n'en a pas) et réseau calme. */
export async function ready(page) {
  await page.waitForLoadState("domcontentloaded");
  if (await page.locator("body[data-page]").count()) await page.waitForSelector("#sidebar .side-link");
  await page.waitForLoadState("networkidle");
}
