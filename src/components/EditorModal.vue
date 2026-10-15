<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { state, closeEditor, refresh, toast, errMsg } from '../store'
import { parseRecipe } from '../markdown'
import { saveRecipes, getIndex } from '../github'
import { TEMPLATE } from '../template'

const existingSlug: string | null = state.editor?.slug ?? null
const text = ref(state.editor?.markdown || TEMPLATE)
const busy = ref(false)
const error = ref('')
const res = computed(() => parseRecipe(text.value))

async function save(): Promise<void> {
  const parsed = res.value
  if (!parsed.ok) return
  busy.value = true; error.value = ''
  try {
    const slug = existingSlug || parsed.recipe.slug
    if (!existingSlug && (await getIndex()).some((e) => e.slug === slug) &&
        !confirm('Une recette porte déjà ce nom. La remplacer ?')) return
    await saveRecipes([{ slug, markdown: parsed.markdown, recipe: parsed.recipe }],
      `${existingSlug ? 'Modifie' : 'Ajoute'} ${slug}`)
    toast('Recette enregistrée'); refresh(); closeEditor()
  } catch (e) { error.value = errMsg(e) } finally { busy.value = false }
}

const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') closeEditor() }
onMounted(() => addEventListener('keydown', onKey))
onUnmounted(() => removeEventListener('keydown', onKey))
</script>

<template>
  <div class="overlay" @mousedown.self="closeEditor">
    <div class="modal" role="dialog" aria-modal="true" aria-label="Éditeur de recette">
      <div class="modal-head">
        <h2>{{ existingSlug ? 'Modifier la recette' : 'Nouvelle recette' }}</h2>
        <button class="btn" @click="closeEditor" aria-label="Fermer">✕</button>
      </div>
      <textarea v-model="text" class="editor" spellcheck="false" aria-label="Recette au format Markdown"></textarea>
      <div class="modal-foot">
        <p v-if="error" class="error">{{ error }}</p>
        <p v-else-if="res.ok" class="ok">✔ Format valide</p>
        <p v-else class="error">{{ res.errors[0] }}</p>
        <div class="row">
          <button class="btn" @click="closeEditor">Annuler</button>
          <button class="btn primary" :disabled="!res.ok || busy" @click="save">{{ busy ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
