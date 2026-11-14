// Page d'accueil.
import "./shell.js";
import {
  $, $$, escapeHTML, plural, pad, icon, DOMAIN_ICONS, GITHUB_URL, loadCatalog, activeResources, domainCount,
  domainsByCount, newResourcesCount, catalogueURL, showLoadError
} from "./data.js";
import { resourceCard, bindCards } from "./cards.js";

const COLLECTIONS = [
  { title: "OSINT 360°", domain: "osint", description: "Le kit complet pour collecter, analyser et exploiter les informations en sources ouvertes." },
  { title: "Red Team Toolkit", domain: "red-team", description: "Reconnaissance, pentest et simulation d'adversaire : le matériel pour les évaluations autorisées." },
  { title: "Blue Team Playbook", domain: "blue-team", description: "SOC, SIEM, détection et réponse aux incidents : de quoi défendre et investiguer." }
];
let collection = 0;

function renderStats(c) {
  const list = activeResources(c);
  const values = {
    resources: list.length,
    osintCategories: new Set(list.filter((r) => r.domain === "osint").map((r) => r.category).filter(Boolean)).size,
    domains: c.domains.length,
    types: new Set(list.map((r) => r.type)).size,
    featured: list.filter((r) => r.featured).length,
    pending: list.filter((r) => r.status === "needs-review").length
  };
  $$("[data-stat]").forEach((n) => { n.textContent = values[n.dataset.stat] ?? "—"; });
}

function renderActivity(c) {
  const list = activeResources(c);
  const news = newResourcesCount(c);
  const verified = list.filter((r) => r.status === "verified").length;
  const row = (href, ico, label, badge = "", external = false) =>
    `<li><a href="${escapeHTML(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${icon(ico, "a-ico")}<span class="a-label">${label}</span>${badge ? `<span class="a-badge">${badge}</span>` : ""}${icon(external ? "external" : "chev-right", "a-chev")}</a></li>`;
  $("#activityList").innerHTML = [
    row(catalogueURL({ sort: "newest" }), "bolt", "Nouvelles ressources", news ? `+${news}` : ""),
    ...(verified ? [row(catalogueURL({ status: "verified" }), "refresh", "Ressources vérifiées", String(verified))] : []),
    row(catalogueURL({ view: "featured" }), "flame", "Sélection HashCode"),
    row(`${GITHUB_URL}/issues/new/choose`, "calendar", "Proposer une ressource", "", true)
  ].join("");
}

function renderRail(c) {
  $("#domainRail").innerHTML = domainsByCount(c).map((d, i) => `
    <a class="tile${i === 0 ? " is-lead" : ""}" href="${escapeHTML(catalogueURL({ domain: d.id }))}">
      <span class="tile-top">${icon(DOMAIN_ICONS[d.id] || "cube")}${i === 0 ? `<span class="arrow">${icon("arrow")}</span>` : ""}</span>
      <span><b>${escapeHTML(d.title)}</b><small>${plural(domainCount(c, d.id), "ressource")}</small></span>
    </a>`).join("");
}

function renderDomainCards(c) {
  $("#domainCards").innerHTML = c.domains.map((d) => `
    <a class="dcard" href="${escapeHTML(catalogueURL({ domain: d.id }))}">
      ${icon(DOMAIN_ICONS[d.id] || "cube")}<span class="num">${escapeHTML(d.number)} / ${pad(c.domains.length)}</span>
      <b>${escapeHTML(d.title)}</b><p>${escapeHTML(d.description)}</p><small>${plural(domainCount(c, d.id), "ressource")}</small>
    </a>`).join("");
}

function renderCollection() {
  const item = COLLECTIONS[collection];
  $("#collTitle").textContent = item.title;
  $("#collDesc").textContent = item.description;
  $("#collCta").href = catalogueURL({ domain: item.domain });
  $("#collDots").innerHTML = COLLECTIONS.map((x, i) => `<button type="button" role="tab" data-dot="${i}" aria-selected="${i === collection}" aria-label="${escapeHTML(x.title)}"></button>`).join("");
}

function scrollRail(id) {
  const rail = document.getElementById(id);
  const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
  rail.scrollTo({ left: atEnd ? 0 : rail.scrollLeft + rail.clientWidth * 0.8, behavior: "smooth" });
}

document.addEventListener("click", (event) => {
  const dot = event.target.closest("[data-dot]");
  if (dot) { collection = Number(dot.dataset.dot); renderCollection(); return; }
  const rail = event.target.closest("[data-rail]");
  if (rail) scrollRail(rail.dataset.rail);
});

renderCollection();
try {
  const catalog = await loadCatalog();
  renderStats(catalog);
  renderActivity(catalog);
  renderRail(catalog);
  renderDomainCards(catalog);
  const featured = activeResources(catalog).filter((r) => r.featured)
    .sort((a, b) => a.title.localeCompare(b.title, "fr")).slice(0, 6);
  $("#featuredGrid").innerHTML = featured.map((r) => resourceCard(catalog, r)).join("");
  bindCards($("#featuredGrid"));
} catch (error) {
  console.error(error);
  $$("[data-stat]").forEach((n) => { n.textContent = "—"; });
  showLoadError($("#featuredGrid"));
}
