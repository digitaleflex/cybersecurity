// Applique le thème enregistré avant le premier affichage (évite le flash). Fichier séparé : la CSP interdit les scripts en ligne.
try {
  const theme = localStorage.getItem("hc-theme");
  if (theme === "light" || theme === "dark") document.documentElement.dataset.theme = theme;
} catch { /* stockage indisponible : thème sombre par défaut */ }
