// Index des documents Markdown lisibles dans docs.html (liste blanche : seuls ces fichiers peuvent être chargés).
// tests/docs.test.mjs vérifie que chaque fichier .md du dépôt est listé ici et que tous les liens internes se résolvent.
export const DOCUMENTS = [
  { path: "README.md", title: "Présentation", group: "Général" },
  { path: "CATALOG.md", title: "Catalogue", group: "Général" },
  { path: "LEARNING-PATHS.md", title: "Parcours d'apprentissage", group: "Apprentissage" },
  { path: "OSINT-SOURCES.md", title: "Répertoire des sources OSINT", group: "OSINT" },
  { path: "OSINT-TAXONOMY.md", title: "Taxonomie OSINT", group: "OSINT" },
  { path: "QUALITY.md", title: "Qualité & éthique", group: "Gouvernance" },
  { path: "CONTRIBUTING.md", title: "Contribuer au projet", group: "Gouvernance" },
  { path: "CODE_OF_CONDUCT.md", title: "Code de conduite", group: "Gouvernance" },
  { path: "SECURITY.md", title: "Signaler une faille de sécurité", group: "Gouvernance" },
  { path: "data/schema.md", title: "Schéma des ressources", group: "Technique" },

  { path: "library/01-FUNDAMENTALS/README.md", title: "Vue d'ensemble", group: "01 · Fundamentals" },
  { path: "library/01-FUNDAMENTALS/Linux/README.md", title: "Linux", group: "01 · Fundamentals" },
  { path: "library/01-FUNDAMENTALS/Networking/README.md", title: "Networking", group: "01 · Fundamentals" },
  { path: "library/01-FUNDAMENTALS/Security-Basics/README.md", title: "Security Basics", group: "01 · Fundamentals" },

  { path: "library/02-OSINT/README.md", title: "Vue d'ensemble", group: "02 · OSINT" },
  { path: "library/02-OSINT/Digital-Identity/README.md", title: "Digital Identity & Public Footprint", group: "02 · OSINT" },
  { path: "library/02-OSINT/GEOINT/README.md", title: "GEOINT", group: "02 · OSINT" },
  { path: "library/02-OSINT/Google-Dorking/README.md", title: "Google Dorking", group: "02 · OSINT" },
  { path: "library/02-OSINT/Investigation/README.md", title: "Open-Source Investigation", group: "02 · OSINT" },
  { path: "library/02-OSINT/SOCMINT/README.md", title: "SOCMINT", group: "02 · OSINT" },

  { path: "library/03-RED-TEAM/README.md", title: "Vue d'ensemble", group: "03 · Red Team" },
  { path: "library/03-RED-TEAM/Reconnaissance/README.md", title: "Reconnaissance", group: "03 · Red Team" },
  { path: "library/03-RED-TEAM/Pentesting/README.md", title: "Penetration Testing", group: "03 · Red Team" },
  { path: "library/03-RED-TEAM/Web-Security/README.md", title: "Web Security Testing", group: "03 · Red Team" },
  { path: "library/03-RED-TEAM/Active-Directory/README.md", title: "Active Directory", group: "03 · Red Team" },
  { path: "library/03-RED-TEAM/Exploitation/README.md", title: "Exploitation & Validation", group: "03 · Red Team" },

  { path: "library/04-BLUE-TEAM/README.md", title: "Vue d'ensemble", group: "04 · Blue Team" },
  { path: "library/04-BLUE-TEAM/SOC/README.md", title: "SOC", group: "04 · Blue Team" },
  { path: "library/04-BLUE-TEAM/SIEM/README.md", title: "SIEM & Detection Engineering", group: "04 · Blue Team" },
  { path: "library/04-BLUE-TEAM/DFIR/README.md", title: "DFIR", group: "04 · Blue Team" },
  { path: "library/04-BLUE-TEAM/Threat-Hunting/README.md", title: "Threat Hunting", group: "04 · Blue Team" },
  { path: "library/04-BLUE-TEAM/Incident-Response/README.md", title: "Incident Response", group: "04 · Blue Team" },

  { path: "library/05-REVERSE-ENGINEERING/README.md", title: "Vue d'ensemble", group: "05 · Reverse Engineering" },
  { path: "library/06-MALWARE-ANALYSIS/README.md", title: "Vue d'ensemble", group: "06 · Malware Analysis" },
  { path: "library/07-CLOUD-SECURITY/README.md", title: "Vue d'ensemble", group: "07 · Cloud Security" },
  { path: "library/08-APPLICATION-SECURITY/README.md", title: "Vue d'ensemble", group: "08 · Application Security" },
  { path: "library/09-CTF-AND-LABS/README.md", title: "Vue d'ensemble", group: "09 · CTF & Labs" },
  { path: "library/10-COURSES-AND-BOOKS/README.md", title: "Vue d'ensemble", group: "10 · Courses & Books" },
  { path: "library/11-COMMUNITIES/README.md", title: "Vue d'ensemble", group: "11 · Communities" },
  { path: "library/12-RESEARCH-AND-REPORTS/README.md", title: "Vue d'ensemble", group: "12 · Research & Reports" }
];

/** Titre long (pour l'onglet et le fil d'Ariane) : "Linux — 01 · Fundamentals". */
export const docTitle = (doc) => (doc.group.match(/^\d\d ·/) && doc.title !== "Vue d'ensemble" ? `${doc.title} — ${doc.group}` : doc.group.match(/^\d\d ·/) ? `${doc.group}` : doc.title);

/** Chemin du document pour un lien de page : docs.html?doc=… */
export const docURL = (path, hash = "") => `docs?doc=${encodeURIComponent(path)}${hash}`;
