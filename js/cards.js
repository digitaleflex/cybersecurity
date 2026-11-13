import {
  TYPE_LABELS, STATUS_LABELS, LEVEL_LABELS, escapeHTML, safeExternalURL, icon,
  favorites, toggleFavorite, pushRecent, getDomain
} from "./data.js";

export function resourceCard(catalog, resource) {
  const domain = getDomain(catalog, resource.domain);
  const url = safeExternalURL(resource.url);
  const type = TYPE_LABELS[resource.type] || resource.type;
  const level = LEVEL_LABELS[resource.level] || resource.level;
  const status = STATUS_LABELS[resource.status] || "Statut inconnu";
  const access = { free: "Gratuit", paid: "Payant", freemium: "Freemium" }[resource.access] || resource.access;
  const languages = (resource.language || []).slice(0, 2).map((l) => l.toUpperCase()).join(" · ");
  const tags = (resource.tags || []).slice(0, 3);
  const fav = favorites().includes(resource.id);

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

/** Délégation d'événements : favoris et historique. onFavorite() est appelé après un changement de favori. */
export function bindCards(container, onFavorite = () => {}) {
  container.addEventListener("click", (event) => {
    const fav = event.target.closest("[data-fav]");
    if (fav) { toggleFavorite(fav.dataset.fav); onFavorite(); return; }
    const open = event.target.closest("[data-open]");
    if (open) pushRecent(open.dataset.open);
  });
}
