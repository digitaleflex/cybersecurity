// Données, constantes et utilitaires partagés par toutes les pages.
export const DATA_URL = new URL("../data/resources.json", import.meta.url).href;
export const FAV_KEY = "hc-fav";
export const RECENT_KEY = "hc-recent";
export const NEW_WINDOW_DAYS = 7;
export const WHATSAPP_URL = "https://chat.whatsapp.com/IDcosEG4jjOK4mTAYsX92D";
export const GITHUB_URL = "https://github.com/digitaleflex/cybersecurity";

export const TYPE_LABELS = {
  tool: "Outil", course: "Formation", lab: "Laboratoire",
  documentation: "Documentation", repository: "Dépôt GitHub",
  framework: "Framework", platform: "Plateforme", community: "Communauté",
  report: "Rapport", library: "Bibliothèque", directory: "Annuaire", database: "Base de données"
};
export const STATUS_LABELS = { verified: "Vérifié", "needs-review": "À vérifier" };
export const LEVEL_LABELS = {
  beginner: "Débutant", intermediate: "Intermédiaire",
  advanced: "Avancé", professional: "Professionnel"
};
export const SORT_LABELS = { featured: "Sélection HashCode", az: "Nom A → Z", za: "Nom Z → A", newest: "Ajouts récents" };
export const VIEW_LABELS = { favorites: "Mes favoris", recent: "Consultés récemment", featured: "Sélection HashCode" };
export const DOMAIN_ICONS = {
  fundamentals: "cube", osint: "target", "red-team": "bolt", "blue-team": "shield",
  "reverse-engineering": "code", "malware-analysis": "bug", "cloud-security": "cloud",
  "application-security": "lock", "ctf-labs": "flag", "courses-books": "grad",
  communities: "users", "research-reports": "doc"
};

/* ---------- utilitaires ---------- */
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

export function safeExternalURL(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function normalizeText(value) {
  return String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("fr");
}

export const icon = (name, cls = "") => `<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
export const pad = (n) => String(n).padStart(2, "0");
export const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;

/** URL du catalogue avec filtres, ex. catalogueURL({ domain: "osint", q: "shodan" }). */
export function catalogueURL(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const query = params.toString();
  return `catalogue.html${query ? `?${query}` : ""}`;
}

/* ---------- stockage local (favoris, récents) ---------- */
function readStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch { return []; }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
}
export const favorites = () => readStore(FAV_KEY);
export const recents = () => readStore(RECENT_KEY);
export function toggleFavorite(id) {
  const list = favorites();
  writeStore(FAV_KEY, list.includes(id) ? list.filter((v) => v !== id) : [id, ...list]);
  window.dispatchEvent(new Event("hc:favorites"));
}
export function pushRecent(id) {
  writeStore(RECENT_KEY, [id, ...recents().filter((v) => v !== id)].slice(0, 12));
}

/* ---------- catalogue ---------- */
let catalogPromise;
export function loadCatalog() {
  catalogPromise ||= fetch(DATA_URL, { headers: { Accept: "application/json" } })
    .then((response) => {
      if (!response.ok) throw new Error(`Chargement du catalogue impossible (HTTP ${response.status})`);
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data.resources) || !Array.isArray(data.domains)) throw new Error("Le format de data/resources.json est invalide.");
      return { resources: data.resources, domains: data.domains, updated: data.updated || "" };
    });
  return catalogPromise;
}

export const activeResources = (c) => c.resources.filter((r) => !["archived", "removed"].includes(r.status));
export const getDomain = (c, id) => c.domains.find((d) => d.id === id);
export const domainCount = (c, id) => activeResources(c).filter((r) => r.domain === id).length;
export const domainsByCount = (c) => [...c.domains].sort((a, b) => domainCount(c, b.id) - domainCount(c, a.id) || a.number.localeCompare(b.number));

export function categoriesOf(c, domainId) {
  const counts = new Map();
  for (const r of activeResources(c)) {
    if (domainId && r.domain !== domainId) continue;
    if (r.category) counts.set(r.category, (counts.get(r.category) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"));
}

export function newResourcesCount(c) {
  if (!c.updated) return 0;
  return activeResources(c).filter((r) => {
    if (!r.added) return false;
    const diff = (new Date(c.updated) - new Date(r.added)) / 86400000;
    return diff >= 0 && diff <= NEW_WINDOW_DAYS;
  }).length;
}

export function showLoadError(container, message = "Impossible de charger les ressources.") {
  container.innerHTML = `<div class="load-error" role="alert"><strong>${escapeHTML(message)}</strong><p>Vérifie le fichier data/resources.json puis recharge la page.</p></div>`;
}
