// Page Domaines : les 12 disciplines, leurs catégories et leurs effectifs.
import "./shell.js";
import { $, escapeHTML, plural, pad, icon, DOMAIN_ICONS, loadCatalog, domainCount, categoriesOf, catalogueURL, showLoadError } from "./data.js";

try {
  const catalog = await loadCatalog();
  $("#domainPages").innerHTML = catalog.domains.map((d) => {
    const categories = categoriesOf(catalog, d.id);
    const shown = categories.slice(0, 6);
    const more = categories.length - shown.length;
    return `<article class="domain-page-card">
      <a class="domain-page-main" href="${escapeHTML(catalogueURL({ domain: d.id }))}" aria-label="${escapeHTML(d.title)} : ${plural(domainCount(catalog, d.id), "ressource")}">
        <span class="domain-page-top">${icon(DOMAIN_ICONS[d.id] || "cube", "ico-lg")}<span class="num">${escapeHTML(d.number)} / ${pad(catalog.domains.length)}</span></span>
        <h2>${escapeHTML(d.title)}</h2>
        <p>${escapeHTML(d.description)}</p>
        <span class="domain-page-count">${plural(domainCount(catalog, d.id), "ressource")} ${icon("arrow")}</span>
      </a>
      ${shown.length ? `<ul class="cat-chips" aria-label="Catégories de ${escapeHTML(d.title)}">${shown.map(([name, n]) =>
        `<li><a class="chip" href="${escapeHTML(catalogueURL({ domain: d.id, category: name }))}">${escapeHTML(name)} <small>${n}</small></a></li>`).join("")}${more > 0 ? `<li><a class="chip chip-more" href="${escapeHTML(catalogueURL({ domain: d.id }))}">+${more}</a></li>` : ""}</ul>` : ""}
    </article>`;
  }).join("");
} catch (error) {
  console.error(error);
  showLoadError($("#domainPages"), "Impossible de charger les domaines.");
}
