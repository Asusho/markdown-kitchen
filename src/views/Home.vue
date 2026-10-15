<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getIndex } from '../github'
import { state, errMsg } from '../store'
import { fmtTime } from '../markdown'
import { categoryInfo, categoryRank } from '../categories'
import type { IndexEntry } from '../types'

const list = ref<IndexEntry[] | null>(null)
const error = ref('')
const q = ref('')
const active = ref('') // catégorie filtrée ('' = toutes)

async function load(): Promise<void> {
  try { list.value = await getIndex(); error.value = '' } catch (e) { error.value = errMsg(e) }
}
watch(() => state.version, load, { immediate: true })

const all = computed<IndexEntry[]>(() => list.value ?? [])
const catName = (r: IndexEntry): string => categoryInfo(r.categorie).nom

// Catégories présentes, dans l'ordre défini dans categories.ts
const cats = computed(() => {
  const count = new Map<string, number>()
  for (const r of all.value) count.set(catName(r), (count.get(catName(r)) ?? 0) + 1)
  return [...count.entries()]
    .map(([nom, n]) => ({ ...categoryInfo(nom), n }))
    .sort((a, b) => categoryRank(a.nom) - categoryRank(b.nom) || a.nom.localeCompare(b.nom, 'fr'))
})

const visible = computed<IndexEntry[]>(() => {
  const n = q.value.trim().toLowerCase()
  return all.value.filter((r) =>
    (!active.value || catName(r) === active.value) &&
    (!n || r.titre.toLowerCase().includes(n) || r.tags.some((t) => t.toLowerCase().includes(n))))
})

const groups = computed(() =>
  cats.value
    .map((c) => ({ ...c, items: visible.value.filter((r) => catName(r) === c.nom) }))
    .filter((g) => g.items.length))

const toggle = (nom: string): void => { active.value = active.value === nom ? '' : nom }
</script>

<template>
  <header class="hero">
    <h1 class="hero-title">Mes recettes</h1>
    <p v-if="list" class="hero-sub muted">
      {{ all.length }} recette{{ all.length > 1 ? 's' : '' }} dans {{ cats.length }} catégorie{{ cats.length > 1 ? 's' : '' }}
    </p>
    <div class="hero-tools">
      <input v-model="q" class="input search" type="search" placeholder="Rechercher un plat, un ingrédient, un tag…" aria-label="Rechercher" />
    </div>
    <div v-if="cats.length" class="chips">
      <button class="chip" :class="{ on: !active }" :aria-pressed="!active" @click="active = ''">
        Toutes <small>{{ all.length }}</small>
      </button>
      <button v-for="c in cats" :key="c.nom" class="chip" :class="{ on: active === c.nom }" :aria-pressed="active === c.nom"
              :style="{ '--h': c.hue }" @click="toggle(c.nom)">
        {{ c.emoji }} {{ c.nom }} <small>{{ c.n }}</small>
      </button>
    </div>
  </header>

  <p v-if="error" class="error">Impossible de charger les recettes : {{ error }}</p>
  <p v-else-if="!list" class="muted">Chargement…</p>
  <p v-else-if="!list.length" class="muted">Aucune recette pour l'instant.</p>
  <p v-else-if="!groups.length" class="muted">Aucune recette ne correspond à ta recherche.</p>

  <div class="index">
    <section v-for="g in groups" :key="g.nom" class="cat" :style="{ '--h': g.hue }">
      <h2 class="cat-title"><span aria-hidden="true">{{ g.emoji }}</span>{{ g.nom }}<small>{{ g.items.length }}</small></h2>
      <RouterLink v-for="r in g.items" :key="r.slug" :to="`/recette/${r.slug}`" class="entry">
        <span class="entry-title">{{ r.titre }}</span>
        <span class="entry-dots" aria-hidden="true"></span>
        <span class="entry-meta">{{ [fmtTime(r.temps), r.difficulte].filter(Boolean).join(' · ') }}</span>
      </RouterLink>
    </section>
  </div>
</template>
