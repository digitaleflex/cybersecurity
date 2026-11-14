// Le schéma JSON officiel (data/resources.schema.json) et les règles de js/resource-schema.js doivent rester équivalents.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import {
  TYPES,
  LEVELS,
  STATUSES,
  ACCESS,
  LANGUAGES,
  REQUIRED_FIELDS,
  HEALTH_STATES,
  validateResource,
  validateHealth
} from "../js/resource-schema.js";

const read = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"));
const catalog = read("data/resources.json");
const resourceSchema = read("data/resources.schema.json");
const healthSchema = read("data/health.schema.json");
const health = read("data/health.json");
const domainIds = catalog.domains.map((d) => d.id);

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateBySchema = ajv.compile(resourceSchema);
const validateHealthBySchema = ajv.compile(healthSchema);

const base = () => structuredClone(catalog.resources.find((r) => r.status === "needs-review"));

test("les listes de valeurs du schéma JSON sont celles de js/resource-schema.js", () => {
  const props = resourceSchema.properties;
  assert.deepEqual(props.type.enum, TYPES);
  assert.deepEqual(props.level.enum, LEVELS);
  assert.deepEqual(props.status.enum, STATUSES);
  assert.deepEqual(props.access.enum, ACCESS);
  assert.deepEqual(props.language.items.enum, LANGUAGES);
  assert.deepEqual(props.domain.enum, domainIds);
  assert.deepEqual([...resourceSchema.required].sort(), [...REQUIRED_FIELDS, "verified"].sort());
  assert.deepEqual(healthSchema.properties.results.additionalProperties.properties.health.enum, HEALTH_STATES);
});

test("toutes les fiches du catalogue sont valides pour le schéma JSON et pour les règles JavaScript", () => {
  for (const resource of catalog.resources) {
    assert.ok(validateBySchema(resource), `${resource.id} : ${ajv.errorsText(validateBySchema.errors)}`);
    assert.deepEqual(validateResource(resource, { domainIds }), [], resource.id);
  }
});

test("les deux validateurs acceptent et refusent exactement les mêmes fiches", () => {
  const cases = {
    "fiche valide": () => {},
    "fiche vérifiée avec date": (r) => {
      r.status = "verified";
      r.verified = "2026-11-14";
    },
    "vérifiée sans date": (r) => {
      r.status = "verified";
      r.verified = null;
    },
    "à vérifier avec une date": (r) => {
      r.verified = "2026-11-14";
    },
    archivée: (r) => {
      r.status = "archived";
    },
    "licence renseignée": (r) => {
      r.license = "MIT";
    },
    "licence vide": (r) => {
      r.license = "";
    },
    "champ inconnu": (r) => {
      r.surprise = 1;
    },
    "identifiant invalide": (r) => {
      r.id = "Mauvais ID";
    },
    "URL non http": (r) => {
      r.url = "ftp://exemple.org/";
    },
    "URL invalide": (r) => {
      r.url = "pas une url";
    },
    "domaine inconnu": (r) => {
      r.domain = "inconnu";
    },
    "type inconnu": (r) => {
      r.type = "gadget";
    },
    "niveau inconnu": (r) => {
      r.level = "dieu";
    },
    "accès inconnu": (r) => {
      r.access = "gratuit";
    },
    "langue inconnue": (r) => {
      r.language = ["klingon"];
    },
    "langues pas un tableau": (r) => {
      r.language = "fr";
    },
    "tags pas un tableau": (r) => {
      r.tags = "osint";
    },
    "tag vide": (r) => {
      r.tags = ["osint", " "];
    },
    "date d'ajout invalide": (r) => {
      r.added = "14/11/2026";
    },
    "featured non booléen": (r) => {
      r.featured = "oui";
    },
    ...Object.fromEntries(
      REQUIRED_FIELDS.map((field) => [
        `champ « ${field} » absent`,
        (r) => {
          delete r[field];
        }
      ])
    ),
    "champ « verified » absent": (r) => {
      delete r.verified;
    }
  };
  const problems = [];
  for (const [name, mutate] of Object.entries(cases)) {
    const resource = base();
    mutate(resource);
    const bySchema = validateBySchema(resource);
    const byRules = validateResource(resource, { domainIds }).length === 0;
    if (bySchema !== byRules) problems.push(`${name} : schéma=${bySchema} règles=${byRules}`);
  }
  assert.deepEqual(problems, []);
});

test("data/health.json respecte son schéma et ne cite que des ressources du catalogue", () => {
  assert.ok(validateHealthBySchema(health), ajv.errorsText(validateHealthBySchema.errors));
  assert.deepEqual(
    validateHealth(
      health,
      catalog.resources.map((r) => r.id)
    ),
    []
  );
  const active = catalog.resources.filter((r) => !["archived", "removed"].includes(r.status));
  assert.equal(Object.keys(health.results).length, active.length, "une entrée de santé par ressource active");
});

test("validateHealth signale les états inconnus, les ressources inconnues et les dates invalides", () => {
  const errors = validateHealth(
    { version: 2, checked: "hier", results: { "n-existe-pas": { health: "ok" }, [catalog.resources[0].id]: { health: "magique" } } },
    [catalog.resources[0].id]
  );
  assert.equal(errors.length, 4);
});
