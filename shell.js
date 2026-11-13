// Comportements communs du shell (pages sans app.js) : thème et tiroir mobile.
(() => {
  const $ = (s) => document.querySelector(s);
  const toggle = $("#themeToggle");
  const sidebar = $("#sidebar");
  const scrim = $("#scrim");
  const menuBtn = $("#menuBtn");

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === "dark";
    toggle?.querySelector("use")?.setAttribute("href", dark ? "#i-sun" : "#i-moon");
    toggle?.setAttribute("aria-label", dark ? "Passer au thème clair" : "Passer au thème sombre");
    $('meta[name="theme-color"]')?.setAttribute("content", dark ? "#070b0a" : "#f3f7f5");
  }
  applyTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  toggle?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("hc-theme", next); } catch { /* ignoré */ }
  });

  function setOpen(open) {
    sidebar.classList.toggle("is-open", open);
    scrim.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    if (open) sidebar.querySelector("a, button")?.focus();
  }
  menuBtn?.addEventListener("click", () => setOpen(!sidebar.classList.contains("is-open")));
  scrim?.addEventListener("click", () => setOpen(false));
  sidebar?.addEventListener("click", (e) => { if (e.target.closest("a[href]")) setOpen(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("is-open")) { setOpen(false); menuBtn.focus(); }
  });
})();
