# 02 — OSINT

Collecte, vérification, préservation et analyse responsable d'informations issues de sources publiquement accessibles ou légalement obtenues.

## Taxonomie

La taxonomie détaillée est maintenue dans [OSINT-TAXONOMY.md](../../OSINT-TAXONOMY.md). Le répertoire de sources par famille est disponible dans [OSINT-SOURCES.md](../../OSINT-SOURCES.md). Ces documents distinguent familles de renseignement, catégories de collecte, sources primaires, agrégateurs et outils.

### Grandes familles couvertes
- **Web & contenus** : WEBINT, NEWSINT, ACADINT, DOCINT.
- **Identités & communautés** : SOCMINT, IDINT, EMAILINT, TELINT, HUMINT-OSINT.
- **Géographie & médias** : GEOINT, IMINT, VIDINT, AUDIOINT, ENVINT, SPACEINT.
- **Infrastructure & cyber** : DOMINT, NETINT, CYBINT, MALINT, CODEINT, IOTINT, CRYPTINT.
- **Économie & institutions** : CORPINT, FININT, SANCINT, LEGINT, GOVINT, ELECTINT, SUPPLYINT, RISKINT.
- **Mobilité & société** : AVINT, MARINT, EVENTINT, MEDINT-OSINT, BIOINT, DISINFOINT.

## Répertoires de référence
- [Bellingcat Online Investigation Toolkit](https://bellingcat.gitbook.io/toolkit/categories/all) — outils par familles (cartes, géolocalisation, médias, réseaux sociaux, personnes, entreprises, transport, archives).
- [OSINT Framework](https://osintframework.com/) — arbre de ressources et outils.
- [jivoi/awesome-osint](https://github.com/jivoi/awesome-osint) — répertoire communautaire.
- [Sisserou OSINT Framework](https://www.sisserouhub.org/) — taxonomie étendue et outils récents ; vérifier chaque entrée avant adoption.
- [GIJN — Online Research Tools](https://gijn.org/resource/online-research-tools/) — méthodes et ressources d'investigation journalistique.
- [IntelTechniques](https://inteltechniques.com/) — outils et guides d'investigation.

## Sources et outils sélectionnés
- **Recherche & archives** : [Google Search](https://www.google.com/), [Internet Archive](https://web.archive.org/), [Common Crawl](https://commoncrawl.org/).
- **SOCMINT & identité** : [Maigret](https://github.com/soxoj/maigret), [Sherlock](https://github.com/sherlock-project/sherlock), [WhatsMyName](https://github.com/WebBreacher/WhatsMyName).
- **GEOINT & IMINT** : [OpenStreetMap](https://www.openstreetmap.org/), [Copernicus Browser](https://browser.dataspace.copernicus.eu/), [NASA Worldview](https://worldview.earthdata.nasa.gov/), [USGS EarthExplorer](https://earthexplorer.usgs.gov/).
- **Vérification média** : [InVID-WeVerify](https://www.invid-project.eu/tools-and-services/invid-verification-plugin/), [ExifTool](https://exiftool.org/), [TinEye](https://tineye.com/).
- **Infrastructure publique** : [ICANN Lookup](https://lookup.icann.org/), [crt.sh](https://crt.sh/), [Censys](https://search.censys.io/), [urlscan.io](https://urlscan.io/).
- **Entreprises & conformité** : [OpenCorporates](https://opencorporates.com/), [OpenSanctions](https://www.opensanctions.org/), [SEC EDGAR](https://www.sec.gov/edgar/search/).
- **Actualités & recherche** : [GDELT](https://www.gdeltproject.org/), [OpenAlex](https://openalex.org/), [Crossref](https://www.crossref.org/).

## Sources publiques utiles au Bénin
- [Portail officiel du Gouvernement](https://www.gouv.bj/) — annonces et institutions.
- [Journal Officiel du Bénin](https://www.journalofficiel.gouv.bj/) — lois, décrets et actes officiels.
- [INStaD](https://www.instad.bj/) — statistiques, recensements et enquêtes.
- [Données ouvertes INStaD](https://benin.opendataforafrica.org/) — indicateurs et jeux de données.
- [National Data Archive (NADA)](https://nada.instad.bj/) — métadonnées et microdonnées d'enquêtes lorsque l'accès est autorisé.
- [Base de données financières de la DGB](https://databudgetbenin.finances.bj/) — recettes, dépenses et données budgétaires.
- [Journal National des Marchés Publics](https://sygjmap.finances.bj/) — avis et journaux officiels des marchés publics.
- [Direction Nationale du Contrôle](https://dnc.bj/) — marchés publics, répertoires et plateformes liées.
- [APIEx](https://apiex.bj/) — informations institutionnelles sur les investissements et formalités d'entreprise.
- [Portail national des services publics](https://service-public.bj/) — services administratifs et procédures publiées.

## Méthode minimale
1. Formuler une question précise et un périmètre légal.
2. Identifier les sources primaires avant les agrégateurs.
3. Conserver URL, date de consultation, éditeur et contexte.
4. Recouper les informations avec des sources indépendantes.
5. Distinguer faits, hypothèses et niveau de confiance.
6. Documenter les limites, les données manquantes et la fraîcheur.

## Sécurité et éthique
Ne pas collecter de données privées sans base légale, contourner des contrôles d'accès, republier des données volées ou utiliser ces ressources pour doxxing, harcèlement ou stalking. Respecter les conditions d'utilisation, les licences et les règles applicables de protection des données. Voir [QUALITY.md](../../QUALITY.md).

**Note de curation :** les liens cités dans cette page sont des pistes de référence. Leur présence ne signifie pas que chaque fonction, licence, tarif ou disponibilité a été vérifié. Les fiches du catalogue conservent le statut `needs-review` jusqu'à une vérification humaine.
