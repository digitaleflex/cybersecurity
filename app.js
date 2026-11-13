const DATA_URL = "./data/resources.json";
const PAGE_SIZE = 9;
const FAV_KEY = "hc-fav";
const RECENT_KEY = "hc-recent";
const THEME_KEY = "hc-theme";
const NEW_WINDOW_DAYS = 7;

const state = {
  resources: [],
  domains: [],
  updated: "",
  visible: PAGE_SIZE,
  query: "",
  domain: "",
  category: "",
  type: "",
  level: "",
  status: "",
  sort: "featured",
  view: "", // "" | "favorites" | "recent" | "featured"
  favorites: [],
  recent: [],
  collection: 0
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const TYPE_LABELS = {
  tool: "Outil", course: "Formation", lab: "Laboratoire",
  documentation: "Documentation", repository: "Dépôt GitHub",
  framework: "Framework", platform: "Plateforme", community: "Communauté",
  report: "Rapport", library: "Bibliothèque", directory: "Annuaire"
};
const STATUS_LABELS = { verified: "Vérifié", "needs-review": "À vérifier" };
const LEVEL_LABELS = {
  beginner: "Débutant", intermediate: "Intermédiaire",
  advanced: "Avancé", professional: "Professionnel"
};
const DOMAIN_ICONS = {
  fundamentals: "cube", osint: "target", "red-team": "bolt", "blue-team": "shield",
  "reverse-engineering": "code", "malware-analysis": "bug", "cloud-security": "cloud",
  "application-security": "lock", "ctf-labs": "flag", "courses-books": "grad",
  communities: "users", "research-reports": "doc"
};
const COLLECTIONS = [
  { title: "OSINT 360°", domain: "osint", description: "Le kit complet pour collecter, analyser et exploiter les informations en sources ouvertes." },
  { title: "Red Team Toolkit", domain: "red-team", description: "Reconnaissance, pentest et simulation d'adversaire : le matériel pour les évaluations autorisées." },
  { title: "Blue Team Playbook", domain: "blue-team", description: "SOC, SIEM, détection et réponse aux incidents : de quoi défendre et investiguer." }
];

/* ---------- utilitaires ---------- */
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function safeExternalURL(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("fr");
}

const icon = (name, cls = "") => `<svg class="ico ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const pad = (n) => String(n).padStart(2, "0");
const plural = (n, word) => `${n} ${word}${n > 1 ? "s" : ""}`;

function readStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((v) => typeof v === "string") : [];
  } catch { return []; }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
}

function getDomain(domainId) {
  return state.domains.find((domain) => domain.id === domainId);
}
function activeResources() {
  return state.resources.filter((r) => !["archived", "removed"].includes(r.status));
}
function domainCount(id) {
  return activeResources().filter((r) => r.domain === id).length;
}
function domainsByCount() {
  return [...state.domains].sort((a, b) => domainCount(b.id) - domainCount(a.id) || a.number.localeCompare(b.number));
}

/* ---------- stats & rendu statique ---------- */
function updateStats() {
  const list = activeResources();
  const osintCategories = new Set(list.filter((r) => r.domain === "osint").map((r) => r.category).filter(Boolean)).size;
  const values = {
    resources: list.length,
    osintCategories,
    domains: state.domains.length,
    types: new Set(list.map((r) => r.type)).size,
    featured: list.filter((r) => r.featured).length,
    pending: list.filter((r) => r.status === "needs-review").length
  };
  $$("[data-stat]").forEach((node) => { node.textContent = values[node.dataset.stat] ?? "—"; });
  $("#navCountAll").textContent = values.resources;
  $("#navCountOsint").textContent = domainCount("osint");
}

function isRecent(dateString) {
  if (!dateString || !state.updated) return false;
  const diff = (new Date(state.updated) - new Date(dateString)) / 86400000;
  return diff >= 0 && diff <= NEW_WINDOW_DAYS;
}

function renderActivity() {
  const list = activeResources();
  const news = list.filter((r) => isRecent(r.added)).length;
  const verified = list.filter((r) => r.status === "verified").length;
  const rows = [
    { act: "newest", ico: "bolt", label: "Nouvelles ressources", badge: news ? `+${news}` : "" },
    { act: "verified", ico: "refresh", label: "Ressources vérifiées", badge: verified ? `${verified}` : "" },
    { act: "featured", ico: "flame", label: "Sélection HashCode", badge: "" }
  ];
  const buttons = rows.map((row) => `<li><button type="button" data-activity="${row.act}">${icon(row.ico, "a-ico")}<span class="a-label">${row.label}</span>${row.badge ? `<span class="a-badge">${row.badge}</span>` : ""}${icon("chev-right", "a-chev")}</button></li>`);
  buttons.push(`<li><button type="button" data-activity="contribute">${icon("calendar", "a-ico")}<span class="a-label">Proposer une ressource</span>${icon("external", "a-chev")}</button></li>`);
  $("#activityList").innerHTML = buttons.join("");

  const badge = $("#bellBadge");
  badge.hidden = news === 0;
  $("#bellLink").setAttribute("aria-label", news ? `Nouveautés du catalogue : ${plural(news, "nouvelle ressource")}` : "Nouveautés du catalogue");
}

function renderRail() {
  const sorted = domainsByCount();
  $("#domainRail").innerHTML = sorted.map((domain, index) => {
    const count = domainCount(domain.id);
    const lead = index === 0;
    return `<button type="button" class="tile${lead ? " is-lead" : ""}" data-domain="${escapeHTML(domain.id)}" aria-pressed="${state.domain === domain.id}">
      <span class="tile-top">${icon(DOMAIN_ICONS[domain.id] || "cube")}${lead ? `<span class="arrow">${icon("arrow")}</span>` : ""}</span>
      <span><b>${escapeHTML(domain.title)}</b><small>${plural(count, "ressource")}</small></span>
    </button>`;
  }).join("");
}

function renderDomainCards() {
  $("#domainCards").innerHTML = state.domains.map((domain) => {
    const count = domainCount(domain.id);
    return `<button type="button" class="dcard" data-domain="${escapeHTML(domain.id)}" aria-pressed="${state.domain === domain.id}">
      ${icon(DOMAIN_ICONS[domain.id] || "cube")}<span class="num">${escapeHTML(domain.number)} / ${pad(state.domains.length)}</span>
      <b>${escapeHTML(domain.title)}</b><p>${escapeHTML(domain.description)}</p><small>${plural(count, "ressource")}</small>
    </button>`;
  }).join("");
}

function renderDomainMenus() {
  const items = state.domains.map((domain) => `<button type="button" role="menuitem" data-domain="${escapeHTML(domain.id)}">${escapeHTML(domain.title)}<small>${domainCount(domain.id)}</small></button>`).join("");
  $("#domainsMenu").innerHTML = items;
  $("#sideDomains").innerHTML = state.domains.map((domain) => `<button type="button" data-domain="${escapeHTML(domain.id)}">${escapeHTML(domain.title)}<small>${domainCount(domain.id)}</small></button>`).join("");
}

function syncDomainPressed() {
  $$("[data-domain][aria-pressed]").forEach((node) => node.setAttribute("aria-pressed", String(node.dataset.domain === state.domain)));
}

function renderCollection() {
  const item = COLLECTIONS[state.collection];
  $("#collTitle").textContent = item.title;
  $("#collDesc").textContent = item.description;
  $("#collCta").dataset.collection = String(state.collection);
  $("#collDots").innerHTML = COLLECTIONS.map((c, i) => `<button type="button" role="tab" data-dot="${i}" aria-selected="${i === state.collection}" aria-label="${escapeHTML(c.title)}"></button>`).join("");
}

/* ---------- filtres ---------- */
function populateFilters() {
  const domainFilter = $("#domainFilter");
  state.domains.forEach((domain) => domainFilter.add(new Option(domain.title, domain.id)));
  populateCategoryFilter();
  [...new Set(state.resources.map((resource) => resource.type))].sort()
    .forEach((type) => $("#typeFilter").add(new Option(TYPE_LABELS[type] || type, type)));
  Object.entries(LEVEL_LABELS).forEach(([value, label]) => $("#levelFilter").add(new Option(label, value)));
  Object.entries(STATUS_LABELS).forEach(([value, label]) => $("#statusFilter").add(new Option(label, value)));
}

function populateCategoryFilter() {
  const filter = $("#categoryFilter");
  const current = state.category;
  filter.replaceChildren(new Option("Toutes les catégories", ""));
  const categories = [...new Set(state.resources
    .filter((resource) => !state.domain || resource.domain === state.domain)
    .map((resource) => resource.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  categories.forEach((category) => filter.add(new Option(category, category)));
  filter.value = categories.includes(current) ? current : "";
  state.category = filter.value;
}

function getFilteredResources() {
  const query = normalizeText(state.query.trim());
  let resources = state.resources.filter((resource) => {
    if (["archived", "removed"].includes(resource.status)) return false;
    if (state.view === "favorites" && !state.favorites.includes(resource.id)) return false;
    if (state.view === "recent" && !state.recent.includes(resource.id)) return false;
    if (state.view === "featured" && !resource.featured) return false;
    if (state.domain && resource.domain !== state.domain) return false;
    if (state.category && resource.category !== state.category) return false;
    if (state.type && resource.type !== state.type) return false;
    if (state.level && resource.level !== state.level) return false;
    if (state.status && resource.status !== state.status) return false;
    if (!query) return true;
    const domain = getDomain(resource.domain);
    const searchable = [
      resource.title, resource.description, resource.category, resource.source,
      resource.domain, domain?.title, resource.access,
      ...(resource.tags || []), ...(resource.language || [])
    ].join(" ");
    return normalizeText(searchable).includes(query);
  });

  resources.sort((a, b) => {
    if (state.view === "recent") return state.recent.indexOf(a.id) - state.recent.indexOf(b.id);
    if (state.sort === "az") return a.title.localeCompare(b.title, "fr");
    if (state.sort === "za") return b.title.localeCompare(a.title, "fr");
    if (state.sort === "newest") return String(b.added || b.verified || "").localeCompare(String(a.added || a.verified || "")) || a.title.localeCompare(b.title, "fr");
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.title.localeCompare(b.title, "fr");
  });
  return resources;
}

/* ---------- cartes ressources ---------- */
function resourceCard(resource) {
  const domain = getDomain(resource.domain);
  const url = safeExternalURL(resource.url);
  const type = TYPE_LABELS[resource.type] || resource.type;
  const level = LEVEL_LABELS[resource.level] || resource.level;
  const status = STATUS_LABELS[resource.status] || "Statut inconnu";
  const access = resource.access === "free" ? "Gratuit" : resource.access === "paid" ? "Payant" : resource.access === "freemium" ? "Freemium" : resource.access;
  const languages = (resource.language || []).slice(0, 2).map((language) => language.toUpperCase()).join(" · ");
  const tags = (resource.tags || []).slice(0, 3);
  const fav = state.favorites.includes(resource.id);

  return `<article class="resource-card" data-id="${escapeHTML(resource.id)}">
    <button class="fav-btn" type="button" data-fav="${escapeHTML(resource.id)}" aria-pressed="${fav}" aria-label="${fav ? "Retirer des favoris" : "Ajouter aux favoris"} : ${escapeHTML(resource.title)}">${icon("star")}</button>
    <div class="card-topline">
      <span class="resource-type">${escapeHTML(type)}</span>
      <span class="pill">${escapeHTML(level)}</span>
      <span class="pill status-${escapeHTML(resource.status)}">${escapeHTML(status)}</span>
    </div>
    <h3>${escapeHTML(resource.title)} ${resource.featured ? '<span class="featured-mark" role="img" aria-label="Sélection HashCode">✦</span>' : ""}</h3>
    <p>${escapeHTML(resource.description)}</p>
    <div class="resource-tags">${tags.map((tag) => `<span>#${escapeHTML(tag)}</span>`).join("")}</div>
    <div class="card-footer">
      <span class="card-domain">${escapeHTML(domain?.title || resource.domain)} · ${escapeHTML(resource.category)}<small>${escapeHTML([access, languages].filter(Boolean).join(" / "))}</small></span>
      ${url ? `<a class="card-open" href="${escapeHTML(url)}" data-open="${escapeHTML(resource.id)}" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir ${escapeHTML(resource.title)} dans un nouvel onglet">${icon("external")}</a>` : '<span class="card-open card-unavailable" title="URL invalide">—</span>'}
    </div>
  </article>`;
}

const VIEW_LABELS = { favorites: "Mes favoris", recent: "Consultés récemment", featured: "Sélection HashCode" };
const EMPTY_TEXT = {
  favorites: "Aucun favori pour l'instant. Utilise l'étoile d'une carte pour en ajouter.",
  recent: "Aucune ressource consultée pour l'instant. Ouvre une ressource pour la retrouver ici."
};

function renderResources() {
  const filtered = getFilteredResources();
  const visible = filtered.slice(0, state.visible);

  $("#resultsCount").textContent = `${plural(filtered.length, "ressource")} trouvée${filtered.length > 1 ? "s" : ""}`;
  $("#resourceGrid").innerHTML = visible.map(resourceCard).join("");
  $("#emptyState").hidden = filtered.length !== 0;
  $("#emptyText").textContent = EMPTY_TEXT[state.view] || "Essaie un autre terme ou modifie les filtres.";
  $("#loadMore").hidden = state.visible >= filtered.length || filtered.length === 0;

  const chip = $("#viewChip");
  chip.hidden = !state.view;
  chip.textContent = VIEW_LABELS[state.view] || "";
  $$("[data-view]").forEach((btn) => {
    const on = btn.dataset.view === state.view;
    btn.classList.toggle("is-active", on);
    if (on) btn.setAttribute("aria-current", "true"); else btn.removeAttribute("aria-current");
  });
  $("#navCountFav").textContent = state.favorites.length;
}

function applyFilters({ scroll = true } = {}) {
  state.visible = PAGE_SIZE;
  $("#domainFilter").value = state.domain;
  populateCategoryFilter();
  $("#sortFilter").value = state.sort;
  syncDomainPressed();
  renderResources();
  if (scroll) goToCatalog();
}

function goToCatalog() {
  $("#explore").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function setDomain(id) {
  state.domain = id;
  state.category = "";
  state.view = "";
  applyFilters();
  closeMenus();
  closeSidebar();
}

function setQuery(value, source) {
  state.query = value;
  $$("[data-search]").forEach((input) => { if (input !== source) input.value = value; });
  state.visible = PAGE_SIZE;
  renderResources();
}

function resetFilters() {
  Object.assign(state, { query: "", domain: "", category: "", type: "", level: "", status: "", sort: "featured", view: "", visible: PAGE_SIZE });
  $$("[data-search]").forEach((input) => { input.value = ""; });
  $("#typeFilter").value = "";
  $("#levelFilter").value = "";
  $("#statusFilter").value = "";
  applyFilters({ scroll: false });
}

/* ---------- favoris & historique ---------- */
function toggleFavorite(id) {
  state.favorites = state.favorites.includes(id) ? state.favorites.filter((v) => v !== id) : [id, ...state.favorites];
  writeStore(FAV_KEY, state.favorites);
  renderResources();
}
function pushRecent(id) {
  state.recent = [id, ...state.recent.filter((v) => v !== id)].slice(0, 12);
  writeStore(RECENT_KEY, state.recent);
}

/* ---------- menus, thème, navigation ---------- */
function closeMenus() {
  const btn = $("#domainsMenuBtn");
  $("#domainsMenu").hidden = true;
  btn.setAttribute("aria-expanded", "false");
}
function openSidebar() {
  $("#sidebar").classList.add("is-open");
  $("#scrim").hidden = false;
  $("#menuBtn").setAttribute("aria-expanded", "true");
  $("#menuBtn").setAttribute("aria-label", "Fermer le menu");
  $("#sidebar a, #sidebar button")?.focus();
}
function closeSidebar() {
  if (!$("#sidebar").classList.contains("is-open")) return;
  $("#sidebar").classList.remove("is-open");
  $("#scrim").hidden = true;
  $("#menuBtn").setAttribute("aria-expanded", "false");
  $("#menuBtn").setAttribute("aria-label", "Ouvrir le menu");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  $("#themeToggle use").setAttribute("href", dark ? "#i-sun" : "#i-moon");
  $("#themeToggle").setAttribute("aria-label", dark ? "Passer au thème clair" : "Passer au thème sombre");
  $('meta[name="theme-color"]').setAttribute("content", dark ? "#070b0a" : "#f3f7f5");
}

function focusSearch() {
  const input = $("#heroSearch");
  input.scrollIntoView({ block: "center", behavior: "auto" });
  input.focus();
  input.select();
}

function scrollRail(id) {
  const rail = document.getElementById(id);
  const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
  rail.scrollTo({ left: atEnd ? 0 : rail.scrollLeft + rail.clientWidth * 0.8, behavior: "smooth" });
}

function observeSections() {
  const map = [["#home", "home"], ["#collections", "collections"], ["#explore", "catalog"]];
  const visible = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
    const best = map.map(([sel, key]) => [key, visible.get(sel.slice(1)) || 0]).sort((a, b) => b[1] - a[1])[0];
    if (!best || best[1] === 0) return;
    $$("[data-nav]").forEach((a) => {
      const on = a.dataset.nav === best[0];
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    $$("[data-tab]").forEach((a) => a.classList.toggle("is-active", a.dataset.tab === (best[0] === "catalog" ? "catalog" : "home")));
  }, { threshold: [0.05, 0.25, 0.5, 0.75] });
  map.forEach(([sel]) => { const el = $(sel); if (el) io.observe(el); });
}

/* ---------- événements ---------- */
function bindEvents() {
  // recherche (hero + catalogue synchronisés)
  $$("[data-search]").forEach((input) => input.addEventListener("input", (e) => setQuery(e.target.value, e.target)));
  $("#heroSearchForm").addEventListener("submit", (e) => { e.preventDefault(); state.view = ""; renderResources(); goToCatalog(); });
  $$("[data-query]").forEach((chip) => chip.addEventListener("click", () => {
    state.view = "";
    setQuery(chip.dataset.query);
    goToCatalog();
  }));

  // filtres
  [["#domainFilter", "domain"], ["#categoryFilter", "category"], ["#typeFilter", "type"],
   ["#levelFilter", "level"], ["#statusFilter", "status"], ["#sortFilter", "sort"]].forEach(([selector, key]) => {
    $(selector).addEventListener("change", (event) => {
      state[key] = event.target.value;
      if (key === "domain") { state.category = ""; populateCategoryFilter(); syncDomainPressed(); }
      state.visible = PAGE_SIZE;
      renderResources();
    });
  });
  $("#resetFilters").addEventListener("click", resetFilters);
  $("#emptyReset").addEventListener("click", resetFilters);
  $("#loadMore").addEventListener("click", () => { state.visible += PAGE_SIZE; renderResources(); });

  // délégation : domaines (tuiles, cartes, menus)
  document.addEventListener("click", (event) => {
    const domainBtn = event.target.closest("button[data-domain]");
    if (domainBtn) { setDomain(domainBtn.dataset.domain); return; }

    const activity = event.target.closest("[data-activity]");
    if (activity) {
      const kind = activity.dataset.activity;
      if (kind === "contribute") { window.open("https://github.com/digitaleflex/cybersecurity/issues/new/choose", "_blank", "noopener,noreferrer"); return; }
      state.domain = ""; state.category = ""; state.view = "";
      if (kind === "newest") state.sort = "newest";
      if (kind === "verified") state.status = "verified";
      if (kind === "featured") state.view = "featured";
      $("#statusFilter").value = state.status;
      applyFilters();
      return;
    }

    const viewBtn = event.target.closest("button[data-view]");
    if (viewBtn) {
      state.view = state.view === viewBtn.dataset.view ? "" : viewBtn.dataset.view;
      state.domain = ""; state.category = "";
      applyFilters();
      closeSidebar();
      return;
    }

    const dot = event.target.closest("[data-dot]");
    if (dot) { state.collection = Number(dot.dataset.dot); renderCollection(); return; }

    const rail = event.target.closest("[data-rail]");
    if (rail) { scrollRail(rail.dataset.rail); return; }

    const fav = event.target.closest("[data-fav]");
    if (fav) { toggleFavorite(fav.dataset.fav); return; }

    const open = event.target.closest("[data-open]");
    if (open) pushRecent(open.dataset.open);

    if (event.target.closest("#collCta")) {
      event.preventDefault();
      setDomain(COLLECTIONS[state.collection].domain);
      return;
    }
    if (event.target.closest("#domainsCta")) { state.domain = ""; state.view = ""; applyFilters({ scroll: false }); }

    const osintNav = event.target.closest('[data-nav="osint"]');
    if (osintNav) { event.preventDefault(); setDomain("osint"); return; }

    if (!event.target.closest(".tab-menu")) closeMenus();
    if (event.target.closest("#sidebar a[href]")) closeSidebar();
  });

  // menu domaines (topbar)
  $("#domainsMenuBtn").addEventListener("click", () => {
    const menu = $("#domainsMenu");
    const open = menu.hidden;
    menu.hidden = !open;
    $("#domainsMenuBtn").setAttribute("aria-expanded", String(open));
    if (open) menu.querySelector("button")?.focus();
  });
  $("#domainsMenu").addEventListener("keydown", (e) => {
    const items = $$("button", $("#domainsMenu"));
    const i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });
  $("#sideDomainsToggle").addEventListener("click", () => {
    const expanded = $("#sideDomainsToggle").getAttribute("aria-expanded") === "true";
    $("#sideDomainsToggle").setAttribute("aria-expanded", String(!expanded));
    $("#sideDomains").hidden = expanded;
  });

  // thème, menu mobile, recherche rapide
  $("#themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignoré */ }
  });
  $("#menuBtn").addEventListener("click", () => ($("#sidebar").classList.contains("is-open") ? closeSidebar() : openSidebar()));
  $("#scrim").addEventListener("click", closeSidebar);
  $("#topSearchBtn").addEventListener("click", focusSearch);

  document.addEventListener("keydown", (event) => {
    const target = document.activeElement;
    const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    if ((event.key === "k" || event.key === "K") && (event.ctrlKey || event.metaKey)) { event.preventDefault(); focusSearch(); return; }
    if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); focusSearch(); return; }
    if (event.key === "Escape") {
      if (!$("#domainsMenu").hidden) { closeMenus(); $("#domainsMenuBtn").focus(); return; }
      if ($("#sidebar").classList.contains("is-open")) { closeSidebar(); $("#menuBtn").focus(); return; }
      if (typing) target.blur();
    }
  });
}

/* ---------- init ---------- */
async function init() {
  applyTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  state.favorites = readStore(FAV_KEY);
  state.recent = readStore(RECENT_KEY);
  bindEvents();
  $("#currentYear").textContent = new Date().getFullYear();
  observeSections();

  try {
    const response = await fetch(DATA_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Chargement du catalogue impossible (HTTP ${response.status})`);
    const data = await response.json();
    if (!Array.isArray(data.resources) || !Array.isArray(data.domains)) throw new Error("Le format de data/resources.json est invalide.");

    state.resources = data.resources;
    state.domains = data.domains;
    state.updated = data.updated || "";
    state.favorites = state.favorites.filter((id) => state.resources.some((r) => r.id === id));
    state.recent = state.recent.filter((id) => state.resources.some((r) => r.id === id));

    updateStats();
    populateFilters();
    renderActivity();
    renderRail();
    renderDomainCards();
    renderDomainMenus();
    renderCollection();
    renderResources();
  } catch (error) {
    console.error(error);
    $("#resultsCount").textContent = "Catalogue indisponible";
    $("#resourceGrid").innerHTML = '<div class="load-error"><strong>Impossible de charger les ressources.</strong><p>Vérifie le fichier data/resources.json puis recharge la page.</p></div>';
    $$("[data-stat]").forEach((n) => { n.textContent = "—"; });
  }
}

document.addEventListener("DOMContentLoaded", init);
