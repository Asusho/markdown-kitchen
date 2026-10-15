import { createRouter, createWebHistory } from 'vue-router'
import { state } from './store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('./views/Home.vue') },
    { path: '/recette/:slug', component: () => import('./views/Recipe.vue') },
    { path: '/admin', component: () => import('./views/Admin.vue'), meta: { label: 'Administration' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
router.afterEach((to) => { state.crumb = typeof to.meta.label === 'string' ? to.meta.label : '' })
export default router
