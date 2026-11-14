import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeStats, percent, HEALTH_LABELS } from "../js/stats.js";
import { HEALTH_STATES } from "../js/resource-schema.js";

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), "utf8"));
const catalog = read("data/resources.json");
const health = read("data/health.json");
const active = catalog.resources.filter((r) => !["archived", "removed"].includes(r.status));
const stats = computeStats(catalog, health);

test("les totaux correspondent au catalogue", () => {
  assert.equal(stats.total, active.length);
  assert.equal(stats.archived, catalog.resources.length - active.length);
  assert.equal(stats.verified, active.filter((r) => r.status === "verified").length);
  assert.equal(stats.needsReview + stats.verified, stats.total);
  assert.equal(stats.french, active.filter((r) => r.language.includes("fr")).length);
  assert.equal(percent(stats.verifiedShare), `${Math.round((stats.verified / stats.total) * 100)} %`);
});

test("chaque répartition additionne bien toutes les ressources actives", () => {
  assert.equal(
    stats.byDomain.reduce((n, d) => n + d.count, 0),
    stats.total
  );
  for (const key of ["byType", "byLevel", "byAccess"])
    assert.equal(
      stats[key].reduce((n, d) => n + d.count, 0),
      stats.total,
      key
    );
  assert.ok(stats.byLanguage.reduce((n, d) => n + d.count, 0) >= stats.total, "une ressource multilingue compte dans chaque langue");
  assert.equal(stats.byDomain.length, catalog.domains.length);
  assert.ok(
    stats.byDomain.every((d, i, all) => i === 0 || all[i - 1].count >= d.count),
    "triées par effectif décroissant"
  );
});

test("la part francophone par domaine est cohérente", () => {
  for (const d of stats.byDomain) {
    const list = active.filter((r) => r.domain === d.key);
    assert.equal(d.french, list.filter((r) => r.language.includes("fr")).length);
    assert.ok(d.frenchShare >= 0 && d.frenchShare <= 1);
  }
});

test("la santé des liens compte chaque ressource une fois et liste les problèmes d'abord par gravité", () => {
  assert.equal(stats.health.checkedCount, active.length);
  assert.equal(
    Object.values(stats.health.counts).reduce((a, b) => a + b, 0),
    active.length
  );
  assert.equal(stats.health.problems.length, active.length - stats.health.counts.ok);
  const order = ["broken", "unreachable", "redirect", "blocked"];
  const ranks = stats.health.problems.map((p) => order.indexOf(p.health));
  assert.deepEqual(
    ranks,
    [...ranks].sort((a, b) => a - b)
  );
  for (const state of HEALTH_STATES) assert.ok(HEALTH_LABELS[state], `libellé pour ${state}`);
});

test("sans fichier de santé, la page reste calculable (health = null)", () => {
  assert.equal(computeStats(catalog, null).health, null);
});

test("un catalogue de test donne les chiffres attendus", () => {
  const tiny = {
    updated: "2026-01-01",
    domains: [
      { id: "a", title: "A" },
      { id: "b", title: "B" }
    ],
    resources: [
      { id: "1", domain: "a", status: "verified", language: ["fr"], type: "tool", level: "beginner", access: "free" },
      { id: "2", domain: "a", status: "needs-review", language: ["en", "fr"], type: "tool", level: "advanced", access: "free" },
      { id: "3", domain: "b", status: "needs-review", language: ["en"], type: "course", level: "advanced", access: "paid" },
      { id: "4", domain: "b", status: "archived", language: ["en"], type: "course", level: "advanced", access: "paid" }
    ]
  };
  const s = computeStats(tiny, {
    checked: "2026-01-02",
    results: { 1: { health: "ok" }, 2: { health: "broken", detail: "HTTP 404" }, 3: { health: "blocked" } }
  });
  assert.deepEqual([s.total, s.verified, s.needsReview, s.archived, s.french], [3, 1, 2, 1, 2]);
  assert.equal(percent(s.frenchShare), "67 %");
  assert.deepEqual(
    s.byLanguage.map((l) => [l.key, l.count]),
    [
      ["en", 2],
      ["fr", 2]
    ]
  );
  assert.deepEqual(
    s.health.problems.map((p) => p.health),
    ["broken", "blocked"]
  );
});
