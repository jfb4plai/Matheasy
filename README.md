# Matheasy

Plugin [ONLYOFFICE](https://www.onlyoffice.com/) gratuit pour écrire et annoter des notations mathématiques, pensé comme pendant libre de MathType pour les Desktop Editors. Cible : enseignants et élèves, avec priorité au secondaire supérieur (FWB).

Compagnon de [Colorisation PLAI](https://github.com/jfb4plai/colorisation-plai-onlyoffice) : même architecture (plugin JS, manifeste `config.json`, hébergement statique).

## Principe

Pas d'objet OLE : les formules sont des **équations natives** du document (insérées via `AddMathEquation`, formats `latex` / `mathml` / `unicode`). L'élève peut donc rouvrir, compléter et annoter les formules de l'enseignant sans le plugin.

## État

- **Validé dans ONLYOFFICE Desktop** (corpus de test, v0.0.x) : équations natives via `AddMathEquation` (LaTeX), couleur et barré sur une partie d'équation via `ApiRange.SetColor` / `SetStrikeout`, accolade, matrices, systèmes, alignement, vecteur (`\vec`), encadré (MathML `menclose box`).
- **Non pris en charge par le moteur** (testé) : `\cancel`, `\boxed` (LaTeX), `\color`, `\textcolor`, `\overrightarrow`.
- **v0.1.0 (prototype, non testé)** : fenêtre d'édition avec champ [MathLive](https://github.com/arnog/mathlive) (MIT, chargé depuis jsDelivr), palettes par thème, insertion en équation native, boutons d'annotation (couleur, barré) sur la sélection. Les outils de test restent dans un volet « Outils de test ».
- **Réédition d'une équation existante (v0.2.0, non testé)** : bouton « Modifier la formule sélectionnée » ; `scripts/json2latex.js` convertit le JSON ONLYOFFICE en LaTeX (tests : `node tests/json2latex.test.js`, 18 cas reconstruits d'après les arbres observés). Limite connue : la lecture par sélection (`Range.ToJSON`) exporte le contenu des racines vide ; la lecture du paragraphe entier est correcte.
- **v0.5.0 (non testé dans ONLYOFFICE)** : champ de saisie multi-lignes. Entrée = nouvelle ligne (`\\displaylines` de MathLive), « + Commentaire » ajoute un texte à droite de la ligne, chaque ligne devient un paragraphe du document (`scripts/lines.js`, tests : `node tests/lines.test.js`). Interface vérifiée dans Chromium avec une fausse API ONLYOFFICE.
- **v0.5.1 (non testé dans ONLYOFFICE)** : une sélection de plusieurs paragraphes de formules (une résolution) se recharge en un seul champ multi-lignes, commentaires compris, et se remplace en place ; boutons +col / +lig / −col / −lig pour les matrices ; message « dont N avec commentaire » et LaTeX du champ dans les outils de test.
- **v0.5.2 (non testé dans ONLYOFFICE)** : « + Commentaire » sort des fractions et se place en fin de ligne ; +col / −col / +lig / −lig agissent à la fin du bloc (`scripts/matrix.js`, tests : `node tests/matrix.test.js`) ; option « alignés en colonne » (taquet de tabulation, essai).
- **v0.6.0 (non testé dans ONLYOFFICE)** : version de diffusion. Outils de test masqués (Ctrl+Maj+D, ou 5 clics sur le numéro de version, pour les afficher) ; couleur des lignes insérées (mode élève : bleu) ; boutons « trou » (□) et « encadré » (MathML `menclose box` généré par MathLive, vérifié dans Chromium) ; l'option de commentaires en colonne n'est plus dans l'écran principal (case d'essai dans les outils de test).
- **v0.6.1 (non testé dans ONLYOFFICE)** : le panneau latéral est l'entrée par défaut du plugin (la fenêtre reste en second) ; icône PLAI (`tools/generate_icons.py`) ; « trou » = symbole □ littéral (`\square`), « encadré » encadre la sélection ou, sans sélection, toute la ligne courante ; deux expériences dans les outils de test : fraction en pleine taille (`\displaystyle`) et alignement à gauche d'une équation centrée par son JSON.
- **Événements du document** : seuls `onDocumentContentReady` et `onTargetPositionChanged` sont reçus ; pas de `onClick` / `onDblClick` (donc pas d'ouverture au double-clic).

## Fabriquer le fichier .plugin

- Windows : double-clic sur `tools\build-plugin.bat` (ou en PowerShell : `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\build-plugin.ps1`)
- Linux/macOS : `./tools/build-plugin.sh`

Résultat : `dist/matheasy.plugin`, à ajouter dans ONLYOFFICE (onglet Plugins).

## Feuille de route (provisoire)

1. Corpus + test d'insertion (fait)
2. Fenêtre d'édition + palettes par thème (prototype v0.1.0)
3. Zones à compléter, résolution pas à pas, réédition
4. Annotation PDF (v2, faisabilité à vérifier)

## Composants tiers

- [MathLive](https://github.com/arnog/mathlive) 0.111.0, licence MIT (`vendor/mathlive/LICENSE.txt`), embarqué pour fonctionner sans connexion internet. Les polices KaTeX qu'il contient sont sous licence SIL OFL / MIT.
- Le plugin charge encore `plugins.js` depuis `onlyoffice.github.io` (API de plugin d'ONLYOFFICE) : à vérifier hors connexion.

## Licences

- **Code** : [PolyForm Noncommercial 1.0.0](LICENSE). Usage non commercial uniquement.
- **Contenus pédagogiques** : [CC BY-NC-SA 4.0](LICENSE-CONTENT.md). Réutilisation et adaptation non commerciales, avec attribution et partage dans les mêmes conditions.
- **Logo et identité visuelle PLAI** : tous droits réservés (voir `LICENSE-CONTENT.md`).

Auteur : Jean-François Beguin, Référent numérique, https://jfb4plai.com


## Guides

- [Installation (PDF)](docs/guide-installation.pdf) — [HTML](docs/guide-installation.html)
- [Mode d'emploi (PDF)](docs/mode-emploi.pdf) — [HTML](docs/mode-emploi.html)
- [Pas à pas pour débuter (PDF)](docs/mode-emploi-debutant.pdf) — [HTML](docs/mode-emploi-debutant.html)
