<script setup lang="ts">
/**
 * Envoltorio común de los íconos SVG de navegación.
 * Evita repetir los atributos del `<svg>` en cada enlace del menú y del topbar.
 */
withDefaults(defineProps<{ strokeWidth?: number }>(), { strokeWidth: 1.7 })
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <slot />
  </svg>
</template>
