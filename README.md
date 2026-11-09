# Hub Yapok Média — site web

Site du hub culturel édité par l'association M'OYAPOK : webradio, podcasts, Yapok Mag, vidéos, photos, agenda, acteurs, candidatures.

Le site est **statique** : pas de base de données, pas de serveur à entretenir. Il s'héberge gratuitement (Cloudflare Pages recommandé) et se met à jour en modifiant les fichiers du dossier `data/`, à la main ou depuis l'espace d'administration `/admin`.

---

## 1. Ce que contient le dossier

| Élément | Rôle |
|---|---|
| `index.html`, `radio.html`, `podcasts.html`, `mag.html`, `videos.html`, `photos.html`, `agenda.html`, `acteurs.html`, `acteur.html`, `rejoindre.html`, `charte.html`, `a-propos.html`, `mentions-legales.html`, `404.html` | Les pages du site |
| `data/*.json` | **Tous les contenus** : réglages, podcasts, magazine, vidéos, photos, agenda, acteurs, grille radio |
| `assets/css/style.css` | La charte graphique (couleurs M'OYAPOK, typographies) |
| `assets/js/main.js` | Menu, pied de page, lecteur radio, affichage des contenus, formulaires, changement de langue |
| `assets/js/i18n.js` | Traductions de l'interface et des pages (fr, pt, en, nl, es) |
| `assets/img/` | Logo M'OYAPOK et visuels provisoires (`visuel-1.svg` à `visuel-6.svg`) |
| `assets/uploads/` | Dossier des fichiers ajoutés depuis l'administration |
| `admin/` | Espace d'administration (Decap CMS) |
| `functions/api/` | Connexion GitHub de l'administration (Cloudflare Pages) |
| `_headers`, `robots.txt` | Réglages de sécurité et de référencement |

## 2. Contenus d'exemple à remplacer

Tous les éléments marqués `"exemple": true` dans `data/` s'affichent avec un badge **Exemple**. Remplacez-les par les vrais contenus, puis passez `exemple` à `false` (ou supprimez la ligne).

À compléter en priorité dans `data/site.json` :

- `mentions.directeurPublication` : nom du directeur ou de la directrice de publication ;
- `reseaux` : liens des chaînes YouTube, TikTok, etc. (vide = lien masqué) ;
- `formulaires` : adresses Formspree (voir §5) ;
- `radio.streamUrl` : adresse du flux quand la webradio sera lancée (vide = « Bientôt à l'antenne »).

Pour le logo Yapok Média (ondes radio sur fond vert), déposez le fichier dans `assets/img/` et remplacez `logo-moyapok-512.jpg` dans `assets/js/main.js` (fonctions `header` et `footer`).

## 3. Mise en ligne gratuite (Cloudflare Pages)

1. Créer un compte gratuit sur **github.com** et un dépôt nommé `yapok-media-hub`. Y déposer tout le contenu de ce dossier (bouton *Add file → Upload files*).
2. Créer un compte gratuit sur **dash.cloudflare.com** → *Workers & Pages* → *Create* → *Pages* → *Connect to Git* → choisir le dépôt.
3. Réglages de construction : *Framework preset* : **None** · *Build command* : vide · *Build output directory* : `/`. Lancer.
4. Le site est en ligne sur une adresse `yapok-media-hub.pages.dev`.
5. Nom de domaine : dans le projet Pages → *Custom domains* → ajouter le domaine acheté (ex. un `.fr`) et suivre les instructions DNS.

Chaque modification envoyée sur GitHub (ou publiée depuis `/admin`) met le site à jour en une à deux minutes.

## 4. Activer l'espace d'administration `/admin`

L'administration permet à l'équipe de modifier les contenus sans toucher au code. Chaque modification devient un **brouillon à relire puis publier** : c'est la validation éditoriale prévue par la charte.

1. Sur GitHub : *Settings* (du compte) → *Developer settings* → *OAuth Apps* → *New OAuth App*.
   - *Homepage URL* : l'adresse du site ;
   - *Authorization callback URL* : `https://VOTRE-DOMAINE/api/callback`.
2. Copier le *Client ID* et générer un *Client secret*.
3. Dans Cloudflare Pages → projet → *Settings* → *Variables and Secrets* : ajouter `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` (en secret), puis redéployer.
4. Dans `admin/config.yml`, remplacer `VOTRE-COMPTE-GITHUB/yapok-media-hub` et `https://www.votre-domaine.fr`.
5. Ouvrir `https://VOTRE-DOMAINE/admin/` et se connecter avec GitHub.

Chaque membre de l'équipe éditoriale a besoin d'un compte GitHub gratuit, invité sur le dépôt (*Settings → Collaborators*).

**Limite à connaître :** cette administration ne cloisonne pas les droits par acteur. Elle convient à l'équipe de M'OYAPOK. Les contributeurs extérieurs passent par le formulaire « Proposer un contenu ». Quand des partenaires devront gérer eux-mêmes leur espace, passer à WordPress Multisite (voir le guide d'hébergement).

## 5. Activer les formulaires (Formspree)

1. Créer un compte gratuit sur **formspree.io** avec l'adresse de l'association.
2. Créer quatre formulaires : *Candidature*, *Proposer un contenu*, *Lettre d'information*, *Contact*.
3. Copier chaque adresse (`https://formspree.io/f/xxxxxxx`) dans `data/site.json` → `formulaires`.

Tant qu'une adresse est vide, le formulaire affiche l'e-mail de Yapok Média à la place. L'offre gratuite de Formspree accepte 50 envois par mois au total.

## 6. Podcasts

- Fichier MP3 de **25 Mo maximum** par fichier sur Cloudflare Pages : exporter en MP3 mono 64 kb/s (environ 15 Mo pour 30 minutes, qualité suffisante pour la voix).
- Pour des épisodes plus longs : héberger le MP3 ailleurs (ex. archive.org, gratuit) et coller son adresse dans le champ `audio`.

## 7. Vidéos

Mettre la vidéo sur la chaîne YouTube de Yapok Média, puis copier son identifiant (les caractères après `watch?v=`) dans `youtubeId`. La vidéo ne se charge qu'au clic, en mode confidentialité renforcée.

## 8. Brancher la webradio

Quand le flux existe (AzuraCast ou Zeno.FM, voir le guide d'hébergement) :

- `radio.streamUrl` : adresse du flux (ex. `https://radio.votre-domaine.fr/listen/yapok/radio.mp3`) ;
- `radio.nowPlayingUrl` (AzuraCast uniquement) : `https://radio.votre-domaine.fr/api/nowplaying/yapok` pour afficher le titre en cours et l'animateur en direct.

Le lecteur, le voyant « En direct » de l'en-tête et l'accueil s'activent automatiquement.

## 9. Langues : français, portugais, anglais, néerlandais, espagnol

Le site s'affiche en **5 langues** : français (par défaut), portugais du Brésil, anglais, néerlandais et espagnol.

- **Choix de la langue** : sélecteur avec un globe dans l'en-tête. À la première visite, le site prend la langue du navigateur si elle fait partie des cinq (un visiteur d'Oiapoque arrive donc directement en portugais). Le choix est mémorisé dans le navigateur.
- **Lien direct vers une langue** : ajouter `?lang=pt`, `?lang=en`, `?lang=nl` ou `?lang=es` à l'adresse (pratique pour un partage sur les réseaux brésiliens ou surinamais).
- **Textes de l'interface et des pages fixes** (menus, boutons, formulaires, charte, mentions légales…) : fichier `assets/js/i18n.js`. Pour corriger une traduction, modifier le texte de la langue voulue.
- **Contenus** (épisodes, agenda, fiches, photos…) : chaque élément peut avoir un bloc `traductions`. Dans l'administration, il apparaît replié sous chaque élément. Un champ laissé vide affiche le texte français.

```json
"titre": "Tampak, le village de la rive",
"traductions": {
  "pt": { "titre": "Tampak, a aldeia da margem" },
  "en": { "titre": "Tampak, the riverside village" }
}
```

- Les formulaires envoient aussi la langue du visiteur (champ `langue`), pour lui répondre dans sa langue.
- La charte et les mentions légales traduites précisent que la version française fait foi.

Les traductions fournies ont été rédigées avec soin mais doivent être relues par une personne de langue maternelle portugaise, néerlandaise et espagnole avant la mise en ligne, en particulier la charte et les mentions légales.

## 10. Tester sur un ordinateur

Les pages chargent les contenus de `data/` : elles ne s'affichent pas correctement en double-cliquant sur un fichier. Lancer un petit serveur dans ce dossier :

```
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000.

## 11. Apparence

La page d'accueil reprend le langage visuel du site One Com Even, aux couleurs de M'OYAPOK : titres condensés en capitales, ligne d'introduction en italique, bandeau défilant vert, rubriques numérotées, bandes sombres « forêt » avec grain et ondes radio, section Kozé Tan Lontan, « rejoindre en trois temps » et bloc contact avec numéro en grand.

Les polices (Archivo et Newsreader, licence libre SIL OFL) sont hébergées avec le site, dans `assets/fonts/` : aucune requête vers Google, ce qui est plus simple vis-à-vis du RGPD.

## 12. Pourquoi Cloudflare Pages plutôt que Netlify pour le hub

Le site One Com Even est sur Netlify, ce qui lui convient. Pour le hub, l'offre gratuite de Netlify est trop juste : 300 crédits par mois, chaque publication coûte 15 crédits et chaque Go servi 20 crédits (environ 15 Go par mois au maximum), et le site est mis en pause quand les crédits sont épuisés. Un hub qui diffuse des podcasts et publie souvent depuis l'administration dépasserait vite ce plafond. Cloudflare Pages n'a pas de limite de bande passante et autorise 500 publications par mois.

Le nom de domaine peut être acheté chez OVH, comme onecomeven.fr, puis branché sur Cloudflare Pages.
