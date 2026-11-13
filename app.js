const DATA_URL = "./data/resources.json";
const PAGE_SIZE = 9;

const state = {
  resources: [],
  domains: [],
  osintCategories: [],
  visible: PAGE_SIZE,
  query: "",
  domain: "",
  category: "",
  type: "",
  level: "",
  status: "",
  sort: "featured"
};

const $ = (selector) => document.querySelector(selector);

const TYPE_LABELS = {
  tool: "Outil", course: "Formation", lab: "Laboratoire",
  documentation: "Documentation", repository: "Dépôt GitHub",
  framework: "Framework", platform: "Plateforme", community: "Communauté",
  report: "Rapport", library: "Bibliothèque", directory: "Annuaire"
};
const STATUS_LABELS = {
  verified: "Vérifié", "needs-review": "À vérifier"
};
const LEVEL_LABELS = {
  beginner: "Débutant", intermediate: "Intermédiaire",
  advanced: "Avancé", professional: "Professionnel"
};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function safeExternalURL(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function normalizeText(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr");
}

function getDomain(domainId) {
  return state.domains.find((domain) => domain.id === domainId);
}

function populateFilters() {
  const domainFilter = $("#domainFilter");
  state.domains.forEach((domain) => domainFilter.add(new Option(domain.title, domain.id)));
  populateCategoryFilter();

  [...new Set(state.resources.map((resource) => resource.type))]
    .sort()
    .forEach((type) => $("#typeFilter").add(new Option(TYPE_LABELS[type] || type, type)));

  Object.entries(LEVEL_LABELS).forEach(([value, label]) => {
    $("#levelFilter").add(new Option(label, value));
  });

  Object.entries(STATUS_LABELS).forEach(([value, label]) => {
    $("#statusFilter").add(new Option(label, value));
  });
}

function populateCategoryFilter() {
  const filter = $("#categoryFilter");
  if (!filter) return;
  const current = state.category;
  filter.replaceChildren(new Option("Toutes les catégories", ""));

  const activeResources = state.resources.filter((resource) =>
    !["archived", "removed"].includes(resource.status)
  );
  const showOsintTaxonomy = !state.domain || state.domain === "osint";

  if (showOsintTaxonomy && state.osintCategories.length) {
    const families = [...new Set(state.osintCategories.map((category) => category.family))];
    families.forEach((family) => {
      const familyCategories = state.osintCategories.filter((category) => category.family === family);
      const familyGroup = document.createElement("optgroup");
      familyGroup.label = family;
      familyCategories.forEach((category) => {
        const count = activeResources.filter((resource) =>
          resource.domain === "osint" && (resource.osintCategories || []).includes(category.code)
        ).length;
        const option = new Option(`${category.code} — ${count} ressource(s)`, category.code);
        option.title = category.description || category.family;
        familyGroup.append(option);
      });
      filter.add(familyGroup);
    });
  }

  const otherResources = activeResources.filter((resource) =>
    resource.domain !== "osint" && (!state.domain || resource.domain === state.domain)
  );
  const otherCategories = [...new Set(otherResources.map((resource) => resource.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "fr"));
  if (otherCategories.length) {
    const otherGroup = document.createElement("optgroup");
    otherGroup.label = "Autres domaines";
    otherCategories.forEach((category) => {
      const count = otherResources.filter((resource) => resource.category === category).length;
      otherGroup.append(new Option(`${category} — ${count}`, category));
    });
    filter.add(otherGroup);
  }

  const validValues = [...state.osintCategories.map((category) => category.code), ...otherCategories];
  filter.value = validValues.includes(current) ? current : "";
  state.category = filter.value;
}

function updateStats() {
  $("#statResources").textContent = state.resources.length.toString();
  $("#heroResourceCount").textContent = state.resources.length.toString();
  const sideCount = $("#sideResourceCount"); if (sideCount) sideCount.textContent = state.resources.length.toString();
  const categoryStat = $("#statCategories"); if (categoryStat) categoryStat.textContent = state.osintCategories.length.toString();
  $("#statDomains").textContent = state.domains.length.toString().padStart(2, "0");
  const typesStat = $("#statTypes");
  if (typesStat) typesStat.textContent = new Set(state.resources.map((resource) => resource.type)).size.toString();
  const pendingStat = $("#statPending");
  if (pendingStat) pendingStat.textContent = state.resources.filter((resource) => resource.status === "needs-review").length.toString();
}

function renderDomains() {
  const grid = $("#domainGrid");
  grid.innerHTML = state.domains.map((domain) => {
    const count = state.resources.filter((resource) => resource.domain === domain.id && resource.status !== "archived" && resource.status !== "removed").length;
    return `<button class="domain-card" type="button" data-domain="${escapeHTML(domain.id)}">
      <span class="domain-number">${escapeHTML(domain.number || String(state.domains.indexOf(domain) + 1).padStart(2, "0"))} / 12</span>
      <h3>${escapeHTML(domain.title)}</h3><p>${escapeHTML(domain.description)}</p>
      <span class="domain-count">${count} ressource${count > 1 ? "s" : ""}</span>
    </button>`;
  }).join("");

  grid.querySelectorAll("[data-domain]").forEach((button) => {
    button.addEventListener("click", () => {
      state.domain = button.dataset.domain;
      state.category = "";
      $("#domainFilter").value = state.domain;
      populateCategoryFilter();
      state.visible = PAGE_SIZE;
      renderResources();
      $("#explore").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function getFilteredResources() {
  const query = normalizeText(state.query.trim());
  const resources = state.resources.filter((resource) => {
    if (["archived", "removed"].includes(resource.status)) return false;
    if (state.domain && resource.domain !== state.domain) return false;
    if (state.category) {
      const matchesOsintCategory = resource.domain === "osint" &&
        (resource.osintCategories || []).includes(state.category);
      const matchesOtherCategory = resource.domain !== "osint" && resource.category === state.category;
      if (!matchesOsintCategory && !matchesOtherCategory) return false;
    }
    if (state.type && resource.type !== state.type) return false;
    if (state.level && resource.level !== state.level) return false;
    if (state.status && resource.status !== state.status) return false;

    const domain = getDomain(resource.domain);
    const searchable = [
      resource.title, resource.description, resource.category, resource.source,
      resource.domain, domain?.title, resource.access,
      ...(resource.tags || []), ...(resource.osintCategories || []), ...(resource.language || [])
    ].join(" ");
    const normalizedSearchable = normalizeText(searchable);

    return !query || normalizedSearchable.includes(query);
  });

  resources.sort((a, b) => {
    if (state.sort === "az") return a.title.localeCompare(b.title, "fr");
    if (state.sort === "za") return b.title.localeCompare(a.title, "fr");
    if (state.sort === "newest") return String(b.added || b.verified || "").localeCompare(String(a.added || a.verified || ""));
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.title.localeCompare(b.title, "fr");
  });

  return resources;
}

function resourceCard(resource) {
  const domain = getDomain(resource.domain);
  const url = safeExternalURL(resource.url);
  const type = TYPE_LABELS[resource.type] || resource.type;
  const level = LEVEL_LABELS[resource.level] || resource.level;
  const status = STATUS_LABELS[resource.status] || "Statut inconnu";
  const access = resource.access === "free" ? "Gratuit" : resource.access === "paid" ? "Payant" : resource.access === "freemium" ? "Freemium" : resource.access;
  const languages = (resource.language || []).slice(0, 2).map((language) => language.toUpperCase()).join(" · ");
  const categoryLabel = resource.domain === "osint" && resource.osintCategories?.length
    ? resource.osintCategories.join(" · ") : resource.category;
  const tags = (resource.tags || []).slice(0, 3);

  return `<article class="resource-card">
    <div class="card-topline">
      <span class="resource-type">${escapeHTML(type)}</span>
      <span class="resource-level">${escapeHTML(level)}</span>
      <span class="resource-status status-${escapeHTML(resource.status)}">${escapeHTML(status)}</span>
    </div>
    <h3>${escapeHTML(resource.title)} ${resource.featured ? '<span class="featured-mark" aria-label="Sélection HashCode">✦</span>' : ""}</h3>
    <p>${escapeHTML(resource.description)}</p>
    <div class="resource-tags">${tags.map((tag) => `<span>#${escapeHTML(tag)}</span>`).join("")}</div>
    <div class="card-footer">
      <span class="card-domain">${escapeHTML(domain?.title || resource.domain)} · ${escapeHTML(categoryLabel)}<small>${escapeHTML([access, languages].filter(Boolean).join(" / "))}</small></span>
      ${url ? `<a class="card-open" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir ${escapeHTML(resource.title)} dans un nouvel onglet">↗</a>` : '<span class="card-open card-unavailable" title="URL invalide">—</span>'}
    </div>
  </article>`;
}

function renderResources() {
  const filtered = getFilteredResources();
  const visible = filtered.slice(0, state.visible);

  $("#resultsCount").textContent = `${filtered.length} ressource${filtered.length > 1 ? "s" : ""} trouvée${filtered.length > 1 ? "s" : ""}`;
  $("#resourceGrid").innerHTML = visible.map(resourceCard).join("");
  $("#emptyState").hidden = filtered.length !== 0;
  $("#loadMore").hidden = state.visible >= filtered.length || filtered.length === 0;
}

function resetFilters() {
  Object.assign(state, { query: "", domain: "", category: "", type: "", level: "", status: "", sort: "featured", visible: PAGE_SIZE });
  $("#searchInput").value = "";
  $("#domainFilter").value = "";
  populateCategoryFilter();
  $("#typeFilter").value = "";
  $("#levelFilter").value = "";
  $("#statusFilter").value = "";
  $("#sortFilter").value = "featured";
  renderResources();
}

function bindEvents() {
  $("#searchInput").addEventListener("input", (event) => {
    state.query = event.target.value;
    state.visible = PAGE_SIZE;
    renderResources();
  });

  const filters = [
    ["#domainFilter", "domain"], ["#categoryFilter", "category"], ["#typeFilter", "type"],
    ["#levelFilter", "level"], ["#statusFilter", "status"],
    ["#sortFilter", "sort"]
  ];

  filters.forEach(([selector, key]) => {
    $(selector).addEventListener("change", (event) => {
      state[key] = event.target.value;
      if (key === "domain") {
        state.category = "";
        populateCategoryFilter();
      }
      state.visible = PAGE_SIZE;
      renderResources();
    });
  });

  $("#resetFilters").addEventListener("click", resetFilters);
  $("#emptyReset").addEventListener("click", resetFilters);
  $("#loadMore").addEventListener("click", () => {
    state.visible += PAGE_SIZE;
    renderResources();
  });

  document.addEventListener("keydown", (event) => {
    const target = document.activeElement;
    const isTyping = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
    if (event.key === "/" && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      $("#searchInput").focus();
    }
    if (event.key === "Escape") $("#searchInput").blur();
  });

  const quickSearch = $("#quickSearch");\n  if (quickSearch) quickSearch.addEventListener("input", () => {\n    $("#searchInput").value = quickSearch.value;\n    $("#searchInput").dispatchEvent(new Event("input", { bubbles: true }));\n  });\n\n  document.querySelectorAll("[data-query]").forEach((button) => button.addEventListener("click", () => {
    $("#searchInput").value = button.dataset.query;\n    if (quickSearch) quickSearch.value = button.dataset.query;\n    state.query = button.dataset.query; state.visible = PAGE_SIZE; renderResources(); $("#explore").scrollIntoView({ behavior: "smooth" });
  }));
  const focusSearch = $("#focusSearch"); if (focusSearch) focusSearch.addEventListener("click", () => { $("#searchInput").focus(); $("#explore").scrollIntoView({ behavior: "smooth" }); });

  $("#menuToggle").addEventListener("click", () => {
    const nav = $("#primaryNav");
    const isOpen = nav.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(isOpen));
    $("#menuToggle").setAttribute("aria-label", isOpen ? "Fermer le menu" : "Ouvrir le menu");
  });

  $("#primaryNav").querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      $("#primaryNav").classList.remove("open");
      $("#menuToggle").setAttribute("aria-expanded", "false");
      $("#menuToggle").setAttribute("aria-label", "Ouvrir le menu");
    });
  });
}

async function init() {
  bindEvents();
  $("#currentYear").textContent = new Date().getFullYear();

  try {
    const [response, taxonomyResponse] = await Promise.all([
      fetch(DATA_URL, { headers: { Accept: "application/json" } }),
      fetch("./data/osint-categories.json", { headers: { Accept: "application/json" } })
    ]);
    if (!response.ok) throw new Error(`Chargement du catalogue impossible (HTTP ${response.status})`);
    if (!taxonomyResponse.ok) throw new Error(`Chargement de la taxonomie OSINT impossible (HTTP ${taxonomyResponse.status})`);

    const [data, taxonomy] = await Promise.all([response.json(), taxonomyResponse.json()]);
    if (!Array.isArray(data.resources) || !Array.isArray(data.domains) || !Array.isArray(taxonomy.categories)) {
      throw new Error("Le format de data/resources.json est invalide.");
    }

    state.resources = data.resources;
    state.domains = data.domains;
    state.osintCategories = taxonomy.categories;
    updateStats();
    populateFilters();
    renderDomains();
    renderResources();
  } catch (error) {
    console.error(error);
    $("#resultsCount").textContent = "Catalogue indisponible";
    $("#resourceGrid").innerHTML = '<div class="load-error"><strong>Impossible de charger les ressources.</strong><p>Vérifie le fichier data/resources.json puis recharge la page.</p></div>';
    $("#statResources").textContent = "—";
  }
}

document.addEventListener("DOMContentLoaded", init);
