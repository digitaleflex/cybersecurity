import { readFileSync } from "node:fs";
import { validateCatalog } from "../js/resource-schema.js";

const data = JSON.parse(readFileSync(new URL("../data/resources.json", import.meta.url), "utf8"));
const errors = validateCatalog(data);

if (errors.length) {
  console.error(`Catalog validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Catalog valid: ${data.resources.length} resources, ${data.domains.length} domains, no duplicate IDs or URLs.`);
