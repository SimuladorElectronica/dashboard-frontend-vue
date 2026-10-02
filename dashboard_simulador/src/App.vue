<!-- src/App.vue -->
<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import MainLayout from '@/layouts/MainLayout.vue';
  import AuthLayout from '@/layouts/AuthLayout.vue';

  const route = useRoute();

  // Mapeo de layouts disponibles
  const layouts = {
    MainLayout,
    AuthLayout
  };

  // Selecciona el layout según el atributo `meta.layout` de la ruta actual
  const layoutComponent = computed(() => {
    const name = route.meta.layout as keyof typeof layouts;
    return layouts[name] || MainLayout;
  });
</script>