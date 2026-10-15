import { DATA } from './config'
import { state, setToken, errMsg } from './store'
import type { IndexEntry, SaveItem } from './types'

const API = `https://api.github.com/repos/${DATA.owner}/${DATA.repo}`
const RAW = `https://raw.githubusercontent.com/${DATA.owner}/${DATA.repo}/${DATA.branch}`

// ---------- Lecture ----------
// Visiteur : raw.githubusercontent (cache contourné toutes les 30 s).
// Admin : API GitHub avec le token, donc toujours à jour.
async function getText(path: string): Promise<string | null> {
  const admin = !!state.token
  const url = admin ? `${API}/contents/${path}?ref=${DATA.branch}` : `${RAW}/${path}?t=${Math.floor(Date.now() / 30000)}`
  const headers: Record<string, string> = admin
    ? { Authorization: `Bearer ${state.token}`, Accept: 'application/vnd.github.raw+json' }
    : {}
  const r = await fetch(url, { cache: 'no-store', headers })
  if (r.status === 401 && admin) { setToken(''); return getText(path) } // token expiré : retour en mode visiteur
  if (r.status === 404) return null
  if (!r.ok) throw new Error(`GitHub a répondu ${r.status}`)
  return r.text()
}

export async function getIndex(): Promise<IndexEntry[]> {
  const t = await getText('index.json')
  return t ? (JSON.parse(t) as IndexEntry[]) : []
}
export const getRecipe = (slug: string): Promise<string | null> => getText(`recettes/${slug}.md`)

// ---------- Écriture (token requis) ----------
async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(API + path, {
    method: opts.method,
    cache: 'no-store', // GitHub autorise 60 s de cache : sans ça, on peut lire une branche périmée
    headers: { Authorization: `Bearer ${state.token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  if (!r.ok) {
    const e = (await r.json().catch(() => ({}))) as { message?: string }
    throw new Error(r.status === 401 ? 'Token invalide ou expiré : reconnecte-toi.' : e.message || `Erreur GitHub ${r.status}`)
  }
  return (await r.json()) as T
}

export async function verifyToken(token: string): Promise<void> {
  const r = await fetch(API, { headers: { Authorization: `Bearer ${token}` } })
  if (r.status === 401) throw new Error('Token invalide ou expiré.')
  if (r.status === 404) throw new Error('Dépôt introuvable : vérifie src/config.ts et les accès du token.')
  if (!r.ok) throw new Error(`Erreur GitHub ${r.status}`)
  const d = (await r.json()) as { permissions?: { push?: boolean } }
  if (d.permissions && d.permissions.push === false) throw new Error('Ce token ne peut pas écrire (Contents : Read and write).')
}

// Si la branche a avancé entre la lecture et l'écriture ("not a fast forward"),
// on relit tout (index compris) et on recommence, jusqu'à 3 essais.
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try { return await fn() } catch (e) {
      if (i >= 2 || !/fast forward/i.test(errMsg(e))) throw e
      await new Promise((ok) => setTimeout(ok, 800 * (i + 1)))
    }
  }
}

interface FileChange { path: string; content: string | null } // null = suppression

// Un seul commit pour tous les fichiers
async function commit(files: FileChange[], message: string): Promise<void> {
  const ref = await api<{ object: { sha: string } }>(`/git/ref/heads/${DATA.branch}`)
  const base = await api<{ tree: { sha: string } }>(`/git/commits/${ref.object.sha}`)
  const tree = await api<{ sha: string }>('/git/trees', {
    method: 'POST',
    body: {
      base_tree: base.tree.sha,
      tree: files.map((f) => ({
        path: f.path, mode: '100644', type: 'blob',
        ...(f.content === null ? { sha: null } : { content: f.content }),
      })),
    },
  })
  const c = await api<{ sha: string }>('/git/commits', {
    method: 'POST',
    body: { message, tree: tree.sha, parents: [ref.object.sha] },
  })
  await api(`/git/refs/heads/${DATA.branch}`, { method: 'PATCH', body: { sha: c.sha } })
}

const indexFile = (index: IndexEntry[]): FileChange => ({
  path: 'index.json',
  content: JSON.stringify([...index].sort((a, b) => a.titre.localeCompare(b.titre, 'fr')), null, 2) + '\n',
})

// Création, modification et import
export const saveRecipes = (items: SaveItem[], message: string): Promise<void> =>
  withRetry(() => doSave(items, message))

async function doSave(items: SaveItem[], message: string): Promise<void> {
  const index = await getIndex()
  const files: FileChange[] = items.map((it) => {
    const { titre, categorie, temps, difficulte, portions, tags } = it.recipe
    const entry: IndexEntry = { slug: it.slug, titre, categorie, temps, difficulte, portions, tags }
    const i = index.findIndex((e) => e.slug === it.slug)
    if (i < 0) index.push(entry)
    else index[i] = entry
    return { path: `recettes/${it.slug}.md`, content: it.markdown }
  })
  await commit([...files, indexFile(index)], message)
}

export const removeRecipe = (slug: string): Promise<void> => withRetry(() => doRemove(slug))

async function doRemove(slug: string): Promise<void> {
  const index = (await getIndex()).filter((e) => e.slug !== slug)
  await commit([{ path: `recettes/${slug}.md`, content: null }, indexFile(index)], `Supprime ${slug}`)
}
