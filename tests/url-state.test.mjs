import test from "node:test";
import assert from "node:assert/strict";
import { parseFilters, serializeFilters, DEFAULT_FILTERS, MAX_QUERY_LENGTH } from "../js/url-state.js";

const allowed = {
  domains: ["osint", "red-team"],
  categories: ["GEOINT", "Investigation"],
  types: ["tool", "course"],
  levels: ["beginner", "advanced"],
  statuses: ["verified", "needs-review"]
};

test("une URL vide donne les filtres par défaut", () => {
  assert.deepEqual(parseFilters("", allowed), DEFAULT_FILTERS);
});

test("les filtres valides sont lus depuis l'URL", () => {
  const f = parseFilters("?domain=osint&type=tool&level=advanced&sort=newest&view=featured&q=shodan", allowed);
  assert.deepEqual(f, { ...DEFAULT_FILTERS, domain: "osint", type: "tool", level: "advanced", sort: "newest", view: "featured", q: "shodan" });
});

test("les valeurs inconnues sont ignorées sans erreur", () => {
  const f = parseFilters("?domain=nope&type=xx&sort=weird&view=hack&status=%3Cscript%3E", allowed);
  assert.deepEqual(f, DEFAULT_FILTERS);
});

test("la recherche est nettoyée et limitée en longueur", () => {
  assert.equal(parseFilters("?q=%20%20osint%20%20", allowed).q, "osint");
  assert.equal(parseFilters(`?q=${"a".repeat(500)}`, allowed).q.length, MAX_QUERY_LENGTH);
});

test("la sérialisation omet les valeurs par défaut", () => {
  assert.equal(serializeFilters(DEFAULT_FILTERS), "");
  assert.equal(serializeFilters({ ...DEFAULT_FILTERS, domain: "osint", sort: "featured" }), "?domain=osint");
});

test("aller-retour : parse(serialize(f)) === f, y compris accents et espaces", () => {
  const f = { ...DEFAULT_FILTERS, domain: "osint", category: "Investigation", q: "réseaux & dorks", sort: "az", view: "recent" };
  assert.deepEqual(parseFilters(serializeFilters(f), { ...allowed }), f);
});
