import { reactive } from 'vue'

const KEY = 'carnet_token'

interface EditorState { slug: string | null; markdown: string }
interface State {
  token: string              // token GitHub : présent = mode admin
  editor: EditorState | null // modale d'édition ouverte ou non
  version: number            // incrémenté après chaque modification pour recharger les vues
  crumb: string
  toast: string
}

export const state = reactive<State>({
  token: localStorage.getItem(KEY) || '',
  editor: null,
  version: 0,
  crumb: '',
  toast: '',
})

export function setToken(t: string): void {
  state.token = t
  if (t) localStorage.setItem(KEY, t)
  else localStorage.removeItem(KEY)
}
export const openEditor = (slug: string | null = null, markdown = ''): void => { state.editor = { slug, markdown } }
export const closeEditor = (): void => { state.editor = null }
export const refresh = (): void => { state.version++ }
export const errMsg = (e: unknown): string => (e instanceof Error ? e.message : String(e))

let timer: ReturnType<typeof setTimeout> | undefined
export function toast(msg: string): void {
  state.toast = msg
  clearTimeout(timer)
  timer = setTimeout(() => { state.toast = '' }, 3000)
}
