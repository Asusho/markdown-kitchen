<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { state, openEditor } from './store'
import EditorModal from './components/EditorModal.vue'

const route = useRoute()
</script>

<template>
  <header class="bar">
    <nav class="crumbs">
      <RouterLink to="/">Mon carnet</RouterLink>
      <template v-if="state.crumb"><span>/</span><strong>{{ state.crumb }}</strong></template>
    </nav>
    <div v-if="state.token" class="row">
      <button class="btn primary" @click="openEditor()">Nouvelle recette</button>
      <RouterLink class="btn" to="/admin">Admin</RouterLink>
    </div>
  </header>
  <main :class="{ wide: route.path === '/' }"><RouterView /></main>
  <EditorModal v-if="state.editor" />
  <div v-if="state.toast" class="toast" role="status">{{ state.toast }}</div>
</template>
