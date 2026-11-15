// Statistiques du catalogue pour la page « État du catalogue » (fonctions pures, testées dans tests/stats.test.mjs).
import { TYPE_LABELS, LEVEL_LABELS, ACCESS_LABELS, LANG_LABELS } from "./data.js";

export const HEALTH_LABELS = {
  ok: "Répond normalement",
  redirect: "Adresse redirigée vers un autre site",
  blocked: "Refuse les robots (à vérifier à la main)",
  unreachable: "Erreur serveur ou réseau (peut-être passagère)",
  broken: "Introuvable"
};
const HEALTH_ORDER = ["broken", "unreachable", "redirect", "blocked", "ok"];

const isActive = (r) => !["archived", "removed"].includes(r.status);
const share = (n, total) => (total ? n / total : 0);

/** Compte les valeurs d'un champ ; `labels` donne l'ordre et les libellés (les valeurs inconnues sont conservées). */
function tally(list, pick, labels = {}) {
  const counts = new Map();
  for (const r of list) for (const key of [].concat(pick(r))) counts.set(key, (counts.get(key) || 0) + 1);
  const total = list.length;
  return [...counts]
    .map(([key, count]) => ({ key, label: labels[key] ?? key, count, share: share(count, total) }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));
}

/**
 * @param {{ resources: any[], domains: any[], updated?: string }} catalog
 * @param {{ checked: string, results: Record<string, { health: string, detail?: string, finalUrl?: string }> } | null} health
 */
export function computeStats(catalog, health = null) {
  const active = catalog.resources.filter(isActive);
  const total = active.length;
  const verified = active.filter((r) => r.status === "verified").length;
  const french = active.filter((r) => (r.language || []).includes("fr")).length;

  const byDomain = catalog.domains
    .map((domain) => {
      const list = active.filter((r) => r.domain === domain.id);
      const fr = list.filter((r) => (r.language || []).includes("fr")).length;
      return {
        key: domain.id,
        label: domain.title,
        count: list.length,
        share: share(list.length, total),
        verified: list.filter((r) => r.status === "verified").length,
        french: fr,
        frenchShare: share(fr, list.length)
      };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"));

  let linkHealth = null;
  if (health) {
    const counts = Object.fromEntries(HEALTH_ORDER.map((key) => [key, 0]));
    const problems = [];
    for (const r of active) {
      const entry = health.results[r.id];
      if (!entry) continue;
      counts[entry.health] = (counts[entry.health] || 0) + 1;
      if (entry.health !== "ok")
        problems.push({
          id: r.id,
          title: r.title,
          url: r.url,
          health: entry.health,
          detail: entry.detail || "",
          finalUrl: entry.finalUrl || ""
        });
    }
    problems.sort((a, b) => HEALTH_ORDER.indexOf(a.health) - HEALTH_ORDER.indexOf(b.health) || a.title.localeCompare(b.title, "fr"));
    const checkedCount = HEALTH_ORDER.reduce((sum, key) => sum + counts[key], 0);
    linkHealth = { checked: health.checked, counts, checkedCount, problems };
  }

  return {
    updated: catalog.updated || "",
    total,
    verified,
    needsReview: active.filter((r) => r.status === "needs-review").length,
    archived: catalog.resources.length - total,
    verifiedShare: share(verified, total),
    french,
    frenchShare: share(french, total),
    byDomain,
    byType: tally(active, (r) => r.type, TYPE_LABELS),
    byLevel: tally(active, (r) => r.level, LEVEL_LABELS),
    byLanguage: tally(active, (r) => r.language || [], LANG_LABELS),
    byAccess: tally(active, (r) => r.access, ACCESS_LABELS),
    health: linkHealth
  };
}

export const percent = (value) => `${Math.round(value * 100)} %`;
