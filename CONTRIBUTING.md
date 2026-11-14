# Contribuer à HashCode Cyber Library

Merci de contribuer à une bibliothèque utile, fiable et accessible. **Aucune compétence technique n'est requise** : choisis la voie qui te convient.

## Trois façons de contribuer

| Je… | Voie | Durée |
|---|---|---|
| n'ai pas de compte GitHub | Rejoins le [groupe WhatsApp](https://chat.whatsapp.com/IDcosEG4jjOK4mTAYsX92D) et envoie le nom, le lien officiel et une phrase d'explication. Un mainteneur crée la fiche. | 1 min |
| connais GitHub | Utilise le **formulaire de la page [Contribuer](https://cybersecurity.eflex.app/contribuer)** : il détecte les doublons et prépare un ticket déjà rempli. Ou ouvre directement un [ticket](https://github.com/digitaleflex/cybersecurity/issues/new/choose). | 2 min |
| sais coder | Ajoute ta fiche dans `data/resources.json` et ouvre une Pull Request (voir plus bas). | 10 min |

Tu peux aussi [signaler un lien cassé](https://github.com/digitaleflex/cybersecurity/issues/new?template=broken-link.yml) ou [proposer une correction](https://github.com/digitaleflex/cybersecurity/issues/new?template=correction.yml).

## Ressources acceptées

Documentation officielle, standards, cours légaux, livres autorisés, projets open source, outils défensifs, laboratoires d'entraînement, CTF, communautés vérifiables, datasets publics et rapports de recherche.

## Ressources refusées

Données volées, identifiants divulgués, doxxing, liens de piratage, marchés d'accès non autorisés, contenus malveillants distribués hors contexte de recherche, ressources encourageant des intrusions illégales.

## Bien rédiger une fiche

- **Titre** : le nom officiel, tel que l'éditeur l'écrit.
- **Lien** : l'adresse officielle en `https://` (site de l'éditeur, dépôt d'origine), jamais un relais ou un lien raccourci.
- **Description** : 40 à 220 caractères, factuelle (ce que la ressource fournit), sans superlatif ni promotion. *Bon exemple :* « Documentation officielle d'un outil de scan réseau : détection de services et scripts. » *À éviter :* « Super outil pour tout hacker !!! ».
- **Langue, accès, niveau** : n'indique que ce que tu as vérifié.
- **Tags** : 2 à 5 mots-clés en minuscules (`osint`, `forensic`, `cloud`…).

## Format d'une fiche

Une nouvelle fiche est **toujours** `needs-review` : seul un mainteneur la passe en `verified`, après contrôle humain (voir la [politique de qualité](QUALITY.md)).

```json
{
  "id": "vendor-resource-name",
  "title": "Resource Name",
  "description": "Description factuelle et concise de ce que la ressource fournit.",
  "url": "https://official.example/",
  "domain": "osint",
  "category": "Investigation",
  "type": "tool",
  "level": "intermediate",
  "access": "free",
  "language": ["en"],
  "tags": ["research", "verification"],
  "source": "Official project",
  "verified": null,
  "status": "needs-review",
  "featured": false,
  "added": "2026-01-01"
}
```

Les valeurs autorisées (domaines, types, niveaux, accès, langues) sont décrites dans le [schéma des ressources](data/schema.md). Le formulaire de la page Contribuer te fournit une fiche JSON déjà conforme (bouton « Copier la fiche JSON »).

## Checklist de revue

- [ ] Le lien pointe vers la source originale ou officielle.
- [ ] La ressource existe et correspond à la description.
- [ ] La catégorie, le type et le niveau sont cohérents.
- [ ] Le modèle d'accès et la licence sont vérifiés.
- [ ] La langue est renseignée uniquement si connue.
- [ ] La ressource n'est pas déjà présente (le formulaire le contrôle).
- [ ] Les risques, limites et conditions d'utilisation sont documentés.
- [ ] Une ressource offensive est destinée à des tests autorisés ou à des environnements de formation.

## Pull Request pas à pas

1. Fais un *fork* du dépôt et clone-le (Node.js 22 ou plus récent).
2. Ajoute ta fiche dans le tableau `resources` de `data/resources.json`.
3. Lance `npm run validate:catalog` puis `npm test` : ils vérifient le format, les doublons d'identifiant et d'URL.
4. Ouvre la Pull Request et remplis le gabarit : explique l'utilité pédagogique ou opérationnelle de la ressource.
5. Un mainteneur relit. La fiche reste « À vérifier » jusqu'à validation.

Ne modifie pas le schéma JSON sans mettre à jour le site, `data/schema.md` et ce guide. Ne soumets ni secrets, ni données personnelles, ni fichiers tiers soumis au droit d'auteur.

## Qualité avant quantité

Les mainteneurs peuvent retirer les doublons, liens morts, ressources trompeuses, ressources dangereuses ou références sans provenance fiable.

## Licence des contributions

En contribuant, tu acceptes que ton apport soit publié sous les licences du projet : [MIT](LICENSE) pour le code, [CC BY 4.0](LICENSE-DATA.txt) pour le catalogue et les contenus rédigés. Merci de respecter le [code de conduite](CODE_OF_CONDUCT.md).
