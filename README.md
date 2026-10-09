# Matheasy

Plugin [ONLYOFFICE](https://www.onlyoffice.com/) gratuit pour écrire et annoter des notations mathématiques, pensé comme pendant libre de MathType pour les Desktop Editors. Cible : enseignants et élèves, avec priorité au secondaire supérieur (FWB).

Compagnon de [Colorisation PLAI](https://github.com/jfb4plai/colorisation-plai-onlyoffice) : même architecture (plugin JS, manifeste `config.json`, hébergement statique).

## Principe

Pas d'objet OLE : les formules sont des **équations natives** du document (insérées via `AddMathEquation`, formats `latex` / `mathml` / `unicode`). L'élève peut donc rouvrir, compléter et annoter les formules de l'enseignant sans le plugin.

## État (v0.12.0 ; v0.11.0 testée dans ONLYOFFICE Desktop le 2026-10-09)

Panneau latéral à droite du document (une variante « fenêtre » reste disponible).

- **Saisie** : champ [MathLive](https://github.com/arnog/mathlive) multi-lignes (Entrée = nouvelle ligne, chaque ligne devient un paragraphe), palettes par thème (Structures, Symboles, Grec, Analyse, Ensembles & logique, Fonctions, Probabilités), « + Commentaire » à droite d'une ligne, « + Exercice » (titres numérotés).
- **Cases à compléter** : fraction et racine à cases vides natives, qui disparaissent quand l'élève tape.
- **Modification** : une formule ou une résolution entière (plusieurs paragraphes) se recharge dans le champ (`scripts/json2latex.js`) et se remplace en place, ou s'insère à la suite. Si ONLYOFFICE refuse une ligne, tout est annulé : pas de doublon.
- **Outils repliables** (état mémorisé sur le poste) : annotation de la sélection (couleur, barré), graphique de la fonction (tracé hors ligne, zéros et intersections affichés seulement sur demande, insertion en image, export de la commande vers GeoGebra), tableau du document à traits (signes, variations, Horner).
- **Couleur des lignes insérées** : automatique, ou bleu / vert / rouge (travail de l'élève).
- **Accessibilité** : texte de 16 px minimum, libellés explicites, nom accessible sur chaque touche de palette, messages annoncés aux lecteurs d'écran.
- **Charte** : PLAI (teal `#0f6e56`, DM Sans / DM Serif Display) ; icône du plugin : logo JFB4PLAI (`tools/generate_icons.py`).
- **Outils de test** masqués (Ctrl+Maj+D, ou 5 clics sur le numéro de version) : corpus, sondes de l'API, expériences de rendu, calculatrice GeoGebra intégrée.

### Ce que le moteur d'ONLYOFFICE accepte ou non (testé)

- Accepté : équations natives via `AddMathEquation` (LaTeX), couleur et barré sur une partie d'équation via `ApiRange.SetColor` / `SetStrikeout`, accolade, matrices, systèmes, alignement, vecteur (`\vec`), encadré (MathML `menclose box`).
- Refusé : `\cancel`, `\boxed` (LaTeX), `\color`, `\textcolor`, `\overrightarrow` (Matheasy convertit ou signale).
- Lecture par sélection (`Range.ToJSON`) : le contenu des racines ressort vide ; la lecture du paragraphe entier est correcte.
- Événements du document : seuls `onDocumentContentReady` et `onTargetPositionChanged` sont reçus ; pas de `onClick` / `onDblClick` (pas d'ouverture au double-clic, d'où le bouton et le clic droit « Modifier avec Matheasy »).

### Historique

Détail version par version : `git log`. Étapes : v0.1-0.4 éditeur, palettes, réédition, MathLive embarqué ; v0.5-0.7 résolutions multi-lignes, commentaires, remplacement en place ; v0.8-0.10 onglet Fonctions, exercices numérotés, tableaux à traits, graphique et GeoGebra ; v0.11 traceur fiable (`sin x`, zéros doubles), remplacement sans doublon, panneau allégé, charte PLAI ; v0.12 texte 16 px minimum, libellés de palette explicites, icône JFB4PLAI, tests lancés avant chaque fabrication.

## Tests

`node tests/run-all.js` (lancé aussi automatiquement par les scripts de fabrication) : conversion JSON → LaTeX, découpage des lignes, blocs (matrices), tracé et zéros, conversion vers GeoGebra.

## Fabriquer le fichier .plugin

- Windows : double-clic sur `tools\build-plugin.bat` (ou en PowerShell : `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\build-plugin.ps1`)
- Linux/macOS : `./tools/build-plugin.sh`

Résultat : `dist/matheasy.plugin`, à ajouter dans ONLYOFFICE (onglet Plugins). Le dossier `dist/` n'est pas versionné : chacun fabrique son `.plugin` à partir du code.

Les scripts lancent d'abord les tests si Node.js est installé, et s'arrêtent si un test échoue. Sans Node.js, ils fabriquent le fichier sans tester (avec un avertissement) : un collègue qui installe le plugin n'a pas besoin de Node.js.

## Feuille de route (provisoire)

1. Corpus + test d'insertion (fait)
2. Fenêtre d'édition + palettes par thème (fait)
3. Zones à compléter, résolution pas à pas, réédition (fait)
4. Annotation PDF (v2, faisabilité à vérifier)

## Composants tiers

- [MathLive](https://github.com/arnog/mathlive) 0.111.0, licence MIT (`vendor/mathlive/LICENSE.txt`), embarqué pour fonctionner sans connexion internet. Les polices KaTeX qu'il contient sont sous licence SIL OFL / MIT.
- `plugins.js` et `plugins.css` (API de plugin d'ONLYOFFICE, licence AGPL-3.0) sont chargés depuis `onlyoffice.github.io`, pas embarqués : leur licence n'est pas compatible avec celle de ce dépôt. Conséquence : une connexion internet est nécessaire à l'ouverture du plugin ; sans elle, un message l'indique.
- Polices DM Sans / DM Serif Display chargées depuis Google Fonts ; hors ligne, repli sur les polices du système.

## Licences

- **Code** : [PolyForm Noncommercial 1.0.0](LICENSE). Usage non commercial uniquement.
- **Contenus pédagogiques** : [CC BY-NC-SA 4.0](LICENSE-CONTENT.md). Réutilisation et adaptation non commerciales, avec attribution et partage dans les mêmes conditions.
- **Logos et identités visuelles PLAI et JFB4PLAI** : tous droits réservés (voir `LICENSE-CONTENT.md`).

Auteur : Jean-François Beguin, Référent numérique, https://jfb4plai.com


## Guides

- [Installation (PDF)](docs/guide-installation.pdf) — [HTML](docs/guide-installation.html)
- [Mode d'emploi (PDF)](docs/mode-emploi.pdf) — [HTML](docs/mode-emploi.html)
- [Pas à pas pour débuter (PDF)](docs/mode-emploi-debutant.pdf) — [HTML](docs/mode-emploi-debutant.html)
