// Aides pures du formulaire de contribution (testées dans tests/contribution.test.mjs).
import { DESCRIPTION_RANGE, validateResource, TYPES, LEVELS, ACCESS, LANGUAGES } from "./resource-schema.js";

export const REPO_URL = "https://github.com/digitaleflex/cybersecurity";
export const MAX_TAGS = 8;

const strip = (value) => String(value ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function slugify(text, max = 60) {
  return strip(text).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, max).replace(/-+$/g, "");
}

/** Identifiant libre : « Awesome OSINT » -> awesome-osint, puis awesome-osint-2 s'il existe déjà. */
export function suggestId(title, takenIds = []) {
  const base = slugify(title) || "ressource";
  const taken = new Set(takenIds);
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
  return id;
}

/** Analyse une URL saisie. Retourne null si elle n'est pas une URL http(s) valide. */
export function parseURL(value) {
  try {
    const url = new URL(String(value ?? "").trim());
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".")) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    return { href: url.href, secure: url.protocol === "https:", host, key: `${host}${path}` };
  } catch { return null; }
}

export function parseTags(text) {
  const seen = new Set();
  for (const raw of String(text ?? "").split(/[,;\n]/)) {
    const tag = slugify(raw, 30);
    if (tag) seen.add(tag);
  }
  return [...seen].slice(0, MAX_TAGS);
}

/** Cherche la ressource dans le catalogue : même URL, même site, titre identique ou proche. */
export function findDuplicates(resources, { url, title }) {
  const target = parseURL(url);
  const wanted = strip(title).replace(/[^a-z0-9]+/g, " ").trim();
  const result = { exact: [], sameHost: [], similarTitle: [] };
  for (const resource of resources) {
    const known = parseURL(resource.url);
    if (target && known && known.key === target.key) result.exact.push(resource);
    else if (target && known && known.host === target.host) result.sameHost.push(resource);
    else if (wanted.length >= 4) {
      const name = strip(resource.title).replace(/[^a-z0-9]+/g, " ").trim();
      if (name === wanted || (wanted.length >= 6 && (name.includes(wanted) || wanted.includes(name)))) result.similarTitle.push(resource);
    }
  }
  return result;
}

/** Construit la fiche JSON conforme au modèle (statut « à vérifier », jamais « vérifié »). */
export function buildResource(values, { today, takenIds = [] }) {
  const parsed = parseURL(values.url);
  return {
    id: suggestId(values.title, takenIds),
    title: String(values.title ?? "").trim(),
    description: String(values.description ?? "").trim().replace(/\s+/g, " "),
    url: parsed ? parsed.href : String(values.url ?? "").trim(),
    domain: values.domain,
    category: String(values.category ?? "").trim(),
    type: values.type,
    level: values.level,
    access: values.access,
    language: [...(values.language ?? [])],
    tags: parseTags(values.tags),
    source: String(values.source ?? "").trim() || (parsed ? parsed.host : ""),
    verified: null,
    status: "needs-review",
    featured: false,
    added: today
  };
}

/** Vérifie le brouillon : retourne { erreur par champ } (objet vide = prêt à envoyer). */
export function validateDraft(values, { domainIds = [], takenIds = [], today = "2000-01-01" } = {}) {
  const errors = {};
  const title = String(values.title ?? "").trim();
  if (title.length < 2) errors.title = "Indique le nom officiel de la ressource.";
  const parsed = parseURL(values.url);
  if (!parsed) errors.url = "Saisis une adresse complète, par exemple https://exemple.org/";
  else if (!parsed.secure) errors.url = "Utilise l'adresse https:// de la ressource.";
  if (!domainIds.includes(values.domain)) errors.domain = "Choisis un domaine.";
  if (!TYPES.includes(values.type)) errors.type = "Choisis un type.";
  if (!LEVELS.includes(values.level)) errors.level = "Choisis un niveau.";
  if (!ACCESS.includes(values.access)) errors.access = "Indique si la ressource est gratuite, freemium ou payante.";
  if (!(values.language ?? []).length || !(values.language ?? []).every((l) => LANGUAGES.includes(l))) errors.language = "Indique au moins une langue.";
  if (!String(values.category ?? "").trim()) errors.category = "Indique une catégorie (ex. Investigation, SIEM…).";
  const length = String(values.description ?? "").trim().replace(/\s+/g, " ").length;
  const [min, max] = DESCRIPTION_RANGE;
  if (length < min) errors.description = `Décris la ressource en ${min} caractères minimum (${length} actuellement).`;
  else if (length > max) errors.description = `Reste concis : ${max} caractères maximum (${length} actuellement).`;
  if (!Object.keys(errors).length) {
    const problems = validateResource(buildResource(values, { today, takenIds }), { domainIds });
    if (problems.length) errors.form = problems.join(" · ");
  }
  return errors;
}

/** Lien GitHub vers le formulaire de ticket déjà rempli (aucun serveur nécessaire). */
export function buildIssueURL(values, labels) {
  const params = new URLSearchParams({ template: "resource-suggestion.yml", title: `[Ressource] ${String(values.title).trim()}` });
  const set = (key, value) => { if (value) params.set(key, value); };
  set("resource_title", String(values.title).trim());
  set("url", parseURL(values.url)?.href ?? values.url);
  set("domain", labels.domain);
  set("type", labels.type);
  set("level", labels.level);
  set("access", labels.access);
  set("language", labels.language);
  set("category", String(values.category ?? "").trim());
  set("tags", parseTags(values.tags).join(", "));
  set("description", String(values.description ?? "").trim());
  set("evidence", String(values.evidence ?? "").trim());
  return `${REPO_URL}/issues/new?${params.toString()}`;
}
