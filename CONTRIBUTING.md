# Contribuer à HashCode Cyber Library

Merci de contribuer à une bibliothèque utile, fiable et accessible.

## Ressources acceptées

Documentation officielle, standards, cours légaux, livres autorisés, projets open source, outils défensifs, laboratoires d'entraînement, CTF, communautés vérifiables, datasets publics et rapports de recherche.

Ne pas proposer de données volées, identifiants divulgués, doxxing, liens de piratage, marchés d'accès non autorisés, contenus malveillants distribués hors contexte de recherche ou ressources encourageant des intrusions illégales.

## Format d'une fiche

Ajouter une entrée dans `data/resources.json` et, si utile, dans le README du domaine.

```json
{
  "id": "vendor-resource-name",
  "title": "Resource Name",
  "description": "Description factuelle et concise.",
  "url": "https://official.example/",
  "domain": "osint",
  "category": "Investigation",
  "type": "tool",
  "level": "intermediate",
  "access": "free",
  "language": ["en"],
  "tags": ["research", "verification"],
  "source": "Official project",
  "verified": "YYYY-MM-DD",
  "status": "verified",
  "featured": false
}
```

## Checklist de revue

- [ ] Le lien pointe vers la source originale ou officielle.
- [ ] La ressource existe et correspond à la description.
- [ ] La catégorie, le type et le niveau sont cohérents.
- [ ] Le modèle d'accès et la licence sont vérifiés.
- [ ] La langue est renseignée uniquement si connue.
- [ ] La ressource n'est pas déjà présente.
- [ ] Les risques, limites et conditions d'utilisation sont documentés.
- [ ] La date de vérification est au format ISO `YYYY-MM-DD`.

## Pull Request

1. Ajouter ou modifier les données dans le fichier JSON.
2. Ajouter une description dans le README du domaine si cela améliore la documentation.
3. Ne pas modifier le schéma JSON sans mettre à jour le site et ce guide.
4. Expliquer l'utilité pédagogique ou opérationnelle de la ressource.
5. Ne pas soumettre de secrets, de données personnelles ou de fichiers tiers soumis au droit d'auteur.

## Qualité avant quantité

Les mainteneurs peuvent retirer les doublons, liens morts, ressources trompeuses, ressources dangereuses ou références sans provenance fiable.

## Licence des contributions
En contribuant, tu acceptes que ton apport soit publié sous les licences du projet : [MIT](LICENSE) pour le code, [CC BY 4.0](LICENSE-DATA.txt) pour le catalogue et les contenus rédigés. Merci de respecter le [code de conduite](CODE_OF_CONDUCT.md).
