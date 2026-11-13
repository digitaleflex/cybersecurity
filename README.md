# HashCode Cyber Library

> Une bibliothèque communautaire de ressources pour apprendre, pratiquer, rechercher et approfondir la cybersécurité.

**Projet HashCode** · Maintenu par [Digital E-Flex](https://github.com/digitaleflex) · [Catalogue en ligne](https://github.com/digitaleflex/cybersecurity)

HashCode Cyber Library centralise des ressources sélectionnées : documentation, outils, formations, livres, laboratoires pratiques, communautés et rapports de recherche. Le dépôt référence les ressources originales ; il ne redistribue pas les contenus tiers.

## Explorer la bibliothèque

- [Catalogue principal](CATALOG.md)
- [Parcours d'apprentissage](LEARNING-PATHS.md)
- [Canaux, communautés et plateformes](COMMUNITIES.md)
- [Guide de contribution](CONTRIBUTING.md)
- [Politique de qualité et de sécurité](QUALITY.md)
- [Site statique](index.html)

## Architecture

```text
library/
├── 01-FUNDAMENTALS/
├── 02-OSINT/
├── 03-RED-TEAM/
├── 04-BLUE-TEAM/
├── 05-REVERSE-ENGINEERING/
├── 06-MALWARE-ANALYSIS/
├── 07-CLOUD-SECURITY/
├── 08-APPLICATION-SECURITY/
├── 09-CTF-AND-LABS/
├── 10-COURSES-AND-BOOKS/
├── 11-COMMUNITIES/
└── 12-RESEARCH-AND-REPORTS/
```

Les ressources structurées alimentent le site via `data/resources.json`. Chaque fiche doit pointer vers sa source officielle et inclure son domaine, son type, son niveau, sa langue, son modèle d'accès et sa date de vérification.

## Déploiement

Le site est un projet statique HTML/CSS/JavaScript, sans build obligatoire.

1. Importer ce dépôt dans [Vercel](https://vercel.com/new).
2. Framework Preset : **Other**.
3. Build Command : laisser vide.
4. Output Directory : `.`.
5. Déployer la branche `main`.

Voir [vercel.json](vercel.json) pour les réglages de déploiement.

## Contribuer

Les contributions sont ouvertes via Pull Request. Vérifier les liens, les licences, les conditions d'utilisation et les risques avant de proposer une ressource. Consulter [CONTRIBUTING.md](CONTRIBUTING.md).

**Qualité avant quantité.** Une ressource publique n'est pas automatiquement fiable, sûre, légale à réutiliser ou adaptée à tous les publics.
