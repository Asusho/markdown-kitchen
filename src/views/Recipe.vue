<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getRecipe } from '../github'
import { parseRecipe, scaleQty, fmtTime } from '../markdown'
import { state, openEditor, toast, errMsg } from '../store'
import type { Recipe } from '../types'

const route = useRoute()
const slug = computed(() => String(route.params.slug))
const r = ref<Recipe | null>(null)
const raw = ref('')
const error = ref('')
const portions = ref(4)

async function load(): Promise<void> {
  error.value = ''
  try {
    const md = await getRecipe(slug.value)
    if (md === null) { r.value = null; error.value = "Cette recette n'existe pas (ou plus)."; return }
    raw.value = md
    const recipe = parseRecipe(md).recipe
    r.value = recipe
    portions.value = recipe.portions
    state.crumb = recipe.titre
    document.title = `${recipe.titre} · Mon carnet`
  } catch (e) { error.value = errMsg(e) }
}
watch(() => [slug.value, state.version], load, { immediate: true })

const factor = computed(() => portions.value / (r.value?.portions || 1))
async function copy(): Promise<void> { await navigator.clipboard.writeText(location.href); toast('Lien copié') }
</script>

<template>
  <p v-if="error" class="error">{{ error }} <RouterLink to="/" class="link">Retour à la liste</RouterLink></p>
  <p v-else-if="!r" class="muted">Chargement…</p>

  <article v-else class="page">
    <h1 class="page-title">{{ r.titre }}</h1>

    <dl class="props">
      <div class="prop"><dt>Catégorie</dt><dd><span class="pill">{{ r.categorie }}</span></dd></div>
      <div v-if="r.temps" class="prop"><dt>Temps</dt><dd>{{ fmtTime(r.temps) }}</dd></div>
      <div v-if="r.difficulte" class="prop"><dt>Difficulté</dt><dd><span class="pill">{{ r.difficulte }}</span></dd></div>
      <div class="prop">
        <dt>Portions</dt>
        <dd class="portions">
          <button @click="portions = Math.max(1, portions - 1)" aria-label="Moins de portions">−</button>
          <b>{{ portions }}</b>
          <button @click="portions++" aria-label="Plus de portions">+</button>
        </dd>
      </div>
      <div v-if="r.tags.length" class="prop">
        <dt>Tags</dt>
        <dd><span v-for="t in r.tags" :key="t" class="pill">{{ t }}</span></dd>
      </div>
    </dl>

    <h2 class="page-h2">Ingrédients</h2>
    <ul class="blist">
      <li v-for="(i, n) in r.ingredients" :key="n"><b v-if="i.qty">{{ scaleQty(i.qty, factor) }}</b> {{ i.nom }}</li>
    </ul>

    <h2 class="page-h2">Instructions</h2>
    <ol class="nlist">
      <li v-for="(s, n) in r.steps" :key="n">{{ s }}</li>
    </ol>

    <template v-if="r.notes">
      <h2 class="page-h2">Notes</h2>
      <div class="callout"><span aria-hidden="true">💡</span><p>{{ r.notes }}</p></div>
    </template>

    <div class="row foot">
      <button class="btn" @click="copy">Copier le lien</button>
      <button v-if="state.token" class="btn" @click="openEditor(slug, raw)">Modifier</button>
    </div>
  </article>
</template>
