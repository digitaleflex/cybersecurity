// Données personnelles de « Mon espace » : favoris, récents et listes. Tout reste dans le navigateur (jamais envoyé).
// Les fonctions de ce fichier sont pures (testées dans tests/user-data.test.mjs), sauf la section « stockage » en bas.
export const LISTS_KEY = "hc-lists";
export const LIMITS = { lists: 20, itemsPerList: 100, favorites: 500, recent: 12, nameLength: 60, importBytes: 200_000, sharedIds: 50 };
export const EXPORT_APP = "hashcode-cyber-library";

const LIST_ID = /^l-[a-z0-9]{4,16}$/;
const RESOURCE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Nettoie un nom saisi : pas de caractères de contrôle, espaces normalisés, longueur limitée. */
export const cleanName = (value) =>
  String(value ?? "")
    // eslint-disable-next-line no-control-regex -- on retire volontairement les caractères de contrôle
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, LIMITS.nameLength);

const uniqueStrings = (values, accept, max) => {
  const out = [];
  for (const value of Array.isArray(values) ? values : []) {
    if (typeof value === "string" && RESOURCE_ID.test(value) && accept(value) && !out.includes(value)) out.push(value);
    if (out.length >= max) break;
  }
  return out;
};

export const newListId = (random = () => Math.random().toString(36).slice(2, 10)) => `l-${random().padEnd(6, "0").slice(0, 8)}`;

/** Normalise des listes venant du stockage ou d'un fichier importé ; `knownIds` écarte les ressources inconnues. */
export function sanitizeLists(raw, knownIds = null) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const lists = [];
  for (const item of raw) {
    if (lists.length >= LIMITS.lists) break;
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !LIST_ID.test(item.id) || seen.has(item.id)) continue;
    seen.add(item.id);
    lists.push({
      id: item.id,
      name: cleanName(item.name) || "Liste sans nom",
      items: uniqueStrings(item.items, (id) => !knownIds || knownIds.has(id), LIMITS.itemsPerList),
      created: typeof item.created === "string" && /^\d{4}-\d{2}-\d{2}/.test(item.created) ? item.created.slice(0, 10) : ""
    });
  }
  return lists;
}

/** @returns {{ lists: any[], list: any } | null} null si la limite de listes est atteinte. */
export function createList(lists, name, { now = new Date().toISOString(), id = newListId() } = {}) {
  if (lists.length >= LIMITS.lists) return null;
  const list = { id, name: cleanName(name) || "Nouvelle liste", items: [], created: now.slice(0, 10) };
  return { lists: [...lists, list], list };
}

export const renameList = (lists, id, name) => lists.map((l) => (l.id === id ? { ...l, name: cleanName(name) || l.name } : l));
export const deleteList = (lists, id) => lists.filter((l) => l.id !== id);
export const removeFromList = (lists, id, resourceId) =>
  lists.map((l) => (l.id === id ? { ...l, items: l.items.filter((x) => x !== resourceId) } : l));
export const addToList = (lists, id, resourceIds) =>
  lists.map((l) =>
    l.id === id ? { ...l, items: uniqueStrings([...l.items, ...[].concat(resourceIds)], () => true, LIMITS.itemsPerList) } : l
  );
export const toggleInList = (lists, id, resourceId) =>
  lists.map((l) =>
    l.id !== id
      ? l
      : l.items.includes(resourceId)
        ? { ...l, items: l.items.filter((x) => x !== resourceId) }
        : addToList([l], id, resourceId)[0]
  );

/** Contenu du fichier d'export (version 1). */
export function buildExport({ favorites = [], recent = [], lists = [] }, now = new Date().toISOString()) {
  return { app: EXPORT_APP, version: 1, exported: now, favorites, recent, lists };
}

/**
 * Lit un fichier d'import en le validant strictement. Rien n'est appliqué ici : la fonction renvoie les données
 * nettoyées et un bilan (ressources inconnues ignorées, etc.).
 * @returns {{ ok: true, data: { favorites: string[], recent: string[], lists: any[] }, stats: any } | { ok: false, error: string }}
 */
export function parseImport(text, knownIds) {
  if (typeof text !== "string" || !text.trim()) return { ok: false, error: "Le fichier est vide." };
  if (text.length > LIMITS.importBytes) return { ok: false, error: "Le fichier est trop volumineux (200 Ko maximum)." };
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Ce fichier n'est pas un JSON valide." };
  }
  if (!parsed || typeof parsed !== "object" || parsed.app !== EXPORT_APP)
    return { ok: false, error: "Ce fichier ne vient pas de HashCode Cyber Library." };
  if (parsed.version !== 1) return { ok: false, error: "Version de fichier non prise en charge." };
  const known = (id) => knownIds.has(id);
  const countIds = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").length : 0);
  const favorites = uniqueStrings(parsed.favorites, known, LIMITS.favorites);
  const recent = uniqueStrings(parsed.recent, known, LIMITS.recent);
  const lists = sanitizeLists(parsed.lists, knownIds);
  const received =
    countIds(parsed.favorites) +
    countIds(parsed.recent) +
    (Array.isArray(parsed.lists) ? parsed.lists.reduce((n, l) => n + countIds(l?.items), 0) : 0);
  const kept = favorites.length + recent.length + lists.reduce((n, l) => n + l.items.length, 0);
  return {
    ok: true,
    data: { favorites, recent, lists },
    stats: {
      favorites: favorites.length,
      recent: recent.length,
      lists: lists.length,
      items: lists.reduce((n, l) => n + l.items.length, 0),
      ignored: Math.max(0, received - kept)
    }
  };
}

/** Fusionne des données importées avec les données actuelles (sans doublon, limites respectées). */
export function mergeUserData(current, incoming) {
  const merged = sanitizeLists(current.lists);
  for (const list of incoming.lists) {
    const existing = merged.find((l) => l.id === list.id);
    if (existing) existing.items = uniqueStrings([...existing.items, ...list.items], () => true, LIMITS.itemsPerList);
    else if (merged.length < LIMITS.lists) merged.push({ ...list });
  }
  return {
    favorites: uniqueStrings([...current.favorites, ...incoming.favorites], () => true, LIMITS.favorites),
    recent: uniqueStrings([...incoming.recent, ...current.recent], () => true, LIMITS.recent),
    lists: merged
  };
}

/** Lien de partage d'une liste : les identifiants sont dans l'adresse, rien n'est stocké ailleurs. */
export function shareURL(list) {
  const params = new URLSearchParams({ ids: list.items.slice(0, LIMITS.sharedIds).join(",") });
  if (list.name) params.set("titre", list.name);
  return `liste?${params}`;
}

/** Lit une liste partagée depuis l'URL ; ignore tout ce qui n'est pas un identifiant connu. */
export function parseShared(search, knownIds) {
  const params = new URLSearchParams(search);
  const requested = [
    ...new Set(
      (params.get("ids") || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => RESOURCE_ID.test(s))
    )
  ];
  const limited = requested.slice(0, LIMITS.sharedIds);
  const ids = limited.filter((id) => knownIds.has(id));
  return {
    title: cleanName(params.get("titre")),
    ids,
    unknown: limited.length - ids.length,
    truncated: requested.length > LIMITS.sharedIds
  };
}

/* ---------- stockage (navigateur) ---------- */
export function loadLists(knownIds = null) {
  try {
    return sanitizeLists(JSON.parse(localStorage.getItem(LISTS_KEY) || "[]"), knownIds);
  } catch {
    return [];
  }
}

export function saveLists(lists) {
  try {
    localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
  } catch {
    /* stockage indisponible : la fonction reste sans effet */
  }
  window.dispatchEvent(new Event("hc:lists"));
}
