// Page Contribuer : formulaire vérifié dans le navigateur, détection des doublons, ticket GitHub pré-rempli.
import "./shell.js";
import {
  $, $$, escapeHTML, loadCatalog, categoriesOf, catalogueURL, icon,
  TYPE_LABELS, LEVEL_LABELS, ACCESS_LABELS, LANG_LABELS, SENSITIVE_DOMAINS
} from "./data.js";
import { findDuplicates, buildResource, validateDraft, buildIssueURL } from "./contribution.js";
import { TYPES, LEVELS, ACCESS, LANGUAGES } from "./resource-schema.js";

const FIELDS = ["title", "url", "domain", "type", "level", "access", "category", "language", "description", "safety"];
const touched = new Set();
let catalog;
let domainIds = [];
let takenIds = [];
let submitted = false; // après un clic sur « Ouvrir le ticket », toutes les erreurs restent visibles

const today = () => new Date().toISOString().slice(0, 10);
const field = (id) => $(`#f-${id}`);

function fillSelect(select, entries) {
  select.append(...entries.map(([value, label]) => new Option(label, value)));
}

function readValues() {
  return {
    title: field("title").value,
    url: field("url").value,
    domain: field("domain").value,
    type: field("type").value,
    level: field("level").value,
    access: field("access").value,
    category: field("category").value,
    language: $$("#langBoxes input:checked").map((box) => box.value),
    tags: field("tags").value,
    description: field("description").value,
    evidence: field("evidence").value,
    source: ""
  };
}

function labelsFor(values) {
  return {
    domain: catalog.domains.find((d) => d.id === values.domain)?.title ?? "",
    type: TYPE_LABELS[values.type] ?? "",
    level: LEVEL_LABELS[values.level] ?? "",
    access: ACCESS_LABELS[values.access] ?? "",
    language: values.language.length > 1 ? LANG_LABELS.multi : LANG_LABELS[values.language[0]] ?? ""
  };
}

function renderDuplicates(values) {
  const panel = $("#dupPanel");
  if (!values.url.trim() && values.title.trim().length < 4) { panel.hidden = true; return false; }
  const found = findDuplicates(catalog.resources, { url: values.url, title: values.title });
  const link = (r) => `<a href="${escapeHTML(catalogueURL({ q: r.title }))}">${escapeHTML(r.title)}</a>${r.status === "archived" ? " (archivée)" : ""}`;
  const parts = [];
  if (found.exact.length) parts.push(`<p class="dup dup-exact">${icon("x")}<span><strong>Cette adresse est déjà au catalogue :</strong> ${found.exact.map(link).join(", ")}. Inutile de la proposer à nouveau — pour la corriger, utilise plutôt « Corriger une fiche » ci-dessous.</span></p>`);
  if (found.sameHost.length) parts.push(`<p class="dup">${icon("link")}<span><strong>Ce site est déjà référencé :</strong> ${found.sameHost.slice(0, 3).map(link).join(", ")}. Vérifie qu'il s'agit bien d'une ressource différente.</span></p>`);
  if (found.similarTitle.length) parts.push(`<p class="dup">${icon("search")}<span><strong>Un nom proche existe :</strong> ${found.similarTitle.slice(0, 3).map(link).join(", ")}.</span></p>`);
  panel.innerHTML = parts.join("");
  panel.hidden = parts.length === 0;
  return found.exact.length > 0;
}

function refresh({ showAll = false } = {}) {
  if (showAll) submitted = true;
  const values = readValues();
  const errors = validateDraft(values, { domainIds, takenIds, today: today() });
  if (!field("safety").checked) errors.safety = "Confirme l'usage responsable pour continuer.";
  const duplicate = renderDuplicates(values);
  if (duplicate) errors.form = "Cette ressource est déjà au catalogue.";

  for (const key of [...FIELDS, "form"]) {
    const node = $(`#e-${key}`);
    if (!node) continue;
    const show = key === "form" ? Boolean(errors.form) : submitted || touched.has(key);
    node.textContent = show && errors[key] ? errors[key] : "";
    const input = key === "language" ? null : field(key);
    if (input) input.setAttribute("aria-invalid", String(Boolean(show && errors[key])));
  }
  $("#descCount").textContent = values.description.trim().replace(/\s+/g, " ").length;
  $("#formNotice").hidden = !SENSITIVE_DOMAINS.includes(values.domain);

  const ready = Object.keys(errors).length === 0;
  const issue = $("#issueBtn");
  issue.setAttribute("aria-disabled", String(!ready));
  $("#copyBtn").disabled = !ready;
  const preview = $("#jsonDetails");
  if (ready) {
    issue.href = buildIssueURL(values, labelsFor(values));
    $("#jsonPreview").textContent = JSON.stringify(buildResource(values, { today: today(), takenIds }), null, 2);
    preview.hidden = false;
  } else {
    issue.href = "#formulaire";
    preview.hidden = true;
  }
  return { errors, ready, values };
}

function refreshCategories() {
  const names = categoriesOf(catalog, field("domain").value).map(([name]) => name);
  $("#categoryList").replaceChildren(...names.map((name) => Object.assign(document.createElement("option"), { value: name })));
}

async function copyJSON() {
  const { ready, values } = refresh({ showAll: true });
  if (!ready) return;
  const json = JSON.stringify(buildResource(values, { today: today(), takenIds }), null, 2);
  const status = $("#copyStatus");
  try {
    await navigator.clipboard.writeText(json);
    status.textContent = "Fiche copiée dans le presse-papiers.";
  } catch {
    $("#jsonDetails").open = true;
    $("#jsonPreview").focus();
    status.textContent = "Copie automatique impossible : sélectionne l'aperçu ci-dessous.";
  }
  setTimeout(() => { status.textContent = ""; }, 4000);
}

async function init() {
  try {
    catalog = await loadCatalog();
  } catch (error) {
    console.error(error);
    $("#formTitle").insertAdjacentHTML("afterend", '<p class="err err-form" role="alert">Le catalogue est indisponible : la détection des doublons est désactivée. Utilise un ticket GitHub ou le groupe WhatsApp.</p>');
    $("#resourceForm").hidden = true;
    return;
  }
  domainIds = catalog.domains.map((d) => d.id);
  takenIds = catalog.resources.map((r) => r.id);
  fillSelect(field("domain"), catalog.domains.map((d) => [d.id, d.title]));
  fillSelect(field("type"), TYPES.map((t) => [t, TYPE_LABELS[t]]));
  fillSelect(field("level"), LEVELS.map((l) => [l, LEVEL_LABELS[l]]));
  fillSelect(field("access"), ACCESS.map((a) => [a, ACCESS_LABELS[a]]));
  $("#langBoxes").innerHTML = LANGUAGES.map((code) => `<label class="check"><input type="checkbox" value="${code}"> <span>${LANG_LABELS[code]}</span></label>`).join("");

  // pré-remplissage depuis le catalogue (« Il manque une ressource ? »)
  const params = new URLSearchParams(location.search);
  if (params.get("title")) { field("title").value = params.get("title").slice(0, 120); touched.add("title"); }
  if (params.get("url")) { field("url").value = params.get("url").slice(0, 300); touched.add("url"); }

  const form = $("#resourceForm");
  form.addEventListener("input", (event) => {
    const id = event.target.id?.replace(/^f-/, "") || (event.target.closest("#langBoxes") ? "language" : "");
    if (id) touched.add(id);
    if (id === "domain") refreshCategories();
    refresh();
  });
  form.addEventListener("focusout", (event) => {
    if (!event.target.id?.startsWith("f-")) return;
    touched.add(event.target.id.slice(2));
    refresh();
  });
  form.addEventListener("submit", (event) => { event.preventDefault(); });
  $("#issueBtn").addEventListener("click", (event) => {
    const { ready } = refresh({ showAll: true });
    if (!ready) {
      event.preventDefault();
      const first = FIELDS.map((key) => (key === "language" ? $("#langBoxes input") : field(key))).find((el) => el && el.getAttribute("aria-invalid") === "true") || $("#dupPanel a");
      first?.focus();
    }
  });
  $("#copyBtn").addEventListener("click", copyJSON);
  refreshCategories();
  refresh();
}

init();
