// Page « Liste partagée » : affiche une sélection de ressources décrite dans l'adresse (?ids=a,b&titre=…), sans serveur.
import "./shell.js";
import { $, plural, loadCatalog, favorites, toggleFavorite, showLoadError, icon } from "./data.js";
import { resourceCard, bindCards } from "./cards.js";
import { parseShared, loadLists, saveLists, createList, addToList } from "./user-data.js";

const say = (message) => {
  $("#sharedStatus").textContent = message;
};

try {
  const catalog = await loadCatalog();
  const byId = new Map(catalog.resources.map((r) => [r.id, r]));
  const shared = parseShared(location.search, new Set(byId.keys()));
  const title = shared.title || "Liste partagée";
  $("#sharedTitle").textContent = title; // texte : jamais interprété comme du HTML
  document.title = `${title} — HashCode Cyber Library`;
  const notes = [];
  if (shared.unknown)
    notes.push(`${plural(shared.unknown, "ressource")} de cette liste n'existe${shared.unknown > 1 ? "nt" : ""} plus dans le catalogue.`);
  if (shared.truncated) notes.push("La liste a été limitée à 50 ressources.");
  $("#sharedNotes").textContent = notes.join(" ");
  $("#sharedNotes").hidden = notes.length === 0;

  if (!shared.ids.length) {
    $("#sharedIntro").textContent = "Cette liste est vide ou son lien est invalide.";
    $("#sharedActions").hidden = true;
    $("#sharedGrid").innerHTML = `<p class="empty-line">Aucune ressource à afficher. <a href="catalogue">Explorer le catalogue</a>.</p>`;
  } else {
    $("#sharedIntro").textContent =
      `${plural(shared.ids.length, "ressource")} sélectionnée${shared.ids.length > 1 ? "s" : ""} et partagée${shared.ids.length > 1 ? "s" : ""} par lien. Rien n'est enregistré tant que tu ne le demandes pas.`;
    $("#sharedGrid").innerHTML = shared.ids.map((id) => resourceCard(catalog, byId.get(id), { heading: "h2" })).join("");
    bindCards($("#sharedGrid"));

    $("#saveFavs").addEventListener("click", () => {
      const have = new Set(favorites());
      const toAdd = shared.ids.filter((id) => !have.has(id));
      for (const id of toAdd) toggleFavorite(id);
      say(
        toAdd.length
          ? `${plural(toAdd.length, "ressource")} ajoutée${toAdd.length > 1 ? "s" : ""} à tes favoris.`
          : "Ces ressources sont déjà dans tes favoris."
      );
    });
    $("#saveList").addEventListener("click", () => {
      const created = createList(loadLists(), shared.title || "Liste partagée");
      if (!created) return say("Tu as atteint la limite de 20 listes : supprime-en une dans Mon espace.");
      saveLists(addToList(created.lists, created.list.id, shared.ids));
      say(`Liste « ${created.list.name} » enregistrée dans Mon espace.`);
      $("#openSpace").hidden = false;
    });
    $("#copyShared").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        say("Lien copié dans le presse-papiers.");
      } catch {
        say(`Copie impossible : ${location.href}`);
      }
    });
  }
  $("#sharedIcon").innerHTML = icon("list");
} catch (error) {
  console.error(error);
  showLoadError($("#sharedGrid"), "Impossible de charger la liste.");
}
