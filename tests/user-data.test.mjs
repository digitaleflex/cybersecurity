import test from "node:test";
import assert from "node:assert/strict";
import {
  LIMITS,
  cleanName,
  newListId,
  sanitizeLists,
  createList,
  renameList,
  deleteList,
  addToList,
  removeFromList,
  toggleInList,
  buildExport,
  parseImport,
  mergeUserData,
  shareURL,
  parseShared
} from "../js/user-data.js";

const known = new Set(["a-one", "b-two", "c-three", "d-four"]);
const mk = (name = "Ma liste", id = "l-abcd1234") => createList([], name, { now: "2026-11-14T10:00:00Z", id }).lists;

test("cleanName : espaces normalisés, caractères de contrôle retirés, longueur limitée", () => {
  assert.equal(cleanName("  Ma \n\t liste   OSINT \u0000"), "Ma liste OSINT");
  assert.equal(cleanName("x".repeat(500)).length, LIMITS.nameLength);
  assert.equal(cleanName(null), "");
});

test("création, renommage, ajout, retrait et suppression d'une liste", () => {
  let lists = mk("Atelier OSINT");
  assert.deepEqual(lists[0], { id: "l-abcd1234", name: "Atelier OSINT", items: [], created: "2026-11-14" });
  lists = addToList(lists, "l-abcd1234", ["a-one", "b-two", "a-one"]);
  assert.deepEqual(lists[0].items, ["a-one", "b-two"], "pas de doublon");
  lists = toggleInList(lists, "l-abcd1234", "b-two");
  assert.deepEqual(lists[0].items, ["a-one"]);
  lists = toggleInList(lists, "l-abcd1234", "c-three");
  assert.deepEqual(lists[0].items, ["a-one", "c-three"]);
  lists = removeFromList(lists, "l-abcd1234", "a-one");
  assert.deepEqual(lists[0].items, ["c-three"]);
  lists = renameList(lists, "l-abcd1234", "  Nouveau nom ");
  assert.equal(lists[0].name, "Nouveau nom");
  assert.equal(renameList(lists, "l-abcd1234", "   ")[0].name, "Nouveau nom", "un nom vide ne remplace pas l'ancien");
  assert.deepEqual(deleteList(lists, "l-abcd1234"), []);
});

test("les limites de listes et d'éléments sont respectées", () => {
  let lists = [];
  for (let i = 0; i < LIMITS.lists; i += 1) lists = createList(lists, `L${i}`, { id: newListId(() => `x${i}abc${i}`) }).lists;
  assert.equal(createList(lists, "de trop"), null);
  const ids = Array.from({ length: LIMITS.itemsPerList + 20 }, (_, i) => `res-${i}`);
  assert.equal(addToList(mk(), "l-abcd1234", ids)[0].items.length, LIMITS.itemsPerList);
});

test("sanitizeLists écarte les données invalides, hostiles ou inconnues", () => {
  const raw = [
    {
      id: "l-good1234",
      name: "<img src=x onerror=alert(1)>",
      items: ["a-one", "inconnu", "../../etc", "a-one", 42],
      created: "2026-01-02T00:00:00Z"
    },
    { id: "pas-un-id", name: "x" },
    { id: "l-good1234", name: "doublon d'identifiant" },
    null,
    "texte",
    { id: "l-other567", name: "", items: "pas un tableau" }
  ];
  const lists = sanitizeLists(raw, known);
  assert.equal(lists.length, 2);
  assert.equal(
    lists[0].name,
    "<img src=x onerror=alert(1)>",
    "le nom est conservé comme texte (il est toujours affiché via textContent / échappé)"
  );
  assert.deepEqual(lists[0].items, ["a-one"]);
  assert.equal(lists[0].created, "2026-01-02");
  assert.deepEqual(lists[1], { id: "l-other567", name: "Liste sans nom", items: [], created: "" });
  assert.deepEqual(sanitizeLists("n'importe quoi"), []);
});

test("export puis import : aller-retour sans perte", () => {
  const data = { favorites: ["a-one", "b-two"], recent: ["c-three"], lists: addToList(mk("Ma liste"), "l-abcd1234", ["a-one", "d-four"]) };
  const file = JSON.stringify(buildExport(data, "2026-11-14T10:00:00Z"));
  const result = parseImport(file, known);
  assert.equal(result.ok, true);
  assert.deepEqual(result.data, data);
  assert.deepEqual(result.stats, { favorites: 2, recent: 1, lists: 1, items: 2, ignored: 0 });
});

test("import : fichiers invalides refusés avec un message clair, ressources inconnues ignorées et comptées", () => {
  assert.match(parseImport("", known).error, /vide/);
  assert.match(parseImport("{pas du json", known).error, /JSON/);
  assert.match(parseImport(JSON.stringify({ app: "autre", version: 1 }), known).error, /ne vient pas/);
  assert.match(parseImport(JSON.stringify({ app: "hashcode-cyber-library", version: 2 }), known).error, /Version/);
  assert.match(parseImport(JSON.stringify([1, 2, 3]), known).error, /ne vient pas/);
  assert.match(parseImport("x".repeat(LIMITS.importBytes + 1), known).error, /volumineux/);
  const partial = parseImport(
    JSON.stringify({ app: "hashcode-cyber-library", version: 1, favorites: ["a-one", "fantome", "__proto__"], recent: [], lists: [] }),
    known
  );
  assert.equal(partial.ok, true);
  assert.deepEqual(partial.data.favorites, ["a-one"]);
  assert.equal(partial.stats.ignored, 2);
});

test("fusion : sans doublon, listes de même identifiant réunies, limites respectées", () => {
  const current = { favorites: ["a-one"], recent: ["b-two"], lists: addToList(mk("Locale"), "l-abcd1234", ["a-one"]) };
  const incoming = {
    favorites: ["a-one", "c-three"],
    recent: ["d-four"],
    lists: [...addToList(mk("Importée"), "l-abcd1234", ["b-two"]), { id: "l-newlist1", name: "Autre", items: ["d-four"], created: "" }]
  };
  const merged = mergeUserData(current, incoming);
  assert.deepEqual(merged.favorites, ["a-one", "c-three"]);
  assert.deepEqual(merged.recent, ["d-four", "b-two"]);
  assert.equal(merged.lists.length, 2);
  assert.deepEqual(merged.lists.find((l) => l.id === "l-abcd1234").items, ["a-one", "b-two"]);
  assert.equal(merged.lists.find((l) => l.id === "l-abcd1234").name, "Locale", "le nom local est conservé");
});

test("partage par lien : aller-retour, identifiants inconnus ignorés, titre nettoyé et limites", () => {
  const list = { id: "l-abcd1234", name: "Atelier & OSINT — jour 1", items: ["a-one", "b-two"], created: "" };
  const url = shareURL(list);
  assert.match(url, /^liste\?ids=a-one%2Cb-two&titre=/);
  const parsed = parseShared(url.slice(url.indexOf("?")), known);
  assert.deepEqual(parsed, { title: "Atelier & OSINT — jour 1", ids: ["a-one", "b-two"], unknown: 0, truncated: false });
  const hostile = parseShared("?ids=a-one,<script>,fantome,a-one,../x&titre=%3Cb%3Etitre%00%3C/b%3E", known);
  assert.deepEqual(hostile.ids, ["a-one"]);
  assert.equal(hostile.unknown, 1, "« fantome » est valide mais inconnu ; les formes invalides sont ignorées sans bruit");
  assert.equal(hostile.title, "<b>titre </b>");
  const many = Array.from({ length: 80 }, (_, i) => `r-${i}`).join(",");
  assert.equal(parseShared(`?ids=${many}`, new Set(many.split(","))).truncated, true);
  assert.equal(parseShared("", known).ids.length, 0);
});
