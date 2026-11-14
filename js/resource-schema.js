// Règles du modèle de données : source de vérité unique, utilisée par le validateur du catalogue (Node),
// les tests et le formulaire de contribution du site (navigateur).
export const TYPES = [
  "tool",
  "course",
  "lab",
  "documentation",
  "repository",
  "framework",
  "platform",
  "community",
  "report",
  "library",
  "directory",
  "database"
];
export const LEVELS = ["beginner", "intermediate", "advanced", "professional"];
export const STATUSES = ["verified", "needs-review", "archived", "removed"];
export const ACCESS = ["free", "freemium", "paid"];
export const LANGUAGES = ["fr", "en", "multi"];
export const REQUIRED_FIELDS = [
  "id",
  "title",
  "description",
  "url",
  "domain",
  "category",
  "type",
  "level",
  "access",
  "language",
  "tags",
  "source",
  "status",
  "featured"
];
export const DESCRIPTION_RANGE = [40, 220];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Retourne la liste des erreurs d'une fiche (tableau vide = valide). */
export function validateResource(resource, { domainIds = [] } = {}) {
  const label = resource.id || "fiche";
  const errors = [];
  for (const key of REQUIRED_FIELDS) {
    if (resource[key] === undefined || resource[key] === null || resource[key] === "") errors.push(`${label}: missing ${key}`);
  }
  if (!Object.hasOwn(resource, "verified")) errors.push(`${label}: missing verified field`);
  if (resource.id && !ID.test(resource.id)) errors.push(`${label}: id must be lowercase letters, digits and hyphens`);
  try {
    if (!["http:", "https:"].includes(new URL(resource.url).protocol)) errors.push(`${label}: unsupported URL protocol`);
  } catch {
    errors.push(`${label}: invalid URL`);
  }
  if (resource.domain && domainIds.length && !domainIds.includes(resource.domain))
    errors.push(`${label}: unknown domain ${resource.domain}`);
  if (resource.type && !TYPES.includes(resource.type)) errors.push(`${label}: unsupported type ${resource.type}`);
  if (resource.level && !LEVELS.includes(resource.level)) errors.push(`${label}: unsupported level ${resource.level}`);
  if (resource.status && !STATUSES.includes(resource.status)) errors.push(`${label}: unsupported status ${resource.status}`);
  if (resource.access && !ACCESS.includes(resource.access)) errors.push(`${label}: unsupported access ${resource.access}`);
  if (resource.status === "verified" && !DATE.test(resource.verified ?? ""))
    errors.push(`${label}: verified resources need a YYYY-MM-DD verification date`);
  if (resource.status === "needs-review" && resource.verified !== null)
    errors.push(`${label}: needs-review resources must have verified=null`);
  if (resource.added && !DATE.test(resource.added)) errors.push(`${label}: added must use YYYY-MM-DD`);
  if (!Array.isArray(resource.language) || !Array.isArray(resource.tags)) errors.push(`${label}: language and tags must be arrays`);
  else {
    for (const language of resource.language) if (!LANGUAGES.includes(language)) errors.push(`${label}: unsupported language ${language}`);
    if (resource.tags.some((tag) => typeof tag !== "string" || !tag.trim())) errors.push(`${label}: tags must be non-empty strings`);
  }
  return errors;
}

/** Valide tout le catalogue, doublons d'identifiants et d'URL compris. */
export function validateCatalog(data) {
  const domainIds = (data.domains ?? []).map((domain) => domain.id);
  const errors = [];
  const ids = new Set();
  const urls = new Set();
  for (const [index, resource] of (data.resources ?? []).entries()) {
    const label = resource.id || `entry #${index + 1}`;
    errors.push(...validateResource(resource, { domainIds }));
    if (ids.has(resource.id)) errors.push(`${label}: duplicate id`);
    ids.add(resource.id);
    if (urls.has(resource.url)) errors.push(`${label}: duplicate URL`);
    urls.add(resource.url);
  }
  return errors;
}
