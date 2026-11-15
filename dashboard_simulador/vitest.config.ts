import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// https://vitest.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/__tests__/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      // La cátedra busca el artefacto en la raíz del repo (coverage/coverage-summary.json)
      reportsDirectory: '../coverage',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/__tests__/**'],
    },
  },
})
