<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getIndex, saveRecipes } from '../github'
import { parseRecipe } from '../markdown'
import { refresh, toast, errMsg } from '../store'
import type { ParseResult } from '../types'

interface Row { name: string; p: ParseResult; slug: string; overwrite: boolean }

const emit = defineEmits<{ close: [] }>()
const rows = ref<Row[]>([])
const existing = ref<Set<string>>(new Set())
const busy = ref(false)
const error = ref('')
onMounted(async () => { existing.value = new Set((await getIndex()).map((e) => e.slug)) })

async function add(files: FileList | null): Promise<void> {
  for (const f of Array.from(files ?? [])) {
    if (!/\.md$/i.test(f.name)) continue
    const p = parseRecipe(await f.text())
    rows.value.push({ name: f.name, p, slug: p.ok ? p.recipe.slug : '', overwrite: false })
  }
}
const status = (r: Row): 'error' | 'exists' | 'new' => (!r.p.ok ? 'error' : existing.value.has(r.slug) ? 'exists' : 'new')
const todo = computed(() => rows.value.filter((r) => status(r) === 'new' || (status(r) === 'exists' && r.overwrite)))

function onPick(e: Event): void {
  const el = e.target as HTMLInputElement
  void add(el.files)
  el.value = ''
}

async function run(): Promise<void> {
  busy.value = true; error.value = ''
  try {
    const bySlug = new Map(todo.value.map((r) => [r.slug, { slug: r.slug, markdown: r.p.markdown, recipe: r.p.recipe }]))
    await saveRecipes([...bySlug.values()], `Importe ${bySlug.size} recette(s)`)
    toast(`${bySlug.size} recette(s) importée(s)`); refresh(); emit('close')
  } catch (e) { error.value = errMsg(e) } finally { busy.value = false }
}
</script>

<template>
  <div class="overlay" @mousedown.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Importer des recettes">
      <div class="modal-head">
        <h2>Importer des recettes</h2>
        <button class="btn" @click="emit('close')" aria-label="Fermer">✕</button>
      </div>
      <label class="drop" @dragover.prevent @drop.prevent="add($event.dataTransfer?.files ?? null)">
        Glisse tes fichiers .md ici ou clique pour les choisir
        <input type="file" accept=".md,text/markdown" multiple hidden @change="onPick" />
      </label>
      <ul class="import-list">
        <li v-for="(r, n) in rows" :key="n">
          <span>{{ r.name }}</span>
          <span v-if="status(r) === 'new'" class="ok">✔ nouvelle</span>
          <label v-else-if="status(r) === 'exists'" class="warn">
            ⚠ existe déjà <input v-model="r.overwrite" type="checkbox" /> écraser
          </label>
          <span v-else class="error">✖ {{ r.p.errors[0] }}</span>
        </li>
      </ul>
      <div class="modal-foot">
        <p v-if="error" class="error">{{ error }}</p>
        <p v-else class="muted">{{ todo.length }} recette(s) seront importées en un seul commit.</p>
        <div class="row">
          <button class="btn" @click="emit('close')">Annuler</button>
          <button class="btn primary" :disabled="!todo.length || busy" @click="run">{{ busy ? 'Import…' : 'Importer' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
