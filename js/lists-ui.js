// Fenêtre « Ajouter à une liste » (élément <dialog> natif : focus piégé, Échap pour fermer, accessible au clavier).
import { escapeHTML, icon } from "./data.js";
import { loadLists, saveLists, createList, toggleInList, addToList, LIMITS } from "./user-data.js";

let dialog;
let current = { id: "", title: "", opener: null };

function ensureDialog() {
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.className = "dialog";
  dialog.setAttribute("aria-labelledby", "listDialogTitle");
  document.body.append(dialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close(); // clic sur le fond
  });
  dialog.addEventListener("close", () => current.opener?.focus());
  dialog.addEventListener("change", (event) => {
    const box = event.target.closest("[data-list]");
    if (!box) return;
    saveLists(toggleInList(loadLists(), box.dataset.list, current.id));
    render(box.checked ? "Ajoutée à la liste." : "Retirée de la liste.");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target.closest("[data-create]")) createAndAdd();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.id === "newListName") {
      event.preventDefault();
      createAndAdd();
    }
  });
  return dialog;
}

function createAndAdd() {
  const input = dialog.querySelector("#newListName");
  const created = createList(loadLists(), input.value);
  if (!created) {
    render(`Limite atteinte : ${LIMITS.lists} listes au maximum.`);
    return;
  }
  saveLists(addToList(created.lists, created.list.id, current.id));
  render(`Liste « ${created.list.name} » créée, ressource ajoutée.`);
}

function render(message = "") {
  const lists = loadLists();
  const rows = lists.length
    ? lists
        .map(
          (l) =>
            `<li><label class="check"><input type="checkbox" data-list="${escapeHTML(l.id)}" ${l.items.includes(current.id) ? "checked" : ""}> <span>${escapeHTML(l.name)} <small>(${l.items.length})</small></span></label></li>`
        )
        .join("")
    : '<li class="muted">Tu n\'as pas encore de liste. Crée la première ci-dessous.</li>';
  dialog.innerHTML = `<form method="dialog" class="dialog-body">
    <h2 id="listDialogTitle">Ajouter à une liste</h2>
    <p class="muted dialog-resource"></p>
    <ul class="dialog-lists">${rows}</ul>
    <div class="dialog-new"><label for="newListName">Nouvelle liste</label>
      <div class="row"><input id="newListName" type="text" maxlength="${LIMITS.nameLength}" placeholder="Ex. Atelier OSINT"><button type="button" class="btn btn-ghost btn-sm" data-create>Créer et ajouter</button></div></div>
    <p class="dialog-status" role="status" aria-live="polite">${escapeHTML(message)}</p>
    <div class="dialog-actions"><a href="espace">${icon("list")} Gérer mes listes</a><button class="btn btn-primary btn-sm" value="close">Terminé</button></div>
  </form>`;
  dialog.querySelector(".dialog-resource").textContent = `« ${current.title} »`; // texte : jamais interprété comme du HTML
}

export function openListDialog(resourceId, title, opener) {
  current = { id: resourceId, title, opener };
  ensureDialog();
  render();
  dialog.showModal();
  dialog.querySelector("input, button")?.focus();
}
