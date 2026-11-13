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
