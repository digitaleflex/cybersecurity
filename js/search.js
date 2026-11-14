// Moteur de recherche du catalogue (fonctions pures, testées dans tests/search.test.mjs).
// Syntaxe : mots (ET) · "phrase exacte" · -exclu · champ:valeur (lang, tag, domaine, type, niveau, acces, statut), avec « - » devant pour exclure.
export const FIELD_ALIASES = {
  lang: "language",
  langue: "language",
  tag: "tag",
  tags: "tag",
  motcle: "tag",
  domain: "domain",
  domaine: "domain",
  type: "type",
  format: "type",
  level: "level",
  niveau: "level",
  access: "access",
  acces: "access",
  status: "status",
  statut: "status"
};

const LEVELS = {
  debutant: "beginner",
  beginner: "beginner",
  intermediaire: "intermediate",
  intermediate: "intermediate",
  avance: "advanced",
  advanced: "advanced",
  pro: "professional",
  professionnel: "professional",
  professional: "professional"
};
const ACCESS = { gratuit: "free", free: "free", freemium: "freemium", payant: "paid", paid: "paid" };
const LANGS = { fr: "fr", francais: "fr", french: "fr", en: "en", anglais: "en", english: "en", multi: "multi", multilingue: "multi" };
const STATUSES = {
  verifie: "verified",
  verified: "verified",
  averifier: "needs-review",
  "needs-review": "needs-review",
  needsreview: "needs-review"
};
const TYPES = {
  outil: "tool",
  tool: "tool",
  formation: "course",
  cours: "course",
  course: "course",
  labo: "lab",
  laboratoire: "lab",
  lab: "lab",
  documentation: "documentation",
  doc: "documentation",
  depot: "repository",
  repo: "repository",
  repository: "repository",
  framework: "framework",
  plateforme: "platform",
  platform: "platform",
  communaute: "community",
  community: "community",
  rapport: "report",
  report: "report",
  bibliotheque: "library",
  library: "library",
  annuaire: "directory",
  directory: "directory",
  base: "database",
  database: "database"
};

export const norm = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const compact = (value) => norm(value).replace(/[^a-z0-9]+/g, "");
const slug = (value) =>
  norm(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Valeur d'un opérateur -> valeur canonique du catalogue, ou null si elle n'existe pas. */
export function canonicalValue(field, raw, { domains = [] } = {}) {
  const key = compact(raw);
  if (!key) return null;
  switch (field) {
    case "language":
      return LANGS[key] ?? null;
    case "level":
      return LEVELS[key] ?? null;
    case "access":
      return ACCESS[key] ?? null;
    case "status":
      return STATUSES[key] ?? null;
    case "type":
      return TYPES[key] ?? null;
    case "domain":
      return domains.find((d) => compact(d.id) === key || compact(d.title) === key)?.id ?? null;
    case "tag":
      return slug(raw) || null;
    default:
      return null;
  }
}

/** Analyse la saisie. Un « mot:valeur » dont le mot n'est pas un opérateur reste un simple terme (ex. une URL). */
export function parseQuery(query, ctx = {}) {
  const result = { terms: [], phrases: [], excluded: [], fields: [] };
  const re = /(-?)(?:([A-Za-zÀ-ÿ]+):)?(?:"([^"]*)"|(\S+))/g;
  for (const match of String(query ?? "").matchAll(re)) {
    const negated = match[1] === "-";
    const operator = match[2] ? FIELD_ALIASES[compact(match[2])] : undefined;
    const value = match[3] ?? match[4] ?? "";
    if (match[2] && operator) {
      const canonical = canonicalValue(operator, value, ctx);
      result.fields.push({ field: operator, operator: match[2], raw: value, value: canonical, negated, valid: canonical !== null });
    } else {
      const text = match[2] ? `${match[2]}:${value}` : value;
      const quoted = match[3] !== undefined && !match[2];
      const clean = norm(text).trim();
      if (!clean) continue;
      if (negated) result.excluded.push(clean);
      else if (quoted) result.phrases.push(clean);
      else result.terms.push(clean);
    }
  }
  return result;
}

export const hasQuery = (parsed) => Boolean(parsed.terms.length || parsed.phrases.length || parsed.excluded.length || parsed.fields.length);
export const invalidFields = (parsed) => parsed.fields.filter((f) => !f.valid);

/** Préparation d'une ressource pour la recherche (calculée une seule fois). */
export function indexResource(resource, domainTitle = "") {
  const tags = (resource.tags || []).map(slug);
  const title = norm(resource.title);
  const category = norm(resource.category);
  const haystack = norm(
    [
      resource.title,
      resource.description,
      resource.category,
      resource.source,
      resource.domain,
      domainTitle,
      resource.access,
      ...(resource.tags || []),
      ...(resource.language || [])
    ].join(" ")
  );
  const words = [
    ...new Set(
      norm([resource.title, resource.category, resource.source, ...(resource.tags || [])].join(" "))
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length >= 4)
    )
  ];
  return { title, category, tags, haystack, words };
}

/** Distance d'édition avec transposition (Damerau restreinte), arrêt anticipé au-delà de `max`. */
export function editDistance(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = [];
  for (let i = 0; i <= a.length; i += 1) {
    rows[i] = [i];
  }
  for (let j = 0; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    let best = Infinity;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) value = Math.min(value, rows[i - 2][j - 2] + 1);
      rows[i][j] = value;
      best = Math.min(best, value);
    }
    if (best > max) return max + 1;
  }
  return rows[a.length][b.length];
}

const tolerance = (term) => (term.length >= 8 ? 2 : term.length >= 5 ? 1 : 0);

function termMatches(term, entry, fuzzy) {
  if (entry.haystack.includes(term)) return true;
  if (!fuzzy) return false;
  const max = tolerance(term);
  return max > 0 && entry.words.some((word) => editDistance(term, word, max) <= max);
}

function fieldMatches(f, resource, entry) {
  const value = f.value;
  switch (f.field) {
    case "language":
      return (resource.language || []).includes(value);
    case "tag":
      return entry.tags.includes(value);
    default:
      return resource[f.field] === value;
  }
}

/** La ressource répond-elle à la requête analysée ? `fuzzy` accepte les fautes de frappe légères. */
export function matchResource(resource, entry, parsed, { fuzzy = false } = {}) {
  for (const f of parsed.fields) {
    if (!f.valid) return false; // opérateur avec valeur inconnue : aucun résultat (le message l'explique)
    if (fieldMatches(f, resource, entry) === f.negated) return false;
  }
  for (const phrase of parsed.phrases) if (!entry.haystack.includes(phrase)) return false;
  for (const word of parsed.excluded) if (entry.haystack.includes(word)) return false;
  for (const term of parsed.terms) if (!termMatches(term, entry, fuzzy)) return false;
  return true;
}

/** Score de pertinence : titre > mot-clé > catégorie > texte. */
export function scoreResource(resource, entry, parsed) {
  let score = resource.featured ? 0.5 : 0;
  for (const term of [...parsed.terms, ...parsed.phrases]) {
    if (new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(entry.title)) score += 10;
    else if (entry.title.includes(term)) score += 6;
    if (entry.tags.some((tag) => tag === slug(term))) score += 5;
    if (entry.category.includes(term)) score += 3;
    if (entry.haystack.includes(term)) score += 1;
  }
  return score;
}
