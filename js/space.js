// Page « Mon espace » : favoris, récents, listes personnalisées, export et import. Tout reste dans le navigateur.
import "./shell.js";
import {
  $,
  $$,
  escapeHTML,
  plural,
  icon,
  loadCatalog,
  favorites,
  recents,
  writeStore,
  FAV_KEY,
  RECENT_KEY,
  getDomain,
  safeExternalURL,
  showLoadError
} from "./data.js";
import { resourceCard, bindCards } from "./cards.js";
import {
  LIMITS,
  loadLists,
  saveLists,
  createList,
  renameList,
  deleteList,
  addToList,
  removeFromList,
  buildExport,
  parseImport,
  mergeUserData,
  shareURL
} from "./user-data.js";

let catalog;
let byId = new Map();
let pending = null; // import analysé, en attente de confirmation
const armed = new Map(); // boutons « supprimer » en attente de confirmation

const say = (message) => {
  $("#spaceStatus").textContent = message;
};
const today = () => new Date().toISOString().slice(0, 10);

function renderFavorites() {
  const ids = favorites().filter((id) => byId.has(id));
  $("#favCount").textContent = ids.length;
  $("#favGrid").innerHTML = ids.length
    ? ids.map((id) => resourceCard(catalog, byId.get(id), { heading: "h3" })).join("")
    : `<p class="empty-line">Aucun favori pour l'instant. Utilise l'étoile ${icon("star")} d'une carte du <a href="catalogue">catalogue</a> pour en ajouter.</p>`;
}

function renderRecent() {
  const ids = recents().filter((id) => byId.has(id));
  $("#recentCount").textContent = ids.length;
  $("#recentList").innerHTML = ids.length
    ? ids
        .map((id) => {
          const r = byId.get(id);
          const url = safeExternalURL(r.url);
          return `<li><span><b>${escapeHTML(r.title)}</b> <small>${escapeHTML(getDomain(catalog, r.domain)?.title || "")}</small></span>${url ? `<a class="card-open" href="${escapeHTML(url)}" data-open="${escapeHTML(r.id)}" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir ${escapeHTML(r.title)} dans un nouvel onglet">${icon("external")}</a>` : ""}</li>`;
        })
        .join("")
    : '<li class="empty-line">Aucune ressource consultée pour l\'instant.</li>';
  $("#clearRecent").hidden = ids.length === 0;
}

function renderLists() {
  const lists = loadLists(new Set(byId.keys()));
  $("#listCount").textContent = lists.length;
  $("#createListBtn").disabled = lists.length >= LIMITS.lists;
  $("#listsContainer").innerHTML = lists.length
    ? lists
        .map((l) => {
          const items = l.items.filter((id) => byId.has(id));
          return `<article class="card user-list" data-list="${escapeHTML(l.id)}" aria-labelledby="lt-${escapeHTML(l.id)}">
      <header class="user-list-head"><h3 id="lt-${escapeHTML(l.id)}">${escapeHTML(l.name)}</h3><span class="muted">${plural(items.length, "ressource")}</span></header>
      <form class="rename-form" data-rename-form hidden><label class="sr-only" for="rn-${escapeHTML(l.id)}">Nom de la liste</label>
        <input id="rn-${escapeHTML(l.id)}" type="text" maxlength="${LIMITS.nameLength}" value="${escapeHTML(l.name)}"><button class="btn btn-primary btn-sm" type="submit">Enregistrer</button><button class="btn btn-ghost btn-sm" type="button" data-rename-cancel>Annuler</button></form>
      ${
        items.length
          ? `<ul class="list-items">${items.map((id) => `<li><span>${escapeHTML(byId.get(id).title)}</span><button class="icon-x" type="button" data-remove="${escapeHTML(id)}" aria-label="Retirer ${escapeHTML(byId.get(id).title)} de la liste ${escapeHTML(l.name)}">${icon("x")}</button></li>`).join("")}</ul>`
          : '<p class="empty-line">Liste vide : ajoute des ressources avec le bouton <b>liste</b> des cartes du catalogue, ou avec « Ajouter mes favoris ».</p>'
      }
      <div class="list-actions">
        <button class="btn btn-ghost btn-sm" type="button" data-rename>Renommer</button>
        <button class="btn btn-ghost btn-sm" type="button" data-add-favs>Ajouter mes favoris</button>
        <button class="btn btn-ghost btn-sm" type="button" data-share ${items.length ? "" : "disabled"}>${icon("link")} Copier le lien de partage</button>
        <a class="btn btn-ghost btn-sm" href="${escapeHTML(shareURL({ ...l, items }))}" ${items.length ? "" : 'aria-disabled="true" tabindex="-1"'}>Voir la page partagée</a>
        <button class="btn btn-ghost btn-sm danger" type="button" data-delete>Supprimer</button>
      </div></article>`;
        })
        .join("")
    : '<p class="empty-line">Aucune liste. Donne un nom ci-dessus pour créer la première (par exemple « Atelier OSINT »).</p>';
}

function renderAll() {
  renderFavorites();
  renderRecent();
  renderLists();
}

function currentData() {
  return { favorites: favorites(), recent: recents(), lists: loadLists(new Set(byId.keys())) };
}

function applyData({ favorites: favs, recent, lists }) {
  writeStore(FAV_KEY, favs);
  writeStore(RECENT_KEY, recent);
  saveLists(lists);
  window.dispatchEvent(new Event("hc:favorites"));
  renderAll();
}

/** Bouton à double clic : le premier clic « arme » l'action destructrice, le second la confirme. */
function confirmable(button, label, action) {
  if (armed.get(button) === true) {
    armed.delete(button);
    action();
    return;
  }
  const original = button.textContent;
  armed.set(button, true);
  button.textContent = label;
  setTimeout(() => {
    if (armed.delete(button)) button.textContent = original;
  }, 4000);
}

function bindLists() {
  $("#createListForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const created = createList(loadLists(), $("#newListName").value);
    if (!created) return say(`Limite atteinte : ${LIMITS.lists} listes au maximum.`);
    saveLists(created.lists);
    $("#newListName").value = "";
    renderLists();
    say(`Liste « ${created.list.name} » créée.`);
  });

  $("#listsContainer").addEventListener("click", async (event) => {
    const root = event.target.closest("[data-list]");
    if (!root) return;
    const id = root.dataset.list;
    const lists = loadLists();
    const name = lists.find((l) => l.id === id)?.name ?? "";
    const target = event.target.closest("button");
    if (!target) return;
    if (target.hasAttribute("data-rename")) {
      root.querySelector("[data-rename-form]").hidden = false;
      root.querySelector("input").focus();
    } else if (target.hasAttribute("data-rename-cancel")) {
      renderLists();
    } else if (target.dataset.remove) {
      saveLists(removeFromList(lists, id, target.dataset.remove));
      renderLists();
      say("Ressource retirée de la liste.");
    } else if (target.hasAttribute("data-add-favs")) {
      saveLists(
        addToList(
          lists,
          id,
          favorites().filter((x) => byId.has(x))
        )
      );
      renderLists();
      say("Favoris ajoutés à la liste.");
    } else if (target.hasAttribute("data-share")) {
      const list = lists.find((l) => l.id === id);
      const link = new URL(shareURL({ ...list, items: list.items.filter((x) => byId.has(x)) }), location.href).href;
      try {
        await navigator.clipboard.writeText(link);
        say("Lien de partage copié dans le presse-papiers.");
      } catch {
        say(`Copie impossible : ${link}`);
      }
    } else if (target.hasAttribute("data-delete")) {
      confirmable(target, "Confirmer la suppression", () => {
        saveLists(deleteList(lists, id));
        renderLists();
        say(`Liste « ${name} » supprimée.`);
      });
    }
  });

  $("#listsContainer").addEventListener("submit", (event) => {
    const form = event.target.closest("[data-rename-form]");
    if (!form) return;
    event.preventDefault();
    const id = form.closest("[data-list]").dataset.list;
    saveLists(renameList(loadLists(), id, form.querySelector("input").value));
    renderLists();
    say("Liste renommée.");
  });
}

function bindTransfer() {
  $("#exportBtn").addEventListener("click", () => {
    const file = JSON.stringify(buildExport(currentData()), null, 2);
    const url = URL.createObjectURL(new Blob([file], { type: "application/json" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: `hashcode-mon-espace-${today()}.json` });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say("Fichier d'export préparé.");
  });

  $("#importFile").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    const preview = $("#importPreview");
    pending = null;
    preview.hidden = true;
    if (!file) return;
    if (file.size > LIMITS.importBytes) return say("Le fichier est trop volumineux (200 Ko maximum).");
    const result = parseImport(await file.text(), new Set(byId.keys()));
    if ("error" in result) return say(result.error);
    pending = result;
    const s = result.stats;
    const many = (n) => (n > 1 ? "s" : "");
    $("#importSummary").textContent =
      `Le fichier contient ${plural(s.favorites, "favori")}, ${plural(s.lists, "liste")} (${plural(s.items, "ressource")}) et ${s.recent} ressource${many(s.recent)} récente${many(s.recent)}.${s.ignored ? ` ${s.ignored} référence${many(s.ignored)} inconnue${many(s.ignored)} ignorée${many(s.ignored)}.` : ""}`;
    preview.hidden = false;
    say("Fichier analysé : choisis comment l'importer.");
  });

  $("#importApply").addEventListener("click", () => {
    if (!pending) return;
    const mode = $("input[name='importMode']:checked").value;
    applyData(mode === "replace" ? pending.data : mergeUserData(currentData(), pending.data));
    say(mode === "replace" ? "Données remplacées par le fichier importé." : "Données fusionnées avec le fichier importé.");
    pending = null;
    $("#importPreview").hidden = true;
    $("#importFile").value = "";
  });

  $("#clearRecent").addEventListener("click", () => {
    writeStore(RECENT_KEY, []);
    renderRecent();
    say("Historique effacé.");
  });

  $("#clearAll").addEventListener("click", (event) => {
    confirmable(event.currentTarget, "Confirmer : tout effacer", () => {
      applyData({ favorites: [], recent: [], lists: [] });
      say("Toutes les données de Mon espace ont été effacées de ce navigateur.");
    });
  });
}

try {
  catalog = await loadCatalog();
  byId = new Map(catalog.resources.map((r) => [r.id, r]));
  renderAll();
  bindLists();
  bindTransfer();
  for (const grid of [$("#favGrid")]) bindCards(grid, renderAll);
  window.addEventListener("hc:lists", renderLists);
  window.addEventListener("hc:favorites", () => {
    renderFavorites();
  });
  $$("[data-space-section]").forEach((el) => (el.hidden = false));
} catch (error) {
  console.error(error);
  showLoadError($("#favGrid"), "Impossible de charger le catalogue.");
}
