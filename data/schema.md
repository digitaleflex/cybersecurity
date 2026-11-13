# Resource Data Schema

The static website reads `data/resources.json`.

## Required fields
`id`, `title`, `description`, `url`, `domain`, `category`, `type`, `level`, `access`, `language`, `tags`, `source`, `verified`, `status`, `featured`.

## Domain IDs
`fundamentals`, `osint`, `red-team`, `blue-team`, `reverse-engineering`, `malware-analysis`, `cloud-security`, `application-security`, `ctf-labs`, `courses-books`, `communities`, `research-reports`.

## Resource types
`tool`, `course`, `lab`, `documentation`, `repository`, `framework`, `platform`, `community`, `report`, `library`, `directory`.

## Skill levels
- `beginner`
- `intermediate`
- `advanced`
- `professional`

## Access values
Use concise, factual values such as `free`, `freemium`, `paid`, `open-source`, or `mixed`. Do not label a resource open source without checking its license.

## Status values
- `verified`: canonical URL and essential metadata have been checked.
- `needs-review`: entry is proposed but requires curator validation.
- `archived`: historical resource retained for reference.
- `removed`: withdrawn from the public catalog.

## Verification discipline
`verified` is the date of the last human check in ISO `YYYY-MM-DD` format. A `needs-review` entry must not be presented as fully verified. Recheck access, license, language, maintenance and scope before changing it to `verified`.
