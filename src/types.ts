export interface Ingredient { qty: string; nom: string }

export interface Recipe {
  slug: string
  titre: string
  categorie: string
  temps: number
  difficulte: string
  portions: number
  tags: string[]
  ingredients: Ingredient[]
  steps: string[]
  notes: string
}

/** Entrée de index.json (liste de la page d'accueil) */
export type IndexEntry = Pick<Recipe, 'slug' | 'titre' | 'categorie' | 'temps' | 'difficulte' | 'portions' | 'tags'>

export interface ParseResult { ok: boolean; errors: string[]; recipe: Recipe; markdown: string }

export interface SaveItem { slug: string; markdown: string; recipe: Recipe }
