// Page Catalogue : recherche avancée et filtres synchronisés avec l'URL (?domain=osint&lang=fr&tag=forensic&q=…).
import "./shell.js";
import {
  $, $$, escapeHTML, plural, icon, TYPE_LABELS, STATUS_LABELS, LEVEL_LABELS, ACCESS_LABELS, LANG_LABELS, SORT_LABELS, VIEW_LABELS,
  loadCatalog, activeResources, getDomain, categoriesOf, favorites, recents, showLoadError, SENSITIVE_DOMAINS
} from "./data.js";
import { resourceCard, bindCards } from "./cards.js";
import { docURL } from "./docs-index.js";
import { parseFilters, serializeFilters, sameFilters, DEFAULT_FILTERS } from "./url-state.js";
import { parseQuery, indexResource, matchResource, scoreResource, invalidFields } from "./search.js";

const PAGE_SIZE = 9;
const POPULAR_TAGS = 14;
const BASE_TITLE = "Catalogue — HashCode Cyber Library";
const EMPTY_TEXT = {
  favorites: "Aucun favori pour l'instant. Utilise l'étoile d'une carte pour en ajouter.",
  recent: "Aucune ressource consultée pour l'instant. Ouvre une ressource pour la retrouver ici."
};
const ADVANCED_KEYS = ["lang", "access", "tag"];

let catalog;
let allowed;
let index; // id -> données de recherche préparées une seule fois
let filters = { ...DEFAULT_FILTERS };
let visible = PAGE_SIZE;

const searchInputs = () => $$("[data-search]");
const parsedQuery = (q) => parseQuery(q, { domains: catalog.domains });

function normalize(next) {
  if (next.domain && next.category && !categoriesOf(catalog, next.domain).some(([name]) => name === next.category)) next.category = "";
  return next;
}
const readURL = () => normalize(parseFilters(location.search, allowed));

/* ---------- contrôles ---------- */
function fillSelect(select, options, firstLabel) {
  const first = firstLabel ? [new Option(firstLabel, "")] : [];
  select.replaceChildren(...first, ...options.map(([value, label]) => new Option(label, value)));
}

function popularTags() {
  const counts = new Map();
  for (const r of activeResources(catalog)) for (const tag of r.tags || []) counts.set(tag, (counts.get(tag) || 0) + 1);
  return [...counts].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, POPULAR_TAGS);
}

function populateStatic() {
  fillSelect($("#domainFilter"), catalog.domains.map((d) => [d.id, d.title]), "Tous les domaines");
  fillSelect($("#typeFilter"), [...new Set(activeResources(catalog).map((r) => r.type))].sort().map((t) => [t, TYPE_LABELS[t] || t]), "Tous les formats");
  fillSelect($("#levelFilter"), Object.entries(LEVEL_LABELS), "Tous les niveaux");
  fillSelect($("#statusFilter"), Object.entries(STATUS_LABELS), "Tous les statuts");
  fillSelect($("#languageFilter"), Object.entries(LANG_LABELS), "Toutes les langues");
  fillSelect($("#accessFilter"), Object.entries(ACCESS_LABELS), "Tous les accès");
  fillSelect($("#sortFilter"), Object.entries(SORT_LABELS));
  $("#tagChips").innerHTML = popularTags().map(([tag, n]) => `<button type="button" class="tag-chip" data-tag="${escapeHTML(tag)}" aria-pressed="false">#${escapeHTML(tag)} <small>${n}</small></button>`).join("");
}

function syncControls() {
  fillSelect($("#categoryFilter"), categoriesOf(catalog, filters.domain).map(([name, n]) => [name, `${name} (${n})`]), "Toutes les catégories");
  $("#domainFilter").value = filters.domain;
  $("#categoryFilter").value = filters.category;
  $("#typeFilter").value = filters.type;
  $("#levelFilter").value = filters.level;
  $("#statusFilter").value = filters.status;
  $("#languageFilter").value = filters.lang;
  $("#accessFilter").value = filters.access;
  $("#sortFilter").value = filters.sort;
  searchInputs().forEach((input) => { if (input.value !== filters.q) input.value = filters.q; });
  $$("#tagChips [data-tag]").forEach((chip) => chip.setAttribute("aria-pressed", String(chip.dataset.tag === filters.tag)));
  const advanced = ADVANCED_KEYS.filter((key) => filters[key]).length;
  $("#advBadge").hidden = advanced === 0;
  $("#advBadge").textContent = advanced;
  if (advanced) $("#advSearch").open = true;
}

function renderChips() {
  const labels = {
    q: filters.q && `« ${filters.q} »`,
    domain: filters.domain && getDomain(catalog, filters.domain)?.title,
    category: filters.category,
    type: filters.type && (TYPE_LABELS[filters.type] || filters.type),
    level: filters.level && LEVEL_LABELS[filters.level],
    status: filters.status && STATUS_LABELS[filters.status],
    lang: filters.lang && `Langue : ${LANG_LABELS[filters.lang]}`,
    access: filters.access && ACCESS_LABELS[filters.access],
    tag: filters.tag && `#${filters.tag}`,
    view: filters.view && VIEW_LABELS[filters.view]
  };
  const chips = Object.entries(labels).filter(([, label]) => label)
    .map(([key, label]) => `<button type="button" class="filter-chip" data-clear="${key}" aria-label="Retirer le filtre : ${escapeHTML(label)}">${escapeHTML(label)} ${icon("x")}</button>`);
  const box = $("#activeFilters");
  box.innerHTML = chips.join("");
  box.hidden = chips.length === 0;
}

/* ---------- résultats ---------- */
function getFiltered(f = filters, { fuzzy = false } = {}) {
  const parsed = parsedQuery(f.q);
  const favs = favorites();
  const recent = recents();
  const list = activeResources(catalog).filter((r) => {
    if (f.view === "favorites" && !favs.includes(r.id)) return false;
    if (f.view === "recent" && !recent.includes(r.id)) return false;
    if (f.view === "featured" && !r.featured) return false;
    if (f.domain && r.domain !== f.domain) return false;
    if (f.category && r.category !== f.category) return false;
    if (f.type && r.type !== f.type) return false;
    if (f.level && r.level !== f.level) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.lang && !(r.language || []).includes(f.lang)) return false;
    if (f.access && r.access !== f.access) return false;
    if (f.tag && !index.get(r.id).tags.includes(f.tag)) return false;
    return matchResource(r, index.get(r.id), parsed, { fuzzy });
  });
  const ranked = (parsed.terms.length || parsed.phrases.length) && f.sort === "featured"; // avec une recherche : pertinence d'abord
  const score = new Map(ranked ? list.map((r) => [r.id, scoreResource(r, index.get(r.id), parsed)]) : []);
  list.sort((a, b) => {
    if (f.view === "recent") return recent.indexOf(a.id) - recent.indexOf(b.id);
    if (f.sort === "az") return a.title.localeCompare(b.title, "fr");
    if (f.sort === "za") return b.title.localeCompare(a.title, "fr");
    if (f.sort === "newest") return String(b.added || b.verified || "").localeCompare(String(a.added || a.verified || "")) || a.title.localeCompare(b.title, "fr");
    if (ranked && score.get(b.id) !== score.get(a.id)) return score.get(b.id) - score.get(a.id);
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.title.localeCompare(b.title, "fr");
  });
  return { list, parsed };
}

const FILTER_NAMES = {
  q: () => "la recherche", domain: () => getDomain(catalog, filters.domain)?.title, category: () => filters.category,
  type: () => TYPE_LABELS[filters.type], level: () => LEVEL_LABELS[filters.level], status: () => STATUS_LABELS[filters.status],
  lang: () => LANG_LABELS[filters.lang], access: () => ACCESS_LABELS[filters.access], tag: () => `#${filters.tag}`, view: () => VIEW_LABELS[filters.view]
};

/** Quand rien ne correspond : propose de retirer le filtre qui bloque, avec le nombre de résultats que cela donnerait. */
function suggestions() {
  return Object.keys(FILTER_NAMES).filter((key) => filters[key])
    .map((key) => ({ key, count: getFiltered({ ...filters, [key]: DEFAULT_FILTERS[key] }).list.length }))
    .filter((s) => s.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
}

function render() {
  let { list, parsed } = getFiltered();
  const bad = invalidFields(parsed);
  let note = "";
  if (bad.length) note = `Valeur inconnue pour ${bad.map((f) => `« ${f.operator}:${f.raw} »`).join(", ")}. Voir « Syntaxe de recherche » pour les valeurs possibles.`;
  else if (!list.length && parsed.terms.length) {
    const approx = getFiltered(filters, { fuzzy: true }).list;
    if (approx.length) { list = approx; note = `Aucun résultat exact pour « ${filters.q} » : voici des résultats approchants.`; }
  }
  const noteBox = $("#searchNote");
  noteBox.textContent = note;
  noteBox.hidden = !note;

  $("#resultsCount").textContent = `${plural(list.length, "ressource")} trouvée${list.length > 1 ? "s" : ""}`;
  $("#resourceGrid").innerHTML = list.slice(0, visible).map((r) => resourceCard(catalog, r, { heading: "h2" })).join("");
  $("#emptyState").hidden = list.length !== 0;
  $("#emptyText").textContent = EMPTY_TEXT[filters.view] || "Essaie un autre terme ou assouplis les filtres.";
  const help = list.length === 0 ? suggestions() : [];
  $("#emptySuggestions").innerHTML = help.map((s) => `<li><button type="button" class="link-btn" data-clear="${s.key}">Retirer ${escapeHTML(FILTER_NAMES[s.key]() || "ce filtre")} → ${plural(s.count, "résultat")}</button></li>`).join("");
  $("#loadMore").hidden = visible >= list.length || list.length === 0;
  $("#emptyPropose").href = `contribuer${filters.q ? `?title=${encodeURIComponent(filters.q)}` : ""}#formulaire`;
  $("#resetFilters").hidden = sameFilters(filters, DEFAULT_FILTERS);
  renderChips();
  const domainInfo = filters.domain ? getDomain(catalog, filters.domain) : null;
  const guide = $("#domainGuide");
  guide.hidden = !domainInfo?.path;
  if (domainInfo?.path) { guide.href = docURL(domainInfo.path); $("#domainGuideLabel").textContent = `Guide ${domainInfo.title}`; }
  $("#domainNotice").hidden = !SENSITIVE_DOMAINS.includes(filters.domain);
  const domain = domainInfo?.title;
  document.title = domain ? `${domain} · ${BASE_TITLE}` : BASE_TITLE;
}

/* ---------- URL ---------- */
function commit({ push = true } = {}) {
  const url = `${location.pathname}${serializeFilters(filters)}`;
  if (url !== `${location.pathname}${location.search}`) history[push ? "pushState" : "replaceState"](null, "", url);
  window.dispatchEvent(new Event("hc:urlchange"));
  render();
}

function update(patch, { push = true } = {}) {
  filters = normalize({ ...filters, ...patch });
  visible = PAGE_SIZE;
  syncControls();
  commit({ push });
}

/* ---------- init ---------- */
async function init() {
  try {
    catalog = await loadCatalog();
  } catch (error) {
    console.error(error);
    $("#resultsCount").textContent = "Catalogue indisponible";
    showLoadError($("#resourceGrid"));
    return;
  }
  const list = activeResources(catalog);
  index = new Map(list.map((r) => [r.id, indexResource(r, getDomain(catalog, r.domain)?.title)]));
  allowed = {
    domains: catalog.domains.map((d) => d.id),
    categories: [...new Set(list.map((r) => r.category).filter(Boolean))],
    types: [...new Set(list.map((r) => r.type))],
    levels: Object.keys(LEVEL_LABELS),
    statuses: Object.keys(STATUS_LABELS),
    languages: Object.keys(LANG_LABELS),
    accesses: Object.keys(ACCESS_LABELS),
    tags: [...new Set(list.flatMap((r) => (r.tags || []).map((t) => t.toLowerCase())))]
  };
  populateStatic();
  filters = readURL();
  syncControls();

  searchInputs().forEach((input) => input.addEventListener("input", (e) => update({ q: e.target.value.slice(0, 100) }, { push: false })));
  [["#domainFilter", "domain"], ["#categoryFilter", "category"], ["#typeFilter", "type"], ["#levelFilter", "level"], ["#statusFilter", "status"],
    ["#languageFilter", "lang"], ["#accessFilter", "access"], ["#sortFilter", "sort"]]
    .forEach(([selector, key]) => $(selector).addEventListener("change", (e) => update({ [key]: e.target.value, ...(key === "domain" ? { category: "" } : {}) })));
  const reset = () => { filters = { ...DEFAULT_FILTERS }; visible = PAGE_SIZE; syncControls(); commit(); };
  $("#resetFilters").addEventListener("click", reset);
  $("#emptyReset").addEventListener("click", reset);
  $("#loadMore").addEventListener("click", () => { visible += PAGE_SIZE; render(); });
  const clear = (e) => {
    const chip = e.target.closest("[data-clear]");
    if (chip) update({ [chip.dataset.clear]: DEFAULT_FILTERS[chip.dataset.clear] });
  };
  $("#activeFilters").addEventListener("click", clear);
  $("#emptySuggestions").addEventListener("click", clear);
  $("#tagChips").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-tag]");
    if (chip) update({ tag: filters.tag === chip.dataset.tag ? "" : chip.dataset.tag });
  });
  $("#syntaxList").addEventListener("click", (e) => {
    const example = e.target.closest("[data-example]");
    if (!example) return;
    update({ q: example.dataset.example }, { push: true });
    $("#searchInput").focus();
  });
  bindCards($("#resourceGrid"), () => { if (filters.view === "favorites") render(); });
  window.addEventListener("popstate", () => { filters = readURL(); visible = PAGE_SIZE; syncControls(); window.dispatchEvent(new Event("hc:urlchange")); render(); });

  render();

  const params = new URLSearchParams(location.search);
  if (params.get("focus")) { // arrivée depuis Ctrl+K sur une autre page
    history.replaceState(null, "", `${location.pathname}${serializeFilters(filters)}`);
    $("#searchInput").focus();
  }
}

init();
