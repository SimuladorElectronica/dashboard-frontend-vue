import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  // Este dashboard corre en 5173; el simulador React está configurado en 5174.
  // Dejamos el puerto fijo para que Vite no lo cambie si el 5173 está ocupado
  // y los enlaces al simulador sigan siendo correctos. strictPort falla de
  // forma visible si el puerto no está disponible.
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
