import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// BASE_PATH est fourni par le workflow GitHub Actions (ex. /mon-depot/)
export default defineConfig({ plugins: [vue()], base: process.env.BASE_PATH || '/' })
