# Le Bien Heureux — audit, pistes et campagne de lancement

*Audit réalisé le 26 octobre 2026 (édition n° LXI) sur la version publique de lebienheureux.be.*

---

## 0. L'essentiel en une minute

Le site est déjà très abouti. L'identité (manchette de journal, capybara, « Bien, mais pas saint »), la structure des articles (« En bref », « Repère », sources) et l'angle belge sont de vrais atouts. Les éditions du jour, les dossiers suivis, l'écoute de l'article, la lettre « Le Réveil », le flux RSS, le `llms.txt` et la mesure d'audience sans cookie (Koko) sont en place.

Ce qui freine le plus aujourd'hui :

1. **La lettre « Le Réveil » est invisible sur la page d'accueil et les rubriques.** Elle n'apparaît qu'en bas des articles. C'est le seul canal que tu possèdes entièrement : c'est le chantier n° 1.
2. **Le site est lent à répondre** : 0,7 à 1,6 s avant le premier octet (pas de cache de page) et des images lourdes, sans WebP (jusqu'à 456 Ko pour une vignette de 768 px).
3. **Il manque une boucle de retour quotidienne.** On lit, on part, rien ne fait revenir le lendemain, à part la lettre (qu'on ne voit pas).
4. **Un bug visuel sur mobile** : la rubrique (« 🏷️ Bien expliqué ») passe sous l'en-tête collant en haut des articles.
5. **Un peu de rangement SEO** : un émoji en tête des balises `<title>`, un slug avec émoji, des catégories en doublon ou presque vides, pas de sitemap Google News.

La campagne proposée, **« Heureux les informés »**, repose uniquement sur des canaux qui ne demandent **aucune publication depuis tes comptes sociaux** : référencement, lettre et parrainage, quiz partageable par les lecteurs eux-mêmes, relations presse, partenaires d'utilité publique, podcast, et une opération hors ligne « Pause café » à Liège.

---

## 1. Ce que j'ai regardé

- La page d'accueil, une rubrique (Pratique), une édition du jour (25 octobre), deux articles, et les pages « Le Bien Heureux ? », « À propos », « Sur mobile », « Contact », « Mentions légales » et « Dossier : les failles déjà exploitées ».
- Les fichiers techniques : `robots.txt`, sitemaps, flux RSS, `llms.txt`, API REST publique, en-têtes HTTP.
- Le rendu dans Chromium (Playwright), en iPhone 13 émulé et sur un écran de bureau de 1366 px, avec quelques mesures de temps de chargement.

**Limites** : les mesures viennent d'un serveur dans le cloud, pas d'un vrai téléphone en 4G, donc les chiffres réels sur mobile seront plutôt moins bons. Je n'ai eu accès ni à l'administration WordPress, ni aux statistiques Koko, ni à MailPoet, ni à la Search Console. Je ne connais donc pas ton audience actuelle.

### Quelques chiffres relevés

| Mesure | Valeur |
|---|---|
| Articles publiés | 449 depuis le 26 août 2026 (≈ 7 par jour) |
| Répartition | Actualités 249 · Bien expliqué 75 · Pratique 61 · IA, encore! 36 · Hot! 18 · IA :-) 11 · divers |
| Temps avant le premier octet (curl) | 0,65 à 1,6 s selon les pages |
| Accueil mobile (émulé) | TTFB 1,07 s · LCP 2,4 s · chargement 2,6 s · 16 requêtes · ≈ 1,8 Mo |
| Accueil bureau | TTFB 0,32 s · LCP 0,67 s · ≈ 1 Mo |
| HTML | accueil 129 Ko · article ≈ 92 Ko, dont ≈ 50 Ko de CSS en ligne répétés sur chaque page |
| Cache des images | `max-age=900` (15 minutes) |
| Formats d'image | JPEG/PNG uniquement, 0 WebP/AVIF, 1 seul `srcset` sur l'accueil |

---

## 2. Audit

### 2.1 Ce qui marche très bien (à garder absolument)

- **Une identité forte et rare** : la métaphore du journal papier (date, « Édition du matin », « Numéro LXI », kiosque des éditions), le capybara, le manifeste « Le Bien Heureux ? » (« on est plus heureux quand on a compris »). C'est drôle, cultivé et cohérent. Aucun média tech francophone n'a ce ton.
- **L'angle belge comme promesse** (« une bonne affaire qui ne traverse pas la frontière reste surtout une bonne affaire pour quelqu'un d'autre ») : c'est ton fossé concurrentiel.
- **Des articles bien construits** : chapô, intertitres, encadré « Repère », « En bref » et sources détaillées. Des repères utiles et locaux (101, 112, 0800 30 030 dans l'article AirTag).
- **Des formats utilitaires** : dossiers suivis avec chronologie, dossier « failles déjà exploitées », rubrique Pratique.
- **Une base technique saine** : données structurées `NewsArticle` complètes (éditeur, rédacteur en chef, `publishingPrinciples`), `max-image-preview:large` (utile pour Google Discover), polices hébergées sur le site, Koko Analytics (pas de bandeau cookies), `llms.txt` très complet, mentions légales claires, transparence sur l'usage de l'IA (article 50 du règlement IA).
- **Une hygiène de base correcte** : l'énumération des utilisateurs via `/wp-json/wp/v2/users` et `?author=1` est bloquée.

### 2.2 Problèmes et corrections, par priorité

**P0 = cette semaine · P1 = ce mois-ci · P2 = quand tu peux**

| Prio | Constat | Correction proposée |
|---|---|---|
| **P0** | **Pas de formulaire « Le Réveil » sur l'accueil, les rubriques ni le kiosque** (vérifié : 0 formulaire MailPoet hors articles). | Un bloc compact sous la manchette (« ☀️ Le Réveil : chaque matin à 7 h, l'essentiel en 3 minutes »), une page dédiée `/reveil/` pour les QR codes et les partenaires, et le formulaire sur les rubriques, le kiosque, « Sur mobile » et la page 404. |
| **P0** | **Serveur lent** : TTFB de 0,7 à 1,6 s, aucun en-tête de cache sur le HTML, donc WordPress recalcule chaque page. | Un cache de page (WP Super Cache ou Cache Enabler sur Apache/OVH), ou Cloudflare gratuit devant le site (cache, Brotli, HTTP/3). Objectif : TTFB sous 200 ms. |
| **P0** | **Images lourdes** : vignette PNG de 456 Ko (Switch 2), carte Starlink en PNG de 174 Ko, image principale de 158 Ko, aucun WebP/AVIF, `srcset` quasi absent. | Conversion automatique en WebP ou AVIF (WordPress sait générer du WebP via le filtre `image_editor_output_format`, ou une extension comme Converter for Media), `srcset` et `sizes` dans le thème `lbnpapier`, captures d'écran en JPEG ou WebP plutôt qu'en PNG. |
| **P0** | **Bug mobile** : en haut des articles, la ligne de rubrique (« 🏷️ Bien expliqué ») est masquée par l'en-tête collant. On ne voit que des bouts de lettres, puis « • Samedi 24 octobre… ». | Ajouter une marge haute (`scroll-margin`/`padding-top`) à `.article-tete` égale à la hauteur réelle de `.manchette` et de son dégradé éventuel, ou retirer le fond qui déborde sous l'en-tête. |
| **P1** | **Cache navigateur de 15 minutes** sur les images, polices et fichiers statiques. | `Cache-Control: public, max-age=31536000, immutable` sur `/wp-content/uploads/` et sur les fichiers versionnés (`mod_expires` dans `.htaccess`). |
| **P1** | **≈ 50 Ko de CSS en ligne sur chaque page**, jamais mis en cache. | Passer le CSS dans un fichier externe versionné et ne garder en ligne que le CSS critique du haut de page. |
| **P1** | **Émoji en tête du `<title>`, du `og:title` et du `headline` JSON-LD** (« 🔍 REA, l'outil… »), alors que le H1 visible n'en a pas. | Garder l'émoji dans la mise en page, mais le retirer du `<title>`, de l'`og:title` et du `headline`. Le titre technique doit correspondre au H1, comme le demandent les consignes de Google Actualités. |
| **P1** | **Slug avec émoji** : `/2026/10/%f0%9f%8e%ae-switch-2-les-failles-…` et image associée **sans `alt`**, nommée `exec-fb53410f-….png`. On dirait une étape d'automatisation qui a laissé passer l'émoji. | Corriger le slug avec une redirection 301, ajouter l'`alt`, et ajouter dans la chaîne de publication un contrôle qui retire les émojis du slug et refuse une image sans `alt`. |
| **P1** | **Pas de sitemap Google News** (`news-sitemap.xml` en 404). | Générer un sitemap des articles des dernières 48 heures (une extension, ou quelques lignes dans le thème), le déclarer dans `robots.txt` et dans la Search Console. |
| **P1** | **Catégories en désordre** : « IA :-) » (11) à côté de « IA, encore! » (36), « Hot! » (18), « Info en passant » (8), et des catégories à 1 ou 2 articles (« FunFact :-) », « Délire nocturne! », « La news apple du Vendredi », « Ça concerne le journal! », « Mise à jour »). « Dossiers » est à 0. | Garder 5 rubriques (Actualités, Bien expliqué, Pratique, IA encore!, Dossiers), fusionner le reste avec des redirections 301, et utiliser les **étiquettes** pour les sujets (Proximus, itsme, Apple, sécurité…). Le sitemap des étiquettes est quasi vide aujourd'hui. |
| **P1** | **« Pour prolonger » ne propose qu'un seul article.** | En proposer 3 ou 4 : même dossier, même rubrique, même sujet, plus « le plus lu de la semaine ». C'est le levier le plus simple pour augmenter le nombre de pages vues par visite. |
| **P1** | **Pas de manifeste d'application web** (`manifest.json` en 404). La page « Sur mobile » explique l'ajout à l'écran d'accueil, mais sur Android c'est un simple raccourci avec le logo de Chrome. | Ajouter un manifeste (nom, icônes, `theme_color`, `display: standalone`) et un petit service worker. Le site devient installable pour de vrai, peut s'ouvrir hors ligne sur les dernières éditions, et pourra envoyer des notifications si tu le décides un jour (voir 3.3). |
| **P2** | **Hygiène de sécurité** : pas de HSTS ni de `X-Content-Type-Options` ou `Referrer-Policy` ; versions affichées publiquement (`X-Powered-By: PHP/8.5`, `generator WordPress 7.1.3`, `readme.html` accessible) ; `xmlrpc.php` répond. | Ajouter les en-têtes, masquer les versions, supprimer `readme.html`, et bloquer `xmlrpc.php` si aucune application ne s'en sert. Pour un journal qui couvre les failles, c'est aussi une question de cohérence. |
| **P2** | **Traductions EN, NL et DE par GTranslate côté navigateur** : elles dépannent le lecteur, mais elles ne sont pas indexées. | C'est très bien comme confort de lecture. Si la Flandre t'intéresse, mieux vaut une petite sélection d'articles Pratique traduits et relus en néerlandais, avec `hreflang`, qu'une traduction automatique de tout le site, que Google pourrait voir comme du contenu produit en masse. |
| **P2** | **Liens dont le texte est « ICI »** (« on en a parlé ICI »). | Mettre un texte descriptif (« les TV rendues “bêtes” avec l'IA »). C'est mieux pour le référencement et pour l'accessibilité. |
| **P2** | **L'auteur est une organisation** (« Rédaction Capibara »), sans page dédiée. | Une page « La rédaction » avec la bio et la photo du rédacteur en chef, la charte, le processus de relecture humaine et la politique de correction. C'est un signal de confiance pour les lecteurs, Google Actualités et la presse. |

### 2.3 Point éditorial, à méditer

À environ 7 articles par jour, préparés avec l'aide de l'IA, deux risques se cumulent :

- **Le risque Google** : la règle sur le « contenu produit en masse » (*scaled content abuse*) vise les pages qui réécrivent l'actualité d'autres médias sans rien y ajouter. Tes articles ajoutent beaucoup (sources, contexte, angle belge), mais les brèves purement internationales (les Knicks, Starlink en Ukraine…) sont les plus exposées.
- **Le risque de promesse** : la page « À propos » dit « Nous préférons publier moins plutôt que remplir une page avec du bruit ».

**Ma recommandation** : garder le rythme, mais faire monter la part de ce que personne d'autre ne fait. Ce sont les articles « Dispo en Belgique ? », les prix en euros belges, les opérateurs locaux (Proximus, Orange, Telenet, BICS), les fiches Pratique et les dossiers suivis. Ce sont aussi ces contenus que les partenaires et la presse reprendront (voir la partie 4).

---

## 3. Pistes pour rendre le site plus « addictif »

**Le parti pris** : addictif au bon sens, c'est-à-dire **un rituel qu'on a envie de retrouver**, pas une machine à faire défiler sans fin. Ce serait contraire à ta promesse « le temps d'une pause ». Le bon modèle, c'est le journal du matin ou le Wordle : un rendez-vous court, quotidien, qui se termine par « tu es à jour ».

Toutes ces idées fonctionnent **sans compte lecteur**. Le suivi se fait dans le navigateur (`localStorage`), ce qui reste cohérent avec ta mesure d'audience sans cookie.

### 3.1 Les cinq meilleurs leviers (impact fort)

**1. « Le Quiz du Capibara », trois questions par jour**
- Trois questions sur l'actualité de la veille, chaque réponse renvoyant vers l'article concerné.
- On partage son score sous forme de petite grille, comme Wordle :
  `Le Bien Heureux n° LXII 🟩🟩🟥 2/3 — lebienheureux.be/quiz`
- **C'est le moteur viral principal de la campagne** : ce sont *les lecteurs* qui le partagent dans leurs groupes WhatsApp, au bureau ou en famille. Tu n'as rien à publier toi-même.
- Il peut se générer à partir des « En bref » existants, avec une relecture humaine. Il se place dans « Le Réveil », sur l'accueil et en fin d'édition.

**2. « Nouveau depuis ta dernière visite » et « Tu es à jour ✅ »**
- Sur l'accueil : « 7 articles depuis ton dernier passage », avec une pastille sur les articles non lus.
- En bas de l'édition : « Tu as tout lu. Bonne pause ☕ — rendez-vous demain à 7 h ».
- La sensation de boucler son journal crée l'habitude, et c'est l'inverse d'un mécanisme toxique.

**3. Des rangs de lecteur, dans l'esprit de la maison**
- Profane (1re visite), puis Lecteur, puis **Fidèle** (7 jours de lecture), **Bienheureux** (30 jours), et enfin **Saint** (100 jours, « canonisé, mais on n'y croyait plus »).
- Le rang s'affiche discrètement en haut du menu et se partage en image, avec un capybara auréolé.
- Le gag « Bienheureux, mais pas saint » vient de ton propre manifeste. C'est une gamification que personne ne peut copier.

**4. « Le Réveil » qui devient une vraie édition**

Aujourd'hui, la lettre envoie la liste des nouveaux articles avec un lien vers chacun. Une lettre éditorialisée se lit, s'ouvre et se transfère beaucoup plus. Proposition de format fixe, à lire en 3 minutes :
- ☀️ **La une en trois phrases**
- 🧰 **Le geste pratique du jour**, faisable en 2 minutes (par exemple « passe Gmail à 30 s d'annulation »)
- 🇧🇪 **Dispo chez nous ?**, quand il y a un sujet
- 🐹 **Le truc cocasse** (DOOM sur une pince ampèremétrique…)
- ❓ **Le quiz du jour** (voir le point 1)
- ✉️ **« Transfère Le Réveil à quelqu'un qui en a besoin »**, avec le lien de parrainage (voir 4.4)

Ajouter aussi **« Le Bien Heureux du dimanche »**, un récapitulatif de la semaine avec le grand quiz.

**5. « Écouter l'édition », le journal parlé du matin**
- La synthèse vocale par article existe déjà. Il suffit de la prolonger en **lecture enchaînée des articles du jour**, à écouter dans la voiture ou sous la douche.
- Étape suivante : un **flux podcast** quotidien de 5 minutes (« Le Réveil en audio ») publié sur Apple Podcasts, Spotify et Deezer. C'est un nouveau canal de découverte qui ne demande aucun compte social (voir 4.5).
- La voix de synthèse doit être clairement annoncée, comme le prévoit l'article 50 du règlement IA que tu cites déjà.

### 3.2 Leviers complémentaires

| Idée | Pourquoi ça fidélise | Effort |
|---|---|---|
| **« J'ai 2 / 5 / 10 minutes »** : un bouton « Pause café » qui compose une sélection à la durée choisie | C'est ta promesse « le temps d'une pause », transformée en fonction | Faible |
| **Badge « 🇧🇪 Dispo chez nous : oui / non / bientôt »** et prix en euros belges, systématiques sur les articles produit | Rend l'angle belge visible en un coup d'œil, et c'est très partageable | Faible |
| **« Suivre ce dossier »** : un courriel quand un dossier est mis à jour (segments MailPoet), plus une progression « 3/5 articles lus » | Fait revenir sur les sujets longs, comme une série | Moyen |
| **Tableau « Mes mises à jour »** sur le dossier des failles, avec une case « c'est fait » par faille | Un outil utile toutes les semaines, qu'on garde dans ses favoris | Moyen |
| **« Le courrier du capibara »** : les lecteurs envoient leurs questions tech, et un article par semaine y répond | Crée une communauté, et ces vraies questions sont d'excellentes requêtes Google | Faible |
| **Réactions en un clic** : « 💡 J'ai appris un truc », « 🛠️ Ça m'a servi », « 😂 » | Engage sans modération, et te dit ce qui marche | Faible |
| **La « Une » du jour en image**, générée automatiquement pour chaque édition (aspect papier) | Une image prête à transférer, qui sert aussi d'image de partage pour les pages d'édition | Moyen |
| **Œufs de Pâques** : code Konami, capybara caché dans une édition, « Délire nocturne » | Fait parler du site, très « geek », cohérent avec tes articles sur les jeux cachés | Faible |
| **« Pour prolonger » enrichi**, avec 3 ou 4 suggestions et une carte « Article suivant » bien visible | Plus de pages par visite | Faible |

### 3.3 Les notifications : seulement sur demande, seulement pour l'utile

La page « Sur mobile » promet aujourd'hui « le journal n'envoie pas de notifications ». C'est un argument, à garder par défaut. Une option volontaire, **« Alerte faille exploitée »**, envoyée seulement quand une faille activement exploitée touche un produit grand public, rendrait service sans trahir cette promesse. Il faut pour cela le manifeste et le service worker du point P1. Sur iPhone, les notifications web ne fonctionnent qu'une fois le site ajouté à l'écran d'accueil.

### 3.4 Ce que je déconseille

Le défilement infini, les fenêtres surgissantes à l'arrivée, les compteurs de série culpabilisants (« tu vas perdre ta série ! »), le titre qui promet plus que l'article et les notifications quotidiennes. Ces mécanismes font monter les chiffres une semaine, puis abîment la confiance, qui est ton actif principal.

---

## 4. La campagne « Heureux les informés »

### 4.1 Le cadre

- **La contrainte** : rien n'est publié depuis tes comptes sociaux. Toute la campagne repose sur des canaux que tu possèdes (site, lettre, podcast), sur ce que les lecteurs partagent eux-mêmes, sur des relais tiers (presse, partenaires, sources) et sur des actions hors ligne.
- **L'objectif principal** : les abonnés à « Le Réveil ». C'est le seul public qui t'appartient et qui revient chaque jour sans dépendre d'un algorithme.
- **Les objectifs secondaires** : les visiteurs qui reviennent (Koko), les clics depuis Google Recherche, Actualités et Discover (Search Console), les liens entrants et les reprises dans la presse.
- **Les publics, par ordre de priorité** :
  1. Les Belges francophones curieux de tech, de 25 à 55 ans, qui veulent comprendre sans jargon.
  2. Les familles et les seniors qui ont besoin d'aide pratique (arnaques, mises à jour, réglages), touchés **par l'intermédiaire de partenaires**.
  3. Les geeks et développeurs (Bien expliqué, sécurité, IA).
  4. Les indépendants et les TPE, pour le volet failles et mises à jour.
- **Le message** : « On dit “heureux les ignorants”. On pense l'inverse. » La signature : **« Heureux les informés. La tech bien expliquée, le temps d'une pause. »** La preuve à mettre en avant : **« Dispo en Belgique ? On a vérifié. »**
- **Les garde-fous** : pas de faux comptes ni de faux avis, pas d'abonnés achetés, toute collaboration payée signalée comme publicité, et pas d'inscription à la lettre sans double confirmation (MailPoet le fait déjà).

### 4.2 Préparer le terrain (semaines 1 et 2, du 2 au 15 novembre)

Avant d'amener du monde, il faut que le site retienne les visiteurs :

- [ ] Les corrections P0 : formulaire « Le Réveil » partout, cache de page, images en WebP, bug de la rubrique sur mobile.
- [ ] La page `/reveil/`, qui servira d'atterrissage à toute la campagne, avec un exemple de lettre et la promesse « 3 minutes, 7 h, gratuit ».
- [ ] Google Search Console et Publisher Center, le sitemap News, Bing Webmaster Tools et **IndexNow** (l'extension officielle de Microsoft), pour une indexation immédiate sur Bing et les moteurs qui s'en servent.
- [ ] Une page **« Presse et partenaires »** : qui vous êtes, chiffres clés, logo et capybara en haute définition, contact, et ce qu'un partenaire peut reprendre.
- [ ] Des pages d'atterrissage par canal hors ligne (`/cafe/`, `/epn/`, `/fosdem/`…) pour mesurer chaque QR code dans Koko.

### 4.3 Trois contenus « aimants » à créer pour la campagne

Ce sont des contenus que **d'autres** auront envie de relayer, ce qui compense l'absence de tes réseaux.

1. **« Le guide de survie numérique belge »** (PDF imprimable et page web) : itsme et carte d'identité électronique, faux SMS de colis, faux conseillers bancaires, double authentification, sauvegardes, réglages vie privée. Il assemble tes fiches Pratique existantes. C'est l'outil clé pour les bibliothèques, les espaces publics numériques et les associations de seniors.
2. **« Le baromètre des prix tech, Belgique contre France »**, mis à jour chaque mois : smartphones, consoles, abonnements de streaming, forfaits. C'est le genre de donnée que la presse belge aime citer (« en Belgique, on paie X % de plus »), ce qui rapporte des liens et des reprises.
3. **« 7 jours pour un téléphone bien heureux »** : un défi par courriel, un geste par jour, lancé pour les bonnes résolutions de janvier. C'est le meilleur aimant à inscriptions, et il fait découvrir « Le Réveil » à la fin.

Plus deux temps forts saisonniers, déjà dans ton ton :
- **Black Friday (27 novembre)**, « Les vraies et les fausses promos tech en Belgique », et **Saint-Nicolas (6 décembre)**, « Idées cadeaux tech qui fonctionnent vraiment en Belgique ».
- **Fin décembre : « Le grand quiz tech 2026 »**, avec un score à partager.

### 4.4 Les canaux, tous sans tes comptes sociaux

**A. Le référencement : Google, Discover, Actualités, Bing**
- C'est ton premier canal gratuit. Les corrections de la partie 2, le sitemap News et des titres propres comptent déjà beaucoup.
- Crée des **pages « sujet » belges qui durent** : Proximus, Orange Belgium, Telenet, itsme, Bpost (arnaques), application SNCB, prix Apple en Belgique, etc. Ce sont des requêtes locales sur lesquelles les grands médias français ne se battent pas.
- Mets à jour les dossiers (« État des lieux mis à jour le… »). Google valorise la fraîcheur, et tes dossiers sont déjà construits pour ça.

**B. La lettre, le parrainage et le partage par les lecteurs**
- **Parrainage « Le Réveil »** : 1 filleul donne un fond d'écran capybara exclusif, 3 filleuls un autocollant envoyé par la poste, 10 filleuls un mug ou un t-shirt « Bienheureux, mais pas saint ».
- **Le quiz du jour et les rangs de lecteur** (partie 3) : les lecteurs partagent eux-mêmes.
- Le bouton « Faire lire cet article » existe déjà : ajoute un message prérempli pour WhatsApp (« Tiens, ça m'a fait penser à toi : … »).

**C. Prévenir les sources, la tactique la plus rentable**
- Quand un article parle d'un projet, d'un chercheur ou d'un développeur (curl, KeePassXC, l'étudiant qui lit les QR codes à la main, un vidéaste…), envoie-lui un courriel court avec le lien.
- Beaucoup relaient la couverture sur *leurs* comptes, auprès d'un public exactement ciblé. Ça prend 2 minutes par article important. Un modèle est en 4.8.

**D. Relations presse**
- **L'angle** : « Un journal tech belge indépendant, porté par une ASBL liégeoise, qui vérifie si les promesses de la tech valent aussi en Belgique. »
- **Les cibles** : la presse locale liégeoise (Sudinfo et La Meuse, L'Avenir, la télévision locale RTC, Vivacité Liège), puis la presse nationale (RTBF, Le Soir, La Libre, DH, Moustique, Le Vif) et la presse IT (Data News).
- **Deux formats** :
  1. Le communiqué de lancement de la campagne, avec le baromètre des prix comme donnée exclusive.
  2. Une proposition d'**expert à disposition** : « besoin d'expliquer une faille ou une arnaque en 30 secondes ? Appelez-nous ». Chaque passage à la radio ou dans un journal cite le nom du journal.
- **Proposer une chronique tech régulière** à une radio locale ou associative : 3 minutes par semaine, « Le Bien Heureux explique ».
- Envisager l'adhésion au **Conseil de déontologie journalistique (CDJ)**. C'est un sceau de crédibilité pour la presse et les partenaires (conditions à vérifier).

**E. Les partenaires d'utilité publique** (le relais vers le grand public)
- **Qui** : les Espaces publics numériques (EPN) de Wallonie et de Bruxelles, les bibliothèques publiques, les associations de seniors (par exemple Énéo), les écoles et l'éducation aux médias (CSEM), les organisations d'indépendants (UCM), Test Achats, et Safeonweb (Centre pour la cybersécurité Belgique) pour le volet arnaques et failles.
- **Ce que tu offres** : le guide de survie en PDF, des fiches Pratique **reproductibles avec un lien vers l'article**, et éventuellement un atelier « Sécuriser son téléphone en 1 heure ». Tes mentions légales interdisent aujourd'hui la reproduction intégrale. Une licence spéciale pour les fiches Pratique (par exemple CC BY-NC-ND, avec lien obligatoire) déverrouillerait ce canal.
- **Un widget** « Les failles à corriger cette semaine » ou « Le Réveil », à intégrer sur les sites des partenaires, avec un lien vers toi.
- Le Chemin Numérique ASBL peut aussi regarder les **aides publiques à l'éducation aux médias et à l'inclusion numérique** (Fédération Wallonie-Bruxelles, Digital Wallonia). Ces appels collent à ta mission, mais les conditions sont à vérifier.

**F. Le podcast quotidien « Le Réveil en audio »**
- Cinq minutes, publiées sur Apple Podcasts, Spotify et Deezer. Les plateformes de podcasts sont des moteurs de découverte à part entière, et aucun compte social n'est nécessaire, seulement un hébergeur de podcast avec flux RSS.
- La voix de synthèse doit être annoncée au début de chaque épisode.

**G. L'opération hors ligne « Pause café » à Liège**
- Des **sous-bocks et sous-tasses** dans des cafés, brasseries, sandwicheries et autour du campus de l'ULiège : « Le temps de ce café, comprends un truc tech. » avec un QR code vers `/cafe/`. C'est très belge, et en plein dans la promesse « le temps d'une pause ».
- Des **autocollants capybara** (« Heureux les informés »), qui marchent bien sur les ordinateurs portables des étudiants et des développeurs.
- Une affiche A4 dans les EPN et les bibliothèques partenaires, avec le guide de survie.

**H. Les événements**
- Le **FOSDEM** à Bruxelles (habituellement le premier week-end de février, donc probablement les 6 et 7 février 2027, à confirmer) : distribuer des autocollants et rencontrer les projets libres que tu couvres.
- Les rencontres tech liégeoises et les ateliers dans les EPN.

**I. Option payante (petit budget)**
- **Le meilleur rapport qualité-prix** : des encarts sponsorisés dans d'autres lettres d'information tech francophones, surtout celles qui ont un lectorat belge, plus des échanges de recommandations gratuits entre lettres (« si tu aimes X, abonne-toi à Y »).
- La publicité sur les réseaux sociaux demanderait un compte publicitaire. Je la laisse de côté, puisque tu ne veux pas passer par là.

**J. Option à décider : un compte au nom du journal**
- Si « mes comptes sociaux » veut dire *tes comptes personnels*, un compte **au nom du Bien Heureux**, alimenté automatiquement par le flux RSS (Bluesky, Mastodon, chaîne WhatsApp), apporterait une présence minimale sans que tu publies toi-même. Même chose pour les sites communautaires francophones comme Journal du Hacker ou LinuxFr.org, en respectant leurs règles sur l'autopromotion.
- Si tu ne veux **aucune** présence sociale, la campagne fonctionne sans : tout ce qui précède s'en passe.

### 4.5 Calendrier sur 12 semaines

| Semaines | Dates | Actions |
|---|---|---|
| S1–S2 | 2 → 15 nov. | Corrections P0 et P1 prioritaires, page `/reveil/`, Search Console, sitemap News, IndexNow, page « Presse et partenaires », nouvelle formule du « Réveil » |
| S3 | 16 → 22 nov. | Lancement du quiz du jour et de « Nouveau depuis ta visite ». Article événement sur **Voyager 1 à un jour-lumière (18 novembre)**, à proposer aux planétariums et clubs d'astronomie. Début de « prévenir les sources » |
| S4 | 23 → 29 nov. | **Black Friday (27 nov.)** : guide « vraies et fausses promos en Belgique ». Suivi de Quad9 qui quitte la France (24 nov.). Lancement du parrainage |
| S5 | 30 nov. → 6 déc. | **Saint-Nicolas (6 déc.)** : guide cadeaux. Communiqué de presse et baromètre des prix n° 1. Premiers contacts EPN et bibliothèques |
| S6–S7 | 7 → 20 déc. | Guide de survie numérique belge, envoyé aux partenaires. Sous-bocks et autocollants dans les cafés liégeois. Lancement du podcast |
| S8–S9 | 21 déc. → 3 janv. | **« Le grand quiz tech 2026 »** et rétrospective « Le Bien Heureux de l'année » |
| S10 | 4 → 10 janv. | **Défi « 7 jours pour un téléphone bien heureux »** (bonnes résolutions). Baromètre des prix n° 2 |
| S11–S12 | 11 → 24 janv. | Bilan des canaux, on renforce ceux qui marchent. Préparation du FOSDEM (6 et 7 février 2027, à confirmer) |

### 4.6 Budget indicatif

| Formule | Contenu |
|---|---|
| **0 €** | Référencement, lettre, quiz, prévenir les sources, relations presse, partenaires, podcast (hébergeur gratuit) |
| **Léger** (quelques centaines d'euros) | En plus : impression de sous-bocks et d'autocollants, cadeaux de parrainage, hébergeur de podcast payant |
| **Moyen** | En plus : 2 ou 3 encarts sponsorisés dans des lettres tech francophones, objets (mugs, t-shirts), présence au FOSDEM |

*Les prix d'impression et des encarts varient beaucoup : demande des devis.*

### 4.7 Mesurer

| Indicateur | Où le lire | Ce qu'on regarde |
|---|---|---|
| Abonnés au « Réveil » et taux d'ouverture | MailPoet | Croissance par semaine et par source (formulaire, page `/reveil/`, parrainage) |
| Visiteurs qui reviennent | Koko Analytics | Part des visiteurs revenus dans les 7 jours |
| Pages par visite | Koko Analytics | Effet de « Pour prolonger » et de « Nouveau depuis ta visite » |
| Clics depuis Google (Recherche, Actualités, Discover) | Search Console | Évolution après les corrections techniques |
| Scans des QR codes | Koko (pages `/cafe/`, `/epn/`…) | Quels lieux et quels partenaires apportent des lecteurs |
| Reprises et liens | Alertes Google sur « lebienheureux » et Search Console (liens) | Presse, partenaires, sources qui relaient |
| Écoutes du podcast | Statistiques de l'hébergeur | Croissance par épisode |

**Rituel conseillé** : un point de 15 minutes chaque lundi. On garde ce qui fait monter les abonnés et on arrête le reste au bout de 3 semaines.

### 4.8 Modèles de textes prêts à l'emploi

**Courriel à une source (français)**
> Objet : Nous avons parlé de [projet] dans Le Bien Heureux
>
> Bonjour [prénom],
>
> Nous avons consacré un article à [projet/découverte] dans Le Bien Heureux, un journal tech belge francophone : [lien].
> Nous avons essayé d'expliquer [l'idée clé] simplement à un public non spécialiste. Si une erreur s'est glissée, dites-le-nous et nous la corrigerons.
> Si l'article vous plaît, n'hésitez pas à le partager.
>
> Bonne journée,
> La rédaction du Bien Heureux — capibara@lebienheureux.be

**Courriel à une source (anglais)**
> Subject: We covered [project] in Le Bien Heureux (Belgium)
>
> Hi [name],
> We wrote about [project] for French-speaking readers in Belgium: [link]. We tried to explain [key idea] for a non-technical audience. If we got anything wrong, let us know and we'll fix it. Feel free to share it if you like it.
> Best, the Le Bien Heureux newsroom — capibara@lebienheureux.be

**Proposition à un partenaire (EPN, bibliothèque, association)**
> Objet : Un guide gratuit « survie numérique » pour vos usagers
>
> Bonjour,
> Le Bien Heureux est un journal tech belge porté par Le Chemin Numérique ASBL, à Liège. Nous publions chaque jour des explications et des fiches pratiques sans jargon (arnaques, mises à jour, réglages).
> Nous avons réalisé un **guide de survie numérique belge** en PDF imprimable, que vous pouvez distribuer librement à vos usagers. Nos fiches pratiques peuvent aussi être reprises sur votre site, avec un lien vers l'article.
> Seriez-vous partants pour [le diffuser / organiser un atelier d'une heure / l'afficher] ?
> Bien à vous,
> [Nom], Le Bien Heureux

**Accroche du communiqué de presse**
> **Heureux les informés : un journal liégeois vérifie si les promesses de la tech valent aussi en Belgique**
> Lancé fin août 2026 par Le Chemin Numérique ASBL, Le Bien Heureux publie chaque jour l'actualité tech expliquée « le temps d'une pause », avec une obsession : le prix, la disponibilité et les conditions *chez nous*. Son premier baromètre des prix montre que [donnée clé du baromètre].

**Texte du sous-bock**
> ☕ Le temps de ce café, comprends un truc tech.
> *Le Bien Heureux — la tech bien expliquée, depuis la Belgique.*
> [QR code] lebienheureux.be/cafe

**Bloc de parrainage dans « Le Réveil »**
> 🐹 Tu connais quelqu'un qui clique sur tous les liens de faux colis ? Transfère-lui Le Réveil. Ton lien perso : [lien]. Au 3e filleul, le capybara t'envoie un autocollant par la poste.

---

## 5. Check-list des 30 prochains jours

- [ ] Formulaire « Le Réveil » sur l'accueil, les rubriques et le kiosque, plus la page `/reveil/`
- [ ] Cache de page ou Cloudflare, puis vérifier que le TTFB passe sous 200 ms
- [ ] WebP ou AVIF, `srcset` dans le thème, PNG lourds convertis
- [ ] Correction de la rubrique masquée sous l'en-tête mobile
- [ ] Cache d'un an sur `/wp-content/uploads/`
- [ ] Émojis retirés du `<title>`, de l'`og:title` et du `headline`, et slug Switch 2 corrigé avec une redirection 301
- [ ] Sitemap Google News, Search Console, Bing Webmaster Tools, IndexNow
- [ ] Rubriques fusionnées (5 au maximum) avec redirections 301
- [ ] « Pour prolonger » avec 3 ou 4 articles
- [ ] Nouvelle formule du « Réveil » (une, geste du jour, Belgique, cocasse, quiz)
- [ ] Quiz du Capibara (version 1, même simple)
- [ ] « Nouveau depuis ta dernière visite » et « Tu es à jour ✅ »
- [ ] Page « Presse et partenaires », puis premier envoi « prévenir les sources »
- [ ] Guides Black Friday (27 nov.) et Saint-Nicolas (6 déc.)
- [ ] Décider : un compte au nom du journal, oui ou non (4.4 J) ?
