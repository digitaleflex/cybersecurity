# Politique de sécurité

## Signaler une vulnérabilité

Merci de **ne pas ouvrir de ticket public** pour une faille de sécurité.

1. Utilise le signalement privé de GitHub : onglet **Security** du dépôt → **Report a vulnerability**.
2. Décris le problème, comment le reproduire et son impact potentiel. N'inclus pas de données personnelles réelles.
3. Si le signalement privé n'est pas disponible, ouvre un ticket **sans détail technique** en demandant un canal de contact, et un mainteneur te répondra.

Nous répondons dans la mesure du possible sous quelques jours et te tenons informé de la correction. Merci de laisser un délai raisonnable avant toute divulgation publique.

## Périmètre

- Le site (pages, scripts, serveur `scripts/serve.mjs`) et ses en-têtes de sécurité.
- Le lecteur de documentation (rendu Markdown filtré par DOMPurify).
- Les workflows GitHub Actions du dépôt.

Hors périmètre : les sites tiers référencés dans le catalogue (signale-les à leurs éditeurs ; un lien malveillant peut être signalé ici pour retrait du catalogue).

## Versions prises en charge

Seule la branche `main` (version en ligne) reçoit des correctifs.

## Ce que le projet met déjà en œuvre

- Content-Security-Policy stricte : aucun script ni style en ligne, aucune ressource tierce.
- Aucune dépendance exécutée côté serveur ; bibliothèques tierces hébergées et figées dans `vendor/`.
- Liste blanche de fichiers publics côté serveur (le code, les tests et la configuration ne sont pas exposés).
- Aucun cookie, aucun traceur, aucune donnée personnelle collectée.
