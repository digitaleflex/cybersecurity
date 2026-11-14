// État des filtres du catalogue <-> paramètres d'URL (fonctions pures, testées dans tests/url-state.test.mjs).
export const SORTS = ["featured", "az", "za", "newest"];
export const VIEWS = ["favorites", "recent", "featured"];
export const DEFAULT_FILTERS = Object.freeze({ q: "", domain: "", category: "", type: "", level: "", status: "", sort: "featured", view: "" });
export const MAX_QUERY_LENGTH = 100;

/**
 * Lit les filtres depuis une chaîne de requête. Toute valeur inconnue est ignorée.
 * allowed : { domains, categories, types, levels, statuses } (tableaux ou Set)
 */
export function parseFilters(search, allowed = {}) {
  const params = new URLSearchParams(search);
  const has = (list, value) => !list || [...list].includes(value);
  const pick = (key, list) => {
    const value = params.get(key) || "";
    return value && has(list, value) ? value : "";
  };
  const sort = params.get("sort") || "";
  const view = params.get("view") || "";
  return {
    q: (params.get("q") || "").trim().slice(0, MAX_QUERY_LENGTH),
    domain: pick("domain", allowed.domains),
    category: pick("category", allowed.categories),
    type: pick("type", allowed.types),
    level: pick("level", allowed.levels),
    status: pick("status", allowed.statuses),
    sort: SORTS.includes(sort) ? sort : DEFAULT_FILTERS.sort,
    view: VIEWS.includes(view) ? view : ""
  };
}

/** Sérialise les filtres : les valeurs par défaut sont omises. Retourne "" ou "?clé=valeur&…". */
export function serializeFilters(filters) {
  const params = new URLSearchParams();
  for (const key of Object.keys(DEFAULT_FILTERS)) {
    const value = filters[key] ?? DEFAULT_FILTERS[key];
    if (value && value !== DEFAULT_FILTERS[key]) params.set(key, value);
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

export const sameFilters = (a, b) => serializeFilters(a) === serializeFilters(b);
