# OSINT — Répertoire des sources

Répertoire de départ organisé par familles. Il référence des éditeurs, organismes, plateformes et outils publics. Ce n'est pas une liste exhaustive ni une validation automatique : vérifier les conditions d'accès, la couverture, les licences, les dates et les limites de chaque source.

## 1. Répertoires et méthodes
| Source | Utilité | Nature |
|---|---|---|
| [Bellingcat Toolkit](https://bellingcat.gitbook.io/toolkit/categories/all) | Outils classés par cartographie, géolocalisation, médias, réseaux, entreprises, transport, archives | Agrégateur éditorial |
| [OSINT Framework](https://osintframework.com/) | Arbre de découverte d'outils | Agrégateur |
| [Sisserou OSINT Framework](https://www.sisserouhub.org/) | Taxonomie étendue et outils émergents | Agrégateur |
| [Awesome OSINT](https://github.com/jivoi/awesome-osint) | Outils, dépôts et guides communautaires | Liste communautaire |
| [GIJN Online Research Tools](https://gijn.org/resource/online-research-tools/) | Recherche et investigation journalistique | Guide éditorial |
| [Berkeley Protocol](https://digitallibrary.un.org/record/3973652) | Collecte, vérification, préservation et sécurité | Référence méthodologique |
| [EEAS OSINT Guidelines](https://www.eeas.europa.eu/sites/default/files/documents/2024/EEAS-DataTeam-OsintGuidelines-04-Digital.pdf) | Vérification des médias et collecte numérique | Guide institutionnel |

## 2. WEBINT, NEWSINT et archives
| Source | Utilité | Limite |
|---|---|---|
| [Google](https://www.google.com/) · [Bing](https://www.bing.com/) · [Brave Search](https://search.brave.com/) | Recherche web généraliste et opérateurs | Aucun index n'est exhaustif |
| [Internet Archive / Wayback](https://web.archive.org/) | Captures historiques de pages | Captures parfois absentes ou incomplètes |
| [Common Crawl](https://commoncrawl.org/) | Corpus web WARC à grande échelle | Données brutes, analyse technique nécessaire |
| [GDELT](https://www.gdeltproject.org/) | Veille média mondiale et événements rapportés | Couverture automatique à contextualiser |

## 3. SOCMINT, IDINT, EMAILINT et TELINT
| Source | Utilité | Limite |
|---|---|---|
| [Maigret](https://github.com/soxoj/maigret) · [Sherlock](https://github.com/sherlock-project/sherlock) · [WhatsMyName](https://github.com/WebBreacher/WhatsMyName) | Recherche de pseudonymes sur des services publics | Faux positifs ; ne prouvent pas une identité |
| [X Advanced Search](https://x.com/search-advanced) | Recherche de publications publiques | Accès et fonctionnalités selon les règles de X |
| [Reddit Search](https://www.reddit.com/search/) | Publications et communautés publiques | Contenus privés ou supprimés inaccessibles |
| [Telegram](https://t.me/) | Canaux et groupes explicitement publics | Exclut les conversations et groupes privés |
| [Have I Been Pwned](https://haveibeenpwned.com/) | Vérification autorisée de l'exposition d'une adresse | Ne pas rechercher des adresses de tiers sans base légitime |
| [ITU — Numbering Resources](https://www.itu.int/itu-t/inr/) | Références de plans de numérotation | Ne permet pas d'identifier un abonné privé |

## 4. GEOINT et IMINT
| Source | Utilité | Limite |
|---|---|---|
| [OpenStreetMap](https://www.openstreetmap.org/) · [OSM Wiki](https://wiki.openstreetmap.org/) | Cartographie et documentation des données | Vérifier date et couverture |
| [Google Earth](https://earth.google.com/) · [Mapillary](https://www.mapillary.com/) | Imagerie satellite et de rue | Résolution et couverture variables |
| [Copernicus Browser](https://browser.dataspace.copernicus.eu/) | Données Sentinel et observation de la Terre | Résolution selon capteur |
| [NASA Worldview](https://worldview.earthdata.nasa.gov/) | Imagerie globale et phénomènes environnementaux | Certaines couches à résolution modérée |
| [USGS EarthExplorer](https://earthexplorer.usgs.gov/) | Archives Landsat et données géospatiales | Compte parfois requis |
| [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) | Anomalies thermiques et feux actifs | Signaux à corroborer |
| [SunCalc](https://www.suncalc.org/) | Position solaire et contexte des ombres | Calcul théorique, pas preuve autonome |

## 5. VIDINT, AUDIOINT et vérification
| Source | Utilité | Limite |
|---|---|---|
| [InVID-WeVerify](https://www.invid-project.eu/tools-and-services/invid-verification-plugin/) | Vérification d'images/vidéos et extraction de keyframes | Interprétation humaine nécessaire |
| [TinEye](https://tineye.com/) · [Google Lens](https://lens.google/) | Recherche inversée d'images | Occurrences non exhaustives |
| [ExifTool](https://exiftool.org/) | Extraction de métadonnées | Métadonnées absentes ou modifiables |
| [AFP Digital Verification Toolbox](https://digitalcourses.afp.com/pages/afp-digital-verification-toolbox) | Répertoire de méthodes de vérification | Vérifier chaque outil référencé |

## 6. DOMINT et NETINT
| Source | Utilité | Limite |
|---|---|---|
| [ICANN Lookup](https://lookup.icann.org/) · [IANA RDAP Bootstrap](https://www.iana.org/assignments/rdap-dns/rdap-dns.xhtml) | Données d'enregistrement RDAP | Données parfois masquées |
| [crt.sh](https://crt.sh/) | Journaux Certificate Transparency | Un certificat ne prouve pas la propriété d'un actif |
| [Censys](https://search.censys.io/) | Données observées sur hôtes, services et certificats | Observations datées ; privilégier l'usage passif |
| [urlscan.io](https://urlscan.io/) | Analyse de chargements de pages | Attention aux soumissions publiques d'URL sensibles |
| [DNSDumpster](https://dnsdumpster.com/) | Exploration DNS | Résultats incomplets, non attributifs |

## 7. CORPINT, FININT et SANCINT
| Source | Utilité | Limite |
|---|---|---|
| [OpenCorporates](https://opencorporates.com/) | Recherche multi-juridictionnelle d'entreprises | Agrégateur ; confirmer au registre national |
| [OpenSanctions](https://www.opensanctions.org/) | Sanctions, PEP et données de conformité | Vérifier source, date et homonymie |
| [SEC EDGAR](https://www.sec.gov/edgar/search/) | Dépôts réglementaires officiels | Juridiction américaine |
| [World Bank Data](https://data.worldbank.org/) | Indicateurs économiques et développement | Définitions et millésimes à vérifier |

## 8. ACADINT, DOCINT et données ouvertes
| Source | Utilité | Limite |
|---|---|---|
| [OpenAlex](https://openalex.org/) · [Crossref](https://www.crossref.org/) | Publications, auteurs, DOI et citations | Métadonnées bibliographiques |
| [Wikidata](https://www.wikidata.org/) | Graphe de connaissances et identifiants | Base collaborative à corroborer |
| [data.europa.eu](https://data.europa.eu/) | Jeux de données publics européens | Couverture géographique européenne |

## 9. AVINT et MARINT
| Source | Utilité | Limite |
|---|---|---|
| [Flightradar24](https://www.flightradar24.com/) · [ADS-B Exchange](https://www.adsbexchange.com/) | Visualisation du trafic aérien | Couverture, historique et règles variables |
| [MarineTraffic](https://www.marinetraffic.com/) | Données AIS et trafic maritime | Couverture et historique variables |

## 10. Sources institutionnelles — Bénin
| Source | Utilité | Nature |
|---|---|---|
| [Gouvernement du Bénin](https://www.gouv.bj/) | Actualités, institutions et annonces officielles | Portail institutionnel |
| [Journal Officiel](https://www.journalofficiel.gouv.bj/) | Lois, décrets, arrêtés et annonces publiées | Source primaire des textes publiés |
| [INStaD](https://www.instad.bj/) | Statistiques, enquêtes et recensements | Source statistique nationale |
| [Bénin Open Data](https://benin.opendataforafrica.org/) | Indicateurs et jeux de données | Vérifier millésime et producteur |
| [NADA — INStaD](https://nada.instad.bj/) | Métadonnées et microdonnées d'enquêtes | Accès variable selon les jeux |
| [Base financière DGB](https://databudgetbenin.finances.bj/) | Recettes, dépenses et données budgétaires | Source budgétaire publique |
| [Journal National des Marchés Publics](https://sygjmap.finances.bj/) | Avis et journaux des marchés publics | Source institutionnelle |
| [Direction Nationale du Contrôle](https://dnc.bj/) | Commande publique et plateformes associées | Vérifier les dates et documents |
| [APIEx](https://apiex.bj/) | Investissements et formalités d'entreprise | Ne remplace pas un extrait officiel RCCM |
| [Portail National des Services Publics](https://service-public.bj/) | Démarches et services administratifs | Certaines fonctions nécessitent un compte |

## 11. Règles de recherche et de citation
1. Partir de la question, du périmètre, de la période et de la juridiction.
2. Chercher la source primaire avant de s'appuyer sur un agrégateur.
3. Noter URL, éditeur, date de consultation, contexte et méthode.
4. Recouper les informations avec des sources indépendantes.
5. Ne pas inférer une identité depuis un homonyme, un pseudonyme ou un signal technique isolé.
6. Distinguer faits, hypothèses, signaux et niveau de confiance.
7. Respecter les lois, la vie privée, les licences et les conditions des plateformes.

## 12. État de curation
Les nouvelles entrées du catalogue restent `needs-review` jusqu'à validation humaine du lien canonique, de la disponibilité, de la langue, du coût, des conditions d'utilisation et des limites. Une présence dans ce répertoire ne signifie pas que la ressource est approuvée ni entièrement vérifiée.


---

# 13. Sources institutionnelles européennes

Cette section privilégie les portails des institutions et agences de l'Union européenne. Pour les données d'un État membre, suivre également les registres nationaux : les portails européens ne reproduisent pas nécessairement tous les dossiers locaux.

| Institution / source primaire | Domaine OSINT | Ce qu'on peut y rechercher | Limites à vérifier |
|---|---|---|---|
| [data.europa.eu](https://data.europa.eu/) | GOVINT / DATAINT | Jeux de données des institutions européennes et administrations nationales | La disponibilité et la licence dépendent du jeu de données |
| [EUR-Lex](https://eur-lex.europa.eu/) | LEGINT | Droit européen, actes, traités, accords, procédures et jurisprudence | Distinguer textes consolidés, versions et publication authentique |
| [TED — Tenders Electronic Daily](https://ted.europa.eu/) | GOVINT / CORPINT | Avis de marchés, appels d'offres et attributions européens | Les données ne couvrent pas tous les marchés nationaux |
| [Registre de transparence de l'UE](https://transparency-register.europa.eu/) | CORPINT / POLINT | Organisations et représentants d'intérêts déclarés auprès des institutions | Déclarations des inscrits, pas registre exhaustif de toutes les influences |
| [Portail e-Justice](https://e-justice.europa.eu/) | CORPINT / LEGINT | Accès aux registres nationaux d'entreprises via les services interconnectés, dont BRIS | La profondeur des données varie selon les pays |
| [EU Sanctions Map](https://www.sanctionsmap.eu/) | SANCINT | Régimes de sanctions et actes juridiques de l'UE | Vérifier le texte officiel et la date d'application |
| [Eurostat](https://ec.europa.eu/eurostat/) | DATAINT / ECONINT | Population, économie, commerce, transport, agriculture, environnement | Données harmonisées, avec définitions et révisions |
| [CORDIS](https://cordis.europa.eu/) | ACADINT / FUNDINT | Projets, bénéficiaires et résultats de recherche financés par l'UE | Un projet financé n'est pas une validation de ses résultats |
| [Copernicus Data Space](https://dataspace.copernicus.eu/) | IMINT / GEOINT / ENVINT | Imagerie et données d'observation de la Terre Sentinel | Résolution, revisite et couverture selon le capteur |
| [INSPIRE Geoportal](https://inspire-geoportal.ec.europa.eu/) | GEOINT | Données géographiques des autorités publiques européennes | Disponibilité et granularité nationales variables |
| [EUIPO eSearch](https://euipo.europa.eu/eSearch/) | CORPINT | Marques de l'Union européenne et dessins ou modèles | Compléter avec les offices nationaux et WIPO |
| [Espacenet — OEB](https://worldwide.espacenet.com/) | ACADINT / TECHINT | Documents de brevets, familles et informations techniques | Les statuts juridiques doivent être vérifiés auprès des offices compétents |
| [Registres publics et accès aux documents de l'UE](https://european-union.europa.eu/principles-countries-history/principles-and-values/access-information_en) | GOVINT / LEGINT | Registres documentaires, agendas, procès-verbaux et demandes d'accès | Certains documents sont soumis à exceptions légales |

La Commission européenne présente data.europa.eu comme le portail officiel de découverte des données européennes ; elle précise aussi que certains jeux de données, notamment ceux sur les entreprises, peuvent rester accessibles via les registres nationaux et le portail e-Justice. Les jeux de données à forte valeur doivent être publiés selon des exigences spécifiques de gratuité, de format ouvert et d'accès par API ou téléchargement. [Référence officielle](https://digital-strategy.ec.europa.eu/en/factpages/open-data-and-high-value-datasets-step-step-access-guide).

# 14. Sources institutionnelles américaines

Les sources fédérales américaines sont particulièrement riches pour les dépôts réglementaires, les marchés publics, les dépenses publiques, les brevets, les documents officiels et les données géospatiales.

| Institution / source primaire | Domaine OSINT | Ce qu'on peut y rechercher | Limites à vérifier |
|---|---|---|---|
| [Data.gov](https://data.gov/) | GOVINT / DATAINT | Catalogue des données ouvertes des agences fédérales et portails associés | Le catalogue référence des jeux hébergés par des agences distinctes |
| [USAspending.gov](https://www.usaspending.gov/) | FININT / GOVINT | Contrats, subventions, prêts, bénéficiaires, agences et dépenses fédérales | Données déclaratives soumises à corrections et délais |
| [SAM.gov](https://sam.gov/) | GOVINT / CORPINT | Opportunités de marchés fédéraux et enregistrements d'entités | Certaines fonctions nécessitent un compte |
| [SEC EDGAR](https://www.sec.gov/edgar/search/) | FININT / CORPINT | Rapports périodiques, dépôts réglementaires, propriété déclarée et documents d'émetteurs | Champ principalement lié aux entités soumises aux obligations SEC |
| [Federal Election Commission](https://www.fec.gov/data/) | POLINT / FININT | Contributions, comités, dépenses et déclarations électorales fédérales | Ne couvre pas à elle seule toutes les élections étatiques et locales |
| [GovInfo — GPO](https://www.govinfo.gov/) | LEGINT / GOVINT | Publications officielles des branches législative, exécutive et judiciaire | Vérifier la collection, la date et l'autorité émettrice |
| [USPTO](https://www.uspto.gov/) | CORPINT / TECHINT | Brevets, marques, décisions et données de propriété intellectuelle | Couverture américaine ; compléter avec les bases internationales |
| [USGS Earthquake Catalog](https://earthquake.usgs.gov/earthquakes/search/) | GEOINT / ENVINT | Événements sismiques, localisation, magnitude et horodatage | Données instrumentales révisables |
| [NOAA NCEI](https://www.ncei.noaa.gov/) | ENVINT / GEOINT | Archives climatiques, océaniques et météorologiques | Résolution et couverture selon les séries |
| [NASA Earthdata Search](https://search.earthdata.nasa.gov/) | IMINT / ENVINT | Données d'observation terrestre, atmosphérique et océanique | Certaines collections demandent un compte ou un traitement spécifique |
| [U.S. Census Bureau](https://data.census.gov/) | DEMOINT / ECONINT | Population, ménages, entreprises, économie et géographie | Données agrégées ; respecter les règles de confidentialité statistique |

Le portail Data.gov se présente comme le catalogue officiel des données ouvertes du gouvernement américain. USAspending.gov est la source officielle des dépenses fédérales, tandis que la SEC publie des dépôts EDGAR et des jeux de données publics. [Data.gov](https://data.gov/) · [USAspending](https://www.usaspending.gov/) · [SEC Open Data](https://www.sec.gov/data-research/open-data-sec).

# 15. Sources institutionnelles internationales

| Institution / source primaire | Domaine OSINT | Ce qu'on peut y rechercher | Limites à vérifier |
|---|---|---|---|
| [UNdata](https://data.un.org/) | DATAINT / GOVINT | Statistiques publiées par les agences des Nations Unies | Chaque série conserve sa source, sa définition et son millésime |
| [UN Comtrade](https://comtrade.un.org/) | TRADEINT / FININT | Importations et exportations par produit et partenaire commercial | Données rapportées par les pays, révisées et parfois incomplètes |
| [World Bank Open Data](https://data.worldbank.org/) | ECONINT / DATAINT | Développement, pauvreté, population, économie et infrastructures | Indicateurs agrégés et méthodologies propres à chaque série |
| [IMF Data](https://data.imf.org/) | FININT / ECONINT | Balance des paiements, finances publiques, taux de change et macroéconomie | Définitions et périodicités variables |
| [OECD Data Explorer](https://data-explorer.oecd.org/) | ECONINT / GOVINT | Statistiques comparables, politiques publiques et indicateurs | Couverture plus forte pour les économies membres et partenaires |
| [WHO Global Health Observatory](https://www.who.int/data/gho) | HEALTHINT | Indicateurs de santé publique et systèmes de santé | Données agrégées ; pas un outil de recherche de dossiers médicaux individuels |
| [ILOSTAT](https://ilostat.ilo.org/data/) | SOCINT / ECONINT | Emploi, chômage, salaires et conditions de travail | Comparabilité dépendante des définitions statistiques nationales |
| [FAOSTAT](https://www.fao.org/faostat/) | ENVINT / ECONINT | Agriculture, alimentation, pêche, forêts et production | Données déclarées et estimées selon les séries |
| [WTO Data Portal](https://data.wto.org/) | TRADEINT / ECONINT | Commerce international, tarifs et mesures commerciales | Les bases et millésimes diffèrent selon les indicateurs |
| [ITU DataHub](https://datahub.itu.int/) | NETINT / DATAINT | Télécommunications, connectivité et accès numérique | Indicateurs agrégés, pas données individuelles d'abonnés |
| [WIPO IP Portal](https://www.wipo.int/en/web/ip-portal) | CORPINT / TECHINT | Brevets, marques et propriété intellectuelle internationale | Vérifier les registres nationaux pour le statut juridique final |
| [UNHCR Refugee Data Finder](https://www.unhcr.org/refugee-statistics/) | MIGINT / HUMANINT | Statistiques de déplacements forcés, réfugiés et apatridie | Données statistiques ; prudence avec les petits effectifs et la réidentification |
| [Humanitarian Data Exchange](https://data.humdata.org/) | HUMANINT / GEOINT | Jeux de données humanitaires et géographiques partagés par les acteurs | Vérifier producteur, date, licence et qualité de chaque jeu |

UN Comtrade indique que ses statistiques commerciales sont transmises par les autorités nationales et harmonisées par la Division de statistique de l'ONU. Les portails du FMI et des Nations Unies répertorient également des sources statistiques produites par de nombreuses organisations internationales. [UN Comtrade](https://comtrade.un.org/) · [IMF — International Data Resources](https://data.imf.org/en/Resource-Pages/International-Data-Resources) · [UN Statistics Division](https://unstats.un.org/home/international_agencies/).

# 16. Méthode de validation des sources institutionnelles

Pour chaque ressource ajoutée au catalogue, consigner :

- **Éditeur responsable** : ministère, agence, organisation intergouvernementale ou office national.
- **Juridiction** : pays, Union européenne, région ou périmètre international.
- **Nature de la source** : registre primaire, portail de données, publication, agrégateur ou outil de recherche.
- **Contenu** : données réellement consultables, champs disponibles, profondeur historique et couverture.
- **Accès** : libre, compte requis, API, téléchargement, frais éventuels ou demande formelle.
- **Réutilisation** : licence, attribution, restrictions commerciales et données personnelles.
- **Actualisation** : date de mise à jour, fréquence annoncée et date réelle de dernière publication.
- **Limites** : trous de couverture, déclarations tardives, homonymies, erreurs et changements de schéma.

**Règle de priorité :** une base institutionnelle ou un registre légal est prioritaire sur un agrégateur tiers. Un agrégateur reste utile pour découvrir une piste, mais la conclusion doit être recoupée avec le document ou le registre d'origine.

**Important :** la présence d'une source dans ce répertoire ne signifie ni que toutes ses données sont publiques, ni que leur collecte ou leur réutilisation est autorisée sans restriction.
