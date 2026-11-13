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
