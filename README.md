# HashCode Cyber Library

> A curated, community-maintained library for cybersecurity, OSINT, security engineering and digital investigations.

**HashCode project** · Maintained by [HashCode](https://github.com/digitaleflex) and [Digital E-Flex](https://github.com/digitaleflex).

HashCode Cyber Library brings together documentation, tools, courses, books, labs, communities and research reports. This repository links to original publishers; it does not redistribute third-party content.

**Initial catalog: 84 entries across 12 domains.** All 84 entries are marked `needs-review` until a maintainer validates their canonical URL, license, access model and metadata. No resource is presented as verified before that review. The website visibly labels pending entries.

## Explore
- [Central catalog](CATALOG.md)
- [Learning paths](LEARNING-PATHS.md)
- [Communities & platforms](library/11-COMMUNITIES/README.md)
- [Contribution guide](CONTRIBUTING.md)
- [Quality & safety policy](QUALITY.md)
- [Resource data](data/resources.json)
- [Website](index.html)

## Twelve domains
1. [Fundamentals](library/01-FUNDAMENTALS/README.md) — Linux, networking, security basics.
2. [OSINT](library/02-OSINT/README.md) — SOCMINT, GEOINT, Google Dorking, digital identity, investigations.
3. [Red Team](library/03-RED-TEAM/README.md) — reconnaissance, pentesting, Web, Active Directory, exploitation.
4. [Blue Team](library/04-BLUE-TEAM/README.md) — SOC, SIEM, DFIR, threat hunting, incident response.
5. [Reverse Engineering](library/05-REVERSE-ENGINEERING/README.md).
6. [Malware Analysis](library/06-MALWARE-ANALYSIS/README.md).
7. [Cloud Security](library/07-CLOUD-SECURITY/README.md).
8. [Application Security](library/08-APPLICATION-SECURITY/README.md).
9. [CTF & Labs](library/09-CTF-AND-LABS/README.md).
10. [Courses & Books](library/10-COURSES-AND-BOOKS/README.md).
11. [Communities](library/11-COMMUNITIES/README.md).
12. [Research & Reports](library/12-RESEARCH-AND-REPORTS/README.md).

## Catalog validation

Run `npm run validate:catalog` with Node.js 22 or later to check required fields, domains, types, levels, statuses, dates and duplicate IDs/URLs. The same validation runs automatically on relevant pull requests.

## Local development

Requirements: Node.js 22 or later. No package installation is required.

```bash
npm run dev
```

Open `http://localhost:4173`. The local server uses Node.js built-ins only.

## Quality checks

```bash
npm test
npm run validate:catalog
```

Both checks also run in GitHub Actions when the catalog or application files change.

## Website deployment on Vercel
This is a static HTML/CSS/JavaScript website; no framework build is required.
- Import this repository in Vercel.
- Framework Preset: **Other**.
- Build Command: empty.
- Output Directory: `.`.
- Deploy branch: `main` after merging the library pull request.

## Curation principles
Every resource should have a canonical URL, clear scope, resource type, skill level, access model, language and verification date. See [CONTRIBUTING.md](CONTRIBUTING.md).

Use tools and labs only within authorized scope. Respect privacy, platform terms, licenses and applicable laws. Quality before quantity.
