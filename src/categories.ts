// Catégories connues : l'ordre ci-dessous est l'ordre d'affichage sur la page d'accueil.
// La catégorie d'une recette reste un simple texte dans son en-tête : on peut en écrire une
// qui n'est pas dans cette liste, elle s'affichera simplement à la fin avec l'icône 🍴.
// Pour ajouter une catégorie, ajoute une ligne ici (hue = teinte de la couleur, de 0 à 360).
export interface Category { nom: string; emoji: string; hue: number }

export const CATEGORIES: Category[] = [
  { nom: 'Entrées', emoji: '🥗', hue: 150 },
  { nom: 'Plats', emoji: '🍲', hue: 8 },
  { nom: 'Accompagnements', emoji: '🥔', hue: 85 },
  { nom: 'Desserts', emoji: '🍰', hue: 335 },
  { nom: 'Goûters', emoji: '🍪', hue: 36 },
  { nom: 'Pains & viennoiseries', emoji: '🥖', hue: 52 },
  { nom: 'Bases & pâtes', emoji: '🥧', hue: 215 },
  { nom: 'Sauces & condiments', emoji: '🫙', hue: 175 },
  { nom: 'Boissons', emoji: '🍹', hue: 265 },
  { nom: 'Apéro', emoji: '🧀', hue: 300 },
]

const DEFAULT: Omit<Category, 'nom'> = { emoji: '🍴', hue: 255 }
const key = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

/** Retrouve une catégorie sans tenir compte des accents ni de la casse ("entrees" = "Entrées") */
export function categoryInfo(nom: string): Category {
  return CATEGORIES.find((c) => key(c.nom) === key(nom)) ?? { nom: nom.trim(), ...DEFAULT }
}
export function categoryRank(nom: string): number {
  const i = CATEGORIES.findIndex((c) => key(c.nom) === key(nom))
  return i < 0 ? CATEGORIES.length : i
}
