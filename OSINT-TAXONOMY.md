# OSINT — Taxonomie des familles et catégories

> Référentiel pédagogique HashCode. Cette taxonomie est volontairement opérationnelle : les acronymes décrivent des angles d'analyse et des familles de sources, pas une nomenclature universelle officiellement normalisée.

## 1. Principes de classement

- **Famille** : angle de renseignement ou domaine d'analyse.
- **Catégorie** : type de données, source ou méthode de collecte.
- **Source** : éditeur, registre, organisme, plateforme ou dépôt original.
- **Outil** : logiciel ou service qui facilite la découverte, la collecte, la vérification ou l'analyse.
- **Agrégateur** : service qui indexe ou regroupe des données d'autres sources. Il sert de piste ; la source primaire doit être consultée lorsque possible.

Une ressource peut appartenir à plusieurs familles. La bibliothèque utilise une catégorie principale pour le filtrage et des tags pour les relations transversales.

## 2. Familles et sous-catégories

### A. Recherche web et contenus publics
- **WEBINT** — moteurs généralistes, moteurs spécialisés, recherche avancée, opérateurs, sites web, blogs, forums, wikis, newsletters, pages publiques, web profond légalement accessible, archives web, caches et crawls.
- **NEWSINT** — presse nationale et locale, médias audiovisuels, fils RSS, dépêches, médias spécialisés, communiqués, conférences de presse, chronologies et veille événementielle.
- **ACADINT** — articles scientifiques, thèses, prépublications, citations, profils de chercheurs, laboratoires, conférences, brevets et jeux de données scientifiques.
- **DOCINT** — rapports, PDF, documents administratifs, appels d'offres, présentations, fichiers bureautiques, OCR, métadonnées et archives documentaires.

### B. Identités, personnes et communautés
- **SOCMINT** — contenus publics des réseaux sociaux, profils, publications, hashtags, commentaires, pages, groupes publics, relations visibles, chronologie et communautés.
- **IDINT** — pseudonymes, présence numérique publique, profils professionnels, identifiants publics, homonymie, résolution d'entités et corrélation d'alias.
- **EMAILINT** — adresses professionnelles publiées, domaines associés, formats de contact publics, validation syntaxique et exposition déclarée par des services légitimes.
- **TELINT** — numérotation, indicatifs, opérateurs, préfixes, annuaires publics et présence volontairement publiée.
- **HUMINT-OSINT** — interviews publiées, interventions publiques, conférences, témoignages consentis, experts, publications et déclarations attribuées. Ce volet ne couvre pas l'usurpation ni l'obtention clandestine d'informations.

### C. Géographie, imagerie et médias
- **GEOINT** — géocodage, cartographie, adresses et lieux publics, limites administratives, relief, routes, bâtiments, infrastructures et analyse spatiale.
- **IMINT** — imagerie satellitaire, aérienne et drone publiée, comparaison temporelle, résolution, ombres, repères visuels et analyse d'images.
- **VIDINT** — vérification de vidéos, extraction de keyframes, chronologie, provenance, analyse de scènes et recoupement audiovisuel.
- **AUDIOINT** — enregistrements publics, transcription, langue, contexte acoustique et authentification prudente. Éviter l'identification biométrique de personnes privées.
- **ENVINT** — météorologie, climat, hydrologie, feux, pollution, biodiversité, déforestation, risques naturels et données environnementales.
- **SPACEINT** — satellites, objets orbitaux, lancements, données astronomiques, météo spatiale et imagerie accessible.

### D. Infrastructure numérique et cyber
- **DOMINT** — RDAP/WHOIS, DNS, historiques de domaines, sous-domaines issus de sources passives, certificats TLS et Certificate Transparency.
- **NETINT** — adresses IP, ASN, BGP, routage, géolocalisation IP approximative, hébergeurs et métadonnées réseau publiques.
- **CYBINT** — rapports de menaces, acteurs, campagnes, TTP, indicateurs publiés, advisories, vulnérabilités, phishing et surface d'attaque observable.
- **MALINT** — analyses publiées de logiciels malveillants, familles, hashes, comportements, sandbox reports et dépôts de recherche contrôlés.
- **CODEINT** — dépôts publics, historique de commits, dépendances, paquets, documentation, mainteneurs et provenance logicielle. Ne pas rechercher ni republier des secrets exposés.
- **IOTINT** — documentation publique des appareils, empreintes de produits, avis de sécurité et informations d'exposition publiées. Toute interaction active doit être autorisée.
- **CRYPTINT** — explorateurs blockchain, transactions publiques, contrats, tokens, étiquetage d'adresses et rapports d'analyse. Une adresse ne prouve pas l'identité de son détenteur.

### E. Entreprises, économie et droit
- **CORPINT** — registres d'entreprises, RCCM, dirigeants publiés, filiales, actionnariat, bénéficiaires effectifs légalement accessibles et rapports annuels.
- **FININT** — états financiers publiés, marchés, cours, rapports réglementaires, budgets, dette, statistiques économiques et données bancaires de référence.
- **SANCINT** — listes officielles de sanctions, décisions administratives, mesures restrictives et listes de personnes politiquement exposées provenant de sources légitimes.
- **LEGINT** — textes de loi, journaux officiels, décisions de justice publiées, jurisprudence, actes administratifs et registres juridiques accessibles.
- **GOVINT** — portails institutionnels, budgets, dépenses publiques, statistiques, marchés publics, appels d'offres, rapports d'audit et jeux de données ouverts.
- **ELECTINT** — autorités électorales, résultats, listes et données publiées légalement, financement politique divulgué, observateurs et contentieux électoraux.
- **SUPPLYINT** — commerce international, douanes, tarifs, import-export, transport, logistique, chaînes d'approvisionnement et données de marchés.
- **RISKINT** — indices de gouvernance, risques pays, corruption, conformité, adverse media et évaluations de risques documentées.

### F. Mobilité, événements et société
- **AVINT** — aviation civile, immatriculations, aéroports, horaires publiés, NOTAM accessibles et suivi de vols selon les conditions des fournisseurs.
- **MARINT** — navires, immatriculations, ports, routes, AIS public, pêche et données maritimes.
- **EVENTINT** — événements publics, manifestations, incidents, conflits, catastrophes, alertes et bases de données événementielles.
- **MEDINT-OSINT** — statistiques sanitaires publiques, publications biomédicales, alertes épidémiologiques et données de santé agrégées. Pas de dossiers médicaux individuels.
- **BIOINT** — observations d'espèces, biodiversité, ressources naturelles, agriculture et données biologiques ouvertes.
- **DISINFOINT** — vérification des faits, narratifs, réseaux de diffusion publics, contenus synthétiques, manipulation et provenance des médias.

## 2 bis. Axes complémentaires pour les sources institutionnelles

Les acronymes ci-dessous sont des **étiquettes pédagogiques complémentaires** utilisées par HashCode pour faciliter le filtrage. Ils ne constituent pas une nomenclature internationale normalisée et peuvent se recouper avec les familles précédentes.

- **DATAINT** — portails open data, catalogues de jeux de données, API publiques, métadonnées et données à forte valeur.
- **ECONINT** — indicateurs macroéconomiques, comptes nationaux, inflation, dette, croissance et conjoncture.
- **TRADEINT** — statistiques douanières, importations, exportations, tarifs, accords commerciaux et chaînes d'approvisionnement.
- **DEMOINT** — recensements, population, ménages, migrations, urbanisation et indicateurs démographiques agrégés.
- **POLINT** — institutions politiques, transparence, lobbying déclaré, financement électoral publié et activité parlementaire.
- **HEALTHINT** — indicateurs sanitaires agrégés, systèmes de santé, alertes épidémiologiques et statistiques hospitalières publiques.
- **HUMANINT** — données humanitaires agrégées, déplacements forcés, besoins, réponse et coordination d'urgence.
- **MIGINT** — statistiques migratoires, mobilité internationale et déplacements de population publiés par des organismes compétents.
- **FUNDINT** — financements publics, subventions, programmes de recherche, aides et bénéficiaires institutionnels.
- **TECHINT** — brevets, marques, normes, publications techniques, transferts technologiques et innovation.
- **REGINT** — décisions et publications des autorités de régulation : télécommunications, énergie, finance, transport et concurrence.

Une même source peut relever de plusieurs axes. Le catalogue conserve une catégorie principale et utilise les tags pour les relations transversales.

## 3. Méthodes transversales

1. **Planification** : question de recherche, périmètre, période, zone, langues, hypothèses et critères d'arrêt.
2. **Découverte** : recherche par mots-clés, variantes, identifiants, sources primaires et pivots documentés.
3. **Collecte** : conserver URL, auteur/éditeur, horodatage, date d'accès, contexte et copie autorisée.
4. **Vérification** : provenance, corroboration indépendante, chronologie, géolocalisation et analyse des limites.
5. **Préservation** : capture fidèle, empreinte cryptographique si nécessaire, journal de collecte et stockage contrôlé.
6. **Analyse** : entités, relations, chronologie, hypothèses alternatives, niveau de confiance et lacunes.
7. **Restitution** : faits séparés des hypothèses, citations, limites, date de fraîcheur et possibilité de reproduction.

## 4. Niveaux de confiance des sources

- **Primaire officielle** : registre ou organisme responsable de la publication.
- **Primaire directe** : déclaration ou contenu publié par l'acteur concerné.
- **Secondaire réputée** : média, ONG, recherche ou organisme reconnu.
- **Agrégateur** : index ou moteur utile pour découvrir une piste.
- **Non corroborée** : signal à vérifier, jamais preuve suffisante à lui seul.

Une source officielle n'est pas automatiquement complète, exacte ou à jour. Une capture d'écran, un résultat de moteur, un profil homonyme ou une donnée agrégée ne doit pas être présenté comme une preuve d'identité.

## 5. Sécurité, droit et éthique

- Limiter la collecte aux informations pertinentes et publiquement accessibles ou obtenues avec autorisation.
- Respecter les lois applicables, les conditions des plateformes, les licences et les règles de protection des données.
- Ne pas publier de données personnelles sensibles, d'adresses privées, de secrets, de mots de passe ou de données volées.
- Ne pas contourner les contrôles d'accès, rejoindre des espaces privés sous faux prétexte, ni automatiser une collecte contraire aux règles du service.
- Ne pas utiliser la bibliothèque pour doxxing, harcèlement, stalking, discrimination ou ciblage de personnes vulnérables.
- Pour une enquête sensible, documenter le mandat, minimiser les données et solliciter un encadrement juridique adapté.

## 6. Références méthodologiques

- [Berkeley Protocol on Digital Open Source Investigations](https://digitallibrary.un.org/record/3973652) — processus, vérification, préservation et sécurité des investigations numériques.
- [Bellingcat Online Investigation Toolkit](https://bellingcat.gitbook.io/toolkit/categories/all) — catégories et outils d'investigation.
- [GIJN — Online Research Tools](https://gijn.org/resource/online-research-tools/) — recherche et journalisme d'investigation.
- [EEAS OSINT Guidelines](https://www.eeas.europa.eu/sites/default/files/documents/2024/EEAS-DataTeam-OsintGuidelines-04-Digital.pdf) — vérification des médias et méthodes.
- [DHS — Ethical Frameworks in OSINT](https://www.dhs.gov/sites/default/files/2022-09/Ethical%20Frameworks%20in%20OSINT%20Final.pdf) — enjeux éthiques et familles de sources.
