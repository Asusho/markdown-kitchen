<script setup lang="ts">
import { ref, watch } from 'vue'
import { state, setToken, openEditor, refresh, toast, errMsg } from '../store'
import { getIndex, getRecipe, removeRecipe, verifyToken } from '../github'
import { fmtTime } from '../markdown'
import type { IndexEntry } from '../types'
import ImportModal from '../components/ImportModal.vue'

const input = ref('')
const error = ref('')
const busy = ref(false)
const list = ref<IndexEntry[]>([])
const showImport = ref(false)

async function login(): Promise<void> {
  busy.value = true; error.value = ''
  try { const t = input.value.trim(); await verifyToken(t); setToken(t); input.value = '' }
  catch (e) { error.value = errMsg(e) } finally { busy.value = false }
}
async function load(): Promise<void> {
  if (!state.token) return
  try { list.value = await getIndex() } catch (e) { error.value = errMsg(e) }
}
watch(() => [state.token, state.version], load, { immediate: true })

async function edit(r: IndexEntry): Promise<void> {
  try { openEditor(r.slug, (await getRecipe(r.slug)) ?? '') } catch (e) { error.value = errMsg(e) }
}
async function del(r: IndexEntry): Promise<void> {
  if (!confirm(`Supprimer « ${r.titre} » ? Elle restera récupérable dans l'historique Git.`)) return
  try { await removeRecipe(r.slug); toast('Recette supprimée'); refresh() } catch (e) { error.value = errMsg(e) }
}
</script>

<template>
  <form v-if="!state.token" class="login" @submit.prevent="login">
    <h1>Administration</h1>
    <p class="muted">Colle ton token GitHub (accès au dépôt de recettes). Il reste uniquement dans ce navigateur.</p>
    <input v-model="input" class="input" type="password" placeholder="github_pat_…" autocomplete="off" aria-label="Token GitHub" />
    <p v-if="error" class="error">{{ error }}</p>
    <button class="btn primary" :disabled="!input.trim() || busy">{{ busy ? 'Vérification…' : 'Se connecter' }}</button>
  </form>

  <template v-else>
    <div class="head">
      <h1>Administration</h1>
      <div class="row">
        <button class="btn" @click="showImport = true">Importer des fichiers .md</button>
        <button class="btn primary" @click="openEditor()">Nouvelle recette</button>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="!list.length" class="muted">Aucune recette : crée-en une ou importe des fichiers.</p>
    <div v-for="r in list" :key="r.slug" class="line admin-line">
      <RouterLink :to="`/recette/${r.slug}`">{{ r.titre }}</RouterLink>
      <span class="muted">{{ r.categorie }} · {{ fmtTime(r.temps) }}</span>
      <span class="row">
        <button class="btn" @click="edit(r)">Modifier</button>
        <button class="btn danger" @click="del(r)">Supprimer</button>
      </span>
    </div>
    <p class="foot"><button class="btn" @click="setToken('')">Se déconnecter</button></p>
    <ImportModal v-if="showImport" @close="showImport = false" />
  </template>
</template>
