// Coquille commune (barre latérale, barre du haut, pied de page, thème, tiroir mobile).
// S'initialise à l'import ; la page est identifiée par <body data-page="home|catalog|domains|community|docs">.
import { SPRITE } from "./icons.js";
import {
  $, $$, icon, escapeHTML, GITHUB_URL, favorites, loadCatalog, activeResources,
  domainCount, newResourcesCount, catalogueURL
} from "./data.js";

const PAGE = document.body.dataset.page || "";
const THEME_KEY = "hc-theme";

const NAV = [
  { id: "home", href: "./", label: "Accueil", ico: "home" },
  { id: "catalog", href: "catalogue", label: "Catalogue", ico: "catalog", count: "all" },
  { id: "domains", href: "domaines", label: "Domaines", ico: "cube" },
  { id: "osint", href: catalogueURL({ domain: "osint" }), label: "OSINT", ico: "shield-check", count: "osint" },
  { id: "paths", href: "docs?doc=LEARNING-PATHS.md", label: "Parcours", ico: "route", badge: "Nouveau" },
  { id: "collections", href: "./#collections", label: "Collections", ico: "folder" },
  { id: "docs", href: "docs", label: "Guides & Docs", ico: "doc" },
  { id: "community", href: "communaute", label: "Communauté", ico: "users" }
];
const SPACE = [
  { id: "favorites", href: catalogueURL({ view: "favorites" }), label: "Favoris", ico: "star", count: "fav" },
  { id: "recent", href: catalogueURL({ view: "recent" }), label: "Consultés récemment", ico: "clock" },
  { id: "contrib", href: `${GITHUB_URL}/pulls`, label: "Mes contributions", ico: "user", external: true }
];

function activeId() {
  const params = new URLSearchParams(location.search);
  if (PAGE === "catalog") {
    if (params.get("view") === "favorites") return "favorites";
    if (params.get("view") === "recent") return "recent";
    return params.get("domain") === "osint" ? "osint" : "catalog";
  }
  if (PAGE === "docs") return params.get("doc") === "LEARNING-PATHS.md" ? "paths" : "docs";
  return PAGE;
}

const navLink = (item, current) => {
  const on = item.id === current;
  const count = item.count ? `<em class="count" data-count="${item.count}">${item.count === "fav" ? favorites().length : "—"}</em>` : "";
  const badge = item.badge ? `<em class="count count-new">${item.badge}</em>` : "";
  return `<a class="side-link${on ? " is-active" : ""}" href="${escapeHTML(item.href)}" data-nav="${item.id}"${on ? ' aria-current="page"' : ""}${item.external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${icon(item.ico)}<span>${item.label}</span>${count}${badge}${item.external ? icon("external", "ext") : ""}</a>`;
};

function renderSidebar() {
  const current = activeId();
  $("#sidebar").innerHTML = `
    <a class="brand" href="./">
      <img src="assets/logo-mark-96.webp" alt="" width="40" height="40">
      <span class="brand-text"><b>HashCode</b> <small>Cyber <span>Library</span></small></span>
    </a>
    <nav class="side-nav" aria-label="Sections">${NAV.map((i) => navLink(i, current)).join("")}</nav>
    <div class="side-label" id="mySpaceLabel">Mon espace</div>
    <nav class="side-nav" aria-labelledby="mySpaceLabel">${SPACE.map((i) => navLink(i, current)).join("")}</nav>
    <section class="contrib-card" aria-labelledby="contribTitle">
      ${icon("book-plus", "ico-lg")}
      <h2 id="contribTitle">Contribuez à la bibliothèque</h2>
      <p>Ajoutez des ressources, proposez des mises à jour et enrichissez la base.</p>
      <a class="btn btn-primary btn-block" href="${GITHUB_URL}/issues/new/choose" target="_blank" rel="noopener noreferrer">Contribuer ${icon("arrow")}</a>
    </section>
    <div class="side-foot"><button class="icon-btn" type="button" id="themeToggle" aria-label="Passer au thème clair">${icon("sun")}</button></div>`;
}

function renderTopbar() {
  const tab = (id, href, label, extra = "") => `<a class="tab${PAGE === id ? " is-active" : ""}" href="${href}"${PAGE === id ? ' aria-current="page"' : ""}${extra}>${label}</a>`;
  $("#topbar").innerHTML = `
    <button class="icon-btn menu-btn" type="button" id="menuBtn" aria-label="Ouvrir le menu" aria-controls="sidebar" aria-expanded="false">${icon("menu")}</button>
    <a class="brand brand-compact" href="./"><img src="assets/logo-mark-96.webp" alt="" width="32" height="32"><span class="brand-text"><b>HashCode</b></span></a>
    <nav class="tabs" aria-label="Navigation principale">
      ${tab("home", "./", "Explorer")}
      <div class="tab-menu">
        <button class="tab${PAGE === "domains" ? " is-active" : ""}" type="button" id="domainsMenuBtn" aria-expanded="false" aria-controls="domainsMenu" aria-haspopup="true">Domaines ${icon("chev-down")}</button>
        <div class="menu-pop" id="domainsMenu" hidden></div>
      </div>
      <a class="tab${activeId() === "paths" ? " is-active" : ""}" href="docs?doc=LEARNING-PATHS.md">Parcours</a>
      ${tab("catalog", "catalogue", "Ressources")}
      ${tab("community", "communaute", "Communauté")}
    </nav>
    <div class="top-actions">
      <button class="icon-btn" type="button" id="topSearchBtn" aria-label="Rechercher (Ctrl K)">${icon("search")}</button>
      <a class="icon-btn has-badge" href="./#activity" id="bellLink" aria-label="Nouveautés du catalogue">${icon("bell")}<i class="badge-dot" id="bellBadge" hidden></i></a>
      <a class="avatar" href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer" aria-label="HC, dépôt GitHub HashCode">HC</a>
    </div>`;
}

function renderFooter() {
  if (document.body.dataset.footer === "none") return;
  $("main").insertAdjacentHTML("beforeend", `
    <footer class="footer">
      <a class="brand" href="./"><img src="assets/logo-mark-96.webp" alt="" width="30" height="30"><span class="brand-text"><b>HashCode</b> <small>Cyber <span>Library</span></small></span></a>
      <p>Une initiative de partage de connaissances cyber.</p>
      <nav aria-label="Liens utiles"><a href="communaute">Communauté</a><a href="${GITHUB_URL}" target="_blank" rel="noopener noreferrer">GitHub</a><a href="docs?doc=QUALITY.md">Qualité &amp; éthique</a><a href="docs?doc=CONTRIBUTING.md">Contribuer</a><a href="mentions-legales">Mentions légales</a><a href="confidentialite">Confidentialité</a></nav>
      <small>© ${new Date().getFullYear()} HashCode · Digital E-Flex</small>
    </footer>`);
}

/* ---------- thème ---------- */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  const toggle = $("#themeToggle");
  toggle?.querySelector("use")?.setAttribute("href", dark ? "#i-sun" : "#i-moon");
  toggle?.setAttribute("aria-label", dark ? "Passer au thème clair" : "Passer au thème sombre");
  $('meta[name="theme-color"]')?.setAttribute("content", dark ? "#070b0a" : "#f3f7f5");
}

/* ---------- tiroir mobile ---------- */
function setDrawer(open) {
  $("#sidebar").classList.toggle("is-open", open);
  $("#scrim").hidden = !open;
  const btn = $("#menuBtn");
  btn.setAttribute("aria-expanded", String(open));
  btn.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
  if (open) $("#sidebar a, #sidebar button")?.focus();
}
const drawerOpen = () => $("#sidebar").classList.contains("is-open");

/* ---------- recherche rapide ---------- */
function focusSearch() {
  const input = $("[data-search]");
  if (!input) { location.href = "catalogue?focus=1"; return; }
  input.scrollIntoView({ block: "center", behavior: "auto" });
  input.focus();
  input.select();
}

/* ---------- menu Domaines ---------- */
function closeDomainsMenu() {
  $("#domainsMenu").hidden = true;
  $("#domainsMenuBtn").setAttribute("aria-expanded", "false");
}

function bind() {
  $("#themeToggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignoré */ }
  });
  $("#menuBtn").addEventListener("click", () => setDrawer(!drawerOpen()));
  $("#scrim").addEventListener("click", () => setDrawer(false));
  $("#sidebar").addEventListener("click", (e) => { if (e.target.closest("a[href]")) setDrawer(false); });
  $("#topSearchBtn").addEventListener("click", focusSearch);

  $("#domainsMenuBtn").addEventListener("click", () => {
    const menu = $("#domainsMenu");
    const open = menu.hidden;
    menu.hidden = !open;
    $("#domainsMenuBtn").setAttribute("aria-expanded", String(open));
    if (open) menu.querySelector("a")?.focus();
  });
  $("#domainsMenu").addEventListener("keydown", (e) => {
    const items = $$("a", $("#domainsMenu"));
    const i = items.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".tab-menu")) closeDomainsMenu(); });

  document.addEventListener("keydown", (event) => {
    const target = document.activeElement;
    const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    if ((event.key === "k" || event.key === "K") && (event.ctrlKey || event.metaKey)) { event.preventDefault(); focusSearch(); return; }
    if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); focusSearch(); return; }
    if (event.key === "Escape") {
      if (!$("#domainsMenu").hidden) { closeDomainsMenu(); $("#domainsMenuBtn").focus(); return; }
      if (drawerOpen()) { setDrawer(false); $("#menuBtn").focus(); return; }
      if (typing) target.blur();
    }
  });

  // l'URL change sans rechargement (catalogue) : remettre à jour l'élément actif
  const refreshActive = () => {
    const current = activeId();
    $$("[data-nav]").forEach((a) => {
      const on = a.dataset.nav === current;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
  };
  window.addEventListener("hc:urlchange", refreshActive);
  window.addEventListener("hc:favorites", () => {
    const node = $('[data-count="fav"]');
    if (node) node.textContent = favorites().length;
  });
}

async function hydrate() {
  try {
    const catalog = await loadCatalog();
    $$('[data-count="all"]').forEach((n) => { n.textContent = activeResources(catalog).length; });
    $$('[data-count="osint"]').forEach((n) => { n.textContent = domainCount(catalog, "osint"); });
    $("#domainsMenu").innerHTML = `<a href="domaines"><strong>Tous les domaines</strong><small>${catalog.domains.length}</small></a>` +
      catalog.domains.map((d) => `<a href="${escapeHTML(catalogueURL({ domain: d.id }))}">${escapeHTML(d.title)}<small>${domainCount(catalog, d.id)}</small></a>`).join("");
    const news = newResourcesCount(catalog);
    $("#bellBadge").hidden = news === 0;
    if (news) $("#bellLink").setAttribute("aria-label", `Nouveautés du catalogue : ${news} nouvelle${news > 1 ? "s" : ""} ressource${news > 1 ? "s" : ""}`);
  } catch (error) {
    console.error(error);
    $("#domainsMenu").innerHTML = '<a href="domaines">Tous les domaines</a>';
  }
}

document.body.insertAdjacentHTML("afterbegin", SPRITE);
renderSidebar();
renderTopbar();
renderFooter();
applyTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
bind();
hydrate();
