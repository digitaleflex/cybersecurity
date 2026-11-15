// Ouvre « Recherche avancée » avant le premier affichage si l'URL contient un filtre avancé (évite un saut de mise en page).
const params = new URLSearchParams(location.search);
if (["lang", "access", "tag"].some((key) => params.get(key))) document.getElementById("advSearch")?.setAttribute("open", "");
