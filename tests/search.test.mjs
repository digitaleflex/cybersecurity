import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseQuery, canonicalValue, indexResource, matchResource, scoreResource, editDistance, invalidFields, hasQuery } from "../js/search.js";

const catalog = JSON.parse(readFileSync(new URL("../data/resources.json", import.meta.url), "utf8"));
const ctx = { domains: catalog.domains };
const titleOf = (id) => catalog.domains.find((d) => d.id === id)?.title ?? "";
const active = catalog.resources.filter((r) => r.status !== "archived");
const index = new Map(active.map((r) => [r.id, indexResource(r, titleOf(r.domain))]));
const search = (q, opts) => { const p = parseQuery(q, ctx); return active.filter((r) => matchResource(r, index.get(r.id), p, opts)); };

test("parseQuery : mots, phrases, exclusions et opérateurs avec alias français", () => {
  const p = parseQuery('osint "Threat Intelligence" -github lang:fr niveau:Débutant -tag:eu', ctx);
  assert.deepEqual(p.terms, ["osint"]);
  assert.deepEqual(p.phrases, ["threat intelligence"]);
  assert.deepEqual(p.excluded, ["github"]);
  assert.deepEqual(p.fields.map((f) => [f.field, f.value, f.negated]), [["language", "fr", false], ["level", "beginner", false], ["tag", "eu", true]]);
});

test("un « mot:valeur » qui n'est pas un opérateur reste un terme (URL, horaire…)", () => {
  assert.deepEqual(parseQuery("https://exemple.org", ctx).terms, ["https://exemple.org"]);
  assert.deepEqual(parseQuery("ratio:3", ctx).terms, ["ratio:3"]);
});

test("canonicalValue : alias, accents, domaines par identifiant ou par titre", () => {
  assert.equal(canonicalValue("access", "Gratuit"), "free");
  assert.equal(canonicalValue("level", "avancé"), "advanced");
  assert.equal(canonicalValue("language", "Français"), "fr");
  assert.equal(canonicalValue("type", "dépôt"), "repository");
  assert.equal(canonicalValue("domain", "red-team", ctx), "red-team");
  assert.equal(canonicalValue("domain", "Red Team", ctx), "red-team");
  assert.equal(canonicalValue("domain", "inconnu", ctx), null);
  assert.equal(canonicalValue("level", "xyz"), null);
});

test("matchResource : les filtres de champ correspondent aux données", () => {
  const french = search("lang:fr");
  assert.ok(french.length > 0 && french.every((r) => r.language.includes("fr")));
  assert.equal(french.length, active.filter((r) => r.language.includes("fr")).length);
  const free = search("acces:gratuit");
  assert.equal(free.length, active.filter((r) => r.access === "free").length);
  const redTeam = search("domaine:redteam");
  assert.equal(redTeam.length, active.filter((r) => r.domain === "red-team").length);
  assert.equal(search("lang:fr -lang:fr").length, 0);
});

test("opérateur à valeur inconnue : aucun résultat et signalé par invalidFields", () => {
  const p = parseQuery("lang:klingon osint", ctx);
  assert.equal(invalidFields(p).length, 1);
  assert.equal(search("lang:klingon").length, 0);
});

test("mots (ET), phrase exacte et exclusion", () => {
  const both = search("osint github");
  assert.ok(both.every((r) => index.get(r.id).haystack.includes("osint") && index.get(r.id).haystack.includes("github")));
  const noGithub = search("osint -github");
  assert.ok(noGithub.length > 0 && noGithub.every((r) => !index.get(r.id).haystack.includes("github")));
  assert.equal(noGithub.length + both.length, search("osint").length);
  assert.ok(search('"zzz phrase inexistante"').length === 0);
});

test("recherche insensible aux accents et à la casse", () => {
  assert.deepEqual(search("INVESTIGATION").map((r) => r.id), search("investigation").map((r) => r.id));
  assert.equal(search("Securité").length, search("securite").length);
});

test("tolérance aux fautes : exacte d'abord, approchante seulement en mode fuzzy", () => {
  const name = active.find((r) => /^[A-Za-z]{6,}/.test(r.title)).title.split(/\W+/)[0].toLowerCase();
  const typo = name.slice(0, 2) + name[3] + name[2] + name.slice(4); // transposition de 2 lettres
  assert.equal(search(typo).length, 0, "sans fuzzy : rien");
  assert.ok(search(typo, { fuzzy: true }).some((r) => index.get(r.id).words.includes(name)), "avec fuzzy : retrouve la ressource");
  assert.equal(search("abc", { fuzzy: true }).length, search("abc").length, "mots courts : jamais approximatifs");
});

test("editDistance", () => {
  assert.equal(editDistance("shodan", "shodan"), 0);
  assert.equal(editDistance("shodna", "shodan"), 1);
  assert.equal(editDistance("shodn", "shodan"), 1);
  assert.ok(editDistance("abcdef", "uvwxyz", 2) > 2);
});

test("scoreResource : un titre qui correspond passe avant une simple mention", () => {
  const target = active.find((r) => r.title.split(/\W+/)[0].length >= 5);
  const word = target.title.split(/\W+/)[0].toLowerCase();
  const p = parseQuery(word, ctx);
  const ranked = active.filter((r) => matchResource(r, index.get(r.id), p)).map((r) => [scoreResource(r, index.get(r.id), p), r]).sort((a, b) => b[0] - a[0]);
  assert.ok(ranked.length >= 1);
  assert.ok(ranked[0][0] >= 10, "le meilleur résultat a le terme dans son titre");
  assert.equal(hasQuery(parseQuery("", ctx)), false);
});

test("chaque exemple de syntaxe affiché sur la page catalogue est valide et donne des résultats", () => {
  const html = readFileSync(new URL("../catalogue.html", import.meta.url), "utf8");
  const examples = [...html.matchAll(/data-example="([^"]+)"/g)].map((m) => m[1].replace(/&quot;/g, '"'));
  assert.ok(examples.length >= 5);
  for (const example of examples) {
    const parsed = parseQuery(example, ctx);
    assert.equal(invalidFields(parsed).length, 0, `${example} : opérateur invalide`);
    assert.ok(search(example).length > 0, `${example} : aucun résultat`);
  }
});

test("les mots-clés populaires proposés existent bien dans le catalogue", () => {
  const counts = new Map();
  for (const r of active) for (const t of r.tags) counts.set(t, (counts.get(t) || 0) + 1);
  const popular = [...counts].filter(([, n]) => n >= 2);
  assert.ok(popular.length >= 10, "assez de mots-clés populaires pour les filtres");
});
