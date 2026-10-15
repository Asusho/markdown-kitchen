import type { Ingredient, ParseResult, Recipe } from './types'

export const stripComments = (md: string): string =>
  md.replace(/<!--[\s\S]*?-->/g, '').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim() + '\n'

export const slugify = (s: string): string =>
  s.toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export const fmtTime = (m: number): string =>
  !m ? '' : m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`

// "250 g" x 1.5 -> "375 g" ; gère 1,5 et 1/2 ; laisse "sel" ou "" inchangés
export function scaleQty(q: string, factor: number): string {
  const m = q.match(/^(\d+\/\d+|\d+(?:[.,]\d+)?)\s*(.*)$/)
  if (!m || factor === 1) return q
  const raw = m[1] as string
  const n = raw.includes('/')
    ? raw.split('/').map(Number).reduce((a, b) => a / b)
    : parseFloat(raw.replace(',', '.'))
  const v = String(Math.round(n * factor * 100) / 100).replace('.', ',')
  return m[2] ? `${v} ${m[2]}` : v
}

const norm = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()

const emptyRecipe = (): Recipe => ({
  slug: '', titre: '', categorie: '', temps: 0, difficulte: '', portions: 4,
  tags: [], ingredients: [], steps: [], notes: '',
})

// Analyse un fichier markdown de recette.
export function parseRecipe(raw: string): ParseResult {
  const md = stripComments(raw)
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) {
    return { ok: false, errors: ['En-tête manquant : le texte doit commencer par une ligne ---'], recipe: emptyRecipe(), markdown: md }
  }

  const meta: Record<string, string> = {}
  for (const line of (m[1] ?? '').split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[norm(line.slice(0, i))] = line.slice(i + 1).trim()
  }

  const sections: Record<string, string[]> = {}
  let cur: string | null = null
  for (const line of (m[2] ?? '').split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/)
    if (h) { cur = slugify(h[1] ?? ''); sections[cur] = []; continue }
    if (cur) sections[cur]!.push(line)
  }

  const ingredients: Ingredient[] = (sections['ingredients'] ?? [])
    .filter((l) => /^\s*[-*]\s/.test(l))
    .map((l) => {
      const [a = '', ...b] = l.replace(/^\s*[-*]\s*/, '').split('|')
      return b.length ? { qty: a.trim(), nom: b.join('|').trim() } : { qty: '', nom: a.trim() }
    })
  const steps = (sections['instructions'] ?? [])
    .map((l) => l.trim()).filter(Boolean)
    .map((l) => l.replace(/^\d+[.)]\s*/, ''))

  const recipe: Recipe = {
    ...emptyRecipe(),
    titre: meta['titre'] ?? '',
    categorie: meta['categorie'] ?? '',
    temps: parseInt(meta['temps'] ?? '') || 0,
    difficulte: meta['difficulte'] ?? '',
    portions: parseInt(meta['portions'] ?? '') || 4,
    tags: (meta['tags'] ?? '').replace(/^\[|]$/g, '').split(',').map((t) => t.trim()).filter(Boolean),
    ingredients,
    steps,
    notes: (sections['notes'] ?? []).join('\n').trim(),
  }
  recipe.slug = slugify(recipe.titre)

  const errors: string[] = []
  if (!recipe.titre) errors.push("Il manque « titre » dans l'en-tête.")
  else if (!recipe.slug) errors.push('Le titre doit contenir des lettres ou des chiffres.')
  if (!recipe.categorie) errors.push("Il manque « categorie » dans l'en-tête.")
  if (!ingredients.length) errors.push('Section « Ingrédients » vide : une ligne par ingrédient, sous la forme - quantité | nom')
  if (!steps.length) errors.push('Section « Instructions » vide : une étape numérotée par ligne.')
  return { ok: !errors.length, errors, recipe, markdown: md }
}
