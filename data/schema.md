# Resource Data Schema

The static website reads `data/resources.json`.

## Required fields
`id`, `title`, `description`, `url`, `domain`, `category`, `type`, `level`, `access`, `language`, `tags`, `source`, `verified`, `status` and `featured`.

## Domain IDs
`fundamentals`, `osint`, `red-team`, `blue-team`, `reverse-engineering`, `malware-analysis`, `cloud-security`, `application-security`, `ctf-labs`, `courses-books`, `communities`, `research-reports`.

## Resource types
`tool`, `course`, `lab`, `documentation`, `repository`, `framework`, `platform`, `community`, `report`, `library`, `directory`, `database`.

## Skill levels
`beginner`, `intermediate`, `advanced`, `professional`.

## Status and dates
- `verified`: the canonical URL and essential metadata have been checked by a maintainer. `verified` must contain an ISO `YYYY-MM-DD` date.
- `needs-review`: proposed entry pending human validation. Set `verified` to `null` and record its catalog entry date in `added`.
- `archived`: historical resource retained for reference.
- `removed`: withdrawn from the public catalog.

Never use the catalog entry date as a verification date. Check access, license, language, maintenance and scope before changing `needs-review` to `verified`.

## Machine-readable schemas
- [`resources.schema.json`](resources.schema.json) — JSON Schema (2020-12) of one resource. Reference it from an editor with `"$schema"` for autocompletion. `js/resource-schema.js` holds the same rules for the validator, the tests and the contribution form; `tests/schema.test.mjs` guarantees both stay equivalent.
- Optional field `license` (free text or SPDX identifier) may be added once it has been checked. Unknown fields are rejected.

## Link health (`health.json`)
`data/health.json` is **generated** by `npm run health` (`scripts/check-links.mjs --health`): never edit it by hand. It records, per active resource, the result of the last link check:

| State | Meaning |
|---|---|
| `ok` | The URL answers. |
| `redirect` | The address now redirects to another site: review the canonical URL. |
| `blocked` | The site refuses robots (HTTP 401/403/429): check by hand. |
| `unreachable` | Server or network error, possibly temporary. |
| `broken` | Not found (404/410) or domain does not exist. |

The file is described by [`health.schema.json`](health.schema.json). The weekly workflow `link-check.yml` produces a fresh copy as an artifact; commit it to update the public « État du catalogue » page.
