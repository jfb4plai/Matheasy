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

## Licences

- **Code** : [PolyForm Noncommercial 1.0.0](LICENSE). Usage non commercial uniquement.
- **Contenus pédagogiques** : [CC BY-NC-SA 4.0](LICENSE-CONTENT.md). Réutilisation et adaptation non commerciales, avec attribution et partage dans les mêmes conditions.
- **Logo et identité visuelle PLAI** : tous droits réservés (voir `LICENSE-CONTENT.md`).

Auteur : Jean-François Beguin, Référent numérique, https://jfb4plai.com
