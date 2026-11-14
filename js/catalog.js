// Page Catalogue : filtres synchronisés avec l'URL (?domain=osint&q=shodan&sort=newest…).
import "./shell.js";
import {
  $, $$, escapeHTML, plural, icon, TYPE_LABELS, STATUS_LABELS, LEVEL_LABELS, SORT_LABELS, VIEW_LABELS,
  loadCatalog, activeResources, getDomain, categoriesOf, normalizeText, favorites, recents, showLoadError
} from "./data.js";
import { resourceCard, bindCards } from "./cards.js";
import { docURL } from "./docs-index.js";
import { parseFilters, serializeFilters, sameFilters, DEFAULT_FILTERS } from "./url-state.js";

const PAGE_SIZE = 9;
const SENSITIVE_DOMAINS = ["red-team", "malware-analysis", "reverse-engineering", "ctf-labs"];
const BASE_TITLE = "Catalogue — HashCode Cyber Library";
const EMPTY_TEXT = {
  favorites: "Aucun favori pour l'instant. Utilise l'étoile d'une carte pour en ajouter.",
  recent: "Aucune ressource consultée pour l'instant. Ouvre une ressource pour la retrouver ici."
};

let catalog;
let allowed;
let filters = { ...DEFAULT_FILTERS };
let visible = PAGE_SIZE;

const searchInputs = () => $$("[data-search]");

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

function populateStatic() {
  fillSelect($("#domainFilter"), catalog.domains.map((d) => [d.id, d.title]), "Tous les domaines");
  fillSelect($("#typeFilter"), [...new Set(activeResources(catalog).map((r) => r.type))].sort().map((t) => [t, TYPE_LABELS[t] || t]), "Tous les formats");
  fillSelect($("#levelFilter"), Object.entries(LEVEL_LABELS), "Tous les niveaux");
  fillSelect($("#statusFilter"), Object.entries(STATUS_LABELS), "Tous les statuts");
  fillSelect($("#sortFilter"), Object.entries(SORT_LABELS));
}

function syncControls() {
  fillSelect($("#categoryFilter"), categoriesOf(catalog, filters.domain).map(([name, n]) => [name, `${name} (${n})`]), "Toutes les catégories");
  $("#domainFilter").value = filters.domain;
  $("#categoryFilter").value = filters.category;
  $("#typeFilter").value = filters.type;
  $("#levelFilter").value = filters.level;
  $("#statusFilter").value = filters.status;
  $("#sortFilter").value = filters.sort;
  searchInputs().forEach((input) => { if (input.value !== filters.q) input.value = filters.q; });
}

function renderChips() {
  const labels = {
    q: filters.q && `« ${filters.q} »`,
    domain: filters.domain && getDomain(catalog, filters.domain)?.title,
    category: filters.category,
    type: filters.type && (TYPE_LABELS[filters.type] || filters.type),
    level: filters.level && LEVEL_LABELS[filters.level],
    status: filters.status && STATUS_LABELS[filters.status],
    view: filters.view && VIEW_LABELS[filters.view]
  };
  const chips = Object.entries(labels).filter(([, label]) => label)
    .map(([key, label]) => `<button type="button" class="filter-chip" data-clear="${key}" aria-label="Retirer le filtre : ${escapeHTML(label)}">${escapeHTML(label)} ${icon("x")}</button>`);
  const box = $("#activeFilters");
  box.innerHTML = chips.join("");
  box.hidden = chips.length === 0;
}

/* ---------- résultats ---------- */
function getFiltered() {
  const query = normalizeText(filters.q.trim());
  const favs = favorites();
  const recent = recents();
  const list = activeResources(catalog).filter((r) => {
    if (filters.view === "favorites" && !favs.includes(r.id)) return false;
    if (filters.view === "recent" && !recent.includes(r.id)) return false;
    if (filters.view === "featured" && !r.featured) return false;
    if (filters.domain && r.domain !== filters.domain) return false;
    if (filters.category && r.category !== filters.category) return false;
    if (filters.type && r.type !== filters.type) return false;
    if (filters.level && r.level !== filters.level) return false;
    if (filters.status && r.status !== filters.status) return false;
    if (!query) return true;
    const domain = getDomain(catalog, r.domain);
    const text = [r.title, r.description, r.category, r.source, r.domain, domain?.title, r.access, ...(r.tags || []), ...(r.language || [])].join(" ");
    return normalizeText(text).includes(query);
  });
  list.sort((a, b) => {
    if (filters.view === "recent") return recent.indexOf(a.id) - recent.indexOf(b.id);
    if (filters.sort === "az") return a.title.localeCompare(b.title, "fr");
    if (filters.sort === "za") return b.title.localeCompare(a.title, "fr");
    if (filters.sort === "newest") return String(b.added || b.verified || "").localeCompare(String(a.added || a.verified || "")) || a.title.localeCompare(b.title, "fr");
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.title.localeCompare(b.title, "fr");
  });
  return list;
}

function render() {
  const list = getFiltered();
  $("#resultsCount").textContent = `${plural(list.length, "ressource")} trouvée${list.length > 1 ? "s" : ""}`;
  $("#resourceGrid").innerHTML = list.slice(0, visible).map((r) => resourceCard(catalog, r, { heading: "h2" })).join("");
  $("#emptyState").hidden = list.length !== 0;
  $("#emptyText").textContent = EMPTY_TEXT[filters.view] || "Essaie un autre terme ou modifie les filtres.";
  $("#loadMore").hidden = visible >= list.length || list.length === 0;
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
  allowed = {
    domains: catalog.domains.map((d) => d.id),
    categories: [...new Set(list.map((r) => r.category).filter(Boolean))],
    types: [...new Set(list.map((r) => r.type))],
    levels: Object.keys(LEVEL_LABELS),
    statuses: Object.keys(STATUS_LABELS)
  };
  populateStatic();
  filters = readURL();
  syncControls();

  searchInputs().forEach((input) => input.addEventListener("input", (e) => update({ q: e.target.value.slice(0, 100) }, { push: false })));
  [["#domainFilter", "domain"], ["#categoryFilter", "category"], ["#typeFilter", "type"], ["#levelFilter", "level"], ["#statusFilter", "status"], ["#sortFilter", "sort"]]
    .forEach(([selector, key]) => $(selector).addEventListener("change", (e) => update({ [key]: e.target.value, ...(key === "domain" ? { category: "" } : {}) })));
  const reset = () => { filters = { ...DEFAULT_FILTERS }; visible = PAGE_SIZE; syncControls(); commit(); };
  $("#resetFilters").addEventListener("click", reset);
  $("#emptyReset").addEventListener("click", reset);
  $("#loadMore").addEventListener("click", () => { visible += PAGE_SIZE; render(); });
  $("#activeFilters").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-clear]");
    if (chip) update({ [chip.dataset.clear]: DEFAULT_FILTERS[chip.dataset.clear] });
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
