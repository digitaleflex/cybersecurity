import { readFileSync } from "node:fs";

const file = new URL("../data/resources.json", import.meta.url);
const data = JSON.parse(readFileSync(file, "utf8"));
const domainIds = new Set((data.domains ?? []).map((domain) => domain.id));
const allowedTypes = new Set(["tool", "course", "lab", "documentation", "repository", "framework", "platform", "community", "report", "library", "directory", "database"]);
const allowedLevels = new Set(["beginner", "intermediate", "advanced", "professional"]);
const allowedStatuses = new Set(["verified", "needs-review", "archived", "removed"]);
const required = ["id", "title", "description", "url", "domain", "category", "type", "level", "access", "language", "tags", "source", "status", "featured"];
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const errors = [];
const ids = new Set();
const urls = new Set();

for (const [index, resource] of (data.resources ?? []).entries()) {
  const label = resource.id || `entry #${index + 1}`;
  for (const key of required) {
    if (resource[key] === undefined || resource[key] === null || resource[key] === "") errors.push(`${label}: missing ${key}`);
  }
  if (!Object.hasOwn(resource, "verified")) errors.push(`${label}: missing verified field`);
  if (ids.has(resource.id)) errors.push(`${label}: duplicate id`);
  ids.add(resource.id);
  if (urls.has(resource.url)) errors.push(`${label}: duplicate URL`);
  urls.add(resource.url);
  try {
    const url = new URL(resource.url);
    if (!["http:", "https:"].includes(url.protocol)) errors.push(`${label}: unsupported URL protocol`);
  } catch {
    errors.push(`${label}: invalid URL`);
  }
  if (!domainIds.has(resource.domain)) errors.push(`${label}: unknown domain ${resource.domain}`);
  if (!allowedTypes.has(resource.type)) errors.push(`${label}: unsupported type ${resource.type}`);
  if (!allowedLevels.has(resource.level)) errors.push(`${label}: unsupported level ${resource.level}`);
  if (!allowedStatuses.has(resource.status)) errors.push(`${label}: unsupported status ${resource.status}`);
  if (resource.status === "verified" && !datePattern.test(resource.verified ?? "")) errors.push(`${label}: verified resources need a YYYY-MM-DD verification date`);
  if (resource.status === "needs-review" && resource.verified !== null) errors.push(`${label}: needs-review resources must have verified=null`);
  if (resource.added && !datePattern.test(resource.added)) errors.push(`${label}: added must use YYYY-MM-DD`);
  if (!Array.isArray(resource.language) || !Array.isArray(resource.tags)) errors.push(`${label}: language and tags must be arrays`);
}

if (errors.length) {
  console.error(`Catalog validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Catalog valid: ${data.resources.length} resources, ${data.domains.length} domains, no duplicate IDs or URLs.`);
