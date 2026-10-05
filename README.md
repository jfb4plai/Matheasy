# Matheasy

Plugin [ONLYOFFICE](https://www.onlyoffice.com/) gratuit pour écrire et annoter des notations mathématiques, pensé comme pendant libre de MathType pour les Desktop Editors. Cible : enseignants et élèves, avec priorité au secondaire supérieur (FWB).

Compagnon de [Colorisation PLAI](https://github.com/jfb4plai/colorisation-plai-onlyoffice) : même architecture (plugin JS, manifeste `config.json`, hébergement statique).

## Principe

Pas d'objet OLE : les formules sont des **équations natives** du document (insérées via `AddMathEquation`, formats `latex` / `mathml` / `unicode`). L'élève peut donc rouvrir, compléter et annoter les formules de l'enseignant sans le plugin.

## État

Phase 0 : **corpus de test**. `corpus/formules.json` liste des notations du secondaire supérieur ; le plugin les insère dans un document pour mesurer ce que l'équation native rend correctement. Rien n'est encore validé dans un ONLYOFFICE réel.

## Fabriquer le fichier .plugin

- Windows (PowerShell) : `.\tools\build-plugin.ps1`
- Linux/macOS : `./tools/build-plugin.sh`

Résultat : `dist/matheasy.plugin`, à ajouter dans ONLYOFFICE (onglet Plugins).

## Feuille de route (provisoire)

1. Corpus + test d'insertion (en cours)
2. Palettes par thème (analyse, algèbre, géométrie, probabilités)
3. Zones à compléter, résolution pas à pas, annotations en couleur
4. Annotation PDF (v2, faisabilité à vérifier)

## Licences

- **Code** : [PolyForm Noncommercial 1.0.0](LICENSE). Usage non commercial uniquement.
- **Contenus pédagogiques** : [CC BY-NC-SA 4.0](LICENSE-CONTENT.md). Réutilisation et adaptation non commerciales, avec attribution et partage dans les mêmes conditions.
- **Logo et identité visuelle PLAI** : tous droits réservés (voir `LICENSE-CONTENT.md`).

Auteur : Jean-François Beguin, Référent numérique, https://jfb4plai.com
