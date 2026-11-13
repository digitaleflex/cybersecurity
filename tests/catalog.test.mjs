import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const catalog = JSON.parse(await readFile(new URL("../data/resources.json", import.meta.url), "utf8"));

test("catalog contains resources and twelve domains", () => {
  assert.ok(catalog.resources.length > 0);
  assert.equal(catalog.domains.length, 12);
});

test("resource IDs and URLs are unique", () => {
  const ids = catalog.resources.map((item) => item.id);
  const urls = catalog.resources.map((item) => item.url);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(urls).size, urls.length);
});

test("every resource references a known domain and a safe web URL", () => {
  const domains = new Set(catalog.domains.map((item) => item.id));
  for (const resource of catalog.resources) {
    assert.ok(domains.has(resource.domain), `Unknown domain for ${resource.id}`);
    assert.ok(["http:", "https:"].includes(new URL(resource.url).protocol), `Unsafe URL for ${resource.id}`);
  }
});

test("pending resources are never marked as verified", () => {
  for (const resource of catalog.resources) {
    if (resource.status === "needs-review") assert.equal(resource.verified, null);
  }
});
