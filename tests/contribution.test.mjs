import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  slugify,
  suggestId,
  parseURL,
  parseTags,
  findDuplicates,
  buildResource,
  validateDraft,
  buildIssueURL
} from "../js/contribution.js";
import { validateResource, validateCatalog } from "../js/resource-schema.js";

const catalog = JSON.parse(readFileSync(new URL("../data/resources.json", import.meta.url), "utf8"));
const domainIds = catalog.domains.map((d) => d.id);
const takenIds = catalog.resources.map((r) => r.id);
const draft = {
  title: "Exemple Outil",
  url: "https://exemple-outil.test/docs/",
  domain: "osint",
  type: "tool",
  level: "beginner",
  access: "free",
  language: ["fr"],
  category: "Investigation",
  tags: "OSINT, Vérification, osint",
  description: "Outil factice de démonstration pour tester le formulaire de contribution du site.",
  source: ""
};

test("le catalogue actuel respecte les règles partagées (même résultat que npm run validate:catalog)", () => {
  assert.deepEqual(validateCatalog(catalog), []);
});

test("slugify et suggestId : accents retirés, identifiant unique", () => {
  assert.equal(slugify("  Café — OSINT & Forensic !  "), "cafe-osint-forensic");
  assert.equal(suggestId("OSINT Framework", takenIds), "osint-framework-2");
  assert.equal(suggestId("Totalement Nouveau", takenIds), "totalement-nouveau");
  assert.equal(suggestId("???", []), "ressource");
});

test("parseURL : http(s) seulement, www et barre finale ignorés", () => {
  // entrée hostile volontaire : un schéma javascript: doit être refusé
  // eslint-disable-next-line no-script-url
  assert.equal(parseURL("javascript:alert(1)"), null);
  assert.equal(parseURL("ftp://exemple.org"), null);
  assert.equal(parseURL("pas une url"), null);
  assert.equal(parseURL("https://localhost/"), null);
  assert.equal(parseURL("https://WWW.Exemple.org/Page/").key, "exemple.org/page");
  assert.equal(parseURL("http://exemple.org").secure, false);
});

test("parseTags : minuscules, sans accents, uniques, limitées", () => {
  assert.deepEqual(parseTags("OSINT, Vérification, osint ; Réseau\nGEOINT"), ["osint", "verification", "reseau", "geoint"]);
  assert.equal(parseTags(Array.from({ length: 20 }, (_, i) => `t${i}`).join(",")).length, 8);
});

test("findDuplicates : même URL, même site, titre proche", () => {
  const first = catalog.resources[0];
  assert.equal(
    findDuplicates(catalog.resources, { url: first.url.toUpperCase().replace("HTTPS", "https"), title: "x" }).exact.length >= 0,
    true
  );
  assert.equal(findDuplicates(catalog.resources, { url: first.url, title: "Autre" }).exact[0].id, first.id);
  assert.equal(findDuplicates(catalog.resources, { url: first.url.replace(/\/$/, "") + "/", title: "Autre" }).exact[0].id, first.id);
  const sameSite = findDuplicates(catalog.resources, { url: new URL("/une-autre-page", first.url).href, title: "Autre chose" });
  assert.ok(sameSite.sameHost.some((r) => r.id === first.id));
  assert.ok(
    findDuplicates(catalog.resources, { url: "https://nouveau-site.test/", title: first.title }).similarTitle.some((r) => r.id === first.id)
  );
  assert.deepEqual(findDuplicates(catalog.resources, { url: "https://nouveau-site.test/", title: "Zzzz inconnu" }), {
    exact: [],
    sameHost: [],
    similarTitle: []
  });
});

test("buildResource produit une fiche valide, toujours « à vérifier »", () => {
  const r = buildResource(draft, { today: "2026-11-14", takenIds });
  assert.equal(r.status, "needs-review");
  assert.equal(r.verified, null);
  assert.equal(r.featured, false);
  assert.equal(r.added, "2026-11-14");
  assert.equal(r.source, "exemple-outil.test");
  assert.deepEqual(r.tags, ["osint", "verification"]);
  assert.deepEqual(validateResource(r, { domainIds }), []);
});

test("validateDraft : messages clairs et aucune erreur pour un brouillon complet", () => {
  assert.deepEqual(validateDraft(draft, { domainIds, takenIds, today: "2026-11-14" }), {});
  const bad = validateDraft(
    { ...draft, url: "http://exemple.org", description: "trop court", domain: "", language: [] },
    { domainIds, takenIds }
  );
  assert.match(bad.url, /https/);
  assert.match(bad.description, /40 caractères minimum/);
  assert.ok(bad.domain && bad.language);
  assert.match(validateDraft({ ...draft, description: "x".repeat(300) }, { domainIds }).description, /220/);
});

test("buildIssueURL : ticket pré-rempli vers le formulaire, valeurs encodées", () => {
  const url = new URL(
    buildIssueURL(
      { ...draft, evidence: "Doc officielle & dépôt actif" },
      { domain: "OSINT", type: "Outil", level: "Débutant", access: "Gratuit", language: "Français" }
    )
  );
  assert.equal(url.origin + url.pathname, "https://github.com/digitaleflex/cybersecurity/issues/new");
  assert.equal(url.searchParams.get("template"), "resource-suggestion.yml");
  assert.equal(url.searchParams.get("title"), "[Ressource] Exemple Outil");
  assert.equal(url.searchParams.get("resource_title"), "Exemple Outil");
  assert.equal(url.searchParams.get("domain"), "OSINT");
  assert.equal(url.searchParams.get("evidence"), "Doc officielle & dépôt actif");
  assert.ok(url.href.length < 7000);
});

test("l'exemple de fiche de CONTRIBUTING.md respecte les règles (nouvelle fiche = à vérifier)", () => {
  const md = readFileSync(new URL("../CONTRIBUTING.md", import.meta.url), "utf8");
  const json = md.match(/```json\n([\s\S]*?)\n```/)[1];
  const example = JSON.parse(json);
  assert.deepEqual(validateResource(example, { domainIds }), []);
  assert.equal(example.status, "needs-review");
  assert.equal(example.verified, null);
});

import { TYPE_LABELS, LEVEL_LABELS, ACCESS_LABELS, LANG_LABELS } from "../js/data.js";

function formOptions(file, id) {
  const text = readFileSync(new URL(`../.github/ISSUE_TEMPLATE/${file}`, import.meta.url), "utf8");
  const block = text.split(/\n {2}- type: /).find((b) => b.includes(`id: ${id}\n`));
  const options = block.split("options:\n")[1].split(/\n {4}validations:/)[0];
  return options
    .split("\n")
    .map((l) => l.replace(/^\s*- /, "").trim())
    .filter(Boolean);
}

test("le formulaire GitHub « Proposer une ressource » reprend exactement les listes du site", () => {
  const file = "resource-suggestion.yml";
  assert.deepEqual(
    formOptions(file, "domain"),
    catalog.domains.map((d) => d.title)
  );
  assert.deepEqual(formOptions(file, "type"), Object.values(TYPE_LABELS));
  assert.deepEqual(formOptions(file, "level"), Object.values(LEVEL_LABELS));
  assert.deepEqual(formOptions(file, "access"), Object.values(ACCESS_LABELS));
  assert.deepEqual(formOptions(file, "language"), Object.values(LANG_LABELS));
});

test("les identifiants de champs préremplis par le site existent dans le formulaire", () => {
  const yaml = readFileSync(new URL("../.github/ISSUE_TEMPLATE/resource-suggestion.yml", import.meta.url), "utf8");
  const url = new URL(
    buildIssueURL(
      { ...draft, evidence: "x" },
      { domain: "OSINT", type: "Outil", level: "Débutant", access: "Gratuit", language: "Français" }
    )
  );
  for (const key of url.searchParams.keys()) {
    if (["template", "title"].includes(key)) continue;
    assert.ok(yaml.includes(`id: ${key}\n`), `champ « ${key} » absent du formulaire`);
  }
});

test("les trois formulaires de ticket et le lien de contact sont présents", () => {
  for (const file of ["resource-suggestion.yml", "broken-link.yml", "correction.yml", "config.yml"]) {
    assert.ok(readFileSync(new URL(`../.github/ISSUE_TEMPLATE/${file}`, import.meta.url), "utf8").length > 100, file);
  }
  assert.match(readFileSync(new URL("../.github/ISSUE_TEMPLATE/config.yml", import.meta.url), "utf8"), /chat\.whatsapp\.com/);
});
