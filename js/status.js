// Page « État du catalogue » : chiffres clés, progression de la vérification, répartitions et santé des liens.
import "./shell.js";
import { $, $$, escapeHTML, plural, icon, catalogueURL, loadCatalog, showLoadError, GITHUB_URL, DATA_URL } from "./data.js";
import { computeStats, percent, HEALTH_LABELS } from "./stats.js";

const HEALTH_URL = new URL("../data/health.json", DATA_URL).href;

const formatDate = (iso) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

/** Charge data/health.json ; son absence ou son invalidité n'empêchent pas la page de s'afficher. */
async function loadHealth() {
  try {
    const response = await fetch(HEALTH_URL, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;
    const data = await response.json();
    return data && data.version === 1 && data.results ? data : null;
  } catch {
    return null;
  }
}

/** Tableau de barres accessible : chaque ligne a son libellé, sa valeur en chiffres et sa part. */
function barTable({ id, title, rows, filterKey, note = "", extra = null }) {
  const body = rows
    .map((row) => {
      const label = filterKey
        ? `<a href="${escapeHTML(catalogueURL({ [filterKey]: row.key }))}">${escapeHTML(row.label)}</a>`
        : escapeHTML(row.label);
      const bar = `<span class="bar" aria-hidden="true"><i data-w="${(row.share * 100).toFixed(1)}"></i></span>`;
      return `<tr><th scope="row">${label}</th><td class="num">${row.count}</td><td class="num">${percent(row.share)}</td><td class="bar-cell">${bar}</td>${extra ? `<td class="num">${extra(row)}</td>` : ""}</tr>`;
    })
    .join("");
  return `<section class="card status-card" aria-labelledby="${id}"><h2 id="${id}">${escapeHTML(title)}</h2>
    <table class="bars"><caption class="sr-only">${escapeHTML(title)} : nombre de ressources et part du catalogue</caption>
    <thead><tr><th scope="col">Valeur</th><th scope="col" class="num">Ressources</th><th scope="col" class="num">Part</th><th scope="col"><span class="sr-only">Barre</span></th>${extra ? `<th scope="col" class="num">En français</th>` : ""}</tr></thead>
    <tbody>${body}</tbody></table>${note ? `<p class="hint">${note}</p>` : ""}</section>`;
}

function renderKpis(stats) {
  const healthOk = stats.health ? `${stats.health.counts.ok} / ${stats.health.checkedCount}` : "—";
  const kpi = (iconName, value, label, hint = "") =>
    `<div class="kpi">${icon(iconName)}<div><strong>${value}</strong><span>${label}</span>${hint ? `<small>${hint}</small>` : ""}</div></div>`;
  $("#kpis").innerHTML = [
    kpi("layers", stats.total, "ressources actives", stats.archived ? `${plural(stats.archived, "archivée")}` : ""),
    kpi("shield-check", `${stats.verified} / ${stats.total}`, "ressources vérifiées", `${percent(stats.verifiedShare)} du catalogue`),
    kpi("users", `${stats.french}`, "ressources en français", `${percent(stats.frenchShare)} du catalogue`),
    kpi(
      "refresh",
      healthOk,
      "liens qui répondent",
      stats.health ? `contrôle du ${formatDate(stats.health.checked)}` : "pas encore de contrôle publié"
    )
  ].join("");
}

function renderVerification(stats) {
  const pct = percent(stats.verifiedShare);
  $("#verifBody").innerHTML = `
    <p class="lead-line"><strong>${stats.verified}</strong> ressource${stats.verified > 1 ? "s" : ""} vérifiée${stats.verified > 1 ? "s" : ""} sur <strong>${stats.total}</strong> (${pct}).
      ${stats.needsReview ? `<strong>${stats.needsReview}</strong> attendent le contrôle d'un mainteneur.` : "Toutes les ressources actives sont vérifiées."}</p>
    <progress class="verif-progress" max="${stats.total}" value="${stats.verified}" aria-label="Ressources vérifiées : ${stats.verified} sur ${stats.total}">${pct}</progress>
    <table class="bars bars-compact"><caption class="sr-only">Vérification par domaine</caption>
      <thead><tr><th scope="col">Domaine</th><th scope="col" class="num">Vérifiées</th><th scope="col" class="num">Total</th></tr></thead>
      <tbody>${stats.byDomain.map((d) => `<tr><th scope="row"><a href="${escapeHTML(catalogueURL({ domain: d.key }))}">${escapeHTML(d.label)}</a></th><td class="num">${d.verified}</td><td class="num">${d.count}</td></tr>`).join("")}</tbody></table>
    <p class="cta-line"><a class="btn btn-ghost btn-sm" href="${GITHUB_URL}/issues/6" target="_blank" rel="noopener noreferrer">Aider à vérifier ${icon("external")}</a>
      <a class="btn btn-ghost btn-sm" href="${escapeHTML(catalogueURL({ status: "needs-review" }))}">Voir les ressources à vérifier ${icon("arrow")}</a></p>`;
}

function renderCharts(stats) {
  const frenchNote = `La part en français est de <strong>${percent(stats.frenchShare)}</strong> : <a href="${GITHUB_URL}/issues/27" target="_blank" rel="noopener noreferrer">aide-nous à l'augmenter</a>.`;
  $("#charts").innerHTML = [
    barTable({
      id: "byDomain",
      title: "Par domaine",
      rows: stats.byDomain,
      filterKey: "domain",
      extra: (r) => `${r.french} (${percent(r.frenchShare)})`
    }),
    barTable({ id: "byLang", title: "Par langue", rows: stats.byLanguage, filterKey: "lang", note: frenchNote }),
    barTable({ id: "byType", title: "Par type", rows: stats.byType, filterKey: "type" }),
    barTable({ id: "byLevel", title: "Par niveau", rows: stats.byLevel, filterKey: "level" }),
    barTable({ id: "byAccess", title: "Par accès", rows: stats.byAccess, filterKey: "access" })
  ].join("");
}

function renderHealth(stats) {
  const h = stats.health;
  $("#healthCard").hidden = !h;
  if (!h) return;
  const tiles = Object.entries(HEALTH_LABELS)
    .map(([key, label]) => `<li class="health health-${key}"><strong>${h.counts[key] ?? 0}</strong><span>${escapeHTML(label)}</span></li>`)
    .join("");
  const rows = h.problems
    .map((p) => {
      const report = `${GITHUB_URL}/issues/new?${new URLSearchParams({ template: "broken-link.yml", resource: p.title, old_url: p.url, ...(p.finalUrl ? { new_url: p.finalUrl } : {}) })}`;
      return `<tr><th scope="row"><a href="${escapeHTML(catalogueURL({ q: p.title }))}">${escapeHTML(p.title)}</a></th>
        <td>${escapeHTML(HEALTH_LABELS[p.health])}</td><td>${escapeHTML(p.detail)}</td>
        <td><a href="${escapeHTML(report)}" target="_blank" rel="noopener noreferrer">Signaler</a></td></tr>`;
    })
    .join("");
  $("#healthBody").innerHTML = `
    <p class="muted">Dernier contrôle : <strong>${escapeHTML(formatDate(h.checked))}</strong> — ${h.counts.ok} sur ${h.checkedCount} liens répondent normalement.</p>
    <ul class="health-grid" aria-label="Répartition des états de liens">${tiles}</ul>
    ${
      h.problems.length
        ? `<div class="table-scroll" tabindex="0" role="region" aria-label="Liens à examiner"><table class="data-table"><caption class="sr-only">Liens à examiner, du plus grave au moins grave</caption>
      <thead><tr><th scope="col">Ressource</th><th scope="col">État</th><th scope="col">Détail</th><th scope="col">Action</th></tr></thead><tbody>${rows}</tbody></table></div>`
        : "<p>Aucun lien à examiner.</p>"
    }`;
}

function applyBars() {
  $$("[data-w]").forEach((el) => {
    el.style.width = `${el.dataset.w}%`; // via CSSOM : autorisé par la CSP (contrairement à l'attribut style en ligne)
  });
}

try {
  const [catalog, health] = await Promise.all([loadCatalog(), loadHealth()]);
  const stats = computeStats(catalog, health);
  $("#statusDates").textContent = stats.updated ? `Catalogue mis à jour le ${formatDate(stats.updated)}.` : "";
  renderKpis(stats);
  renderVerification(stats);
  renderCharts(stats);
  renderHealth(stats);
  applyBars();
  $("#verification").hidden = false;
  $("#aboutCard").hidden = false;
} catch (error) {
  console.error(error);
  showLoadError($("#charts"), "Impossible de calculer les statistiques.");
}
