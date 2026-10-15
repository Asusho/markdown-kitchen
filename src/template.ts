// Modèle affiché dans la fenêtre « Nouvelle recette ».
import { CATEGORIES } from './categories'

// Les commentaires <!-- --> expliquent comment remplir ; ils sont retirés à l'enregistrement.
export const TEMPLATE: string = `---
titre: Nom de la recette
categorie: Desserts <!-- ${CATEGORIES.map((c) => c.nom).join(', ')}. Une catégorie = un groupe sur la page d'accueil -->
temps: 30 <!-- durée totale en minutes -->
difficulte: Facile <!-- Facile, Moyen ou Difficile -->
portions: 4 <!-- nombre de portions pour lesquelles les quantités sont écrites -->
tags: [dessert, fait maison] <!-- entre crochets, séparés par des virgules -->
---

## Ingrédients
<!-- Une ligne par ingrédient, au format :  - quantité | nom
     La quantité peut avoir une unité (250 g, 2 càs) ou rester vide.
     Elle est recalculée quand on change le nombre de portions. -->
- 200 g | farine
- 2 | œufs
- | sel

## Instructions
<!-- Une étape par ligne, numérotée : 1. 2. 3. -->
1. Première étape.
2. Deuxième étape.

## Notes
<!-- Optionnel : astuces, conservation, variantes. Supprime cette section si inutile. -->
`
